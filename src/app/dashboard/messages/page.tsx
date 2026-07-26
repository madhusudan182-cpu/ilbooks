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
import { collection, query, where, addDoc, serverTimestamp, doc, setDoc, onSnapshot, updateDoc, getDocs, getDoc, orderBy, limitToLast } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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

  // নতুন লজিকের জন্য স্টেট ও টাইমার রেফ
  // নতুন লজিকের জন্য স্টেট ও টাইমার রেফ
const [showLeftIcons, setShowLeftIcons] = useState(true);
const iconTimerRef = useRef<NodeJS.Timeout | null>(null);

// ফাইল এবং ভয়েস রেকর্ডিংয়ের জন্য নতুন স্টেটসমূহ
const [isRecording, setIsRecording] = useState(false);
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

// ভয়েস রেকর্ড শুরু করার ফাংশন
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioFile = new File([audioBlob], `voice_${Date.now()}.wav`, { type: 'audio/wav' });
      await uploadAndSendFile(audioFile, 'audio' as any); // অডিও ফাইল আপলোড
      stream.getTracks().forEach(track => track.stop()); // মাইক্রোফোন বন্ধ করা
    };

    mediaRecorder.start();
    setIsRecording(true);
    setShowLeftIcons(false);
  } catch (err) {
    alert("মাইক্রোফোন পারমিশন প্রয়োজন!");
  }
};

// ভয়েস রেকর্ড শেষ করার ফাংশন
const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowLeftIcons(true);
  }
};


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

  const conversations = useMemo(() => {
    if (!user?.uid || !allFollows || !rawConversations) return [];
    const friendsMap = new Map<string, any>();
    const ADMIN_ID = "vkKbRMMv86M1q2BBwCTX1pnSWAq1";

      // লাইন ৭৫ থেকে ৯৩ পর্যন্ত এই কোডটি রিপ্লেস করুন
  allFollows.forEach((f: any) => {
    const isMeFollower = f.followerId === user.uid && f.status === "ACTIVE";
    if (isMeFollower) {
      const partnerId = f.followingId;
      if (partnerId === ADMIN_ID) return;

      const backFollow = allFollows.some((b: any) => b.followerId === partnerId &&
        b.followingId === user.uid && b.status === "ACTIVE");

      if (backFollow) {
        const existingConvo = rawConversations.find((c: any) => c.participants?.includes(partnerId));
        friendsMap.set(partnerId, {
          id: existingConvo ? existingConvo.id : `new_${partnerId}`,
          participants: [user.uid, partnerId],
          updatedAt: existingConvo?.updatedAt || { seconds: 0 },
          lastMessage: existingConvo?.lastMessage || "এখনই চ্যাট শুরু করুন...",
          partnerId: partnerId
        });
      }
    }
  });

  // মেইন ফিক্স: যদি কারেন্ট ইউজার অ্যাডমিন হন, তবে সব একটিভ চ্যাট পার্টনারকে ফ্রেন্ডশিপ ছাড়াই লিস্টে পুশ করা হবে
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
      lastMessage: adminConvo?.lastMessage || "যেকোনো সহায়তার জন্য মেসেজ করুন",
      partnerId: ADMIN_ID,
      isAdminSupport: true
    });

    return finalConvos;
  }, [rawConversations, allFollows, user?.uid]);


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
    const messagesQuery = query(collection(firestore, 'conversations', activeConversationId, 'messages'));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedMsgs = msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(sortedMsgs);

      snapshot.docs.forEach((messageDoc) => {
        const msgData = messageDoc.data();
        if (user && msgData.senderId !== user.uid && msgData.status === 'sent') {
          const msgDocRef = doc(firestore, 'conversations', activeConversationId, 'messages', messageDoc.id);
          updateDoc(msgDocRef, { status: 'seen' }).catch((err) => console.error(err));
        }
      });
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [firestore, activeConversationId, user]);

  useEffect(() => {
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId && user && firestore) {
      const existingConvo = conversations.find(c => c.participants?.includes(chatWithId));
      setActiveConversationId(existingConvo ? existingConvo.id : `new_${chatWithId}`);
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
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
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
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={`${msg.id}-${index}`} className={cn("flex w-full", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] py-1.5 px-3 rounded-2xl shadow-sm", msg.senderId === user?.uid ? "bg-blue-100 text-blue-950 rounded-tr-none" : "bg-card text-foreground rounded-tl-none")}>
                <div className="text-sm break-words whitespace-pre-wrap flex flex-col gap-2">
                  {msg.fileUrl ? (
                    <>
                      {msg.fileType === 'image' && <img src={msg.fileUrl} alt="Shared" className="max-w-xs max-h-48 rounded-lg object-cover border" />}
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

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 transition-all duration-300 overflow-hidden",
            showLeftIcons ? "w-auto opacity-100" : "w-0 opacity-0 pointer-events-none"
          )}>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowAttachMenu(!showAttachMenu)}>
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? <Square className="h-5 w-5 text-red-500 animate-pulse" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
            </Button>
          </div>

          {uploading && <div className="text-xs text-purple-600 animate-pulse px-2">Uploading...</div>}

          <div className="relative flex-1 flex items-center">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowLeftIcons(false)}
              onBlur={() => {
                setTimeout(() => setShowLeftIcons(true), 200);
              }}
              placeholder="Type a message..."
              rows={Math.min(4, newMessage.split('\n').length || 1)}
              className="flex-1 bg-white border border-slate-300 text-black text-sm sm:text-base rounded-xl px-4 py-3 resize-none min-h-[46px] max-h-[140px] overflow-y-auto focus:outline-none focus:border-purple-600 transition-all shadow-sm placeholder-slate-400"
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={!newMessage.trim() && !uploading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
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
</div>
);
}

// ফিক্সড রো কম্পোনেন্ট
function ChatInboxRow({ partnerId, conv, lastMsgTime, firestore, router, activeConversationId, currentUserId }: any) {
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!firestore || !partnerId) return;
    getDoc(doc(firestore, 'users', partnerId)).then((snap: any) => {
      if (snap.exists()) setMemberProfile(snap.data());
    }).catch((err: any) => console.error(err));
  }, [firestore, partnerId]);

  useEffect(() => {
    if (!firestore || !conv.id || !currentUserId || conv.id.startsWith('new_')) return;
    const unreadMessagesQuery = query(collection(firestore, 'conversations', conv.id, 'messages'), where('senderId', '==', partnerId), where('status', '==', 'sent'));
    const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => setUnreadCount(snapshot.size));
    return () => unsubscribe();
  }, [firestore, conv.id, partnerId, currentUserId]);

  const isActive = activeConversationId === conv.id;
  const isUnread = unreadCount > 0;
  const normalBackground = isActive ? "bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200" : isUnread ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 font-semibold" : "hover:bg-gray-50 dark:hover:bg-slate-800/50";
  const rowBackground = conv.isAdminSupport ? isActive ? "bg-emerald-100/80 text-emerald-950 border-2 border-emerald-500 rounded-lg my-1 mx-2" : "bg-emerald-50/60 hover:bg-emerald-100/50 border-2 border-dashed border-emerald-400 rounded-lg my-1 mx-2 text-emerald-900 font-medium" : normalBackground;
  const nameToDisplay = conv.isAdminSupport ? "Admin Support" : (memberProfile?.name || partnerId || "Conversation");

  return (
    <button role="button" onClick={() => router.push(`/dashboard/messages?chatWith=${partnerId}`)} className={`flex items-center gap-2 p-3 border-b cursor-pointer transition-all duration-200 w-full ${rowBackground}`}>
      <div className="relative">
        <Avatar className="h-12 w-12 border"><AvatarImage src={memberProfile?.avatarUrl || ""} /><AvatarFallback>{nameToDisplay.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <span className={cn("absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900", memberProfile?.isOnline ? "bg-green-500" : "bg-red-500")} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate text-sm">{nameToDisplay}</p>
            {isUnread && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{unreadCount}</span>}
          </div>
          <span className="text-[10px] text-muted-foreground">{lastMsgTime}</span>
        </div>
        <p className={`text-xs truncate ${isUnread ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>{conv.lastMessage}</p>
      </div>
    </button>
  );
}
