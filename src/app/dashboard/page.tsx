'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { mockPosts } from "@/lib/data";
import { MessageCircle, Heart, Share2, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/auth";

export default function HomePage() {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);

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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <Card id="post">
        <CardContent className="p-0">
          <div className="flex items-center gap-0">
            <div className="p-1">
                <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl} alt="User" />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="w-full">
              <form>
                <Textarea
                  className={cn(
                    "text-xs transition-all duration-200 ease-in-out p-1 border-0 focus-visible:ring-0 resize-none",
                     isPosting ? "min-h-[40px]" : "h-8"
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
                    <Video className="h-5 w-5 text-muted-foreground" />
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
          const profileUrl =
            post.author.id === currentUser.id
              ? "/dashboard/profile"
              : `/dashboard/user/${post.author.id}`;
          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-2 p-2">
                <Link href={profileUrl}>
                  <Avatar className="h-8 w-8">
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
                    <Badge variant="secondary" className="text-xs">Level: {post.author.level}</Badge>
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
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
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
