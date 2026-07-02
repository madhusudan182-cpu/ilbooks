'use strict';
'use client';
import React from 'react';

interface LiveDropdownListProps {
  userId: string | undefined;
  notifList: any[];
  handleNotifClick: (notif: any) => void;
}

export default function LiveDropdownList({ userId, notifList, handleNotifClick }: LiveDropdownListProps) {
  
  if (!notifList || notifList.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 p-1 space-y-1">
      {notifList.map((notif: any) => {
        const currentNotif = notif || {};
        let displayTitle = "Notification";
        let displayMessage: React.ReactNode = "";

        // ১. নামের ওপর ক্লিকের জন্য একদম নিরাপদ প্রোফাইল লিঙ্ক হ্যান্ডলার
        const handleUserClick = (e: React.MouseEvent) => {
          e.stopPropagation(); // মেইন বক্সের ক্লিক ইভেন্ট থামানোর জন্য
          if (currentNotif.senderId) {
            window.location.href = `/dashboard/profile/${currentNotif.senderId}`;
          }
        };

        const senderNameSpan = (
          <span
            onClick={handleUserClick}
            className="font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer mr-1"
          >
            {currentNotif.senderName || 'Someone'}
          </span>
        );

        const type = currentNotif.type || '';
        const textVal = currentNotif.text || currentNotif.message || '';

        // ২. কন্ডিশনাল লজিক যা ডেটাবেজে টেক্সট না থাকলেও টাইপ দেখে ইংলিশ মেসেজ জেনারেট করবে
        if (currentNotif.title || currentNotif.sourceCollection === 'user_notifications') {
          // এটি এডমিন প্যানেল থেকে পাঠানো নোটিফিকেশন ফিক্স করবে
          displayTitle = currentNotif.title || "Admin Notice";
          displayMessage = currentNotif.message || currentNotif.text || "New update received";
        } 
        else if (type === 'LIKE') {
          displayTitle = "New Like!";
          displayMessage = <>{senderNameSpan} liked your post.</>;
        } 
        else if (type === 'COMMENT') {
          displayTitle = "New Comment!";
          displayMessage = <>{senderNameSpan} commented on your post.</>;
        } 
        else if (type === 'FOLLOW' || textVal.includes('ফলো')) {
          displayTitle = "New Follower!";
          displayMessage = <>{senderNameSpan} is following you.</>;
        } 
        else if (type === 'FOLLOW_BACK' || textVal.includes('ব্যাক')) {
          displayTitle = "Followed Back!";
          displayMessage = <>{senderNameSpan} is following you back.</>;
        } 
        else if (type === 'UNFOLLOW' || textVal.includes('আনফলো')) {
          displayTitle = "Unfollowed";
          displayMessage = <>{senderNameSpan} has unfollowed you.</>;
        } 
        else if (type === 'BLOCK' || textVal.includes('ব্লক')) {
          displayTitle = "Blocked";
          displayMessage = <>{senderNameSpan} has blocked you.</>;
        } 
        else {
          // কোনো কিছুতে না মিললে ডেটাবেজের ডিফল্ট লেখা দেখাবে
          displayMessage = textVal || "You have a new update.";
        }

        return (
          <div
            key={currentNotif.id || Math.random().toString()}
            onClick={() => handleNotifClick(currentNotif)}
            className={`p-2 text-left rounded cursor-pointer transition-colors hover:bg-gray-50 ${
              !currentNotif.isSeen && !currentNotif.isRead ? 'bg-blue-50/40 border-l-2 border-blue-500' : ''
            }`}
          >
            <p className="text-xs font-bold text-gray-800">
              {displayTitle}
            </p>
            <div className="text-[11px] text-gray-600 mt-0.5 break-words">
              {displayMessage}
            </div>
          </div>
        );
      })}
    </div>
  );
}
