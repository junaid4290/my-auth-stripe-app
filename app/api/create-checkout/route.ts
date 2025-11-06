import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

interface CreateCheckoutRequest {
  name: string;
  amount: string;
  customerEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json();

    if (!body.name || !body.amount) {
      return NextResponse.json(
        { error: "Name and amount are required" },
        { status: 400 }
      );
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(amount * 100);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Payment for ${body.name}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: body.customerEmail,
      metadata: {
        customer_name: body.name,
        amount: body.amount,
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      
      // 🧾 Add Stripe-hosted custom fields
      custom_fields: [
        {
          key: "order_note",
          label: { type: "custom", custom: "Order Note" },
          type: "text",
          optional: true,
        },
        {
          key: "phone_number",
          label: { type: "custom", custom: "Phone Number" },
          type: "numeric",
        },
      ],
    });
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

