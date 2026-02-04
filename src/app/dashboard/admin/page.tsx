import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Book, ListChecks } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { allSyllabi } from '@/lib/syllabus';
import { allQuestions } from '@/lib/questions';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';

export default function AdminPage() {
    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        if (i === 1) continue; // Skip level 1.x
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const questionsByLevel = allQuestions.reduce((acc, q) => {
        if (!acc[q.level]) {
            acc[q.level] = [];
        }
        acc[q.level].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Shield className="w-8 h-8 text-primary" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Welcome to the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you can manage users, questions, and other site settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                <Book className="w-6 h-6 text-primary"/> All Syllabi
            </CardTitle>
            <CardDescription>View and manage all competition syllabi.</CardDescription>
        </CardHeader>
        <CardContent>
             <Accordion type="single" collapsible className="w-full max-h-[32rem] overflow-y-auto">
                {allLevels.map((level) => {
                    const syllabus = allSyllabi.find(s => s.level === level);
                    return (
                        <AccordionItem value={`level-${level}`} key={level}>
                            <AccordionTrigger className="font-semibold">Syllabus for Level: {level}</AccordionTrigger>
                            <AccordionContent>
                                {syllabus ? (
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
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><ListChecks className="text-primary w-6 h-6"/> All Questions</CardTitle>
              <CardDescription>All available questions are visible to admins for review, grouped by level.</CardDescription>
          </CardHeader>
          <CardContent>
              <Accordion type="multiple" className="w-full max-h-[40rem] overflow-y-auto">
                  {allLevels.map((level) => {
                      const questionsForLevel = questionsByLevel[level] || [];
                      return (
                          <AccordionItem value={`level-q-${level}`} key={`level-q-${level}`}>
                              <AccordionTrigger className="text-left font-semibold">
                                  Questions for Level: {level}
                                  <span className="text-sm font-normal text-muted-foreground ml-2">({questionsForLevel.length} questions)</span>
                              </AccordionTrigger>
                              <AccordionContent>
                                  {questionsForLevel.length > 0 ? (
                                      <Accordion type="multiple" className="w-full">
                                          {questionsForLevel.map((q, index) => (
                                              <AccordionItem value={`item-${level}-${index}`} key={q.id}>
                                                  <AccordionTrigger className="text-left text-sm font-normal">({index + 1}) {q.questionText}</AccordionTrigger>
                                                  <AccordionContent>
                                                      <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                                          {q.answers.map((ans, ansIndex) => (
                                                              <li key={ansIndex} className={cn(ans.isCorrect && "font-bold text-green-600")}>
                                                                  {ans.text}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                      <p className="mt-2 pt-2 border-t text-sm text-muted-foreground"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                                                  </AccordionContent>
                                              </AccordionItem>
                                          ))}
                                      </Accordion>
                                  ) : (
                                      <p className="text-muted-foreground text-sm py-4 px-4">No questions defined for this level.</p>
                                  )}
                              </AccordionContent>
                          </AccordionItem>
                      )
                  })}
              </Accordion>
          </CardContent>
      </Card>
    </div>
  );
}
