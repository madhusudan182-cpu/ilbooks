'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// ফায়ারবেসের নেটিভ অথ মেথড ইমপোর্ট করা হলো
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'; 
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UserComplainPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // লাইভ ইউজার স্টেট ট্র্যাক করার জন্য
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [type, setType] = useState('About Exam');
  const [complain, setComplain] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // কারেন্ট লগইন থাকা ইউজারের আসল ডেটা ডাইনামিকালি নিয়ে আসার ইফেক্ট
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    
    if (!currentUser) {
      toast({ title: 'Please login first!', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // ডাটাবেজে ইউজারের আসল নাম, ইমেইল ও আইডি সেভ হবে
      await addDoc(collection(firestore, 'complains'), {
        userId: currentUser.uid, 
        userName: currentUser.displayName || currentUser.email || 'Anonymous User', 
        type: type,
        complain: complain,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Complain submitted successfully!' });
      setComplain('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to submit complain', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-xl mx-auto space-y-4">
      {/* Back Button */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </Link>
      </div>

      <Card className="border border-gray-200 shadow-sm bg-gray-50/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center text-gray-600 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://w3.org">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
            </svg>
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">Complain Form</CardTitle>
          <CardDescription className="text-xs">
            Please let us know your issue, we will retrieve it shortly.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select type :</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              >
                <option value="About Exam">About Exam</option>
                <option value="About Books Shop">About Books Shop</option>
                <option value="About Patron">About Patron</option>
                <option value="About User Behaviour">About User Behaviour</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your Complaint :</label>
              <textarea
                required
                rows={4}
                value={complain}
                onChange={(e) => setComplain(e.target.value)}
                placeholder="Type your complaint details here..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/dashboard">
                <Button type="button" variant="outline" size="sm" className="text-xs text-gray-500">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" size="sm" disabled={submitting} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
