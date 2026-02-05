'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentGatewayProps {
  amount: number;
  productName: string;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentGateway({ amount, productName, show, onClose, onSuccess }: PaymentGatewayProps) {
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'rocket' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'gateway' | 'number' | 'pin' | 'otp' | 'success'>('gateway');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const { toast } = useToast();

  const resetState = () => {
    setSelectedGateway(null);
    setPaymentStep('gateway');
    setPhoneNumber('');
    setPin('');
    setOtp('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleGatewaySelect = (gateway: 'bkash' | 'rocket') => {
    setSelectedGateway(gateway);
    setPaymentStep('number');
  };

  const handleNumberSubmit = () => {
    const requiredLength = selectedGateway === 'rocket' ? 12 : 11;
    if (phoneNumber.length === requiredLength) {
      setPaymentStep('pin');
    }
  };

  const handlePinSubmit = () => {
    const pinLength = selectedGateway === 'bkash' ? 5 : 4;
    if (pin.length === pinLength) {
      setPaymentStep('otp');
    }
  };

  const handleOtpSubmit = () => {
    if (otp.length === 6) {
      setPaymentStep('success');
      setTimeout(() => {
        toast({
          title: 'Payment Successful!',
          description: `Your payment of TK ${amount} for ${productName} was successful.`,
          duration: 3000,
        });
        onSuccess();
        handleClose();
      }, 1500);
    }
  };

  const handleBack = () => {
    if (paymentStep === 'otp') {
        setPaymentStep('pin');
        setOtp('');
    } else if (paymentStep === 'pin') {
      setPaymentStep('number');
      setPin('');
    } else if (paymentStep === 'number') {
      setPaymentStep('gateway');
      setPhoneNumber('');
    }
  };

  const getGatewayColors = () => {
    if (selectedGateway === 'bkash') {
      return {
        bg: 'bg-gradient-to-r from-pink-500 to-purple-600',
        hover: 'hover:from-pink-600 hover:to-purple-700',
        text: 'text-white',
        border: 'border-pink-500',
        iconBg: 'bg-gradient-to-r from-pink-500 to-purple-600',
      };
    } else if (selectedGateway === 'rocket') {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-red-600',
        hover: 'hover:from-orange-600 hover:to-red-700',
        text: 'text-white',
        border: 'border-orange-500',
        iconBg: 'bg-gradient-to-r from-orange-500 to-red-600',
      };
    }
    return {
      bg: 'bg-gray-100',
      hover: '',
      text: 'text-gray-700',
      border: 'border-gray-300',
      iconBg: 'bg-gray-400',
    };
  };

  const gatewayColors = getGatewayColors();

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="text-center">
          {paymentStep === 'gateway' && (
            <>
              <CardTitle className="text-primary">Choose Payment Method</CardTitle>
              <p className="text-sm text-muted-foreground">
                {productName}: TK {amount}
              </p>
            </>
          )}
          {(paymentStep === 'number' || paymentStep === 'pin' || paymentStep === 'otp' || paymentStep === 'success') && selectedGateway && (
            <>
              <div className={`w-16 h-16 ${gatewayColors.iconBg} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                <span className="text-white font-bold text-xl capitalize">{selectedGateway}</span>
              </div>
              <CardTitle className="text-primary">Pay with {selectedGateway}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {productName}: TK {amount}
              </p>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStep === 'gateway' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleGatewaySelect('bkash')}
                  className="h-24 flex-col bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <div className="w-12 h-12 bg-white rounded-full mb-2 flex items-center justify-center">
                    <span className="text-pink-500 font-bold text-sm">bKash</span>
                  </div>
                  <span className="text-white">bKash</span>
                </Button>
                <Button
                  onClick={() => handleGatewaySelect('rocket')}
                  className="h-24 flex-col bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  <div className="w-12 h-12 bg-white rounded-full mb-2 flex items-center justify-center">
                    <span className="text-orange-500 font-bold text-sm">Rocket</span>
                  </div>
                  <span className="text-white">Rocket</span>
                </Button>
              </div>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </>
          )}

          {paymentStep === 'number' && selectedGateway && (
            <>
              <div>
                <Label htmlFor="phone-number" className="capitalize">
                  {selectedGateway} Account Number
                </Label>
                <Input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={selectedGateway === 'rocket' ? 'Enter 12-digit number' : 'Enter 11-digit number'}
                  className="mt-1"
                  maxLength={selectedGateway === 'rocket' ? 12 : 11}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your {selectedGateway === 'rocket' ? 12 : 11}-digit {selectedGateway} number
                </p>
              </div>
              <Button
                onClick={handleNumberSubmit}
                className={`w-full ${gatewayColors.bg} ${gatewayColors.hover}`}
                disabled={phoneNumber.length !== (selectedGateway === 'rocket' ? 12 : 11)}
              >
                Next
              </Button>
              <Button variant="outline" onClick={handleBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </>
          )}

          {paymentStep === 'pin' && selectedGateway && (
            <>
              <div>
                <Label htmlFor="pin" className="capitalize">
                  {selectedGateway} PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={selectedGateway === 'bkash' ? 'Enter 5-digit PIN' : 'Enter 4-digit PIN'}
                  className="mt-1"
                  maxLength={selectedGateway === 'bkash' ? 5 : 4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your {selectedGateway === 'bkash' ? 5 : 4}-digit {selectedGateway} PIN
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-yellow-800">Payment Details:</p>
                <p className="text-muted-foreground">Amount: TK {amount}</p>
                <p className="text-muted-foreground">To: ILBooks {productName}</p>
                <p className="text-muted-foreground capitalize">Method: {selectedGateway}</p>
              </div>
              <Button
                onClick={handlePinSubmit}
                className={`w-full ${gatewayColors.bg} ${gatewayColors.hover}`}
                disabled={pin.length !== (selectedGateway === 'bkash' ? 5 : 4)}
              >
                Next
              </Button>
              <Button variant="outline" onClick={handleBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </>
          )}

          {paymentStep === 'otp' && selectedGateway && (
            <>
              <div>
                <Label htmlFor="otp">
                  One-Time Password (OTP)
                </Label>
                <Input
                  id="otp"
                  type="tel"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  An OTP has been sent to your mobile number.
                </p>
              </div>
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-yellow-800">Confirm Payment:</p>
                <p className="text-muted-foreground">Amount: TK {amount}</p>
                <p className="text-muted-foreground">To: ILBooks {productName}</p>
              </div>
              <Button
                onClick={handleOtpSubmit}
                className={`w-full ${gatewayColors.bg} ${gatewayColors.hover}`}
                disabled={otp.length !== 6}
              >
                Pay TK {amount}
              </Button>
              <Button variant="outline" onClick={handleBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Processing Payment...</h3>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
