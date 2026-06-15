"use client";
import React from "react";
import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl border border-border/50 animate-fade-in-up">
        {/* Failed Icon with Glow Effect */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <svg
            xmlns="http://w3.org"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-10 w-10"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-2xl font-bold text-foreground">Payment Failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong with the transaction. Don't worry, if any money was deducted, it will be refunded.
        </p>

        {/* Support Alert Box */}
        <div className="mt-6 rounded-xl bg-destructive/5 p-4 text-left border border-destructive/10 text-sm text-center">
          <p className="text-muted-foreground">
            Need help? Contact our support or try paying again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard/competition"
            className="inline-block w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98]"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="inline-block w-full rounded-xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/80"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
