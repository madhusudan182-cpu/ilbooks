'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Plus, Minus, Trash2, Download, Loader2 } from 'lucide-react';
import { PaymentGateway } from '@/components/payment-gateway';
import { useToast } from '@/hooks/use-toast';
import type { Book, User } from '@/lib/types';
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
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type CartItem = Book & { quantity: number };
const DELIVERY_CHARGE = 60;

export default function BookShopPage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<User>(userRef);

  const [cart, setCart] = useState<CartItem[]>(() => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('book_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  }
  return [];
});

const [showPayment, setShowPayment] = useState(false);
const { toast } = useToast();

// 💡 ঠিক এই জায়গায় কোডটি পেস্ট করুন
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('book_cart', JSON.stringify(cart));
  }
}, [cart]);


  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [activeCategory, setActiveCategory] = useState<'level' | 'vocab' | 'popular'>('level');

    // 💡 পেমেন্ট সফল হওয়ার পর স্বয়ংক্রিয়ভাবে কাস্টমারের টিকিট/অ্যাড্রেস ডায়ালগ বক্স ওপেন করার ম্যাজিক কোড
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = searchParams.get('payment') === 'success';
      
      if (isPaymentSuccess) {
        // ১. আপনার কোডের অ্যাড্রেস/টিকিট ডায়ালগ বক্সের স্টেটটি এখানে True করে দেওয়া হলো
        if (typeof setShowAddressDialog === 'function') {
          setShowAddressDialog(true);
        }
        
        // ২. ইউআরএল থেকে সুন্দরভাবে ?payment=success লেখাটি মুছে দেওয়া যেন পেজ রিফ্রেশ করলে বারবার টিকিট না আসে
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        toast({
          title: "Payment Successful!",
          description: "Please fill up your delivery ticket details below.",
        });
      }
    }
  }, [toast]);

  const booksQuery = useMemo(() => (firestore ? collection(firestore, 'books') : null), [firestore]);
  const { data: books, loading: booksLoading } = useCollection<Book>(booksQuery);

  const userLevel = profile?.level ? Number(profile.level).toFixed(1) : "0.0";


  const displayedBooks = useMemo(() => {
    if (!books) return [];
    switch (activeCategory) {
      case 'level':
        return books.filter((book) => !book.category && book.level === userLevel);
      case 'vocab':
        return books.filter((book) => book.category === 'vocab_grammar');
      case 'popular':
        return books.filter((book) => book.category === 'popular');
      default:
        return [];
    }
  }, [books, activeCategory, userLevel]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.length > 0 ? subtotal + DELIVERY_CHARGE : 0;

  const handleAddToCart = (book: Book) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === book.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...book, quantity: 1 }];
      }
    });
    toast({
      title: `${book.title} added to your order.`,
      duration: 2000,
    });
  };

  const handleUpdateQuantity = (bookId: string, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== bookId);
      }
      return prevCart.map((item) =>
        item.id === bookId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const [isFormSubmitted, setIsFormSubmitted] = useState(false);


  const handlePaymentSuccess = () => {
    setShowAddressDialog(true);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'Database or user not available.',
        variant: 'destructive',
      });
      return;
    }

    const newOrder = {
      userId: user.uid,
      customerName: name,
      deliveryAddress: address,
      mobileNumber: mobile,
      books: cart.map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: total,
      orderDate: serverTimestamp(),
      status: 'Paid' as const,
    };
    
    const ordersCollection = collection(firestore, 'orders');

    addDoc(ordersCollection, newOrder)
      .then(() => {
        // ১. আগের ঝামেলার নাম, ঠিকানার ডায়ালগ বক্সটি সাথে সাথে সম্পূর্ণ বন্ধ করে দেওয়া
        setShowAddressDialog(false); 
        
        // ২. ডাটা সেভ নিশ্চিত হওয়ার পর সাকসেস টোকেন স্ক্রিনটি একদম ফ্রেশভাবে ওপেন করা
        setIsFormSubmitted(true); 
        
        toast({
          title: 'Thanks for your information!',
          description: 'Your order has been placed.',
          duration: 2000,
        });
        
        setCart([]); // শপিং কার্ট খালি করা
      })


      .catch(async (serverError) => {
        console.error('Error placing order:', serverError);
        const permissionError = new FirestorePermissionError({
          path: ordersCollection.path,
          operation: 'create',
          requestResourceData: newOrder,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (authLoading || profileLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
          <Button 
            onClick={() => setActiveCategory('level')}
            className={cn("h-16 w-32 whitespace-normal text-center leading-tight", activeCategory !== 'level' && "opacity-70")}
          >
            Books for your Level
          </Button>
          <Button 
            onClick={() => setActiveCategory('vocab')}
            className={cn("h-16 w-32 whitespace-normal text-center leading-tight", activeCategory !== 'vocab' && "opacity-70")}
          >
            Vocabulary & Grammar
          </Button>
          <Button 
            onClick={() => setActiveCategory('popular')}
            className={cn("h-16 w-32 whitespace-normal text-center leading-tight", activeCategory !== 'popular' && "opacity-70")}
          >
            Popular
          </Button>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
                {booksLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[2/3] w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))
                ) : displayedBooks.length > 0 ? (
                  displayedBooks.map((book) => (
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
                        {book.pdfUrl ? (
                            <div className="flex justify-between items-center mt-2 w-full gap-2">
                                <Button size="sm" asChild className="flex-1">
                                    <Link href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                                        Read
                                    </Link>
                                </Button>
                                <Button size="icon" variant="secondary" asChild>
                                    <Link href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center mt-2 w-full">
                                <p className="font-bold text-sm text-primary">Tk {book.price}</p>
                                <Button size="sm" onClick={() => handleAddToCart(book)}>
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-10">
                    <p>
                      There are no books in this category for Level {userLevel} yet.
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
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-4 text-center">{item.quantity}</span>
                              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                               <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleUpdateQuantity(item.id, 0)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="font-medium">Tk {item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Sub-Total</span>
                        <span>Tk {subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span>Tk {DELIVERY_CHARGE}</span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>Tk {total}</span>
                    </div>
                    <Button
                      className="w-full mt-6 font-headline"
                      size="lg"
                      onClick={() => setShowPayment(true)}
                      disabled={cart.length === 0}
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
              {/* পেমেন্ট সফল হওয়ার পর এক্সাম পেজের মতো সাকসেস টোকেন ও থ্যাঙ্ক ইউ মেসেজ স্ক্রিন (Step 5) */}
      {isFormSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-green-50 p-5 rounded-full text-green-500 mb-2 text-4xl inline-flex justify-center mx-auto">
              🎉
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-emerald-600">
                Your Payment is Successful!
              </h2>
              <p className="text-sm text-gray-500 pt-1">
                আপনার ডেলিভারি তথ্যটি সফলভাবে সংরক্ষিত হয়েছে। আমাদের বক্সে তথ্য জমা দেওয়ার জন্য আপনাকে অসংখ্য ধন্যবাদ!
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormSubmitted(false);     // সাকসেস টোকেন উইন্ডো বন্ধ হবে
                  setShowAddressDialog(false);   // মেইন ফর্ম ডায়ালগ বক্স বন্ধ নিশ্চিত করা
                  setName('');                   // ইনপুট ফিল্ডগুলো ফ্রেশ করা
                  setAddress('');
                  setMobile('');
                }}
                className="w-full py-3 bg-[#722F37] hover:opacity-95 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Close & Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
}