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
      const startOfDay = new Date(parseInt(year), parseInt(month) - 1, selectedDay, 0, 0, 0);
      const endOfDay = new Date(parseInt(year), parseInt(month) - 1, selectedDay, 23, 59, 59);

      const q = query(
        collection(firestore, 'complains'), 
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc')
      );
      setComplainQuery(q);
    }
  }, [firestore, year, month, selectedDay]);

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
          <div className="flex justify-between items-center w-full">
            <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded w-32">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded w-40">
              {months.map((m, index) => (
                <option key={m} value={index + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div ref={scrollContainerRef} className="flex overflow-x-auto gap-2 p-2 border rounded-lg bg-slate-50 scrollbar-hide">
            {daysArray.map((day) => (
              <button
                key={day}
                ref={day === selectedDay ? activeDayRef : null}
                onClick={() => setSelectedDay(day)}
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