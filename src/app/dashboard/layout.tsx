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
import { doc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'; 
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

  const chatQuery = query(
    collection(firestore, 'messages'),
    where('receiverId', '==', user.uid),
    where('seen', '==', false)
  );

  const unsubscribeChat = onSnapshot(chatQuery, (snapshot: any) => {
    setUnreadChats(snapshot.size); 
  }, (error: any) => {
    console.error("Error fetching unread chats count:", error);
  });

  return () => unsubscribeChat();
}, [firestore, user?.uid]);

  const [liveUnreadCount, setLiveUnreadCount] = React.useState(0);
  const [unreadChats, setUnreadChats] = React.useState(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

    // ১. নোটিফিকেশন কাউন্টের জন্য একটি গ্লোবাল স্টেট
  const [globalNotifCount, setGlobalNotifCount] = React.useState(0);

  // ২. লুপের বাইরে সম্পূর্ণ স্বাধীন রিয়েল-টাইম নোটিফিকেশন লিসেনার
  React.useEffect(() => {
    if (!user?.uid || !firestore) return;

    const notifQuery = query(
      collection(firestore, 'user_notifications'),
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    );

    const unsubscribeNotifGlobal = onSnapshot(notifQuery, (snapshot) => {
      setGlobalNotifCount(snapshot.size);
    }, (error) => {
      console.error("Global notif fetch error: ", error);
    });

    return () => unsubscribeNotifGlobal();
  }, [user?.uid, firestore]);


    React.useEffect(() => {
  // 🔒 সেফটি লক: যদি ইউজার আইডি অথবা ফায়ারস্টোর রেডি না থাকে, তবে কোড ওখানেই থেমে যাবে
  if (!user?.uid || !firestore) return;

  try {
    // এখন গ্লোবালি ইম্পোর্ট করা মেথডগুলো সরাসরি ব্যবহার হবে
    const q = query(
      collection(firestore, 'notifications'),
      where('targetUserId', '==', user.uid),
      where('isSeen', '==', false)

    );

   

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setLiveUnreadCount(snapshot.size);
    }, (error: any) => {
      console.error("Live counter onSnapshot error:", error);
    });

    return () => unsubscribe();
  } catch (e) {
    console.error("Firestore definitive guard caught error:", e);
  }
}, [user, firestore]);


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

  if (!isClient || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const userName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`;

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-12 items-center gap-4 px-4 md:px-6">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
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
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname === item.href && "bg-muted text-primary"
                        )}
                      >
                        <div className="relative">
                          <item.icon className="h-5 w-5" />
                          {item.title === 'Notifications' && liveUnreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                              {liveUnreadCount}
                            </span>
                          )}
                        </div>
                          {item.title === 'Chat' && unreadChats > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                            {unreadChats}
                          </span>
                        )}
                        {item.title}
                      </Link>
                    ))}
                    </nav>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-2 text-pink-500">
                  <BookOpen className="w-6 h-6" />
                  <span className="font-headline font-semibold">ILBooks</span>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 hidden md:inline-flex"
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
                          className={cn(
                              "flex items-center gap-3",
                              pathname === item.href && "text-primary"
                          )}
                        >
                          <div className="relative">
                            <item.icon className="h-5 w-5" />
                            {item.title === 'Notifications' && liveUnreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                                {liveUnreadCount}
                              </span>
                            )}
                            {item.title === 'Chat' && unreadChats > 0 && (
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
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                    <Button variant="outline" size="sm">
                      <LogOut className="mr-0 md:mr-2 h-4 w-4" />
                      <span className="hidden md:inline">Log Out</span>
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

      <nav className="sticky top-12 z-10 w-full border-b bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-10 items-center justify-center gap-1 p-2">
                <TooltipProvider>
                {[...iconNavItems, { href: '/dashboard/notice-board', title: 'Notifications', icon: Bell }].map((item) => {
                  if (item.title === 'Notifications') {
                    return (
                      <DropdownMenu key="notifications-dropdown">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                              >
                                <Bell className="h-8 w-8" />
                                {globalNotifCount > 0 && (
                                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
                                    {globalNotifCount}
                                  </span>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Notifications</p>
                          </TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent align="end" className="w-80 bg-white border border-gray-100 p-2 shadow-lg rounded-md z-50">
                          <DropdownMenuLabel className="font-bold text-gray-800 px-2 py-1 text-sm">Notifications</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                            <LiveDropdownList userId={user?.uid} />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/notice-board" className="w-full text-center text-xs text-blue-600 justify-center font-medium">
                              View all notifications
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                    return (
                    <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                        <Link
                        href={item.href}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                            pathname === item.href && "bg-accent text-accent-foreground"
                        )}
                        >
                        <item.icon className="h-5 w-5" />
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