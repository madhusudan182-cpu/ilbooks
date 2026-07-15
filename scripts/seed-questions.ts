import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateUniqueId(text: string, fallback: string): string {
  if (!text) return fallback;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `q-${Math.abs(hash)}`;
}

async function seedDatabase() {
  console.log("⏳ ফায়ারস্টোরে আপনার ২০০ লেভেলের সব ফাইল ফ্রেশ স্ক্যান ও সিঙ্ক হচ্ছে...");
  
  const batch = writeBatch(db);
  const questionsRef = collection(db, 'questions');
  let totalUploaded = 0;

  const libDir = path.join(__dirname, '../src/lib');
  const files = fs.readdirSync(libDir);

  for (const file of files) {
    if (file.startsWith('level-') && file.endsWith('.ts')) {
      const parts = file.replace('.ts', '').split('-');
      
      let mainLevel = "0";
      let subLevel = "0";
      let subject = "english";

      // যদি ফাইলের নাম level-0-english-questions ফরম্যাটে হয় (৪টি অংশ)
      if (parts.length === 4) {
        mainLevel = parts[1]; // "0"
        subLevel = "0";       // "0"
        subject = parts[2];   // "english" বা "bengali"
      } 
      // যদি ফাইলের নাম level-0-1-english-questions ফরম্যাটে হয় (৫টি অংশ)
      else if (parts.length === 5) {
        mainLevel = parts[1];
        subLevel = parts[2];
        subject = parts[3];
      }

      const levelStr = `${mainLevel}.${subLevel}`;
      const subjectFormatted = subject.charAt(0).toUpperCase() + subject.slice(1);

      const filePath = path.join(libDir, file);
      
      // ক্যাশ ক্লিয়ার করে ফ্রেশ ইম্পোর্ট করা
      delete require.cache[require.resolve(filePath)];
      const fileModule = require(filePath);
      
      // মডিউলের ভেতরের আসল ডাটা কি (Key) খুঁজে বের করা
      const validKey = Object.keys(fileModule).find(key => key !== '__esModule');
      const questionsArray = validKey ? fileModule[validKey] : null;

      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
        questionsArray.forEach((question, i) => {
          const uniqueId = generateUniqueId(question.questionText, `${subject}-${levelStr}-${i}`);
          const docRef = doc(questionsRef, uniqueId);
          
          batch.set(docRef, {
            ...question,
            level: levelStr,
            subject: subjectFormatted,
            id: uniqueId
          }, { merge: true });

          totalUploaded++;
        });
      }
    }
  }

  if (totalUploaded > 0) {
    await batch.commit();
    console.log(`✅ সফলভাবে মোট ${totalUploaded}টি প্রশ্ন ফায়ারস্টোরে সিঙ্ক হয়েছে!`);
  } else {
    console.log("ℹ️ কোনো প্রশ্ন খুঁজে পাওয়া যায়নি। ফাইলের ভেতরের অ্যারে চেক করুন।");
  }
  
  process.exit(0);
}

seedDatabase().catch(console.error);
