'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History } from 'lucide-react';
import { mockExamResults } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { currentUser } from '@/lib/auth';

export default function ExamHistoryPage() {
    const userExamHistory = mockExamResults.filter(result => result.userId === currentUser.id);

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-4">
                <Button asChild variant="ghost">
                  <Link href="/dashboard/competition">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Competition
                  </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                        <History className="w-8 h-8 text-primary" />
                        Your Exam History
                    </CardTitle>
                    <CardDescription>
                        Here is a list of your past exam attempts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userExamHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userExamHistory.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()).map(result => (
                                        <TableRow key={result.id}>
                                            <TableCell>{format(new Date(result.examDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{result.level}</TableCell>
                                            <TableCell className="font-medium">{result.totalObtainedMarks}/{result.totalMarks}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={cn(result.overallStatus === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                                    {result.overallStatus}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You have no exam history yet.</p>
                    )}
                     <div className="mt-8 text-center">
                        <Button asChild>
                            <Link href="/dashboard/competition">Back</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
