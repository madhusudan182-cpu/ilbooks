import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 shadow-md rounded-md my-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 border-b pb-2">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: June 2026</p>
      
      <p className="mb-6">Welcome to <strong>ILBooks</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application.</p>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">1. Information We Collect</h2>
        <p className="mb-2">We may collect personal information that you provide directly to us, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Name and Email Address (during account creation or profile setup).</li>
          <li>Transaction details and billing information (processed securely through EPS Payment Gateway).</li>
          <li>Usage data, including your interactions with books, rule checks, and complaints.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide, maintain, and improve the ILBooks platform.</li>
          <li>To securely process payments through our payment gateway partner.</li>
          <li>To send you important notifications regarding your account, purchases, or platform updates.</li>
          <li>To prevent fraudulent activities and ensure platform compliance.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">3. Data Security and Retention</h2>
        <p>We implement strict industry-standard security measures to protect your personal data from unauthorized access, alteration, or disclosure. Your financial or card data is never stored on our servers; it is encrypted and securely handled by EPS compliance standards.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">4. Third-Party Disclosures</h2>
        <p>We do not sell, trade, or share your personal information with third parties, except as necessary to process your payment transactions via EPS or when required by law enforcement.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">5. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy, please reach out to us at: <span className="text-blue-500 font-medium">https://ilbooks.vercel.app/dashboard/complain</span></p>
      </section>
    </div>
  );
}
