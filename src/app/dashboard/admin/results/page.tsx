'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function AdminResultsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filterMode, setFilterMode] = useState<'date' | 'week' | 'month'>('date');

    const scrollRef = useRef<HTMLDivElement>(null);

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = eachDayOfInterval({ start: startOfMonth(new Date(parseInt(year), parseInt(month))), end: endOfMonth(new Date(parseInt(year), parseInt(month))) });

    useEffect(() => {
        const q = query(collection(db, 'results'), orderBy('examDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const attemptTracker: Record<string, number> = {};
            
            const processed = rawData.map((d: any) => {
                const dateObj = d.examDate?.toDate ? d.examDate.toDate() : new Date(d.examDate);
                const key = `${d.userName}-${d.level}`;
                attemptTracker[key] = (attemptTracker[key] || 0) + 1;
                
                return {
                    ...d,
                    examDate: dateObj,
                    percentage: d.totalMarks ? ((d.totalObtainedMarks / d.totalMarks) * 100).toFixed(0) : 0,
                    ordinalAttempt: getOrdinal(attemptTracker[key])
                };
            });
            setResults(processed.reverse());
        });
        return () => unsubscribe();
    }, [year, month]);

    // বর্তমান তারিখ সেন্টারে নিয়ে আসা
    useEffect(() => {
        if (scrollRef.current) {
            const activeEl = scrollRef.current.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [days]);

    const filtered = results.filter(r => {
  if (!r.examDate) return false;
  const now = new Date();

  // ক) This Month ফিল্টার
  if (filterMode === 'month') {
    return (
      r.examDate.getFullYear() === now.getFullYear() &&
      r.examDate.getMonth() === now.getMonth()
    );
  }

  // খ) This Week ফিল্টার (গত ৭ দিন)
  if (filterMode === 'week') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return r.examDate >= oneWeekAgo && r.examDate <= now;
  }

  // গ) ডিফল্ট নির্দিষ্ট দিনের ফিল্টার (আপনার আগের লজিক)
  return isSameDay(r.examDate, selectedDate);
});


    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Link href="/dashboard/admin" className="flex items-center text-purple-700 mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel</Link>
            <h1 className="text-3xl font-bold text-purple-900 mb-6">Exam Results</h1>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    {/* ড্রপডাউন এবং নতুন বাটন দুটিকে একই লাইনে সাজানো হয়েছে */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    
                    {/* ড্রপডাউন গ্রুপ */}
                    <div className="flex gap-4">
                        <select 
                        value={year} 
                        onChange={(e) => { setYear(e.target.value); setFilterMode('date'); }}
                        className="p-2 border rounded w-32 bg-white text-black"
                        >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        
                        <select 
                        value={month} 
                        onChange={(e) => { setMonth(e.target.value); setFilterMode('date'); }}
                        className="p-2 border rounded w-40 bg-white text-black"
                        >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>

                    {/* রেজাল্ট সেকশনের নতুন বাটন গ্রুপ */}
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

                    
                    <div ref={scrollRef} className="flex overflow-x-auto gap-2 p-2 border-t pt-4">
                        {days.map((day, i) => (
                            <button key={i} data-active={isSameDay(day, selectedDate)} onClick={() => { setSelectedDate(day); setFilterMode('date'); }} className={`min-w-[40px] p-2 rounded border ${isSameDay(day, selectedDate) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                                {format(day, 'd')}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Attempt</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Percentage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(r => (
                            <TableRow key={r.id}>
                                <TableCell>{r.userName}</TableCell>
                                <TableCell>{format(r.examDate, 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{r.level}</TableCell>
                                <TableCell>{r.ordinalAttempt}</TableCell>
                                <TableCell>{r.totalObtainedMarks} / {r.totalMarks}</TableCell>
                                <TableCell className={r.overallStatus === 'Passed' ? 'text-green-600' : 'text-red-600'}>{r.overallStatus}</TableCell>
                                <TableCell>{r.percentage}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}