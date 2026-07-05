'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle, Search, Send, ArrowLeft, Paperclip, CheckCheck, Loader2 } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const chatWithId = searchParams.get('chatWith');
  const [partnerUserProfile, setPartnerUserProfile] = useState<any>(null);

  // 💡 কোনো কাস্টম হুকের ঝামেলা ছাড়া সরাসরি গ্লোবাল SDK দিয়ে চ্যাট পার্টনারের প্রোফাইল লোড করা হচ্ছে
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

  // Use simple collection fetch to avoid initial complex query index errors
  const convosQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawConversations, loading: convosLoading } = useCollection<any>(convosQuery);

  // 🎯 লাইভ ফলো ডাটা লোড করার নতুন লজিক
  const followsRef = useMemo(() => (firestore ? collection(firestore, "follows") : null), [firestore]);
  const { data: allFollows = [] } = useCollection<any>(followsRef);

  // Sort conversations locally for the prototype UI
  // 🎯 শুধুমাত্র যারা এখনও ফ্রেন্ড আছে, তাদের চ্যাট রুমগুলোই দেখানোর ফিল্টার লজিক
const conversations = useMemo(() => {
  if (!rawConversations || !user?.uid || !allFollows) return [];

  // ১. প্রথমে পুরনো কোডের মতো সময় অনুযায়ী সর্ট করে নেওয়া
  const sortedConvos = [...rawConversations].sort((a, b) => {
    const timeA = a.updatedAt?.seconds || 0;
    const timeB = b.updatedAt?.seconds || 0;
    return timeB - timeA;
  });

  // ২. শুধুমাত্র ACTIVE ফ্রেন্ডদের চ্যাটগুলো ফিল্টার করা
  return sortedConvos.filter((convo) => {
    // চ্যাট পার্টনারের আইডি খুঁজে বের করা
    const partnerId = convo.participants?.find((p: string) => p !== user.uid);
    if (!partnerId) return false;

    // চেক করা কারেন্ট ইউজার এবং পার্টনার দুজনেই ACTIVE ফলোয়ার কি না
    const iFollowThem = allFollows.some(f => f.followerId === user.uid && f.followingId === partnerId && f.status === "ACTIVE");
    const theyFollowMe = allFollows.some(f => f.followerId === partnerId && f.followingId === user.uid && f.status === "ACTIVE");

    // দুজনেই ফলো করলেই চ্যাটটি লিস্টে দেখাবে, অন্যথায় ভ্যানিশ হয়ে যাবে
    return iFollowThem && theyFollowMe;
  });
}, [rawConversations, allFollows, user?.uid]);


    useEffect(() => {
    if (!firestore || !activeConversationId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(firestore, 'conversations', activeConversationId, 'messages')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const sortedMsgs = msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setMessages(sortedMsgs);

        // --- নোটিফিকেশন ক্লিয়ারিং লজিক ---
        // চ্যাট বক্স ওপেন থাকা অবস্থায় অন্য কোনো মেসেজ আসলে বা আগের আনরিড মেসেজ থাকলে তা 'seen' হয়ে যাবে
        snapshot.docs.forEach((messageDoc) => {
          const msgData = messageDoc.data();
          // মেসেজটি যদি অন্য কেউ পাঠিয়ে থাকে এবং স্ট্যাটাস যদি এখনও 'sent' থাকে
          if (user && msgData.senderId !== user.uid && msgData.status === 'sent') {
            const msgDocRef = doc(firestore, 'conversations', activeConversationId, 'messages', messageDoc.id);
            // ডাটাবেজে স্ট্যাটাস আপডেট করে 'seen' করে দেওয়া হচ্ছে
            updateDoc(msgDocRef, { status: 'seen' }).catch((err) => 
              console.error("Failed to mark message as seen:", err)
            );
          }
        });
      },
      (err) => {
        console.error("Messages listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [firestore, activeConversationId, user]);


  useEffect(() => {
      const chatWithId = searchParams.get('chatWith');
      if (chatWithId && user && firestore) {
          // Look for an existing conversation
          const existingConvo = conversations.find(c => c.participants.includes(chatWithId));
          if (existingConvo) {
              setActiveConversationId(existingConvo.id);
          } else {
              // Try to find if a conversation exists even if not in the cached list yet
              setActiveConversationId(null);
          }
          
          const otherUserRef = doc(firestore, 'users', chatWithId);
          const unsubscribe = onSnapshot(
            otherUserRef, 
            (doc) => {
              if (doc.exists()) setOtherUser({ id: doc.id, ...doc.data() });
            }
          );
          return () => unsubscribe();
      } else {
          setActiveConversationId(null);
          setOtherUser(null);
      }
  }, [searchParams, conversations, user, firestore]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
        // 🎯 START: ফ্রেন্ডশিপ ভ্যালিডেশন চেক (মেসেজ ব্লক করার জন্য)
        const chatWithIdToCheck = searchParams.get('chatWith');
        if (chatWithIdToCheck && allFollows && user?.uid) {
          const iFollowThem = allFollows.some(f => f.followerId === user.uid && f.followingId === chatWithIdToCheck && f.status === "ACTIVE");
          const theyFollowMe = allFollows.some(f => f.followerId === chatWithIdToCheck && f.followingId === user.uid && f.status === "ACTIVE");
          
          if (!iFollowThem || !theyFollowMe) {
            alert("You can no longer chat. You are not friends anymore!");
            return;
          }
        }
        // 🎯 END

      if (!newMessage.trim() || !user || !firestore) return;

      const chatWithId = searchParams.get('chatWith');
      if (!chatWithId) return;

      let convoId = activeConversationId;

      if (!convoId) {
          // Double check for existing conversation before creating a new one
          const existing = conversations.find(c => c.participants.includes(chatWithId));
          if (existing) {
              convoId = existing.id;
          } else {
              const newConvoRef = doc(collection(firestore, 'conversations'));
              convoId = newConvoRef.id;
              await setDoc(newConvoRef, {
                  participants: [user.uid, chatWithId],
                  updatedAt: serverTimestamp(),
                  lastMessage: newMessage
              });
              setActiveConversationId(convoId);
          }
      }

      const msgData = {
          senderId: user.uid,
          receiverId: chatWithId,
          text: newMessage,
          createdAt: serverTimestamp(),
          status: 'sent'
      };

      const messagesCollection = collection(firestore, 'conversations', convoId!, 'messages');
      addDoc(messagesCollection, msgData)
          .then(() => {
              setNewMessage('');
              updateDoc(doc(firestore, 'conversations', convoId!), {
                  lastMessage: newMessage,
                  updatedAt: serverTimestamp()
              }).catch(() => {});
          })
          .catch((err) => {
              console.error("Failed to send message:", err);
          });
  };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  // ডিভাইসটি মোবাইল কি না তা নিখুঁতভাবে পরীক্ষা করার লজিক
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
  
  if (!isMobileDevice) {
    // পিসির (PC) ক্ষেত্রে: শুধু Enter চাপলে মেসেজ চলে যাবে
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage({ preventDefault: () => {} } as any);
    }
    // পিসিতে Shift + Enter চাপলে নতুন লাইন (Next line) তৈরি হবে
  }
  // মোবাইলের ক্ষেত্রে: এখানে কোনো বাধা দেওয়া হবে না, Enter চাপলে নিচে নতুন লাইনে চলে যাবে
};



  if (!isClient) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    // === ফিক্স কোড: ঠিক return এর ওপরে এই লাইনটি বসিয়ে দিন ===
    const isChatOpen = !!(activeConversationId || otherUser);

    return (
    <div 
      className={cn(
        "flex bg-background overflow-hidden w-full relative transition-all duration-200",
        isChatOpen 
          ? "fixed inset-0 h-screen z-50 md:relative md:h-[calc(100vh-5.5rem)]" 
          : "h-[calc(100dvh-4rem)] md:h-[calc(100vh-5.5rem)]"
      )}
    >
    <aside className={cn(
    "w-full md:w-80 lg:w-96 border-r flex flex-col",
    isChatOpen ? "hidden md:flex": "flex"
    )}>
    // ====================================================


        <div className="p-3 border-b flex items-center gap-2">
          <h1 className="text-lg font-bold font-headline">Chat</h1>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." className="pl-8 h-8 rounded-full" />
          </div>
        </div>
        <ScrollArea className="flex-1">
            {conversations.map((conv) => {
            const lastMsgTime = conv.updatedAt?.seconds 
              ? formatDistanceToNow(new Date(conv.updatedAt.seconds * 1000)) + ' ago' 
              : '';
            
              const partnerId = conv.participants?.find((p: string) => p !== user?.uid);

              return (
              <ChatInboxRow
                key={conv.id}
                partnerId={partnerId || ""}
                conv={conv}
                lastMsgTime={lastMsgTime}
                firestore={firestore}
                router={router}
                activeConversationId={activeConversationId}
                currentUserId={user?.uid} // এই নতুন লাইনটি এখানে যোগ করুন
              />

            );
            })}

          {conversations.length === 0 && !convosLoading && (
              <div className="p-10 text-center text-muted-foreground text-sm">
                  <MessageCircle className="h-10 w-10 mx-auto opacity-10 mb-4" />
                  <p>No active chats. Start one from the Social page!</p>
                  <Button variant="link" asChild className="mt-2">
                      <Link href="/dashboard/social">Go to Social Circle</Link>
                  </Button>
              </div>
          )}
          {convosLoading && (
            <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          )}
        </ScrollArea>
      </aside>

      <main className={cn(
        "flex-1 flex flex-col relative",
        activeConversationId || otherUser ? "flex" : "hidden md:flex"
        )}>
        {otherUser ? (
          <>
            <div className="p-2 border-b flex items-center gap-3 bg-background/95 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/dashboard/messages')}>
                  <ArrowLeft className="h-5 w-5"/>
                </Button>
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <h2 className="font-bold text-base leading-tight">{otherUser.name}</h2>
                    <p className="text-xs text-muted-foreground">Level: {typeof otherUser?.level === 'number' ? otherUser.level.toFixed(1) : (Number(otherUser?.level) || 0).toFixed(1)}
                    </p>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex w-full", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl shadow-sm",
                        msg.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card rounded-tl-none"
                      )}>
                          <p className="text-sm break-words">{msg.text}</p>
                          <div className={cn(
                            "text-[10px] mt-1 opacity-70 flex items-center gap-1", 
                            msg.senderId === user?.uid ? "justify-end" : "justify-start"
                          )}>
                            {/* এখানে থাকা format(new Date(...)) সময় প্রদর্শনের লজিকটি সম্পূর্ণ ফেলে দেওয়া হয়েছে */}
                            {msg.senderId === user?.uid && <CheckCheck className="h-3 w-3" />}
                          </div>
                      </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="relative flex-1 flex items-center">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows={Math.min(4, newMessage.split('\n').length || 1)} 
                        className="flex-1 bg-white border border-slate-300 text-black text-sm sm:text-base rounded-xl px-4 py-3 resize-none min-h-[46px] max-h-[140px] overflow-y-auto focus:outline-none focus:border-purple-600 transition-all shadow-sm placeholder-slate-400"
                        onKeyDown={handleKeyDown} // ওপরের হ্যান্ডলারটি এখানে কল করা হলো
                      />


                    </div>

                    <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={!newMessage.trim()}>
                        <Send className="h-5 w-5"/>
                    </Button>
                </form>
            </div>
          </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/20">
                <MessageCircle className="w-16 h-16 opacity-10 mb-4"/>
                <p className="font-headline text-lg">Your Bookshelf of Conversations</p>
                <p className="text-sm">Select a reader to start chatting</p>
            </div>
        )}
      </main>
    </div>
  );
}

// সম্পূর্ণ সংশোধিত চ্যাট রো কম্পোনেন্ট (আনরিড মেসেজ কাউন্টার সহ)
function ChatInboxRow({ partnerId, conv, lastMsgTime, firestore, router, activeConversationId, currentUserId }: any) {
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // ১. চ্যাট পার্টনারের প্রোফাইল ডাটা লোড করা
  useEffect(() => {
    if (!firestore || !partnerId) return;
    const userDocRef = doc(firestore, 'users', partnerId);
    getDoc(userDocRef)
      .then((snap: any) => {
        if (snap.exists()) setMemberProfile(snap.data());
      })
      .catch((err: any) => console.error("Error loading chat row handle:", err));
  }, [firestore, partnerId]);

  // ২. রিয়েল-টাইমে এই নির্দিষ্ট চ্যাট রুমে কতটি আনরিড মেসেজ আছে তা গণনা করা
  useEffect(() => {
    if (!firestore || !conv.id || !currentUserId) return;
    
        const unreadMessagesQuery = query(
      collection(firestore, 'conversations', conv.id, 'messages'),
      where('senderId', '==', partnerId),
      where('status', '==', 'sent') // এটি আপডেট করুন
    );


    const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [firestore, conv.id, partnerId, currentUserId]);

  const isActive = activeConversationId === conv.id;
  const isUnread = unreadCount > 0;

  // আপনার দেওয়া রিকোয়ারমেন্ট শিট অনুযায়ী ব্যাকগ্রাউন্ড ডিজাইন সেট করা
  const rowBackground = isActive
    ? "bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200" 
    : isUnread
    ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 font-semibold" // আনরিড চ্যাটের বিশেষ ব্যাকগ্রাউন্ড
    : "hover:bg-gray-50 dark:hover:bg-slate-800/50";

  const nameToDisplay = memberProfile?.name || partnerId || "Conversation";

  return (
    <button
      role="button"
      onClick={() => {
        router.push(`/dashboard/messages?chatWith=${partnerId}`);
      }}
      className={`flex items-center gap-2 p-3 border-b cursor-pointer transition-colors w-full ${rowBackground}`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={memberProfile?.avatarUrl || ""} />
          <AvatarFallback>{nameToDisplay.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {/* 🟢/🔴 ইনবক্সের তালিকায় ছবির কোণায় ডট */}
        <span className={cn(
          "absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900",
          memberProfile?.isOnline ? "bg-green-500" : "bg-red-500"
        )} />
      </div>

      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate text-sm">{nameToDisplay}</p>
            {/* আপনার রিকোয়ারমেন্ট (b) অনুযায়ী নামের পাশে লাল কালারের আনরিড কাউন্ট ব্যাজ */}
            {isUnread && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{lastMsgTime}</span>
        </div>
        <p className={`text-xs truncate ${isUnread ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
          {conv.lastMessage}
        </p>
      </div>
    </button>
  );
}
