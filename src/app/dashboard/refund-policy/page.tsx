import React from 'react';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 shadow-md rounded-md my-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 border-b pb-2">Return & Refund Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: June 2026</p>
      
      <p className="mb-6">Thank you for choosing <strong>ILBooks</strong>. We want to ensure you have an excellent experience while using our platform. Because our products are digital books, services, or subscriptions, please review our policy regarding returns and refunds carefully.</p>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">1. Nature of Digital Products</h2>
        <p>All items sold on ILBooks (including digital books, subscriptions, and access passes) are downloadable or viewed directly via the web browser. Since digital goods are accessible instantly upon successful payment, they cannot be physically "returned."</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">2. Eligibility for Refunds</h2>
        <p className="mb-2">Refund requests are only considered under the following limited conditions:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Double Charge:</strong> If your account was charged twice for the same transaction due to a technical glitch during the EPS gateway processing.</li>
          <li><strong>Unsuccessful Delivery:</strong> If payment was successful but the system failed to unlock or grant access to the book or subscription within 24 hours.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">3. Non-Refundable Scenarios</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Change of mind after gaining access to or reading a portion of the digital book.</li>
          <li>Accidental purchases if the digital contents have already been streamed or opened.</li>
          <li>Issues arising from poor user internet connectivity that prevents reading files.</li>
        </ul>
      </section>

      <section className="mb-6">
  <h2 className="text-xl font-semibold mb-3 text-gray-700">4. How to Request a Refund</h2>
  <p>
    If your scenario falls under the eligible conditions, please submit a request within 7 days of purchase by contacting our support team at{' '}
    <Link 
      href="/dashboard/complain" 
      className="text-blue-500 font-medium hover:underline break-all"
    >
      https://vercel.app
    </Link>{' '}
    with your transaction details. Verified valid refunds will be credited back via the original payment channel (EPS Gateway) within 7–10 working days.
  </p>
</section>
    </div>
  );
}
