
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LogOut, Home, Trophy, Crown, MessageCircle, Users, Grid3x3, Bell, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
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
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const isAdmin = profile?.isAdmin || user?.email?.toLowerCase() === 'madhusudan.182@gmail.com';

  const notifications = [
    {
      title: "New Follower",
      description: "Ben Carter started following you.",
    },
    {
      title: "Post Activity",
      description: "Your post got 10 new likes.",
    },
    {
      title: "New Books!",
      description: "New arrivals are in the Book Shop.",
    }
  ];
  const notificationCount = notifications.length;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!isClient || authLoading || profileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

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
                        <item.icon className="h-5 w-5" />
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
                          <item.icon className="h-5 w-5" />
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
                        <AvatarImage src={profile.avatarUrl} alt="User avatar" />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile.email}
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
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                <Bell className="h-8 w-8" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {notificationCount}
                                    </span>
                                )}
                                <span className="sr-only">Notifications</span>
                                </Button>
                            </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                            <p>Notifications</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {notifications.map((notification, index) => (
                            <DropdownMenuItem key={index} className="flex-col items-start gap-1">
                                <p className="font-medium">{notification.title}</p>
                                <p className="text-xs text-muted-foreground">{notification.description}</p>
                            </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                            <Link href="/dashboard/notice-board" className='justify-center'>View all notifications</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    )
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
