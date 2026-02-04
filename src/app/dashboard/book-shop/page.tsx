"use client";

import { useState } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockBooks } from "@/lib/data";
import { ShoppingCart, CreditCard } from "lucide-react";
import { PaymentGateway } from '@/components/payment-gateway';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@/lib/types';


export default function BookShopPage() {
    const [orderedBooks, setOrderedBooks] = useState<Book[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const { toast } = useToast();

    const total = orderedBooks.reduce((sum, book) => sum + book.price, 0);

    const handleBuy = (book: Book) => {
        if (!orderedBooks.find(b => b.id === book.id)) {
            setOrderedBooks([...orderedBooks, book]);
            toast({
                title: `${book.title} added to your order.`,
            });
        } else {
             toast({
                title: `${book.title} is already in your order.`,
                variant: 'destructive',
            });
        }
    };

    const handlePaymentSuccess = () => {
        // Clear the cart after successful payment
        setOrderedBooks([]);
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
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-4xl font-bold font-headline mb-6">Book Shop</h1>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Books for Your Level:</CardTitle>
                                <CardDescription>Handpicked books to help you prepare for the next level.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mockBooks.map(book => (
                                    <Card key={book.id} className="overflow-hidden flex flex-col">
                                        <div className="relative aspect-[2/3] w-full">
                                            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" data-ai-hint="book cover" />
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-semibold font-headline flex-grow">{book.title}</h3>
                                            <p className="text-sm text-muted-foreground">{book.author}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <p className="font-bold text-lg text-primary">Tk {book.price}</p>
                                                <Button size="sm" onClick={() => handleBuy(book)}>
                                                    <ShoppingCart className="mr-2 h-4 w-4"/> Buy
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShoppingCart/> Your Order</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {orderedBooks.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {orderedBooks.map(book => (
                                                <div key={book.id} className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{book.title}</p>
                                                        <p className="text-sm text-muted-foreground">{book.author}</p>
                                                    </div>
                                                    <p className="font-medium">Tk {book.price}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-4"/>
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>Tk {total}</span>
                                        </div>
                                        <Button className="w-full mt-6 font-headline" size="lg" onClick={() => setShowPayment(true)}>
                                            <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">Your cart is empty. Add books to get started!</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
