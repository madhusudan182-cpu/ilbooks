"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  Book,
  BookMarked,
  Crown,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Star,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNav: NavItem[] = [
  { href: '/dashboard', title: 'Home', icon: Home },
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
         <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Toggle Sidebar">
                      <Book className="w-6 h-6 text-primary" />
                  </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-semibold font-headline">ILBooks</h1>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
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

              <Link href="/dashboard" className="hidden items-center gap-2 md:flex">
                  <Book className="h-6 w-6 text-primary" />
              </Link>

              <Button variant="outline" asChild>
                  <Link href="/login">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                  </Link>
              </Button>
            </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
