'use client';

import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import type { Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CollectionState<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [state, setState] = useState<CollectionState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prevState => ({ ...prevState, loading: true }));

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot: QuerySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setState({ data, loading: false, error: null });
      },
      async (err: any) => {
        // ALWAYS log the full error to console. 
        // This is important because "Permission Denied" can sometimes be a missing index error.
        console.error("Firestore Query Error Detail:", err);

        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: (query as any)._query?.path?.segments?.join('/') || 'unknown',
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
  }, [query]);

  return state;
}