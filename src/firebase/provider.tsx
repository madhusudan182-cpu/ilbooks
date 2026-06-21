'use client';

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { firebaseConfig } from './config';

export interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Initialize Firebase on the client, and only once.
// This module is marked with 'use client', so this code will not run on the server.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const firebaseInstances = { app, auth, firestore };

// We can safely assert the type as we know it's initialized.
export const FirebaseContext = createContext<FirebaseContextValue>(firebaseInstances as FirebaseContextValue);

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
