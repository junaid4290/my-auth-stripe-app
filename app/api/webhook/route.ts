import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {

  console.log('***********************************************************')
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Payment successful - Checkout session completed:", {
        id: session.id,
        amount_total: session.amount_total,
        customer_email: session.customer_email,
        customer_name: session.metadata?.customer_name,
        custom_fields: session.custom_fields,
      });
      
      break;

    case "checkout.session.async_payment_succeeded":
      const asyncSession = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Async payment succeeded:", {
        id: asyncSession.id,
        amount_total: asyncSession.amount_total,
      });
      break;

    case "checkout.session.async_payment_failed":
      const failedSession = event.data.object as Stripe.Checkout.Session;
      console.log("Async payment failed:", {
        id: failedSession.id,
        amount_total: failedSession.amount_total,
      });
      break;

    default:
         console.log("Unhandled event:", event);
  }
  return NextResponse.json({ received: true });
}
