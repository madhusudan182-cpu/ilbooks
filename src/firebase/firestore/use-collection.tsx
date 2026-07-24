'use client';
import { useState, useEffect } from 'react';
// ১ : query limit 
import { onSnapshot, query as firestoreQuery, limit } from 'firebase/firestore';
import type { Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CollectionState<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

// পরিবর্তন ১: এখানে dynamicLimit প্যারামিটার যোগ করা হয়েছে যার ডিফল্ট মান ৫০
export function useCollection<T>(
  queryObj: Query<DocumentData> | null, 
  dynamicLimit: number = 200 
) {
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

    // পরিবর্তন ২: ফিক্সড ৫০ এর জায়গায় dynamicLimit ভ্যারিয়েবলটি বসানো হয়েছে
    const limitedQuery = firestoreQuery(queryObj, limit(dynamicLimit));

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
    // পরিবর্তন ৩: ডিপেন্ডেন্সি অ্যারেতে dynamicLimit যোগ করা হয়েছে যাতে লিমিট পাল্টালে কোয়েরি রি-রান হয়
  }, [queryObj, dynamicLimit]); 

  return state;
}
