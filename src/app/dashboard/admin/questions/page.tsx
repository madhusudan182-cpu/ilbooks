'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { allQuestions } from '@/lib/questions';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { ListChecks, ArrowLeft, Edit, Save, X, PlusCircle, Trash2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AllQuestionsPage() {
    const [isClient, setIsClient] = useState(false);
    const [questions, setQuestions] = useState(() => JSON.parse(JSON.stringify(allQuestions)));
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);
    const { toast } = useToast();
 
    useEffect(() => {
      setIsClient(true)
    }, []);

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const questionsByLevel = questions.reduce((acc: Record<string, Question[]>, q: Question) => {
        if (!acc[q.level]) {
            acc[q.level] = [];
        }
        acc[q.level].push(q);
        return acc;
    }, {} as Record<string, Question[]>);
    
    const handleEditClick = (level: string) => {
        const questionsToEdit = questionsByLevel[level] || [];
        setEditingLevel(level);
        setEditedQuestions(JSON.parse(JSON.stringify(questionsToEdit)));
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditedQuestions([]);
    };

    const handleSaveClick = () => {
        if (!editingLevel) return;

        setQuestions(currentQuestions => {
            const otherQuestions = currentQuestions.filter(q => q.level !== editingLevel);
            return [...otherQuestions, ...editedQuestions].sort((a, b) => parseFloat(a.level) - parseFloat(b.level));
        });

        toast({ title: "Questions saved!", description: `Changes for Level ${editingLevel} have been saved for this session.` });
        setEditingLevel(null);
        setEditedQuestions([]);
    };

    const handleQuestionChange = (qId: string, field: 'questionText' | 'explanation' | 'subject', value: string) => {
        setEditedQuestions(current => current.map(q => q.id === qId ? { ...q, [field]: value } : q));
    };

    const handleAnswerTextChange = (qId: string, ansIndex: number, text: string) => {
        setEditedQuestions(current => current.map(q => {
            if (q.id === qId) {
                const newAnswers = [...q.answers];
                newAnswers[ansIndex].text = text;
                return { ...q, answers: newAnswers };
            }
            return q;
        }));
    };
    
    const handleCorrectAnswerChange = (qId: string, ansIndex: number) => {
        setEditedQuestions(current => current.map(q => {
            if (q.id === qId) {
                const newAnswers = q.answers.map((ans, idx) => ({ ...ans, isCorrect: idx === ansIndex }));
                return { ...q, answers: newAnswers };
            }
            return q;
        }));
    };

    const handleRemoveAnswer = (qId: string, ansIndex: number) => {
        setEditedQuestions(current => current.map(q => {
            if (q.id === qId && q.answers.length > 2) {
                const newAnswers = q.answers.filter((_, idx) => idx !== ansIndex);
                 if (!newAnswers.some(a => a.isCorrect)) {
                    newAnswers[0].isCorrect = true;
                }
                return { ...q, answers: newAnswers };
            }
            return q;
        }));
    };
    
    const handleAddAnswer = (qId: string) => {
        setEditedQuestions(current => current.map(q => {
            if (q.id === qId) {
                const newAnswers = [...q.answers, { text: 'New Answer', isCorrect: false }];
                return { ...q, answers: newAnswers };
            }
            return q;
        }));
    };

    const handleAddQuestion = () => {
        if (!editingLevel) return;
        const newQuestion: Question = {
            id: `question-${Date.now()}`,
            level: editingLevel,
            subject: 'Bengali',
            questionText: 'New Question Text',
            answers: [
                { text: 'Correct Answer', isCorrect: true },
                { text: 'Incorrect Answer', isCorrect: false },
            ],
            explanation: 'New explanation.'
        };
        setEditedQuestions(current => [...current, newQuestion]);
    };
    
    const handleRemoveQuestion = (qId: string) => {
        setEditedQuestions(current => current.filter(q => q.id !== qId));
    };

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
                    {isClient ? <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
                        {allLevels.map((level) => {
                            const questionsForLevel = questionsByLevel[level] || [];
                            const isEditing = editingLevel === level;
                            return (
                                <AccordionItem value={`level-q-${level}`} key={level}>
                                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <span>
                                                Questions for Level: {level}
                                                <span className="text-sm font-normal text-muted-foreground ml-2">({questionsForLevel.length} questions)</span>
                                            </span>
                                            {!isEditing && (
                                                <div role="button"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(level); }}
                                                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "mr-4 h-8 px-3 flex items-center gap-2")}>
                                                    <Edit />
                                                    Edit
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {isEditing ? (
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div className="space-y-6 mb-6">
                                                    {editedQuestions.map((q, qIndex) => (
                                                        <Card key={q.id} className="p-4 relative">
                                                            <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-7 w-7 z-10" onClick={() => handleRemoveQuestion(q.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                            <div className="grid gap-4">
                                                                <div className="grid gap-2">
                                                                    <Label htmlFor={`qtext-${q.id}`}>Question {qIndex + 1}</Label>
                                                                    <Textarea id={`qtext-${q.id}`} value={q.questionText} onChange={(e) => handleQuestionChange(q.id, 'questionText', e.target.value)} />
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    <Label>Answers</Label>
                                                                    <RadioGroup value={q.answers.findIndex(a => a.isCorrect).toString()} onValueChange={(val) => handleCorrectAnswerChange(q.id, parseInt(val))}>
                                                                        {q.answers.map((ans, ansIndex) => (
                                                                            <div key={ansIndex} className="flex items-center gap-2">
                                                                                <RadioGroupItem value={ansIndex.toString()} id={`q-${q.id}-ans-${ansIndex}`} />
                                                                                <Input value={ans.text} onChange={(e) => handleAnswerTextChange(q.id, ansIndex, e.target.value)} />
                                                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveAnswer(q.id, ansIndex)} disabled={q.answers.length <= 2}>
                                                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </RadioGroup>
                                                                    <Button variant="outline" size="sm" onClick={() => handleAddAnswer(q.id)} className="mt-2">
                                                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
                                                                    </Button>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    <Label htmlFor={`exp-${q.id}`}>Explanation</Label>
                                                                    <Textarea id={`exp-${q.id}`} value={q.explanation} onChange={(e) => handleQuestionChange(q.id, 'explanation', e.target.value)} />
                                                                </div>
                                                                 <div className="grid gap-2">
                                                                    <Label htmlFor={`subject-${q.id}`}>Subject</Label>
                                                                    <select id={`subject-${q.id}`} value={q.subject} onChange={(e) => handleQuestionChange(q.id, 'subject', e.target.value as 'Bengali' | 'English')} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                                                        <option value="Bengali">Bengali</option>
                                                                        <option value="English">English</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                                 <Button variant="outline" onClick={handleAddQuestion} className="mb-4">
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add New Question
                                                </Button>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                    <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                </div>
                                            </div>
                                        ) : questionsForLevel.length > 0 ? (
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
