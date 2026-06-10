
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
        setTimeout(() => {
            setShowSuccess(false);
        }, 5000);
      })
      .catch((serverError) => {
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

            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold">Thank you for your donation!</p>
                <p className="text-green-600 text-sm">Your support helps us grow the reading community.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-[#722F37] text-lg">Payment Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 border rounded-lg max-w-sm mx-auto w-full">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">bKash</span>
                </div>
                <p className="text-sm font-semibold">bKash</p>
                <p className="text-xs text-gray-500">Fast & Secure Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
