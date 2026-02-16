'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/data";
import type { User } from "@/lib/types";
import { MessageCircle, UserPlus, ArrowLeft, Search, Users, Share2 } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

// Mock data for Facebook friends
const mockFacebookFriends = [
  { id: 'fb-1', name: 'Zayn Malik', avatarUrl: 'https://picsum.photos/seed/fb1/100/100' },
  { id: 'fb-2', name: 'Liam Payne', avatarUrl: 'https://picsum.photos/seed/fb2/100/100' },
  { id: 'fb-3', name: 'Harry Styles', avatarUrl: 'https://picsum.photos/seed/fb3/100/100' },
  { id: 'fb-4', name: 'Niall Horan', avatarUrl: 'https://picsum.photos/seed/fb4/100/100' },
  { id: 'fb-5', name: 'Louis Tomlinson', avatarUrl: 'https://picsum.photos/seed/fb5/100/100' },
  { id: 'fb-6', name: 'Taylor Swift', avatarUrl: 'https://picsum.photos/seed/fb6/100/100' },
  { id: 'fb-7', name: 'Selena Gomez', avatarUrl: 'https://picsum.photos/seed/fb7/100/100' },
  { id: 'fb-8', name: 'Justin Bieber', avatarUrl: 'https://picsum.photos/seed/fb8/100/100' },
  { id: 'fb-9', name: 'Ariana Grande', avatarUrl: 'https://picsum.photos/seed/fb9/100/100' },
];

export default function SocialPage() {
  const [isClient, setIsClient] = useState(false);
  const [view, setView] = useState<'tabs' | 'invite'>('tabs');
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleInviteFriend = (friendId: string, friendName: string) => {
    setInvitedFriends(prev => new Set(prev).add(friendId));
    toast({
        title: `Invitation sent to ${friendName}`,
        description: "A place where you can read, flourish and earn money by reading book.",
    });
  };

  const handleShare = async () => {
    const shareData = {
        title: 'ILBooks - The Social Network for Book Lovers',
        text: 'Join ILBooks, a vibrant community for readers. Connect with fellow bookworms, compete in literary challenges, discover new books, and share your passion for reading.',
        url: 'https://ilbooks-app-prev.web.app'
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            toast({
                title: 'Shared successfully!',
            });
        } else {
            await navigator.clipboard.writeText(shareData.url);
            toast({
                title: 'Link Copied!',
                description: 'The app link has been copied to your clipboard. You can now paste it to share.',
            });
        }
    } catch (error) {
        console.error('Share failed:', error);
        toast({
            title: 'Share failed',
            description: 'Could not share at this moment. Please try again.',
            variant: 'destructive',
        });
    }
  };

  const filteredFriendsData = mockFacebookFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteAll = () => {
    const allFriendIds = filteredFriendsData.map(f => f.id);
    setInvitedFriends(prev => new Set([...prev, ...allFriendIds]));
    toast({
        title: "All visible friends invited!",
        description: "A place where you can read, flourish and earn money by reading book.",
    });
  };

  const friends = mockUsers.filter(u => u.isMutual);

  if (!isClient) {
    return null;
  }

  if (view === 'invite') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-headline">Invite Friends</h1>
          <Button variant="ghost" onClick={() => setView('tabs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="mb-4 space-y-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search for a friend..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button onClick={handleInviteAll} className="w-full">
                Invite All
            </Button>
        </div>

        <Card>
          <CardContent className="p-2 space-y-2">
            {filteredFriendsData.map(friend => {
              const isInvited = invitedFriends.has(friend.id);
              return (
                <Card key={friend.id}>
                  <CardContent className="p-2 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="flex-1 font-semibold">{friend.name}</p>
                    <Button
                      size="sm"
                      onClick={() => handleInviteFriend(friend.id, friend.name)}
                      disabled={isInvited}
                      className={cn(isInvited && "bg-green-500 hover:bg-green-600")}
                    >
                      {isInvited ? 'Invited' : 'Invite'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline text-center mb-4">Social Circle</h1>
      <Tabs defaultValue="search">
        <div className="grid w-full grid-cols-4 items-center bg-transparent p-0 gap-1">
          <TabsList className="col-span-2 grid w-full grid-cols-2 bg-transparent p-0 gap-1">
              <TabsTrigger value="search" className="rounded-md bg-blue-500 text-white data-[state=active]:bg-blue-600 px-1 py-1 h-8 text-xs">Search</TabsTrigger>
              <TabsTrigger value="friends" className="rounded-md bg-red-300 text-red-800 data-[state=active]:bg-red-400 px-1 py-1 h-8 text-xs"><Users className="w-4 h-4 mr-1" />Friends</TabsTrigger>
          </TabsList>
           <Button onClick={handleShare} className="rounded-md bg-green-500 hover:bg-green-600 text-white px-1 py-1 h-8 text-xs">
              <Share2 className="w-4 h-4 mr-1" />
              Share
          </Button>
          <Button onClick={() => setView('invite')} className="rounded-md bg-red-300 hover:bg-red-400 text-red-800 px-1 py-1 h-8 text-xs">
              <FacebookIcon className="w-4 h-4 mr-1 text-blue-600" />
              Invite
          </Button>
        </div>
        <TabsContent value="search" className="mt-2">
          <UserList users={mockUsers} />
        </TabsContent>
        <TabsContent value="friends" className="mt-2">
          <UserList users={friends} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
