'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockUsers } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Lock, MessageCircle, Search, Send, ArrowLeft, Phone, Video, Paperclip, Camera, FileImage, FileAudio, FileVideo as FileVideoIcon, FileText, Sheet, Presentation, MoreVertical, UserX, ShieldAlert, MoreHorizontal, Reply, Copy, ThumbsUp, Trash2, Check, CheckCheck, Clock, Mic } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from '@/lib/types';
import { IlbooksLogo } from '@/components/ilbooks-logo';
import { Skeleton } from '@/components/ui/skeleton';

// In a real app, you'd get the current user from an auth context.
// We simulate by picking a user. mockUsers[0] is an admin.
const currentUser = mockUsers[0]; 
// To test client view (level > 0.3): const currentUser = mockUsers[3]; 
// To test locked view (level < 0.3): const currentUser = { ...mockUsers[3], level: 0.2, isAdmin: false }; 

const allConversations = [
  {
    user: {
      id: 'ilbooks-admin',
      name: 'ILBooks',
      avatarUrl: 'ilbooks_logo', // Special identifier
      level: 99,
      institution: 'Bookworm Network',
      location: 'Digital Space',
      hobbies: [],
      isFollowing: false,
      isMutual: false,
      isAdmin: true,
    } as User,
    messages: [
      { id: 1, text: "Hello! How can I assist you today?", sender: 'ilbooks-admin', timestamp: '10:00 AM' },
      { id: 2, text: "I have a question about the competition rules.", sender: currentUser.id, timestamp: '10:01 AM', status: 'seen' as const },
      { id: 3, text: "Sure, what is your question?", sender: 'ilbooks-admin', timestamp: '10:02 AM' },
      { id: 4, text: "What is the passing mark for Level 0.0?", sender: currentUser.id, timestamp: '10:03 AM', status: 'delivered' as const },
      { id: 5, text: "You need to score at least 60% in each subject.", sender: 'ilbooks-admin', timestamp: '10:04 AM' },
      { id: 6, text: "Got it, thanks!", sender: currentUser.id, timestamp: '10:05 AM', status: 'sent' as const },
      { id: 7, text: "Also, can I retake the exam if I fail?", sender: currentUser.id, timestamp: '10:06 AM', status: 'pending' as const },
    ],
    lastMessage: "Also, can I retake the exam if I fail?",
    timestamp: "10:06 AM",
    unread: 0,
  },
  ...mockUsers.filter(u => u.id !== currentUser.id).map((user, index) => ({
    user,
    messages: [
      { id: 1, text: "Hey, how are you?", sender: user.id, timestamp: '9:30 AM'},
      { id: 2, text: "Doing great, thanks! Just finished a new book.", sender: currentUser.id, timestamp: '9:32 AM', status: 'delivered' as const}
    ],
    lastMessage: "Doing great, thanks! Just finished a new book.",
    timestamp: "9:32 AM",
    unread: index === 0 ? 2 : 0,
  }))
];

type Conversation = (typeof allConversations)[0];

const MessagesPageSkeleton = () => (
    <div className="h-full flex bg-background">
      <aside className="w-full md:w-80 lg:w-96 border-r flex flex-col">
        <div className="p-4 border-b flex items-center gap-4">
          <h1 className="text-2xl font-bold font-headline">Chat</h1>
          <div className="relative flex-1">
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="flex-1 p-3 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1 hidden md:flex flex-col">
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4"/>
                  <p>Loading conversations...</p>
              </div>
          </div>
      </main>
    </div>
);


export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const chatWithId = searchParams.get('chatWith');
    const conversation = allConversations.find(c => c.user.id === chatWithId);
    
    if (conversation) {
        setSelectedConversation(conversation);
    } else {
        setSelectedConversation(null);
    }
  }, [searchParams]);

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim() === '') return;

      const newMsg = {
          id: Date.now(),
          text: newMessage,
          sender: currentUser.id,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'sent' as const,
      };

      if (selectedConversation) {
        const updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, newMsg],
            lastMessage: newMsg.text,
            timestamp: newMsg.timestamp,
        };

        setSelectedConversation(updatedConversation);
        const convIndex = allConversations.findIndex(c => c.user.id === selectedConversation.user.id);
        if (convIndex > -1) {
            allConversations[convIndex] = updatedConversation;
        }
        setNewMessage('');
      }
  };

  const isAdmin = currentUser.isAdmin || false;
  const userLevel = currentUser.level;

  if (!isClient) {
    return <MessagesPageSkeleton />;
  }
  
  if (!isAdmin && userLevel < 0.3) {
    return (
      <div className="flex items-center justify-center p-4 md:p-6 lg:p-8 h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
              <div className="mx-auto bg-muted text-muted-foreground rounded-full p-3 w-fit mb-4">
                  <Lock className="w-8 h-8"/>
              </div>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
              <MessageCircle />
              Chat Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You can use this tab once you have passed Level 0.3.
            </p>
            <p className="mt-4 font-semibold">
              Keep reading and competing to unlock chat!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      <aside className={cn(
        "w-full md:w-80 lg:w-96 border-r flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
        )}>
        <div className="p-4 border-b flex items-center gap-4">
          <h1 className="text-2xl font-bold font-headline">Chat</h1>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {allConversations.sort((a,b) => (a.user.isAdmin ? -1 : b.user.isAdmin ? 1 : 0)).map(conv => {
            const isIlbooks = conv.user.name === "ILBooks";
            return (
              <div
                key={conv.user.id}
                className={cn(
                  "flex items-start gap-3 p-3 border-b",
                  "transition-colors",
                  selectedConversation?.user.id === conv.user.id ? "bg-muted" : "hover:bg-muted/50",
                  isIlbooks && isAdmin && "sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b-2 border-primary"
                )}
              >
                <button
                  className="flex flex-1 items-start gap-3 text-left min-w-0"
                  onClick={() => setSelectedConversation(conv)}
                >
                  <Avatar className="h-11 w-11 border flex-shrink-0">
                    { isIlbooks ? (
                        <AvatarFallback className="bg-card">
                            <IlbooksLogo className="h-6 w-6" />
                        </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={conv.user.avatarUrl} alt={conv.user.name} />
                        <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                      <p className="font-semibold font-headline truncate">{conv.user.name}</p>
                      <p className="text-sm text-muted-foreground break-words">
                          {conv.lastMessage}
                      </p>
                  </div>
                </button>
                <div className="flex-shrink-0 flex flex-col items-end justify-between h-full text-right ml-2">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{conv.timestamp}</p>
                    <div className="h-6 flex items-center">
                      {conv.unread > 0 ? (
                          <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 font-bold">
                              {conv.unread}
                          </span>
                      ) : !isIlbooks ? (
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                      <UserX className="mr-2 h-4 w-4" />
                                      <span>Unfollow</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                      <UserX className="mr-2 h-4 w-4" />
                                      <span>Block</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                      <ShieldAlert className="mr-2 h-4 w-4" />
                                      <span>Report</span>
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      ) : (
                          <div className="w-6" />
                      )}
                    </div>
                </div>
              </div>
            )
          })}
        </ScrollArea>
      </aside>

      <main className={cn(
        "flex-1 flex flex-col",
        selectedConversation ? "flex" : "hidden md:flex"
        )}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-5 w-5"/>
                </Button>
                <Avatar className="h-10 w-10 border">
                    {selectedConversation.user.name === 'ILBooks' ? (
                        <AvatarFallback className="bg-card">
                            <IlbooksLogo className="h-5 w-5" />
                        </AvatarFallback>
                    ) : (
                        <>
                            <AvatarImage src={selectedConversation.user.avatarUrl} alt={selectedConversation.user.name} />
                            <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                        </>
                    )}
                </Avatar>
                <div className="flex-grow">
                    <h2 className="font-semibold text-lg font-headline">{selectedConversation.user.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {selectedConversation.user.name === 'ILBooks' ? 'Admin Support' : `Level: ${selectedConversation.user.level}`}
                    </p>
                </div>
                {selectedConversation.user.name !== 'ILBooks' && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Phone className="w-5 h-5" />
                            <span className="sr-only">Audio Call</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Video className="w-5 h-5" />
                            <span className="sr-only">Video Call</span>
                        </Button>
                    </div>
                )}
            </div>
            <ScrollArea className="flex-1 p-2 sm:p-4 lg:p-6 bg-slate-50/50">
                <div className="space-y-4">
                {selectedConversation.messages.map(msg => (
                  <div key={msg.id} className={cn("group flex w-full max-w-full items-end gap-2", msg.sender === currentUser.id && "justify-end")}>
                      <div className={cn("flex items-end gap-2", msg.sender === currentUser.id ? "flex-row-reverse" : "flex-row")}>
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={msg.sender === currentUser.id ? currentUser.avatarUrl : (selectedConversation.user.avatarUrl !== 'ilbooks_logo' ? selectedConversation.user.avatarUrl : undefined)} />
                           <AvatarFallback>
                              {msg.sender === currentUser.id 
                                  ? currentUser.name.charAt(0) 
                                  : (selectedConversation.user.name === 'ILBooks' ? <IlbooksLogo className="h-4 w-4" /> : selectedConversation.user.name.charAt(0))
                              }
                           </AvatarFallback>
                         </Avatar>

                         <div className={cn("max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] p-2 md:p-3 rounded-lg shadow-sm", msg.sender === currentUser.id ? "bg-primary text-primary-foreground" : "bg-card")}>
                             <p className="break-words">{msg.text}</p>
                            {msg.sender === currentUser.id ? (
                                <div className="flex justify-end items-center gap-1.5 mt-1.5 text-xs opacity-80">
                                    {msg.status === 'pending' && <span className="italic">Pending</span>}
                                    <span>{msg.timestamp}</span>
                                    {msg.status === 'pending' && <Clock className="h-4 w-4" />}
                                    {msg.status === 'sent' && <Check className="h-4 w-4" />}
                                    {msg.status === 'delivered' && <CheckCheck className="h-4 w-4" />}
                                    {msg.status === 'seen' && <CheckCheck className="h-4 w-4 text-lime-300" />}
                                </div>
                            ) : (
                                <p className="text-xs mt-1.5 opacity-75 text-left">{msg.timestamp}</p>
                            )}
                         </div>
                         
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={msg.sender === currentUser.id ? "end" : "start"}>
                                <DropdownMenuItem>
                                    <Reply className="mr-2 h-4 w-4" />
                                    <span>Reply</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Copy</span>
                                </DropdownMenuItem>
                                {msg.sender === currentUser.id ? (
                                    <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem>
                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                        <span>Like</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </div>
                ))}
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <Paperclip className="w-5 h-5"/>
                                <span className="sr-only">Attach file</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <FileImage className="mr-2 h-4 w-4" />
                                <span>Image</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <FileAudio className="mr-2 h-4 w-4" />
                                <span>Audio</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <FileVideoIcon className="mr-2 h-4 w-4" />
                                <span>Video</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Doc/PDF</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem>
                                <Sheet className="mr-2 h-4 w-4" />
                                <span>Excel</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem>
                                <Presentation className="mr-2 h-4 w-4" />
                                <span>Powerpoint</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Camera className="w-5 h-5" />
                        <span className="sr-only">Open camera</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Mic className="w-5 h-5" />
                        <span className="sr-only">Record voice message</span>
                    </Button>
                    <Input 
                        placeholder="Type a message..." 
                        className="flex-1" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon" aria-label="Send Message" disabled={!newMessage.trim()} className="shrink-0">
                        <Send className="w-4 h-4"/>
                    </Button>
                </form>
            </div>
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4"/>
                    <p>Select a conversation to start chatting</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
