"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handlePay = () => {
    if (!name || !amount) {
      alert("Please fill in all fields");
      return;
    }
    alert(`Payment for ${name} - Amount: $${amount}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md mx-auto px-6 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-black dark:text-zinc-50">
            Payment Form
          </h1>
          
          <div className="space-y-6">
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 text-black"
              />
            </div>

            <div>
              <label 
                htmlFor="amount" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Amount
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
              />
            </div>

            <button
              onClick={handlePay}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Pay
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
