'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// লাইন ৬-এ এগুলো যুক্ত করে নিন
import { BookOpen, LogOut, Home, Trophy, Crown, MessageCircle, Users, Grid3x3, Bell, Shield, Loader2, Scale, MessageSquare } from 'lucide-react';
import LiveNotificationBadge from '@/components/LiveNotificationBadge'; // ফাইলের সঠিক পাথ অনুযায়ী দিন
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LiveDropdownList from '@/components/LiveDropdownList'; // ফাইলের সঠিক পাথ অনুযায়ী দিন
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
// বাকি ইম্পোর্টগুলোর সাথে এগুলো যুক্ত করুন
import { doc, collection, query, where, onSnapshot, orderBy, collectionGroup, updateDoc } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger, 
  AlertDialogFooter 
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User as UserProfile } from '@/lib/types';

type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const allNavItems: NavItem[] = [
  { href: '/dashboard', title: 'Home', icon: Home },
  { href: '/dashboard/competition', title: 'Competition', icon: Trophy },
  { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookOpen },
  { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown },
  { href: '/dashboard/messages', title: 'Chat', icon: MessageCircle },
  { href: '/dashboard/social', title: 'Social Circle', icon: Users },
  { href: '/dashboard/notice-board', title: 'Notifications', icon: Bell },
  { href: '/dashboard/complain', title: 'Complain', icon: MessageSquare },
  { href: '/dashboard/community-rules', title: 'Community Rules', icon: Scale },
  { href: '/dashboard/admin', title: 'Admin', icon: Shield, adminOnly: true },
];

const iconNavItems: NavItem[] = [
    { href: '/dashboard', title: 'Home', icon: Home },
    { href: '/dashboard/competition', title: 'Competition', icon: Trophy },
    { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookOpen },
    { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown },
    { href: '/dashboard/messages', title: 'Chat', icon: MessageCircle },
    { href: '/dashboard/social', title: 'Social Circle', icon: Users },
];

const OWNER_EMAIL = 'madhusudan.182@gmail.com';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const userRef = React.useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

   React.useEffect(() => {
    if (!firestore || !user?.uid) return;
    const userStatusRef = doc(firestore, 'users', user.uid);
    const setOnlineStatus = async (isOnline: boolean) => {
      try { await updateDoc(userStatusRef, { isOnline }); } catch (err) { console.error(err); }
    };
    setOnlineStatus(true);
    const handleVisibilityChange = () => {
      setOnlineStatus(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOnlineStatus(false);
    };
  }, [user?.uid, firestore]);


     React.useEffect(() => {
    if (!firestore || !user?.uid) return;

    // আপনার ফায়ারবেস কনসোলের ৩ নম্বর ইনডেক্স (receiverId + status) অনুযায়ী তৈরি নিখুঁত কুয়েরি
    const chatQuery = query(
      collectionGroup(firestore, 'messages'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'sent')
    );

    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const unreadConversations = new Set();
      
      snapshot.docs.forEach(doc => {
        const msgData = doc.data();
        
        // মেসেজের প্যারেন্ট চ্যাট রুমের আইডি (conversationId) ইউনিক সেটে যোগ করা
        const convId = msgData.conversationId || doc.ref.parent.parent?.id;
        if (convId) {
          unreadConversations.add(convId);
        }
      });

      // ইউনিক আনরিড চ্যাটের টোটাল সংখ্যা স্টেট-এ আপডেট করা হলো
      setUnreadChats(unreadConversations.size);
    }, (error) => {
      console.error("Dashboard global chat listener error:", error);
    });

    return () => unsubscribeChat();
  }, [firestore, user?.uid]);

  const [liveUnreadCount, setLiveUnreadCount] = React.useState(0);
  const [unreadChats, setUnreadChats] = React.useState(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [dropdownNotifs, setDropdownNotifs] = React.useState<any[]>([]);


    // ১. নোটিফিকেশন কাউন্টের জন্য একটি গ্লোবাল স্টেট
  const [globalNotifCount, setGlobalNotifCount] = React.useState(0);

    // ২. লুপের বাইরে সম্পূর্ণ স্বাধীন রিয়েল-টাইম নোটিফিকেশন লিসেনার
  // ২. লুপের বাইরে সম্পূর্ণ স্বাধীন রিয়েল-টাইম নোটিফিকেশন লিসেনার
React.useEffect(() => {
  if (!user?.uid || !firestore) return;

  // অ্যাডমিন নোটিফিকেশনের লিসেনার
  const adminNotifQuery = query(
    collection(firestore, 'user_notifications'),
    where('userId', '==', user.uid),
    where('isRead', '==', false)
  );

  // সাইন-আপ ও সোশ্যাল নোটিফিকেশনের লিসেনার
  const socialNotifQuery = query(
    collection(firestore, 'notifications'),
    where('targetUserId', '==', user.uid),
    where('isSeen', '==', false)
  );

  let adminList: any[] = [];
  let socialList: any[] = [];
  let currentAdminCount = 0;
  let currentSocialCount = 0;

  const combineAndSortDropdown = () => {
    const combined = [...adminList, ...socialList];
    const getMs = (dateObj: any) => {
      if (!dateObj) return 0;
      if (typeof dateObj.toDate === 'function') return dateObj.toDate().getTime();
      return new Date(dateObj).getTime() || 0;
    };
    combined.sort((a, b) => getMs(b.createdAt) - getMs(a.createdAt));
    setDropdownNotifs(combined);
  };

  // অ্যাডমিন নোটিফিকেশন রিয়েল-টাইম ট্র্যাক করা
  const unsubscribeAdmin = onSnapshot(adminNotifQuery, (snapshot) => {
    adminList = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      sourceCollection: 'user_notifications',
      ...docSnap.data()
    }));
    currentAdminCount = snapshot.size;
    setGlobalNotifCount(currentAdminCount + currentSocialCount);
    combineAndSortDropdown();
  }, (error) => {
    console.error("Admin notif fetch error: ", error);
  });

  // সাইন-আপ ও সোশ্যাল নোটিফিকেশন রিয়েল-টাইম ট্র্যাক করা
  const unsubscribeSocial = onSnapshot(socialNotifQuery, (snapshot) => {
    socialList = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      sourceCollection: 'notifications',
      ...docSnap.data()
    }));
    currentSocialCount = snapshot.size;
    setLiveUnreadCount(currentSocialCount); // মোবাইল ভিউর জন্য স্টেট আপডেট
    setGlobalNotifCount(currentAdminCount + currentSocialCount);
    combineAndSortDropdown();
  }, (error) => {
    console.error("Social notif fetch error: ", error);
  });

  return () => {
    unsubscribeAdmin();
    unsubscribeSocial();
  };
}, [user?.uid, firestore]);


    
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!authLoading && !user && isClient) {
      router.replace('/login');
    }
  }, [user, authLoading, router, isClient]);

  const isAdmin = user?.email?.toLowerCase() === OWNER_EMAIL;

  const notifications = [
    {
      title: "Welcome to ILBooks",
      description: "Start your journey by exploring the Book Shop!",
    }
  ];
  const notificationCount = notifications.length;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleNotifClick = async (notif: any) => {
  if (!firestore) return;
  try {
    const docRef = doc(firestore, notif.sourceCollection, notif.id);
    if (notif.sourceCollection === 'user_notifications') {
      await updateDoc(docRef, { isRead: true });
    } else {
      await updateDoc(docRef, { isSeen: true });
    }
    
    if (notif.postId) {
      router.push(`/dashboard/profile#post-${notif.postId}`);
    } else if (notif.senderId) {
      router.push(`/dashboard/profile/${notif.senderId}`);
    } else {
      router.push('/dashboard/notice-board');
    }
  } catch (err) {
    console.error("Error updating notification status:", err);
  }
};


  if (!isClient || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const userName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatarUrl || user.photoURL || "https://dicebear.com";


  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="relative flex h-12 w-full items-center justify-between px-4 md:px-6">

              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden h-10 w-10 flex items-center justify-center rounded-xl text-pink-900 border border-purple-900 bg-purple-300 transition-colors hover:bg-pink-500 shadow-sm"
                  >
                    <Grid3x3 className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col">
                  <SheetHeader className="border-b p-4">
                      <SheetTitle>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center gap-2 text-pink-500 transition-all"
                        >
                          <BookOpen className="h-6 w-6" />
                          <span className="font-headline text-xl">ILBooks</span>
                        </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1">
                    <nav className="grid gap-2 p-4 text-lg font-medium">
                      {allNavItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
                    
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        setIsSheetOpen(false);
                        // যদি হোম আইকনে ক্লিক করা হয়, তবে জোরপূর্বক পেজ রিফ্রেশ হবে
                        if (item.href === '/dashboard') {
                          e.preventDefault();
                          window.location.href = '/dashboard';
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition-all border border-pink-100 bg-pink-50/40 hover:bg-pink-50 hover:text-pink-600 shadow-sm",
                        pathname === item.href && "bg-pink-100/70 border-pink-300 text-pink-700 font-medium"
                      )}

                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        
                        {item.title === 'Notifications' && liveUnreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                            {liveUnreadCount}
                          </span>
                        )}

                        {item.title.toLowerCase() === 'Chat' && unreadChats > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                            {unreadChats}
                          </span>
                        )}
                      </div>
                      
                      {item.title}
                    </Link>

                    ))}
                    </nav>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              
              <Link 
                href="/dashboard" 
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 text-pink-500 transition-transform active:scale-95 z-20"
              >
                <BookOpen className="w-8 h-8" />
                <span className="font-headline font-semibold text-2xl md:text-3xl">ILBooks</span>
              </Link>

              <div className="flex items-center gap-2">


                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl text-pink-900 border border-purple-300 bg-purple-300 transition-colors hover:bg-pink-200 shadow-sm"
                  >
                    <Grid3x3 className="h-5 w-5" />
                    <span className="sr-only">Toggle Main Menu</span>
                  </Button>

                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {allNavItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (item.href === '/dashboard') {
                              e.preventDefault();
                              window.location.href = '/dashboard';
                            }
                          }}
                          className={cn(
                              "flex items-center gap-3",
                              pathname === item.href && "text-primary"
                          )}
                        >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      
                      {/* Notifications-এর লাল ব্যাজ */}
                      {item.title === 'Notifications' && liveUnreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                          {liveUnreadCount}
                        </span>
                      )}

                      {/* Chat-এর লাল ব্যাজ */}
                      {item.title.toLowerCase() === 'Chat' && unreadChats > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                          {unreadChats}
                        </span>
                      )}
                    </div>

                          <span>{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              

              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative h-10 w-10 rounded-xl border-pink-200 bg-pink-50/50 hover:bg-pink-100 p-0 shadow-sm">

                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt="User avatar" />
                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-pink-900 border border-purple-900 bg-purple-300 transition-colors hover:bg-pink-500 shadow-sm"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>


                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be returned to the login page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Yes</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
        </div>
      </header>

      <nav className="sticky top-12 z-10 w-full border-b border-pink-100 bg-pink-50/95 backdrop-blur-sm">
          <div className="mx-auto flex h-12 items-center justify-center gap-3 p-2">
                <TooltipProvider>
                {[...iconNavItems, { href: '/dashboard/notice-board', title: 'Notifications', icon: Bell }].map((item) => {
                  if (item.title === 'Notifications') {
                    // নোটিফিকেশন বাটনটির মূল ইন্টারফেস (UI) যা দুই ক্ষেত্রেই এক থাকবে
                    const NotificationButton = (
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "relative flex h-10 w-10 items-center justify-center rounded-xl text-pink-900 border border-purple-900 bg-pink-300 transition-colors hover:bg-pink-500 cursor-pointer shadow-sm",
                          pathname === '/dashboard/notice-board' && "bg-orange-500 border-orange-600 text-white hover:bg-orange-600"
                        )}
                      >
                        <Bell className="h-5 w-5" /> {/* আইকনের সাইজ অন্যান্য বাটনের মতো h-5 w-5 করা হলো */}
                        {globalNotifCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                            {globalNotifCount}
                          </span>
                        )}
                      </Button>
                    );

                    return (
                      <Tooltip key="notifications-tooltip">
                        <TooltipTrigger asChild>
                          <div> {/* Tooltip এবং Trigger এর সঠিক কাজের জন্য একটি wrapper div */}
                            {globalNotifCount > 0 ? (
                              // ১. নোটিফিকেশন থাকলে: ড্রপডাউন মেনু ওপেন হবে
                              <DropdownMenu key="notifications-dropdown">
                                <DropdownMenuTrigger asChild>
                                  {NotificationButton}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 bg-white border border-gray-100 p-2 shadow-lg rounded-md z-50">
                                  <DropdownMenuLabel className="font-bold text-gray-800 px-2 py-1 text-sm">Notifications</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <LiveDropdownList
                                    userId={user?.uid}
                                    notifList={dropdownNotifs}
                                    handleNotifClick={handleNotifClick}
                                  />
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href="/dashboard/notice-board" className="w-full text-center text-xs text-blue-600 justify-center font-medium">
                                      View all notifications
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              // ২. নোটিফিকেশন না থাকলে: সরাসরি নোটিফিকেশন পেজে নিয়ে যাবে
                              <Link
                                href="/dashboard/notice-board"
                                onClick={(e) => {
                                  if (pathname === '/dashboard/notice-board') {
                                    e.preventDefault();
                                    window.location.href = '/dashboard/notice-board';
                                  }
                                }}
                              >
                                {NotificationButton}
                              </Link>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Notifications</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (item.href === '/dashboard') {
                              e.preventDefault();
                              window.location.href = '/dashboard';
                            }
                          }}
                          className={cn(
                            // স্বাভাবিক অবস্থায় পিঙ্ক (Pink) ব্যাকগ্রাউন্ড এবং হোভার ইফেক্ট
                            "flex h-10 w-10 items-center justify-center rounded-xl text-pink-900 border border-purple-900 bg-pink-300 transition-colors hover:bg-pink-500 shadow-sm",
                            
                            // সিলেক্টেড বা একটিভ অবস্থায় অরেঞ্জ (Orange) ব্যাকগ্রাউন্ড ও টেক্সট কালার
                            pathname === item.href && "bg-orange-500 border-orange-600 text-white hover:bg-orange-600"
                          )}

                        >
                          {/* ৪৪০ নম্বর লাইনের জায়গায় এটি বসান */}
                          <div className="relative">
                            <item.icon className="h-5 w-5" />
                            {item.title.toLowerCase() === 'chat' && unreadChats > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                                {unreadChats}
                              </span>
                            )}
                          </div>
                          <span className="sr-only">{item.title}</span>

                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{item.title}</p>
                    </TooltipContent>
                    </Tooltip>
                )})}
                </TooltipProvider>
          </div>
        </nav>

      <main className="flex-grow bg-muted/30">
        {children}
      </main>

    </div>
  );
}

