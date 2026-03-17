'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Book, Award, Percent, DollarSign, Edit, ClipboardList } from "lucide-react";
import { PaymentGateway } from '@/components/payment-gateway';
import { currentUser } from '@/lib/auth';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Syllabus, Question } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { examSchedules, examScheduleMessages, examHolds } from '@/lib/exam-schedule';


export default function CompetitionPage() {
    const [showPayment, setShowPayment] = useState(false);
    const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    const competitionLevel = currentUser.level.toFixed(1);
    
    const getExamFee = (levelString: string): number => {
        const [major] = levelString.split('.').map(Number);
        if (major >= 0 && major < 1) return 20;
        if (major >= 1 && major < 2) return 25;
        if (major >= 2 && major < 3) return 30;
        if (major >= 3 && major < 4) return 35;
        if (major >= 4 && major < 5) return 40;
        if (major >= 5 && major <= 19) return 50;
        return 20; // Default
    };
    
    const examFee = getExamFee(competitionLevel);
    
    const [isRegistered, setIsRegistered] = useState(false);
    const [isExamTime, setIsExamTime] = useState(false);
    const firestore = useFirestore();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const levelNumber = useMemo(() => parseFloat(competitionLevel), [competitionLevel]);
    const isFeeExempt = useMemo(() => levelNumber >= 0.0 && levelNumber <= 0.5, [levelNumber]);
    
    const [syllabusQuery, setSyllabusQuery] = useState<any>(null);
    useEffect(() => {
        if(firestore && competitionLevel) {
            setSyllabusQuery(query(collection(firestore, 'syllabi'), where('level', '==', competitionLevel)));
        }
    }, [firestore, competitionLevel]);

    const { data: userSyllabusArr, loading: syllabusLoading } = useCollection<Syllabus>(syllabusQuery);
    const userSyllabus = userSyllabusArr?.[0];

    const questionsQuery = useMemo(() => {
        if (!firestore || !competitionLevel) return null;
        return query(collection(firestore, 'questions'), where('level', '==', competitionLevel));
    }, [firestore, competitionLevel]);

    const { data: questionsForLevel } = useCollection<Question>(questionsQuery);

    useEffect(() => {
        if (!competitionLevel) return;
        const registrationStatus = sessionStorage.getItem(`examRegistered_${competitionLevel}`);
        setIsRegistered(registrationStatus === 'true');
    }, [competitionLevel]);

    useEffect(() => {
        if (!competitionLevel) return;

        const checkTimeAndRegistration = () => {
            // Check for expired registration
            const expiryTimestamp = sessionStorage.getItem(`examRegistrationExpiry_${competitionLevel}`);
            if (expiryTimestamp && Date.now() > parseInt(expiryTimestamp, 10)) {
                sessionStorage.removeItem(`examRegistered_${competitionLevel}`);
                sessionStorage.removeItem(`examRegistrationExpiry_${competitionLevel}`);
                sessionStorage.removeItem(`notificationSent_${competitionLevel}`);
                setIsRegistered(false);
                setIsExamTime(false);
                return; // Exit to prevent further checks in this cycle
            }

            // Check for current exam window
            const [majorLevel] = competitionLevel.split('.').map(Number);
            const registrationStatus = sessionStorage.getItem(`examRegistered_${competitionLevel}`);
            
            if (registrationStatus !== 'true' || majorLevel < 1 || examHolds[competitionLevel]) {
                setIsExamTime(false);
                return;
            }

            const now = new Date();
            const schedule = examSchedules[majorLevel];
            if (schedule) {
                if (now.getDay() === schedule.day && now.getHours() >= schedule.start && now.getHours() < schedule.end) {
                    setIsExamTime(true);
                } else {
                    setIsExamTime(false);
                }

                // --- Notification Logic ---
                const notificationSent = sessionStorage.getItem(`notificationSent_${competitionLevel}`);
                if (!notificationSent) {
                    const examStartDate = new Date(now);
                    const dayDiff = (schedule.day - now.getDay() + 7) % 7;

                    examStartDate.setDate(now.getDate() + dayDiff);
                    examStartDate.setHours(schedule.start, 0, 0, 0);
                    
                    const timeUntilExam = examStartDate.getTime() - now.getTime();
                    const minutesUntilExam = timeUntilExam / (1000 * 60);
    
                    if (minutesUntilExam > 0 && minutesUntilExam <= 30) {
                        toast({
                            title: "Exam Reminder",
                            description: `Your exam for Level ${competitionLevel} starts in under 30 minutes.`,
                            duration: 10000
                        });
                        sessionStorage.setItem(`notificationSent_${competitionLevel}`, 'true');
                    }
                }
            } else {
                setIsExamTime(false);
            }
        };

        checkTimeAndRegistration();
        const interval = setInterval(checkTimeAndRegistration, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [competitionLevel, toast]);

    useEffect(() => {
        if (showComingSoonDialog) {
            const timer = setTimeout(() => {
                setShowComingSoonDialog(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showComingSoonDialog]);


    const handlePaymentSuccess = () => {
        if (!competitionLevel) return;
        const [majorLevel] = competitionLevel.split('.').map(Number);
        if (majorLevel < 1 && !isFeeExempt) {
             console.log("Payment successful, starting exam for level 0.x...");
             router.push(`/dashboard/competition/exam?level=${competitionLevel}`);
        } else {
            console.log("Payment successful, registration complete.");
            sessionStorage.setItem(`examRegistered_${competitionLevel}`, 'true');
            setIsRegistered(true);

            // Store the expiry time for this registration
            const schedule = examSchedules[majorLevel];
            if (schedule) {
                const now = new Date();
                const examDate = new Date(now);
                const dayDiff = (schedule.day - now.getDay() + 7) % 7;

                if (dayDiff === 0 && now.getHours() >= schedule.end) {
                    // If exam for today is already over, schedule for next week
                    examDate.setDate(now.getDate() + 7);
                } else {
                    examDate.setDate(now.getDate() + dayDiff);
                }
                examDate.setHours(schedule.end, 0, 0, 0); // Set to the end hour of the exam
                sessionStorage.setItem(`examRegistrationExpiry_${competitionLevel}`, examDate.getTime().toString());
            }

            toast({
                title: "Registration Successful!",
                description: "Your 'Take the Exam' button will appear during the scheduled time.",
            });
        }
    };
    
    const handleStartExamClick = () => {
        if (!competitionLevel) return;
    
        if (examHolds[competitionLevel]) {
            router.push('/dashboard/competition/exam-held');
            return;
        }
    
        // For fee-exempt levels, check for questions and go directly to exam
        if (isFeeExempt) {
            // Level 0.0 has local fallback questions. Other exempt levels (0.1-0.5) need DB questions.
            if (competitionLevel === '0.0' || (questionsForLevel && questionsForLevel.length > 0)) {
                router.push(`/dashboard/competition/exam?level=${competitionLevel}`);
            } else {
                 toast({
                    title: "Exam Not Ready",
                    description: `Questions for Level ${competitionLevel} are not available yet. Please check back later.`,
                    variant: "destructive",
                });
            }
            return; // Bypass payment
        }
        
        // For levels that require payment
        const hasQuestionsForLevel = questionsForLevel && questionsForLevel.length > 0;
        if (hasQuestionsForLevel) {
            setShowPayment(true);
        } else {
            toast({
                title: "Exam Not Ready",
                description: `Questions for Level ${competitionLevel} are not available yet. Please check back later.`,
                variant: "destructive",
            });
        }
    }

    const [majorLevel] = (competitionLevel).split('.').map(Number);
    const buttonText = isFeeExempt
      ? "Start Exam"
      : majorLevel < 1
      ? "Proceed to Payment & Start Exam"
      : "Register for the Exam";
    const scheduleMessage = examScheduleMessages[majorLevel];


    return (
        <>
            <PaymentGateway
                amount={examFee}
                productName="Exam Fee"
                show={showPayment}
                onClose={() => setShowPayment(false)}
                onSuccess={handlePaymentSuccess}
            />

            <AlertDialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Coming Soon!</AlertDialogTitle>
                        <AlertDialogDescription>
                            We are still working on this Level. You will be notified when we are done!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>

            <div className="p-4 md:p-6 lg:p-8 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold font-headline">Competition</h1>
                    <p className="text-muted-foreground mt-2">Test your knowledge, level up, and win prizes!</p>
                    <div className="flex flex-col justify-center items-center gap-2 mt-4">
                        {isClient ? (
                            <Badge className="text-base bg-red-100 text-red-800">Your Current Level: {competitionLevel}</Badge>
                        ) : (
                            <Skeleton className="h-7 w-48" />
                        )}
                         <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm" className="bg-blue-800 text-blue-100 border-blue-900 hover:bg-blue-900 hover:text-blue-50">
                                <Link href="/dashboard/competition/history">
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    Exam Result
                                </Link>
                            </Button>
                            {isExamTime && (
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700 animate-pulse"
                                >
                                    <Link href={`/dashboard/competition/exam?level=${competitionLevel}`}>
                                        Take the Exam
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3"><Award className="text-accent"/> Rules & Prizes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p className="flex items-start gap-2"><Percent className="w-4 h-4 mt-1 flex-shrink-0"/> Score 60% or more in each section to pass the level.</p>
                            <p className="flex items-start gap-2"><Award className="w-4 h-4 mt-1 flex-shrink-0"/> Score 80% or more on your first try to be eligible for prizes.</p>
                            <p className="flex items-start gap-2"><Edit className="w-4 h-4 mt-1 flex-shrink-0"/> A deduction of 0.5 marks for each wrong answer.</p>
                        </CardContent>
                    </Card>

                    {!isFeeExempt && (
                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-3"><DollarSign className="text-accent"/> Exam Fee</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              <p className="text-muted-foreground">To participate in the exam, a fee of <span className="font-bold text-foreground">BDT {examFee.toFixed(2)}</span> is required for each attempt.</p>
                              <p className="font-semibold">Accepted Payment Methods:</p>
                              <div className="flex gap-4 items-center text-sm text-muted-foreground">
                                  <span>Bkash</span>
                                  <Separator orientation="vertical" className="h-4"/>
                                  <span>Rocket</span>
                                   <Separator orientation="vertical" className="h-4"/>
                                  <span>Nexus Pay</span>
                              </div>
                          </CardContent>
                      </Card>
                    )}
                    
                    <Card className="lg:col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Syllabus for Level: {competitionLevel}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {syllabusLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ) : userSyllabus ? (
                                Object.entries(userSyllabus.subjects).map(([subjectName, details]) => (
                                    <div key={subjectName} className="mb-4 last:mb-0">
                                        <h4 className="font-semibold">{subjectName} ({details.marks} Marks)</h4>
                                        <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                            {details.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">Syllabus for your current level ({competitionLevel}) is not available yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="text-center mt-8">
                     {scheduleMessage && (
                        <p className="text-red-600 font-bold text-lg mb-4">{scheduleMessage}</p>
                    )}
                     {(!isRegistered || majorLevel < 1 || isFeeExempt) && (
                        <Button size="lg" className="font-headline px-4 md:px-8" onClick={handleStartExamClick}>
                           {buttonText} <ArrowRight className="ml-2 w-5 h-5"/>
                        </Button>
                     )}
                     <p className="text-xs text-muted-foreground mt-2">
                        {isRegistered && majorLevel >= 1 && !isFeeExempt
                            ? "You are registered. The 'Take the Exam' button will appear at your scheduled time."
                            : "Exam duration: 15 seconds per question."
                         }
                    </p>
                </div>

            </div>
        </>
    );
}
