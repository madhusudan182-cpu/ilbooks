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

// টেক্সট থেকে একটি ইউনিক আইডি তৈরি করার জন্য ছোট ফাংশন (যাতে ফাইল চেঞ্জ হলে আইডি না বদলায়)
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
      const parts = file.split('-');
      let mainLevel = parts[1];
      let subLevel = parts[2];
      let subject = parts[3];

      if (parts.length === 4) {
        mainLevel = parts[1];
        subLevel = "0";
        subject = parts[2];
      }

      const levelStr = `${mainLevel}.${subLevel}`;
      const subjectFormatted = subject.charAt(0).toUpperCase() + subject.slice(1);

      const filePath = path.join(libDir, file);
      
      // নোড জেএস ক্যাশ ক্লিয়ার করা (যাতে প্রতিবার এডিটেড ফ্রেশ ফাইল রিড হয়)
      delete require.cache[require.resolve(filePath)];
      const fileModule = require(filePath);
      
      const exportKey = Object.keys(fileModule)[0];
      const questionsArray = fileModule[exportKey];

      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
        questionsArray.forEach((question, i) => {
          // প্রশ্ন ডিলিট বা এডিট করলেও যেন নির্দিষ্ট ডক আইডি চেনা যায় তার ব্যবস্থা
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
    console.log("ℹ️ কোনো প্রশ্ন খুঁজে পাওয়া যায়নি।");
  }
  
  process.exit(0);
}

seedDatabase().catch(console.error);
