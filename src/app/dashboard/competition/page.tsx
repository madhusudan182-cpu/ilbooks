"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Book, Award, Percent, DollarSign, Edit } from "lucide-react";
import { PaymentGateway } from '@/components/payment-gateway';
import { allSyllabi } from '@/lib/syllabus';
import { mockUsers } from '@/lib/data';

export default function CompetitionPage() {
    const [showPayment, setShowPayment] = useState(false);
    const router = useRouter();
    const examFee = 20;

    // In a real app, you'd get the current user from an auth context.
    // We simulate by picking a user. mockUsers[0] is an admin.
    // To see the client view, you can change this to mockUsers[1].
    const currentUser = mockUsers[1]; 
    const userLevel = currentUser.level.toString();
    const userSyllabus = allSyllabi.find(s => s.level === userLevel);


    const handlePaymentSuccess = () => {
        console.log("Payment successful, starting exam...");
        router.push('/dashboard/competition/exam');
    };

    return (
        <>
            <PaymentGateway
                amount={examFee}
                productName="Exam Fee"
                show={showPayment}
                onClose={() => setShowPayment(false)}
                onSuccess={handlePaymentSuccess}
            />
            <div className="p-4 md:p-6 lg:p-8 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold font-headline">Competition</h1>
                    <p className="text-muted-foreground mt-2">Test your knowledge, level up, and win prizes!</p>
                    <Badge className="mt-4 text-base">Your Current Level: {userLevel}</Badge>
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
                            <CardTitle className="flex items-center gap-3"><Book className="text-accent"/> Syllabus for Level: {userLevel}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userSyllabus ? (
                                Object.entries(userSyllabus.subjects).map(([subjectName, details]) => (
                                    <div key={subjectName} className="mb-4 last:mb-0">
                                        <h4 className="font-semibold">{subjectName} ({details.marks} Marks)</h4>
                                        <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                            {details.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">Syllabus for your current level ({userLevel}) is not available yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="text-center mt-8">
                     <Button size="lg" className="font-headline" onClick={() => setShowPayment(true)}>
                        Proceed to Payment & Start Exam <ArrowRight className="ml-2 w-5 h-5"/>
                     </Button>
                     <p className="text-xs text-muted-foreground mt-2">Exam duration: 20 seconds per question.</p>
                </div>

            </div>
        </>
    );
}
