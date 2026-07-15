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


import { newBengaliLevel0Questions } from "@/lib/level-0-0-bengali-questions";
import { newEnglishLevel0Questions } from "@/lib/level-0-0-english-questions";
import { newBengaliLevel1Questions } from "@/lib/level-0-1-bengali-questions";
import { newEnglishLevel1Questions } from "@/lib/level-0-1-english-questions";
import { newBengaliLevel2Questions } from "@/lib/level-0-2-bengali-questions";
import { newEnglishLevel2Questions } from "@/lib/level-0-2-english-questions";
import { newBengaliLevel3Questions } from "@/lib/level-0-3-bengali-questions";
import { newEnglishLevel3Questions } from "@/lib/level-0-3-english-questions";
import { newBengaliLevel4Questions } from "@/lib/level-0-4-bengali-questions";
import { newEnglishLevel4Questions } from "@/lib/level-0-4-english-questions";
import { newBengaliLevel5Questions } from "@/lib/level-0-5-bengali-questions";
import { newEnglishLevel5Questions } from "@/lib/level-0-5-english-questions";
import { newBengaliLevel6Questions } from "@/lib/level-0-6-bengali-questions";
import { newEnglishLevel6Questions } from "@/lib/level-0-6-english-questions";
import { newBengaliLevel7Questions } from "@/lib/level-0-7-bengali-questions";
import { newEnglishLevel7Questions } from "@/lib/level-0-7-english-questions";
import { newBengaliLevel8Questions } from "@/lib/level-0-8-bengali-questions";
import { newEnglishLevel8Questions } from "@/lib/level-0-8-english-questions";
import { newBengaliLevel9Questions } from "@/lib/level-0-9-bengali-questions";
import { newEnglishLevel9Questions } from "@/lib/level-0-9-english-questions";




export default function AllQuestionsPage() {
  const firestore = useFirestore();
  
  // ক্লাউড ডাটাবেজ থেকে সরাসরি প্রশ্ন কুয়েরি করা
  const questionsQuery = useMemo(() => (firestore ? collection(firestore, 'questions') : null), [firestore]);
  const { data: questions, loading: questionsLoading } = useCollection<Question>(questionsQuery);

  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ ১. ২০০টি লেভেলের তালিকা সঠিকভাবে দশমিক স্ট্রিং তৈরি ("0.0" থেকে "19.9")
  const allLevels = useMemo(() => {
    const levels: string[] = [];
    for (let i = 0; i <= 19; i++) {
      for (let j = 0; j <= 9; j++) {
        levels.push(`${i}.${j}`); // ব্যাকটিক সিনট্যাক্স ঠিক করা হলো
      }
    }
    return levels;
  }, []);

  // ✅ ২. ডাটাবেজ থেকে আসা প্রশ্নগুলোকে দশমিক লেভেল অনুযায়ী নিখুঁত গ্রুপ করা
  const questionsByLevel = useMemo(() => {
    if (!questions) return {};
    const groups: Record<string, Question[]> = {};

    questions.forEach((q: any) => {
      if (!q) return;
      
      // ডাটাবেজের পিওর স্ট্রিং লেভেলকে কোনো রূপান্তর ছাড়া সরাসরি রিড করা
      const safeLevel = q.level ? String(q.level).trim() : "0.0";

      if (!groups[safeLevel]) {
        groups[safeLevel] = [];
      }

      // answers অবজেক্ট ফরম্যাটকে অ্যারেতে রূপান্তর করার লজিক
      let formattedAnswers = Array.isArray(q.answers) ? [...q.answers] : [];
      if (formattedAnswers.length === 0) {
        const optionKeys = ['0', '1', '2', '3'];
        optionKeys.forEach((key) => {
          if (q[key]) {
            formattedAnswers.push({
              text: q[key].text || q[key].test || "",
              isCorrect: q[key].isCorrect === true || q[key].isCorrect === 'true' || false
            });
          }
        });
      }

      const standardizedQuestion = {
        ...q,
        id: q.id || `q-missing-${Date.now()}-${Math.random()}`,
        level: safeLevel,
        subject: q.subject || "English",
        questionText: q.questionText || "",
        answers: formattedAnswers
      };

      // ডুপ্লিকেট আইডি এড়ানো নিশ্চিত করা
      if (!groups[safeLevel].some(existingQ => existingQ.id === standardizedQuestion.id)) {
        groups[safeLevel].push(standardizedQuestion);
      }
    });

    return groups;
  }, [questions]);

  // ✅ ৩. এডিট বাটনে ক্লিক করার ডাইনামিক ফাংশন
  const handleEditClick = (level: string) => {
    const targetLevelStr = String(level).trim();
    let questionsToEdit = JSON.parse(JSON.stringify(questionsByLevel[targetLevelStr] || []));

    questionsToEdit.forEach((q: Question) => {
      if (!q.answers) q.answers = [];
      while (q.answers.length < 4) {
        q.answers.push({ text: 'New Answer', isCorrect: false });
      }
    });

    setEditingLevel(level);
    setEditedQuestions(questionsToEdit);
  };




    const handleCancelClick = () => { setEditingLevel(null); setEditedQuestions([]); };

  const handleSaveClick = async () => {
    if (!editingLevel || !firestore) return;
    const targetLevelStr = parseFloat(editingLevel).toFixed(1);
    const originalQuestions = questions?.filter(q => {
      const qLevelStr = q.level ? parseFloat(String(q.level)).toFixed(1) : "0.0";
      return qLevelStr === targetLevelStr;
    }) || [];

    try {
      let deleteBatch = writeBatch(firestore);
      let deleteCount = 0;
      originalQuestions.forEach(ogQuestion => {
        if (!editedQuestions.find(edQuestion => edQuestion.id === ogQuestion.id)) {
          deleteBatch.delete(doc(firestore, "questions", ogQuestion.id));
          deleteCount++;
          if (deleteCount === 400) { deleteBatch.commit(); deleteBatch = writeBatch(firestore); deleteCount = 0; }
        }
      });
      if (deleteCount > 0) await deleteBatch.commit();

      let saveBatch = writeBatch(firestore);
      let saveCount = 0;
      for (const question of editedQuestions) {
        const { id, ...questionData } = question;
        questionData.level = targetLevelStr; // ফায়ারস্টোরে পিওর স্ট্রিং "0.0" হিসেবে সিঙ্ক
        saveBatch.set(doc(firestore, "questions", id), questionData);
        saveCount++;
        if (saveCount === 400) { await saveBatch.commit(); saveBatch = writeBatch(firestore); saveCount = 0; }
      }
      if (saveCount > 0) await saveBatch.commit();
      toast({ title: "Questions saved!", description: `Changes for Level ${targetLevelStr} have been saved.` });
    } catch (serverError) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'questions', operation: 'write', requestResourceData: editedQuestions }));
    } finally { setEditingLevel(null); setEditedQuestions([]); }
  };


    const handleQuestionChange = (qId: string, field: 'questionText', value: string) => {
    setEditedQuestions(current => current.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };
  const handleAnswerTextChange = (qId: string, ansIndex: number, text: string) => {
    setEditedQuestions(current => current.map(q => {
      if (q.id === qId) { const newAnswers = [...q.answers]; newAnswers[ansIndex] = { ...newAnswers[ansIndex], text: text }; return { ...q, answers: newAnswers }; }
      return q;
    }));
  };
  const handleCorrectAnswerChange = (qId: string, ansIndex: number) => {
    setEditedQuestions(current => current.map(q => {
      if (q.id === qId) { const newAnswers = q.answers.map((ans, idx) => ({ ...ans, isCorrect: idx === ansIndex })); return { ...q, answers: newAnswers }; }
      return q;
    }));
  };
  const handleRemoveAnswer = (qId: string, ansIndex: number) => {
    setEditedQuestions(current => current.map(q => {
      if (q.id === qId && q.answers.length > 4) {
        let newAnswers = q.answers.filter((_, idx) => idx !== ansIndex);
        if (!newAnswers.some(a => a.isCorrect) && newAnswers.length > 0) { newAnswers[0].isCorrect = true; }
        return { ...q, answers: newAnswers };
      }
      return q;
    }));
  };
  const handleAddAnswer = (qId: string) => {
    setEditedQuestions(current => current.map(q => (q.id === qId ? { ...q, answers: [...q.answers, { text: 'New Answer', isCorrect: false }] } : q)));
  };
  const handleAddQuestion = (subject: 'Bengali' | 'English') => {
    if (!editingLevel) return;
    setEditedQuestions(current => [...current, { id: `question-${Date.now()}`, level: parseFloat(editingLevel).toFixed(1), subject: subject, questionText: 'New Question Text', answers: [{ text: 'Correct Answer', isCorrect: true }, { text: 'Incorrect Answer 1', isCorrect: false }, { text: 'Incorrect Answer 2', isCorrect: false }, { text: 'Incorrect Answer 3', isCorrect: false }] }]);
  };
  const handleRemoveQuestion = (qId: string) => { setEditedQuestions(current => current.filter(q => q.id !== qId)); };


    return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4"><Button asChild variant="ghost"><Link href="/dashboard/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel</Link></Button></div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline"><ListChecks className="w-8 h-8 text-primary" /> All Questions</CardTitle>
          <CardDescription>All available questions are visible to admins for review, grouped by level.</CardDescription>
        </CardHeader>
        <CardContent>
          {(questionsLoading || !isClient) ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : (
            <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
              {allLevels.map((level) => {
                const targetLevelStr = parseFloat(level).toFixed(1);
                const questionsForLevel = questionsByLevel[targetLevelStr] || [];
                const isEditing = editingLevel === level;
                return (
                  <AccordionItem value={`level-q-${level}`} key={level}>
                    <AccordionTrigger className="text-left font-semibold hover:no-underline center w-full">
                      <div className="flex justify-between items-center w-full">
                        <span>Questions for Level: {targetLevelStr}<span className="text-sm font-normal text-muted-foreground ml-2">({questionsForLevel.length} questions)</span></span>
                        {!isEditing && <div role="button" onClick={(e) => { e.stopPropagation(); handleEditClick(level); }} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "mr-4 h-8 px-3 flex items-center gap-2")}><Edit className="w-4 h-4" /> Edit</div>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {isEditing ? (
                        <div className="p-4 bg-muted/50 rounded-lg space-y-8">
                          {/* Bengali Form */}
                          <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Bengali Questions</h3>
                            <div className="space-y-6 mb-6">
                              {editedQuestions.filter(q => q.subject === 'Bengali').map((q, qIndex) => (
                                <Card key={q.id} className="p-4 relative">
                                  <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-7 w-7 z-10" onClick={() => handleRemoveQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                                  <div className="grid gap-4">
                                    <div className="grid gap-2"><Label htmlFor={`qtext-${q.id}`}>Question {qIndex + 1}</Label><Textarea id={`qtext-${q.id}`} value={q.questionText} onChange={(e) => handleQuestionChange(q.id, 'questionText', e.target.value)} /></div>
                                    <div className="grid gap-2"><Label>Answers</Label><RadioGroup value={q.answers.findIndex(a => a.isCorrect).toString()} onValueChange={(val) => handleCorrectAnswerChange(q.id, parseInt(val))}>{q.answers.map((ans, ansIndex) => (<div key={ansIndex} className="flex items-center gap-2"><RadioGroupItem value={ansIndex.toString()} id={`q-${q.id}-ans-${ansIndex}`} /><Input value={ans.text} onChange={(e) => handleAnswerTextChange(q.id, ansIndex, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => handleRemoveAnswer(q.id, ansIndex)} disabled={q.answers.length <= 4}> <Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}</RadioGroup><Button variant="outline" size="sm" onClick={() => handleAddAnswer(q.id)} className="mt-2 w-max"><PlusCircle className="mr-2 h-4 w-4" /> Add Answer</Button></div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                            <Button variant="outline" onClick={() => handleAddQuestion('Bengali')} className="mb-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Bengali Question</Button>
                          </div>
                          {/* English Form */}
                          <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">English Questions</h3>
                            <div className="space-y-6 mb-6">
                              {editedQuestions.filter(q => q.subject === 'English').map((q, qIndex) => (
                                <Card key={q.id} className="p-4 relative">
                                  <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-7 w-7 z-10" onClick={() => handleRemoveQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                                  <div className="grid gap-4">
                                    <div className="grid gap-2"><Label htmlFor={`qtext-${q.id}`}>Question {qIndex + 1}</Label><Textarea id={`qtext-${q.id}`} value={q.questionText} onChange={(e) => handleQuestionChange(q.id, 'questionText', e.target.value)} /></div>
                                    <div className="grid gap-2"><Label>Answers</Label><RadioGroup value={q.answers.findIndex(a => a.isCorrect).toString()} onValueChange={(val) => handleCorrectAnswerChange(q.id, parseInt(val))}>{q.answers.map((ans, ansIndex) => (<div key={ansIndex} className="flex items-center gap-2"><RadioGroupItem value={ansIndex.toString()} id={`q-${q.id}-ans-${ansIndex}`} /><Input value={ans.text} onChange={(e) => handleAnswerTextChange(q.id, ansIndex, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => handleRemoveAnswer(q.id, ansIndex)} disabled={q.answers.length <= 4}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}</RadioGroup><Button variant="outline" size="sm" onClick={() => handleAddAnswer(q.id)} className="mt-2 w-max"><PlusCircle className="mr-2 h-4 w-4" /> Add Answer</Button></div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                            <Button variant="outline" onClick={() => handleAddQuestion('English')} className="mb-4"><PlusCircle className="mr-2 h-4 w-4" /> Add English Question</Button>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 border-t pt-4"><Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" /> Cancel</Button><Button onClick={handleSaveClick} className="bg-green-600 hover:bg-green-700 text-white"><Save className="mr-2 h-4 w-4" /> Save Changes</Button></div>
                        </div>
                      ) : (
                        <div className="px-4 py-2 space-y-4">
                          <div>
                            <h4 className="text-md font-semibold mt-2 mb-1 border-b pb-1 text-primary">Bengali Questions List</h4>
                            {questionsForLevel.filter(q => q.subject === 'Bengali').length > 0 ? (
                              <Accordion type="multiple" className="w-full">
                                {questionsForLevel.filter(q => q.subject === 'Bengali').map((q, index) => (
                                  <AccordionItem value={`item-${level}-beng-${index}`} key={q.id}>
                                    <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                    <AccordionContent><ul className="list-disc pl-5 mt-2 space-y-2 text-sm">{q.answers.map((ans, ansIndex) => (<li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>{ans.text} {ans.isCorrect && "✓"}</li>))}</ul></AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : ( <p className="text-muted-foreground text-sm py-2">No Bengali questions defined for this level.</p> )}
                          </div>
                          <div>
                            <h4 className="text-md font-semibold mt-4 mb-1 border-b pb-1 text-primary">English Questions List</h4>
                            {questionsForLevel.filter(q => q.subject === 'English').length > 0 ? (
                              <Accordion type="multiple" className="w-full">
                                {questionsForLevel.filter(q => q.subject === 'English').map((q, index) => (
                                  <AccordionItem value={`item-${level}-eng-${index}`} key={q.id}>
                                    <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                    <AccordionContent><ul className="list-disc pl-5 mt-2 space-y-2 text-sm">{q.answers.map((ans, ansIndex) => (<li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>{ans.text} {ans.isCorrect && "✓"}</li>))}</ul></AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : ( <p className="text-muted-foreground text-sm py-2">No English questions defined for this level.</p> )}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
