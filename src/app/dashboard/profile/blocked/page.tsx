'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

// ফায়ারবেস ইম্পোর্টসমূহ (আপনার প্রজেক্টের পাথ অনুযায়ী db এবং auth নিশ্চিত করুন)
import { db } from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';

interface BlockedUser {
  id: string;
  name: string;
  username: string;
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // ১. নিজের ইউজার ডকুমেন্ট থেকে ব্লকড আইডিগুলোর লিস্ট রিয়েল-টাইম ট্র্যাক করা
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const blockedIds: string[] = userData.blockedUsers || []; // ধরি ফিল্ডের নাম blockedUsers

        if (blockedIds.length === 0) {
          setBlockedUsers([]);
          setLoading(false);
          return;
        }

        try {
          // ২. ঐ আইডিগুলোর আসল নাম ও ইউজারনেম 'users' কালেকশন থেকে খুঁজে বের করা
          const usersRef = collection(db, 'users');
          // ফায়ারবেসের where 'in' কুয়েরি সর্বোচ্চ ৩০টি আইডির জন্য একবারে কাজ করে
          const q = query(usersRef, where('__name__', 'in', blockedIds.slice(0, 30)));
          const querySnapshot = await getDocs(q);
          
          const usersList: BlockedUser[] = [];
          querySnapshot.forEach((userDoc) => {
            const uData = userDoc.data();
            usersList.push({
              id: userDoc.id,
              name: uData.userName || uData.name || uData.customerName || 'Anonymous User',
              username: uData.username || '@user',
            });
          });

          setBlockedUsers(usersList);
        } catch (error) {
          console.error("Error fetching blocked users profiles: ", error);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase subscription error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ৩. ডাটাবেজ থেকে রিয়েল-টাইমে আনব্লক করার ফাংশন
  const handleUnblock = async (targetUserId: string) => {
const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // ডাটাবেজের blockedUsers অ্যারে থেকে এই আইডিটি রিমুভ করা
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(targetUserId)
      });

      alert("User unblocked successfully in database!");
    } catch (error) {
      console.error("Error unblocking user: ", error);
      alert("Failed to unblock user. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading blocked users from database...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* উপরের ব্যাক বাটন */}
      <div className="flex justify-start">
        <Button asChild variant="ghost">
          <Link href="/dashboard/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
            <ShieldAlert className="w-6 h-6" />
            Blocked Users List
          </CardTitle>
          <CardDescription>
            Manage users you have blocked. Unblocked users will be able to see your feed again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No blocked users found in your database.</p>
          ) : (
            <div className="divide-y">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleUnblock(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* নিচের ব্যাক বাটন */}
      <div className="flex justify-start">
        <Button asChild variant="ghost">
          <Link href="/dashboard/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}
