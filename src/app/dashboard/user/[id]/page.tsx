'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, UserPlus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, query, collection, orderBy, where } from "firebase/firestore";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const userId = params?.id as string;
  const firestore = useFirestore();

  // ১. ফায়ারবেস থেকে লাইভ ইউজারের ডেটা আনা
  const userRef = useMemo(() => (userId && firestore ? doc(firestore, 'users', userId) : null), [userId, firestore]);
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  // ২. ফায়ারবেস থেকে এই নির্দিষ্ট ইউজারের করা পোস্টগুলো আনা
  const postsQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'posts'), 
      where('author.id', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: userPosts, loading: postsLoading } = useCollection<any>(postsQuery);

  if (userLoading) {
    return <div className="p-10 text-center text-white">Loading profile...</div>;
  }

  if (!userData) {
    return (
      <div className="p-10 text-center text-white">
        <p className="mb-4">User not found in Database.</p>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto text-white">
      {/* ব্যাক বাটন */}
      <Button onClick={() => router.back()} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* প্রোফাইল কার্ড */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <Avatar className="h-24 w-24 border-2 border-purple-500 shadow-xl">
              <AvatarImage src={userData.avatarUrl || userData.image} alt={userData.name} />
              <AvatarFallback>{userData.name ? userData.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-3 flex-1 min-w-0 w-full">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <h2 className="text-2xl font-bold truncate text-slate-100">{userData.name || "Unknown User"}</h2>
                  <div className="flex gap-2 justify-center mt-2 sm:mt-0">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Follow
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      <MessageCircle className="w-4 h-4 mr-1.5" /> Chat
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">@{userId.substring(0, 8)}...</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-slate-400">
                <Badge variant="secondary" className="bg-purple-950 text-purple-300 border-purple-900">
                  Level: {Number(userData.level || 0).toFixed(1)}
                </Badge>
                {userData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> {userData.location}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 max-w-xl">
                {userData.bio || "No bio available yet."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ইউজারের করা পোস্টের লিস্ট */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200">Posts</h3>
        {postsLoading ? (
          <p className="text-sm text-slate-500">Loading posts...</p>
        ) : userPosts && userPosts.length > 0 ? (
          userPosts.map((post: any) => (
            <Card key={post.id} className="bg-slate-900 border-slate-800 p-4">
              <p className="text-sm text-slate-300">{post.content}</p>
            </Card>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No posts published by this user.</p>
        )}
      </div>
    </div>
  );
}
