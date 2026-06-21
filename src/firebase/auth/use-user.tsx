'use client';

import { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { FirebaseContext } from '@/firebase/provider';

interface AuthState {
  user: User | null;
  claims: any;
  loading: boolean;
}

export function useUser() {
  const { auth } = useContext(FirebaseContext);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    if (!auth) {
      setAuthState({ user: null, claims: null, loading: false });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthState(prevState => ({ ...prevState, user, loading: false }));
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setAuthState(prevState => ({ ...prevState, claims: tokenResult.claims, loading: false }));
      } else {
        setAuthState(prevState => ({ ...prevState, claims: null, loading: false }));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, [auth]);

  return authState;
}
