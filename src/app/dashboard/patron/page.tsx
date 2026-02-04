"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Crown, Star, ArrowLeft } from 'lucide-react';

export default function PatronPage() {
  const [amount, setAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'rocket' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'gateway' | 'number' | 'pin' | 'success'>('gateway');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDonate = () => {
    if (amount && parseFloat(amount) > 0) {
      setShowPayment(true);
      setPaymentStep('gateway');
    }
  };

  const handleGatewaySelect = (gateway: 'bkash' | 'rocket') => {
    setSelectedGateway(gateway);
    setPaymentStep('number');
  };

  const handleNumberSubmit = () => {
    if (phoneNumber.length === 11) {
      setPaymentStep('pin');
    }
  };

  const handlePinSubmit = () => {
    const pinLength = selectedGateway === 'bkash' ? 5 : 4;
    if (pin.length === pinLength) {
      // Simulate payment processing
      setTimeout(() => {
        setPaymentStep('success');
        setTimeout(() => {
          setShowPayment(false);
          setShowSuccess(true);
          setPaymentStep('gateway');
          setSelectedGateway(null);
          setPhoneNumber('');
          setPin('');
          setAmount('');
        }, 2000);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (paymentStep === 'pin') {
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
        iconBg: 'bg-gradient-to-r from-pink-500 to-purple-600'
      };
    } else if (selectedGateway === 'rocket') {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-red-600',
        hover: 'hover:from-orange-600 hover:to-red-700',
        text: 'text-white',
        border: 'border-orange-500',
        iconBg: 'bg-gradient-to-r from-orange-500 to-red-600'
      };
    }
    return {
      bg: 'bg-gray-100',
      hover: '',
      text: 'text-gray-700',
      border: 'border-gray-300',
      iconBg: 'bg-gray-400'
    };
  };

  const gatewayColors = getGatewayColors();

  if (showPayment) {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-20">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            {paymentStep === 'gateway' && (
              <>
                <Heart className="w-16 h-16 mx-auto mb-4 text-[#722F37]" />
                <CardTitle className="text-[#722F37]">Choose Payment Method</CardTitle>
                <p className="text-sm text-gray-600">Donation Amount: TK {amount}</p>
              </>
            )}
            {(paymentStep === 'number' || paymentStep === 'pin' || paymentStep === 'success') && (
              <>
                <div className={`w-16 h-16 ${gatewayColors.iconBg} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">
                    {selectedGateway === 'bkash' ? 'bKash' : 'Rocket'}
                  </span>
                </div>
                <CardTitle className="text-[#722F37]">Pay with {selectedGateway === 'bkash' ? 'bKash' : 'Rocket'}</CardTitle>
                <p className="text-sm text-gray-600">Donation Amount: TK {amount}</p>
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowPayment(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            )}

            {paymentStep === 'number' && (
              <>
                <div>
                  <Label htmlFor="phone-number">{selectedGateway === 'bkash' ? 'bKash' : 'Rocket'} Account Number</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="mt-1"
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your 11-digit {selectedGateway === 'bkash' ? 'bKash' : 'Rocket'} number</p>
                </div>
                <Button 
                  onClick={handleNumberSubmit}
                  className={`w-full ${gatewayColors.bg} ${gatewayColors.hover}`}
                  disabled={phoneNumber.length !== 11}
                >
                  Next
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </>
            )}

            {paymentStep === 'pin' && (
              <>
                <div>
                  <Label htmlFor="pin">{selectedGateway === 'bkash' ? 'bKash' : 'Rocket'} PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={selectedGateway === 'bkash' ? "Enter 5-digit PIN" : "Enter 4-digit PIN"}
                    className="mt-1"
                    maxLength={selectedGateway === 'bkash' ? 5 : 4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your {selectedGateway === 'bkash' ? 'bKash' : 'Rocket'} PIN</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-yellow-800">Payment Details:</p>
                  <p className="text-sm text-gray-700">Amount: TK {amount}</p>
                  <p className="text-sm text-gray-700">To: ILBooks Donation</p>
                  <p className="text-sm text-gray-700">Method: {selectedGateway === 'bkash' ? 'bKash' : 'Rocket'}</p>
                </div>
                <Button 
                  onClick={handlePinSubmit}
                  className={`w-full ${gatewayColors.bg} ${gatewayColors.hover}`}
                  disabled={pin.length !== (selectedGateway === 'bkash' ? 5 : 4)}
                >
                  Pay TK {amount}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full"
                >
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
                <h3 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Thank you for your generous donation of TK {amount}</p>
                <p className="text-sm text-gray-500 mt-2">Your support helps us grow the reading community.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <Card className="bg-gradient-to-br from-[#722F37] to-[#8B3A45] text-white">
        <CardHeader className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
          <CardTitle className="text-2xl">Become a Patron</CardTitle>
        </CardHeader>
      </Card>

      {/* Candle and Quote Section */}
      <div className="text-center">
        <div className="relative inline-block">
          {/* Candle Flame */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            {/* Candle Body */}
            <div className="w-4 h-12 bg-gradient-to-b from-yellow-100 to-yellow-200 mx-auto rounded-t-sm"></div>
            {/* Candle Base */}
            <div className="w-6 h-2 bg-yellow-300 mx-auto rounded-sm"></div>
          </div>
        </div>
        <p className="mt-4 text-lg font-serif text-[#722F37] italic">"Let there be light."</p>
      </div>

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

      {/* Payment Options Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-[#722F37] text-lg">Payment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold text-xs">bKash</span>
              </div>
              <p className="text-sm font-semibold">bKash</p>
              <p className="text-xs text-gray-500">Fast & Secure</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold text-xs">Rocket</span>
              </div>
              <p className="text-sm font-semibold">Rocket</p>
              <p className="text-xs text-gray-500">DBBL Mobile Banking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
