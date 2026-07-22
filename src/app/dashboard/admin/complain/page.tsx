'use strict';
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AdminComplainPage() {
  const firestore = useFirestore();
  const [complainQuery, setComplainQuery] = useState<any>(null);
  
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [filterMode, setFilterMode] = useState<'date' | 'week' | 'month'>('date');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef<HTMLButtonElement>(null);

  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // স্ট্যাটাস আপডেটের ফাংশন
  const handleStatusToggle = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'PENDING' ? 'SOLVED' : 'PENDING';
    const docRef = doc(firestore, 'complains', id);
    await updateDoc(docRef, { status: newStatus });
  };

  useEffect(() => {
    if (activeDayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeDayRef.current;
      const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedDay, month, year]);

  useEffect(() => {
  if (firestore) {
    let q;
    const now = new Date();

    if (filterMode === 'month') {
      // চলতি মাসের ১ম দিন থেকে শেষ দিন পর্যন্ত ডেটা ফিল্টার
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      q = query(
        collection(firestore, 'complains'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        where('createdAt', '<=', Timestamp.fromDate(endOfMonth)),
        orderBy('createdAt', 'desc')
      );
    } else if (filterMode === 'week') {
      // গত ৭ দিনের কমপ্লেন ডেটা ফিল্টার
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);

      q = query(
        collection(firestore, 'complains'),
        where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
        where('createdAt', '<=', Timestamp.fromDate(now)),
        orderBy('createdAt', 'desc')
      );
    } else {
      // ডিফল্ট: নির্দিষ্ট দিনের ফিল্টার (আপনার আগের লজিক)
      const startOfDay = new Date(parseInt(year), parseInt(month) - 1, selectedDay, 0, 0, 0);
      const endOfDay = new Date(parseInt(year), parseInt(month) - 1, selectedDay, 23, 59, 59);

      q = query(
        collection(firestore, 'complains'),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc')
      );
    }

    setComplainQuery(q);
  }
}, [firestore, year, month, selectedDay, filterMode]); // এখানে filterMode যুক্ত করা হয়েছে


  const { data: complains, loading } = useCollection(complainQuery);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <Link href="/dashboard/admin" className="text-sm text-gray-600 hover:underline">← Back to Admin Panel</Link>

      <Card>
        <CardHeader>
          <CardTitle>User Complains (Admin View)</CardTitle>
          <CardDescription>Review and track all the complaints.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Year and Month Dropdowns - Justified */}
          {/* ড্রপডাউন এবং বাটনগুলোকে একই লাইনে সুন্দরভাবে সাজানো হয়েছে */}
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            
            {/* ড্রপডাউন গ্রুপ */}
            <div className="flex gap-4">
              <select 
                value={year} 
                onChange={(e) => { setYear(e.target.value); setFilterMode('date'); }}
                className="border p-2 rounded w-32 bg-white text-black"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              <select 
                value={month} 
                onChange={(e) => { setMonth(e.target.value); setFilterMode('date'); }}
                className="border p-2 rounded w-40 bg-white text-black"
              >
                {months.map((m, index) => (
                  <option key={m} value={index + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* কমপ্লেন সেকশনের নতুন বাটন দুটি এখানে যুক্ত হলো */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('week')}
                className={`text-xs px-4 py-2 font-medium h-9 rounded-md transition-all ${
                  filterMode === 'week' 
                    ? "bg-blue-600 text-white shadow-sm font-bold" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`text-xs px-4 py-2 font-medium h-9 rounded-md transition-all ${
                  filterMode === 'month' 
                    ? "bg-blue-600 text-white shadow-sm font-bold" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex overflow-x-auto gap-2 p-2 border rounded-lg bg-slate-50 scrollbar-hide">
            {daysArray.map((day) => (
              <button
                key={day}
                ref={day === selectedDay ? activeDayRef : null}
                onClick={() => { setSelectedDay(day); setFilterMode('date'); }}

                className={`min-w-[40px] h-10 rounded-md transition-colors ${
                  selectedDay === day ? 'bg-blue-600 text-white shadow-lg' : 'bg-white hover:bg-slate-200 border'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </CardContent>

        <CardContent>
          {loading ? (
             <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Details</TableHead>
                    <TableHead>Complain Type</TableHead>
                    <TableHead>Complain Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complains?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="text-gray-900 font-semibold">{item.userName || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.userId}</div>
                      </TableCell>
                      <TableCell><span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">{item.type || 'General'}</span></TableCell>
                      <TableCell className="text-gray-600 max-w-md break-words">{item.complain}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleStatusToggle(item.id, item.status || 'PENDING')}
                          className={`px-2 py-1 text-xs font-bold rounded uppercase transition-colors ${
                            (item.status || 'PENDING') === 'SOLVED' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status || 'PENDING'}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}