'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ban } from 'lucide-react';

export default function ExamHeldPage() {

    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto w-fit rounded-full bg-destructive/10 p-4 text-destructive">
                        <Ban className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl font-headline mt-4">
                        Exam on Hold
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        The exam has been held for some unavoidable reasons! Please, try later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                     <Button asChild className="w-full">
                        <Link href="/dashboard/competition">
                            Back to Competition Page
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
