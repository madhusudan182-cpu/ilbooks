'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ClipboardList, ArrowLeft } from 'lucide-react';
import type { ExamResult } from '@/lib/types';
import { mockExamResults } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type ExamResultWithAttempt = ExamResult & { attemptNumber: number };

export default function AdminResultsPage() {
    const [results] = useState<ExamResult[]>(mockExamResults);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toOrdinal = (n: number) => {
        if (n % 100 >= 11 && n % 100 <= 13) {
            return `${n}th`;
        }
        switch (n % 10) {
            case 1: return `${n}st`;
            case 2: return `${n}nd`;
            case 3: return `${n}rd`;
            default: return `${n}th`;
        }
    };

    const sortedResults: ExamResultWithAttempt[] = useMemo(() => {
        const userLevelAttempts: { [key: string]: number } = {};

        // Sort oldest to newest to count attempts correctly
        const chronoSortedResults = [...results].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

        const resultsWithAttempts = chronoSortedResults.map(result => {
            const key = `${result.userId}-${result.level}`;
            userLevelAttempts[key] = (userLevelAttempts[key] || 0) + 1;
            return { ...result, attemptNumber: userLevelAttempts[key] };
        });

        // Sort back to newest first for display
        return resultsWithAttempts.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
    }, [results]);

    if (!isClient) {
        return (
             <div className="p-4 md:p-6 lg:p-8">
                <div className="mb-4">
                    <Skeleton className="h-9 w-44" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
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
                            <ClipboardList className="w-8 h-8 text-primary" />
                            Exam Results
                        </CardTitle>
                        <CardDescription>
                            View and manage all user exam results for analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!sortedResults || sortedResults.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No exam results found.</p>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                                {sortedResults.map(result => (
                                    <AccordionItem value={result.id} key={result.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between items-center w-full pr-4">
                                                <div className="flex items-center gap-4 text-left">
                                                    <Avatar className="h-10 w-10 hidden sm:flex">
                                                        <AvatarImage src={result.userAvatarUrl} alt={result.userName} />
                                                        <AvatarFallback>{result.userName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid gap-0">
                                                        <p className="font-semibold">{result.userName}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span>Level: {result.level}</span>
                                                            <span className="font-bold text-primary">&bull;</span>
                                                            <span>{toOrdinal(result.attemptNumber)} time</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{result.totalObtainedMarks}/{result.totalMarks}</p>
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Badge className={cn(result.overallStatus === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                                            {result.overallStatus}
                                                        </Badge>
                                                        <span className={cn("text-sm font-semibold", result.totalPercentage >= 80 ? "text-pink-600 font-bold text-lg" : "text-muted-foreground")}>({result.totalPercentage.toFixed(0)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-semibold">Result Details</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        User: <Link href={`/dashboard/user/${result.userId}`} className="text-primary underline">{result.userName}</Link> <br />
                                                        Exam Date: {format(new Date(result.examDate), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold">Subject Breakdown</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Subject</TableHead>
                                                                <TableHead className="text-center">Marks</TableHead>
                                                                <TableHead className="text-center">Obtained</TableHead>
                                                                <TableHead className="text-center">Percentage</TableHead>
                                                                <TableHead className="text-right">Status</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {result.subjects.map(subjectResult => (
                                                                <TableRow key={subjectResult.subject}>
                                                                    <TableCell>{subjectResult.subject}</TableCell>
                                                                    <TableCell className="text-center">{subjectResult.totalMarks}</TableCell>
                                                                    <TableCell className="text-center">{subjectResult.obtainedMarks}</TableCell>
                                                                    <TableCell className={cn("text-center", subjectResult.percentage >= 80 ? "text-pink-600 font-bold text-lg" : "")}>{subjectResult.percentage.toFixed(0)}%</TableCell>
                                                                    <TableCell className={cn("text-right font-bold", subjectResult.status === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                                                        {subjectResult.status}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow className="font-bold bg-muted/50">
                                                                <TableCell>Total</TableCell>
                                                                <TableCell className="text-center">{result.totalMarks}</TableCell>
                                                                <TableCell className="text-center">{result.totalObtainedMarks}</TableCell>
                                                                <TableCell className={cn("text-center", result.totalPercentage >= 80 ? "text-pink-600 font-bold text-lg" : "")}>{result.totalPercentage.toFixed(0)}%</TableCell>
                                                                <TableCell className={cn("text-right", result.overallStatus === 'Passed' ? 'text-green-600' : 'text-red-600')}>
                                                                    {result.overallStatus}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
