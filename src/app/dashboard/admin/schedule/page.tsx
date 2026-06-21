'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Ban, PlayCircle, BellRing, Settings } from 'lucide-react';
import { examSchedules, examHolds } from '@/lib/exam-schedule';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AdminSchedulePage() {
    const [holds, setHolds] = useState(examHolds);
    const { toast } = useToast();

    const handleToggleHold = (levelKey: string) => {
        const newHolds = { ...holds, [levelKey]: !holds[levelKey] };
        // This mutates the imported object, simulating a persistent state for this exercise
        examHolds[levelKey] = newHolds[levelKey];
        setHolds(newHolds);

        if (newHolds[levelKey]) {
            toast({ title: `Exam for Level ${levelKey} is now ON HOLD.` });
        } else {
            toast({ 
                title: `Exam for Level ${levelKey} is now ACTIVE.`,
                description: "A notification has been sent to registered users."
            });
        }
    };

    const handleSendNotice = (level: string) => {
        toast({
            title: "Notice Sent!",
            description: `A notification has been sent to all registered users for Level ${level}.`,
        });
    };

    const handleScheduleChange = (level: string) => {
        toast({
            title: "Schedule Updated",
            description: `The exam schedule for Level ${level} has been changed.`,
        });
    }

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
                        <CalendarClock className="w-8 h-8 text-primary" />
                        Exam Schedule Management
                    </CardTitle>
                    <CardDescription>
                        View, hold, and manage exam schedules for all levels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Accordion type="multiple" className="w-full">
                        {Object.entries(examSchedules).map(([level, schedule]) => {
                            const majorLevel = parseInt(level, 10);
                            const someSubLevelsOnHold = [...Array(10)].some((_, i) => !!holds[`${majorLevel}.${i}`]);
                            
                            return (
                                <AccordionItem value={`level-${level}`} key={level}>
                                    <AccordionTrigger className="hover:no-underline font-normal text-base px-4 border-b">
                                        <div className="grid grid-cols-3 md:grid-cols-4 w-full text-left items-center gap-4">
                                            <span className="font-semibold col-span-1">Level {level}.x</span>
                                            <span className="text-sm col-span-2 md:col-span-2">
                                                {schedule.dayName},{' '}
                                                {schedule.start % 12 || 12}:00 {schedule.start < 12 ? 'am' : 'pm'} -{' '}
                                                {schedule.end % 12 || 12}:00 {schedule.end < 12 ? 'am' : 'pm'}
                                            </span>
                                            <div className="col-span-1 justify-self-start">
                                                <Badge variant={someSubLevelsOnHold ? 'destructive' : 'default'} className={cn(someSubLevelsOnHold ? 'bg-red-500' : 'bg-green-500')}>
                                                    {someSubLevelsOnHold ? 'On Hold' : 'Active'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-muted/50">
                                        <div className="pl-4 sm:pl-8 pr-4 py-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Sub-Level</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {[...Array(10)].map((_, i) => {
                                                        const subLevelKey = `${majorLevel}.${i}`;
                                                        const isHeld = !!holds[subLevelKey];
                                                        return (
                                                            <TableRow key={subLevelKey}>
                                                                <TableCell className="font-semibold">{subLevelKey}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={isHeld ? 'destructive' : 'default'} className={cn(isHeld ? 'bg-red-500' : 'bg-green-500')}>
                                                                        {isHeld ? 'On Hold' : 'Active'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end items-center gap-2 flex-wrap">
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant={isHeld ? 'secondary' : 'destructive'} 
                                                                            onClick={() => handleToggleHold(subLevelKey)}
                                                                        >
                                                                            {isHeld ? <PlayCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                                                            {isHeld ? 'Release' : 'Hold'}
                                                                        </Button>

                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button size="sm" variant="outline">
                                                                                    <BellRing className="mr-2 h-4 w-4"/>
                                                                                    Notice
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent>
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Generate Notice for Level {subLevelKey}</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        This message will be sent as a notification to all registered users of this level.
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <Textarea placeholder="Write your notice here..." rows={5}/>
                                                                                <DialogFooter>
                                                                                    <DialogTrigger asChild><Button variant="outline">Cancel</Button></DialogTrigger>
                                                                                    <DialogTrigger asChild><Button onClick={() => handleSendNotice(subLevelKey)}>Send Notice</Button></DialogTrigger>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>

                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button size="sm" variant="outline">
                                                                                    <Settings className="mr-2 h-4 w-4"/>
                                                                                    Change
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent>
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Change Schedule for Level {subLevelKey} (Demo)</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        This is a demonstration. In a real app, you'd have inputs to change the day and time.
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <p className="py-4 text-center text-muted-foreground">(Schedule editing form would be here)</p>
                                                                                <DialogFooter>
                                                                                    <DialogTrigger asChild><Button variant="outline">Cancel</Button></DialogTrigger>
                                                                                    <DialogTrigger asChild><Button onClick={() => handleScheduleChange(subLevelKey)}>Save Changes</Button></DialogTrigger>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
