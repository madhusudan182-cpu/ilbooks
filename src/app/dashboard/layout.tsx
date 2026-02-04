"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LogOut, Home, Trophy, Crown, MessageCircle, Users, Grid3x3, Gift, Bell } from 'lucide-react';
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

type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
};

const allNavItems: NavItem[] = [
  { href: '/dashboard', title: 'Home', icon: Home },
  { href: '/dashboard/competition', title: 'Competition', icon: Trophy },
  { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookOpen },
  { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown },
  { href: '/dashboard/messages', title: 'Chat', icon: MessageCircle },
  { href: '/dashboard/social', title: 'Social Circle', icon: Users },
  { href: '/dashboard/new-arrivals', title: 'New Arrivals', icon: Gift },
  { href: '/dashboard/notice-board', title: 'Notifications', icon: Bell }
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
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          {!isClient && (
            <>
              {/* Static placeholder for SSR to prevent layout shift */}
              <div className="flex items-center gap-2">
                 <Link href="/dashboard" className="flex items-center gap-2 text-primary">
                    <BookOpen className="w-6 h-6" />
                    <span className="font-headline font-semibold">ILBooks</span>
                 </Link>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <Button variant="outline" size="sm" className="hidden md:block w-24"> </Button>
              </div>
            </>
          )}
          {isClient && (
            <>
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
                <SheetContent side="left" className="p-0">
                  <SheetHeader className="border-b p-4">
                      <SheetTitle>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center gap-2 text-primary transition-all"
                        >
                          <BookOpen className="h-6 w-6" />
                          <span className="font-headline text-xl">ILBooks</span>
                        </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="grid gap-2 p-4 text-lg font-medium">
                    {allNavItems.map((item) => (
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
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-2 text-primary">
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
                    {allNavItems.map((item) => (
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
                        <AvatarImage src="https://picsum.photos/seed/av1/100/100" alt="User avatar" />
                        <AvatarFallback>YOU</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Alia Rahman</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          alia.r@example.com
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" asChild>
                    <Link href="/login">
                        <LogOut className="mr-0 md:mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Log Out</span>
                    </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <nav className="sticky top-16 z-10 w-full border-b bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 items-center justify-center gap-1 p-2">
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
                              <Bell className="h-5 w-5" />
                              {notificationCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 text-primary text-[10px] font-bold">
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

      <main className="flex-grow bg-muted/30 pt-[calc(3.5rem+1px)]">
        {children}
      </main>

    </div>
  );
}
