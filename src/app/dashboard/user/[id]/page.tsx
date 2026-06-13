'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { mockUsers, mockPosts } from "@/lib/data";
import { MapPin, UserPlus, MessageCircle, Heart, Share2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();

  const user = mockUsers.find(u => u.id === userId);
  const posts = mockPosts.filter(p => p.author.id === userId);

  const handleFollow = () => {
    toast({ title: user?.isFollowing ? `Unfollowed ${user.name}` : `Following ${user?.name}`, duration: 2000 });
    // In a real app, you would update the state here
  };
  
  const handleLike = () => {
    toast({ title: "Liked post!", duration: 2000 });
  };

  const handleShare = () => {
    toast({ title: "Sharing options coming soon!", duration: 2000 });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
       <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-start gap-6">
          <Avatar className="w-24 h-24 border-4 border-card">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
              <Badge className="text-sm">Level: {user.level.toFixed(1)}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{user.institution}</p>
            <div className="flex items-center text-muted-foreground text-sm mt-2">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{user.location}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 self-start md:self-center">
            <Button onClick={handleFollow}>
              <UserPlus className="mr-2 h-4 w-4" />
              {user.isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
            {user.isMutual && (
              <Button variant="outline" asChild>
                  <Link href={`/dashboard/messages?chatWith=${user.id}`}>
                      <MessageCircle className="mr-2 h-4 w-4"/>
                      Chat
                  </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Posts by {user.name}</h2>
        <div className="space-y-4">
          {posts.length > 0 ? posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-3 p-3">
                 <Link href={`/dashboard/user/${post.author.id}`}>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="grid gap-0.5">
                  <div className="flex items-center gap-2">
                     <Link href={`/dashboard/user/${post.author.id}`} className="font-headline hover:underline text-sm">
                        {post.author.name}
                    </Link>
                    <Badge variant="secondary" className="text-xs">Level: {post.author.level.toFixed(1)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.createdAt}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2">
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                 {post.imageUrl && (
                  <div className="mt-3 relative aspect-video rounded-md overflow-hidden border">
                      <Image src={post.imageUrl} alt="Post image" fill className="object-cover" data-ai-hint="library books" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-1 pt-0">
                <div className="flex">
                  <Button variant="ghost" size="sm" onClick={handleLike}>
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.shares}</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )) : (
            <p className="text-muted-foreground text-center py-8">This user hasn't posted anything yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
