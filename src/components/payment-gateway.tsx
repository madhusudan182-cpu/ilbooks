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
import { useToast } from '@/hooks/use-toast';
import { HandCoins, Smartphone, MessageSquare, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PaymentGatewayProps {
  amount: number;
  productName: string;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStep = 'number' | 'otp' | 'pin' | 'processing' | 'success';

export function PaymentGateway({ amount, productName, show, onClose, onSuccess }: PaymentGatewayProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset state when the dialog is shown
    if (show) {
      setStep('number');
      setPhoneNumber('');
      setOtp('');
      setPin('');
      setIsProcessing(false);
    }
  }, [show]);

  const handleNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 11 && /01[3-9]\d{8}/.test(phoneNumber)) {
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${phoneNumber}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Number",
        description: "Please enter a valid 11-digit mobile number.",
      });
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setStep('pin');
    } else {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP.",
      });
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      setIsProcessing(true);
      setStep('processing');
      setTimeout(() => {
        setIsProcessing(false);
        setStep('success');
      }, 2000); // Simulate network delay
    } else {
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "PIN must be at least 4 digits.",
      });
    }
  };
  
  const handleSuccess = () => {
    onSuccess();
    onClose();
  }

  const renderStep = () => {
    switch (step) {
      case 'number':
        return (
          <form onSubmit={handleNumberSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HandCoins className="w-6 h-6 text-primary" />
                Complete Your bKash Payment
              </DialogTitle>
              <DialogDescription>
                Paying BDT {amount.toFixed(2)} for "{productName}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="phone-number">bKash Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                  pattern="01[3-9]\d{8}"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Proceed
              </Button>
            </DialogFooter>
          </form>
        );
      case 'otp':
        return (
          <form onSubmit={handleOtpSubmit}>
            <DialogHeader>
              <DialogTitle>Enter OTP</DialogTitle>
              <DialogDescription>
                An OTP was sent to {phoneNumber}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
               <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-10"
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => setStep('number')}>Back</Button>
               <Button type="submit">Verify</Button>
            </DialogFooter>
          </form>
        );
      case 'pin':
        return (
           <form onSubmit={handlePinSubmit}>
            <DialogHeader>
              <DialogTitle>Enter PIN</DialogTitle>
              <DialogDescription>
                Enter your bKash PIN to confirm payment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="pin">Your PIN</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                  id="pin"
                  type="password"
                  placeholder="****"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => setStep('otp')}>Back</Button>
               <Button type="submit">Confirm Payment</Button>
            </DialogFooter>
          </form>
        );
        case 'processing':
            return (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Processing bKash payment...</p>
                    <Progress value={50} className="w-3/4" />
                </div>
            );
        case 'success':
            return (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <DialogTitle className="text-2xl">Payment Successful!</DialogTitle>
                    <DialogDescription className="mt-2">
                        Your bKash payment of BDT {amount.toFixed(2)} has been confirmed.
                    </DialogDescription>
                    <DialogFooter className="mt-6 w-full">
                        <Button className="w-full" onClick={handleSuccess}>Continue</Button>
                    </DialogFooter>
                </div>
            )
      default:
        return null;
    }
  };


  if (!show) {
    return null;
  }

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
