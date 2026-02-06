'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockBooks } from "@/lib/data";
import type { Book as BookType } from '@/lib/types';
import { BookOpen, ArrowLeft, Edit, Save, X, PlusCircle, Trash2, Upload } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function AllBooksPage() {
    const [isClient, setIsClient] = useState(false);
    const [books, setBooks] = useState<BookType[]>(() => JSON.parse(JSON.stringify(mockBooks)));
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedBooks, setEditedBooks] = useState<BookType[]>([]);
    const { toast } = useToast();
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
      setIsClient(true)
    }, []);

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        if (i === 1) continue;
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const booksByLevel = books.reduce((acc, b) => {
        if (!acc[b.level]) {
            acc[b.level] = [];
        }
        acc[b.level].push(b);
        return acc;
    }, {} as Record<string, BookType[]>);

    const handleEditClick = (level: string) => {
        const booksToEdit = booksByLevel[level] || [];
        setEditingLevel(level);
        setEditedBooks(JSON.parse(JSON.stringify(booksToEdit)));
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditedBooks([]);
    };

    const handleSaveClick = () => {
        if (!editingLevel) return;

        setBooks(currentBooks => {
            const otherBooks = currentBooks.filter(b => b.level !== editingLevel);
            return [...otherBooks, ...editedBooks].sort((a, b) => parseFloat(a.level) - parseFloat(b.level));
        });

        toast({ title: "Books saved!", description: `Changes for Level ${editingLevel} have been saved for this session.` });
        setEditingLevel(null);
        setEditedBooks([]);
    };

    const handleBookChange = (bookId: string, field: keyof BookType, value: string | number) => {
        setEditedBooks(current => current.map(b => b.id === bookId ? { ...b, [field]: value } : b));
    };
    
    const handleFileChange = (bookId: string, fileType: 'cover' | 'pdf', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                if (fileType === 'cover') {
                    handleBookChange(bookId, 'coverUrl', url);
                } else {
                    handleBookChange(bookId, 'pdfUrl', file.name); // Storing name for display
                }
            };
            reader.readAsDataURL(file);
            toast({title: `${file.name} ready for upload.`});
        }
    };


    const handleAddNewBook = () => {
        if(!editingLevel) return;
        const newBook: BookType = {
            id: `book-${Date.now()}`,
            title: 'New Book Title',
            author: 'Author Name',
            price: 0,
            coverUrl: 'https://picsum.photos/seed/newbook/400/600',
            level: editingLevel,
        };
        setEditedBooks(current => [...current, newBook]);
    };

    const handleRemoveBook = (bookId: string) => {
        setEditedBooks(current => current.filter(b => b.id !== bookId));
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
                        <BookOpen className="w-8 h-8 text-primary"/>
                        Books for All Levels
                    </CardTitle>
                    <CardDescription>
                        View and manage all competition books by level.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isClient ? <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
                        {allLevels.map((level) => {
                            const booksForLevel = booksByLevel[level] || [];
                            const isEditing = editingLevel === level;
                            return (
                                <AccordionItem value={`level-b-${level}`} key={level}>
                                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <span>
                                                Books for Level: {level}
                                                <span className="text-sm font-normal text-muted-foreground ml-2">({booksForLevel.length} books)</span>
                                            </span>
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                    {editedBooks.map((book) => (
                                                        <Card key={book.id} className="p-4 space-y-4 relative">
                                                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={() => handleRemoveBook(book.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                            <div className="relative aspect-[2/3] w-full">
                                                                <Image src={book.coverUrl} alt={book.title} fill className="object-cover rounded-md" data-ai-hint="book cover" />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`title-${book.id}`}>Title</Label>
                                                                <Input id={`title-${book.id}`} value={book.title} onChange={(e) => handleBookChange(book.id, 'title', e.target.value)} />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`author-${book.id}`}>Author</Label>
                                                                <Input id={`author-${book.id}`} value={book.author} onChange={(e) => handleBookChange(book.id, 'author', e.target.value)} />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`price-${book.id}`}>Price</Label>
                                                                <Input id={`price-${book.id}`} type="number" value={book.price} onChange={(e) => handleBookChange(book.id, 'price', e.target.valueAsNumber || 0)} />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="file" accept="image/*" className="hidden" ref={el => fileInputRefs.current[`cover-${book.id}`] = el} onChange={(e) => handleFileChange(book.id, 'cover', e)} />
                                                                <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[`cover-${book.id}`]?.click()}>
                                                                    <Upload className="mr-2 h-4 w-4" /> Cover
                                                                </Button>
                                                                
                                                                <input type="file" accept=".pdf" className="hidden" ref={el => fileInputRefs.current[`pdf-${book.id}`] = el} onChange={(e) => handleFileChange(book.id, 'pdf', e)} />
                                                                <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[`pdf-${book.id}`]?.click()}>
                                                                    <Upload className="mr-2 h-4 w-4" /> PDF
                                                                </Button>
                                                            </div>
                                                            {book.pdfUrl && <p className="text-xs text-muted-foreground truncate">PDF: {book.pdfUrl}</p>}
                                                        </Card>
                                                    ))}
                                                </div>
                                                <Button variant="outline" onClick={handleAddNewBook} className="mb-4">
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add New Book
                                                </Button>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                    <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                </div>
                                            </div>
                                        ) : booksForLevel.length > 0 ? (
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
