"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { currentUser } from '@/lib/auth';
import type { ExamResult, SubjectResult, Syllabus, Question, SyllabusTopic } from '@/lib/types';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { newBengaliLevel0Questions } from '@/lib/level-0-bengali-questions';
import { newEnglishLevel0Questions } from '@/lib/level-0-english-questions';


const TOTAL_TIME_PER_QUESTION = 15; // seconds

function ExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const level = searchParams.get('level') || '0.0';
  const firestore = useFirestore();

  const questionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'questions'), where('level', '==', level));
  }, [firestore, level]);

  // All available questions for the level
  const { data: allQuestions, loading: questionsLoading } = useCollection<Question>(questionsQuery);
  
  // The randomly selected subset of questions for this specific exam instance
  const [examQuestions, setExamQuestions] = useState<Question[] | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [syllabusQuery, setSyllabusQuery] = useState<any>(null);
  useEffect(() => {
      if (firestore) {
          setSyllabusQuery(query(collection(firestore, 'syllabi'), where('level', '==', level)));
      }
  }, [firestore, level]);

  const { data: userSyllabusArr } = useCollection<Syllabus>(syllabusQuery);
  const syllabus = userSyllabusArr?.[0];

  useEffect(() => {
    if (questionsLoading) return; // Don't run until Firestore query is complete

    let questionsToUse: Question[] = allQuestions || [];

    // Fallback for Level 0.0 if Firestore returns no questions
    if (level === '0.0' && questionsToUse.length === 0) {
      const localBengali = newBengaliLevel0Questions.map((q, i) => ({ ...q, id: `local-beng-${i}` }));
      const localEnglish = newEnglishLevel0Questions.map((q, i) => ({ ...q, id: `local-eng-${i}` }));
      questionsToUse = [...localBengali, ...localEnglish];
    }
    
    if (questionsToUse.length > 0) {
      
      const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      let selectedQuestions: Question[] = [];
      
      if (syllabus && Object.keys(syllabus.subjects).length > 0) {
        for (const subjectName in syllabus.subjects) {
          const subjectSyllabus = syllabus.subjects[subjectName];
          const questionsForSubject = questionsToUse.filter(q => q.subject === subjectName);
          const shuffled = shuffleArray([...questionsForSubject]);
          const questionsToTake = Math.min(subjectSyllabus.marks, shuffled.length);
          selectedQuestions.push(...shuffled.slice(0, questionsToTake));
        }
      } else {
        selectedQuestions = [...questionsToUse];
      }

      setExamQuestions(shuffleArray(selectedQuestions));
    } else {
      setExamQuestions([]);
    }
  }, [allQuestions, syllabus, level, questionsLoading]);


  useEffect(() => {
    // This effect initializes the exam state once the examQuestions are selected
    if (examQuestions) {
      setUserAnswers(Array(examQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
      setTimeLeft(examQuestions.length > 0 ? TOTAL_TIME_PER_QUESTION : 0);
      setSelectedOption(null);
    }
  }, [examQuestions]);
  
  const handleFinishExam = useCallback(() => {
    if (!examQuestions) {
      console.error("Exam questions not ready for level:", level);
      router.push('/dashboard/competition/exam/result');
      return;
    }

    let finalSyllabus = syllabus;
    // If syllabus doesn't exist, create a temporary one based on the questions in the exam
    if (!finalSyllabus || Object.keys(finalSyllabus.subjects).length === 0) {
        const subjects: { [subjectName: string]: SyllabusTopic } = {};
        const questionsBySubject: { [subjectName: string]: Question[] } = {};

        examQuestions.forEach(q => {
            if (!questionsBySubject[q.subject]) {
                questionsBySubject[q.subject] = [];
            }
            questionsBySubject[q.subject].push(q);
        });

        for (const subjectName in questionsBySubject) {
            subjects[subjectName] = {
                marks: questionsBySubject[subjectName].length, // Total marks is number of questions
                topics: []
            };
        }
        
        finalSyllabus = {
            level: level,
            subjects: subjects
        };
    }

    const subjectResults: SubjectResult[] = [];
    let totalObtainedMarks = 0;
    let totalMarks = 0;

    for (const subjectName in finalSyllabus.subjects) {
      const subjectQuestionsInExam = examQuestions.filter(q => q.subject === subjectName);
      
      if (subjectQuestionsInExam.length === 0) continue;

      let correctAnswers = 0;
      let incorrectAnswers = 0;

      subjectQuestionsInExam.forEach(q => {
        // Find the index of this question in the full examQuestions list to get the user's answer
        const questionIndex = examQuestions.findIndex(examQ => examQ.id === q.id);
        const userAnswer = userAnswers[questionIndex];
        if (userAnswer) { // if answered
            const correctAnswerText = q.answers.find(a => a.isCorrect)?.text;
            if (userAnswer === correctAnswerText) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
        }
      });
      
      // Each question is worth 1 mark, with a 0.5 deduction for wrong answers.
      // Total marks for the subject is the number of questions for that subject in the exam.
      const subjectTotalMarks = subjectQuestionsInExam.length;
      const obtainedMarks = (correctAnswers * 1) - (incorrectAnswers * 0.5);
      const obtainedMarksClamped = Math.max(0, obtainedMarks);
      const percentage = subjectTotalMarks > 0 ? (obtainedMarksClamped / subjectTotalMarks) * 100 : 0;
      
      subjectResults.push({
        subject: subjectName,
        totalMarks: subjectTotalMarks,
        obtainedMarks: parseFloat(obtainedMarksClamped.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status: percentage >= 60 ? 'Passed' : 'Failed'
      });

      totalObtainedMarks += obtainedMarksClamped;
      totalMarks += subjectTotalMarks;
    }

    const overallStatus = subjectResults.length > 0 && subjectResults.every(r => r.status === 'Passed') ? 'Passed' : 'Failed';
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

    // Clear registration status on exam completion
    sessionStorage.removeItem(`examRegistered_${level}`);
    sessionStorage.removeItem(`examRegistrationExpiry_${level}`);
    sessionStorage.removeItem(`notificationSent_${level}`);

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

  }, [level, examQuestions, userAnswers, router, syllabus]);

  const handleNext = useCallback(() => {
    if (!examQuestions) return;
    setSelectedOption(null);
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(TOTAL_TIME_PER_QUESTION);
    } else {
      handleFinishExam();
    }
  }, [currentQuestionIndex, examQuestions, handleFinishExam]);

  const currentQuestion = examQuestions ? examQuestions[currentQuestionIndex] : null;

  useEffect(() => {
    if (!examQuestions || examQuestions.length === 0 || !currentQuestion) return;

    if (timeLeft === 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, examQuestions, handleNext, currentQuestion]);


  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    setSelectedOption(answer);
  };
  
  const getFontSizeClass = (text: string) => {
    const length = text.length;
    if (length > 250) return 'text-sm'; 
    if (length > 150) return 'text-base';
    if (length > 70) return 'text-lg'; 
    return 'text-xl';
  };
  const fontSizeClass = getFontSizeClass(currentQuestion?.questionText || '');

  if (questionsLoading || !examQuestions) {
    return (
       <main className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <CardTitle>Preparing Your Exam...</CardTitle>
            </CardHeader>
            <CardContent>
                 <Skeleton className="h-4 w-3/4 mx-auto" />
                 <div className="mt-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
            </CardContent>
        </Card>
      </main>
    )
  }

  if (examQuestions.length === 0) {
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
              {currentQuestionIndex + 1} / {examQuestions.length}
            </span>
            <Progress value={(timeLeft / TOTAL_TIME_PER_QUESTION) * 100} className="w-full" />
            <span className="text-sm font-mono font-bold w-12 text-right">{timeLeft}s</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-36 flex items-center justify-start text-left p-2 mb-4 border-b">
            <p className={cn("font-medium", fontSizeClass)}>{currentQuestion?.questionText}</p>
          </div>
          <RadioGroup 
            value={userAnswers[currentQuestionIndex] || ''}
            onValueChange={handleAnswerSelect}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {currentQuestion?.answers.map((answer, index) => (
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
              {currentQuestionIndex < examQuestions.length - 1 ? 'Next Question' : 'Finish Exam'}
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
