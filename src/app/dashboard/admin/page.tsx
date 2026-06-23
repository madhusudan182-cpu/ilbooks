'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Book, ListChecks, BookOpen, Package, ClipboardList, Landmark, BarChart, Server, CalendarClock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as UserProfile } from "@/lib/types";

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useUser();
    const firestore = useFirestore();
    const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

    const [isClient, setIsClient] = useState(false);
    
    // Strictly define admin access by email
    const isAdmin = user?.email?.toLowerCase() === 'madhusudan.182@gmail.com';

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !profileLoading && isClient && !isAdmin) {
            router.push('/dashboard');
        }
    }, [isAdmin, authLoading, profileLoading, isClient, router]);
    
    if (authLoading || profileLoading || !isClient) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!isAdmin) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
            <Shield className="w-8 h-8 text-primary" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Welcome to the admin dashboard, Owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you can manage users, questions, and other site settings.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><Package className="text-primary w-6 h-6"/> Customer Support</CardTitle>
              <CardDescription>View all completed transactions and order details.</CardDescription>
          </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/admin/orders">View All Orders</Link>
            </Button>

            {/* Button 1: Complain (Exam Results এর মতো একই স্টাইল) */}
            <Button asChild className="flex items-center gap-2">
              <Link href="/dashboard/admin/complain">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Complain
              </Link>
            </Button>

            {/* Button 2: Notifications (Exam Results এর মতো একই স্টাইল) */}
            <Button asChild className="flex items-center gap-2">
              <Link href="/dashboard/admin/notifications">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                Notifications
              </Link>
            </Button>
          </CardContent>

        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><ClipboardList className="text-primary w-6 h-6"/> Exam Results</CardTitle>
              <CardDescription>View the results of all user exam attempts.</CardDescription>
          </CardHeader>
          <CardContent className="flex wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/admin/results">View User Results</Link>
              </Button>
              <Button asChild className="bg-blue-500 hover:bg-blue-600">
                <Link href="/dashboard/admin/schedule">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Exam Schedule
                </Link>
              </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <Book className="w-6 h-6 text-primary"/> All Syllabi
              </CardTitle>
              <CardDescription>View all competition syllabi.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                <Link href="/dashboard/admin/syllabi">View Syllabus for All Levels</Link>
              </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-headline"><ListChecks className="text-primary w-6 h-6"/> All Questions</CardTitle>
                <CardDescription>All available questions are visible to admins for review, grouped by level.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard/admin/questions">View Questions for All Levels</Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <BookOpen className="w-6 h-6 text-primary"/> Manage Books
              </CardTitle>
              <CardDescription>View and manage all competition books by level or category.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                  <Link href="/dashboard/admin/books">All Levels</Link>
              </Button>
              <Button asChild>
                  <Link href="/dashboard/admin/books?tab=vocab">Vocabulary & Grammar</Link>
              </Button>
              <Button asChild>
                  <Link href="/dashboard/admin/books?tab=popular">Popular</Link>
              </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-headline">
              <Landmark className="text-primary w-6 h-6" /> Accounts
            </CardTitle>
            <CardDescription>Manage financial transactions and user rewards.</CardDescription>
          </CardHeader>
          <CardContent className="flex wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/admin/accounts/transactions">Transactions</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/accounts/prizes">Prizes & Gifts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><BarChart className="text-primary w-6 h-6"/> Analytics</CardTitle>
              <CardDescription>View user engagement and app performance.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                <Link href="/dashboard/admin/analytics">View Analytics</Link>
              </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}