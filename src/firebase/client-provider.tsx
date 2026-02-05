'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

export function FirebaseAppProvider({ children }: { children: React.ReactNode }) {
  const { app, auth, firestore } = initializeFirebase();
  return (
    <FirebaseProvider value={{ app, auth, firestore }}>
      {children}
    </FirebaseProvider>
  );
}
