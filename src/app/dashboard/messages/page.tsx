'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle, Search, Send, ArrowLeft, Paperclip, CheckCheck, Loader2, Check, X, Mic, Square, FileText, Image, Video } from "lucide-react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, doc, setDoc, onSnapshot, updateDoc, getDocs, getDoc, orderBy, limitToLast, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
// নিচের ৩টি লাইন ফাইলের একদম ওপরে অন্য সব ইমপোর্টের সাথে যোগ করুন
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  const [newMessage, setNewMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null); // এখানে HTMLTextAreaElement করা হলো
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);


  // নতুন লজিকের জন্য স্টেট ও টাইমার রেফ
  // নতুন লজিকের জন্য স্টেট ও টাইমার রেফ
const [showLeftIcons, setShowLeftIcons] = useState(true);
const iconTimerRef = useRef<NodeJS.Timeout | null>(null);

// ফাইল এবং ভয়েস রেকর্ডিংয়ের জন্য নতুন স্টেটসমূহ
const [isRecording, setIsRecording] = useState(false);
const [recordingSeconds, setRecordingSeconds] = useState(0);
const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

const [uploading, setUploading] = useState(false);
const [showAttachMenu, setShowAttachMenu] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);

// ফাইল আপলোড ও মেসেজ পাঠানোর মূল ফাংশন
const uploadAndSendFile = async (file: File, fileType: 'image' | 'video' | 'pdf') => {
  if (!firestore || !user || !activeConversationId) return;
  setUploading(true);
  try {
    const storageInstance = getStorage();
    const fileRef = ref(storageInstance, `chats/${activeConversationId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', 
      null, 
      (error) => console.error("Upload error:", error), 
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        // ফায়ারবেস মেসেজ কালেকশনে ফাইল লিংক পুশ করা হচ্ছে
        const messagesCollection = collection(firestore, 'conversations', activeConversationId, 'messages');
        await addDoc(messagesCollection, {
          senderId: user.uid,
          receiverId: chatWithId,
          text: `[${fileType.toUpperCase()}]`, // টেক্সট এরিয়া ব্যাকআপ
          fileUrl: downloadUrl,
          fileType: fileType,
          fileName: file.name,
          createdAt: serverTimestamp(),
          status: 'sent'
        });
        setUploading(false);
      }
    );
  } catch (err) {
    console.error(err);
    setUploading(false);
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.wav`, { type: 'audio/wav' });
        await uploadAndSendFile(audioFile, 'audio' as any);
      }
      setRecordingSeconds(0);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setShowLeftIcons(false);
    setRecordingSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 119) { // ১২০ সেকেন্ড বা ২ মিনিট পূর্ণ হলে অটো-সেন্ড
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
          setShowLeftIcons(true);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  } catch (err) { alert("মাইক্রোফোন পারমিশন প্রয়োজন!"); }
};


const stopAndSendRecording = () => {
  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowLeftIcons(true);
  }
};

const cancelAndDeleteRecording = () => {
  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  if (mediaRecorderRef.current && isRecording) {
    audioChunksRef.current = []; // ডাটা ডিলিট করে দেওয়া হলো যাতে সেন্ড না হয়
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowLeftIcons(true);
    setRecordingSeconds(0);
  }
};

const formatAudioTimer = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
};

// মোবাইল কিপ্যাড পপ-আপ হলে শেষ মেসেজটি উপরে পুশ করার ফিক্স
useEffect(() => {
  if (messagesEndRef.current) {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 150);
  }
}, []);



  const handleInputChange = (val: string) => {
    setNewMessage(val);
    setShowLeftIcons(false); // টাইপ করা শুরু করলে আইকন চলে যাবে

    if (iconTimerRef.current) clearTimeout(iconTimerRef.current);

    // ২ সেকেন্ড অলস (pause) থাকলে আইকন আবার ফেরত আসবে
    iconTimerRef.current = setTimeout(() => {
      setShowLeftIcons(true);
    }, 2000);
  };

  
  
  const [messages, setMessages] = useState<any[]>([]);
    // চ্যাট লিস্ট বা গেট ফাস্ট করার নতুন স্টেট সমূহ
  const [visibleConversationsCount, setVisibleConversationsCount] = useState(10);
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(10);


  const [otherUser, setOtherUser] = useState<any>(null);
  const chatWithId = searchParams.get('chatWith');
  const [partnerUserProfile, setPartnerUserProfile] = useState<any>(null);

  // অ্যাডমিন এক্সক্লুসিভ সার্চের জন্য নতুন স্টেট
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminSearchedUser, setAdminSearchedUser] = useState<any>(null);
  const [adminSearchLoading, setAdminSearchLoading] = useState(false);


    useEffect(() => {
    if (!firestore || !chatWithId) {
      setPartnerUserProfile(null);
      return;
    }
    const userRef = doc(firestore, 'users', chatWithId);
    getDoc(userRef)
      .then((snap) => {
        if (snap.exists()) setPartnerUserProfile(snap.data());
      })
      .catch((err) => console.error("Error loading active partner profile:", err));
  }, [chatWithId, firestore]);

  useEffect(() => {
    setIsClient(true);
  }, []);

    const convosQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawConversations, loading: convosLoading } = useCollection<any>(convosQuery);
  const followsRef = useMemo(() => (firestore ? collection(firestore, "follows") : null), [firestore]);
  const { data: allFollows = [] } = useCollection<any>(followsRef);

  // ফায়ারস্টোর থেকে ফিল্টার করা প্রথম ১০ জন ডাটা প্রসেস লজিক (সঠিক সিকোয়েন্সে ফিক্সড)
  const conversations = useMemo(() => {
    if (!user?.uid || !allFollows || !rawConversations) return [];
    const friendsMap = new Map<string, any>();
    const ADMIN_ID = "vkKbRMMv86M1q2BBwCTX1pnSWAq1";
    
    allFollows.forEach((f: any) => {
      const isMeFollower = f.followerId === user.uid && f.status === "ACTIVE";
      if (isMeFollower) {
        const partnerId = f.followingId;
        if (partnerId === ADMIN_ID) return;
        const backFollow = allFollows.some((b: any) => b.followerId === partnerId && b.followingId === user.uid && b.status === "ACTIVE");
        
        if (backFollow) {
          const existingConvo = rawConversations.find((c: any) => c.participants?.includes(partnerId));
          friendsMap.set(partnerId, {
            id: existingConvo ? existingConvo.id : `new_${partnerId}`,
            participants: [user.uid, partnerId],
            updatedAt: existingConvo?.updatedAt || { seconds: 0 },
            lastMessage: existingConvo?.lastMessage || "...",
            partnerId: partnerId
          });
        }
      }
    });

    if (user?.uid === ADMIN_ID) {
      rawConversations?.forEach((convo: any) => {
        const partnerId = convo.participants?.find((p: string) => p !== ADMIN_ID);
        if (partnerId) {
          friendsMap.set(partnerId, {
            id: convo.id,
            participants: convo.participants,
            updatedAt: convo.updatedAt || { seconds: 0 },
            lastMessage: convo.lastMessage || "",
            partnerId: partnerId
          });
        }
      });
    }

    let finalConvos = Array.from(friendsMap.values()).sort((a, b) => {
      return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
    });

    const adminConvo = rawConversations.find((c: any) => c.participants?.includes(ADMIN_ID));
    finalConvos.unshift({
      id: adminConvo ? adminConvo.id : `new_${ADMIN_ID}`,
      participants: [user.uid, ADMIN_ID],
      updatedAt: adminConvo?.updatedAt || { seconds: 9999999999 },
      lastMessage: adminConvo?.lastMessage || " ",
      partnerId: ADMIN_ID,
      isAdminSupport: true
    });

    return finalConvos.slice(0, visibleConversationsCount);
  }, [rawConversations, allFollows, user?.uid, visibleConversationsCount]);


  


    // অ্যাডমিন যখন সার্চ বক্সে কোনো UID লিখবেন, তখন সরাসরি ইউজার ডক চেক করার লজিক
  useEffect(() => {
    const ADMIN_ID = "vkKbRMMv86M1q2BBwCTX1pnSWAq1";
    // ফিক্সড: !firestore এর বদলে ফায়ারবেস অবজেক্ট চেক করার জন্য সঠিক কন্ডিশন
    if (user?.uid !== ADMIN_ID || !firestore || !adminSearchTerm.trim()) {
      setAdminSearchedUser(null);
      return;
    }

    setAdminSearchLoading(true);
    const userDocRef = doc(firestore, 'users', adminSearchTerm.trim());
    
    getDoc(userDocRef)
      .then((snap) => {
        if (snap.exists()) {
          setAdminSearchedUser({ id: snap.id, ...snap.data() });
        } else {
          setAdminSearchedUser(null);
        }
      })
      .catch((err) => {
        console.error("Admin user search failed:", err);
        setAdminSearchedUser(null);
      })
      .finally(() => setAdminSearchLoading(false));
  }, [adminSearchTerm, firestore, user?.uid]);

  useEffect(() => {
    if (!firestore || !activeConversationId || activeConversationId.startsWith('new_')) {
      setMessages([]);
      return;
    }
     const messagesQuery = query(
      collection(firestore, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc'), // এখানে 'asc' দিন যাতে রিভার্স করার ঝামেলা না থাকে
      limitToLast(visibleMessagesCount) // শেষ দিক থেকে ডেটা লিমিট করার জন্য
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // স্ক্রিনে দেখানোর সময় কালানুক্রমিকভাবে সোজা (A to Z) করে সাজানো হলো
      setMessages(msgs);


      snapshot.docs.forEach((messageDoc) => {
        const msgData = messageDoc.data();
        if (user && msgData.senderId !== user.uid && msgData.status === 'sent') {
          const msgDocRef = doc(firestore, 'conversations', activeConversationId, 'messages', messageDoc.id);
          updateDoc(msgDocRef, { status: 'seen' }).catch((err) => console.error(err));
        }
      });
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [firestore, activeConversationId, user, visibleMessagesCount]);

    useEffect(() => {
      const chatWithId = searchParams.get('chatWith');
      if (chatWithId && user && firestore) {
        const existingConvo = conversations.find(c =>
          c.participants?.includes(chatWithId));
        setActiveConversationId(existingConvo ? existingConvo.id : `new_${chatWithId}`);
        
        //  Reset count so new chats load instantly with only 10 messages
        setVisibleMessagesCount(10); 
        
        const otherUserRef = doc(firestore, 'users', chatWithId);

      const unsubscribe = onSnapshot(otherUserRef, (docSnap) => {
        if (docSnap.exists()) setOtherUser({ id: docSnap.id, ...docSnap.data() });
      });
      return () => unsubscribe();
    } else {
      setActiveConversationId(null);
      setOtherUser(null);
    }
  }, [searchParams, conversations, user, firestore]);

  useEffect(() => {
  if (messages.length > 0) {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }
}, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  const chatWithIdToCheck = searchParams.get('chatWith');
  const ADMIN_ID = "vkKbRMMv86M1q2BBwCTX1pnSWAq1";

  // ১৮৭ নম্বর লাইনে `chatWithIdToCheck !== ADMIN_ID` কন্ডিশনটি যুক্ত করা হয়েছে
  if (user?.uid !== ADMIN_ID && chatWithIdToCheck !== ADMIN_ID && chatWithIdToCheck && allFollows && user?.uid) {
    const iFollowThem = allFollows.some(f => f.followerId === user.uid &&
      f.followingId === chatWithIdToCheck && f.status === "ACTIVE");
    const theyFollowMe = allFollows.some(f => f.followerId === chatWithIdToCheck &&
      f.followingId === user.uid && f.status === "ACTIVE");
    if (!iFollowThem || !theyFollowMe) {
      alert("You can no longer chat. You are not friends anymore!");
      return;
    }
  }

  if (!newMessage.trim() || !user || !firestore) return;



    const chatWithId = searchParams.get('chatWith');
    if (!chatWithId) return;

    let convoId = activeConversationId;
    if (!convoId || convoId.startsWith('new_')) {
      const existing = conversations.find(c => c.participants?.includes(chatWithId) && !c.id.startsWith('new_'));
      if (existing) {
        convoId = existing.id;
      } else {
        const newConvoRef = doc(collection(firestore, 'conversations'));
        convoId = newConvoRef.id;
        await setDoc(newConvoRef, { participants: [user.uid, chatWithId], updatedAt: serverTimestamp(), lastMessage: newMessage });
        setActiveConversationId(convoId);
      }
    }

    if (!convoId) return;

    const msgData = { senderId: user.uid, receiverId: chatWithId, text: newMessage, createdAt: serverTimestamp(), status: 'sent' };
    const messagesCollection = collection(firestore, 'conversations', convoId, 'messages');
    addDoc(messagesCollection, msgData).then(() => {
      setNewMessage('');
      updateDoc(doc(firestore, 'conversations', convoId!), { lastMessage: newMessage, 
      updatedAt: serverTimestamp() }).catch(() => {});
      // মোবাইলে কিপ্যাড ধরে রাখার জন্য ইনপুটে আবার ফোকাস দেওয়া হলো
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      }).catch((err) => console.error(err));
    };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
    if (!isMobileDevice && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage({ preventDefault: () => {} } as any);
    }
  };

  const renderMessageText = (text: string) => {
    if (!text) return "";
    // URL খোঁজার জন্য রেগুলার এক্সপ্রেশন (Regex)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline font-medium break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (!isClient) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const isChatOpen = !!(activeConversationId || otherUser);


    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 w-full">
        <div className={cn(
        "flex bg-background overflow-hidden w-full relative transition-all duration-200 border rounded-xl shadow-sm",
        isChatOpen ? "fixed top-0 left-0 right-0 bottom-0 h-full z-50 md:relative md:h-[calc(100vh-5.5rem)]" : "h-[calc(100dvh-4rem)] md:h-[calc(100vh-5.5rem)]"
        )}>

        <aside className={cn(
          "w-full md:w-64 lg:w-72 border-r flex flex-col",
          isChatOpen ? "hidden md:flex" : "flex"
        )}>
          <div className="p-3 border-b flex items-center gap-2">
            <h1 className="text-lg font-bold font-headline">Chat</h1>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder={user?.uid === "vkKbRMMv86M1q2BBwCTX1pnSWAq1" ? "Admin: Enter User ID..." : "Search chats..."} 
                className="pl-8 h-8 rounded-full" 
                value={user?.uid === "vkKbRMMv86M1q2BBwCTX1pnSWAq1" ? adminSearchTerm : ""}
                onChange={(e) => user?.uid === "vkKbRMMv86M1q2BBwCTX1pnSWAq1" && setAdminSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {user?.uid === "vkKbRMMv86M1q2BBwCTX1pnSWAq1" && adminSearchedUser && (
              <div className="p-2 bg-purple-50/50 border-b border-purple-200">
                <p className="text-[10px] text-purple-600 font-bold px-2 mb-1">🎯 SEARCH RESULT (Click to Chat)</p>
                <ChatInboxRow
                  key={`search-${adminSearchedUser.id}`}
                  partnerId={adminSearchedUser.id}
                  conv={{
                    id: rawConversations?.find((c: any) => c.participants?.includes(adminSearchedUser.id))?.id || `new_${adminSearchedUser.id}`,
                    participants: [user.uid, adminSearchedUser.id],
                    lastMessage: "সার্চ করা ইউজারের সাথে চ্যাট শুরু করুন..."
                  }}
                  lastMsgTime="Now"
                  firestore={firestore}
                  router={router}
                  activeConversationId={activeConversationId}
                  currentUserId={user?.uid}
                />
              </div>
            )}

            {adminSearchLoading && <div className="p-4 text-center text-xs text-muted-foreground">Searching user by ID...</div>}

            {conversations.map((conv) => {
              const lastMsgTime = conv.updatedAt?.seconds ? formatDistanceToNow(new Date(conv.updatedAt.seconds * 1000)) + ' ago' : '';
              const partnerId = conv.participants?.find((p: string) => p !== user?.uid);
              return (
                <ChatInboxRow
                  key={`${conv.id}-${conv.partnerId}`}
                  partnerId={partnerId || ""}
                  conv={conv}
                  lastMsgTime={lastMsgTime}
                  firestore={firestore}
                  router={router}
                  activeConversationId={activeConversationId}
                  currentUserId={user?.uid}
                />
              );
            })}
            {conversations.length === 0 && !convosLoading && (
              <div className="p-10 text-center text-muted-foreground text-sm">
                <MessageCircle className="h-10 w-10 mx-auto opacity-10 mb-4" />
                <p>No active chats. Start one from the Social page!</p>
                <Button variant="link" asChild className="mt-2"><Link href="/dashboard/social">Go to Social Circle</Link></Button>
              </div>
            )}
            {convosLoading && <div className="p-4 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
                      {/* স্ক্রল ডাউন করলে পরবর্তী ১০ জন লোড করার বাটন গেট */}
          {rawConversations && rawConversations.length > visibleConversationsCount && (
            <div className="p-3 text-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs rounded-full border-purple-500 text-purple-600 hover:bg-purple-50"
                onClick={() => setVisibleConversationsCount(prev => prev + 10)}
              >
                Load More Chats
              </Button>
            </div>
          )}

          </ScrollArea>
        </aside>

        <main className={cn("flex-1 flex flex-col relative", activeConversationId || otherUser ? "flex" : "hidden md:flex")}>
          {otherUser ? (
            <>
              <div className="p-2 border-b flex items-center gap-3 bg-background/95 backdrop-blur-sm sticky top-0 shrink-0 z-10 w-full">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/dashboard/messages')}><ArrowLeft className="h-5 w-5" /></Button>
                <Avatar className="h-10 w-10 border"><AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} /><AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-grow">
                  <h2 className="font-bold text-base leading-tight">
                    {activeConversationId?.startsWith('new_') && chatWithId === "vkKbRMMv86M1q2BBwCTX1pnSWAq1" ? "Admin Support" : otherUser.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">Level: {typeof otherUser?.level === 'number' ? otherUser.level.toFixed(1) : (Number(otherUser?.level) || 0).toFixed(1)}</p>
                </div>
              </div>

      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        {/* উপরের দিকে স্ক্রল আপ করলে আরও ১০টি পুরনো মেসেজ লোড করার গেট বাটন */}
        {messages.length >= visibleMessagesCount && (
          <div className="w-full flex justify-center py-2 bg-slate-50/10">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] h-7 rounded-full text-purple-600 hover:bg-purple-100/50 transition-colors"
              onClick={() => setVisibleMessagesCount(prev => prev + 15)}
            >
              🔄 Load Previous Messages
            </Button>
          </div>
        )}
        <div className="space-y-4">

          {messages.map((msg, index) => (
            <div key={`${msg.id}-${index}`} className={cn("flex w-full", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] pt-1.5 px-3 pb-5 rounded-2xl shadow-sm relative", 
              msg.senderId === user?.uid ? "bg-blue-100 text-blue-950 rounded-tr-none" : "bg-card text-foreground rounded-tl-none")}>
                <div className="text-sm break-words whitespace-pre-wrap flex flex-col gap-2">
                  {msg.fileUrl ? (
                    <>
                      {msg.fileType === 'image' && (
                        <img 
                          src={msg.fileUrl} 
                          alt="Shared" 
                          className="max-w-xs max-h-48 rounded-lg object-cover border cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setActiveLightboxImage(msg.fileUrl)} // ছবিতে ক্লিক করলে বড় হবে
                        />
                      )}

                      {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="max-w-xs max-h-48 rounded-lg" />}
                      {msg.fileType === 'pdf' && (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-white/10 rounded-lg text-blue-600 underline">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span className="truncate max-w-[150px]">{msg.fileName || "PDF Document"}</span>
                        </a>
                      )}
                      {msg.fileType === 'audio' && <audio src={msg.fileUrl} controls className="max-w-xs h-10" />}
                    </>
                  ) : (
                    <span>{renderMessageText(msg.text)}</span>
                  )}
                  
                  {/* ৩ রঙের মেসেজ টিক্স সিস্টেম */}
                  {msg.senderId === user?.uid && (
                    <div className="absolute bottom-1 right-2 flex items-center shrink-0">

                      {msg.status === 'seen' ? (
                        <CheckCheck className="h-3.5 w-3.5 text-green-500 font-bold" />
                      ) : partnerUserProfile?.isOnline ? (
                        <CheckCheck className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background relative">
        {showAttachMenu && (
          <div className="absolute bottom-16 left-4 bg-white dark:bg-slate-900 border rounded-xl shadow-xl p-2 flex flex-col gap-2 z-50">
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-black dark:text-white">
              <Image className="h-4 w-4 text-green-500" /> ছবি (Image)
            </button>
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-black dark:text-white">
              <Video className="h-4 w-4 text-blue-500" /> ভিডিও (Video)
            </button>
            <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf'); fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-black dark:text-white">
              <FileText className="h-4 w-4 text-red-500" /> পিডিএফ (PDF)
            </button>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            let type: 'image' | 'video' | 'pdf' = 'pdf';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            uploadAndSendFile(file, type);
          }} 
        />

                {isRecording ? (
          /* হোয়াটসঅ্যাপ / মেসেঞ্জার স্টাইল ফুল উইডথ ভয়েস রেকর্ডার প্যানেল */
          <div className="flex items-center justify-between w-full bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl transition-all duration-300">
            {/* বামে: ডিলিট বাটন */}
            <button type="button" onClick={cancelAndDeleteRecording} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors active:scale-95">
              <X className="h-5 w-5" />
            </button>
            
            {/* মাঝে: ওয়েভ অ্যানিমেশন ও টাইমার */}
            <div className="flex-1 flex items-center justify-center gap-3 px-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="flex items-center gap-1 overflow-hidden h-6 text-purple-600">
                <span className="w-1 h-3 bg-current rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-current rounded-full animate-pulse" />
                <span className="w-1 h-2 bg-current rounded-full animate-pulse" />
                <span className="w-1 h-6 bg-current rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatAudioTimer(recordingSeconds)}</span>
            </div>

            {/* ডানে: সেন্ড বাটন */}
            <button type="button" onClick={stopAndSendRecording} className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md transition-all active:scale-95">
              <Send className="h-4 w-4 transform rotate-[-45deg]" />
            </button>
          </div>
        ) : (
          /* নরমাল টেক্সট ইনপুট মোড */
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
            <div className={cn("flex items-center gap-1 transition-all duration-300 overflow-hidden", showLeftIcons ? "w-auto opacity-100" : "w-0 opacity-0 pointer-events-none")}>
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={startRecording}>
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {uploading && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 bg-background/80 pl-1">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              </div>
            )}



            <div className="relative flex-1 flex items-center">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  // সমস্যা ৩ এর ফিক্স: টেক্সট ফাঁকা থাকলে আইকন শো করবে, না থাকলে হাইড হবে
                  if (newMessage.trim()) {
                    setShowLeftIcons(false);
                  }
                  // সমস্যা ২ এর ফিক্স: মোবাইলে কিবোর্ড পপ-আপ হলে শেষ মেসেজ স্ক্রিনে ধরে রাখবে
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }, 300);
                }}
                onBlur={() => setShowLeftIcons(true)}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-white border border-slate-300 text-black text-sm sm:text-base rounded-xl px-4 py-3 resize-none min-h-[46px] max-h-[140px] overflow-y-auto focus:outline-none focus:border-purple-600 transition-all shadow-sm placeholder-slate-400"
                onKeyDown={handleKeyDown}
              />

            </div>
            <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={!newMessage.trim() && !uploading}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        )}

      </div>
    </>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/20">
      <MessageCircle className="w-16 h-16 opacity-10 mb-4" />
      <p className="font-headline text-lg">Your Bookshelf of Conversations</p>
      <p className="text-sm">Select a reader to start chatting</p>
    </div>
  )}
        </main>
      </div>

      {/* ইমেজ পপ-আপ লাইটবক্স মডাল এলিমেন্ট */}
      {activeLightboxImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <img src={activeLightboxImage} alt="Popup View" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" />
          <div className="flex items-center gap-4 mt-6 bg-white dark:bg-slate-900 border p-3 rounded-full shadow-xl">
            <a href={activeLightboxImage} download target="_blank" rel="noreferrer" className="text-xs bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold transition-transform active:scale-95">Save Image</a>
            <button onClick={() => setActiveLightboxImage(null)} className="text-xs bg-slate-200 dark:bg-slate-800 text-black dark:text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1 transition-transform active:scale-95"><X className="h-3 w-3" /> Close</button>
          </div>
        </div>
      )}
    </div>

  );
}

function ChatInboxRow({ partnerId, conv, lastMsgTime, firestore, router, activeConversationId, currentUserId }: any) {
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { toast } = useToast();

  const [openMenu, setOpenMenu] = useState(false);


  useEffect(() => {
    if (!firestore || !partnerId) return;
    getDoc(doc(firestore, 'users', partnerId)).then((snap: any) => {
      if (snap.exists()) setMemberProfile(snap.data());
    }).catch((err: any) => console.error(err));
  }, [firestore, partnerId]);

  useEffect(() => {
    if (!firestore || !conv.id || !currentUserId || conv.id.startsWith('new_')) return;
    const unreadMessagesQuery = query(collection(firestore, 'conversations', conv.id, 
    'messages'), where('senderId', '==', partnerId), where('status', '==', 'sent'));
    const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) =>
    setUnreadCount(snapshot.size));
    return () => unsubscribe();
  }, [firestore, conv.id, partnerId, currentUserId]);

  const isActive = activeConversationId === conv.id;
  const isUnread = unreadCount > 0;
  const normalBackground = isActive ? "bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200" : isUnread ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 font-semibold" : "hover:bg-gray-50 dark:hover:bg-slate-800/50";
  const rowBackground = conv.isAdminSupport ? isActive ? "bg-emerald-100/80 text-emerald-950 border-2 border-emerald-500 rounded-lg my-1 mx-2" : "bg-emerald-50/60 hover:bg-emerald-100/50 border-2 border-dashed border-emerald-400 rounded-lg my-1 mx-2 text-emerald-900 font-medium" : normalBackground;
  const nameToDisplay = conv.isAdminSupport ? "Admin Support" : (memberProfile?.name || "Loading name...");

  // স্ক্রোল ট্র্যাকিংয়ের জন্য রেফ
const touchStartXRef = useRef<number>(0);
const touchStartYRef = useRef<number>(0);
const isScrollingRef = useRef<boolean>(false);

const handleTouchStart = (e: React.TouchEvent) => {
  isScrollingRef.current = false; // শুরুতে স্ক্রোলিং ফলস থাকবে
  touchStartXRef.current = e.touches[0].clientX;
  touchStartYRef.current = e.touches[0].clientY;
};

const handleTouchMove = (e: React.TouchEvent) => {
  const diffX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
  const diffY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
  
  // যদি ব্যবহারকারী স্ক্রোল করেন (১০ পিক্সেলের বেশি নড়াচড়া হয়)
  if (diffX > 10 || diffY > 10) {
    isScrollingRef.current = true; 
  }
};

const handleTouchEnd = (e: React.TouchEvent) => {
  // যদি স্ক্রোলিং না হয়ে থাকে, কেবল তখনই চ্যাট বক্স ওপেন হবে
  if (!isScrollingRef.current) {
    router.push(`/dashboard/messages?chatWith=${partnerId}`);
  }
};



 const handlePCRowClick = (e: React.MouseEvent) => {
  router.push(`/dashboard/messages?chatWith=${partnerId}`);
};



  const handleDeleteChat = async () => {
  if (!firestore || !conv.id) return;
  try {
    // ব্রাউজার অ্যালার্ট ছাড়া সরাসরি টোস্ট নোটিফিকেশন (সমস্যা ৫ ফিক্স)
    toast({ 
      title: "Chat Deleted", 
      description: "Conversation history removed.",
      duration: 2000 // ২ সেকেন্ড পর টোস্ট একা একাই চলে যাবে (সমস্যা ৬ ফিক্স)
    });
    
    // ডাটাবেজ থেকে কনভারসেশন ডকুমেন্ট ডিলিট করার কোড (সমস্যা ৭ ফিক্স)
    const firebaseFirestore = await import("firebase/firestore");
    if (!conv.id.startsWith('new_')) {
      await firebaseFirestore.deleteDoc(firebaseFirestore.doc(firestore, 'conversations', conv.id));
    }
    setOpenMenu(false);
  } catch (err) {
    console.error("Delete failed: ", err);
  }
};

const handleBlockUser = async () => {
  if (!firestore || !currentUserId || !partnerId) return;
  try {
    toast({ 
      title: "User Blocked", 
      variant: "destructive",
      duration: 2000 // ২ সেকেন্ড অটো-ডিসমিস (সমস্যা Trolley 6 ফিক্স)
    });

    const firebaseFirestore = await import("firebase/firestore");
    // ব্লকড লিস্টের জন্য ডাটাবেজে রেকর্ড সেভ করা হচ্ছে (সমস্যা ৭ ফিক্স)
    await firebaseFirestore.setDoc(firebaseFirestore.doc(firestore, 'blocks', `${currentUserId}_${partnerId}`), {
      blockedBy: currentUserId,
      blockedUser: partnerId,
      createdAt: firebaseFirestore.serverTimestamp()
    });
    setOpenMenu(false);
  } catch (err) {
    console.error("Block failed: ", err);
  }
};


  const handleMenuOpenChange = (open: boolean) => {
  setOpenMenu(open);
};


// লং-প্রেস অ্যাক্টিভ থাকলে ব্যাকগ্রাউন্ড কালার ভিন্ন (bg-purple-200) হবে
const finalRowBackground = rowBackground; 

return (
  <DropdownMenu open={openMenu} onOpenChange={handleMenuOpenChange}>
    <div
      role="button"
      onClick={handlePCRowClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("flex items-center justify-between p-3 border-b cursor-pointer transition-all duration-200 w-full outline-none select-none group relative", finalRowBackground)}
    >
<div className="flex items-center gap-2 min-w-0 flex-1">
<div className="relative shrink-0">
<Avatar className="h-12 w-12 border">
<AvatarImage src={memberProfile?.avatarUrl || ""} />
<AvatarFallback>{nameToDisplay.substring(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>
<span className={cn("absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900", memberProfile?.isOnline ? "bg-green-500" : "bg-red-500")} />
</div>
<div className="flex-1 text-left min-w-0">
<div className="flex items-baseline justify-between">
<div className="flex items-center gap-2">
<p className="font-semibold truncate text-sm">{nameToDisplay}</p>
{isUnread && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{unreadCount}</span>}
</div>
<span className="text-[10px] text-muted-foreground shrink-0">{lastMsgTime}</span>
</div>
<p className={`text-xs truncate ${isUnread ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>{conv.lastMessage}</p>
</div>
</div>

{/* ডেক্সটপের ৩-ডট আইকন যা এখন ড্রপডাউন ট্রিগার হিসেবে কাজ করবে */}
<div className="ml-2 hidden md:block shrink-0" onClick={(e) => e.stopPropagation()}>
<DropdownMenuTrigger asChild>
<button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 rounded-full text-slate-500 transition-colors focus:outline-none">
<svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
</svg>
</button>
</DropdownMenuTrigger>
</div>
</div>




      
      <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 text-slate-800 rounded-xl shadow-lg z-50 py-1 text-xs">
        <DropdownMenuItem 
          onClick={() => router.push(`/dashboard/user/${partnerId}`)}
          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer font-medium border-b border-slate-100 flex items-center justify-between"
        >
          See profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDeleteChat}
          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer font-medium border-b border-slate-100 text-amber-600 flex items-center justify-between"
        >
          Delete Chat
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleBlockUser}
          className="px-4 py-2.5 hover:bg-red-50 cursor-pointer font-semibold text-red-600 flex items-center justify-between"
        >
          Block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
