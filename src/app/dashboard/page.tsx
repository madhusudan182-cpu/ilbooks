"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { mockPosts, mockUsers } from "@/lib/data";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const currentUser = mockUsers[0];
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleCancel = () => {
    setPostContent("");
    setIsPosting(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card id="post">
        <CardContent className={cn("p-1 pb-0", !isPosting && "p-1")}>
          <div className="flex items-start gap-1">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/av1/100/100" alt="User" />
              <AvatarFallback>YOU</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form>
                <Textarea
                  className={cn(
                    "text-base transition-all duration-200 ease-in-out py-1 px-2",
                     isPosting ? "min-h-[40px]" : "h-9"
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
          <CardFooter className="justify-end gap-2 pt-1 border-t">
            <Button className="bg-pink-500 text-white hover:bg-pink-600" onClick={handleCancel}>
              Cancel
            </Button>
            <Button>Post</Button>
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
              <CardHeader className="flex flex-row items-center gap-3 p-3">
                <Link href={profileUrl}>
                  <Avatar className="h-9 w-9">
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
                      className="font-headline hover:underline text-sm"
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
              <CardContent className="px-3 pt-0 pb-2">
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                {post.imageUrl && (
                  <div className="mt-3 relative aspect-[2/1] rounded-md overflow-hidden border">
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
              <CardFooter className="flex justify-between p-1 pt-0">
                <div className="flex">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.shares}</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
