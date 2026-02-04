import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockPosts, mockUsers } from "@/lib/data";
import { MessageCircle, Heart, Share2, Users, Sword, BookMarked, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard/competition', title: 'Competition', icon: Sword, description: "Test your knowledge and level up." },
  { href: '/dashboard/book-shop', title: 'Book Shop', icon: BookMarked, description: "Buy books to aid your journey." },
  { href: '/dashboard/patron', title: 'Become a Patron', icon: Crown, description: "Support the community." },
  { href: '/dashboard/messages', title: 'Chat', icon: MessageCircle, description: "Connect with other readers." },
  { href: '/dashboard/social', title: 'Social Circle', icon: Users, description: "Find friends and follow readers." }
];

const NavCard = ({ href, title, icon: Icon, description }: NavItem) => (
    <Link href={href} className="block hover:scale-[1.02] transition-transform">
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                 <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                 </div>
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                </div>
            </CardHeader>
        </Card>
    </Link>
);


export default function HomePage() {
  const currentUser = mockUsers[0];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {navItems.map((item) => (
          <NavCard key={item.href} {...item} />
        ))}
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src="https://picsum.photos/seed/av1/100/100" alt="User" />
              <AvatarFallback>YOU</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form>
                <Input
                  className="h-12 text-base"
                  placeholder="What's on your mind, bookworm?"
                />
                <div className="flex justify-end mt-2">
                  <Button type="submit">Post</Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {mockPosts.map((post) => {
            const profileUrl = post.author.id === currentUser.id ? '/dashboard/profile' : `/dashboard/user/${post.author.id}`;
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Link href={profileUrl}>
                    <Avatar>
                      <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <Link href={profileUrl} className="font-semibold font-headline hover:underline">
                        {post.author.name}
                      </Link>
                      <Badge variant="secondary">Level {post.author.level}</Badge>
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
                        <Image src={post.imageUrl} alt="Post image" fill className="object-cover" data-ai-hint="library books" />
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
