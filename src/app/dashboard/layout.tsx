"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, LogOut, Home, Trophy, BookMarked, Crown, MessageCircle, Users, Menu, Star, PenSquare, Gift, Bell } from 'lucide-react';
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

type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: '/dashboard', title: 'Home', icon: Home },
  { href: '/dashboard/competition', title: 'Competition', icon: Trophy },
  { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookMarked },
  { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown },
  { href: '/dashboard/messages', title: 'Chat', icon: MessageCircle },
  { href: '/dashboard/social', title: 'Social Circle', icon: Users },
  { href: '/dashboard/new-arrivals', title: 'New Arrivals', icon: Gift },
  { href: '/dashboard/notice-board', title: 'Notice Board', icon: Bell }
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
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
                      <Book className="h-6 w-6" />
                      <span className="font-headline text-xl">ILBooks</span>
                    </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 p-4 text-lg font-medium">
                {navItems.map((item) => (
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
          <Link href="/dashboard" className="flex items-center gap-2 text-primary mr-auto">
            <Book className="w-6 h-6" />
            <span className="font-headline font-semibold hidden md:block">ILBooks</span>
          </Link>
          
          <div className="flex items-center gap-2">
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
        </div>
        
        <nav className="hidden h-14 items-center justify-center gap-8 bg-background/80 px-6 text-sm font-medium md:flex border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            ))}
        </nav>
        
        <div className="hidden md:flex h-12 items-center justify-center gap-x-8 text-sm text-muted-foreground border-t bg-background/70">
            <Link href="/dashboard/competition#leaderboard" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Star className="w-4 h-4" />
                <span>Leaderboard</span>
            </Link>
             <Link href="/dashboard#post" className="flex items-center gap-2 hover:text-primary transition-colors">
                <PenSquare className="w-4 h-4" />
                <span>Write a Post</span>
            </Link>
        </div>

      </header>

      <main className="flex-grow bg-muted/30">
        {children}
      </main>
    </div>
  );
}
