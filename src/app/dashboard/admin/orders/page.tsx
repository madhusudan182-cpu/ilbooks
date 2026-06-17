'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, User as UserIcon } from 'lucide-react';
import type { Order, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { mockUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const [ordersQuery, setOrdersQuery] = useState<any>(null);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (firestore) {
            setOrdersQuery(query(collection(firestore, 'orders'), orderBy('orderDate', 'desc')));
        }
    }, [firestore]);
    
    const { data: orders, loading } = useCollection<Order>(ordersQuery);

    const usersById = mockUsers.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {} as Record<string, User>);

    const handleStatusChange = (orderId: string, newStatus: 'Shipped' | 'Delivered') => {
        if (!firestore) {
            toast({ title: "Database not connected", variant: "destructive" });
            return;
        }
        const orderRef = doc(firestore, 'orders', orderId);
        const updateData = { status: newStatus };
        
        updateDoc(orderRef, updateData)
            .then(() => {
                 toast({ title: `Order marked as ${newStatus}` });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    if (loading || !isClient) {
        return (
            <div className="p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                        <Package className="w-8 h-8 text-primary" />
                        Customer Orders
                    </CardTitle>
                    <CardDescription>
                        View and manage all book orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!orders || orders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No orders found.</p>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {orders.map(order => {
                                const user = usersById[order.userId];
                                return (
                                <AccordionItem value={order.id} key={order.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div className="flex items-center gap-4 text-left">
                                                {user ? (
                                                    <Avatar className="h-10 w-10 hidden sm:flex">
                                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className="h-10 w-10 hidden sm:flex items-center justify-center bg-muted rounded-full">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="grid gap-0">
                                                    <p className="font-semibold">{order.customerName}</p>
                                                    {user ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.level ? (String(user.level).includes('.') ? String(user.level) : parseFloat(user.level).toFixed(1)) : "0.0"}

                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">User ID: {order.userId}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">Tk {order.totalAmount}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold">Delivery Details</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Address: {order.deliveryAddress} <br />
                                                    Mobile: {order.mobileNumber}
                                                </p>
                                                {user && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Profile: <Link href={`/dashboard/user/${user.id}`} className="text-primary underline">{user.name}</Link>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Ordered Books</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Title</TableHead>
                                                            <TableHead>Author</TableHead>
                                                            <TableHead className="text-center">Quantity</TableHead>
                                                            <TableHead className="text-right">Unit Price</TableHead>
                                                            <TableHead className="text-right">Subtotal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {order.books.map(book => (
                                                            <TableRow key={book.id}>
                                                                <TableCell>{book.title}</TableCell>
                                                                <TableCell>{book.author}</TableCell>
                                                                <TableCell className="text-center">{book.quantity}</TableCell>
                                                                <TableCell className="text-right">Tk {book.price}</TableCell>
                                                                <TableCell className="text-right">Tk {book.price * (book.quantity || 1)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge>{order.status}</Badge>
                                                {order.status === 'Paid' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'Shipped')}>Mark as Shipped</Button>
                                                )}
                                                {order.status === 'Shipped' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'Delivered')}>Mark as Delivered</Button>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )})}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
