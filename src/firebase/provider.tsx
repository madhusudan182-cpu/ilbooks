'use client';

import React, { createContext, useContext, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { usePathname, useSearchParams } from 'next/navigation';
import { logEvent } from 'firebase/analytics';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { firebaseConfig, analytics } from './config'; // config থেকে analytics ইম্পোর্ট করা হলো

export interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Initialize Firebase on the client, and only once.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const firebaseInstances = { app, auth, firestore };

export const FirebaseContext = createContext<FirebaseContextValue>(firebaseInstances as FirebaseContextValue);

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // স্বয়ংক্রিয়ভাবে পেজ ভিউ ট্র্যাকিং লজিক
  useEffect(() => {
    if (analytics) {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      logEvent(analytics, 'page_view', {
        page_path: currentUrl,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => useContext(FirebaseContext).app;
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirestore = () => useContext(FirebaseContext).firestore;
