'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, ArrowLeft, BookOpen, Crown, Trophy, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { db } from '@/firebase/config';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';

type FilterType = Transaction['type'] | 'All Transactions';

export default function AdminTransactionsPage() {
  const [filter, setFilter] = useState<FilterType>('All Transactions');
  
    // আজকের তারিখ অনুযায়ী ডিফল্ট বছর, মাস এবং দিন সেট করা হলো যাতে পেজ লোডেই স্ক্রলবার আজকের দিনে যায়
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth()); 
  const [selectedDate, setSelectedDate] = useState<Date | 'all'>(new Date());


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Firestore থেকে Timestamp নিরাপদে JavaScript Date-এ রূপান্তর করার ফাংশন
  const convertToDate = (dateFieldValue: any): Date => {
    if (dateFieldValue instanceof Timestamp) {
      return dateFieldValue.toDate();
    }
    if (dateFieldValue && typeof dateFieldValue.toDate === 'function') {
      return dateFieldValue.toDate();
    }
    return new Date(dateFieldValue);
  };

  // ১. 'transactions' এবং 'orders' উভয় কালেকশন থেকেই ডেটা আনা
  useEffect(() => {
    setLoading(true);
    
    const transactionsRef = collection(db, 'transactions');
    const ordersRef = collection(db, 'orders');

    let transactionsData: Transaction[] = [];
    let ordersData: Transaction[] = [];

    const unsubscribeTransactions = onSnapshot(transactionsRef, (snapshot) => {
      transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: Number(data.amount || 0),
          date: convertToDate(data.date).toISOString(),
          type: data.type || 'Exam Fee',
          userId: data.userId || '',
          userName: data.userName || 'Unknown User'
        } as Transaction;
      });
      combineAndSortData();
    });

    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let totalAmount = 0;
        if (Array.isArray(data.books)) {
          totalAmount = data.books.reduce((sum: number, b: any) => sum + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
        }

        return {
          id: doc.id,
          amount: totalAmount,
          date: convertToDate(data.orderDate).toISOString(),
          type: 'Book Shop',
          userId: data.userId || 'Guest',
          userName: data.customerName || 'Customer'
        } as Transaction;
      });
      combineAndSortData();
    });

    const combineAndSortData = () => {
      const combined = [...transactionsData, ...ordersData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setTransactions(combined);
      setLoading(false);
    };

    return () => {
      unsubscribeTransactions();
      unsubscribeOrders();
    };
  }, []);

  // আজকের দিন বা সিলেক্টেড দিন স্ক্রিন সেন্টারে নিয়ে আসার জন্য ইফেক্ট
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeChild = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeChild) {
        const container = scrollContainerRef.current;
        const scrollLeft = (activeChild as HTMLElement).offsetLeft - (container.clientWidth / 2) + ((activeChild as HTMLElement).clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedMonth, selectedYear, transactions]);

  // বছর ও মাসের তালিকা জেনারেট করা
  const daysInMonth = useMemo(() => {
    if (selectedYear === 'all' || selectedMonth === 'all') return [];
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    return eachDayOfInterval({ start, end });
  }, [selectedYear, selectedMonth]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // ফিল্টার, বছর, মাস এবং নির্দিষ্ট তারিখের ভিত্তিতে ডেটা ফিল্টারিং লজিক
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const tDate = new Date(transaction.date);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();

      if (selectedYear !== 'all' && tYear !== selectedYear) {
        return false;
      }

      if (selectedYear !== 'all' && selectedMonth !== 'all' && tMonth !== selectedMonth) {
        return false;
      }

      if (selectedYear !== 'all' && selectedMonth !== 'all' && selectedDate !== 'all') {
        if (selectedDate && !isSameDay(tDate, selectedDate as Date)) {
          return false;
        }
      }

      if (filter === 'All Transactions') return true;
      return transaction.type === filter;
    });
  }, [transactions, filter, selectedYear, selectedMonth, selectedDate]);

  let cumulativeAmount = 0;

  const getIconForType = (type: Transaction['type']) => {
    switch (type) {
      case 'Book Shop': return <BookOpen className="w-4 h-4" />;
      case 'Exam Fee': return <Trophy className="w-4 h-4" />;
      case 'Patronage': return <Crown className="w-4 h-4" />;
      default: return null;
    }
  };

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: "All Transactions", value: "All Transactions" },
    { label: "Exam Fee", value: "Exam Fee" },
    { label: "Book Shop", value: "Book Shop" },
    { label: "Patronization", value: "Patronage" },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 150 : scrollLeft + 150;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Landmark className="w-8 h-8 text-primary" /> Money Transactions
          </CardTitle>
          <CardDescription>
            View all incoming money from sales and fees.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* বছর ও মাস সিলেকশন ড্রপডাউন */}
          <div className="mb-6 flex gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Year</label>
              <select 
                value={selectedYear.toString()} 
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedYear(val === 'all' ? 'all' : Number(val));
                  setSelectedMonth('all');
                  setSelectedDate('all');
                }}
                className="border rounded p-2 text-sm bg-background w-32"
              >
                <option value="all">All Years (Lifetime)</option>
                {years.map((y: number) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Month</label>
              <select 
                value={selectedMonth.toString()} 
                disabled={selectedYear === 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val === 'all' ? 'all' : Number(val));
                  setSelectedDate('all');
                }}
                className="border rounded p-2 text-sm bg-background w-40 disabled:opacity-50"
              >
                <option value="all">All Months</option>
                {months.map((m, index) => <option key={m} value={index}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* হরিজন্টাল ডেট স্ক্রোলার */}
          {selectedYear !== 'all' && selectedMonth !== 'all' && (
            <div className="mb-6 flex items-center border rounded-lg p-2 bg-slate-50/50 relative">
              <Button variant="ghost" size="icon" onClick={() => scroll('left')} className="h-8 w-8 shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                ref={scrollContainerRef}
                className="flex gap-2 overflow-x-scroll mx-2 py-3 scroll-smooth border-b"
                style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'auto' }}
              >
                <button
                  data-active={selectedDate === 'all' ? "true" : "false"}
                  onClick={() => setSelectedDate('all')}
                                    className={cn(
                    "flex items-center justify-center h-10 px-3 shrink-0 text-sm font-medium rounded-md border transition-all",
                    selectedDate === 'all'
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-background hover:bg-muted border-muted text-foreground"
                  )}
                >
                  All Days
                </button>

                                {daysInMonth.map((day) => {
                  // ১. চেক করা: এই বাটনটি ইউজার সিলেক্ট করেছে কি না অথবা সিলেক্টেড না থাকলে এটি আজকের দিন কি না
                  const isSelected = selectedDate !== 'all' && selectedDate ? isSameDay(day, selectedDate as Date) : false;
                  const isToday = isSameDay(day, new Date());
                  const isActive = isSelected || (selectedDate === 'all' && isToday);

                  return (
                    <button
                      key={day.toString()}
                      // ২. এই ডাটা-অ্যাক্টিভ অ্যাট্রিবিউটটিই স্ক্রলারকে মাঝখানে টেনে আনবে
                      data-active={isActive ? "true" : "false"}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 shrink-0 text-sm font-medium rounded-md border transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : isToday
                          ? "border-primary text-primary font-bold bg-primary/5" // আজকের দিনটি আলাদাভাবে চেনার জন্য হালকা বর্ডার
                          : "bg-background hover:bg-muted border-muted text-foreground"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}

              </div>

              <Button variant="ghost" size="icon" onClick={() => scroll('right')} className="h-8 w-8 shrink-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* ফিল্টার বাটন */}
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

          {/* ডেটা লোডিং স্টেট বা টেবিল রেন্ডারিং */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No transactions found.</p>
            </div>
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
                      <TableCell className="text-muted-foreground text-center">
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

