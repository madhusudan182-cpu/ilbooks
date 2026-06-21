'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, ArrowLeft, BookOpen, Crown, Trophy } from 'lucide-react';
import { mockTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type FilterType = Transaction['type'] | 'All Transactions';

export default function AdminTransactionsPage() {
    const [filter, setFilter] = useState<FilterType>('All Transactions');

    const transactions = [...mockTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'All Transactions') return true;
        return transaction.type === filter;
    });

    let cumulativeAmount = 0;

    const getIconForType = (type: Transaction['type']) => {
        switch (type) {
            case 'Book Shop': return <BookOpen className="w-4 h-4" />;
            case 'Exam Fee': return <Trophy className="w-4 h-4" />;
            case 'Patronage': return <Crown className="w-4 h-4" />;
            default: return null;
        }
    }
    
    const filterButtons: { label: string; value: FilterType }[] = [
        { label: "All Transactions", value: "All Transactions" },
        { label: "Exam Fee", value: "Exam Fee" },
        { label: "Book Shop", value: "Book Shop" },
        { label: "Patronization", value: "Patronage" },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-4">
                <Button asChild variant="ghost">
                  <Link href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Panel
                  </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                        <Landmark className="w-8 h-8 text-primary" />
                        Money Transactions
                    </CardTitle>
                    <CardDescription>
                        View all incoming money from sales and fees.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {filterButtons.map(({ label, value }) => (
                            <Button
                                key={value}
                                variant={filter === value ? 'default' : 'outline'}
                                onClick={() => setFilter(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    {!filteredTransactions || filteredTransactions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No transactions found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">Date</TableHead>
                                    <TableHead className="text-center">Type</TableHead>
                                    <TableHead className="text-center">User</TableHead>
                                    <TableHead className="text-center">Amount (TK)</TableHead>
                                    <TableHead className="text-center">Cumulative Amount (TK)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map(transaction => {
                                    cumulativeAmount += transaction.amount;
                                    return (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="text-muted-foreground text-center">{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                {getIconForType(transaction.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Link href={`/dashboard/user/${transaction.userId}`} className="hover:underline">
                                                {transaction.userName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {transaction.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {cumulativeAmount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
