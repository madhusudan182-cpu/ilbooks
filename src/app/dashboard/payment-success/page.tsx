"use client";
import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("orderID");
  const level = searchParams.get("level");

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl border border-border/50 animate-fade-in-up">
        {/* Success Icon with Glow Effect */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <svg
            xmlns="http://w3.org"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-10 w-10 animate-bounce"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-2xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your payment. Your account has been updated instantly.
        </p>

        {/* Dynamic Details Box */}
        <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left border border-border/30 text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Gateway:</span>
            <span className="font-medium text-foreground">EPS_Sandbox</span>
          </div>
          {orderId && (
            <div className="flex justify-between py-1.5 border-t border-border/30">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-medium text-foreground">{orderId}</span>
            </div>
          )}
          {level && (
            <div className="flex justify-between py-1.5 border-t border-border/30">
              <span className="text-muted-foreground">Unlocked Level:</span>
              <span className="font-medium text-primary">{level}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
