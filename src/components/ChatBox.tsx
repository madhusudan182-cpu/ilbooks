'use client';

import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limitToLast } from 'firebase/firestore';
import { X, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";

interface ChatBoxProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  seen: boolean;
  senderId: string;
  text: string;
  createdAt: any;
}

export default function ChatBox({ currentUserId, targetUserId, targetUserName, onClose }: ChatBoxProps) {
  const firestore = getFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [targetUserData, setTargetUserData] = useState<any>(null);

  // 🆔 চ্যাট রুমের ইউনিক আইডি তৈরি (A_B অথবা B_A যাতে সবসময় একই আইডি থাকে)
  const chatRoomId = currentUserId < targetUserId 
    ? `${currentUserId}_${targetUserId}` 
    : `${targetUserId}_${currentUserId}`;


    useEffect(() => {
    if (!firestore || !targetUserId) return;
    const { doc, onSnapshot } = require('firebase/firestore');
    const userRef = doc(firestore, 'users', targetUserId);
    const unsubscribe = onSnapshot(userRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setTargetUserData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [firestore, targetUserId]);

   // 💬 রিয়েল-টাইমে মেসেজ লোড করার লজিক (৩৬ নাম্বার লাইন থেকে পরিবর্তন শুরু)
  useEffect(() => {
    if (!firestore || !chatRoomId || !currentUserId || !targetUserId) return;

    const markMessagesAsSeen = async () => {
      try {
        const { query, collection, where, getDocs, writeBatch } = require('firebase/firestore');
        const q = query(
          collection(firestore, 'messages'),
          where('chatRoomId', '==', chatRoomId),
          where('senderId', '==', targetUserId), 
          where('receiverId', '==', currentUserId), 
          where('seen', '==', false)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const batch = writeBatch(firestore);
          querySnapshot.forEach((doc: any) => {
            batch.update(doc.ref, { seen: true });
          });
          await batch.commit();
        }
      } catch (error) {
        console.error("Failed to mark messages as seen: ", error);
      }
    };

    markMessagesAsSeen();

    const messagesQuery = query(
      collection(firestore, 'messages'),
      where('chatRoomId', '==', chatRoomId)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const list: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.createdAt,
          seen: data.seen, // 👈 ডাটাবেজ থেকে seen স্ট্যাটাসটি নেওয়া হচ্ছে
        });
      });

      setMessages(list);
      setLoading(false);

      // 🚀 নতুন লজিক: অন্য ইউজারের পাঠানো যে মেসেজগুলো এখনো আপনি দেখেননি (seen: false), সেগুলো ফিল্টার করুন
      const unreadDocs = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.senderId === targetUserId && data.seen === false;
      });

      // যদি কোনো আনরিড মেসেজ থাকে, তবে ফায়ারবেসে সেগুলোকে একবারে 'seen: true' করে দিন
      if (unreadDocs.length > 0) {
        const { writeBatch } = await import('firebase/firestore');
        const batch = writeBatch(firestore);
        
        unreadDocs.forEach((msgDoc) => {
          batch.update(msgDoc.ref, { seen: true });
        });
        
        await batch.commit(); // ডাটাবেজে সাথে সাথে আপডেট হয়ে যাবে
      }
    });

    return () => unsubscribe();
  }, [firestore, chatRoomId, targetUserId]); // useEffect এখানে শেষ হচ্ছে


  // ✉️ মেসেজ পাঠানোর ফাংশন
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firestore) return;

    try {
      const textToSend = newMessage;
      setNewMessage(''); // ইনপুট বক্স সাথে সাথে খালি করা
      
      await addDoc(collection(firestore, 'messages'), {
        chatRoomId,
        senderId: currentUserId,
        receiverId: targetUserId,
        text: textToSend,
        createdAt: serverTimestamp(),
        seen: false,
      });
    } catch (error) {
      console.error("Failed to send message: ", error);
    }
  };

    return (
    <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl min-h-0 relative">


      {/* 👤 চ্যাট বক্স হেডার (নাম ও ছবি ক্লিকেবল করা হয়েছে) */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 shrink-0 z-10 w-full">

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/user/${targetUserId}`}>
            {/* ডটটিকে ছবির সাথে লক করার জন্য মেইন কন্টেইনারে relative ক্লাস দেওয়া হয়েছে */}
            <div className="relative w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center font-bold text-purple-400 border border-purple-800 cursor-pointer active:scale-95 transition-transform">
              {targetUserName ? targetUserName.charAt(0) : 'U'}
              
              {/* 🟢/🔴 অনলাইন-অফলাইন ডট ইন্ডিকেটর */}
              <span className={cn(
                "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-slate-900 ring-0",
                targetUserData?.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
            </div>
          </Link>

          <div>
            <Link href={`/dashboard/user/${targetUserId}`}>
              <h3 className="font-bold text-slate-200 hover:text-purple-400 hover:underline cursor-pointer transition-colors text-sm sm:text-base">
                {targetUserName}
              </h3>
            </Link>
            <p className="text-[10px] text-slate-500">Active Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400   hover:text-white rounded-full hover:bg-slate-800 transition-colors">
    <X className="w-5 h-5" />
  </button>

      </div>

      {/* 💬 মেসেজ বডি এরিয়া */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 w-full bg-slate-950">

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs italic">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg: Message) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                
                {/* 📸 অন্য ইউজারের চ্যাট বাবল ছবি (ক্লিকেবল করা হয়েছে) */}
                {!isMe && (
                  <Link href={`/dashboard/user/${targetUserId}`} className="relative shrink-0 active:scale-95 transition-transform mb-1">
                    <div className="w-7 h-7 bg-purple-950 rounded-full flex items-center justify-center text-xs font-bold text-purple-400 border border-purple-900 cursor-pointer">
                      {targetUserName ? targetUserName.charAt(0) : 'U'}
                    </div>
                    {/* 🟢/🔴 ছোট ডট বাবল ছবির কোণায় */}
                    <span className={cn(
                      "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border border-slate-950",
                      targetUserData?.isOnline ? "bg-green-500" : "bg-red-500"
                    )} />
                  </Link>
                )}


                {/* 💬 মেসেজ টেক্সট */}
                <div className={cn(
                  "max-w-[75%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm shadow-md break-words whitespace-pre-wrap", 
                  isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800"
                )}>


                  {/* whitespace-pre-wrap যুক্ত করার ফলে এন্টার বা নতুন লাইনগুলো চ্যাটে হুবহু দেখা যাবে */}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 📥 ইনপুট ফর্ম সেকশন */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/30 flex items-center gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          rows={Math.min(4, newMessage.split('\n').length || 1)} 
          /* bg-white এবং text-black যুক্ত করে সাদা ব্যাকগ্রাউন্ড ও কালো টেক্সট করা হলো */
          className="flex-1 bg-white border border-slate-300 text-black text-xs sm:text-sm rounded-xl px-3 py-2 resize-none min-h-[38px] max-h-[120px] overflow-y-auto focus:outline-none focus:border-purple-600 transition-all shadow-sm placeholder-slate-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (window.innerWidth > 768) {
                e.preventDefault();
                handleSendMessage({ preventDefault: () => {} } as any);
              }
            }
          }}
        />



        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shrink-0 h-[38px] w-[38px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
