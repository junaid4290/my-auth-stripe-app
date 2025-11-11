"use client";

import { useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// Card Brand Icon Component
function CardBrandIcon({ brand }: { brand: string }) {
  const getCardIcon = () => {
    switch (brand.toLowerCase()) {
      case "visa":
        return (
          <div className="w-12 h-8 bg-[#1434CB] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">VISA</span>
          </div>
        );
      case "mastercard":
        return (
          <div className="w-12 h-8 bg-black rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute left-0 w-6 h-8 bg-[#EB001B] rounded-l"></div>
            <div className="absolute right-0 w-6 h-8 bg-[#F79E1B] rounded-r"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-[#FF5F00] rounded-full"></div>
            </div>
          </div>
        );
      case "amex":
      case "american_express":
        return (
          <div className="w-12 h-8 bg-[#006FCF] rounded flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">AMEX</span>
          </div>
        );
      case "discover":
        return (
          <div className="w-12 h-8 bg-[#FF6000] rounded flex items-center justify-center">
            <span className="text-white font-bold text-[9px]">DISCOVER</span>
          </div>
        );
      case "jcb":
        return (
          <div className="w-12 h-8 bg-[#0E4C96] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">JCB</span>
          </div>
        );
      case "unionpay":
        return (
          <div className="w-12 h-8 bg-[#E21836] rounded flex items-center justify-center">
            <span className="text-white font-bold text-[9px]">UNION</span>
          </div>
        );
      default:
        return (
          <div className="w-12 h-8 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="14" rx="2" fill="#9CA3AF"/>
              <path d="M6 5H14M6 9H12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center transition-opacity duration-200">
      {getCardIcon()}
    </div>
  );
}

interface PaymentFormProps {
  name: string;
  amount: string;
  customerEmail?: string;
  orderNote?: string;
  phoneNumber?: string;
  clientSecret: string;
  paymentIntentId: string;
}

function PaymentForm({
  name,
  amount,
  customerEmail,
  orderNote,
  phoneNumber,
  clientSecret,
  paymentIntentId,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");

  // Individual field validation states
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
  const [cardCvcError, setCardCvcError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  const handleCardNumberChange = (event: any) => {
    setCardNumberComplete(event.complete);
    setCardNumberError(event.error ? event.error.message : null);
    if (event.brand && event.brand !== "unknown") {
      setCardBrand(event.brand);
    } else if (event.empty || !event.value) {
      setCardBrand(null);
    }
  };

  const handleCardExpiryChange = (event: any) => {
    setCardExpiryComplete(event.complete);
    setCardExpiryError(event.error ? event.error.message : null);
  };

  const handleCardCvcChange = (event: any) => {
    setCardCvcComplete(event.complete);
    setCardCvcError(event.error ? event.error.message : null);
  };

  const isFormValid = cardNumberComplete && cardExpiryComplete && cardCvcComplete && cardholderName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      setError("Cardholder name is required");
      return;
    }

    if (!isFormValid) {
      setError("Please complete all card fields");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      setError("Card elements not found");
      setIsProcessing(false);
      return;
    }

    try {
      // First, validate all card elements together
      // This ensures card number, expiry, and CVV are all valid
      const { error: elementsError } = await elements.submit();
      
      if (elementsError) {
        setError(elementsError.message || "Please check your card information");
        setIsProcessing(false);
        return;
      }

      // Create payment method with card number element
      // Stripe automatically uses the expiry and CVV elements from the same Elements instance
      // Stripe's servers will verify that card number, expiry, and CVV all match together
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: cardholderName,
          email: customerEmail || undefined,
        },
      });

      if (pmError) {
        // Stripe validates that card number matches expiry and CVV
        // If they don't match, this error will be returned
        if (pmError.type === "card_error") {
          if (pmError.code === "incorrect_number") {
            setCardNumberError(pmError.message || "Card number is incorrect");
          } else if (pmError.code === "incorrect_cvc") {
            setCardCvcError(pmError.message || "CVV is incorrect");
          } else if (pmError.code === "expired_card") {
            setCardExpiryError(pmError.message || "Card has expired");
          } else if (pmError.code === "invalid_expiry_month" || pmError.code === "invalid_expiry_year") {
            setCardExpiryError(pmError.message || "Invalid expiry date");
          } else {
            setError(pmError.message || "Card information is invalid");
          }
        } else {
          setError(pmError.message || "Failed to create payment method");
        }
        setIsProcessing(false);
        return;
      }

      if (!paymentMethod) {
        setError("Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      // Confirm payment with payment method
      // Stripe performs final verification that all card details match
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        // Handle payment confirmation errors
        if (confirmError.type === "card_error") {
          if (confirmError.code === "card_declined") {
            setError("Your card was declined. Please try a different card.");
          } else if (confirmError.code === "incorrect_cvc") {
            setCardCvcError("CVV is incorrect");
          } else if (confirmError.code === "expired_card") {
            setCardExpiryError("Card has expired");
          } else if (confirmError.code === "incorrect_number") {
            setCardNumberError("Card number is incorrect");
          } else {
            setError(confirmError.message || "Payment failed");
          }
        } else {
          setError(confirmError.message || "Payment failed");
        }
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - all card details were verified and matched
        router.push(`/payment/success?payment_intent=${paymentIntentId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  // Shared styling for all card elements
  const cardElementStyle = {
    base: {
      fontSize: "16px",
      color: "#171717",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": {
        color: "#a1a1aa",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer:
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
        </div>
        {customerEmail && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email:
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {customerEmail}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Amount:
          </span>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            ${parseFloat(amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label
          htmlFor="cardholder-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Cardholder Name *
        </label>
        <input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Name on card"
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 text-black"
          required
        />
      </div>

      {/* Card Number - Separate Field */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Card Number *
        </label>
        <div className="relative">
          <div className={`px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 ${cardBrand ? 'pr-14' : ''}`}>
            <CardNumberElement
              options={{
                style: cardElementStyle,
              }}
              onChange={handleCardNumberChange}
            />
          </div>
          {cardBrand && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <CardBrandIcon brand={cardBrand} />
            </div>
          )}
        </div>
        {cardNumberError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cardNumberError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Expiry Date *
          </label>
          <div className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800">
            <CardExpiryElement
              options={{
                style: cardElementStyle,
              }}
              onChange={handleCardExpiryChange}
            />
          </div>
          {cardExpiryError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cardExpiryError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            CVV *
          </label>
          <div className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800">
            <CardCvcElement
              options={{
                style: cardElementStyle,
              }}
              onChange={handleCardCvcChange}
            />
          </div>
          {cardCvcError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cardCvcError}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing || !isFormValid}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        {isProcessing ? "Processing Payment..." : `Pay $${parseFloat(amount).toFixed(2)}`}
      </button>
    </form>
  );
}

interface CustomPaymentFormProps {
  name: string;
  amount: string;
  customerEmail?: string;
  orderNote?: string;
  phoneNumber?: string;
  clientSecret: string;
  paymentIntentId: string;
}

export default function CustomPaymentForm({
  name,
  amount,
  customerEmail,
  orderNote,
  phoneNumber,
  clientSecret,
  paymentIntentId,
}: CustomPaymentFormProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb",
        colorBackground: "#ffffff",
        colorText: "#171717",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentForm
        name={name}
        amount={amount}
        customerEmail={customerEmail}
        orderNote={orderNote}
        phoneNumber={phoneNumber}
        clientSecret={clientSecret}
        paymentIntentId={paymentIntentId}
      />
    </Elements>
  );
}
