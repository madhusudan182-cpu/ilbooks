'use client';

// This file is now a simple barrel file for exporting Firebase hooks.
// The initialization logic has been moved into the provider for robustness.
import { useFirebaseApp, useAuth, useFirestore } from './provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

export {
  useFirebaseApp,
  useAuth,
  useFirestore,
  useUser,
  useCollection,
  useDoc,
};
