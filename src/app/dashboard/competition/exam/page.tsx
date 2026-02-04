"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { allQuestions } from '@/lib/questions';
import type { Answer } from '@/lib/types';
import { CheckCircle, XCircle, Award } from 'lucide-react';

const TOTAL_TIME_PER_QUESTION = 20; // seconds

export default function ExamPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = allQuestions.filter(q => q.level === '0.0');
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_PER_QUESTION);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (showResults) return;

    if (timeLeft === 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  const handleNext = () => {
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
  };
  
  const calculateScore = () => {
      let correctAnswers = 0;
      questions.forEach((q, index) => {
          const correctAnswer = q.answers.find(a => a.isCorrect)?.text;
          if (userAnswers[index] === correctAnswer) {
              correctAnswers++;
          }
      });
      return {
        score: correctAnswers,
        total: questions.length,
        percentage: (correctAnswers / questions.length) * 100
      };
  }

  if (showResults) {
    const { score, total, percentage } = calculateScore();
    const passed = percentage >= 60;
    
    return (
        <main className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center justify-center gap-3">
                        <Award className={`w-10 h-10 ${passed ? 'text-green-500' : 'text-destructive'}`} />
                        Exam Results
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-lg">You scored:</p>
                        <p className="text-5xl font-bold text-primary">{score} / {total}</p>
                        <p className={`text-2xl font-semibold ${passed ? 'text-green-500' : 'text-destructive'}`}>
                            {percentage.toFixed(2)}% - {passed ? "Passed!" : "Failed"}
                        </p>
                    </div>

                    <div className="text-left space-y-4 max-h-60 overflow-y-auto p-4 border rounded-md">
                        <h3 className="font-semibold text-lg">Review Your Answers:</h3>
                        {questions.map((q, index) => {
                            const correctAnswer = q.answers.find(a => a.isCorrect)!.text;
                            const userAnswer = userAnswers[index];
                            const isCorrect = userAnswer === correctAnswer;
                            return (
                                <div key={q.id} className="p-2 border-b">
                                    <p className="font-medium">{index + 1}. {q.questionText}</p>
                                    <p className={`flex items-center gap-2 text-sm ${isCorrect ? 'text-green-600' : 'text-destructive'}`}>
                                        {isCorrect ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                        Your answer: {userAnswer || "Not answered"}
                                    </p>
                                    {!isCorrect && <p className="text-sm text-muted-foreground">Correct answer: {correctAnswer}</p>}
                                </div>
                            );
                        })}
                    </div>
                    
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
        <CardHeader className="pb-0">
          <CardTitle className="font-headline text-center">Level 0.0 Exam</CardTitle>
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-mono whitespace-nowrap">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <Progress value={(timeLeft / TOTAL_TIME_PER_QUESTION) * 100} className="w-full" />
            <span className="text-sm font-mono font-bold w-12 text-right">{timeLeft}s</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-1">
            <p className="text-sm md:text-base font-medium text-center">{currentQuestion.questionText}</p>
          </div>
          <RadioGroup 
            value={userAnswers[currentQuestionIndex] || ''}
            onValueChange={handleAnswerSelect}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {currentQuestion.answers.map((answer, index) => (
              <div key={index}>
                <RadioGroupItem value={answer.text} id={`r${index}`} className="peer sr-only" />
                <Label 
                  htmlFor={`r${index}`}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-center text-base hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-accent peer-data-[state=checked]:border-accent peer-data-[state=checked]:text-accent-foreground cursor-pointer"
                >
                  {answer.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-end mt-6 gap-2">
            <Button onClick={handleNext}>
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
