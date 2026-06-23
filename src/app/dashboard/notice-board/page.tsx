'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NoticeBoardPage() {
  const firestore = useFirestore();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifQuery, setNotifQuery] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firestore && userId) {
      setNotifQuery(
        query(
          collection(firestore, 'user_notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      );
    }
  }, [firestore, userId]);

  const { data: dbNotifications } = useCollection(notifQuery);

  // পেজে আসা মাত্রই সব নোটিফিকেশনকে একসাথে Read হিসেবে মার্ক করার শক্তিশালী লজিক
  useEffect(() => {
    if (!firestore || !dbNotifications || dbNotifications.length === 0) return;
    
    const markAllAsRead = async () => {
      const promises = dbNotifications.map((notif: any) => {
        if (!notif.isRead) {
          const docRef = doc(firestore, 'user_notifications', notif.id);
          return updateDoc(docRef, { isRead: true });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    };

    markAllAsRead().catch(err => console.error("Error marking all read:", err));
  }, [firestore, dbNotifications]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
      <div className="mb-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-xl font-headline">
            <Bell className="w-6 h-6 text-primary" />
            All Notifications
          </CardTitle>
          <CardDescription>
            Here is a list of your recent activity and admin notices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbNotifications && dbNotifications.length > 0 ? (
            <div className="space-y-4">
              {dbNotifications.map((notification: any, index: number) => (
                <div key={notification.id || index} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                  <div className="bg-muted p-2 rounded-full">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">
                      {notification.message}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {notification.createdAt?.toDate 
                      ? new Date(notification.createdAt.toDate()).toLocaleDateString() 
                      : 'Just now'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You have no new notifications.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
