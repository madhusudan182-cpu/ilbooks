"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db as firestore } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import UserRow from "@/components/UserRow";

interface UserData {
  id: string;
  name: string;
  level: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export default function SocialCirclePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const router = useRouter();
  const [tabParam, setTabParam] = useState<string | undefined>(undefined);

  useEffect(() => {
    searchParams.then((params) => {
      setTabParam(params?.tab);
    });
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'friends' | 'following' | 'followers' | 'bookworms' | 'blocked'>('friends');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<UserData[]>([]);
  const [relations, setRelations] = useState<{ [key: string]: 'following' | 'follower' | 'friends' | 'blocked' }>({});

  // ১. ইউজার অথেন্টিকেশন স্টেট ট্র্যাকিং
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ২. ট্যাব প্যারামিটার এবং স্টেট সিঙ্ক করার জন্য ইফেক্ট
  useEffect(() => {
    if (tabParam) {
      const validTabs = ['friends', 'following', 'followers', 'bookworms', 'blocked'];
      const lowerParam = tabParam.toLowerCase();
      if (validTabs.includes(lowerParam)) {
        setActiveTab(lowerParam as any);
      }
    }
  }, [tabParam]);

  // ৩. রিয়েল-টাইম ফায়ারবেস ডেটাবেস থেকে ইউজার এবং রিলেশন ডেটা লোড (Ultimate Strict Logic)
  useEffect(() => {
    if (!firestore || !currentUser) return;

    // (ক) সম্পূর্ণ ইউজারের লিস্ট লোড করা
    const usersQuery = query(collection(firestore, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersList: UserData[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            name: data.name || 'Anonymous User',
            level: data.level || '0.0',
            avatarUrl: data.avatarUrl,
             isOnline: data.isOnline,
          });
        }
      });
      setDbUsers(usersList);
    });

    // (খ) ফলো রিলেশনশিপ ট্র্যাকিং করার নিখুঁত লিসেনার
    const followsQuery = query(
      collection(firestore, 'follows'),
      where('status', '==', 'ACTIVE')
    );

    const unsubscribeFollows = onSnapshot(followsQuery, (snapshot) => {
      const myFollowings = new Set<string>();
      const myFollowers = new Set<string>();

      // ফায়ারবেস স্ন্যাপশট থেকে স্বাধীনভাবে ফলোয়ার এবং ফলোয়িং আলাদা করা
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.followerId === currentUser.uid) {
          myFollowings.add(data.followingId); // আমি যাদের ফলো করি
        }
        if (data.followingId === currentUser.uid) {
          myFollowers.add(data.followerId); // যারা আমাকে ফলো করে
        }
      });

      const nextActiveRelations: { [key: string]: 'following' | 'follower' | 'friends' | 'blocked' } = {};

      // ডাটাবেসে থাকা প্রতিটা ইউজারের সাথে আমার সুনির্দিষ্ট সম্পর্ক আলাদা করা
      snapshot.forEach((doc) => {
        const data = doc.data();
        const targetId = data.followerId === currentUser.uid ? data.followingId : data.followerId;

        if (targetId !== currentUser.uid) {
          const iFollow = myFollowings.has(targetId);
          const theyFollow = myFollowers.has(targetId);

          if (iFollow && theyFollow) {
            nextActiveRelations[targetId] = 'friends';
          } else if (iFollow) {
            nextActiveRelations[targetId] = 'following';
          } else if (theyFollow) {
            nextActiveRelations[targetId] = 'follower';
          }
        }
      });

      setRelations(nextActiveRelations);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeFollows();
    };
  }, [firestore, currentUser]);

  // ৪. আপনার দেওয়া ৪টি কন্ডিশন অনুযায়ী নিখুঁত ট্যাব ফিল্টারিং ইঞ্জিন
  const displayUsers = dbUsers.filter(user => {
    const userRelation = relations[user.id]; // এটি 'friends', 'following', 'follower' বা undefined হবে
    let matchesTab = false;

    if (activeTab === 'bookworms') {
      // কন্ডিশন ৪: বুকওয়ার্মস ট্যাবে সবাই (All Users) থাকবে, সম্পর্ক থাকুক বা না থাকুক
      matchesTab = true;
    } else if (activeTab === 'friends') {
      // কন্ডিশন ১: যখন দুজন দুজনকে ফলো করে, শুধু তখনই 'friends' হবে
      matchesTab = userRelation === 'friends';
    } else if (activeTab === 'following') {
      // কন্ডিশন ২: আপনি যাদের ফলো করছেন (তারা শুধু Following ট্যাবে থাকবে)
      matchesTab = userRelation === 'following';
    } else if (activeTab === 'followers') {
      // কন্ডিশন ৩: যারা আপনাকে ফলো করছে কিন্তু আপনি ব্যাক করেননি (তারা শুধু Followers ট্যাবে থাকবে)
      matchesTab = userRelation === 'follower';
    }

    return matchesTab;
  });
  // ৫. ফলো এবং আনফলো করার শক্তিশালী এবং সমন্বিত হ্যান্ডলার অ্যাকশন (Fixed deleteDoc)
  const handleUserAction = async (actionType: string, targetUserId: string) => {
    if (!firestore || !currentUser) return;

    try {
      // ইউজার পেজের সাথে হুবহু মিল রেখে আইডি তৈরি
      const followDocId = `${currentUser.uid}_${targetUserId}`;
      const followRef = doc(firestore, 'follows', followDocId);

      if (actionType === 'follow') {
        // ইউজার পেজের মতো হুবহু ACTIVE ডকুমেন্ট তৈরি করা
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: targetUserId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
        alert("Following successfully!");
      } 
      else if (actionType === 'unfollow') {
        // আপনার ইউজার পেজের মতো ডকুমেন্টটি সম্পূর্ণ ডিলিট করে দেওয়া
        // এটি করার সাথে সাথে ফায়ারবেস লিসেনার রিয়েল-টাইমে এই ইউজারকে ট্যাব থেকে সরিয়ে দেবে!
        await deleteDoc(followRef);
        alert("Unfollowed successfully.");
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Database operation failed.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Social Circle</h1>
      
      {/* 📝 পরিবর্তিত রেসপন্সিভ ট্যাব ডিজাইন */}
        <div className="flex w-full justify-between gap-1 items-center mb-6 md:justify-start md:gap-2">
          {['friends', 'following', 'followers', 'bookworms'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 text-center py-1.5 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs md:text-sm md:flex-none md:px-4 md:py-2 font-semibold rounded-lg capitalize transition-all active:scale-95 ${
                activeTab === tab
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

      {/* ইউজার লিস্ট এরিয়া */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
        {displayUsers.length > 0 ? (
          displayUsers.map((user) => (
            <UserRow
              key={user.id}
              id={user.id}
              name={user.name}
              level={user.level}
              avatarUrl={user.avatarUrl}
              tabType={activeTab as any}
               isOnline={user.isOnline}
              isFollowing={relations[user.id] === 'following' || relations[user.id] === 'friends'}
              isFriend={relations[user.id] === 'friends'}
              isFollower={relations[user.id] === 'follower'}
              onAction={handleUserAction}
            />
          ))
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-slate-400 text-sm py-12">
            No bookworms found in this tab.
          </div>
        )}
      </div>
    </div>
  );
}
