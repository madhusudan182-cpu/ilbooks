'use client';

import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // এখানে setDoc আনা হলো
import { db as firestore } from '@/firebase/config';

export default function OnlineStatusTracker() {
  useEffect(() => {
    const auth = getAuth();
    let userDocRef: any = null;
    let intervalId: any = null;

    const setOnlineStatus = async (uid: string, status: boolean) => {
      if (!firestore) return;
      try {
        const docRef = doc(firestore, 'users', uid);
        // setDoc এর সাথে merge: true ব্যবহার করলে ডকুমেন্ট না থাকলেও এরর আসবে না
        await setDoc(docRef, {
          isOnline: status,
          lastActive: serverTimestamp()
        }, { merge: true }); 
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        userDocRef = doc(firestore, 'users', user.uid);
        setOnlineStatus(user.uid, true);

        intervalId = setInterval(() => {
          setOnlineStatus(user.uid, true);
        }, 60000); 
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    });

    const handleVisibilityChange = () => {
      if (auth.currentUser) {
        if (document.visibilityState === 'hidden') {
          setOnlineStatus(auth.currentUser.uid, false);
        } else {
          setOnlineStatus(auth.currentUser.uid, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
