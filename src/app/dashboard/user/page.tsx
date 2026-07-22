'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, UserPlus, MapPin, MoreVertical, Ban, Flag, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, query, collection, orderBy, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = searchParams.get('id') as string;
  const firestore = useFirestore();

  // ১. ফায়ারবেস থেকে লাইভ ইউজারের ডেটা আনা
  const userRef = useMemo(() => (userId && firestore ? doc(firestore, 'users', userId) : null), [userId, firestore]);
  const [relationStatus, setRelationStatus] = useState<'none' | 'following' | 'follower' | 'friend'>('none');
  const [relationLoading, setRelationLoading] = useState(true);
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  // ২. ফায়ারবেস থেকে এই নির্দিষ্ট ইউজারের করা পোস্টগুলো আনা
  const postsQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'posts'),
      where('author.id', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  // ৩. সোশ্যাল সার্কেলের মেথড অনুযায়ী আপনার ফলো এবং বিপরীত ফলো রিয়েল-টাইমে ট্র্যাক করা
  useEffect(() => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    const targetUserId = userId || userData?.id;

    if (!firestore || !currentUser?.uid || !targetUserId) return;

    const followDocRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
    const reverseDocRef = doc(firestore, 'follows', `${targetUserId}_${currentUser.uid}`);

    let iFollow = false;
    let theyFollow = false;

    const updateRelationState = (mine: boolean, theirs: boolean) => {
      if (mine && theirs) {
        setRelationStatus('friend'); // মিউচুয়াল ফ্রেন্ড হলে 'Chat' বাটন
      } else if (mine && !theirs) {
        setRelationStatus('following'); // আপনি শুধু ফলো করলে 'Following' বাটন
      } else if (!mine && theirs) {
        setRelationStatus('follower'); // সে আপনাকে ফলো করলে 'Follow Back' বাটন
      } else {
        setRelationStatus('none'); // কোনো রিলেশন না থাকলে সাধারণ 'Follow' বাটন
      }
      setRelationLoading(false);
    };

    // আপনার দেওয়া ফলোর ট্র্যাকিং লিসেনার
    const unsubscribe1 = onSnapshot(followDocRef, (docSnap) => {
      iFollow = docSnap.exists() && docSnap.data()?.status === 'ACTIVE';
      updateRelationState(iFollow, theyFollow);
    });

    // বিপরীত ফলোর ট্র্যাকিং লিসেনার
    const unsubscribe2 = onSnapshot(reverseDocRef, (docSnap) => {
      theyFollow = docSnap.exists() && docSnap.data()?.status === 'ACTIVE';
      updateRelationState(iFollow, theyFollow);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [firestore, userId, userData?.id]);

  // ৪. ফলো করার সুনির্দিষ্ট অ্যাকশন হ্যান্ডলার
  const handleFollow = async () => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    const targetUserId = userId || userData?.id;

    if (!firestore || !currentUser?.uid || !targetUserId) return;

    try {
      const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
      await setDoc(followRef, {
        followerId: currentUser.uid,
        followingId: targetUserId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Success", description: "You are now following this bookworm! 📚" });
    } catch (error) {
      console.error("Error executing follow back: ", error);
    }
  };

  // ৫. আনফলো করার সুনির্দিষ্ট অ্যাকশন হ্যান্ডলার (ডকুমেন্ট ডিলিট স্কিমা)
  const handleUnfollowClick = async () => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    const targetUserId = userId || userData?.id;

    if (!firestore || !currentUser?.uid || !targetUserId) return;

    try {
      const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
      await deleteDoc(followRef);

      toast({ title: "Unfollowed", description: "Removed from your following list." });
    } catch (error) {
      console.error("Error during unfollow execution: ", error);
    }
  };
  const { data: userPosts, loading: postsLoading } = useCollection<any>(postsQuery);

  if (userLoading || relationLoading) {
    return <div className="p-10 text-center text-white bg-[#0f172a] min-h-screen">Loading profile...</div>;
  }

  if (!userData) {
    return (
      <div className="p-10 text-center text-white bg-[#0f172a] min-h-screen flex flex-col items-center justify-center">
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
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* বাম পাশের অংশ: নাম, ইউজারনেম, লেভেল ও বায়ো এক সাথে */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-purple-500 shadow-xl shrink-0">
              <AvatarImage src={userData?.avatarUrl || userData?.image} alt={userData?.name} />
              <AvatarFallback>{userData?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-bold text-white">
                {userData?.name || "Hasan Mahmud"}
              </h2>
              
              <p className="text-xs text-slate-400 font-mono">
                {userData?.username || `@${userData?.name?.toLowerCase().replace(/\s+/g, '')}`}
              </p>

              <div className="flex flex-col gap-1.5 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-purple-950 text-purple-300 border-purple-900 text-[10px] font-bold py-0.5">
                    Level: {parseFloat(userData?.level?.toString() || "0").toFixed(1)}
                  </Badge>
                  
                  {/* ইউজারের location ডেটা থাকলেই কেবল পুরো span ব্লকটি আইকনসহ ডমে রেন্ডার হবে */}
                  {userData?.location && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {userData.location}
                    </span>
                  )}

                </div>

                {userData?.institution && (
                  <p className="text-xs text-slate-400 bg-slate-900/50 border border-slate-800/65 rounded-md px-2 py-1 mt-0.5 w-fit">
                    🏢 {userData.institution}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400 pt-1 italic">
                {userData?.bio || "No bio available yet."}
              </p>
            </div>
          </div>

          {/* ডানপাশের অংশ: সব অ্যাকশন বাটন এক সারিতে */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {/* কন্ডিশন ১: Friends বাটন */}
            {relationStatus === 'friend' && (
              <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => router.push(`/dashboard/messages?chatWith=${userData?.id || userId}`)}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Chat
              </Button>
            )}

            {/* কন্ডিশন ২: Following বাটন */}
            {relationStatus === 'following' && (
              <Button size="sm" className="bg-slate-700 text-white cursor-default hover:bg-slate-700">
                Following
              </Button>
            )}

            {/* কন্ডিশন ৩: Follow Back বাটন */}
            {relationStatus === 'follower' && (
              <Button size="sm" onClick={handleFollow} className="bg-purple-600 hover:bg-purple-700 text-white">
                <UserPlus className="w-4 h-4 mr-1.5" /> Follow Back
              </Button>
            )}

            {/* কন্ডিশন ৪: সাধারণ Follow বাটন */}
            {relationStatus === 'none' && (
              <Button size="sm" onClick={handleFollow} className="bg-purple-600 hover:bg-purple-700 text-white">
                <UserPlus className="w-4 h-4 mr-1.5" /> Follow
              </Button>
            )}

            {/* ৩-ডট ড্রপডাউন মেনু */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0f172a] border-slate-800 text-slate-200 w-45">
                
                {/* ৩-ডট মেনুর আনফলো বাটন */}
                {(relationStatus === 'following' || relationStatus === 'friend') && (
                  <DropdownMenuItem
                    onClick={handleUnfollowClick}
                    className="hover:bg-slate-800 cursor-pointer flex items-center justify-between gap-2 text-xs text-orange-400 font-medium"
                  >
                    <span>Unfollow User</span>
                    <UserPlus className="w-3.5 h-3.5 rotate-180 text-orange-400" />
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Profile link copied!" });
                  }}
                  className="hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => alert("User reported successfully.")}
                  className="hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs text-yellow-500"
                >
                  <Flag className="w-3.5 h-3.5" /> Report User
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => alert("User blocked successfully.")}
                  className="hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs text-destructive font-semibold"
                >
                  <Ban className="w-3.5 h-3.5" /> Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </CardContent>
      </Card>

      {/* ইউজারের করা পোস্টের লিস্ট */}
      <div className="space-y-4 mt-6">
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
