"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);

    if (!name || !amount) {
      setError("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          amount,
          customerEmail: customerEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md mx-auto px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-black dark:text-zinc-50">
            Payment Form
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 text-black"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 text-black"
              />
            </div>

            <div>
              <label 
                htmlFor="amount" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Amount ($) *
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 text-black"
                required
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? "Redirecting to Checkout..." : "Proceed to Payment"}
            </button>

            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              You will be redirected to Stripe Checkout to complete your payment
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
