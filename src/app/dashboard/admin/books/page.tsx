'use client';

import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockBooks } from "@/lib/data";
import type { Book as BookType } from '@/lib/types';
import { BookOpen, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function AllBooksPage() {
    const [isClient, setIsClient] = useState(false)
 
    useEffect(() => {
      setIsClient(true)
    }, [])

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        if (i === 1) continue; // Skip level 1.x
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const booksByLevel = mockBooks.reduce((acc, b) => {
        if (!acc[b.level]) {
            acc[b.level] = [];
        }
        acc[b.level].push(b);
        return acc;
    }, {} as Record<string, BookType[]>);
    
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
                        <BookOpen className="w-8 h-8 text-primary"/>
                        Books for All Levels
                    </CardTitle>
                    <CardDescription>
                        View and manage all competition books by level.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isClient ? <Accordion type="multiple" className="w-full max-h-[60rem] overflow-y-auto">
                        {allLevels.map((level) => {
                            const booksForLevel = booksByLevel[level] || [];
                            return (
                                <AccordionItem value={`level-b-${level}`} key={level}>
                                    <AccordionTrigger className="text-left font-semibold">
                                        Books for Level: {level}
                                        <span className="text-sm font-normal text-muted-foreground ml-2">({booksForLevel.length} books)</span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {booksForLevel.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {booksForLevel.map((book) => (
                                                    <Card key={book.id} className="overflow-hidden">
                                                        <div className="relative aspect-[2/3] w-full">
                                                            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" data-ai-hint="book cover" />
                                                        </div>
                                                        <div className="p-2 text-sm">
                                                            <h4 className="font-semibold truncate">{book.title}</h4>
                                                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                                                            <p className="font-bold text-primary mt-1">Tk {book.price}</p>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm py-4 px-4">No books defined for this level.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion> : null}
                </CardContent>
            </Card>
        </div>
    );
}
