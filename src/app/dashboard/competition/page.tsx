'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Book, Award, Percent, DollarSign, Edit, ClipboardList } from "lucide-react";
import { PaymentGateway } from '@/components/payment-gateway';
import { currentUser } from '@/lib/auth';
import { allQuestions } from '@/lib/questions';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Syllabus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const examSchedules: { [key: number]: { day: number, start: number, end: number } } = {
    1: { day: 5, start: 9, end: 10 },    // Fri 9am-10am
    2: { day: 5, start: 10, end: 11 },   // Fri 10am-11am
    3: { day: 5, start: 20, end: 21 },   // Fri 8pm-9pm
    4: { day: 5, start: 21, end: 22 },   // Fri 9pm-10pm
    5: { day: 6, start: 9, end: 10 },    // Sat 9am-10am
    6: { day: 6, start: 10, end: 11 },   // Sat 10am-11am
    7: { day: 6, start: 20, end: 21 },   // Sat 8pm-9pm
    8: { day: 6, start: 21, end: 22 },   // Sat 9pm-10pm
    9: { day: 0, start: 20, end: 21 },   // Sun 8pm-9pm
    10: { day: 0, start: 21, end: 22 },  // Sun 9pm-10pm
    11: { day: 1, start: 20, end: 21 },  // Mon 8pm-9pm
    12: { day: 1, start: 21, end: 22 },  // Mon 9pm-10pm
    13: { day: 2, start: 20, end: 21 },  // Tue 8pm-9pm
    14: { day: 2, start: 21, end: 22 },  // Tue 9pm-10pm
    15: { day: 3, start: 20, end: 21 },  // Wed 8pm-9pm
    16: { day: 3, start: 21, end: 22 },  // Wed 9pm-10pm
    17: { day: 4, start: 20, end: 21 },  // Thu 8pm-9pm
    18: { day: 4, start: 21, end: 22 },  // Thu 9pm-10pm
    19: { day: 4, start: 22, end: 23 },  // Thu 10pm-11pm
};

const examScheduleMessages: { [key: number]: string } = {
    1: "The exam of this Level will take place on every Friday from 9 a.m. to 10 a.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    2: "The exam of this Level will take place on Friday from 10 a.m. to 11 a.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    3: "The exam of this Level will take place on Friday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    4: "The exam of this Level will take place on Friday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    5: "The exam of this Level will take place on Saturday from 9 a.m. to 10 a.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    6: "The exam of this Level will take place on Saturday from 10 a.m. to 11 a.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    7: "The exam of this Level will take place on Saturday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    8: "The exam of this Level will take place on Saturday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    9: "The exam of this Level will take place on Sunday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    10: "The exam of this Level will take place on Sunday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    11: "The exam of this Level will take place on Monday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    12: "The exam of this Level will take place on Monday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    13: "The exam of this Level will take place on Tuesday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    14: "The exam of this Level will take place on Tuesday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    15: "The exam of this Level will take place on Wednesday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    16: "The exam of this Level will take place on Wednesday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    17: "The exam of this Level will take place on Thursday from 8 p.m. to 9 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    18: "The exam of this Level will take place on Thursday from 9 p.m. to 10 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
    19: "The exam of this Level will take place on Thursday from 10 p.m. to 11 p.m. So, before you go for registration, take a good look at the Syllabus and prepare yourself for a better result!",
};


export default function CompetitionPage() {
    const [showPayment, setShowPayment] = useState(false);
    const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const examFee = 20;

    const [userLevel, setUserLevel] = useState(currentUser.level.toFixed(1));
    const [isRegistered, setIsRegistered] = useState(false);
    const [isExamTime, setIsExamTime] = useState(false);
    const firestore = useFirestore();

    useEffect(() => {
        const savedLevel = sessionStorage.getItem('currentUserLevel');
        if (savedLevel) {
            setUserLevel(savedLevel);
        }
    }, []);

    const competitionLevel = userLevel.startsWith('0.') ? '0.0' : userLevel;
    
    const [syllabusQuery, setSyllabusQuery] = useState<any>(null);
    useEffect(() => {
        if(firestore) {
            setSyllabusQuery(query(collection(firestore, 'syllabi'), where('level', '==', competitionLevel)));
        }
    }, [firestore, competitionLevel]);

    const { data: userSyllabusArr, loading: syllabusLoading } = useCollection<Syllabus>(syllabusQuery);
    const userSyllabus = userSyllabusArr?.[0];

    useEffect(() => {
        const registrationStatus = sessionStorage.getItem(`examRegistered_${competitionLevel}`);
        setIsRegistered(registrationStatus === 'true');
    }, [competitionLevel]);

    useEffect(() => {
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
            
            if (registrationStatus !== 'true' || majorLevel < 1) {
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
        const [majorLevel] = competitionLevel.split('.').map(Number);
        if (majorLevel < 1) {
             console.log("Payment successful, starting exam for level 0...");
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
        const [majorLevel] = userLevel.split('.').map(Number);
        
        if (majorLevel >= 1) {
            setShowPayment(true);
        } else {
            const hasQuestionsForLevel = allQuestions.some(q => q.level === competitionLevel);
            if (hasQuestionsForLevel) {
                setShowPayment(true);
            } else {
                setShowComingSoonDialog(true);
            }
        }
    }

    const [majorLevel] = userLevel.split('.').map(Number);
    const buttonText = majorLevel < 1 ? "Proceed to Payment & Start Exam" : "Register for the Exam";
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
                        <Badge className="text-base bg-red-100 text-red-800">Your Current Level: {userLevel}</Badge>
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
                     {(!isRegistered || majorLevel < 1) && (
                        <Button size="lg" className="font-headline px-4 md:px-8" onClick={handleStartExamClick}>
                           {buttonText} <ArrowRight className="ml-2 w-5 h-5"/>
                        </Button>
                     )}
                     <p className="text-xs text-muted-foreground mt-2">
                        {isRegistered && majorLevel >= 1 
                            ? "You are registered. The 'Take the Exam' button will appear at your scheduled time."
                            : "Exam duration: 15 seconds per question."
                         }
                    </p>
                </div>

            </div>
        </>
    );
}
