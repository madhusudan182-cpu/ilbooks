'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { ShoppingCart, CreditCard, Plus, Minus, Trash2, Download, Loader2, Youtube } from 'lucide-react';

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

    // // ১. কার্ট এবং পেমেন্ট শো করার সিম্পল স্টেট (পেজ রিফ্রেশ করলে অটোমেটিক খালি হয়ে যাবে)
    const [cart, setCart] = useState<CartItem[]>(() => {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('book_shop_cart');
        return savedCart ? JSON.parse(savedCart) : [];
      }
      return [];
    });
    const [showPayment, setShowPayment] = useState(false);
    const { toast } = useToast();


  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [activeCategory, setActiveCategory] = useState<'level' | 'vocab' | 'popular'>('level');

  useEffect(() => {
    localStorage.setItem('book_shop_cart', JSON.stringify(cart));
  }, [cart]);

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
        localStorage.removeItem('book_shop_cart');
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
                    <Card key={book.id} className="overflow-hidden flex flex-col justify-between border bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
                      {/* ওপরের অংশ: ইমেজ এবং টেক্সট কন্টেন্ট */}
                      <div>
                        <div className="relative aspect-[3/4] w-full bg-slate-50 border-b">
                          <Image
                            src={book.coverUrl}
                            alt={book.title}
                            fill
                            className="object-cover"
                            data-ai-hint="book cover"
                          />
                        </div>
                        <div className="p-3 space-y-1">
                          <h3 className="font-semibold text-slate-800 text-xs line-clamp-2 min-h-[2rem] leading-tight">
                            {book.title}
                          </h3>
                          {/* পরিবর্তনের ১ নম্বর পয়েন্ট: লেখক না থাকলে কিছুই দেখাবে না */}
                          {book.author && book.author.trim() !== "" && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {book.author}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* নিচের অংশ: অ্যাকশন বাটনসমূহ */}
                      <div className="p-3 pt-0 mt-auto w-full">
                        {book.pdfUrl ? (
                          /* পরিবর্তনের ২ নম্বর পয়েন্ট: YouTube URL এর ওপর ভিত্তি করে ফ্লেক্স লেআউট পরিবর্তন */
                          <div className={`flex w-full gap-1.5 ${book.youtubeUrl ? "flex-col" : "flex-row items-center"}`}>
                            <div className="flex justify-between items-center w-full gap-1.5 flex-1">
                              <Button size="sm" asChild className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700">
                                <Link href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  Read
                                </Link>
                              </Button>
                              <Button size="icon" variant="secondary" asChild className="h-8 w-8 shrink-0 border">
                                <Link href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                            
                            {/* পরিবর্তনের ৩ নম্বর পয়েন্ট: কাস্টম SVG ইউটিউব ট্রায়াঙ্গেল লোগো ও টেক্সট */}
                            {book.youtubeUrl && (
                              <a
                                href={book.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full h-8 text-[11px] font-medium text-white bg-[#FF0000] hover:bg-[#E60000] transition-colors rounded-md shadow-sm"
                                title="Watch on YouTube"
                              >
                                {/* অফিশিয়াল ইউটিউব আইকন (লাল ব্যাকগ্রাউন্ডের ওপর সাদা ট্রায়াঙ্গেল) */}
                                <svg className="h-3 w-4 shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://w3.org">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                                <span>YouTube</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          /* পেইড বইয়ের লেআউট (এখানেও ২ ও ৩ নম্বর পয়েন্ট যুক্ত করা হয়েছে) */
                          <div className={`flex w-full gap-1.5 ${book.youtubeUrl ? "flex-col" : "flex-row items-center justify-between"}`}>
                            <div className="flex justify-between items-center gap-2 flex-1">
                              <p className="font-bold text-sm text-primary truncate">Tk {book.price}</p>
                              <Button size="sm" onClick={() => handleAddToCart(book)} className="h-8 w-8 p-0 shrink-0">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </div>
                            {book.youtubeUrl && (
                              <a
                                href={book.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full h-8 text-[11px] font-medium text-white bg-[#FF0000] hover:bg-[#E60000] transition-colors rounded-md shadow-sm"
                                title="Watch on YouTube"
                              >
                                <svg className="h-3 w-4 shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://w3.org">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                                <span>YouTube</span>
                              </a>
                            )}
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
                      {/* 🎯 সিঙ্গেল টোটাল লাইন */}
                      <div className="flex justify-between font-bold text-lg mb-4 text-slate-800">
                        <span>Total</span>
                        <span>Tk {total}</span>
                      </div>

                      {/* 🎯 মোবাইল স্ক্রিন ফ্রেন্ডলি রেসপন্সিভ বাটন লেআউট */}
                      <div className="flex flex-row items-center justify-between gap-2.5 mt-5 w-full">
                        
                        {/* ১. ছোট Cancel বাটন (১ ভাগ জায়গা নেবে) */}
                        <Button 
                          type="button"
                          onClick={() => {
                            setCart([]); 
                            toast({
                              title: "Cart Cleared",
                              description: "Your order has been canceled successfully.",
                            });
                          }}
                          variant="outline" 
                          style={{ fontFamily: 'Times New Roman' }}
                          className="flex-[1] min-w-0 border-red-400 text-red-500 hover:bg-red-50 font-medium text-xs sm:text-sm h-10 px-2 rounded-xl transition-all truncate text-center"
                        >
                          Cancel
                        </Button>

                        {/* ২. বড় Proceed to Payment বাটন (২ ভাগ জায়গা নেবে) */}
                        <Button
                          type="button"
                          onClick={() => setShowPayment(true)}
                          style={{ fontFamily: 'Times New Roman' }}
                          className="flex-[2] min-w-0 bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs sm:text-sm h-10 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 truncate"
                        >
                          <CreditCard className="h-3.5 w-3.5 shrink-0 inline-block" />
                          <span className="truncate">Proceed to Payment</span>
                        </Button>

                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 text-sm">
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