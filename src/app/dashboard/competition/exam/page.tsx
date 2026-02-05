"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { allQuestions } from '@/lib/questions';
import { allSyllabi } from '@/lib/syllabus';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TOTAL_TIME_PER_QUESTION = 15; // seconds

function ExamContent() {
  const searchParams = useSearchParams();
  const level = searchParams.get('level') || '0.0';

  const [questions, setQuestions] = useState(allQuestions.filter(q => q.level === level));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_PER_QUESTION);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const filteredQuestions = allQuestions.filter(q => q.level === level);
    setQuestions(filteredQuestions);
    setUserAnswers(Array(filteredQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setTimeLeft(TOTAL_TIME_PER_QUESTION);
    setSelectedOption(null);
  }, [level]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (showResults || questions.length === 0) return;

    if (timeLeft === 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults, questions.length]);

  const handleNext = () => {
    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(TOTAL_TIME_PER_QUESTION);
    } else {
      setShowResults(true);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    setSelectedOption(answer);
  };
  
  const calculateResults = () => {
      const syllabus = allSyllabi.find(s => s.level === level);
      if (!syllabus) return null;

      const subjectResults = Object.keys(syllabus.subjects).map(subjectName => {
          const subjectQuestions = questions.filter(q => q.subject === subjectName);
          
          let obtainedMarks = 0;
          subjectQuestions.forEach(q => {
              const questionIndex = questions.findIndex(originalQ => originalQ.id === q.id);
              if (questionIndex !== -1) {
                const correctAnswer = q.answers.find(a => a.isCorrect)?.text;
                if (userAnswers[questionIndex] === correctAnswer) {
                    obtainedMarks++;
                }
              }
          });
          
          const questionBasedTotalMarks = subjectQuestions.length;
          const percentage = questionBasedTotalMarks > 0 ? (obtainedMarks / questionBasedTotalMarks) * 100 : 0;
          const status = percentage >= 60 ? 'Passed' : 'Failed';

          return {
              subject: subjectName,
              totalMarks: questionBasedTotalMarks,
              obtainedMarks,
              percentage,
              status
          };
      });

      const totalObtainedMarks = subjectResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
      const totalMarks = subjectResults.reduce((sum, r) => sum + r.totalMarks, 0);
      const totalPercentage = totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;
      
      const overallStatus = subjectResults.some(r => r.status === 'Failed') ? 'Failed' : 'Passed';

      return {
          subjects: subjectResults,
          total: {
              totalMarks,
              obtainedMarks: totalObtainedMarks,
              percentage: totalPercentage,
              status: overallStatus,
          }
      };
  };

  if (questions.length === 0) {
    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle>Exam Not Ready</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">There are currently no questions available for Level {level}. Please check back later.</p>
                    <Button asChild className="mt-4"><Link href="/dashboard/competition">Back to Competition</Link></Button>
                </CardContent>
            </Card>
        </main>
    );
  }

  if (showResults) {
    const results = calculateResults();
    
    if (!results) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Could not load exam results. Syllabus not found for Level {level}.</p>
                        <Button asChild className="mt-4"><Link href="/dashboard/competition">Back to Competition</Link></Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const { subjects, total } = results;
    const isOverallPassed = total.status === 'Passed';

    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-4xl text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center justify-center gap-3">
                        Your Exam Result of Level: {level}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-yellow-300 hover:bg-yellow-300">
                                    <TableHead className="font-bold text-black">Subject</TableHead>
                                    <TableHead className="font-bold text-black text-center">Total Marks</TableHead>
                                    <TableHead className="font-bold text-black text-center">Obtained Mark</TableHead>
                                    <TableHead className="font-bold text-black text-center">Percentage</TableHead>
                                    <TableHead className="font-bold text-black text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subjectResult) => (
                                    <TableRow key={subjectResult.subject}>
                                        <TableCell className="font-medium text-left">{subjectResult.subject}:</TableCell>
                                        <TableCell className="text-center">{subjectResult.totalMarks}</TableCell>
                                        <TableCell className="text-center">{subjectResult.obtainedMarks}</TableCell>
                                        <TableCell className="text-center">{subjectResult.percentage.toFixed(0)}%</TableCell>
                                        <TableCell 
                                            className={cn(
                                                "text-center font-bold",
                                                subjectResult.status === 'Passed' ? 'text-green-600' : 'text-red-600'
                                            )}
                                        >
                                            {subjectResult.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-muted hover:bg-muted">
                                    <TableCell className="text-left">Total:</TableCell>
                                    <TableCell className="text-center">{total.totalMarks} Marks</TableCell>
                                    <TableCell className="text-center">{total.obtainedMarks}</TableCell>
                                    <TableCell className="text-center">{total.percentage.toFixed(0)}%</TableCell>
                                    <TableCell 
                                        className={cn(
                                            "text-center font-bold",
                                            isOverallPassed ? 'text-green-600' : 'text-red-600'
                                        )}
                                    >
                                        {total.status}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {!isOverallPassed && total.percentage >= 60 && (
                        <p className="text-red-600 font-medium text-sm">
                            Though the total marks is more than 60% but the individual sector couldn't fulfill the requirement of passing percentage.
                        </p>
                    )}
                    
                    <div className="flex gap-4 justify-center">
                        <Button asChild><Link href="/dashboard/competition">Back to Competition</Link></Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="font-headline text-center">Level: {level} Exam</CardTitle>
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-mono whitespace-nowrap">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <Progress value={(timeLeft / TOTAL_TIME_PER_QUESTION) * 100} className="w-full" />
            <span className="text-sm font-mono font-bold w-12 text-right">{timeLeft}s</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <p className="text-center font-medium">{currentQuestion.questionText}</p>
          </div>
          <RadioGroup 
            value={userAnswers[currentQuestionIndex] || ''}
            onValueChange={handleAnswerSelect}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {currentQuestion.answers.map((answer, index) => (
              <div key={index}>
                <RadioGroupItem value={answer.text} id={`r${index}`} className="peer sr-only" />
                <Label 
                  htmlFor={`r${index}`}
                  className={cn(
                    "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 text-center hover:bg-accent hover:text-accent-foreground cursor-pointer text-base",
                     selectedOption === answer.text
                        ? "bg-orange-400 border-orange-500 text-white"
                        : "peer-data-[state=checked]:bg-accent peer-data-[state=checked]:border-accent peer-data-[state=checked]:text-accent-foreground"
                  )}
                >
                  {answer.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-end mt-6 gap-2">
            <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
              Skip
            </Button>
            <Button onClick={handleNext} disabled={!userAnswers[currentQuestionIndex]}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="h-[500px] w-full max-w-2xl" />
      </main>
    }>
      <ExamContent />
    </Suspense>
  );
}
