'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Syllabus, SyllabusTopic } from '@/lib/types';
import { Book, ArrowLeft, Edit, Save, X, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

interface EditableSubject extends SyllabusTopic {
    id: string; // for stable key
    name: string;
}

export default function AllSyllabiPage() {
    const firestore = useFirestore();
    const syllabiQuery = useMemo(() => (firestore ? collection(firestore, 'syllabi') : null), [firestore]);
    const { data: syllabi, loading: syllabiLoading } = useCollection<Syllabus>(syllabiQuery);
    
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedSubjects, setEditedSubjects] = useState<EditableSubject[]>([]);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }
    
    const syllabiByLevel = syllabi?.reduce((acc, s) => {
        acc[s.level] = s;
        return acc;
    }, {} as Record<string, Syllabus>) || {};

    const handleEditClick = (level: string) => {
        const syllabusToEdit = syllabiByLevel[level] || { level, subjects: {} };
        setEditingLevel(level);
        const subjectsAsArray = Object.entries(syllabusToEdit.subjects).sort(([a], [b]) => {
            if (a === 'Bengali') return -1;
            if (b === 'Bengali') return 1;
            return 0;
        }).map(([name, details], index) => ({
            id: `${level}-${name.replace(/\s+/g, '-')}-${index}`,
            name,
            ...details
        }));
        setEditedSubjects(subjectsAsArray);
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditedSubjects([]);
    };

    const handleSaveClick = () => {
        if (!editingLevel || !firestore) return;

        const newSubjectsObject: { [subjectName: string]: Omit<SyllabusTopic, 'id' | 'name'> } = {};
        let hasError = false;
        const subjectNames = new Set<string>();

        for (const subject of editedSubjects) {
            const trimmedName = subject.name.trim().replace(/:$/, '').trim();
            if (!trimmedName) continue; 

            if (subjectNames.has(trimmedName)) {
                toast({
                    title: "Error: Duplicate subject name",
                    description: `The subject name "${trimmedName}" is used more than once. Please use unique names.`,
                    variant: "destructive",
                });
                hasError = true;
                break;
            }
            subjectNames.add(trimmedName);
            
            const { id, name, ...rest } = subject;
            newSubjectsObject[trimmedName] = rest;
        }

        if (hasError) return;

        const finalSyllabus: Omit<Syllabus, 'id'> = {
            level: editingLevel,
            subjects: newSubjectsObject,
        };
        
        const docRef = doc(firestore, 'syllabi', editingLevel);
        setDoc(docRef, finalSyllabus)
            .then(() => {
                toast({ title: "Syllabus saved!", description: `Changes for Level ${editingLevel} have been saved permanently.` });
                setEditingLevel(null);
                setEditedSubjects([]);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `syllabi/${editingLevel}`,
                    operation: 'write',
                    requestResourceData: finalSyllabus
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const handleEditedSubjectChange = (id: string, field: 'name' | 'marks' | 'topics', value: string | number) => {
    setEditedSubjects((prevSubjects) => 
    prevSubjects.map((s) => {
      if (s.id === id) {
        if (field === 'topics') {
          return { ...s, topics: (value as string).split('\n') };
        }
        // এখানে ভ্যালুটিকে নির্দিষ্ট টাইপে কাস্ট করে দিচ্ছি যাতে টাইপস্ক্রিপ্ট খুশি থাকে
        return { 
          ...s, 
          [field]: field === 'marks' ? Number(value) : String(value) 
        };
        }
        return s;
        })
        );
    };

    const handleAddSubject = () => {
        if (!editingLevel) return;
        const newId = `new-subject-${Date.now()}`;
        const newSubject: EditableSubject = {
            id: newId,
            name: `New Subject`,
            marks: 10,
            topics: ['New Topic']
        };
        setEditedSubjects(current => [...current, newSubject]);
    };

    const handleRemoveSubject = (id: string) => {
        setEditedSubjects(current => current.filter(s => s.id !== id));
    };

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
                        <Book className="w-8 h-8 text-primary"/>
                        All Syllabi
                    </CardTitle>
                    <CardDescription>
                        View and manage all competition syllabi from Level 0.0 to 19.9. Changes are saved permanently.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(syllabiLoading || !isClient) ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                    <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
                        {allLevels.map((level) => {
                            const syllabus = syllabiByLevel[level];
                            const isEditing = editingLevel === level;
                            
                            return (
                                <AccordionItem value={`level-${level}`} key={level}>
                                    <AccordionTrigger className="font-semibold hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                           <span>Syllabus for Level: {level}</span>
                                           {!isEditing && (
                                                <div role="button"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(level); }}
                                                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "mr-4 h-8 px-3 flex items-center gap-2")}>
                                                    <Edit />
                                                    Edit
                                                </div>
                                           )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {isEditing ? (
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                {editedSubjects.map((subject) => (
                                                    <div key={subject.id} className="mb-4 p-4 border rounded-md bg-background">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <Input
                                                                value={subject.name}
                                                                onChange={(e) => handleEditedSubjectChange(subject.id, 'name', e.target.value)}
                                                                className="font-semibold text-lg"
                                                                placeholder="Subject Name"
                                                            />
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(subject.id)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <div>
                                                                <Label htmlFor={`marks-${level}-${subject.id}`} className="text-sm font-medium">Marks</Label>
                                                                <Input
                                                                    id={`marks-${level}-${subject.id}`}
                                                                    type="number"
                                                                    value={subject.marks}
                                                                    onChange={(e) => handleEditedSubjectChange(subject.id, 'marks', e.target.value)}
                                                                    className="w-24"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`topics-${level}-${subject.id}`} className="text-sm font-medium">Topics (one per line)</Label>
                                                                <Textarea
                                                                    id={`topics-${level}-${subject.id}`}
                                                                    value={subject.topics.join('\n')}
                                                                    onChange={(e) => handleEditedSubjectChange(subject.id, 'topics', e.target.value)}
                                                                    rows={subject.topics.length + 1}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={handleAddSubject} className="mb-4">
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add Subject
                                                </Button>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                    <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                </div>
                                            </div>
                                        ) : syllabus && Object.keys(syllabus.subjects).length > 0 ? (
                                            Object.entries(syllabus.subjects).sort(([a], [b]) => {
                                                if (a === 'Bengali') return -1;
                                                if (b === 'Bengali') return 1;
                                                return 0;
                                            }).map(([subjectName, details]) => (
                                                <div key={subjectName} className="mb-4 last:mb-0">
                                                    <h4 className="font-semibold">{subjectName} ({details.marks} Marks)</h4>
                                                    <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                                        {details.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                                                    </ul>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground p-4">Syllabus not yet defined for this level.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
