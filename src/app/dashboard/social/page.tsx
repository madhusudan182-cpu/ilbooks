'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/data";
import type { User } from "@/lib/types";
import { MessageCircle, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const UserCard = ({ user }: { user: User }) => {
  const isCurrentUser = user.id === currentUser.id;
  const profileUrl = isCurrentUser ? '/dashboard/profile' : `/dashboard/user/${user.id}`;
  
  return (
    <Card>
      <CardContent className="p-1 flex items-center gap-2">
        <Link href={profileUrl}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-grow">
          <Link href={profileUrl} className="hover:underline">
            <p className="font-semibold font-headline text-sm">{user.name}</p>
          </Link>
          <p className="text-xs text-muted-foreground">Level: {user.level.toFixed(1)}</p>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentUser && (
            <>
              {user.isMutual ? (
                <>
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <Link href={`/dashboard/messages?chatWith=${user.id}`}>
                      <MessageCircle className="h-4 w-4"/>
                    </Link>
                  </Button>
                  <Button variant="secondary" size="sm" className="h-7 px-2 text-xs">Unfollow</Button>
                </>
              ) : user.isFollowing ? (
                <Button variant="secondary" size="sm" className="h-7 px-2 text-xs">Unfollow</Button>
              ) : (
                <Button size="sm" className="h-7 px-2 text-xs">
                  <UserPlus className="mr-1 h-3 w-3"/> Follow
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UserList = ({ users }: { users: User[] }) => (
  <div className="space-y-1">
    {users.map(user => <UserCard key={user.id} user={user} />)}
  </div>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );

export default function SocialPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleInvite = () => {
    const appUrl = window.location.origin;
    const quote = "Join me on ILBooks, a network for book lovers!";
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(quote)}`, '_blank', 'noopener,noreferrer');
  }

  const following = mockUsers.filter(u => u.isFollowing);
  const followers = [...mockUsers.filter(u => u.isMutual), mockUsers[2]];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline text-center mb-4">Social Circle</h1>
      {isClient ? (
        <Tabs defaultValue="search">
          <div className="grid w-full grid-cols-4 items-center bg-transparent p-0 gap-1">
            <TabsList className="col-span-3 grid w-full grid-cols-3 bg-transparent p-0 gap-1">
                <TabsTrigger value="search" className="rounded-md bg-blue-500 text-white data-[state=active]:bg-blue-600 px-1 py-1 h-8 text-xs">Search</TabsTrigger>
                <TabsTrigger value="following" className="rounded-md bg-red-300 text-red-800 data-[state=active]:bg-red-400 px-1 py-1 h-8 text-xs"><UserCheck className="w-4 h-4 mr-1" />Following</TabsTrigger>
                <TabsTrigger value="followers" className="rounded-md bg-blue-500 text-white data-[state=active]:bg-blue-600 px-1 py-1 h-8 text-xs"><UserPlus className="w-4 h-4 mr-1" />Followers</TabsTrigger>
            </TabsList>
            <Button onClick={handleInvite} className="rounded-md bg-red-300 hover:bg-red-400 text-red-800 px-1 py-1 h-8 text-xs">
                <FacebookIcon className="w-4 h-4 mr-1" />
                Invite
            </Button>
          </div>
          <TabsContent value="search" className="mt-2">
            <UserList users={mockUsers} />
          </TabsContent>
          <TabsContent value="following" className="mt-2">
            <UserList users={following} />
          </TabsContent>
          <TabsContent value="followers" className="mt-2">
            <UserList users={followers} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
