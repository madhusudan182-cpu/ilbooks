'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, UserPlus, MapPin, MoreVertical, Ban, Flag, Copy, Loader2 } from "lucide-react";
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
  const [showFullAvatar, setShowFullAvatar] = useState(false);

  // ১. ফায়ারবেস থেকে লাইভ ইউজারের ডেটা আনা
  const userRef = useMemo(() => (userId && firestore ? doc(firestore, 'users', userId) : null), [userId, firestore]);
  const [relationStatus, setRelationStatus] = useState<'none' | 'following' | 'follower' | 'friend'>('none');
  const [relationLoading, setRelationLoading] = useState(true);
  
  
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  // --- ইনফিনিট স্ক্রোলের স্টেটসমূহ ---
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // ১. পেজের একদম উপরে ল্যান্ড করার লজিক
  useEffect(() => {
    window.scrollTo(0, 0);
    if (userId && firestore) {
      fetchInitialUserPosts();
    }
  }, [userId, firestore]);

  // ২. প্রথমবারে ১০টি পোস্ট লোড করার ফাংশন
  const fetchInitialUserPosts = async () => {
    if (!firestore || !userId) return;
    setPostsLoading(true);
    try {
      const firebaseFirestore = await import("firebase/firestore");
      const q = firebaseFirestore.query(
        firebaseFirestore.collection(firestore, 'posts'),
        firebaseFirestore.where('author.id', '==', userId),
        firebaseFirestore.orderBy('createdAt', 'desc'),
        firebaseFirestore.limit(10) // প্রোফাইলে প্রথমবারে ১০টি
      );
      const snapshot = await firebaseFirestore.getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setUserPosts(fetchedPosts);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  // ৩. স্ক্রোল করলে পরবর্তী ১০টি পোস্ট লোড হওয়ার লজিক
  const fetchMoreUserPosts = async () => {
    if (!firestore || !userId || loadingMore || !hasMore || !lastVisible) return;
    setLoadingMore(true);
    try {
      const firebaseFirestore = await import("firebase/firestore");
      const q = firebaseFirestore.query(
        firebaseFirestore.collection(firestore, 'posts'),
        firebaseFirestore.where('author.id', '==', userId),
        firebaseFirestore.orderBy('createdAt', 'desc'),
        firebaseFirestore.startAfter(lastVisible),
        firebaseFirestore.limit(10)
      );
      const snapshot = await firebaseFirestore.getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (fetchedPosts.length > 0) {
        setUserPosts(prev => [...prev, ...fetchedPosts]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more user posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ৪. অটোমেটিক স্ক্রোল ডিটেক্টর লিসেনার
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        fetchMoreUserPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);


    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastVisible, loadingMore, hasMore, firestore, userId]);

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
    <div className="max-w-md mx-auto min-h-screen bg-slate-110 text-slate-800 p-4 md:max-w-3xl md:bg-blue-50 md:text-slate-800 space-y-6">
      {/* ব্যাক বাটন */}
      <Button onClick={() => router.back()} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* প্রোফাইল কার্ড */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* বাম পাশের অংশ: নাম, ইউজারনেম, লেভেল ও বায়ো এক সাথে */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-purple-500 shadow-xl shrink-0 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowFullAvatar(true)}>
              <AvatarImage src={userData?.avatarUrl || userData?.image} alt={userData?.name}
              />

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
          <Card key={post.id} className="bg-slate-900 border-slate-800 mb-6 rounded-xl overflow-hidden text-left w-full">
            <div className="p-4 bg-slate-900 text-sm text-slate-300 border-b border-slate-800">
              {/* পুরানো <p> ট্যাগের জায়গায় এটি ব্যবহার করুন */}
              <LivePostContent text={post.content || post.text} />
              
              {post.imageUrl && (

                // এখানে ওন প্রোফাইলের মতো ফিক্সড max-h-[500px] এবং object-cover যুক্ত করা হলো
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 max-h-[500px] w-full bg-pink/95 flex items-center justify-center">
                  <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto object-cover max-h-[500px]" />
                </div>
              )}
            </div>
          </Card>
        ))



      ) : (
        <p className="text-sm text-slate-500 italic">No posts published by this user.</p>
      )}

      {/* === অটো-লোডিং স্পিনার (কন্ডিশনের বাইরে সঠিক রিঅ্যাক্ট ফ্র্যাগমেন্টে) === */}
      {loadingMore && (
        <div className="flex flex-col items-center py-4 gap-1">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
          <p className="text-xs text-slate-400">Loading more posts...</p>
        </div>
      )}
    </div>
  {showFullAvatar && (
  <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
    <div className="w-full max-w-md md:max-w-xl max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
      <img src={userData?.avatarUrl || userData?.image} alt={userData?.name} className="w-full h-auto object-contain max-h-[70vh]" />
    </div>
    <Button onClick={() => setShowFullAvatar(false)} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl flex items-center gap-2">
      <ArrowLeft className="w-4 h-4" /> Back
    </Button>
  </div>
)}
</div>
);
}

// ফাইলের একদম শেষে এই ফাংশনটি যুক্ত করুন
function LivePostContent({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const sentences = text.split(/(?<=\n)|(?<=\. )|(?<=। )|(?<=।)/);
  const isLongText = sentences.length > 3 || text.length > 150;

  if (!isLongText) {
    return (
      <p className="whitespace-pre-wrap font-normal leading-relaxed text-left text-slate-300">
        {text}
      </p>
    );
  }

  const truncatedText = text.length > 150 ? text.substring(0, 150) : sentences.slice(0, 3).join("");

  return (
    <div className="text-left space-y-2">
      <p className="whitespace-pre-wrap font-normal leading-relaxed text-slate-300">
        {isExpanded ? text : truncatedText}
        {!isExpanded && "..."}
      </p>
      <button 
        type="button" 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="text-sky-500 hover:text-sky-600 font-bold text-xs mt-1 transition-colors cursor-pointer block"
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}

