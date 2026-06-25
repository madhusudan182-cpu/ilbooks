'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Ban, PlayCircle } from 'lucide-react';
import { examSchedules } from '@/lib/exam-schedule';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// ফায়ারবেস ইম্পোর্টসমূহ (আপনার প্রজেক্টের সঠিক পাথ অনুযায়ী db ইম্পোর্ট করুন)
import { db } from '@/firebase/config'; 
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

export default function AdminSchedulePage() {
    // ডাটাবেজের রিয়েল-টাইম হোল্ড স্টেট ট্র্যাকিং
    const [dbHolds, setDbHolds] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // ফায়ারবেস থেকে রিয়েল-টাইম ডেটা লোড
    useEffect(() => {
        const scheduleRef = collection(db, 'exam_settings');
        const unsubscribe = onSnapshot(scheduleRef, (snapshot) => {
            const holdsData: Record<string, boolean> = {};
            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                // যদি স্টেটাস 'On Hold' হয় তবে true, অন্যথায় false
                holdsData[docSnap.id] = data.status === 'On Hold';
            });
            setDbHolds(holdsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching schedules: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ডাটাবেজে অ্যাক্টিভ/হোল্ড স্টেট পরিবর্তন করার ফাংশন
    const handleToggleHold = async (subLevelKey: string) => {
        const currentStatus = dbHolds[subLevelKey]; // true মানে On Hold, false মানে Active
        const nextStatus = !currentStatus;
        
        try {
            const docRef = doc(db, 'exam_settings', subLevelKey);
            // ফায়ারবেস ডাটাবেজে স্টেট আপডেট
            await setDoc(docRef, {
                status: nextStatus ? 'On Hold' : 'Active',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            toast({ 
                title: nextStatus ? `Level ${subLevelKey} is now ON HOLD.` : `Level ${subLevelKey} is now ACTIVE.`,
                variant: nextStatus ? "destructive" : "default"
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({
                title: "Error updating schedule",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading schedules from database...</div>;
    }

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
                        <CalendarClock className="w-8 h-8 text-primary" />
                        Exam Schedule Management
                    </CardTitle>
                    <CardDescription>
                        View, hold, and manage exam schedules for all levels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Accordion type="multiple" className="w-full">
                        {Object.entries(examSchedules).map(([level, schedule]) => {
                            const majorLevel = parseInt(level, 10);
                            
                            // চেক করা হচ্ছে এই মেজরের কোনো সাব-লেভেল অন-হোল্ড আছে কি না
                            const someSubLevelsOnHold = [...Array(10)].some((_, i) => !!dbHolds[`${majorLevel}.${i}`]);
                            
                            return (
                                <AccordionItem value={`level-${level}`} key={level}>
                                    <AccordionTrigger className="hover:no-underline font-normal text-base px-4 border-b">
                                        <div className="grid grid-cols-3 md:grid-cols-4 w-full text-left items-center gap-4">
                                            <span className="font-semibold col-span-1">Level {level}.x</span>
                                            <span className="text-sm col-span-2 md:col-span-2">
                                                {schedule.dayName},{' '}
                                                {schedule.start % 12 || 12}:00 {schedule.start < 12 ? 'am' : 'pm'} -{' '}
                                                {schedule.end % 12 || 12}:00 {schedule.end < 12 ? 'am' : 'pm'}
                                            </span>
                                            <div className="col-span-1 justify-self-start">
                                                <Badge variant={someSubLevelsOnHold ? 'destructive' : 'default'} className={cn(someSubLevelsOnHold ? 'bg-red-500' : 'bg-green-500')}>
                                                    {someSubLevelsOnHold ? 'On Hold' : 'Active'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-muted/50">
                                        <div className="pl-4 sm:pl-8 pr-4 py-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Sub-Level</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {[...Array(10)].map((_, i) => {
                                                        const subLevelKey = `${majorLevel}.${i}`;
                                                        const isHeld = !!dbHolds[subLevelKey];
                                                        return (
                                                            <TableRow key={subLevelKey}>
                                                                <TableCell className="font-semibold">{subLevelKey}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={isHeld ? 'destructive' : 'default'} className={cn(isHeld ? 'bg-red-500' : 'bg-green-500')}>
                                                                        {isHeld ? 'On Hold' : 'Active'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end items-center gap-2 flex-wrap">
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant={isHeld ? 'secondary' : 'destructive'} 
                                                                            onClick={() => handleToggleHold(subLevelKey)}
                                                                        >
                                                                            {isHeld ? <PlayCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                                                            {isHeld ? 'Release' : 'Hold'}
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                     </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
