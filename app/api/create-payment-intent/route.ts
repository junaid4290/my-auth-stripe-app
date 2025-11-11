import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

interface CreatePaymentIntentRequest {
  name: string;
  amount: string;
  customerEmail?: string;
  orderNote?: string;
  phoneNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentIntentRequest = await request.json();

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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_name: body.name,
        amount: body.amount,
        customer_email: body.customerEmail || "",
        order_note: body.orderNote || "",
        phone_number: body.phoneNumber || "",
      },
    });

    console.log("Payment Intent Created:", {
      id: paymentIntent.id,
      amount: amountInCents,
      customer_name: body.name,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment Intent creation error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

