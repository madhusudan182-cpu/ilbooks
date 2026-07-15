import * as fs from 'fs';
import * as path from 'path';

// এই স্ক্রিপ্টটি আপনার জন্য বাকি ১৯০টি ফাইল স্বয়ংক্রিয়ভাবে বানিয়ে দেবে
const libDir = path.join(__dirname, '../src/lib');

// আমরা লেভেল ১.০ থেকে ১৯.০ পর্যন্ত লুপ চালাব
for (let mainLevel = 1; mainLevel <= 19; mainLevel++) {
  for (let subLevel = 0; subLevel <= 9; subLevel++) {
    const levelStr = `${mainLevel}-${subLevel}`; // যেমন: 1-0, 1-1, ..., 19-9
    const levelNumStr = `${mainLevel}.${subLevel}`; // যেমন: 1.0, 1.1, ..., 19.9

    // ১. ইংরেজি ফাইলের নাম এবং কোড তৈরি
    const engFileName = `level-${levelStr}-english-questions.ts`;
    const engFilePath = path.join(libDir, engFileName);
    const engVarName = `newEnglishLevel${mainLevel}_${subLevel}Questions`;
    const engContent = `export const ${engVarName}: any[] = [\n  // লেভেল ${levelNumStr} ইংরেজি প্রশ্ন পরবর্তীতে এখানে বসবে\n];\n`;

    // ২. বাংলা ফাইলের নাম এবং কোড তৈরি
    const benFileName = `level-${levelStr}-bengali-questions.ts`;
    const benFilePath = path.join(libDir, benFileName);
    const benVarName = `newBengaliLevel${mainLevel}_${subLevel}Questions`;
    const benContent = `export const ${benVarName}: any[] = [\n  // লেভেল ${levelNumStr} বাংলা প্রশ্ন পরবর্তীতে এখানে বসবে\n];\n`;

    // ফাইলগুলো যদি আগে থেকে তৈরি না থাকে, তবেই কেবল তৈরি হবে (যাতে আপনার কোড ডিলিট না হয়)
    if (!fs.existsSync(engFilePath)) {
      fs.writeFileSync(engFilePath, engContent);
    }
    if (!fs.existsSync(benFilePath)) {
      fs.writeFileSync(benFilePath, benContent);
    }
  }
}

console.log("✅ ২০০টি লেভেলের সব ফাঁকা ফাইল সফলভাবে আপনার 'src/lib' ফোল্ডারে তৈরি হয়ে গেছে!");
