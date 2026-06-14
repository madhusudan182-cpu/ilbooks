'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandCoins, Smartphone, Loader2 } from 'lucide-react';

interface PaymentGatewayProps {
  amount: number;
  productName: string;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentGateway({ amount, productName, show, onClose, onSuccess }: PaymentGatewayProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setPhoneNumber('');
      setLoading(false);
    }
  }, [show]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 11) {
      alert("দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
      return;
    }

    setLoading(true);

    // 💡 ম্যাজিক ফলব্যাক লজিক: যদি productName ফাকা থাকে বা সংখ্যা না থাকে, 
    // তবে স্ক্রিনের টেক্সট বা সেশন স্টোরেজ থেকে রিয়েল-টাইম লেভেলটি খুঁজে বের করবে।
    let targetLevel = productName || "0.0";
    
    // স্ক্রিনে "Your Current Level: 0.1" লেখা থাকলে সেখান থেকে 0.1 বের করার চেষ্টা করবে
    if (typeof window !== 'undefined') {
      const pageText = document.body.innerText || "";
      const levelMatch = pageText.match(/Current Level:\s*(\d+\.\d+)/i) || pageText.match(/Level\s*(\d+\.\d+)/i);
      if (levelMatch && levelMatch[1]) {
        targetLevel = levelMatch[1];
      }
    }

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          orderId: "ILB-EXAM-" + Date.now(),
          level: targetLevel // নিশ্চিতভাবে সঠিক লেভেল সংখ্যাটি ব্যাকএন্ডে যাবে
        })
      });

      const payData = await response.json();

      if (payData && payData.success && payData.url) {
        window.location.href = payData.url;
      } else {
        alert(payData.message || 'EPS পেমেন্ট গেটওয়ে লোড করা সম্ভব হয়নি।');
        setLoading(false);
      }

    } catch (error) {
      console.error("Frontend Fetch Error:", error);
      alert('পেমেন্ট প্রসেস শুরু করতে সমস্যা হয়েছে।');
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            <p className="text-muted-foreground font-medium">EPS পেমেন্ট গেটওয়ে কানেক্ট হচ্ছে...</p>
          </div>
        ) : (
          <form onSubmit={handlePaymentSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <HandCoins className="w-6 h-6" />
                EPS নিরাপদ পেমেন্ট
              </DialogTitle>
              <DialogDescription>
                পেমেন্ট সম্পন্ন করতে নিচে আপনার সচল মোবাইল নম্বরটি দিন।
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="phone-number">আপনার মোবাইল নম্বর</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  maxLength={11}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                বাতিল করুন
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                পেমেন্ট করুন
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
