// কোডের শুরু: Dashboard/admin/accounts/transactions/page.tsx (Part 1)
'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, ArrowLeft, BookOpen, Crown, Trophy, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

import { cn } from '@/lib/utils';
import { db } from '@/firebase/config';
import { collection, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';

type FilterType = Transaction['type'] | 'All Transactions';

export default function AdminTransactionsPage() {
  const [filter, setFilter] = useState<FilterType>('All Transactions');
  
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | 'all'>(new Date());
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

const handleThisWeek = () => {
  setTimeFilter('week');
  setSelectedYear('all');
  setSelectedMonth('all');
  setSelectedDate('all');
};

const handleThisMonth = () => {
  setTimeFilter('month');
  setSelectedYear('all');
  setSelectedMonth('all');
  setSelectedDate('all');
};

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const convertToDate = (dateFieldValue: any): Date => {
    if (dateFieldValue instanceof Timestamp) return dateFieldValue.toDate();
    if (dateFieldValue && typeof dateFieldValue.toDate === 'function') return dateFieldValue.toDate();
    return new Date(dateFieldValue);
  };
// কোডের শেষ (Part 1)
// কোডের শুরু: Dashboard/admin/accounts/transactions/page.tsx (Part 2)
  useEffect(() => {
    setLoading(true);
    const transactionsRef = collection(db, 'transactions');
    const ordersRef = collection(db, 'orders');
    const paymentsRef = collection(db, 'payments');

    let transactionsData: Transaction[] = [];
    let ordersData: Transaction[] = [];
    let paymentsData: Transaction[] = [];

    // ১. পূর্বের এক্সাম ফি ও পেট্রন ট্রানজেকশন রিড করা
    const unsubscribeTransactions = onSnapshot(transactionsRef, (snapshot) => {
      transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: Number(data.amount || 0),
          date: data.date ? convertToDate(data.date).toISOString() : new Date().toISOString(),
          type: data.type || 'Exam Fee',
          userId: data.userId || '',
          userName: data.userName || 'Verified User'
        } as Transaction;
      });
      processAllData();
    });

    // ২. বুকশপ অর্ডার রিড করা (আগের নাম অক্ষুণ্ন রাখা)
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let totalAmount = 0;
        if (Array.isArray(data.books)) {
          totalAmount = data.books.reduce((sum: number, b: any) => sum + (Number(b.price || 0) * Number(b.quantity || 1)), 0);
        } else if (data.totalAmount) {
          totalAmount = Number(data.totalAmount);
        }
        return {
          id: doc.id,
          amount: totalAmount,
          date: convertToDate(data.orderDate || data.date).toISOString(),
          type: 'Book Shop',
          userId: data.userId || 'Guest',
          userName: data.customerName || data.userName || 'Verified Customer'
        } as Transaction;
      });
      processAllData();
    });
// কোডের শেষ (Part 2)
// কোডের শুরু: Dashboard/admin/accounts/transactions/page.tsx (Part 3)
    // ৩. লাইভ পেমেন্ট গেটওয়ে ক্যাচার (নতুন সাকসেস ট্র্যাকিং লজিক)
    const unsubscribePayments = onSnapshot(paymentsRef, (snapshot) => {
      paymentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const paymentDate = data.createdAt ? convertToDate(data.createdAt) : new Date();
        
        if (data.amount === 10 || data.amount === "10") {
          return {
            id: doc.id,
            amount: 10.00,
            date: paymentDate.toISOString(),
            type: 'Book Shop',
            userId: '',
            userName: 'Gateway Customer'
          } as Transaction;
        }

        const fullOrderId = String(data.orderId || '').toUpperCase();
        let liveType: Transaction['type'] = 'Exam Fee';
        
        if (fullOrderId.includes('EXAM') || data.paymentType === 'exam') {
          liveType = 'Exam Fee';
        } else if (fullOrderId.includes('ORDER') || data.paymentType === 'book_shop') {
          liveType = 'Book Shop';
        } else if (data.paymentType === 'patron') {
          liveType = 'Patronage';
        }

        return {
          id: doc.id,
          amount: Number(data.amount || 0),
          date: paymentDate.toISOString(),
          type: liveType,
          userId: data.userId || '',
          userName: data.customerName || data.userName || 'Fetching Live User...'
        } as Transaction;
      });

      processAllData();
    });

    const processAllData = async () => {
      const combined = [...transactionsData, ...ordersData, ...paymentsData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const uniqueCombined = combined.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      const finalized = await Promise.all(uniqueCombined.map(async (txn) => {
        if (txn.userName === 'Fetching Live User...' && txn.userId && txn.userId.length > 5) {
          try {
            const userSnap = await getDoc(doc(db, 'users', txn.userId));
            if (userSnap.exists()) {
              return { ...txn, userName: userSnap.data().name || 'Active Student' };
            }
          } catch (e) {}
          return { ...txn, userName: 'Active Website User' };
        }
        return txn;
      }));

      setTransactions(finalized);
      setLoading(false);
    };

    return () => {
      unsubscribeTransactions();
      unsubscribeOrders();
      unsubscribePayments();
    };
  }, []);

  // ফিক্স ১ (সমাধান): সিলেক্টেড বা আজকের দিনকে হরিজন্টাল স্ক্রলবারের একদম মাঝখানে (Center) নিয়ে আসার লজিক
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const activeElement = container?.querySelector('[data-active="true"]') as HTMLElement;
        if (container && activeElement) {
          const containerWidth = container.offsetWidth;
          const elementOffset = activeElement.offsetLeft;
          const elementWidth = activeElement.offsetWidth;
          container.scrollTo({
            left: elementOffset - (containerWidth / 2) + (elementWidth / 2),
            behavior: 'smooth'
          });
        }
      }, 300); // ফায়ারবেস ডেটা রেন্ডার হওয়ার জন্য সামান্য বাফার টাইম দেওয়া হলো
    }
  }, [selectedDate, selectedMonth, selectedYear, transactions]);

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
const filteredTransactions = useMemo(() => {
  return transactions.filter(t => {
    const tDate = new Date(t.date);
    const now = new Date();

    // "This Week" ফিল্টার চেক
    if (timeFilter === 'week') {
      const startOfWeekDate = startOfWeek(now, { weekStartsOn: 6 }); // শনিবার থেকে সপ্তাহ শুরু
      const endOfWeekDate = endOfWeek(now, { weekStartsOn: 6 });
      return tDate >= startOfWeekDate && tDate <= endOfWeekDate && (filter === 'All Transactions' || t.type === filter);
    }

    // "This Month" ফিল্টার চেক
    if (timeFilter === 'month') {
      return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth() && (filter === 'All Transactions' || t.type === filter);
    }

    // আগের ড্রপডাউন ভিত্তিক ফিল্টারিং লজিক নিচে থাকবে
    if (selectedYear !== 'all' && tDate.getFullYear() !== selectedYear) return false;
    if (selectedYear !== 'all' && selectedMonth !== 'all' && tDate.getMonth() !== selectedMonth) return false;
    if (selectedYear !== 'all' && selectedMonth !== 'all' && selectedDate !== 'all') {
      if (!isSameDay(tDate, new Date(selectedDate))) return false;
    }
    if (filter !== 'All Transactions' && t.type !== filter) return false;
    return true;
  });
}, [transactions, filter, selectedYear, selectedMonth, selectedDate, timeFilter]); 
// dependency-তে timeFilter যুক্ত করা হয়েছে


  let cumulativeAmount = 0;

  const getIconForType = (type: Transaction['type']) => {
    switch (type) {
      case 'Book Shop': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'Exam Fee': return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'Patronage': return <Crown className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - 180 : scrollLeft + 180,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Landmark className="w-8 h-8 text-primary" /> Money Transactions
          </CardTitle>
          <CardDescription>Monitor historical logs and capture incoming gateway revenue live.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Year</label>
              <select 
                value={selectedYear.toString()} 
                onChange={(e) => { 
                  setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value)); 
                  setSelectedMonth('all'); 
                  setSelectedDate('all'); 
                  setTimeFilter('all'); // বাটন রিসেট
                }} 
                className="border rounded p-2 text-sm bg-background w-32"
              >
                <option value="all">All Years</option>
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Month</label>
              <select 
                value={selectedMonth.toString()} 
                disabled={selectedYear === 'all'}
                onChange={(e) => { 
                  setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value)); 
                  setSelectedDate('all'); 
                  setTimeFilter('all'); // বাটন রিসেট
                }} 
                className="border rounded p-2 text-sm bg-background w-40 disabled:opacity-50"
              >
                <option value="all">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>

            {/* একই লাইনে নতুন বাটন দুটি */}
            <div className="flex gap-2">
              <Button 
                variant={timeFilter === 'week' ? 'default' : 'outline'} 
                onClick={handleThisWeek}
                className="h-9"
              >
                This Week
              </Button>
              <Button 
                variant={timeFilter === 'month' ? 'default' : 'outline'} 
                onClick={handleThisMonth}
                className="h-9"
              >
                This Month
              </Button>
            </div>
          </div>

          
          {/* ফিক্স ২ (সমাধান): স্ক্রলবার ফিরিয়ে আনা এবং কন্টেইনার ডিজাইন মডিফিকেশন */}
          {selectedYear !== 'all' && selectedMonth !== 'all' && (
            <div className="mb-6 flex items-center border rounded-lg p-3 bg-slate-50/80 shadow-inner relative">
              <Button variant="outline" size="icon" onClick={() => scroll('left')} className="h-9 w-9 shrink-0 shadow-sm z-10 bg-background">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                ref={scrollContainerRef} 
                className="flex gap-2 overflow-x-auto mx-2 py-2 w-full style-scrollbar" 
                style={{ scrollbarWidth: 'auto', msOverflowStyle: 'auto' }}
              >
                <button 
                  data-active={selectedDate === 'all' ? "true" : "false"} 
                  onClick={() => setSelectedDate('all')} 
                  className={cn(
                    "flex items-center justify-center h-10 px-4 shrink-0 text-sm font-semibold rounded-md border transition-all shadow-sm", 
                    selectedDate === 'all' ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  All Days
                </button>
                
                {daysInMonth.map((day) => {
                  const isSelected = selectedDate !== 'all' && isSameDay(day, new Date(selectedDate));
                  return (
                    <button 
                      key={day.toString()} 
                      data-active={isSelected ? "true" : "false"}
                      onClick={() => setSelectedDate(day)} 
                      className={cn(
                        "flex items-center justify-center h-10 w-11 shrink-0 text-sm font-medium rounded-md border transition-all shadow-sm", 
                        isSelected ? "bg-primary text-primary-foreground border-primary scale-110 font-bold" : "bg-background text-slate-700 hover:bg-muted"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
              
              <Button variant="outline" size="icon" onClick={() => scroll('right')} className="h-9 w-9 shrink-0 shadow-sm z-10 bg-background">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { label: "All Transactions", value: "All Transactions" },
              { label: "Exam Fee", value: "Exam Fee" },
              { label: "Book Shop", value: "Book Shop" },
              { label: "Patronization", value: "Patronage" }
            ] as { label: string; value: FilterType }[]).map(({ label, value }) => (
              <Button key={value} variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{label}</Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><span>Loading transactions...</span></div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="text-center py-10"><p className="text-muted-foreground">No transactions found for this date selection.</p></div>
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
                      <TableCell><div className="flex items-center justify-center">{getIconForType(transaction.type)}</div></TableCell>
                      <TableCell className="text-center font-medium">
                        {transaction.userId && transaction.userId.length > 5 ? (
                          <Link href={`/dashboard/user/${transaction.userId}`} className="hover:underline text-primary font-bold">{transaction.userName}</Link>
                        ) : (
                          <span className="text-slate-600">{transaction.userName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{cumulativeAmount.toFixed(2)}</TableCell>
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
// কোডের শেষ (Part 5)
