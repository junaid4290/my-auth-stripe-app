"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentIntentId] = useState<string | null>(
    searchParams.get("payment_intent")
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md mx-auto px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-black dark:text-zinc-50">
            Payment Successful!
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Your payment has been processed successfully. Thank you for your purchase!
          </p>

          {paymentIntentId && (
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Payment Intent ID:
              </p>
              <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {paymentIntentId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Make Another Payment
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
