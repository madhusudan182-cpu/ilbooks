'use client';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, UserPlus, MapPin, MoreVertical, Ban, Flag, Copy, Heart, Share2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, query, collection, orderBy, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { triggerSocialNotification } from "@/utils/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserClientProfile() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params?.id as string;
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

  // ৩. সোশ্যাল সার্কেলের মেথড অনুযায়ী আপনার ফলো এবং বিপরীত ফলো রিয়েল-টাইমে ট্র্যাক করা
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
      // ফলো করার নোটিফিকেশন ট্রিগার
      const notifType = relationStatus === 'follower' ? 'FOLLOW_BACK' : 'FOLLOW';
      await triggerSocialNotification(firestore, targetUserId, currentUser, notifType);

      toast({ title: "Success", description: "You are now following this bookworm!" });
    } catch (error) {
      console.error("Error executing follow back: ", error);
    }
  };
const [commentingOn, setCommentingOn] = useState<string | null>(null);
const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  // ৫. আনফলো করার সুনির্দিষ্ট অ্যাকশন হ্যান্ডলার (ডকুমেন্ট ডিলিট স্কিমা)
  const handleUnfollowClick = async () => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    const targetUserId = userId || userData?.id;

    if (!firestore || !currentUser?.uid || !targetUserId) return;

    try {
      const followRef = doc(firestore, 'follows', `${currentUser.uid}_${targetUserId}`);
      await deleteDoc(followRef);
      // আনফলো করলে আগের নোটিফিকেশন মুছে ফেলার ট্রিগার
      await triggerSocialNotification(firestore, targetUserId, currentUser, 'UNFOLLOW');

      toast({ title: "Unfollowed", description: "Removed from your following list." });
    } catch (error) {
      console.error("Error during unfollow execution: ", error);
    }
  };

  // ---- এখান থেকে কপি করুন ----
  const handleLike = async (postId: string) => {
    if (!firestore) return;
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const { doc, getDoc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp, collection, addDoc } = await import("firebase/firestore");
    
    const likeRef = doc(firestore, `posts/${postId}/likes`, userId);
    const postRef = doc(firestore, 'posts', postId);

    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });

        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          if (postData.author && postData.author.id !== userId) {
            await addDoc(collection(firestore, 'notifications'), {
              type: 'LIKE',
              postId: postId,
              senderId: userId,
              senderName: currentUser.displayName || 'Someone',
              targetUserId: postData.author.id,
              isSeen: false,
              createdAt: serverTimestamp()
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Like error: ", error);
    }
  };
// ---- এখানে কপি করা শেষ করুন ----

  const handleAddComment = async (postId: string) => {
  const currentComment = commentText[postId]?.trim();
  if (!currentComment || !firestore) return;

  const authInstance = getAuth();
  const currentUser = authInstance.currentUser;
  if (!currentUser) return;

  const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import("firebase/firestore");

  try {
    // কমেন্ট কালেকশনে ডাটা সেভ করা
    await addDoc(collection(firestore, `posts/${postId}/comments`), {
      content: currentComment,
      author: {
        id: currentUser.uid,
        name: currentUser.displayName || "User",
      },
      createdAt: serverTimestamp(),
    });

    // মেইন পোস্টে কমেন্ট কাউন্ট ১ বাড়ানো
    const postRef = doc(firestore, 'posts', postId);
    await updateDoc(postRef, { comments: increment(1) });

    // ইনপুট বক্স খালি করা
    setCommentText(prev => ({ ...prev, [postId]: "" }));
    setCommentingOn(null);
  } catch (error) {
    console.error("Comment error: ", error);
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto bg-slate-50 text-slate-800">
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
                  {/* ফায়ারস্টোরে location ডেটা থাকলেই কেবল আইকন এবং অ্যাড্রেস দেখাবে, অন্যথায় ব্ল্যাংক থাকবে */}
                  {userData?.location && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {userData.location}
                    </span>
                  )}
                </div>
                {userData?.institution && (
                  <p className="text-xs text-slate-400 bg-slate-900/50 border border-slate-800/65 rounded-md px-2 py-1 mt-0.5 w-fit">
                    {userData.institution}
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
            {/* কন্ডিশন ১: Friends বাটন (ক্লিক করলে লাইভ চ্যাটে নিয়ে যাবে) */}
            {relationStatus === 'friend' && (
              <Link
                href={`/dashboard/messages?chatWith=${userData?.id || userId}`}
                title="Chat"
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full transition-colors active:scale-95 inline-flex items-center justify-center border border-slate-700 text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Chat
              </Link>
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
      <div className="space-y-4 mt-6 text-left">
        <h3 className="text-lg font-bold text-purple-900 mb-4">Posts</h3>
        
        {postsLoading ? (
          <p className="text-sm text-slate-500">Loading posts...</p>
        ) : userPosts && userPosts.length > 0 ? (
          userPosts.map((post: any) => {
            // ডেট ফরম্যাট লজিক
            const postDate = post.createdAt?.seconds
              ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-GB')
              : 'Recent';

            return (
              <div
                key={post.id}
                className="border border-slate-200 rounded-xl bg-white shadow-sm mb-6 overflow-hidden text-left"
              >
                {/* ১ম বক্স: হেডার (ইউজারনেম এবং ডেট) */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800">
                    {userData?.name || 'User'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">[{postDate}]</span>
                </div>

                {/* ২য় বক্স: বডি (পোস্টের মূল লেখা) */}
                <div className="p-4 bg-white min-h-[60px]">
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {post.content}
                  </div>
                </div>

                          {/* ৩য় বক্স: অ্যাকশন বাটন (লাইক, কমেন্ট, শেয়ার) */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-6 text-slate-500">
            {/* লাইক বাটন */}
            <button
              onClick={() => handleLike(post.id)}
              className="flex items-center gap-1.5 hover:text-pink-500 transition-colors active:scale-95 text-xs font-medium"
            >
              <LiveHeartIcon postId={post.id} userId={getAuth().currentUser?.uid} firestore={firestore} />
              <LiveLikeCount postId={post.id} firestore={firestore} />
            </button>

            {/* কমেন্ট বাটন (ক্লিক করলে কমেন্ট বক্স খুলবে) */}
            <button 
              onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-xs font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <LiveCommentCount postId={post.id} firestore={firestore} />
            </button>

            {/* শেয়ার বাটন */}
            <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors text-xs font-medium ml-auto">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* ৪র্থ বক্স: লাইভ কমেন্ট ইনপুট এরিয়া (যা বাটনে ক্লিক করলে নিচে ওপেন হবে) */}
          {commentingOn === post.id && (
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddComment(post.id);
                }}
                className="flex flex-col gap-2 w-full"
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-600 shadow-sm text-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommentingOn(null)}
                    className="bg-amber-100/70 text-amber-800 hover:bg-amber-200 hover:text-amber-900 px-3 py-1 rounded-xl text-[11px] font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText[post.id]?.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] px-3 py-1 rounded-xl disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>
              </form>
            </div>
          )}

              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 italic">No posts published by this user.</p>
        )}
      </div>


    </div>
  );
}

// --- ফাইলের একদম শেষে আগের ৩টি ফাংশন মুছে এটি পেস্ট করুন ---

function LiveHeartIcon({ postId, userId, firestore }: { postId: string; userId: string | undefined; firestore: any }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!firestore || !userId || !postId) return;
    // ওপরের গ্লোবাল ইম্পোর্ট থেকে সরাসরি 'doc' এবং 'onSnapshot' ব্যবহার করা হচ্ছে
    const likeRef = doc(firestore, `posts/${postId}/likes`, userId);
    const unsubscribe = onSnapshot(likeRef, (docSnap: any) => {
      setIsLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [postId, userId, firestore]);

  return (
    <Heart
      className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
        isLiked ? "text-red-500 fill-red-500 scale-110" : "text-slate-500 hover:text-pink-500"
      }`}
    />
  );
}

function LiveLikeCount({ postId, firestore }: { postId: string; firestore: any }) {
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!firestore || !postId) return;
    const postRef = doc(firestore, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setLikes(docSnap.data().likes || 0);
      }
    });
    return () => unsubscribe();
  }, [postId, firestore]);

  return <span className="text-xs font-medium">{likes}</span>;
}

function LiveCommentCount({ postId, firestore }: { postId: string; firestore: any }) {
  const [comments, setComments] = useState(0);

  useEffect(() => {
    if (!firestore || !postId) return;
    const postRef = doc(firestore, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setComments(docSnap.data().comments || 0);
      }
    });
    return () => unsubscribe();
  }, [postId, firestore]);

  return <span className="text-xs font-medium">{comments}</span>;
}
