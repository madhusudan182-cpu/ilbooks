'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/lib/types";
import { MessageCircle, UserPlus, ArrowLeft, Search, Users, Share2, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const UserCard = ({ user, currentUserId }: { user: User, currentUserId: string }) => {
  const isCurrentUser = user.id === currentUserId;
  const profileUrl = isCurrentUser ? '/dashboard/profile' : `/dashboard/user/${user.id}`;
  
  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-2 flex items-center gap-3">
        <Link href={profileUrl}>
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-grow min-w-0">
          <Link href={profileUrl} className="hover:underline">
            <p className="font-semibold font-headline text-sm truncate">{user.name}</p>
          </Link>
          <p className="text-xs text-muted-foreground">Level: {user.level?.toFixed(1) || '0.0'}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isCurrentUser && (
            <>
                <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={`/dashboard/messages?chatWith=${user.id}`}>
                    <MessageCircle className="h-4 w-4 mr-1"/>
                    Chat
                </Link>
                </Button>
                <Button variant="secondary" size="sm" className="h-8">
                    <UserPlus className="mr-1 h-3 w-3"/> Follow
                </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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

export default function SocialPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [view, setView] = useState<'tabs' | 'invite'>('tabs');
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: allUsers, loading: usersLoading } = useCollection<User>(usersQuery);

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

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  if (!isClient) return null;

  if (view === 'invite') {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-headline">Invite Friends</h1>
          <Button variant="ghost" onClick={() => setView('tabs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search for a friend to invite..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <Card>
          <CardContent className="p-2 space-y-2">
             <div className="p-4 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p>Connect with your Facebook friends to see them here.</p>
                <Button className="mt-4 bg-[#1877F2] hover:bg-[#166fe5] text-white">
                   <FacebookIcon className="h-4 w-4 mr-2" /> Connect Facebook
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold font-headline text-center mb-6">Social Circle</h1>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search users by name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-none">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share App
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            <Button onClick={() => setView('invite')} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                <FacebookIcon className="w-4 h-4 mr-2" />
                Invite
            </Button>
          </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">Discover Readers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-0">
            {usersLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid gap-2">
                    {filteredUsers.map(u => (
                        <UserCard key={u.id} user={u} currentUserId={authUser?.uid || ''} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-20">No users found matching your search.</p>
            )}
        </TabsContent>
        <TabsContent value="following" className="mt-0">
             <p className="text-center text-muted-foreground py-20">You haven't followed any readers yet.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}