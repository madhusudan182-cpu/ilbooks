'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockUsers } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Lock, MessageCircle, Search, Send, ArrowLeft, Phone, Video, Paperclip, Camera, FileImage, Mic, Smile, UserX, ShieldAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from '@/lib/types';
import { IlbooksLogo } from '@/components/ilbooks-logo';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Reply, Copy, ThumbsUp, Trash2, Check, CheckCheck, Clock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { currentUser } from '@/lib/auth';
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
      isFollowing: true,
      isMutual: true, // Admin is always a friend
      isAdmin: true,
    } as User,
    messages: [
      { id: 1, text: "Hello! How can I assist you today?", sender: 'ilbooks-admin', timestamp: '10:00 AM' },
      { id: 2, text: "I have a question about the competition rules.", sender: currentUser.id, timestamp: '10:01 AM', status: 'seen' as const },
      { id: 3, text: "Sure, what is your question?", sender: 'ilbooks-admin', timestamp: '10:02 AM' },
      { id: 4, text: "What is the passing mark for Level 0.0?", sender: currentUser.id, timestamp: '10:03 AM', status: 'delivered' as const },
    ],
    lastMessage: "Sure, what is your question?",
    timestamp: "10:02 AM",
    unread: 0,
  },
  ...mockUsers.filter(u => u.id !== currentUser.id && u.isMutual).map((user, index) => ({
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
type Message = Conversation['messages'][0];


const MessagesPageSkeleton = () => (
    <div className="h-full flex bg-background">
      <aside className="w-full md:w-80 lg:w-96 border-r flex flex-col">
        <div className="p-1 border-b flex items-center gap-1">
          <h1 className="text-xs font-bold font-headline px-2">Chat</h1>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." className="pl-8 h-7" />
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isAdmin = currentUser.isAdmin || false;
  const isFeatureLocked = currentUser.level < 0.3 && !isAdmin;

  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [callType, setCallType] = useState<'Audio' | 'Video' | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    // In a real app, you'd request microphone permissions here.
    setIsRecording(true);
  };

  const handleSendVoiceMessage = () => {
    setIsRecording(false);
    setIsVoiceDialogOpen(false);
    toast({ title: "Voice message sent! (Feature in development)" });
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "Attachment Ready",
        description: `File "${file.name}" will be sent with your message.`,
      });
    }
     // Reset the input value to allow selecting the same file again
    if(e.target) e.target.value = '';
  };


  const truncateMessage = (message: string, maxLength = 20): string => {
    if (message.length <= maxLength) {
      return message;
    }
    return `${message.substring(0, maxLength)}....`;
  };

  useEffect(() => {
    if (isCameraDialogOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          if ((error as Error).name === 'NotAllowedError') {
             setHasCameraPermission(false);
             toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
              });
          } else {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
          }
        }
      };
      getCameraPermission();
    } else {
      // Cleanup: stop video stream when dialog closes
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraDialogOpen, toast]);

  useEffect(() => {
    setIsClient(true);
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId && !isFeatureLocked) {
      const conversation = allConversations.find(c => c.user.id === chatWithId);
      if (conversation) {
        // The conversation exists, so they are a friend. Select it.
        setSelectedConversation(conversation);
      } else {
        // The conversation doesn't exist in our list of friends.
        // This means they are not a mutual, or don't exist.
        const targetUserExists = mockUsers.some(u => u.id === chatWithId);
        if (targetUserExists) {
            toast({
                title: "Cannot Chat",
                description: "You can only chat with mutual friends.",
                variant: "destructive"
            });
        }
        // Whether they exist or not, if they are not in the conversation list, we can't chat.
        // Redirect back to the main messages page.
        router.push('/dashboard/messages', { scroll: false });
      }
    } else {
        setSelectedConversation(null);
    }

    const handlePopState = () => {
        if (window.location.search === '') {
            setSelectedConversation(null);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParams, isFeatureLocked, router, toast]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [selectedConversation?.messages]);

  const handleSelectConversation = (conv: Conversation) => {
    if (isFeatureLocked) {
      toast({
        title: "Feature Locked",
        description: "You need to reach Level 0.3 to chat with friends.",
        variant: "destructive",
      });
      return;
    }
      if (conv.user.isMutual || conv.user.isAdmin) {
        setSelectedConversation(conv);
        router.push(`/dashboard/messages?chatWith=${conv.user.id}`, { scroll: false });
      } else {
         toast({
            title: "Cannot Chat",
            description: "You can only chat with mutual friends.",
            variant: "destructive"
        });
      }
  }

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newMsg: Message = {
          id: Date.now(),
          text: newMessage,
          sender: currentUser.id,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'sent' as const,
      };

      if (selectedConversation) {
        if (newMessage.trim() !== '') {
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
        } else if (inputRef.current) {
            // If message is empty and enter is pressed, just blur.
            inputRef.current.blur();
        }
      }
  };

  const handleDeleteMessage = () => {
    if (!selectedConversation || messageToDelete === null) return;

    const updatedMessages = selectedConversation.messages.filter(m => m.id !== messageToDelete);
    const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
        lastMessage: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].text : "Chat cleared",
    };
    setSelectedConversation(updatedConversation);

    const convIndex = allConversations.findIndex(c => c.user.id === selectedConversation.user.id);
    if (convIndex > -1) {
        allConversations[convIndex] = updatedConversation;
    }

    toast({ title: 'Message deleted!', variant: 'destructive' });
    setMessageToDelete(null);
  };


  if (!isClient) {
    return (
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5.5rem)]">
        <MessagesPageSkeleton />
      </div>
    );
  }
  
  if (isFeatureLocked) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="w-6 h-6" /> Chat Feature Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to reach Level 0.3 to unlock the ability to chat with your friends. Keep participating in competitions to level up!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Camera</DialogTitle>
          <DialogDescription>Take a photo to send in the chat.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => toast({ title: "Taking pictures coming soon!" })} disabled={!hasCameraPermission}>Take Picture</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Start {callType} Call?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to start a {callType?.toLowerCase()} call with {selectedConversation?.user.name}? This feature is currently in development.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setIsCallDialogOpen(false); toast({ title: "Calling feature coming soon!" }) }}>Yes, Start Call</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={messageToDelete !== null} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this message from your view.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Record Voice Message</DialogTitle>
                <DialogDescription>
                    {isRecording ? `Recording... (${recordingTime}s)` : "Click start to begin recording."}
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center h-24">
                <Mic className={cn("w-12 h-12 text-primary transition-all", isRecording && "animate-pulse scale-110")}/>
            </div>
            <DialogFooter>
                {isRecording ? (
                    <>
                        <Button variant="destructive" onClick={() => setIsRecording(false)}>Cancel</Button>
                        <Button onClick={handleSendVoiceMessage}>Stop & Send</Button>
                    </>
                ) : (
                    <Button onClick={handleStartRecording}>Start Recording</Button>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
    <input type="file" ref={imageInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

    <div className="flex bg-background h-[calc(100vh-8rem)] md:h-[calc(100vh-5.5rem)]">
      <aside className={cn(
        "w-full md:w-80 lg:w-96 border-r flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
        )}>
        <div className="p-1 border-b flex items-center gap-1">
          <h1 className="text-xs font-bold font-headline px-2">Chat</h1>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." className="pl-8 h-7" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {allConversations.sort((a,b) => (a.user.isAdmin ? -1 : b.user.isAdmin ? 1 : 0)).map(conv => {
            const isIlbooks = conv.user.name === "ILBooks";
            return (
              <div
                key={conv.user.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
                    e.stopPropagation();
                    return;
                  }
                  handleSelectConversation(conv);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
                            return;
                        }
                        e.preventDefault();
                        handleSelectConversation(conv);
                    }
                }}
                className={cn(
                  "flex items-center gap-3 p-2 border-b cursor-pointer",
                  "transition-colors",
                  selectedConversation?.user.id === conv.user.id ? "bg-muted" : "hover:bg-muted/50",
                  isIlbooks && isAdmin && "sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b-2 border-primary"
                )}
              >
                <Avatar className="h-12 w-12 border flex-shrink-0">
                    { isIlbooks ? (
                    <AvatarFallback className="bg-card">
                        <IlbooksLogo className="h-8 w-8" />
                    </AvatarFallback>
                ) : (
                    <>
                    <AvatarImage src={conv.user.avatarUrl} alt={conv.user.name} />
                    <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
                    </>
                )}
                </Avatar>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-semibold font-headline truncate">{conv.user.name}</p>
                    {!isIlbooks && <p className="text-sm text-muted-foreground truncate">{truncateMessage(conv.lastMessage)}</p>}
                </div>
                
                <div className="flex flex-col items-end flex-shrink-0">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{conv.timestamp}</p>
                  <div className="h-5 flex items-center mt-1">
                  {conv.unread > 0 ? (
                      <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 font-bold">
                          {conv.unread}
                      </span>
                  ) : !isIlbooks ? (
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1">
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
                      <div className="w-5" />
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
            <div className="p-1 border-b flex items-center gap-1">
                <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0 h-8 w-8" onClick={() => {
                    if (document.activeElement === inputRef.current) {
                        inputRef.current?.blur();
                    } else {
                        router.back();
                    }
                }}>
                  <ArrowLeft className="h-4 w-4"/>
                </Button>
                <Avatar className="h-8 w-8 border flex-shrink-0">
                    {selectedConversation.user.name === 'ILBooks' ? (
                        <AvatarFallback className="bg-card">
                            <IlbooksLogo className="h-6 w-6" />
                        </AvatarFallback>
                    ) : (
                        <>
                            <AvatarImage src={selectedConversation.user.avatarUrl} alt={selectedConversation.user.name} />
                            <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                        </>
                    )}
                </Avatar>
                <div className="flex-grow min-w-0">
                    <h2 className="font-semibold text-sm font-headline leading-tight truncate">{selectedConversation.user.name}</h2>
                    <p className="text-xs text-muted-foreground leading-tight">
                        {selectedConversation.user.name === 'ILBooks' ? 'Admin Support' : `Level: ${selectedConversation.user.level.toFixed(1)}`}
                    </p>
                </div>
                {selectedConversation.user.name !== 'ILBooks' && (
                    <div className="flex items-center flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCallType('Audio'); setIsCallDialogOpen(true); }}>
                            <Phone className="w-4 h-4" />
                            <span className="sr-only">Audio Call</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCallType('Video'); setIsCallDialogOpen(true); }}>
                            <Video className="w-4 h-4" />
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
                         {msg.sender !== currentUser.id && (
                           <Avatar className="h-8 w-8">
                             <AvatarImage src={selectedConversation.user.avatarUrl !== 'ilbooks_logo' ? selectedConversation.user.avatarUrl : undefined} />
                             <AvatarFallback>
                                {selectedConversation.user.name === 'ILBooks' ? <IlbooksLogo className="h-6 w-6" /> : selectedConversation.user.name.charAt(0)}
                             </AvatarFallback>
                           </Avatar>
                         )}

                         <div className={cn("max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] p-2 md:p-3 rounded-lg shadow-sm", msg.sender === currentUser.id ? "bg-primary/10" : "bg-card")}>
                             <p className="break-words font-sans text-sm">{msg.text}</p>
                            {msg.sender === currentUser.id ? (
                                <div className="flex justify-end items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                    {msg.status === 'pending' && <span className="italic">Pending</span>}
                                    <span>{msg.timestamp}</span>
                                    {msg.status === 'pending' && <Clock className="h-4 w-4" />}
                                    {msg.status === 'sent' && <Check className="h-4 w-4" />}
                                    {msg.status === 'delivered' && <CheckCheck className="h-4 w-4" />}
                                    {msg.status === 'seen' && <CheckCheck className="h-4 w-4 text-lime-300" />}
                                </div>
                            ) : (
                                <p className="text-xs mt-1.5 text-muted-foreground text-left">{msg.timestamp}</p>
                            )}
                         </div>
                         
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={msg.sender === currentUser.id ? "end" : "start"}>
                                <DropdownMenuItem onClick={() => toast({ title: 'Reply feature coming soon!' })}>
                                    <Reply className="mr-2 h-4 w-4" />
                                    <span>Reply</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(msg.text); toast({ title: 'Message copied!' }); }}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Copy</span>
                                </DropdownMenuItem>
                                {msg.sender === currentUser.id ? (
                                    <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => setMessageToDelete(msg.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => toast({ title: 'Liked message!' })}>
                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                        <span>Like</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <div className="px-1 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className={cn("flex items-center transition-all duration-300", isInputFocused ? "w-0 -ml-2 overflow-hidden opacity-0" : "w-auto ml-0 opacity-100")}>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="w-5 h-5"/>
                            <span className="sr-only">Attach file</span>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 -ml-2" onClick={() => setIsCameraDialogOpen(true)}>
                            <Camera className="w-5 h-5"/>
                            <span className="sr-only">Take a photo</span>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 -ml-2" onClick={() => imageInputRef.current?.click()}>
                            <FileImage className="w-5 h-5"/>
                            <span className="sr-only">Attach an image</span>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 -ml-2" onClick={() => setIsVoiceDialogOpen(true)}>
                            <Mic className="w-5 h-5"/>
                            <span className="sr-only">Record a voice message</span>
                        </Button>
                    </div>
                    <div className="relative flex-1">
                      <Input 
                          ref={inputRef}
                          placeholder="Message" 
                          className="pr-10 h-9 rounded-full bg-muted" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                      />
                       <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                    <Smile className="w-4 h-4 text-muted-foreground" />
                                    <span className="sr-only">Add emoji</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="flex gap-1">
                                    {['😊', '👍', '❤️', '😂', '🎉', '🙏', '😢', '🔥', '😮', '🤔', '😎', '😢'].map((emoji, i) => (
                                        <Button key={i} variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNewMessage(prev => prev + emoji)}>
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button type="submit" aria-label="Send Message" className="shrink-0 h-9 w-9">
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
    </>
  );
}
