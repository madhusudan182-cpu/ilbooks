import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
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

async function cleanOldQuestions() {
  console.log("⏳ ফায়ারস্টোর থেকে পুরনো ও ডুপ্লিকেট প্রশ্নগুলো খোঁজা হচ্ছে...");
  
  const questionsRef = collection(db, 'questions');
  const snapshot = await getDocs(questionsRef);
  
  const batch = writeBatch(db);
  let deleteCount = 0;

  snapshot.forEach((document) => {
    const id = document.id;

    // ১. আপনার পুরনো সেই র্যান্ডম নম্বরের আইডিগুলো (যেমন: new-english-question-178397383...)
    // ২. অথবা প্রথমবার তৈরি হওয়া 'english-0.0-0' ফরম্যাটের আইডিগুলো
    // এগুলোকে চিহ্নিত করে ডিলিট লিস্টে নেওয়া হচ্ছে, কারণ আমাদের নতুন আইডি শুরু হবে 'q-' দিয়ে
    if (id.startsWith('new-') || id.startsWith('english-') || id.startsWith('bengali-') || id.startsWith('eng-') || id.startsWith('beng-')) {
      const docRef = doc(db, 'questions', id);
      batch.delete(docRef);
      deleteCount++;
    }
  });

  if (deleteCount > 0) {
    console.log(`🧹 মোট ${deleteCount}টি পুরনো বা ডুপ্লিকেট আইডি ডিলিট করার জন্য প্রস্তুত করা হয়েছে...`);
    await batch.commit();
    console.log("✅ ফায়ারস্টোর থেকে সফলভাবে সব পুরনো জটলা মুছে ফেলা হয়েছে!");
  } else {
    console.log("ℹ️ ডিলিট করার মতো কোনো পুরনো ফরম্যাটের আইডি পাওয়া যায়নি। ডাটাবেজ অলরেডি ফ্রেশ।");
  }

  process.exit(0);
}

cleanOldQuestions().catch(console.error);
