"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  Book,
  BookMarked,
  Bot,
  CircleUser,
  Crown,
  Home,
  MessageCircle,
  Search,
  Sword,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNav: NavItem[] = [
  { href: '/dashboard', title: 'Dashboard', icon: Home },
  { href: '/dashboard/profile', title: 'Profile', icon: CircleUser },
  { href: '/dashboard/competition', title: 'Competition', icon: Sword },
  { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookMarked },
  { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown },
];

const socialNav: NavItem[] = [
  { href: '/dashboard/messages', title: 'Messages', icon: MessageCircle },
  { href: '/dashboard/social', title: 'Friends', icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" asChild>
              <SidebarTrigger />
            </Button>
            <Book className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-headline font-semibold text-primary group-data-[collapsible=icon]:hidden">
              ILBooks
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={{ children: item.title }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          </SidebarMenu>
          <div className="mt-auto">
            <SidebarMenu>
                <SidebarGroup>
                <SidebarGroupLabel>Social</SidebarGroupLabel>
                {socialNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        tooltip={{ children: item.title }}
                    >
                        <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip={{ children: "Find People" }}
                    >
                        <Link href="/dashboard/social">
                        <Search />
                        <span>Find People</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
            </SidebarMenu>
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="max-w-screen-2xl mx-auto">
         <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
            <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle Sidebar">
                    <Book className="w-6 h-6 text-primary" />
                </Button>
            </SidebarTrigger>
            <h1 className="text-lg font-semibold font-headline">ILBooks</h1>
            <Link href="/dashboard/profile" className="ml-auto">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/seed/av1/100/100" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </Link>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
