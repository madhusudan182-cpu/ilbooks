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
import { Book, Lock, MessageCircle, Search, Send, ArrowLeft, Phone, Video, Paperclip, Camera, FileImage, FileAudio, FileVideo as FileVideoIcon, FileText, Sheet, Presentation } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from '@/lib/types';

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
      { id: 2, text: "I have a question about the competition rules.", sender: currentUser.id, timestamp: '10:01 AM' },
    ],
    lastMessage: "I have a question about the competition rules.",
    timestamp: "10:01 AM",
    unread: 0,
  },
  ...mockUsers.filter(u => u.id !== currentUser.id).map((user, index) => ({
    user,
    messages: [
      { id: 1, text: "Hey, how are you?", sender: user.id, timestamp: '9:30 AM'},
      { id: 2, text: "Doing great, thanks! Just finished a new book.", sender: currentUser.id, timestamp: '9:32 AM'}
    ],
    lastMessage: "Doing great, thanks! Just finished a new book.",
    timestamp: "9:32 AM",
    unread: index === 0 ? 2 : 0,
  }))
];

type Conversation = (typeof allConversations)[0];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const searchParams = useSearchParams();

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
      };

      // This is a mock update. In a real app, you'd send this to a backend.
      if (selectedConversation) {
        const updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, newMsg],
            lastMessage: newMsg.text,
            timestamp: newMsg.timestamp,
        };

        setSelectedConversation(updatedConversation);
        // Also update the main list
        const convIndex = allConversations.findIndex(c => c.user.id === selectedConversation.user.id);
        if (convIndex > -1) {
            allConversations[convIndex] = updatedConversation;
        }
        setNewMessage('');
      }
  };

  const isAdmin = currentUser.isAdmin || false;
  const userLevel = currentUser.level;
  
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

  // Admin or eligible user view
  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen border-t md:border-t-0 flex bg-background">
      {/* Sidebar with conversations */}
      <aside className={cn(
        "w-full md:w-80 lg:w-96 border-r flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
        )}>
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold font-headline">Chat</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {allConversations.sort((a,b) => (a.user.isAdmin ? -1 : b.user.isAdmin ? 1 : 0)).map(conv => {
            const isIlbooks = conv.user.name === "ILBooks";
            return (
              <button
                key={conv.user.id}
                className={cn(
                  "w-full text-left p-4 flex gap-4 items-start transition-colors hover:bg-muted/50",
                  selectedConversation?.user.id === conv.user.id && "bg-muted",
                  isIlbooks && isAdmin && "sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b-2 border-primary"
                )}
                onClick={() => setSelectedConversation(conv)}
              >
                <Avatar className="h-12 w-12 border">
                  { isIlbooks ? <Book className="h-6 w-6 text-primary m-auto" /> : <AvatarImage src={conv.user.avatarUrl} alt={conv.user.name} />}
                  <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold font-headline truncate">{conv.user.name}</p>
                    <p className="text-xs text-muted-foreground">{conv.timestamp}</p>
                  </div>
                  <div className="flex justify-between items-start mt-1">
                     <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                     {conv.unread > 0 && (
                        <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 font-bold">
                            {conv.unread}
                        </span>
                     )}
                  </div>
                </div>
              </button>
            )
          })}
        </ScrollArea>
      </aside>

      {/* Main chat area */}
      <main className={cn(
        "flex-1 flex-col",
        selectedConversation ? "flex" : "hidden md:flex"
        )}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-5 w-5"/>
                </Button>
                <Avatar className="h-10 w-10 border">
                    { selectedConversation.user.name === 'ILBooks' ? <Book className="h-5 w-5 text-primary m-auto" /> : <AvatarImage src={selectedConversation.user.avatarUrl} alt={selectedConversation.user.name} />}
                    <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
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
            <ScrollArea className="flex-1 p-4 lg:p-6 bg-slate-50/50">
                <div className="space-y-6">
                {selectedConversation.messages.map(msg => (
                    <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === currentUser.id && "flex-row-reverse")}>
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={msg.sender === currentUser.id ? currentUser.avatarUrl : (selectedConversation.user.avatarUrl !== 'ilbooks_logo' ? selectedConversation.user.avatarUrl : undefined)} />
                         <AvatarFallback>
                            {msg.sender === currentUser.id 
                                ? currentUser.name.charAt(0) 
                                : (selectedConversation.user.name === 'ILBooks' ? <Book className="h-4 w-4" /> : selectedConversation.user.name.charAt(0))
                            }
                         </AvatarFallback>
                       </Avatar>
                       <div className={cn("max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm", msg.sender === currentUser.id ? "bg-primary text-primary-foreground" : "bg-card")}>
                           <p>{msg.text}</p>
                           <p className={cn("text-xs mt-2 opacity-70", msg.sender === currentUser.id ? "text-right" : "text-left")}>{msg.timestamp}</p>
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
