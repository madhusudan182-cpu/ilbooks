'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { mockBooks, mockUsers } from '@/lib/data';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { PaymentGateway } from '@/components/payment-gateway';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function BookShopPage() {
  const [orderedBooks, setOrderedBooks] = useState<Book[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const firestore = useFirestore();

  // In a real app, this would be the authenticated user.
  // For demonstration, we'll use a user at level 0.0 to show available books.
  const currentUser = { ...mockUsers[1], level: 0.0 };
  const userLevel = currentUser.level.toFixed(1);

  // Filter books to show only those relevant to the user's level.
  const booksForLevel = mockBooks.filter((book) => book.level === userLevel);

  const total = orderedBooks.reduce((sum, book) => sum + book.price, 0);

  const handleBuy = (book: Book) => {
    if (!orderedBooks.find((b) => b.id === book.id)) {
      setOrderedBooks([...orderedBooks, book]);
      toast({
        title: `${book.title} added to your order.`,
        duration: 2000,
      });
    } else {
      toast({
        title: `${book.title} is already in your order.`,
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = () => {
    setShowAddressDialog(true);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
      toast({
        title: 'Error',
        description: 'Database not available.',
        variant: 'destructive',
      });
      return;
    }

    const newOrder = {
      userId: currentUser.id,
      customerName: name,
      deliveryAddress: address,
      mobileNumber: mobile,
      books: orderedBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        price: b.price,
        coverUrl: b.coverUrl,
        level: b.level
      })),
      totalAmount: total,
      orderDate: serverTimestamp(),
      status: 'Paid' as const,
    };
    
    const ordersCollection = collection(firestore, 'orders');

    addDoc(ordersCollection, newOrder)
      .then(() => {
        setShowAddressDialog(false);
        toast({
          title: 'Thanks for your information!',
          description: 'Your order has been placed.',
          duration: 2000,
        });

        // Clear the cart and form fields after submission
        setOrderedBooks([]);
        setName('');
        setAddress('');
        setMobile('');
      })
      .catch(async (serverError) => {
        console.error('Error placing order:', serverError);
        const permissionError = new FirestorePermissionError({
          path: ordersCollection.path,
          operation: 'create',
          requestResourceData: newOrder,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            title: "Uh oh! Something went wrong.",
            description: "Could not place your order. Please try again.",
            variant: "destructive",
        });
      });
  };

  return (
    <>
      <PaymentGateway
        amount={total}
        productName="Book Order"
        show={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delivery Information</DialogTitle>
            <DialogDescription>
              Please provide your name, address, and mobile number for delivery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="col-span-3"
                  placeholder="Bazar, Thana, District"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="col-span-3"
                  placeholder="Your mobile number"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="p-2 md:p-4">
        <h1 className="text-4xl font-bold font-headline mb-2 text-center">Book Shop</h1>
        <p className="text-lg font-bold text-primary text-center mb-4">
            You're in Level: {userLevel}
        </p>
        <div className="flex justify-center gap-2 mb-6">
          <Button>Books for your Level</Button>
          <Button variant="outline">Vocabulary & Grammar</Button>
          <Button variant="outline">Popular</Button>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
                {booksForLevel.length > 0 ? (
                  booksForLevel.map((book) => (
                    <Card key={book.id} className="overflow-hidden flex flex-col">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                          data-ai-hint="book cover"
                        />
                      </div>
                      <div className="p-2 flex flex-col flex-grow">
                        <h3 className="font-semibold font-headline text-xs flex-grow">{book.title}</h3>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="font-bold text-sm text-primary">Tk {book.price}</p>
                          <Button size="sm" onClick={() => handleBuy(book)}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Buy
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-10">
                    <p>
                      There are no books specifically recommended for your current level ({userLevel})
                      yet.
                    </p>
                    <p>Check back soon!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart /> Your Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderedBooks.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {orderedBooks.map((book) => (
                        <div key={book.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{book.title}</p>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                          </div>
                          <p className="font-medium">Tk {book.price}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>Tk {total}</span>
                    </div>
                    <Button
                      className="w-full mt-6 font-headline"
                      size="lg"
                      onClick={() => setShowPayment(true)}
                      disabled={orderedBooks.length === 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Your cart is empty. Add books to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
