'use client';

import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Send, Loader2 } from 'lucide-react';

interface ChatBoxProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

interface Message {
  id: string;
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

  // 🆔 চ্যাট রুমের ইউনিক আইডি তৈরি (A_B অথবা B_A যাতে সবসময় একই আইডি থাকে)
  const chatRoomId = currentUserId < targetUserId 
    ? `${currentUserId}_${targetUserId}` 
    : `${targetUserId}_${currentUserId}`;

  // 🔄 রিয়েল-টাইমে মেসেজ লোড করার লজিক
  useEffect(() => {
    if (!firestore) return;

    const messagesQuery = query(
      collection(firestore, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.createdAt,
        });
      });
      setMessages(list);
      setLoading(false);
      
      // নতুন মেসেজ আসলে স্ক্রল নিচে নামিয়ে দেওয়া
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.error("Chat error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, chatRoomId]);

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
      });
    } catch (error) {
      console.error("Failed to send message: ", error);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-white rounded-t-2xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[450px] animate-in slide-in-from-bottom duration-200">
      
      {/* 👤 চ্যাট হেডার */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-purple-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {targetUserName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{targetUserName}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">Active Friend</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-100 text-slate-500 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 💬 মেসেজ বডি/লিস্ট */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-sm font-medium ${
                  isMe 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="break-words leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <p>Say hi to your friend! 👋</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ⌨️ মেসেজ ইনপুট বক্স */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
        />
        <button type="submit" className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-md active:scale-95 shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
