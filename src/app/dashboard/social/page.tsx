'use client';

import { useState, useEffect } from 'react';
import UserRow from '@/components/UserRow';
import ChatBox from '@/components/ChatBox';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  name: string;
  level: string;
  avatarUrl?: string;
}

export default function SocialCirclePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'following' | 'followers' | 'bookworms'>('friends');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<UserData[]>([]);
  const [relations, setRelations] = useState<{ [key: string]: 'following' | 'follower' | 'friends' | 'blocked' }>({});
  const [activeChatUser, setActiveChatUser] = useState<UserData | null>(null);

  const firestore = getFirestore();
  const auth = getAuth();

  // ১. ইউজার অথেনটিকেশন স্টেট চেক
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, [auth]);

  // ২. রিয়েল-টাইমে ফায়ারবেস ডাটাবেস থেকে ইউজার এবং রিলেশন ডেটা লোড
  useEffect(() => {
    if (!firestore || !currentUser) return;

    // সম্পূর্ণ ইউজার লিস্ট লোড (Bookworms)
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
          });
        }
      });
      setDbUsers(usersList);
    });

    // 🔗 রিলেশনশিপ ম্যাপ তৈরির ১০০% নিখুঁত লজিক (যা রিফ্রেশ করলেও ডেটা ধরে রাখবে)
    const followsQuery = query(
      collection(firestore, 'follows'),
      where('status', '==', 'ACTIVE')
    );
    
    const unsubscribeFollows = onSnapshot(followsQuery, (snapshot) => {
      const activeRelations: { [key: string]: 'following' | 'follower' | 'friends' | 'blocked' } = {};
      
      const myFollowings = new Set<string>();
      const myFollowers = new Set<string>();

      // ডাটাবেস থেকে কে কাকে ফলো করেছে তা আলাদাভাবে দুটি সেটে জমা করা
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.followerId === currentUser.uid) {
          myFollowings.add(data.followingId);
        }
        if (data.followingId === currentUser.uid) {
          myFollowers.add(data.followerId);
        }
      });

      // বুকওয়ার্মের প্রতিটা ইউজারের সাথে আপনার বর্তমান রিলেশনশিপ ক্যালকুলেট করা
      snapshot.forEach((doc) => {
        const data = doc.data();
        const targetId = data.followerId === currentUser.uid ? data.followingId : data.followerId;
        
        const iFollow = myFollowings.has(targetId);
        const theyFollow = myFollowers.has(targetId);

        if (iFollow && theyFollow) {
          activeRelations[targetId] = 'friends';
        } else if (iFollow) {
          activeRelations[targetId] = 'following';
        } else if (theyFollow) {
          activeRelations[targetId] = 'follower';
        }
      });

      // ব্যাকআপ সেফটি চেক (যদি স্ন্যাপশট লুপে কোনো ইউজার বাদ পড়ে, তবে ডাইরেক্ট সেট থেকে চেক করবে)
      myFollowings.forEach(id => {
        if (!activeRelations[id]) {
          activeRelations[id] = myFollowers.has(id) ? 'friends' : 'following';
        }
      });
      myFollowers.forEach(id => {
        if (!activeRelations[id]) {
          activeRelations[id] = myFollowings.has(id) ? 'friends' : 'follower';
        }
      });

      setRelations(activeRelations);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeFollows();
    };
  }, [firestore, currentUser, dbUsers.length]); // dbUsers.length ট্র্যাকিং বাগ প্রতিরোধ করবে

  const handleUserAction = async (actionType: 'chat' | 'unfollow' | 'block' | 'follow' | 'unblock', targetUserId: string) => {
    if (!firestore || !currentUser) return;

    const targetUser = dbUsers.find(u => u.id === targetUserId);

    try {
      if (actionType === 'follow') {
        const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: targetUserId,
          status: 'ACTIVE',
          createdAt: new Date()
        });
        toast({ title: "Success", description: "You are now following this bookworm! 🎉" });
      } 
      else if (actionType === 'unfollow') {
        const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
        await deleteDoc(followRef);
        toast({ title: "Unfollowed", description: "Removed from your following list." });
      } 
      else if (actionType === 'block') {
        const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: targetUserId,
          status: 'BLOCKED',
          createdAt: new Date()
        });
        toast({ title: "User Blocked 🚫", description: "They can no longer view your profile.", variant: "destructive" });
      }
      else if (actionType === 'chat' && targetUser) {
        setActiveChatUser(targetUser);
      }
    } catch (error) {
      toast({ title: "Error", description: "Database operation failed.", variant: "destructive" });
    }
  };

    // 🔍 ৪-ট্যাব মিউচুয়াল এক্সক্লুসিভ ফিল্টারিং ইঞ্জিন (আপনার রিকোয়ারমেন্ট অনুযায়ী শতভাগ নিখুঁত)
  const displayUsers = dbUsers.filter(user => {
    const userRelation = relations[user.id];
    let matchesTab = false;
    
    if (activeTab === 'bookworms') {
      matchesTab = true; // বুকওয়ার্মস ট্যাবে সবাই থাকবে (ফ্রেন্ড, ফলোয়ার, অপরিচিত সবাই)
    } 
    else if (activeTab === 'friends') {
      // শুধু মিউচুয়াল ফ্রেন্ডরা থাকবে
      matchesTab = userRelation === 'friends';
    } 
    else if (activeTab === 'following') {
      // 🎯 কঠোর নিয়ম: শুধু একতরফা ফলোয়িং থাকবে। ফ্রেন্ড (friends) হলে এখান থেকে সম্পূর্ণ উধাও হয়ে যাবে!
      matchesTab = userRelation === 'following';
    } 
    else if (activeTab === 'followers') {
      // 🎯 কঠোর নিয়ম: শুধু একতরফা ফলোয়ার্স থাকবে। ফ্রেন্ড (friends) হলে এখান থেকে সম্পূর্ণ উধাও হয়ে যাবে!
      matchesTab = userRelation === 'follower';
    }

    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });


  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-20 font-sans relative">
      <h1 className="text-center text-3xl font-bold text-purple-800 my-6">Social Circle</h1>

      {/* সার্চ এবং বাটন রো */}
      <div className="flex flex-row items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 w-full mb-6">
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search real bookworms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-700"
          />
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2.5 rounded-lg shrink-0 whitespace-nowrap shadow-sm">Share</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2.5 rounded-lg shrink-0 whitespace-nowrap shadow-sm">Invite</button>
      </div>

      {/* ৪টি ট্যাব বাটন */}
      <div className="grid grid-cols-4 gap-1 bg-slate-200/60 p-1 rounded-xl mb-4 text-center">
        {(['friends', 'following', 'followers', 'bookworms'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 text-xs font-bold rounded-lg capitalize transition-all ${
              activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ইউজার লিস্ট এরিয়া */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
        {displayUsers.length > 0 ? (
          displayUsers.map((user) => (
            <UserRow
              key={user.id}
              id={user.id}
              name={user.name}
              level={user.level}
              avatarUrl={user.avatarUrl}
              tabType={activeTab}
              isFollowing={relations[user.id] === 'following' || relations[user.id] === 'friends'}
              isFriend={relations[user.id] === 'friends'}
              isFollower={relations[user.id] === 'follower'} // 👈 এই নতুন লাইনটি ম্যাপের ভেতর যোগ করে দিন
              onAction={handleUserAction}
            />
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12">
            No active bookworms found in this tab.
          </div>
        )}
      </div>

      {activeChatUser && currentUser && (
        <ChatBox
          currentUserId={currentUser.uid}
          targetUserId={activeChatUser.id}
          targetUserName={activeChatUser.name}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
}
