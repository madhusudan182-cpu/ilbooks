'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BookCard = ({ book }: { book: BookType }) => (
    <Card className="overflow-hidden">
        <div className="relative aspect-[2/3] w-full">
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" data-ai-hint="book cover" />
        </div>
        <div className="p-2 text-sm">
            <h4 className="font-semibold truncate">{book.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            <p className="font-bold text-primary mt-1">Tk {book.price}</p>
        </div>
    </Card>
);

const EditableBookGrid = ({ 
    booksToEdit, 
    onBookChange, 
    onFileChange, 
    onRemoveBook 
}: {
    booksToEdit: BookType[];
    onBookChange: (bookId: string, field: keyof BookType, value: string | number) => void;
    onFileChange: (bookId: string, fileType: 'cover' | 'pdf', event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveBook: (bookId: string) => void;
}) => {
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {booksToEdit.map((book) => (
                <Card key={book.id} className="p-4 space-y-4 relative">
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={() => onRemoveBook(book.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="relative aspect-[2/3] w-full">
                        <Image src={book.coverUrl} alt={book.title} fill className="object-cover rounded-md" data-ai-hint="book cover" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`title-${book.id}`}>Title</Label>
                        <Input id={`title-${book.id}`} value={book.title} onChange={(e) => onBookChange(book.id, 'title', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`author-${book.id}`}>Author</Label>
                        <Input id={`author-${book.id}`} value={book.author} onChange={(e) => onBookChange(book.id, 'author', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`price-${book.id}`}>Price</Label>
                        <Input id={`price-${book.id}`} type="number" value={book.price} onChange={(e) => onBookChange(book.id, 'price', e.target.valueAsNumber || 0)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="file" accept="image/*" className="hidden" ref={el => fileInputRefs.current[`cover-${book.id}`] = el} onChange={(e) => onFileChange(book.id, 'cover', e)} />
                        <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[`cover-${book.id}`]?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Cover
                        </Button>
                        
                        <input type="file" accept=".pdf" className="hidden" ref={el => fileInputRefs.current[`pdf-${book.id}`] = el} onChange={(e) => onFileChange(book.id, 'pdf', e)} />
                        <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[`pdf-${book.id}`]?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> PDF
                        </Button>
                    </div>
                    {book.pdfUrl && <p className="text-xs text-muted-foreground truncate">PDF: {book.pdfUrl}</p>}
                </Card>
            ))}
        </div>
    );
};

function BooksPageContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'levels';
    const [isClient, setIsClient] = useState(false);
    const [books, setBooks] = useState<BookType[]>(() => JSON.parse(JSON.stringify(mockBooks)));
    const { toast } = useToast();
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // State for Levels Tab
    const [editingLevel, setEditingLevel] = useState<string | null>(null);
    const [editedLevelBooks, setEditedLevelBooks] = useState<BookType[]>([]);
    
    // State for Vocab Tab
    const [isEditingVocab, setIsEditingVocab] = useState(false);
    const [editedVocabBooks, setEditedVocabBooks] = useState<BookType[]>([]);

    // State for Popular Tab
    const [isEditingPopular, setIsEditingPopular] = useState(false);
    const [editedPopularBooks, setEditedPopularBooks] = useState<BookType[]>([]);

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
        if (!b.category && b.level) {
            if (!acc[b.level]) acc[b.level] = [];
            acc[b.level].push(b);
        }
        return acc;
    }, {} as Record<string, BookType[]>);

    const vocabBooks = books.filter(b => b.category === 'vocab_grammar');
    const popularBooks = books.filter(b => b.category === 'popular');

    // Handlers for Levels
    const handleLevelEditClick = (level: string) => {
        const booksToEdit = booksByLevel[level] || [];
        setEditingLevel(level);
        setEditedLevelBooks(JSON.parse(JSON.stringify(booksToEdit)));
    };
    const handleLevelCancelClick = () => {
        setEditingLevel(null);
        setEditedLevelBooks([]);
    };
    const handleLevelSaveClick = () => {
        if (!editingLevel) return;
        setBooks(currentBooks => {
            const otherBooks = currentBooks.filter(b => b.level !== editingLevel);
            return [...otherBooks, ...editedLevelBooks].sort((a, b) => parseFloat(a.level) - parseFloat(b.level));
        });
        toast({ title: "Books saved!", description: `Changes for Level ${editingLevel} have been saved for this session.` });
        setEditingLevel(null);
        setEditedLevelBooks([]);
    };
    const handleLevelBookChange = (bookId: string, field: keyof BookType, value: string | number) => {
        setEditedLevelBooks(current => current.map(b => b.id === bookId ? { ...b, [field]: value } : b));
    };
    const handleLevelFileChange = (bookId: string, fileType: 'cover' | 'pdf', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                if (fileType === 'cover') {
                    handleLevelBookChange(bookId, 'coverUrl', url);
                } else {
                    handleLevelBookChange(bookId, 'pdfUrl', file.name);
                }
            };
            reader.readAsDataURL(file);
            toast({title: `${file.name} ready for upload.`});
        }
    };
    const handleAddNewLevelBook = () => {
        if(!editingLevel) return;
        const newBook: BookType = {
            id: `book-${Date.now()}`, title: 'New Book Title', author: 'Author Name', price: 0,
            coverUrl: 'https://picsum.photos/seed/newbook/400/600', level: editingLevel,
        };
        setEditedLevelBooks(current => [...current, newBook]);
    };
    const handleRemoveLevelBook = (bookId: string) => setEditedLevelBooks(current => current.filter(b => b.id !== bookId));

    // Handlers for Vocab
    const handleVocabEditClick = () => {
        setIsEditingVocab(true);
        setEditedVocabBooks(JSON.parse(JSON.stringify(vocabBooks)));
    };
    const handleVocabCancelClick = () => setIsEditingVocab(false);
    const handleVocabSaveClick = () => {
        setBooks(current => [...current.filter(b => b.category !== 'vocab_grammar'), ...editedVocabBooks]);
        toast({ title: "Vocabulary books saved!" });
        setIsEditingVocab(false);
    };
    const handleVocabBookChange = (bookId: string, field: keyof BookType, value: string | number) => {
        setEditedVocabBooks(current => current.map(b => b.id === bookId ? { ...b, [field]: value } : b));
    };
    const handleVocabFileChange = (bookId: string, fileType: 'cover' | 'pdf', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                handleVocabBookChange(bookId, fileType === 'cover' ? 'coverUrl' : 'pdfUrl', fileType === 'cover' ? url : file.name);
            };
            reader.readAsDataURL(file);
            toast({title: `${file.name} ready for upload.`});
        }
    };
    const handleAddNewVocabBook = () => {
        const newBook: BookType = {
            id: `book-${Date.now()}`, title: 'New Book Title', author: 'Author Name', price: 0,
            coverUrl: 'https://picsum.photos/seed/newvocab/400/600', level: 'all', category: 'vocab_grammar'
        };
        setEditedVocabBooks(current => [...current, newBook]);
    };
    const handleRemoveVocabBook = (bookId: string) => setEditedVocabBooks(current => current.filter(b => b.id !== bookId));

    // Handlers for Popular
    const handlePopularEditClick = () => {
        setIsEditingPopular(true);
        setEditedPopularBooks(JSON.parse(JSON.stringify(popularBooks)));
    };
    const handlePopularCancelClick = () => setIsEditingPopular(false);
    const handlePopularSaveClick = () => {
        setBooks(current => [...current.filter(b => b.category !== 'popular'), ...editedPopularBooks]);
        toast({ title: "Popular books saved!" });
        setIsEditingPopular(false);
    };
    const handlePopularBookChange = (bookId: string, field: keyof BookType, value: string | number) => {
        setEditedPopularBooks(current => current.map(b => b.id === bookId ? { ...b, [field]: value } : b));
    };
    const handlePopularFileChange = (bookId: string, fileType: 'cover' | 'pdf', event: React.ChangeEvent<HTMLInputElement>) => {
         const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                handlePopularBookChange(bookId, fileType === 'cover' ? 'coverUrl' : 'pdfUrl', fileType === 'cover' ? url : file.name);
            };
            reader.readAsDataURL(file);
            toast({title: `${file.name} ready for upload.`});
        }
    };
    const handleAddNewPopularBook = () => {
        const newBook: BookType = {
            id: `book-${Date.now()}`, title: 'New Book Title', author: 'Author Name', price: 0,
            coverUrl: 'https://picsum.photos/seed/newpopular/400/600', level: 'all', category: 'popular'
        };
        setEditedPopularBooks(current => [...current, newBook]);
    };
    const handleRemovePopularBook = (bookId: string) => setEditedPopularBooks(current => current.filter(b => b.id !== bookId));


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
                        Manage Books
                    </CardTitle>
                    <CardDescription>
                        View and manage all competition books by level or category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isClient ? (
                        <div className="mt-4">
                            {tab === 'levels' && (
                                <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
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
                                                                onClick={(e) => { e.stopPropagation(); handleLevelEditClick(level); }}
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
                                                           <EditableBookGrid 
                                                                booksToEdit={editedLevelBooks}
                                                                onBookChange={handleLevelBookChange}
                                                                onFileChange={handleLevelFileChange}
                                                                onRemoveBook={handleRemoveLevelBook}
                                                           />
                                                            <Button variant="outline" onClick={handleAddNewLevelBook} className="mb-4">
                                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                                Add New Book
                                                            </Button>
                                                            <div className="flex justify-end gap-2 mt-4">
                                                                <Button variant="outline" onClick={handleLevelCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                                <Button onClick={handleLevelSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                            </div>
                                                        </div>
                                                    ) : booksForLevel.length > 0 ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                            {booksForLevel.map((book) => <BookCard key={book.id} book={book} />)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground text-sm py-4 px-4">No books defined for this level.</p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                            )}
                            {tab === 'vocab' && (
                                <>
                                {isEditingVocab ? (
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex justify-end mb-4">
                                            <Button variant="outline" onClick={handleVocabCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                            <Button onClick={handleVocabSaveClick} className="ml-2"><Save className="mr-2 h-4 w-4" />Save</Button>
                                        </div>
                                        <EditableBookGrid 
                                            booksToEdit={editedVocabBooks}
                                            onBookChange={handleVocabBookChange}
                                            onFileChange={handleVocabFileChange}
                                            onRemoveBook={handleRemoveVocabBook}
                                        />
                                        <Button variant="outline" onClick={handleAddNewVocabBook} className="mt-4">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={handleVocabEditClick}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                        </div>
                                        {vocabBooks.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {vocabBooks.map((book) => <BookCard key={book.id} book={book} />)}
                                            </div>
                                        ) : <p className="text-muted-foreground">No books in this category.</p>}
                                    </div>
                                )}
                                </>
                            )}
                            {tab === 'popular' && (
                                <>
                                {isEditingPopular ? (
                                     <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex justify-end mb-4">
                                            <Button variant="outline" onClick={handlePopularCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                            <Button onClick={handlePopularSaveClick} className="ml-2"><Save className="mr-2 h-4 w-4" />Save</Button>
                                        </div>
                                        <EditableBookGrid 
                                            booksToEdit={editedPopularBooks}
                                            onBookChange={handlePopularBookChange}
                                            onFileChange={handlePopularFileChange}
                                            onRemoveBook={handleRemovePopularBook}
                                        />
                                        <Button variant="outline" onClick={handleAddNewPopularBook} className="mt-4">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                                        </Button>
                                    </div>
                                ) : (
                                     <div>
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={handlePopularEditClick}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                        </div>
                                        {popularBooks.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {popularBooks.map((book) => <BookCard key={book.id} book={book} />)}
                                            </div>
                                        ) : <p className="text-muted-foreground">No books in this category.</p>}
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                     ) : null}
                </CardContent>
            </Card>
        </div>
    );
}


export default function AllBooksPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BooksPageContent />
        </Suspense>
    );
}
