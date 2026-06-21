'use client';

import { FirebaseProvider } from '@/firebase/provider';

// This file now simply re-exports the main FirebaseProvider under the name FirebaseAppProvider
// to maintain compatibility with its usage in the root layout.
export { FirebaseProvider as FirebaseAppProvider };
