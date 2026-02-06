'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { mockExamResults } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { currentUser } from '@/lib/auth';
import type { ExamResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const DetailedResultTable = ({ result }: { result: ExamResult }) => (
    <div className="border rounded-lg overflow-hidden my-4 animate-fade-in-up">
        <h3 className="p-3 font-bold text-center text-md bg-muted">
            Result for Level {result.level} (Date: {format(new Date(result.examDate), 'dd/MM/yyyy')})
        </h3>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-yellow-300 hover:bg-yellow-300">
                        <TableHead className="font-bold text-black text-xs px-2 py-2">Subject</TableHead>
                        <TableHead className="font-bold text-black text-xs text-center px-2 py-2">Total Marks</TableHead>
                        <TableHead className="font-bold text-black text-xs text-center px-2 py-2">Obtained</TableHead>
                        <TableHead className="font-bold text-black text-xs text-center px-2 py-2">Percentage</TableHead>
                        <TableHead className="font-bold text-black text-xs text-right px-2 py-2">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.subjects.map((subjectResult) => (
                        <TableRow key={subjectResult.subject}>
                            <TableCell className="px-2 py-2 text-sm">{subjectResult.subject}</TableCell>
                            <TableCell className="text-center px-2 py-2 text-sm">{subjectResult.totalMarks}</TableCell>
                            <TableCell className="text-center px-2 py-2 text-sm">{subjectResult.obtainedMarks}</TableCell>
                            <TableCell className="text-center px-2 py-2 text-sm">{subjectResult.percentage.toFixed(0)}%</TableCell>
                            <TableCell className={cn("text-right font-bold px-2 py-2 text-sm", subjectResult.status === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                {subjectResult.status}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/80">
                        <TableCell className="px-2 py-2 text-sm">Total</TableCell>
                        <TableCell className="text-center px-2 py-2 text-sm">{result.totalMarks}</TableCell>
                        <TableCell className="text-center px-2 py-2 text-sm">{result.totalObtainedMarks}</TableCell>
                        <TableCell className="text-center px-2 py-2 text-sm">{result.totalPercentage.toFixed(0)}%</TableCell>
                        <TableCell className={cn("text-right px-2 py-2 text-sm", result.overallStatus === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                            {result.overallStatus}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
);

function ExamHistoryContent() {
    const searchParams = useSearchParams();
    const [activeView, setActiveView] = useState<'last' | 'previous' | null>(null);
    const userExamHistory = mockExamResults.filter(result => result.userId === currentUser.id)
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
    
    const lastResult = userExamHistory.length > 0 ? userExamHistory[0] : null;

    const router = useRouter();

    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (viewParam === 'last') {
            setActiveView('last');
        }
    }, [searchParams]);


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
                        Here is a list of your past exam attempts.
                    </CardDescription>
                    <div className="pt-4 flex flex-wrap justify-center gap-2">
                        <Button onClick={() => setActiveView('last')} disabled={!lastResult}>
                            Last Exam Result
                        </Button>
                        <Button onClick={() => setActiveView('previous')} disabled={userExamHistory.length === 0}>
                            Previous Results
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-4">
                    {activeView === null && userExamHistory.length === 0 && (
                         <p className="text-muted-foreground text-center py-8">You have no exam history yet.</p>
                    )}
                    
                    {activeView === 'last' && lastResult && <DetailedResultTable result={lastResult} />}

                    {activeView === 'previous' && userExamHistory.length > 0 && (
                        <div className="overflow-x-auto mt-4 animate-fade-in-up">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-2 py-2 text-xs">Date</TableHead>
                                        <TableHead className="px-2 py-2 text-xs">Level</TableHead>
                                        <TableHead className="text-right px-2 py-2 text-xs">Percentage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userExamHistory.map(result => (
                                        <TableRow key={result.id}>
                                            <TableCell className="px-2 py-2 text-sm">{format(new Date(result.examDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="px-2 py-2 text-sm">{result.level}</TableCell>
                                            <TableCell className="text-right font-medium px-2 py-2 text-sm">
                                                {result.totalPercentage.toFixed(0)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {activeView === 'previous' && userExamHistory.length === 0 && (
                         <p className="text-muted-foreground text-center py-8">You have no exam history yet.</p>
                    )}
                </CardContent>
            </Card>
            <div className="mt-4 flex justify-center">
                <Button onClick={() => router.back()}>Back</Button>
            </div>
        </div>
    );
}

export default function ExamHistoryPage() {
    return (
        <Suspense fallback={
            <div className="p-2 md:p-4 lg:p-6">
                <div className="mb-2">
                    <Skeleton className="h-9 w-40" />
                </div>
                <Card>
                    <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-7 w-48" />
                        </div>
                        <Skeleton className="h-4 w-64 mt-2" />
                        <div className="pt-4 flex flex-wrap justify-center gap-2">
                            <Skeleton className="h-10 w-36" />
                            <Skeleton className="h-10 w-36" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4">
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
                <div className="mt-4 flex justify-center">
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        }>
            <ExamHistoryContent />
        </Suspense>
    );
}
