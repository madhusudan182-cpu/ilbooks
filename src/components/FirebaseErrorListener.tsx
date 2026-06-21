'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log the full error for debugging, but don't throw it to avoid the overlay.
      console.error("Caught Firestore Permission Error:", error); 
      
      if (process.env.NODE_ENV === 'production') {
        // In production, show a generic toast to the user
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have permission to perform this action.",
        });
      } else {
         // In development, show a detailed toast instead of the Next.js error overlay
         toast({
            variant: "destructive",
            title: "Firestore Permission Error",
            description: (
              <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4">
                <code className="text-white">{error.message}</code>
              </pre>
            ),
            duration: 15000, // Give more time to read the error
         });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
