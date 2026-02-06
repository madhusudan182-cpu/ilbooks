'use client';

import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { allQuestions } from '@/lib/questions';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { ListChecks, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function AllQuestionsPage() {
    const [isClient, setIsClient] = useState(false)
 
    useEffect(() => {
      setIsClient(true)
    }, [])

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        if (i === 1) continue; // Skip level 1.x
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const questionsByLevel = allQuestions.reduce((acc, q) => {
        if (!acc[q.level]) {
            acc[q.level] = [];
        }
        acc[q.level].push(q);
        return acc;
    }, {} as Record<string, Question[]>);
    

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
                        <ListChecks className="w-8 h-8 text-primary"/>
                        All Questions
                    </CardTitle>
                    <CardDescription>
                        All available questions are visible to admins for review, grouped by level.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isClient ? <Accordion type="multiple" className="w-full max-h-[60rem] overflow-y-auto">
                        {allLevels.map((level) => {
                            const questionsForLevel = questionsByLevel[level] || [];
                            return (
                                <AccordionItem value={`level-q-${level}`} key={level}>
                                    <AccordionTrigger className="text-left font-semibold">
                                        Questions for Level: {level}
                                        <span className="text-sm font-normal text-muted-foreground ml-2">({questionsForLevel.length} questions)</span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {questionsForLevel.length > 0 ? (
                                            <Accordion type="multiple" className="w-full">
                                                {questionsForLevel.map((q, index) => (
                                                    <AccordionItem value={`item-${level}-${index}`} key={q.id}>
                                                        <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                                        <AccordionContent>
                                                            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                                                {q.answers.map((ans, ansIndex) => (
                                                                    <li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>
                                                                        {ans.text}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <p className="mt-2 pt-2 border-t text-sm text-muted-foreground"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        ) : (
                                            <p className="text-muted-foreground text-sm py-4 px-4">No questions defined for this level.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion> : null}
                </CardContent>
            </Card>
        </div>
    );
}
