import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        // Extract custom fields from metadata
        const customerName = paymentIntent.metadata?.customer_name || null;
        const customerEmail = paymentIntent.metadata?.customer_email || null;
        const orderNote = paymentIntent.metadata?.order_note || null;
        const phoneNumber = paymentIntent.metadata?.phone_number || null;

        // Get payment method details if available
        let cardBrand: string | null = null;
        let cardLast4: string | null = null;
        let paymentMethodType: string | null = null;

        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === "string") {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(
              paymentIntent.payment_method
            );
            if (paymentMethod.type === "card" && paymentMethod.card) {
              cardBrand = paymentMethod.card.brand || null;
              cardLast4 = paymentMethod.card.last4 || null;
              paymentMethodType = paymentMethod.type;
            }
          } catch (pmError) {
            console.error("Error retrieving payment method:", pmError);
          }
        }

        // Prepare metadata object
        const metadata = {
          stripe_metadata: paymentIntent.metadata,
          payment_method_id: paymentIntent.payment_method,
          receipt_email: paymentIntent.receipt_email,
        };

        // Save payment to database
        const payment = await prisma.payment.create({
          data: {
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: paymentIntent.customer as string | null,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency || "usd",
            status: paymentIntent.status,
            customerName,
            customerEmail,
            orderNote,
            phoneNumber,
            paymentMethodType,
            cardBrand,
            cardLast4,
            metadata: metadata,
          },
        });

        console.log("Payment saved to database:", {
          id: payment.id,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          amount: payment.amount,
          customerEmail: payment.customerEmail,
          orderNote: payment.orderNote,
          phoneNumber: payment.phoneNumber,
          cardBrand: payment.cardBrand,
        });

      } catch (dbError) {
        console.error("Error saving payment to database:", dbError);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      
      try {
        await prisma.payment.create({
          data: {
            stripePaymentIntentId: failedPayment.id,
            stripeCustomerId: failedPayment.customer as string | null,
            amount: failedPayment.amount,
            currency: failedPayment.currency || "usd",
            status: "failed",
            customerName: failedPayment.metadata?.customer_name || null,
            customerEmail: failedPayment.metadata?.customer_email || null,
            orderNote: failedPayment.metadata?.order_note || null,
            phoneNumber: failedPayment.metadata?.phone_number || null,
            metadata: {
              error: failedPayment.last_payment_error,
              stripe_metadata: failedPayment.metadata,
            },
          },
        });

        console.log("Failed payment saved to database:", {
          stripePaymentIntentId: failedPayment.id,
        });
      } catch (dbError) {
        console.error(" Error saving failed payment:", dbError);
      }
      break;

    default:
      console.log("Unhandled event type:", event.type);
  }
  return NextResponse.json({ received: true });
}
