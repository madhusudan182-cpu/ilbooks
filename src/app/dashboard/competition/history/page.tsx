'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, History } from 'lucide-react';
import { mockExamResults } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { currentUser } from '@/lib/auth';

export default function ExamHistoryPage() {
    const userExamHistory = mockExamResults.filter(result => result.userId === currentUser.id);

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
                        <History className="w-6 h-6 text-primary" />
                        Your Exam History
                    </CardTitle>
                    <CardDescription>
                        Here is a list of your past exam attempts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {userExamHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-4 py-2">Date</TableHead>
                                        <TableHead className="px-4 py-2">Level</TableHead>
                                        <TableHead className="text-right px-4 py-2">Percentage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userExamHistory.sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()).map(result => (
                                        <TableRow key={result.id}>
                                            <TableCell className="px-4 py-2">{format(new Date(result.examDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="px-4 py-2">{result.level}</TableCell>
                                            <TableCell className="text-right font-medium px-4 py-2">
                                                {result.totalPercentage.toFixed(0)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You have no exam history yet.</p>
                    )}
                     <div className="p-4 text-center">
                        <Button asChild>
                            <Link href="/dashboard/competition">Back</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
