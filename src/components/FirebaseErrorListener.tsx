'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { requestAndGetFCMToken, listenToForegroundMessages } from '@/utils/notifications';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    

    // --- আপনার আগের ফায়ারবেস এরর লিসেনার লজিক ---
    const handleError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);

      if (process.env.NODE_ENV === 'production') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to perform this action.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Firestore Permission Error",
          description: (
            <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4">
              <code className="text-white">{error.message}</code>
            </pre>
          ),
          duration: 15000,
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
