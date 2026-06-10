
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircle, Search, Send, ArrowLeft, Phone, Video, Paperclip, Camera, FileImage, Mic, Smile, UserX, ShieldAlert, MoreVertical, Reply, Copy, ThumbsUp, Trash2, Check, CheckCheck, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User as UserProfile } from '@/lib/types';
import { IlbooksLogo } from '@/components/ilbooks-logo';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, setDoc, limit, onSnapshot } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);

  // Modal states
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [callType, setCallType] = useState<'Audio' | 'Video' | null>(null);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for user's conversations
  useEffect(() => {
    if (!firestore || !user) return;

    const convosQuery = query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(convosQuery, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  // Listen for messages in active conversation
  useEffect(() => {
    if (!firestore || !activeConversationId) {
        setMessages([]);
        return;
    }

    const messagesQuery = query(
      collection(firestore, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [firestore, activeConversationId]);

  // Handle search param for specific chat
  useEffect(() => {
      const chatWithId = searchParams.get('chatWith');
      if (chatWithId && user) {
          // Check if conversation already exists
          const existingConvo = conversations.find(c => c.participants.includes(chatWithId));
          if (existingConvo) {
              setActiveConversationId(existingConvo.id);
          } else {
              // Create temporary reference or just wait for message
              setActiveConversationId(null);
          }
          
          // Fetch other user profile
          const otherUserRef = doc(firestore!, 'users', chatWithId);
          onSnapshot(otherUserRef, (doc) => {
              if (doc.exists()) setOtherUser({ id: doc.id, ...doc.data() });
          });
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
          // Check again if convo exists
          const existing = conversations.find(c => c.participants.includes(chatWithId));
          if (existing) {
              convoId = existing.id;
          } else {
              // Create new conversation
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

      const messagesCollection = collection(firestore, 'conversations', convoId, 'messages');
      addDoc(messagesCollection, msgData)
          .then(() => {
              setNewMessage('');
              updateDoc(doc(firestore, 'conversations', convoId!), {
                  lastMessage: newMessage,
                  updatedAt: serverTimestamp()
              });
          })
          .catch((err) => {
              const permissionError = new FirestorePermissionError({
                  path: messagesCollection.path,
                  operation: 'create',
                  requestResourceData: msgData
              });
              errorEmitter.emit('permission-error', permissionError);
          });
  };

  if (!isClient) return <div className="h-screen flex items-center justify-center"><Skeleton className="h-[80%] w-[90%]" /></div>;

  return (
    <div className="flex bg-background h-[calc(100vh-8rem)] md:h-[calc(100vh-5.5rem)] overflow-hidden">
      {/* Conversation List */}
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
          {conversations.map(conv => (
            <div
              key={conv.id}
              role="button"
              onClick={() => {
                const partnerId = conv.participants.find((p: string) => p !== user?.uid);
                router.push(`/dashboard/messages?chatWith=${partnerId}`);
              }}
              className={cn(
                "flex items-center gap-3 p-3 border-b cursor-pointer transition-colors",
                activeConversationId === conv.id ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <Avatar className="h-12 w-12 border">
                  <AvatarFallback>{conv.lastMessage?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">Chat Session</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </aside>

      {/* Chat Window */}
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
                    <p className="text-xs text-muted-foreground">Level: {otherUser.level?.toFixed(1) || '0.0'}</p>
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
                    <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0">
                        <Send className="h-5 w-5"/>
                    </Button>
                </form>
            </div>
          </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/20">
                <MessageCircle className="w-16 h-16 opacity-20 mb-4"/>
                <p className="font-headline text-lg">Your Bookshelf of Conversations</p>
                <p className="text-sm">Select a friend to start chatting</p>
            </div>
        )}
      </main>
    </div>
  );
}
