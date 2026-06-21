'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ComplainPage() {
  const router = useRouter();
  const [complainType, setComplainType] = useState('About Exam');
  const [complainText, setComplainText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

    const handleComplainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complainText.trim()) return alert("Please write your complain");
    
    setIsSubmitting(true);
    try {
      // ডাইনামিকালি ফায়ারবেস ইমপোর্ট করা হচ্ছে, যাতে ফাইলের ওপরে কোনো পাথ না দেওয়া লাগে
      const { addDoc, collection, serverTimestamp, getFirestore } = await import('firebase/firestore');
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const { initializeApp, getApps } = await import('firebase/app');
      
      // ফায়ারবেস অ্যাপ অলরেডি ইনিশিয়ালাইজড থাকলে সেটা নেবে, নাহলে ফাঁকা অবজেক্ট বা ডিফল্ট চেক করবে
      const firestoreInstance = getFirestore();
      const { getDoc, doc } = await import("firebase/firestore");
      let realUserName = 'Unknown User';

      if (currentUser) {
        const userDocRef = doc(firestoreInstance, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          // ডাটাবেজে আপনার নামের ফিল্ডের নাম 'name' বা 'username' যা আছে তা এখানে দিন
          realUserName = userData.name || userData.username || 'Unknown User';
        }
      }

      await addDoc(collection(firestoreInstance, 'complains'), {
        userId: currentUser?.uid || 'Anonymous',
        userName: realUserName,
        type: complainType,
        complain: complainText,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      alert('Complain submitted successfully!');
      setComplainText('');
      router.back(); 
    } catch (error) {
      console.error("Error submitting complain: ", error);
      alert('Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="w-full bg-slate-50/50 min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 text-black animate-in fade-in duration-200">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative">
        
        {/* ব্যাক বাটন */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        {/* 🎯 পয়েন্ট ২: "Complain Form" টেক্সটটি একদম মাঝখানে (Centered) থাকবে */}
        <div className="text-center border-b border-gray-100 pb-5 mb-6 mt-4">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
            📢 Complain Form
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Please let us know your issue, we will review it shortly.
          </p>
        </div>

        <form onSubmit={handleComplainSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select type :</label>
            <select 
              value={complainType} 
              onChange={(e) => setComplainType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black font-medium transition-all"
            >
              <option value="About Exam">About Exam</option>
              <option value="About Books Shop">About Books Shop</option>
              <option value="About Patron">About Patron</option>
              <option value="About User Behaviour">About User Behaviour</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Write your complain here :</label>
            <textarea 
              value={complainText}
              onChange={(e) => setComplainText(e.target.value)}
              placeholder="Describe your issue here..."
              rows={5}
              className="w-full rounded-xl border border-gray-200 p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-black placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
