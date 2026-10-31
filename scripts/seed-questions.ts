// // ফাইলের শুরু - প্রয়োজনীয় প্যাকেজ ও মডিউল ইম্পোর্ট করা হলো
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function seedDatabase() {
  console.log("🚀 ফায়ারস্টোর স্ক্যানিং ও আপলোড প্রসেস শুরু হচ্ছে...\n");
  
  // টার্মিনাল কমান্ড থেকে নির্দিষ্ট ফাইলের নাম নেওয়া (যদি দেওয়া থাকে)
  // যেমন: npm run db:seed level-1-1-english.ts
  const specificFileArg = process.argv[2];

  const libDir = path.join(__dirname, '../src/lib');
  if (!fs.existsSync(libDir)) {
    console.log("❌ এরর: src/lib ফোল্ডারটি খুঁজে পাওয়া যায়নি!");
    process.exit(1);
  }

  let files = fs.readdirSync(libDir);

  // যদি ইউজার নির্দিষ্ট কোনো ফাইল উল্লেখ করেন, তবে শুধু সেটি ফিল্টার করা হবে
  if (specificFileArg) {
    if (files.includes(specificFileArg)) {
      files = [specificFileArg];
      console.log(`🎯 নির্দিষ্ট ফাইল ফিল্টার করা হয়েছে: ${specificFileArg}`);
    } else {
      console.log(`❌ এরর: '${specificFileArg}' ফাইলটি src/lib ফোল্ডারে খুঁজে পাওয়া যায়নি!`);
      process.exit(1);
    }
  } else {
    console.log("ℹ️ কোনো নির্দিষ্ট ফাইলের নাম দেওয়া হয়নি। src/lib এর সকল ফাইল প্রসেস করা হবে।");
  }

  const questionsRef = collection(db, 'questions');
  let totalUploaded = 0;
  let currentBatch = writeBatch(db);
  let batchCounter = 0;

  for (const file of files) {
    if (file.startsWith('level-') && (file.endsWith('.ts') || file.endsWith('.js'))) {
      const filePath = path.join(libDir, file);
      const fileNameWithoutExt = file.replace(/\.[^/.]+$/, ""); // এক্সটেনশন বাদ দেওয়া

      try {
        // ES Modules-এ ক্লিন ও ডায়নামিক ইম্পোর্টের জন্য ক্যাশ এড়াতে টাইমস্ট্যাম্প ব্যবহার
        const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
        const fileModule = await import(fileUrl);
        
        const validKey = Object.keys(fileModule).find(key => key !== '__esModule');
        const questionsArray = validKey ? fileModule[validKey] : null;

        if (Array.isArray(questionsArray)) {
          console.log(`📄 ফাইল সনাক্ত: ${file} -> (${questionsArray.length}টি প্রশ্ন পাওয়া গেছে)`);
          
          for (let i = 0; i < questionsArray.length; i++) {
            const question = questionsArray[i];
            const uniqueId = `${fileNameWithoutExt}-q${i + 1}`;
            const docRef = doc(questionsRef, uniqueId);

            // লেভেল এবং সাবজেক্ট এক্সট্রাক্ট করা
            const parts = fileNameWithoutExt.split('-');
            const mainLevel = parts[1] || "0";
            const subLevel = parts[2] || "0";
            const levelStr = `${mainLevel}.${subLevel}`;
            const subjectRaw = parts[3] || "english";
            const subjectFormatted = subjectRaw.charAt(0).toUpperCase() + subjectRaw.slice(1);

            currentBatch.set(docRef, {
              ...question,
              level: levelStr,
              subject: subjectFormatted,
              id: uniqueId
            }, { merge: true });

            totalUploaded++;
            batchCounter++;

            // ফায়ারস্টোর ব্যাচ লিমিট হ্যান্ডেল করা
            if (batchCounter === 400) {
              console.log(`⏳ ৪০০টি প্রশ্নের একটি ব্যাচ আপলোড হচ্ছে...`);
              await currentBatch.commit();
              currentBatch = writeBatch(db);
              batchCounter = 0;
            }
          }
        } else {
          console.log(`⚠️ ফাইল স্কিপড: ${file} (কোনো সঠিক অ্যারে খুঁজে পাওয়া যায়নি)`);
        }
      } catch (error) {
        console.error(`❌ ফাইল প্রসেস করতে সমস্যা হয়েছে ${file}:`, error);
      }
    }
  }

  // অবশিষ্ট ডেটা আপলোড করা
  if (batchCounter > 0) {
    await currentBatch.commit();
  }

  console.log(`\n🎉 অপারেশন সফল! মোট ${totalUploaded} টি প্রশ্ন ডাটাবেজে আপলোড হয়েছে।`);
  process.exit(0);
}

seedDatabase().catch(console.error);
// // ফাইলের কোড এখানেই শেষ হলো
