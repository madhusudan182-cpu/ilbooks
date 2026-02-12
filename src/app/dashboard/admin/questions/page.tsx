'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { ListChecks, ArrowLeft, Edit, Save, X, PlusCircle, Trash2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import { newBengaliLevel0Questions } from "@/lib/level-0-bengali-questions";
import { newEnglishLevel0Questions } from "@/lib/level-0-english-questions";

export default function AllQuestionsPage() {
    const firestore = useFirestore();
    const questionsQuery = useMemo(() => (firestore ? collection(firestore, 'questions') : null), [firestore]);
    const { data: questions, loading: questionsLoading } = useCollection<Question>(questionsQuery);
    
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);
    const { toast } = useToast();
 
    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const questionsByLevel = useMemo(() => questions?.reduce((acc: Record<string, Question[]>, q: Question) => {
        if (!acc[q.level]) {
            acc[q.level] = [];
        }
        acc[q.level].push(q);
        return acc;
    }, {} as Record<string, Question[]>) || {}, [questions]);
    
    const handleEditClick = (level: string) => {
        let questionsToEdit = JSON.parse(JSON.stringify(questionsByLevel[level] || []));
        
        if (level === '0.0') {
            // Bengali questions
            const existingBengaliTexts = new Set(questionsToEdit.filter((q: Question) => q.subject === 'Bengali').map((q: Question) => q.questionText));
            const bengaliQuestionsToAdd = newBengaliLevel0Questions
                .filter(newQ => !existingBengaliTexts.has(newQ.questionText))
                .map((q, index) => ({
                    ...q,
                    id: `new-bengali-question-${Date.now()}-${index}`
                }));
            questionsToEdit.push(...bengaliQuestionsToAdd);

            // English questions
            const existingEnglishTexts = new Set(questionsToEdit.filter((q: Question) => q.subject === 'English').map((q: Question) => q.questionText));
            const englishQuestionsToAdd = newEnglishLevel0Questions
                .filter(newQ => !existingEnglishTexts.has(newQ.questionText))
                .map((q, index) => ({
                    ...q,
                    id: `new-english-question-${Date.now()}-${index}`
                }));
            questionsToEdit.push(...englishQuestionsToAdd);
        }

        questionsToEdit.forEach((q: Question) => {
            while (q.answers.length < 4) {
                q.answers.push({ text: 'New Answer', isCorrect: false });
            }
        });

        setEditingLevel(level);
        setEditedQuestions(questionsToEdit);
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditedQuestions([]);
    };

    const handleSaveClick = async () => {
        if (!editingLevel || !firestore) return;

        const originalQuestions = questions?.filter(q => q.level === editingLevel) || [];
        const batch = writeBatch(firestore);

        // Questions to delete
        originalQuestions.forEach(ogQuestion => {
            if (!editedQuestions.find(edQuestion => edQuestion.id === ogQuestion.id)) {
                batch.delete(doc(firestore, "questions", ogQuestion.id));
            }
        });

        // Questions to add or update
        editedQuestions.forEach(question => {
            const { id, ...questionData } = question;
            const docRef = doc(firestore, "questions", id);
            batch.set(docRef, questionData);
        });
        
        try {
            await batch.commit();
            toast({ title: "Questions saved!", description: `Changes for Level ${editingLevel} have been saved permanently.` });
        } catch (serverError) {
            console.error("Error saving questions:", serverError);
            const permissionError = new FirestorePermissionError({
                path: 'questions',
                operation: 'write',
                requestResourceData: editedQuestions
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Uh oh! Something went wrong.",
                description: "Could not save questions. Please try again.",
                variant: "destructive",
            });
        } finally {
            setEditingLevel(null);
            setEditedQuestions([]);
        }
    };

    const handleQuestionChange = (qId: string, field: 'questionText', value: string) => {
        setEditedQuestions(current => current.map(q => q.id === qId ? { ...q, [field]: value } : q));
    };

    const handleAnswerTextChange = (qId: string, ansIndex: number, text: string) => {
        setEditedQuestions(current => current.map(q => {
            if (q.id === qId) {
                const newAnswers = [...q.answers];
                newAnswers[ansIndex] = { ...newAnswers[ansIndex], text: text };
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
            if (q.id === qId && q.answers.length > 4) {
                let newAnswers = q.answers.filter((_, idx) => idx !== ansIndex);
                 if (!newAnswers.some(a => a.isCorrect) && newAnswers.length > 0) {
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

    const handleAddQuestion = (subject: 'Bengali' | 'English') => {
        if (!editingLevel) return;
        const newQuestion: Question = {
            id: `question-${Date.now()}`,
            level: editingLevel,
            subject: subject,
            questionText: 'New Question Text',
            answers: [
                { text: 'Correct Answer', isCorrect: true },
                { text: 'Incorrect Answer 1', isCorrect: false },
                { text: 'Incorrect Answer 2', isCorrect: false },
                { text: 'Incorrect Answer 3', isCorrect: false },
            ],
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
                    {questionsLoading ? (
                         <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
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
                                                {/* Bengali Questions */}
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Bengali Questions</h3>
                                                    <div className="space-y-6 mb-6">
                                                        {editedQuestions.filter(q => q.subject === 'Bengali').map((q, qIndex) => (
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
                                                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAnswer(q.id, ansIndex)} disabled={q.answers.length <= 4}>
                                                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </RadioGroup>
                                                                        <Button variant="outline" size="sm" onClick={() => handleAddAnswer(q.id)} className="mt-2">
                                                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                    <Button variant="outline" onClick={() => handleAddQuestion('Bengali')} className="mb-4">
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Add Bengali Question
                                                    </Button>
                                                </div>

                                                {/* English Questions */}
                                                <div>
                                                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">English Questions</h3>
                                                    <div className="space-y-6 mb-6">
                                                        {editedQuestions.filter(q => q.subject === 'English').map((q, qIndex) => (
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
                                                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAnswer(q.id, ansIndex)} disabled={q.answers.length <= 4}>
                                                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </RadioGroup>
                                                                        <Button variant="outline" size="sm" onClick={() => handleAddAnswer(q.id)} className="mt-2">
                                                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                    <Button variant="outline" onClick={() => handleAddQuestion('English')} className="mb-4">
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Add English Question
                                                    </Button>
                                                </div>

                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                    <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                </div>
                                            </div>
                                        ) : questionsForLevel.length > 0 ? (
                                            <div className="px-4">
                                                <div>
                                                    <h4 className="text-md font-semibold mt-2 mb-1 border-b pb-1">Bengali</h4>
                                                    {questionsForLevel.filter(q => q.subject === 'Bengali').length > 0 ? (
                                                        <Accordion type="multiple" className="w-full">
                                                            {questionsForLevel.filter(q => q.subject === 'Bengali').map((q, index) => (
                                                                <AccordionItem value={`item-${level}-beng-${index}`} key={q.id}>
                                                                    <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                                                            {q.answers.map((ans, ansIndex) => (
                                                                                <li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>
                                                                                    {ans.text}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    ) : (
                                                        <p className="text-muted-foreground text-sm py-4">No Bengali questions defined for this level.</p>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    <h4 className="text-md font-semibold mt-2 mb-1 border-b pb-1">English</h4>
                                                    {questionsForLevel.filter(q => q.subject === 'English').length > 0 ? (
                                                        <Accordion type="multiple" className="w-full">
                                                            {questionsForLevel.filter(q => q.subject === 'English').map((q, index) => (
                                                                <AccordionItem value={`item-${level}-eng-${index}`} key={q.id}>
                                                                    <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                                                            {q.answers.map((ans, ansIndex) => (
                                                                                <li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>
                                                                                    {ans.text}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    ) : (
                                                        <p className="text-muted-foreground text-sm py-4">No English questions defined for this level.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm py-4 px-4">No questions defined for this level.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>}
                </CardContent>
            </Card>
        </div>
    );
}
