"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { allQuestions } from '@/lib/questions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { allSyllabi } from '@/lib/syllabus';
import { currentUser } from '@/lib/auth';
import type { ExamResult, SubjectResult } from '@/lib/types';


const TOTAL_TIME_PER_QUESTION = 15; // seconds

function ExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const level = searchParams.get('level') || '0.0';

  const [questions, setQuestions] = useState(allQuestions.filter(q => q.level === level));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_PER_QUESTION);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const filteredQuestions = allQuestions.filter(q => q.level === level);
    setQuestions(filteredQuestions);
    setUserAnswers(Array(filteredQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setTimeLeft(TOTAL_TIME_PER_QUESTION);
    setSelectedOption(null);
  }, [level]);
  
  const handleFinishExam = useCallback(() => {
    const syllabus = allSyllabi.find(s => s.level === level);
    if (!syllabus) {
      console.error("Syllabus not found for level:", level);
      router.push('/dashboard/competition/exam/result');
      return;
    }

    const subjectResults: SubjectResult[] = [];
    let totalObtainedMarks = 0;
    let totalMarks = 0;

    for (const subjectName in syllabus.subjects) {
      const subjectSyllabus = syllabus.subjects[subjectName];
      const subjectQuestions = questions.filter(q => q.subject === subjectName);
      
      if (subjectQuestions.length === 0) continue;

      const marksPerQuestion = subjectSyllabus.marks / subjectQuestions.length;
      let correctAnswers = 0;
      let incorrectAnswers = 0;

      subjectQuestions.forEach(q => {
        const questionIndex = questions.findIndex(ques => ques.id === q.id);
        const userAnswer = userAnswers[questionIndex];
        if (userAnswer) {
            const correctAnswerText = q.answers.find(a => a.isCorrect)?.text;
            if (userAnswer === correctAnswerText) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
        }
      });
      
      const obtainedMarks = (correctAnswers * marksPerQuestion) - (incorrectAnswers * 0.5);
      const obtainedMarksClamped = Math.max(0, obtainedMarks);
      const percentage = (obtainedMarksClamped / subjectSyllabus.marks) * 100;
      
      subjectResults.push({
        subject: subjectName,
        totalMarks: subjectSyllabus.marks,
        obtainedMarks: parseFloat(obtainedMarksClamped.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status: percentage >= 60 ? 'Passed' : 'Failed'
      });

      totalObtainedMarks += obtainedMarksClamped;
      totalMarks += subjectSyllabus.marks;
    }

    const overallStatus = subjectResults.every(r => r.status === 'Passed') ? 'Passed' : 'Failed';
    const totalPercentage = totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;

    const newResult: ExamResult = {
        id: `result-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatarUrl: currentUser.avatarUrl,
        level: level,
        totalMarks: totalMarks,
        totalObtainedMarks: parseFloat(totalObtainedMarks.toFixed(2)),
        totalPercentage: parseFloat(totalPercentage.toFixed(2)),
        overallStatus: overallStatus,
        subjects: subjectResults,
        examDate: new Date().toISOString().split('T')[0],
    };

    sessionStorage.setItem('lastExamResult', JSON.stringify(newResult));

    if (overallStatus === 'Passed') {
        const [major, minor] = level.split('.').map(Number);
        let nextMajor = major;
        let nextMinor = minor + 1;
        if (nextMinor > 9) {
            nextMinor = 0;
            nextMajor = major + 1;
            if (nextMajor === 1) { // Skip level 1.x
                nextMajor = 2;
            }
        }
        const nextLevel = `${nextMajor}.${nextMinor}`;
        sessionStorage.setItem('currentUserLevel', nextLevel);
    }

    router.push('/dashboard/competition/exam/result');

  }, [level, questions, userAnswers, router]);

  const handleNext = useCallback(() => {
    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(TOTAL_TIME_PER_QUESTION);
    } else {
      handleFinishExam();
    }
  }, [currentQuestionIndex, questions.length, handleFinishExam]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (questions.length === 0) return;

    if (timeLeft === 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions.length, handleNext]);


  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    setSelectedOption(answer);
  };
  
  if (questions.length === 0) {
    const majorLevel = Math.floor(parseFloat(level));
    const examSchedules: { [key: number]: string } = {
        1: "Your exam will take place on Friday: 9 a.m. to 10 a.m.",
        2: "Your exam will take place on Friday: 10 a.m. to 11 a.m.",
        3: "Your exam will take place on Friday: 8 p.m. to 9 p.m.",
        4: "Your exam will take place on Friday: 9 p.m. to 10 p.m.",
        5: "Your exam will take place on Saturday: 9 a.m. to 10 a.m.",
        6: "Your exam will take place on Saturday: 10 a.m. to 11 a.m.",
        7: "Your exam will take place on Saturday: 8 p.m. to 9 p.m.",
        8: "Your exam will take place on Saturday: 9 p.m. to 10 p.m.",
        9: "Your exam will take place on Sunday: 8 p.m. to 9 p.m.",
        10: "Your exam will take place on Sunday: 9 p.m. to 10 p.m.",
        11: "Your exam will take place on Monday: 8 p.m. to 9 p.m.",
        12: "Your exam will take place on Monday: 9 p.m. to 10 p.m.",
        13: "Your exam will take place on Tuesday: 8 p.m. to 9 p.m.",
        14: "Your exam will take place on Tuesday: 9 p.m. to 10 p.m.",
        15: "Your exam will take place on Wednesday: 8 p.m. to 9 p.m.",
        16: "Your exam will take place on Wednesday: 9 p.m. to 10 p.m.",
        17: "Your exam will take place on Thursday: 8 p.m. to 9 p.m.",
        18: "Your exam will take place on Thursday: 9 p.m. to 10 p.m.",
        19: "Your exam will take place on Thursday: 10 p.m. to 11 p.m.",
    };
    const scheduleMessage = examSchedules[majorLevel];

    if (scheduleMessage) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle>Exam Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{scheduleMessage}</p>
                        <Button asChild className="mt-4"><Link href="/dashboard/competition">Back to Competition</Link></Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

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
