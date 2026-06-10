'use client';

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { mockPosts } from "@/lib/data";
import { MessageCircle, Heart, Share2, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";

export default function HomePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<User>(userRef);

  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCancel = () => {
    setPostContent("");
    setIsPosting(false);
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleLike = () => {
    toast({ title: "Liked post!", duration: 2000 });
  };

  const handleShare = () => {
    toast({ title: "Sharing options coming soon!", duration: 2000 });
  };

  if (authLoading || profileLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <Card id="post">
        <CardContent className="p-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatarUrl} alt="User" />
              <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form>
                <Textarea
                  rows={1}
                  className={cn(
                    "text-sm transition-all duration-200 ease-in-out p-1 border-0 focus-visible:ring-0 resize-none h-auto min-h-0",
                    isPosting ? "min-h-[36px]" : ""
                  )}
                  placeholder="What's on your mind, bookworm?"
                  onFocus={() => setIsPosting(true)}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </form>
            </div>
          </div>
        </CardContent>
        {isPosting && (
          <CardFooter className="flex items-center justify-between p-1 border-t">
            <div className="flex">
                <input type="file" ref={imageInputRef} accept="image/*" className="hidden" />
                <input type="file" ref={videoInputRef} accept="video/*" className="hidden" />
                <Button variant="ghost" size="icon" onClick={handleImageClick}>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Add image</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleVideoClick}>
                    <Film className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Add video</span>
                </Button>
            </div>
            <div className="flex items-center gap-1">
                <Button size="sm" className="h-7 bg-pink-500 text-white hover:bg-pink-600" onClick={handleCancel}>
                Cancel
                </Button>
                <Button size="sm" className="h-7">Post</Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <div className="space-y-4">
        {mockPosts.map((post) => {
          const isMe = user && post.author.id === user.uid;
          const profileUrl = isMe ? "/dashboard/profile" : `/dashboard/user/${post.author.id}`;
          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-2 p-2">
                <Link href={profileUrl}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                    />
                    <AvatarFallback>
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="grid gap-0.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={profileUrl}
                      className="font-headline hover:underline text-base"
                    >
                      {post.author.name}
                    </Link>
                    <Badge variant="secondary" className="text-xs">Level: {post.author.level.toFixed(1)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.createdAt}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-0 pb-1">
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                {post.imageUrl && (
                  <div className="mt-2 relative aspect-[16/9] rounded-md overflow-hidden border">
                    <Image
                      src={post.imageUrl}
                      alt="Post image"
                      fill
                      className="object-cover"
                      data-ai-hint="library books"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-0">
                <div className="flex">
                  <Button variant="ghost" size="sm" onClick={handleLike}>
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.shares}</span>
                  </Button>
                </div>
              </CardFooter>
              {commentingOn === post.id && (
                <div className="p-2 border-t bg-muted/50">
                  <Textarea placeholder="Write your comment..." className="mb-2 text-sm" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCommentingOn(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => setCommentingOn(null)}>Comment</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
