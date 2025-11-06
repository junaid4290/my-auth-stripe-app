"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md mx-auto px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <svg
                className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-black dark:text-zinc-50">
            Payment Cancelled
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Try Again
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Go Back
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              If you have any questions or need assistance, please contact support.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

