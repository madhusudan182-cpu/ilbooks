'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { allSyllabi } from '@/lib/syllabus';
import type { Syllabus, SyllabusTopic } from '@/lib/types';
import { Book, ArrowLeft, Edit, Save, X, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function AllSyllabiPage() {
    const [isClient, setIsClient] = useState(false);
    const [syllabi, setSyllabi] = useState<Syllabus[]>(() => JSON.parse(JSON.stringify(allSyllabi))); // Deep copy for safety
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedSyllabus, setEditedSyllabus] = useState<Syllabus | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }
    
    const handleEditClick = (level: string) => {
        const syllabusToEdit = syllabi.find(s => s.level === level) || { level, subjects: {} };
        setEditingLevel(level);
        setEditedSyllabus(JSON.parse(JSON.stringify(syllabusToEdit))); // Deep copy to avoid direct state mutation
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditedSyllabus(null);
    };

    const handleSaveClick = () => {
        if (!editedSyllabus || !editingLevel) return;

        // Filter out subjects with empty names
        const cleanedSubjects: { [subjectName: string]: SyllabusTopic } = {};
        Object.entries(editedSyllabus.subjects).forEach(([name, details]) => {
            if (name.trim()) {
                cleanedSubjects[name.trim()] = details;
            }
        });
        const finalSyllabus = { ...editedSyllabus, subjects: cleanedSubjects };


        setSyllabi(currentSyllabi => {
            const existingIndex = currentSyllabi.findIndex(s => s.level === editingLevel);
            if (existingIndex > -1) {
                const newSyllabi = [...currentSyllabi];
                newSyllabi[existingIndex] = finalSyllabus;
                return newSyllabi;
            } else {
                return [...currentSyllabi, finalSyllabus];
            }
        });
        toast({ title: "Syllabus saved!", description: `Changes for Level ${editingLevel} have been saved for this session.` });
        setEditingLevel(null);
        setEditedSyllabus(null);
    };
    
    const handleSubjectChange = (subjectName: string, field: 'marks' | 'topics', value: string | number) => {
        if (!editedSyllabus) return;
        const newSubjects = { ...editedSyllabus.subjects };
        if(newSubjects[subjectName]) {
            if (field === 'marks') {
                newSubjects[subjectName] = { ...newSubjects[subjectName], marks: Number(value) || 0 };
            } else {
                newSubjects[subjectName] = { ...newSubjects[subjectName], topics: (value as string).split('\n') };
            }
            setEditedSyllabus({ ...editedSyllabus, subjects: newSubjects });
        }
    };

    const handleSubjectNameChange = (oldName: string, newName: string) => {
        if (!editedSyllabus || oldName === newName || !newName) return;
        const newSubjects: { [subjectName: string]: SyllabusTopic } = {};
        Object.entries(editedSyllabus.subjects).forEach(([name, details]) => {
            if (name === oldName) {
                newSubjects[newName] = details;
            } else {
                newSubjects[name] = details;
            }
        });
        setEditedSyllabus({ ...editedSyllabus, subjects: newSubjects });
    };

    const handleAddSubject = () => {
        if (!editedSyllabus) return;
        const newSubjectName = `New Subject ${Object.keys(editedSyllabus.subjects).length + 1}`;
        setEditedSyllabus({
            ...editedSyllabus,
            subjects: {
                ...editedSyllabus.subjects,
                [newSubjectName]: { marks: 10, topics: ['New Topic'] }
            }
        });
    };

    const handleRemoveSubject = (subjectName: string) => {
        if (!editedSyllabus) return;
        const newSubjects = { ...editedSyllabus.subjects };
        delete newSubjects[subjectName];
        setEditedSyllabus({ ...editedSyllabus, subjects: newSubjects });
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
                        View and manage all competition syllabi from Level 0.0 to 19.9. Changes are saved for the current session.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isClient ? (
                    <Accordion type="single" collapsible className="w-full">
                        {allLevels.map((level) => {
                            const syllabus = syllabi.find(s => s.level === level);
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
                                        {isEditing && editedSyllabus ? (
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                {Object.entries(editedSyllabus.subjects).map(([subjectName, details]) => (
                                                    <div key={subjectName} className="mb-4 p-4 border rounded-md bg-background">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <Input
                                                                defaultValue={subjectName}
                                                                onBlur={(e) => handleSubjectNameChange(subjectName, e.target.value)}
                                                                className="font-semibold text-lg"
                                                            />
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(subjectName)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <div>
                                                                <Label htmlFor={`marks-${level}-${subjectName}`} className="text-sm font-medium">Marks</Label>
                                                                <Input
                                                                    id={`marks-${level}-${subjectName}`}
                                                                    type="number"
                                                                    value={details.marks}
                                                                    onChange={(e) => handleSubjectChange(subjectName, 'marks', e.target.value)}
                                                                    className="w-24"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`topics-${level}-${subjectName}`} className="text-sm font-medium">Topics (one per line)</Label>
                                                                <Textarea
                                                                    id={`topics-${level}-${subjectName}`}
                                                                    value={details.topics.join('\n')}
                                                                    onChange={(e) => handleSubjectChange(subjectName, 'topics', e.target.value)}
                                                                    rows={details.topics.length + 1}
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
                                        ) : syllabus ? (
                                            Object.entries(syllabus.subjects).map(([subjectName, details]) => (
                                                <div key={subjectName} className="mb-4 last:mb-0">
                                                    <h4 className="font-semibold">{subjectName} ({details.marks} Marks)</h4>
                                                    <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                                        {details.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                                                    </ul>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">Syllabus not yet defined for this level.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
