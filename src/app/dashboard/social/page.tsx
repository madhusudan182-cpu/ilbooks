'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/data";
import type { User } from "@/lib/types";
import { MessageCircle, UserPlus, ArrowLeft, Search, Users, Share2, Copy } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";


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

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor"><title>WhatsApp</title><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.06 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM9.53 8.51c.24-.12.55-.27.8-.39.25-.12.42-.18.58-.18.16 0 .31.06.43.18.12.12.18.27.18.42s-.06.3-.18.42c-.12.12-.27.18-.42.18h-.12c-.15 0-.3-.03-.45-.09-.52-.22-.98-.56-1.38-1.01-.41-.46-.61-.98-.61-1.56 0-.58.2-1.09.61-1.56s.9-.73 1.48-.84c.58-.11 1.15-.05 1.7.18.55.23.99.58 1.32 1.05.33.47.49 1.01.49 1.61 0 .6-.16 1.14-.49 1.61-.33.47-.77.82-1.32 1.05-.25.11-.5.19-.75.24-.25.06-.5.09-.75.09-.33 0-.65-.06-.96-.18l-3.3 1.1.84-3.21c-.48-.6-.73-1.28-.73-2.01 0-.73.25-1.41.73-2.01.49-.6 1.1-.94 1.8-.94.7 0 1.35.34 1.8.94.49.6.73 1.28.73 2.01 0 .73-.25 1.41-.73 2.01z"/></svg>
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

  const urlToShare = 'https://ilbooks-app-prev.web.app';
  const shareText = 'Join ILBooks, a vibrant community for readers. Connect with fellow bookworms, compete in literary challenges, discover new books, and share your passion for reading.';

  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    let shareUrl = '';
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + urlToShare)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            break;
        case 'copy':
            navigator.clipboard.writeText(urlToShare).then(() => {
                toast({
                    title: 'Link Copied!',
                    description: 'The app link has been copied to your clipboard.',
                });
            }).catch(err => {
                console.error('Failed to copy: ', err);
                toast({
                    title: 'Failed to copy',
                    description: 'Could not copy the link to your clipboard.',
                    variant: 'destructive',
                });
            });
            break;
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
      <Tabs defaultValue="friends">
        <div className="grid w-full grid-cols-4 items-center bg-transparent p-0 gap-1">
          <TabsList className="col-span-2 grid w-full grid-cols-2 bg-transparent p-0 gap-1">
              <TabsTrigger value="friends" className="rounded-md bg-red-300 text-red-800 data-[state=active]:bg-red-400 px-1 py-1 h-8 text-xs"><Users className="w-4 h-4 mr-1" />Friends</TabsTrigger>
              <TabsTrigger value="search" className="rounded-md bg-blue-500 text-white data-[state=active]:bg-blue-600 px-1 py-1 h-8 text-xs">Search</TabsTrigger>
          </TabsList>
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="rounded-md bg-green-500 hover:bg-green-600 text-white px-1 py-1 h-8 text-xs">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                        <FacebookIcon className="w-4 h-4 mr-2" />
                        <span>Facebook</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                        <TwitterIcon className="w-4 h-4 mr-2" />
                        <span>Twitter / X</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                        <WhatsAppIcon className="w-4 h-4 mr-2" />
                        <span>WhatsApp</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                        <Copy className="w-4 h-4 mr-2" />
                        <span>Copy Link</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
