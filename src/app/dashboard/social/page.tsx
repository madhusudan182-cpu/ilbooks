import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/data";
import type { User } from "@/lib/types";
import { MessageCircle, UserCheck, UserPlus, Users } from "lucide-react";
import Link from "next/link";

const currentUser = mockUsers[0];

const UserCard = ({ user }: { user: User }) => {
  const isCurrentUser = user.id === currentUser.id;
  const profileUrl = isCurrentUser ? '/dashboard/profile' : `/dashboard/user/${user.id}`;
  
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Link href={profileUrl}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-grow">
          <Link href={profileUrl} className="hover:underline">
            <p className="font-semibold font-headline">{user.name}</p>
          </Link>
          <p className="text-sm text-muted-foreground">Level: {user.level}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentUser && (
            <>
              {user.isMutual ? (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/messages?chatWith=${user.id}`}>
                      <MessageCircle className="h-5 w-5"/>
                    </Link>
                  </Button>
                  <Button variant="secondary">Unfollow</Button>
                </>
              ) : user.isFollowing ? (
                <Button variant="secondary">Unfollow</Button>
              ) : (
                <Button>
                  <UserPlus className="mr-2 h-4 w-4"/> Follow
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
  <div className="space-y-4">
    {users.map(user => <UserCard key={user.id} user={user} />)}
  </div>
);

export default function SocialPage() {
  const following = mockUsers.filter(u => u.isFollowing);
  const followers = [...mockUsers.filter(u => u.isMutual), mockUsers[2]];
  const mutual = mockUsers.filter(u => u.isMutual);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-bold font-headline mb-6">Social Circle</h1>
      <Tabs defaultValue="find">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="find">Find People</TabsTrigger>
          <TabsTrigger value="following"><UserCheck className="w-4 h-4 mr-2" />Following</TabsTrigger>
          <TabsTrigger value="followers"><UserPlus className="w-4 h-4 mr-2" />Followers</TabsTrigger>
          <TabsTrigger value="mutual"><Users className="w-4 h-4 mr-2" />Mutual</TabsTrigger>
        </TabsList>
        <TabsContent value="find" className="mt-6">
          <UserList users={mockUsers} />
        </TabsContent>
        <TabsContent value="following" className="mt-6">
          <UserList users={following} />
        </TabsContent>
        <TabsContent value="followers" className="mt-6">
          <UserList users={followers} />
        </TabsContent>
        <TabsContent value="mutual" className="mt-6">
           <UserList users={mutual} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
