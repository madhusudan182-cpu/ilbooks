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

import { collection, query, where, addDoc, serverTimestamp, doc, setDoc, onSnapshot, updateDoc, getDocs, getDoc } from 'firebase/firestore';

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

  // Sort conversations locally for the prototype UI
  const conversations = useMemo(() => {
    if (!rawConversations) return [];
    return [...rawConversations].sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawConversations]);

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
        })).sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setMessages(msgs);
      },
      (err) => {
          console.error("Messages listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [firestore, activeConversationId]);

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
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
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

  if (!isClient) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex bg-background h-[calc(100vh-8rem)] md:h-[calc(100vh-5.5rem)] overflow-hidden">
      <aside className={cn(
        "w-full md:w-80 lg:w-96 border-r flex flex-col",
        activeConversationId || otherUser ? "hidden md:flex" : "flex"
        )}>
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
                          <div className={cn("text-[10px] mt-1 opacity-70 flex items-center gap-1", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                              {msg.createdAt && format(new Date(msg.createdAt.seconds * 1000), 'HH:mm')}
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
                    <div className="relative flex-1">
                      <Input 
                          ref={inputRef}
                          placeholder="Type a message..." 
                          className="h-10 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
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

// 💡 সম্পূর্ণ SDK ইনস্ট্যান্স এরর মুক্ত চূড়ান্ত গ্লোবাল ইনবক্স রো কম্পোনেন্ট
function ChatInboxRow({ partnerId, conv, lastMsgTime, firestore, router, activeConversationId }: any) {
  const [memberProfile, setMemberProfile] = useState<any>(null);

  useEffect(() => {
    if (!firestore || !partnerId) return;
    
    const userDocRef = doc(firestore, 'users', partnerId);
    getDoc(userDocRef)
      .then((snap: any) => {
        if (snap.exists()) {
          setMemberProfile(snap.data());
        }
      })
      .catch((err: any) => console.error("Error loading chat row handle:", err));
  }, [firestore, partnerId]);

  const nameToDisplay = memberProfile?.name || partnerId || "Conversation";

  return (
    <button
      role="button"
      onClick={() => {
        router.push(`/dashboard/messages?chatWith=${partnerId}`);
      }}
      className={`flex items-center gap-2 p-3 border-b cursor-pointer transition-colors w-full ${
        activeConversationId === conv.id ? "bg-muted" : "hover:bg-muted/50"
      }`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={memberProfile?.avatarUrl || ""} />
          <AvatarFallback>{nameToDisplay.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold truncate text-sm">{nameToDisplay}</p>
          <span className="text-[10px] text-muted-foreground">{lastMsgTime}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
      </div>
    </button>
  );
}
