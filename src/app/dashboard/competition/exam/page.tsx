
"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExamResult, SubjectResult, Syllabus, Question, User as UserProfile } from '@/lib/types';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { newBengaliLevel0Questions } from '@/lib/level-0-bengali-questions';
import { newEnglishLevel0Questions } from '@/lib/level-0-english-questions';
import { examSchedules, examHolds } from '@/lib/exam-schedule';


const TOTAL_TIME_PER_QUESTION = 15; // seconds

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


function ExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelStr = searchParams.get('level') || '0.0';
  const firestore = useFirestore();
  const { user } = useUser();
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isLevelZero = levelStr === '0.0';
  const majorLevel = parseInt(levelStr.split('.')[0], 10);

  useEffect(() => {
    if (examHolds[levelStr]) {
        router.replace('/dashboard/competition/exam-held');
    }
  }, [levelStr, router]);

  const questionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'questions'), where('level', '==', levelStr));
  }, [firestore, levelStr]);

  const { data: allQuestionsFromDB, loading: questionsLoading } = useCollection<Question>(questionsQuery);
  
  const syllabusQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'syllabi'), where('level', '==', levelStr));
  }, [firestore, levelStr]);

  const { data: userSyllabusArr, loading: syllabusLoading } = useCollection<Syllabus>(syllabusQuery);
  const syllabus = userSyllabusArr?.[0];
  
  const [examQuestions, setExamQuestions] = useState<Question[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    // This is the special path for Level 0.0, which is always self-contained.
    if (isLevelZero) {
        const bengali = shuffleArray([...newBengaliLevel0Questions]).map((q, i) => ({ ...q, id: `b-local-${Date.now()}-${i}` })).slice(0, 10);
        const english = shuffleArray([...newEnglishLevel0Questions]).map((q, i) => ({ ...q, id: `e-local-${Date.now()}-${i}` })).slice(0, 10);
        const finalQuestions = shuffleArray([...bengali, ...english]).map(q => ({
          ...q,
          answers: shuffleArray([...q.answers])
        }));
        setExamQuestions(finalQuestions);
        return; // Exit early
    }

    // For any other level, wait for data to load
    if (questionsLoading || syllabusLoading) {
      return; 
    }
  
    let questionPool: Question[] | null = null;
  
    // Use DB questions if they exist. For non-0.0 levels, this is the only source.
    if (allQuestionsFromDB && allQuestionsFromDB.length > 0) {
      questionPool = allQuestionsFromDB;
    } else {
      setExamQuestions([]); // No questions found in DB for this level
      return;
    }
  
    let finalQuestions: Question[] = [];
    const syllabusToUse = syllabus && Object.keys(syllabus.subjects).length > 0 ? syllabus : null;
  
    if (syllabusToUse) {
      // A syllabus IS defined, so we follow it.
      const tempFinalQuestions: Question[] = [];
      for (const subjectNameWithColon in syllabusToUse.subjects) {
        const subjectSyllabus = syllabusToUse.subjects[subjectNameWithColon];
        const subjectName = subjectNameWithColon.trim().replace(/:$/, '').trim();
        const questionsForSubject = questionPool.filter(q => q.subject === subjectName);
        
        // Use available questions, even if fewer than the syllabus requires
        const questionsToTake = Math.min(questionsForSubject.length, subjectSyllabus.marks);
  
        if (questionsToTake < subjectSyllabus.marks) {
          console.warn(`Not enough questions for subject "${subjectName}" for level ${levelStr}. Required: ${subjectSyllabus.marks}, Available: ${questionsForSubject.length}. Using available questions.`);
        }
  
        if (questionsToTake > 0) {
          const shuffled = shuffleArray([...questionsForSubject]);
          tempFinalQuestions.push(...shuffled.slice(0, questionsToTake));
        }
      }
      finalQuestions = tempFinalQuestions;
    } else if (questionPool && questionPool.length > 0) {
      // NO syllabus is defined, but questions EXIST. Build a default exam.
      const questionsBySubject: Record<string, Question[]> = {};
      questionPool.forEach(q => {
        if (!questionsBySubject[q.subject]) questionsBySubject[q.subject] = [];
        questionsBySubject[q.subject].push(q);
      });
  
      for (const subjectName in questionsBySubject) {
        const shuffled = shuffleArray(questionsBySubject[subjectName]);
        const questionsToTake = Math.min(10, shuffled.length); // Default to 10 questions
        finalQuestions.push(...shuffled.slice(0, questionsToTake));
      }
    }
  
    const questionsWithShuffledAnswers = shuffleArray(finalQuestions).map(q => ({
        ...q,
        answers: shuffleArray([...q.answers])
    }));

    setExamQuestions(questionsWithShuffledAnswers);
  
  }, [isLevelZero, allQuestionsFromDB, syllabus, questionsLoading, syllabusLoading, levelStr]);


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
    if (!examQuestions || examQuestions.length === 0 || !user || !firestore || !profile) {
      router.push('/dashboard/competition/exam/result');
      return;
    }

    const questionsBySubject: Record<string, Question[]> = {};
    examQuestions.forEach(q => {
        if (!questionsBySubject[q.subject]) {
            questionsBySubject[q.subject] = [];
        }
        questionsBySubject[q.subject].push(q);
    });

    const subjectResults: SubjectResult[] = [];
    let totalObtainedMarks = 0;
    let totalMarks = 0;

    for (const subjectName in questionsBySubject) {
        const subjectQuestionsInExam = questionsBySubject[subjectName];
        
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        subjectQuestionsInExam.forEach(q => {
            const questionIndex = examQuestions.findIndex(examQ => examQ.id === q.id);
            if (questionIndex === -1) return;

            const userAnswer = userAnswers[questionIndex];
            const correctAnswerText = q.answers.find(a => a.isCorrect)?.text;

            if (userAnswer) {
                if (userAnswer === correctAnswerText) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            }
        });
        
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

    // Progression Logic: If passed, upgrade level in Firestore
    if (overallStatus === 'Passed') {
        const currentLevelNum = profile.level || 0;
        const major = Math.floor(currentLevelNum);
        const minor = Math.round((currentLevelNum - major) * 10);
        
        let nextMajor = major;
        let nextMinor = minor + 1;
        
        if (nextMinor > 9) {
            nextMajor++;
            nextMinor = 0;
        }
        
        // Skip level 1.x as per user requirement
        if (nextMajor === 1) {
            nextMajor = 2;
            nextMinor = 0;
        }
        
        const nextLevel = parseFloat((nextMajor + (nextMinor / 10)).toFixed(1));
        
        // Update user's level in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        updateDoc(userRef, { level: nextLevel });
    }

    const newResult: ExamResult = {
        id: `result-${Date.now()}`,
        userId: user.uid,
        userName: profile.name,
        userAvatarUrl: profile.avatarUrl,
        level: levelStr,
        totalMarks: totalMarks,
        totalObtainedMarks: parseFloat(totalObtainedMarks.toFixed(2)),
        totalPercentage: parseFloat(totalPercentage.toFixed(2)),
        overallStatus: overallStatus,
        subjects: subjectResults,
        examDate: new Date().toISOString().split('T')[0],
    };

    sessionStorage.setItem('lastExamResult', JSON.stringify(newResult));

    sessionStorage.removeItem(`examRegistered_${levelStr}`);
    sessionStorage.removeItem(`examRegistrationExpiry_${levelStr}`);
    sessionStorage.removeItem(`notificationSent_${levelStr}`);

    router.push('/dashboard/competition/exam/result');

  }, [levelStr, examQuestions, userAnswers, router, user, firestore, profile]);

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

  // The initial loading state. `examQuestions` is null until the effect runs.
  if (examQuestions === null) {
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

  // This state is hit when the effect has run but found no questions for the current level.
  if (examQuestions.length === 0) {
    const schedule = examSchedules[majorLevel];
    const scheduleMessage = schedule
      ? `Your exam will take place on ${schedule.dayName}: ${schedule.start}:00 to ${schedule.end}:00.`
      : `There are currently no questions available for Level ${levelStr}. Please check back later.`;

    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle>Exam Not Ready</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{scheduleMessage}</p>
                    <Button asChild className="mt-4"><Link href="/dashboard/competition">Back to Competition</Link></Button>
                </CardContent>
            </Card>
        </main>
    );
  }

  // This is the main exam UI, rendered when examQuestions has items.
  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="font-headline text-center">Level: {levelStr} Exam</CardTitle>
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-mono whitespace-nowrap">
              {currentQuestionIndex + 1} / {examQuestions.length}
            </span>
            <Progress value={(timeLeft / TOTAL_TIME_PER_QUESTION) * 100} className="w-full" />
            <span className="text-sm font-mono font-bold w-12 text-right">{timeLeft}s</span>
          </div>
        </CardHeader>
        <CardContent>
          {majorLevel >= 1 && (
            <div className="flex justify-end mb-4">
              <Button asChild variant="outline">
                  <Link href="https://docs.google.com/document/d/your-doc-id/edit" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Open Reference Document
                  </Link>
              </Button>
            </div>
          )}
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
