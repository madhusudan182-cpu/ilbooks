'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Award } from 'lucide-react';

export default function ExamCompletionPage() {
    const router = useRouter();

    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto w-fit rounded-full bg-green-100 p-4 text-green-600">
                        <Award className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl font-headline mt-4">
                        Congratulations!
                    </CardTitle>
                    <CardDescription>
                        You have successfully completed the exam.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                     <Button asChild className="w-full">
                        <Link href="/dashboard/competition/history">
                            See Your Exam Result
                        </Link>
                    </Button>
                     <Button asChild variant="ghost">
                        <Link href="/dashboard/competition">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Competition
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={() => router.back()} className="w-full">
                        Back
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
