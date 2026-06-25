'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, ArrowLeft, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ফায়ারবেস ফায়ারস্টোর ইম্পোর্ট
import { db } from '@/firebase/config';
import { collection, onSnapshot, doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';

interface ParticipantResult {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  userLevel?: string;
  score: number;
  totalQuestions: number;
  attempt: number;
  date: any;
  prizeAmount: number;
  status: 'Pending' | 'Awarded';
  awardedDate?: string;
  paymentMethod: string; // নতুন পেমেন্ট মেথড ফিল্ড
}



export default function PrizesAndGiftsPage() {
  const todayRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // ফায়ারবেস থেকে ডেটা লোড হতে কিছুটা সময় লাগতে পারে, তাই একটি ছোট setTimeout দিলে স্ক্রলিং একদম নিখুঁত হবে
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 500); // ৫০০ মিলিসেকেন্ড পর স্ক্রল হবে

    return () => clearTimeout(timer);
  }, []);
  // ফিল্টার স্টেটসমূহ (শুরুতে 'all' থাকবে যাতে Lifetime ডেটা দেখায়)
    // লাইফটাইম এর পরিবর্তে পেজ লোডেই স্বয়ংক্রিয়ভাবে আজকের বছর, মাস এবং নির্দিষ্ট দিন সেট হবে
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth()); 
  const [selectedDate, setSelectedDate] = useState<Date | 'all'>(new Date());


  const [winners, setWinners] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ফায়ারবেস টাইমস্ট্যাম্প নিরাপদে রূপান্তরের ফাংশন
  const convertToDate = (dateFieldValue: any): Date => {
    if (dateFieldValue instanceof Timestamp) return dateFieldValue.toDate();
    if (dateFieldValue && typeof dateFieldValue.toDate === 'function') return dateFieldValue.toDate();
    return new Date(dateFieldValue);
  };

    // ফায়ারবেস থেকে ডেটা ফেচিং এবং লুজ কন্ডিশনাল চেকিং (৮০%+ বিজয়ী নির্ধারণ)
  useEffect(() => {
    setLoading(true);
    const resultsRef = collection(db, 'results');

    const unsubscribe = onSnapshot(resultsRef, (snapshot) => {
  const filteredWinners: ParticipantResult[] = [];

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    
    // ১. আপনার results পেজের লজিক অনুযায়ী স্কোর ও টোটাল বের করা
    const obtainedMarks = Number(data.totalObtainedMarks) || 0;
    const totalMarks = Number(data.totalMarks) || 10;
    
    // পার্সেন্টেজ হিসাব (আপনার results পেজের ৪৩ নম্বর লাইনের মতো)
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    
    // ২. চেষ্টা (Attempt) হিসাব (ordinalAttempt ট্র্যাকিং থেকে বা সরাসরি ফিল্ড থেকে)
    const attempt = data.attempt !== undefined ? Number(data.attempt) : 1;

    // কন্ডিশন: ১ম চেষ্টা এবং ৮০% বা তার বেশি স্কোর
    if (attempt === 1 && percentage >= 80) {
      // ৩. আপনার results পেজের ৬২ নম্বর লাইন অনুযায়ী আসল তারিখ ফিল্ড 'examDate' ব্যবহার করা
      const rawDate = data.examDate || data.date || data.createdAt;
      
      let finalData: Date;
      if (rawDate && typeof rawDate.toDate === 'function') {
        finalData = rawDate.toDate();
      } else if (rawDate) {
        finalData = new Date(rawDate);
      } else {
        finalData = new Date();
      }

      filteredWinners.push({
        id: docSnap.id,
        userId: data.userId || '', 
        userName: data.userName || data.customerName || 'Anonymous User',
        avatarUrl: data.avatarUrl || '',
        userLevel: data.userLevel || `Level: ${data.level || '1.0'}`,
        score: obtainedMarks, // আসল প্রাপ্ত নম্বর
        totalQuestions: totalMarks, // আসল টোটাল নম্বর
        attempt: attempt,
        date: finalData, 
        prizeAmount: Number(data.prizeAmount || 200),
        status: data.status || 'Pending',
        awardedDate: data.awardedDate || '',
        paymentMethod: data.paymentMethod || ''
      });
    }
  });

  // তারিখ অনুযায়ী সাজানো
  filteredWinners.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    return dateB - dateA;
  });

  setWinners(filteredWinners);
  setLoading(false);
}, (error) => {
  console.error("Error fetching results: ", error);
  setLoading(false);
});


    return () => unsubscribe();
  }, []);


  // অ্যাডমিন কর্তৃক ম্যানুয়ালি প্রাইজ অ্যামাউন্ট আপডেট করার ফাংশন
  const handleAmountChange = async (id: string, amount: number) => {
    try {
      const docRef = doc(db, 'results', id);
      await updateDoc(docRef, { prizeAmount: amount });
    } catch (err) {
      console.error("Error updating prize amount:", err);
    }
  };

  // অ্যাডমিন কর্তৃক স্ট্যাটাস 'Awarded' মার্ক করার ফাংশন
  const handleMarkAsAwarded = async (id: string) => {
    try {
      const docRef = doc(db, 'results', id);
      await updateDoc(docRef, { 
        status: 'Awarded',
        awardedDate: format(new Date(), 'dd/MM/yyyy')
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

    // অ্যাডমিন কর্তৃক ম্যানুয়ালি পেমেন্ট মেথড আপডেট করার ফাংশন
  const handlePaymentMethodChange = async (id: string, method: string) => {
    try {
      const docRef = doc(db, 'results', id);
      await updateDoc(docRef, { paymentMethod: method });
    } catch (err) {
      console.error("Error updating payment method:", err);
    }
  };

    // বছর ও মাসের দিনগুলো জেনারেট করার লজিক
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

  const filteredWinners = useMemo(() => {
  return winners.filter(winner => {
    // ১. winner.date থেকে নিরাপদভাবে Date অবজেক্ট তৈরি করা
    const wDate = winner.date instanceof Date ? winner.date : new Date(winner.date);
    
    // ২. টাইমজোনের ঝামেলা এড়াতে বছর, মাস এবং দিন আলাদা করে নেওয়া
    const wYear = wDate.getFullYear();
    const wMonth = wDate.getMonth();
    const wDay = wDate.getDate();

    if (selectedYear !== 'all' && wYear !== selectedYear) return false;
    if (selectedYear !== 'all' && selectedMonth !== 'all' && wMonth !== selectedMonth) return false;

    // ৩. নির্দিষ্ট দিন ফিল্টারিং ট্র্যাকিং (টাইমজোন মুক্ত সরাসরি দিন তুলনা)
    if (selectedYear !== 'all' && selectedMonth !== 'all' && selectedDate !== 'all' && selectedDate) {
      const sDate = new Date(selectedDate);
      if (wDay !== sDate.getDate() || wMonth !== sDate.getMonth() || wYear !== sDate.getFullYear()) {
        return false;
      }
    }
    return true;
  });
}, [winners, selectedYear, selectedMonth, selectedDate]);


  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 150 : scrollLeft + 150;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // আর্থিক হিসাব ভ্যারিয়েবলসমূহ
  let cumulativeGiven = 0;   
  let cumulativePending = 0; 

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-3xl font-headline">
              <Gift className="w-8 h-8 text-primary" /> Prizes & Gifts
            </CardTitle>
            <CardDescription>
              Manage and track prize distribution to winning users.
            </CardDescription>
          </div>
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
                  const isSelected = selectedDate !== 'all' && selectedDate ? isSameDay(day, selectedDate as Date) : false;
                  const isToday = isSameDay(day, new Date());
                  const isActive = isSelected || (selectedDate === 'all' && isToday);
                  
                  return (
                    <button
                      ref={isToday ? todayRef : null}
                      key={day.toString()}
                      data-active={isActive ? "true" : "false"}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 shrink-0 text-sm font-medium rounded-md border transition-all",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105" 
                          : isToday
                          ? "border-primary text-primary font-bold bg-primary/5"
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

          {/* ডেটা লোডিং স্টেট বা টেবিল রেন্ডারিং */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading winners data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Prize (TK)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Given Amount (TK)</TableHead>
                  <TableHead className="text-center">Cumulative Given (TK)</TableHead>
                  <TableHead className="text-center">Pending Amount (TK)</TableHead>
                  <TableHead className="text-center">Cumulative Pending (TK)</TableHead>
                  <TableHead className="text-center">Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredWinners || filteredWinners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No winners found for the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWinners.map(winner => {
                    const prize = Number(winner.prizeAmount || 0);
                    const isAwarded = winner.status === 'Awarded';
                    
                    const givenAmount = isAwarded ? prize : 0;
                    const pendingAmount = isAwarded ? 0 : prize;
                    
                    // রানিং টোটাল হিসাব
                    cumulativeGiven += givenAmount;
                    cumulativePending += pendingAmount;

                    return (
                      <TableRow key={winner.id}>
                        {/* ইউজার ইনফো */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={winner.avatarUrl} alt={winner.userName} />
                              <AvatarFallback>{winner.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{winner.userName}</span>
                              <span className="text-xs text-muted-foreground">{winner.userLevel}</span>
                            </div>
                          </div>
                        </TableCell>

                                                {/* এডিটেবল প্রাইজ */}
                        <TableCell className="w-[120px] text-center">
                          <Input
                            type="number"
                            disabled={isAwarded}
                            defaultValue={prize}
                            onBlur={(e) => {
                              const newVal = Number(e.target.value);
                              if (newVal !== prize && newVal >= 0) {
                                handleAmountChange(winner.id, newVal);
                              }
                            }}
                            className="h-8 w-24 text-center mx-auto p-1 font-medium disabled:opacity-80"
                          />
                        </TableCell>

                        {/* স্ট্যাটাস */}
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            isAwarded ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                            {winner.status}
                          </span>
                          {winner.awardedDate && <span className="text-[10px] block mt-1 text-green-600">({winner.awardedDate})</span>}
                        </TableCell>

                        {/* Given Amount */}
                        <TableCell className="text-center font-medium text-green-600">
                          {givenAmount > 0 ? `BDT ${givenAmount.toFixed(2)}` : '-'}
                        </TableCell>

                        {/* Cumulative Given */}
                        <TableCell className="text-center font-semibold text-green-700 bg-green-50/20">
                          BDT {cumulativeGiven.toFixed(2)}
                        </TableCell>

                        {/* Pending Amount */}
                        <TableCell className="text-center font-medium text-amber-600">
                          {pendingAmount > 0 ? `BDT ${pendingAmount.toFixed(2)}` : '-'}
                        </TableCell>

                        {/* Cumulative Pending */}
                        <TableCell className="text-center font-semibold text-amber-700 bg-amber-50/20">
                          BDT {cumulativePending.toFixed(2)}
                        </TableCell>

                        {/* Manual Editable Payment Method */}
                        <TableCell className="w-[180px] text-center">
                          <Input
                            type="text"
                            placeholder="e.g. Bkash: 017..."
                            defaultValue={winner.paymentMethod || ''}
                            onBlur={(e) => {
                              const newVal = e.target.value;
                              if (newVal !== winner.paymentMethod) {
                                handlePaymentMethodChange(winner.id, newVal);
                              }
                            }}
                            className="h-8 w-40 text-xs text-center mx-auto p-1 border-muted-foreground/30 focus:border-primary"
                          />
                        </TableCell>

                        {/* অ্যাকশন বাটন */}
                        <TableCell className="text-right">
                          {!isAwarded && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsAwarded(winner.id)}
                              className="h-8 text-xs border-green-200 hover:bg-green-50 text-green-700 gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Awarded
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

