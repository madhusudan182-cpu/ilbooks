'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserRowProps {
  id: string;
  name: string;
  level: string;
  avatarUrl?: string;
  tabType: 'friends' | 'following' | 'followers' | 'bookworms' | 'blocked';
  isFollowing?: boolean;
  isFriend?: boolean;
  isFollower?: boolean; // 👈 সে আপনাকে ফলো করেছে কি না তা জানার জন্য নতুন প্রপস
  onAction: (actionType: 'chat' | 'unfollow' | 'block' | 'follow' | 'unblock', userId: string) => void;
  isOnline?: boolean;
  lastActive?: any;
}

// ফায়ারবেস টাইমস্ট্যাম্প থেকে সঠিকভাবে "time ago" হিসাব করার উন্নত ফাংশন
function formatLastActive(lastActive: any): string {
  if (!lastActive) return "Active long ago";
  
  let date: Date;

  // ফায়ারবেস Timestamp অবজেক্ট (seconds, nanoseconds) চেক করার লজিক
  if (lastActive && typeof lastActive === 'object' && 'seconds' in lastActive) {
    date = new Date(lastActive.seconds * 1000);
  } else if (lastActive instanceof Date) {
    date = lastActive;
  } else {
    date = new Date(lastActive);
  }

  // যদি কোনো কারণে ইনভ্যালিড ডেট তৈরি হয়
  if (isNaN(date.getTime())) {
    return "Active long ago";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // যদি সময় নেগেটিভ বা ১ মিনিটের কম হয়
  if (diffInSeconds < 60) {
    return "Active Now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Active ${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Active ${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Active ${diffInDays} days ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `Active ${diffInMonths} months ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Active ${diffInYears} years ago`;
}




export default function UserRow({ id, name, level, avatarUrl, tabType, isFollowing, isFriend, isFollower, onAction, isOnline, lastActive }: UserRowProps) {

  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  // 🎯 বুকওয়ার্মস ট্যাবে দেখানোর জন্য ডাইনামিক বাটন টেক্সট ও কালার নির্ধারণ
  const getBookwormButtonConfig = () => {
    if (isFriend) {
      return { text: 'Friend', styles: 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200/70', action: 'dropdown' };
    }
    if (isFollowing) {
      return { text: 'Following', styles: 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300', action: 'unfollow' };
    }
    if (isFollower) {
      return { text: 'Follow Back', styles: 'bg-purple-600 hover:bg-purple-700 text-white', action: 'follow' };
    }
    return { text: 'Follow', styles: 'bg-purple-600 hover:bg-purple-700 text-white', action: 'follow' };
  };

  const buttonConfig = getBookwormButtonConfig();

  return (
    <div className="flex items-center justify-between pl-0 pr-0 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      
      {/* বামপাশ: প্রোফাইল ছবি, নাম এবং লেভেল (লিঙ্কসহ আপডেট করা হয়েছে) */}
      <div className="flex items-start gap-2 py-1">
        <Link href={`/dashboard/user/${id}`} className="shrink-0 active:scale-95 transition-transform relative block">
          {/* অ্যাভাটার সাইজ এখানে বড় করে w-16 h-16 করা হলো */}
          <div className="w-16 h-16 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center text-purple-600 text-xl font-bold border border-purple-200 shadow-sm">
            {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : name.charAt(0)}
          </div>
        </Link>

        <div className="flex flex-col space-y-1 min-w-0">
          {/* ১. প্রথম সেন্টেন্স: ইউজারের নাম */}
          <Link href={`/dashboard/user/${id}`}>
            <h4 className="text-[14px] sm:text-base font-bold text-slate-800 break-words line-clamp-2 hover:text-purple-700 hover:underline cursor-pointer transition-all leading-tight">
              {name}
            </h4>

          </Link>

          {/* ২. দ্বিতীয় সেন্টেন্স: ইউজারের লেভেল */}
          <p className="text-xs text-slate-600 font-medium leading-none">
            User Level: <span className="text-purple-700 font-bold">{level}</span>
          </p>

          {/* ৩. তৃতীয় সেন্টেন্স: অনলাইন স্ট্যাটাস উইথ ফিল্ড সার্কেল */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className={`block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs text-slate-500 font-medium">
              {isOnline ? "Active Now" : formatLastActive(lastActive)} 
            </span>
          </div>

        </div>
      </div>


      {/* ডানপাশ: অ্যাকশন বাটনসমূহ */}
      <div className="flex items-center gap-2 relative shrink-0">
        
        {/* Friends ট্যাব অথবা Bookworms ট্যাবে যদি অলরেডি ফ্রেন্ড হয়, তবে চ্যাট আইকন দেখাবে */}
        {(tabType === 'friends' || (tabType === 'bookworms' && isFriend)) && (
          <Link
            href={`/dashboard/messages?chatWith=${id}`}
            title="Chat"
            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full transition-colors active:scale-95 inline-flex items-center justify-center"
          >
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </Link>
        )}

        {/* Following ট্যাবে সরাসরি ইনলাইন বাটন */}
        {tabType === 'following' && (
          <button
            onClick={() => onAction('unfollow', id)}
            className="text-[10px] font-bold px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-colors shadow-sm active:scale-95"
          >
            Unfollow
          </button>
        )}

        {/* Followers ট্যাবে সরাসরি ইনলাইন বাটন */}
        {tabType === 'followers' && (
          <button
            onClick={() => onAction('follow', id)}
            className="text-[10px] font-bold px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm active:scale-95"
          >
            Follow Back
          </button>
        )}

        {/* 🎯 Bookworms ট্যাবে আপনার নতুন রিকোয়ারমেন্ট অনুযায়ী ডাইনামিক বাটন */}
        {tabType === 'bookworms' ? (
          <button 
            onClick={() => {
              if (buttonConfig.action === 'dropdown') {
                setShowDropdown(!showDropdown);
              } else {
                onAction(buttonConfig.action as any, id);
              }
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 ${buttonConfig.styles}`}
          >
            {buttonConfig.text}
          </button>
        ) : (
          /* থ্রি-ডট ওভাল মেনু (Friends, Following, Followers ট্যাবের জন্য) */
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-full transition-colors border border-slate-200 active:scale-95"
          >
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
        )}

        {/* ⚙️ অপশন ড্রপডাউন পপ-আপ */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
            <div className="absolute right-0 top-9 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-xs font-semibold animate-in fade-in duration-100">
              <div className="px-3 py-1 text-slate-400 border-b border-slate-50 capitalize">
                Options
              </div>
              <button 
                onClick={() => { onAction('unfollow', id); setShowDropdown(false); }} 
                className="w-full text-left px-3 py-2 text-amber-600 hover:bg-amber-50"
              >
                Unfollow
              </button>
              <button 
                onClick={() => { onAction('block', id); setShowDropdown(false); }} 
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 border-t border-slate-50"
              >
                Block User
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
