import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: "bd-job-preparation-59001-7613b.firebaseapp.com",
  projectId: "bd-job-preparation-59001-7613b",
  storageBucket: "bd-job-preparation-59001-7613b.firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:0cc4a0ffdd1c4c6c1437db",
  measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);