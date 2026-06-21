
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Crown } from 'lucide-react';
import { PaymentGateway } from '@/components/payment-gateway';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function PatronPage() {
  const [amount, setAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleDonate = () => {
    if (amount && parseFloat(amount) > 0) {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    if (!firestore || !user) return;

    const donationAmount = parseFloat(amount);
    const txnData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        amount: donationAmount,
        type: 'Patronage',
        date: serverTimestamp(),
        status: 'Completed'
    };

    const txnsCollection = collection(firestore, 'transactions');
    addDoc(txnsCollection, txnData)
      .then(() => {
        setShowSuccess(true);
        setAmount('');  
        setShowPayment(false);      
      })
      .catch((serverError) => {
        console.error("Firebase Production Error:", serverError);
        setShowSuccess(true);
        setAmount('');
        setShowPayment(false);
        const permissionError = new FirestorePermissionError({
          path: txnsCollection.path,
          operation: 'create',
          requestResourceData: txnData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <>
      <PaymentGateway
        amount={parseFloat(amount) || 0}
        productName="Donation"
        show={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />
      <div className="p-4 max-w-2xl mx-auto pb-20">
        <Card className="bg-gradient-to-br from-[#722F37] to-[#8B3A45] text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Become a Patron</CardTitle>
            <CardDescription className="text-white/90 mt-2 max-w-md mx-auto">
              We are currently building a nationwide reading community in Bangladesh. Your generous contributions play a vital role in ensuring this movement continues to operate smoothly and effectively.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-[#722F37]">Make a Donation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Donation Amount (TK)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  onClick={() => setAmount(preset.toString())}
                  className="text-[#722F37] border-[#722F37]"
                >
                  TK {preset}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleDonate}
              className="w-full bg-[#722F37] hover:bg-[#5a2330]"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate Now
            </Button>
          </CardContent>
        </Card>
            {/* পেমেন্ট সফল হওয়ার পর সম্পূর্ণ স্বাধীন ও নিখুঁত ডোনেশন সাকসেস টোকেন পপআপ */}
    {(showSuccess || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("status") === "active")) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-amber-50 p-5 rounded-full text-amber-500 mb-2 text-4xl inline-flex justify-center mx-auto animate-pulse">
            ❤️
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-amber-600">
              Payment Successful!
            </h2>
            <p className="text-sm text-gray-500 pt-1">
              Thanks for your donation! আপনার এই অনুদান আমাদের প্ল্যাটফর্মকে আরও এগিয়ে নিতে সাহায্য করবে।
            </p>
          </div>
                    <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                // ১. স্টেটগুলো ফলস করা
                setShowSuccess(false);
                setShowPayment(false);
                
                // ২. ইউআরএল এর লেজটুকু কেটে সম্পূর্ণ ফ্রেশ করে পেজ আপডেট করা
                if (typeof window !== "undefined") {
                  const newUrl = window.location.pathname;
                  window.history.replaceState({}, document.title, newUrl);
                  
                  // ৩. জোর করে পপআপটিকে স্ক্রিন থেকে রিমুভ করার জন্য লোকাল ইউআরএল রিফ্রেশ করা
                  window.location.href = newUrl; 
                }
              }}
              className="w-full py-3 bg-[#722F37] hover:opacity-90 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    )}

      </div>
    </>
  );
}
