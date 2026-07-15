// --- CODE START ---
'use client';
import { useState, useEffect } from 'react';
// ১ নম্বর পরিবর্তন: query এবং limit ইম্পোর্ট করা হলো
import { onSnapshot, query as firestoreQuery, limit } from 'firebase/firestore';
import type { Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CollectionState<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useCollection<T>(queryObj: Query<DocumentData> | null) {
  const [state, setState] = useState<CollectionState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!queryObj) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prevState => ({ ...prevState, loading: true }));

    // ২ নম্বর পরিবর্তন: এখানে পাস করা কোয়েরির উপর ৫০টি ডকুমেন্টের সেফটি লিমিট দেওয়া হলো
    const limitedQuery = firestoreQuery(queryObj, limit(5000));

    const unsubscribe = onSnapshot(
      limitedQuery,
      (querySnapshot: QuerySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setState({ data, loading: false, error: null });
      },
      async (err: any) => {
        console.error("Firestore Query Error Detail:", err);

        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: (queryObj as any)._query?.path?.segments?.join('/') || 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setState({ data: null, loading: false, error: permissionError });
        } else {
          setState({ data: null, loading: false, error: err });
        }
      }
    );

    return () => unsubscribe();
  }, [queryObj]);

  return state;
}
// --- CODE END ---
