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
        <CardContent className={cn("p-4", !isPosting && "pb-4")}>
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src="https://picsum.photos/seed/av1/100/100" alt="User" />
              <AvatarFallback>YOU</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form>
                <Textarea
                  className="text-base min-h-[3rem]"
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
          <CardFooter className="justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button>Post</Button>
          </CardFooter>
        )}
      </Card>

      <div className="space-y-6">
        {mockPosts.map((post) => {
          const profileUrl =
            post.author.id === currentUser.id
              ? "/dashboard/profile"
              : `/dashboard/user/${post.author.id}`;
          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Link href={profileUrl}>
                  <Avatar>
                    <AvatarImage
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                    />
                    <AvatarFallback>
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={profileUrl}
                      className="font-semibold font-headline hover:underline"
                    >
                      {post.author.name}
                    </Link>
                    <Badge variant="secondary">Level: {post.author.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {post.createdAt}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-2">
                <p className="whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
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
              <CardFooter className="flex justify-between p-2 md:p-4">
                <div className="flex gap-1 md:gap-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="mr-2 h-4 w-4" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    {post.shares}
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
