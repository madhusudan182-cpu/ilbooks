'use client';

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Heart, Share2, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { User } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export default function HomePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<User>(userRef);

  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, loading: postsLoading } = useCollection<any>(postsQuery);

  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user || !firestore || !profile) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'posts'), {
        content: postContent,
        author: {
          id: user.uid,
          name: profile.name || 'Anonymous',
          avatarUrl: profile.avatarUrl || `https://picsum.photos/seed/${user.uid}/100/100`,
          level: profile.level ?? 0.0
        },
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        // Adding a placeholder image if needed for variety in prototype
        imageUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/${Date.now()}/800/400` : null
      });
      setPostContent("");
      setIsPosting(false);
      toast({ title: "Post published!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to post", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = () => {
    toast({ title: "Liked post!", duration: 2000 });
  };

  const handleShare = () => {
    toast({ title: "Sharing options coming soon!", duration: 2000 });
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const userName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-3xl mx-auto">
      <Card id="post">
        <CardContent className="p-2 pt-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form onSubmit={handleCreatePost}>
                <Textarea
                  rows={1}
                  className={cn(
                    "text-sm transition-all duration-200 ease-in-out p-1 border-0 focus-visible:ring-0 resize-none h-auto min-h-0",
                    isPosting ? "min-h-[60px] border rounded-md p-2 mt-1" : ""
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
          <CardFooter className="flex items-center justify-between p-2 border-t">
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
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
                </Button>
                <Button 
                    size="sm" 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={handleCreatePost}
                    disabled={isSubmitting || !postContent.trim()}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <div className="space-y-4">
        {postsLoading ? (
            <div className="flex flex-col items-center py-10 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading posts...</p>
            </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post: any) => {
            const isMe = user && post.author.id === user.uid;
            const authorName = post.author.name;
            const authorAvatar = post.author.avatarUrl;
            const authorLevel = post.author.level ?? 0.0;
            const profileUrl = isMe ? "/dashboard/profile" : `/dashboard/user/${post.author.id}`;
            const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now';
            
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-3 p-3">
                  <Link href={profileUrl}>
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={authorAvatar}
                        alt={authorName}
                      />
                      <AvatarFallback>
                        {authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="grid gap-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={profileUrl}
                        className="font-headline font-semibold hover:underline text-base"
                      >
                        {authorName}
                      </Link>
                      <Badge variant="secondary" className="text-xs">Level: {authorLevel.toFixed(1)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pt-0 pb-2">
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
                <CardFooter className="flex justify-between p-1 border-t bg-muted/5">
                  <div className="flex">
                    <Button variant="ghost" size="sm" onClick={handleLike}>
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="text-xs">{post.likes || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">{post.comments || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="text-xs">{post.shares || 0}</span>
                    </Button>
                  </div>
                </CardFooter>
                {commentingOn === post.id && (
                  <div className="p-3 border-t bg-muted/30">
                    <Textarea placeholder="Write your comment..." className="mb-2 text-sm bg-background" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCommentingOn(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => setCommentingOn(null)}>Comment</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
            <div className="text-center py-20 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p>No posts yet. Be the first to share something!</p>
            </div>
        )}
      </div>
    </div>
  );
}