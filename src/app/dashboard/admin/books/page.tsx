'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Book as BookType } from '@/lib/types';
import { BookOpen, ArrowLeft, Edit, Save, X, PlusCircle, Trash2, Upload } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

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
    onFileChange: (bookId: string, fileType: 'cover', event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveBook: (bookId: string) => void;
}) => {
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
      const setFileInputRef = (bookId: string, el: HTMLInputElement | null) => {
    if (el) {
      fileInputRefs.current[`cover-${bookId}`] = el;
    } else {
      delete fileInputRefs.current[`cover-${bookId}`];
    }
  };

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
                     <div className="grid gap-2">
                        <Label htmlFor={`pdfUrl-${book.id}`}>PDF URL</Label>
                        <Input id={`pdfUrl-${book.id}`} placeholder="https://example.com/book.pdf" value={book.pdfUrl || ''} onChange={(e) => onBookChange(book.id, 'pdfUrl', e.target.value)} />
                         <p className="text-xs text-muted-foreground">Upload PDF to a service (e.g. Google Drive) and paste the public link here.</p>
                    </div>
                     <div className="grid gap-2">
                        <Label>Cover Image</Label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={(el) => setFileInputRef(book.id, el)}

                                onChange={(e) => onFileChange(book.id, 'cover', e)}
                                />

                        <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[`cover-${book.id}`]?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload New Cover
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};

type EditMode = {
    type: 'levels' | 'vocab' | 'popular';
    identifier: string; // The level string for 'levels', or just 'vocab'/'popular'
}

function BooksPageContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'levels';
    const firestore = useFirestore();
    const booksQuery = useMemo(() => (firestore ? collection(firestore, 'books') : null), [firestore]);
    const { data: books, loading: booksLoading } = useCollection<BookType>(booksQuery);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [editingMode, setEditingMode] = useState<EditMode | null>(null);
    const [editedBooks, setEditedBooks] = useState<BookType[]>([]);

    const allLevels: string[] = [];
    for (let i = 0; i <= 19; i++) {
        for (let j = 0; j <= 9; j++) {
            allLevels.push(`${i}.${j}`);
        }
    }

    const booksByLevel = useMemo(() => books?.reduce((acc, b) => {
        if (!b.category && b.level) {
            if (!acc[b.level]) acc[b.level] = [];
            acc[b.level].push(b);
        }
        return acc;
    }, {} as Record<string, BookType[]>) || {}, [books]);

    const vocabBooks = useMemo(() => books?.filter(b => b.category === 'vocab_grammar') || [], [books]);
    const popularBooks = useMemo(() => books?.filter(b => b.category === 'popular') || [], [books]);

    const handleEditClick = (type: EditMode['type'], identifier: string) => {
        let booksToEdit: BookType[] = [];
        if (type === 'levels') {
            booksToEdit = booksByLevel[identifier] || [];
        } else if (type === 'vocab') {
            booksToEdit = vocabBooks;
        } else if (type === 'popular') {
            booksToEdit = popularBooks;
        }
        setEditingMode({ type, identifier });
        setEditedBooks(JSON.parse(JSON.stringify(booksToEdit)));
    };

    const handleCancelClick = () => {
        setEditingMode(null);
        setEditedBooks([]);
    };

    const handleSaveClick = () => {
        if (!editingMode || !firestore) return;

        const batch = writeBatch(firestore);

        const originalBooks: BookType[] = (
            editingMode.type === 'levels' ? books?.filter(book => book.level === editingMode.identifier) :
            editingMode.type === 'vocab' ? books?.filter(b => b.category === 'vocab_grammar') :
            books?.filter(b => b.category === 'popular')
        ) || [];

        const editedBookIds = new Set(editedBooks.map(b => b.id));

        // Books to delete
        originalBooks.forEach(ogBook => {
            if (!editedBookIds.has(ogBook.id)) {
                batch.delete(doc(firestore, "books", ogBook.id));
            }
        });

        // Books to add or update
        editedBooks.forEach(book => {
            const docRef = doc(firestore, "books", book.id);
            
            const dataToSave: { [key: string]: any } = {
                title: book.title,
                author: book.author,
                price: book.price,
                coverUrl: book.coverUrl,
                level: book.level,
            };
    
            if (book.category) {
                dataToSave.category = book.category;
            }
            if (book.pdfUrl) {
                dataToSave.pdfUrl = book.pdfUrl;
            } else {
                dataToSave.pdfUrl = ''; // Explicitly clear if empty
            }

            batch.set(docRef, dataToSave, { merge: true });
        });

        batch.commit()
            .then(() => {
                toast({ title: "Books saved!", description: "Your changes have been saved permanently." });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'books',
                    operation: 'write',
                    requestResourceData: editedBooks
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setEditingMode(null);
                setEditedBooks([]);
            });
    };

    const handleBookChange = (bookId: string, field: keyof BookType, value: string | number) => {
        setEditedBooks(current => current.map(b => b.id === bookId ? { ...b, [field]: value } : b));
    };

    const handleFileChange = (bookId: string, fileType: 'cover', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                handleBookChange(bookId, 'coverUrl', url);
            };
            reader.readAsDataURL(file);
            toast({title: `New cover "${file.name}" ready for upload.`});
        }
    };
    
    const handleAddNewBook = () => {
        if (!editingMode) return;

        const newBook: BookType = {
            id: `book-${Date.now()}`,
            title: 'New Book Title',
            author: 'Author Name',
            price: 0,
            coverUrl: `https://picsum.photos/seed/new-${Date.now()}/400/600`,
            level: editingMode.type === 'levels' ? editingMode.identifier : 'all',
            pdfUrl: '',
        };

        if (editingMode.type === 'vocab') {
            newBook.category = 'vocab_grammar';
        } else if (editingMode.type === 'popular') {
            newBook.category = 'popular';
        }

        setEditedBooks(current => [...current, newBook]);
    };

    const handleRemoveBook = (bookId: string) => {
        setEditedBooks(current => current.filter(b => b.id !== bookId));
    };

    const isEditingVocab = editingMode?.type === 'vocab';
    const isEditingPopular = editingMode?.type === 'popular';

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
                     {(booksLoading || !isClient) ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="mt-4">
                            {tab === 'levels' && (
                                <Accordion type="single" collapsible className="w-full max-h-[60rem] overflow-y-auto">
                                    {allLevels.map((level) => {
                                        const booksForLevel = booksByLevel[level] || [];
                                        const isEditing = editingMode?.type === 'levels' && editingMode.identifier === level;
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
                                                                onClick={(e) => { e.stopPropagation(); handleEditClick('levels', level); }}
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
                                                                booksToEdit={editedBooks}
                                                                onBookChange={handleBookChange}
                                                                onFileChange={handleFileChange}
                                                                onRemoveBook={handleRemoveBook}
                                                           />
                                                            <Button variant="outline" onClick={handleAddNewBook} className="mt-4">
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
                                        <div className="flex justify-end mb-4 gap-2">
                                            <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                            <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                        </div>
                                        <EditableBookGrid 
                                            booksToEdit={editedBooks}
                                            onBookChange={handleBookChange}
                                            onFileChange={handleFileChange}
                                            onRemoveBook={handleRemoveBook}
                                        />
                                        <Button variant="outline" onClick={handleAddNewBook} className="mt-4">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={() => handleEditClick('vocab', 'vocab')}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
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
                                        <div className="flex justify-end mb-4 gap-2">
                                            <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                            <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" />Save</Button>
                                        </div>
                                        <EditableBookGrid 
                                            booksToEdit={editedBooks}
                                            onBookChange={handleBookChange}
                                            onFileChange={handleFileChange}
                                            onRemoveBook={handleRemoveBook}
                                        />
                                        <Button variant="outline" onClick={handleAddNewBook} className="mt-4">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                                        </Button>
                                    </div>
                                ) : (
                                     <div>
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={() => handleEditClick('popular', 'popular')}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
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
                     )}
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

    