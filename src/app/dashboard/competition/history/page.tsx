
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { ExamResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const DetailedResultTable = ({ result }: { result: ExamResult }) => {
    const examDate = result.examDate && (result.examDate as any).seconds 
        ? new Date((result.examDate as any).seconds * 1000) 
        : new Date(result.examDate as any);

    return (
        <div className="border rounded-lg overflow-hidden my-4 animate-fade-in-up">
            <h3 className="p-3 font-bold text-center text-md bg-muted">
                Result for Level {result.level} (Date: {format(examDate, 'dd/MM/yyyy')})
            </h3>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-yellow-300 hover:bg-yellow-300">
                            <TableHead className="font-bold text-black text-xs px-1 sm:px-2 py-1 text-center">Subject</TableHead>
                            <TableHead className="font-bold text-black text-xs text-center px-1 sm:px-2 py-1">Total</TableHead>
                            <TableHead className="font-bold text-black text-xs text-center px-1 sm:px-2 py-1">Obtained</TableHead>
                            <TableHead className="font-bold text-black text-xs text-center px-1 sm:px-2 py-1">Percentage</TableHead>
                            <TableHead className="font-bold text-black text-xs text-center px-1 sm:px-2 py-1">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result.subjects.map((subjectResult) => (
                            <TableRow key={subjectResult.subject}>
                                <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{subjectResult.subject}</TableCell>
                                <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{subjectResult.totalMarks}</TableCell>
                                <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{subjectResult.obtainedMarks}</TableCell>
                                <TableCell className={cn("text-center font-medium px-1 sm:px-2 py-1 text-xs", subjectResult.percentage >= 80 && "text-pink-600 font-bold text-base")}>{subjectResult.percentage.toFixed(0)}%</TableCell>
                                <TableCell className={cn("text-center font-bold px-1 sm:px-2 py-1 text-xs", subjectResult.status === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                    {subjectResult.status}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/80">
                            <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">Total</TableCell>
                            <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{result.totalMarks}</TableCell>
                            <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{result.totalObtainedMarks}</TableCell>
                            <TableCell className={cn("text-center font-medium px-1 sm:px-2 py-1 text-xs", result.totalPercentage >= 80 && "text-pink-600 font-bold text-base")}>{result.totalPercentage.toFixed(0)}%</TableCell>
                            <TableCell className={cn("text-center font-bold px-1 sm:px-2 py-1 text-xs", result.overallStatus === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                {result.overallStatus}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

function ExamHistoryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const [activeView, setActiveView] = useState<'recent' | 'previous' | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const resultsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'results'),
            where('userId', '==', user.uid),
            orderBy('examDate', 'desc')
        );
    }, [firestore, user]);

    const { data: userExamHistory, loading } = useCollection<ExamResult>(resultsQuery);
    
    const lastResult = userExamHistory && userExamHistory.length > 0 ? userExamHistory[0] : null;

    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (viewParam === 'recent') {
            setActiveView('recent');
        }
    }, [searchParams]);

    const handleBackClick = () => {
        if (activeView) {
            setActiveView(null);
            router.replace('/dashboard/competition/history', { scroll: false });
        } else {
            router.push('/dashboard/competition');
        }
    };

    if (!isClient || loading) {
      return (
        <div className="p-2 md:p-4 lg:p-6">
            <div className="mb-2">
                <Skeleton className="h-9 w-40" />
            </div>
            <Card>
                <CardHeader className="p-4">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="px-2 sm:px-4">
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
      )
    }

    return (
        <div className="p-2 md:p-4 lg:p-6">
            <div className="mb-2">
                <Button asChild variant="ghost">
                  <Link href="/dashboard/competition">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Competition
                  </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Your Exam Result
                    </CardTitle>
                    <CardDescription>
                        Here is a list of your recent exam attempts.
                    </CardDescription>
                    <div className="pt-4 flex flex-wrap justify-center gap-2">
                        <Button size="sm" onClick={() => setActiveView('recent')} disabled={!lastResult} className="bg-primary/80 hover:bg-primary/90 h-auto px-3 py-1.5 text-xs">
                            Recent Exam Result
                        </Button>
                        <Button size="sm" onClick={() => setActiveView('previous')} disabled={!userExamHistory || userExamHistory.length === 0} className="bg-primary/80 hover:bg-primary/90 h-auto px-3 py-1.5 text-xs">
                            Previous Results
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-4">
                    {(!userExamHistory || userExamHistory.length === 0) && (
                         <p className="text-muted-foreground text-center py-8">You have no exam history yet.</p>
                    )}
                    
                    {activeView === 'recent' && lastResult && <DetailedResultTable result={lastResult} />}

                    {activeView === 'previous' && userExamHistory && userExamHistory.length > 0 && (
                        <div className="overflow-x-auto mt-4 animate-fade-in-up">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-yellow-300 hover:bg-yellow-300">
                                        <TableHead className="text-center px-1 sm:px-2 py-2 text-xs font-bold text-black">Date</TableHead>
                                        <TableHead className="text-center px-1 sm:px-2 py-2 text-xs font-bold text-black">Level</TableHead>
                                        <TableHead className="text-center px-1 sm:px-2 py-2 text-xs font-bold text-black">Percentage</TableHead>
                                        <TableHead className="text-center px-1 sm:px-2 py-2 text-xs font-bold text-black">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userExamHistory.map(result => {
                                        const examDate = result.examDate && (result.examDate as any).seconds 
                                            ? new Date((result.examDate as any).seconds * 1000) 
                                            : new Date(result.examDate as any);
                                        return (
                                            <TableRow key={result.id}>
                                                <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{format(examDate, 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className="text-center px-1 sm:px-2 py-1 text-xs">{result.level}</TableCell>
                                                <TableCell className={cn("text-center font-medium px-1 sm:px-2 py-1 text-xs", result.totalPercentage >= 80 && "text-pink-600 font-bold text-base")}>
                                                    {result.totalPercentage.toFixed(0)}%
                                                </TableCell>
                                                <TableCell className={cn("text-center font-bold px-1 sm:px-2 py-1 text-xs", result.overallStatus === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                                    {result.overallStatus}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="mt-4 flex justify-center">
                <Button onClick={handleBackClick}>Back</Button>
            </div>
        </div>
    );
}

export default function ExamHistoryPage() {
    return (
        <Suspense fallback={
            <div className="p-2 md:p-4 lg:p-6 text-center">
                <Skeleton className="h-[400px] w-full" />
            </div>
        }>
            <ExamHistoryContent />
        </Suspense>
    );
}
