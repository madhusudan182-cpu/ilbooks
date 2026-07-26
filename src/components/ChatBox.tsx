'use client';

import { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limitToLast } from 'firebase/firestore';
import { X, Send, Loader2, Paperclip, Mic, Square, Image, Video, FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


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
  fileUrl?: string;   // ফাইল লিংকের জন্য
  fileType?: string;  // ফাইলের প্রকারের জন্য
  fileName?: string;  // ফাইলের নামের জন্য
}



export default function ChatBox({ currentUserId, targetUserId, targetUserName, onClose }: ChatBoxProps) {
const firestore = getFirestore();
const [messages, setMessages] = useState<any[]>([]); // type altered for custom fields
const [newMessage, setNewMessage] = useState('');
const [loading, setLoading] = useState(true);
  // ছবির পপ-আপ (Lightbox) স্টেট
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  
  // নতুন ভয়েস রেকর্ডার স্টেট ও টাইমার
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);


// নতুন স্টেটসমূহ
const [isRecording, setIsRecording] = useState(false);
const [uploading, setUploading] = useState(false);
const [showAttachMenu, setShowAttachMenu] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);

const uploadAndSendFile = async (file: File, fileType: 'image' | 'video' | 'pdf') => {
  if (!firestore) return;
  setUploading(true);
  try {
    const storageInstance = getStorage();
    const fileRef = ref(storageInstance, `chats/${chatRoomId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', null, null, async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(firestore, 'messages'), {
          chatRoomId,
          senderId: currentUserId,
          receiverId: targetUserId,
          text: `[${fileType.toUpperCase()}]`,
          fileUrl: downloadUrl,
          fileType: fileType,
          fileName: file.name,
          createdAt: serverTimestamp(),
          seen: false
        });
        setUploading(false);
    });
  } catch (err) {
    setUploading(false);
  }
};

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], `voice_${Date.now()}.wav`, { type: 'audio/wav' });
          await uploadAndSendFile(audioFile, 'audio' as any);
        }
        setRecordingSeconds(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // ২ মিনিট (১২০ সেকেন্ড) পর অটো-সেন্ড লজিক
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 119) {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) { alert("মাইক্রোফোন পারমিশন দিন"); }
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelAndDeleteRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const formatAudioTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };




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

 useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
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
      {/* চাট বক্স হেডার (নাম ও ছবি ক্লিকবল করা হয়েছে) */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 shrink-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/user/${targetUserId}`}>
            <div className="relative w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center font-bold text-purple-400 border border-purple-800 cursor-pointer active:scale-95 transition-transform">
              {targetUserName ? targetUserName.charAt(0) : 'U'}
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
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* মেসেজ বডি এরিয়া */}
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
                {!isMe && (
                  <Link href={`/dashboard/user/${targetUserId}`} className="relative shrink-0 active:scale-95 transition-transform mb-1">
                    <div className="w-7 h-7 bg-purple-950 rounded-full flex items-center justify-center text-xs font-bold text-purple-400 border border-purple-900 cursor-pointer">
                      {targetUserName ? targetUserName.charAt(0) : 'U'}
                    </div>
                    <span className={cn(
                      "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border border-slate-950",
                      targetUserData?.isOnline ? "bg-green-500" : "bg-red-500"
                    )} />
                  </Link>
                )}
                <div className={cn(
                  "max-w-[75%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm shadow-md break-words whitespace-pre-wrap", 
                  isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800"
                )}>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} className="break-words">
                    {msg.fileUrl ? (
                      <div className="flex flex-col gap-2">
                        {msg.fileType === 'image' && (
                          <img 
                            src={msg.fileUrl} 
                            alt="Shared" 
                            className="max-w-xs max-h-40 rounded-lg object-cover border cursor-pointer hover:opacity-90" 
                            onClick={() => setActiveLightboxImage(msg.fileUrl || null)} // ছবিতে ক্লিক করলে বড় হবে
                          />
                        )}

                        {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="max-w-xs max-h-40 rounded-lg" />}
                        {msg.fileType === 'pdf' && (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-1.5 bg-slate-800 rounded-lg text-purple-400 underline">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[120px]">{msg.fileName || "PDF"}</span>
                          </a>
                        )}
                        {msg.fileType === 'audio' && <audio src={msg.fileUrl} controls className="max-w-[200px] h-8" />}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ইনপুট এরিয়া ও ফর্ম সেকশন */}
      <div className="relative bg-slate-900/30 p-1 border-t border-slate-800">
        {showAttachMenu && (
          <div className="absolute bottom-16 left-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-2 z-50">
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded">
              <Image className="h-3.5 w-3.5 text-green-500" /> Image
            </button>
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded">
              <Video className="h-3.5 w-3.5 text-blue-500" /> Video
            </button>
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded">
              <FileText className="h-3.5 w-3.5 text-red-500" /> PDF
            </button>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          let t: 'image' | 'video' | 'pdf' = 'pdf';
          if (file.type.startsWith('image/')) t = 'image'; else if (file.type.startsWith('video/')) t = 'video';
          uploadAndSendFile(file, t);
        }} />

                {isRecording ? (
          <div className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all duration-300">
            <button type="button" onClick={cancelAndDeleteRecording} className="p-2 text-red-500 hover:bg-red-50/10 rounded-full">
              <X className="h-4 w-4" />
            </button>
            <div className="flex-1 flex items-center justify-center gap-3 px-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-slate-300">{formatAudioTimer(recordingSeconds)}</span>
            </div>
            <button type="button" onClick={stopAndSendRecording} className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              <Send className="h-3.5 w-3.5 transform rotate-[-45deg]" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="p-1 flex items-center gap-2 shrink-0 w-full">
            <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" onClick={startRecording} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <Mic className="h-4 w-4" />
            </button>
            {uploading && <span className="text-[10px] text-purple-400">Uploading...</span>}
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm rounded-xl px-3 py-2 resize-none min-h-[36px] max-h-[100px] overflow-y-auto focus:outline-none focus:border-purple-600 transition-all placeholder-slate-500"
              onKeyDown={(e) => {
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
                if (!isMobileDevice && e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage({ preventDefault: () => {} } as any);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shrink-0 h-[36px] w-[36px] flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

            </div>

      {/* ইমেজ পপ-আপ লাইটবক্স মডাল এলিমেন্ট */}
      {activeLightboxImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <img src={activeLightboxImage} alt="Popup" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" />
          <div className="flex items-center gap-4 mt-6 bg-slate-900 border border-slate-800 px-6 py-2 rounded-full">
            <a href={activeLightboxImage} download target="_blank" rel="noreferrer" className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-xl font-bold">Save</a>
            <button onClick={() => setActiveLightboxImage(null)} className="text-xs bg-slate-800 text-white px-4 py-1.5 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

