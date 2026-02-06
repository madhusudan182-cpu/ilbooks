'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Book, ListChecks, BookOpen, Package, ClipboardList, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { currentUser } from "@/lib/auth";

export default function AdminPage() {
    const router = useRouter();
    // In a real app, this user would come from an authentication session.
    // To test non-admin protection, you can now change the user in src/lib/auth.ts
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
        if (!currentUser.isAdmin) {
            router.push('/dashboard');
        }
    }, [router]);
    
    if (!currentUser.isAdmin || !isClient) {
        return null; // Or a loading spinner while redirecting
    }

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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><Package className="text-primary w-6 h-6"/> Customer Orders</CardTitle>
              <CardDescription>View all completed transactions and order details.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                <Link href="/dashboard/admin/orders">View All Orders</Link>
              </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-headline"><ClipboardList className="text-primary w-6 h-6"/> Exam Results</CardTitle>
              <CardDescription>View the results of all user exam attempts.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                <Link href="/dashboard/admin/results">View User Results</Link>
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
                  <BookOpen className="w-6 h-6 text-primary"/> Books for All Levels
              </CardTitle>
              <CardDescription>View and manage all competition books by level.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                  <Link href="/dashboard/admin/books">View Books for All Levels</Link>
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
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/admin/accounts/transactions">Transactions</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/accounts/prizes">Prizes & Gifts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
