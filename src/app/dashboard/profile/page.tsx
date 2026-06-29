'use client';

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Camera, Loader2, Lock, Unlock, Heart, MessageCircle, Share2 } from "lucide-react";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp, addDoc, collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // 🎯 ফায়ারবেস অথেনটিকেশন মডিউল ইমপোর্ট করলাম
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Link from 'next/link';


interface PostData {
  id: string;
  userId: string;
  authorName: string;
  authorLevel: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = getFirestore();
  const auth = getAuth(); // 🎯 ফায়ারবেস অথেনটিকেশন ইনিশিয়েলাইজ করলাম

  // 👤 ইউজার এবং প্রোফাইল স্টেটসমূহ
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
    const handleLike = async (postId: string) => {
    if (!auth?.currentUser || !firestore) return;
    const userId = auth.currentUser.uid;
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

        // নোটিফিকেশন পাঠানোর লজিক
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          if (postData.author && postData.author.id !== userId) {
            await addDoc(collection(firestore, 'notifications'), {
              type: 'LIKE',
              postId: postId,
              senderId: userId,
              senderName: profile?.name || 'Someone',
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

  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [myPosts, setMyPosts] = useState<PostData[]>([]);
  const [relationship, setRelationship] = useState<'friend' | 'follower' | 'following' | 'none'>('none');
  const [liveLevel, setLiveLevel] = useState('0.1');

  const [counts, setCounts] = useState({
    friends: 0,
    following: 0,
    followers: 0,
    blocked: 0
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
 const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentUser || !firestore) return;

  // ছবির সাইজ ২ মেগাবাইটের বেশি হলে সতর্ক করা (ফায়ারস্টোর টেক্সট সাইজ লিমিটের জন্য)
  if (file.size > 5 * 1024 * 1024) {
    alert("ছবিটি অনেক বড়! দয়া করে 5 এমবি (5MB) এর চেয়ে ছোট ছবি সিলেক্ট করুন।");
    return;
  }

  // ১. সাথে সাথে স্ক্রিনে ছবি পরিবর্তনের প্রিভিউ দেখানোর জন্য
  const previewUrl = URL.createObjectURL(file);
  setProfile((prev: any) => prev ? { ...prev, avatarUrl: previewUrl } : null);

  try {
    // ২. ছবিটিকে টেক্সট বা Base64-এ রূপান্তর করার ম্যাজিক লজিক
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      // ৩. সরাসরি ফায়ারস্টোর ডাটাবেজে ইউজারের ডকুমেন্ট আপডেট করা (কোনো স্টোরেজ বাকেটের প্রয়োজন নেই!)
      const { doc, updateDoc } = await import("firebase/firestore");
      const userRef = doc(firestore, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        avatarUrl: base64String
      });

      console.log("প্রোফাইল পিকচার ফায়ারস্টোরে স্থায়ীভাবে সেভ হয়েছে!");
      alert("প্রোফাইল পিকচার সফলভাবে পরিবর্তন হয়েছে!");
    };
  } catch (error) {
    console.error("Firestore Update Error:", error);
    alert("ছবি সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
  }
};

useEffect(() => {
  const targetId = profile?.id || profile?.uid || currentUser?.uid; 

  if (!firestore || !targetId) return;

  const userDocRef = doc(firestore, 'users', targetId);

  const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // ✅ 'setLiveLevel' (Capital L) ব্যবহার করে এররটি সমাধান করা হলো
      if (data.level !== undefined && data.level !== null) {
        setLiveLevel(data.level.toString()); 
      } else {
        setLiveLevel('0.1'); 
      }
    }
  }, (error) => {
    console.error("Error syncing profile level: ", error);
  });

  return () => unsubscribe();
}, [firestore, profile, currentUser?.uid]);


  // 🔐 ১. আলাদাভাবে কারেন্ট লগইন থাকা ইউজার ট্র্যাক করার সিকিউর লজিক
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setProfileLoading(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, [auth]);

  // 🔄 ২. রিয়েল-টাইমে ডাটাবেস থেকে প্রোফাইল, পোস্ট ও কাউন্টার সিঙ্ক করা
  useEffect(() => {
    if (!firestore || !currentUser) return;

    // ক) নিজের ইউজার প্রোফাইল ডেটা লোড
    const userRef = doc(firestore, 'users', currentUser.uid);
    const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setIsProfileLocked(data.isLocked || false);
      }
      setProfileLoading(false);
    });

        // // খ) সম্পূর্ণ পোস্ট কালেকশন লোড
    const profilePostsQuery = query(
      collection(firestore, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(profilePostsQuery, (snapshot) => {
      const postsList: PostData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // ডাটাবেস অবজেক্ট স্কিমা অনুযায়ী নিখুঁত এক্সট্রাকশন
        const authorObj = data.author && typeof data.author === 'object' ? data.author : null;
        const postAuthorId = authorObj?.id || data.userId || data.uid || 'unknown';
        const postAuthorName = authorObj?.name || data.authorName || 'Admin Support';

        postsList.push({
          id: doc.id,
          userId: postAuthorId,
          authorName: postAuthorName,
          authorLevel: data.level !== undefined ? String(data.level) : '0.1',
          authorAvatar: authorObj?.avatarUrl || data.avatarUrl,
          content: data.content || '',
          imageUrl: data.imageUrl || null,
          createdAt: data.createdAt,
          likesCount: data.likes || 0,
          commentsCount: data.comments || 0,
          sharesCount: data.shares || 0
        });
      });
      setMyPosts(postsList);
    }, (error) => {
      console.error("Firebase posts read error:", error);
    });

    // গ) সোশ্যাল রিলেশনশিপ কাউন্টিং লজিক
    const followsQuery = query(collection(firestore, 'follows'));
    const unsubscribeFollows = onSnapshot(followsQuery, (snapshot) => {
      const myFollowings = new Set<string>();
      const myFollowers = new Set<string>();
      let blockedCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'BLOCKED') {
          if (data.followerId === currentUser.uid || data.followingId === currentUser.uid) {
            blockedCount++;
          }
        } else if (data.status === 'ACTIVE') {
          if (data.followerId === currentUser.uid) myFollowings.add(data.followingId);
          if (data.followingId === currentUser.uid) myFollowers.add(data.followerId);
        }
      });

      let friendsCount = 0;
      let followingCount = 0;
      let followersCount = 0;

      myFollowings.forEach(id => {
        if (myFollowers.has(id)) friendsCount++;
        else followingCount++;
      });

      myFollowers.forEach(id => {
        if (!myFollowings.has(id)) followersCount++;
      });

          // পেমেন্ট ও রিলেশনশিপ সিক্রেট রুল চেক
    const targetId = currentUser?.uid || "";
    const isCurrentFriend = myFollowings.has(targetId) && myFollowers.has(targetId);
    const isCurrentFollower = myFollowers.has(targetId) && !myFollowings.has(targetId);
    const isCurrentFollowing = myFollowings.has(targetId) && !myFollowers.has(targetId);

    if (isCurrentFriend) setRelationship('friend');
    else if (isCurrentFollower) setRelationship('follower');
    else if (isCurrentFollowing) setRelationship('following');
    else setRelationship('none');


      setCounts({
        friends: friendsCount,
        following: followingCount,
        followers: followersCount,
        blocked: blockedCount
      });
    });

    return () => {
      unsubscribeDoc();
      unsubscribePosts();
      unsubscribeFollows();
    };
  }, [firestore, currentUser]);

    // নোটিফিকেশন থেকে ক্লিক করে আসলে নির্দিষ্ট পোস্টে অটোমেটিক স্ক্রোল করার লজিক
  useEffect(() => {
    if (!profileLoading && myPosts.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [profileLoading, myPosts]);


    const isOwnProfile = (auth?.currentUser?.uid === currentUser?.uid) || !currentUser?.uid;
    const showFullProfile = isOwnProfile || relationship === 'friend' || !isProfileLocked;


    // 🔐 কারেন্ট ইউজারের আইডি বনাম ডাটাবেস থেকে আসা অবজেক্ট আইডি ম্যাচিং ফিল্টার
    const displayMyPosts = myPosts.filter(post => {
    // 🔒 সিক্রেট রুল: নিজের প্রোফাইল বা ফ্রেন্ড না হলে এবং প্রোফাইল লকড থাকলে কোনো পোস্ট ফিল্টারে আসবে না
    if (!showFullProfile) return false;

    const currentId = currentUser?.uid || auth?.currentUser?.uid;


    const isIdMatch = post.userId && String(post.userId).trim() === String(currentId).trim();
    const currentProfileName = String(profile?.name || 'Admin Support').toLowerCase().trim();
    const isNameMatch = post.authorName && String(post.authorName).toLowerCase().trim() === currentProfileName;

    return isIdMatch || isNameMatch;
  });

      // 🛠️ ভিজ্যুয়াল ডিবাগার টেক্সট জেনারেটর
  const debugInfo = myPosts.length > 0 ? {
    totalInDb: myPosts.length,
    currentUserId: currentUser?.uid || auth.currentUser?.uid,
    currentProfileName: profile?.name || 'Admin Support',
    firstPostUserId: myPosts[0].userId,
    firstPostAuthor: myPosts[0].authorName
  } : null;


  const toggleProfileLock = async () => {
    if (!firestore || !currentUser) return;
    try {
      const nextState = !isProfileLocked;
      setIsProfileLocked(nextState);
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, { isLocked: nextState });
      toast({
        title: nextState ? "Profile Locked! 🔒" : "Profile Unlocked! 🔓",
        description: nextState ? "Only friends can see your feeds." : "Everyone can see your profile and feeds.",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update security setting.", variant: "destructive" });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-20 font-sans">
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar className="w-24 h-24 border-4 border-purple-100 shadow-sm">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="text-xl font-bold bg-purple-50 text-purple-700">
                  {profile?.name ? profile.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md" onClick={() => avatarInputRef.current?.click()}>
                <Camera className="w-4 h-4 text-slate-600" />
              </Button>
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-800">{profile?.name || "Admin Support"}</h2>
            <Badge className="bg-purple-600 hover:bg-purple-700 my-1 text-xs font-semibold">Level: {parseFloat(liveLevel || '0').toFixed(1)}</Badge>
            
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-purple-500" />
              <span>{profile?.thana ? `${profile.thana}, ` : ""}{profile?.district || "Bangladesh"}</span>
            </div>

            <div className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  {isProfileLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                  Profile Status
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isProfileLocked ? "Only friends can view your feed" : "Everyone can view your feed"}
                </p>
              </div>
              <Button 
                onClick={toggleProfileLock}
                size="sm" 
                variant={isProfileLocked ? "destructive" : "outline"}
                className="text-xs font-bold px-3 py-1.5 h-auto rounded-lg transition-all"
              >
                {isProfileLocked ? "Unlock Profile" : "Lock Profile"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

              {/* 🛠️ ডায়নামিক বাটন সেকশন (কন্ডিশন অনুযায়ী বাটন পরিবর্তন) */}
        <div className="flex items-center gap-2 pt-2 justify-center w-full">
          {isOwnProfile ? (
  <div className="w-full space-y-4 mb-4">
    {/* হারিয়ে যাওয়া সোশ্যাল বার - শুধুমাত্র নিজের প্রোফাইলে দৃশ্যমান */}
    <div className="w-full bg-background border rounded-lg p-2 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs md:text-sm font-medium text-muted-foreground">
          <Link href="/dashboard/social?tab=friends" className="hover:text-primary hover:bg-muted py-1.5 rounded-md transition-all">
            Friends
          </Link>
          <Link href="/dashboard/social?tab=following" className="hover:text-primary hover:bg-muted py-1.5 rounded-md transition-all">
            Following
          </Link>
          <Link href="/dashboard/social?tab=followers" className="hover:text-primary hover:bg-muted py-1.5 rounded-md transition-all">
            Followers
          </Link>
          <Link href="/dashboard/profile/blocked" className="hover:text-primary hover:bg-muted py-1.5 rounded-md transition-all">
            Blocked
          </Link>
        </div>
    </div>

    {/* আপনার আসল এডিট প্রোফাইল বাটন */}
    <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/profile/edit')}>
      Edit Profile
    </Button>
  </div>
) : (

            <div className="flex items-center gap-2 w-full justify-center">
              {/* কন্ডিশন ১: ফ্রেন্ড হলে (Friend Button + Message) */}
              {relationship === 'friend' && (
                <>
                  <Button variant="outline" className="flex items-center gap-1">Friend</Button>
                  <Button variant="secondary" className="p-2">💬</Button>
                </>
              )}

              {/* কন্ডিশন ২ ও ৩: ইউজার২ যদি আপনার ফলোয়ার হয় (Follow Back Button) */}
              {relationship === 'follower' && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl">
                  Follow Back
                </Button>
              )}

              {/* কন্ডিশন ৪ ও ৫: আপনি অলরেডি ইউজার২ কে ফলো করে থাকলে (Following Button) */}
              {relationship === 'following' && (
                <Button variant="secondary" className="bg-sky-500 text-white hover:bg-sky-600 px-6 py-2 rounded-xl">
                  Following
                </Button>
              )}

              {/* জেনারেল ফলো বাটন (যদি কোনো রিলেশন না থাকে) */}
              {relationship === 'none' && (
                <Button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl">
                  Follow
                </Button>
              )}
            </div>
          )}
        </div>


      {/* 📰 ডাইনামিক নিউজ ফিড বা পোস্ট সেকশন */}
            {/* 📜 নিউজ ফিড এবং পোস্ট সেকশন */}
      <div className="space-y-4 w-full mt-4">
        <h2 className="text-xl font-bold text-purple-900 mb-4">
          {isOwnProfile ? `Your Posts (${displayMyPosts.length})` : 'Posts'}
        </h2>

        {showFullProfile ? (
          // যদি নিজের প্রোফাইল বা ফ্রেন্ড হয়—তবেই পোস্ট রেন্ডার হবে
          displayMyPosts.length > 0 ? (
                      displayMyPosts.map((post: any) => {
            const postDate = post.createdAt?.seconds 
              ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-GB')
              : 'Recent';

            return (
              <div 
                key={post.id} 
                id={`post-${post.id}`} 
                className="border border-slate-200 rounded-xl bg-white shadow-sm mb-6 target:ring-2 target:ring-pink-500 target:ring-offset-2 scroll-mt-20 transition-all duration-300 overflow-hidden text-left"
              >
                {/* ১ম বক্স: হেডার (ইউজারনেম এবং ডেট) */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800">{post.authorName || 'Admin Support'}</span>
                  <span className="text-xs text-slate-400 font-medium">[{postDate}]</span>
                </div>

                {/* ২য় বক্স: বডি (পোস্টের মূল লেখা) */}
                <div className="p-4 bg-white min-h-[60px]">
                <div className="text-sm text-slate-700 leading-relaxed">
                  <LivePostContent text={post.content || post.text} />
                </div>
              </div>

                {/* ৩য় বক্স: অ্যাকশন বাটন (লাইক, কমেন্ট, শেয়ার) */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-6 text-slate-500">
                  {/* লাইক বাটন */}
                  <button 
                    onClick={() => handleLike(post.id)} 
                    className="flex items-center gap-1.5 hover:text-pink-500 transition-colors active:scale-95 text-xs font-medium"
                  >
                    <LiveHeartIcon postId={post.id} userId={auth?.currentUser?.uid} firestore={firestore} />
                    <LiveLikeCount postId={post.id} firestore={firestore} />

                  </button>

                  {/* কমেন্ট বাটন */}
                  <button 
                    className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-xs font-medium"
                  >
                    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 4.75 4.75 0 0 0 3.326-1.423c.365-.113.753-.08 1.12.074A9.016 9.016 0 0 0 12 20.25Z" />
                    </svg>
                    <LiveCommentCount postId={post.id} firestore={firestore} />
                  </button>

                  {/* শেয়ার বাটন */}
                  <button 
                    className="flex items-center gap-1.5 hover:text-green-500 transition-colors text-xs font-medium ml-auto"
                  >
                    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            );
          })

          ) : (
            <p className="text-muted-foreground text-center py-4">You haven't posted anything yet.</p>
          )
        ) : (
          // 🔒 কন্ডিশন ৩ ও ৫: প্রোফাইল লকড থাকলে এই নোটিফিকেশন স্ক্রিনটি দেখাবে
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl shadow-inner my-4">
            <div className="text-4xl mb-2">🔒</div>
            <h4 className="font-bold text-lg text-slate-800">This profile is locked!</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              ইউজারের নিউজ ফিড দেখতে তাকে ফলো করুন অথবা ফ্রেন্ড রিলেশনশিপ তৈরি করুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// ফায়ারবেস থেকে কারেন্ট ইউজার এই পোস্টে লাইক দিয়েছে কি না তা রিয়েল-টাইম ট্র্যাক করার কম্পোনেন্ট
function LiveHeartIcon({ postId, userId, firestore }: { postId: string; userId: string | undefined; firestore: any }) {
  const [isLiked, setIsLiked] = React.useState(false);

  React.useEffect(() => {
    if (!firestore || !userId || !postId) return;

    const likeRef = doc(firestore, `posts/${postId}/likes`, userId);
    const unsubscribe = onSnapshot(likeRef, (docSnap) => {
      setIsLiked(docSnap.exists());
    });

    return () => unsubscribe();
  }, [postId, userId, firestore]);

  return (
    <Heart 
      className={cn(
        "h-4 w-4 shrink-0 transition-colors duration-200", 
        isLiked ? "text-red-500 fill-red-500 scale-110" : "text-slate-500 hover:text-pink-500"
      )} 
    />
  );
}
// ফায়ারস্টোর থেকে লাইকের সংখ্যা রিয়েল-টাইমে ট্র্যাক করার কাউন্টার কম্পোনেন্ট
function LiveLikeCount({ postId, firestore }: { postId: string; firestore: any }) {
  const [likes, setLikes] = React.useState(0);

  React.useEffect(() => {
    if (!firestore || !postId) return;
    const postRef = doc(firestore, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setLikes(docSnap.data().likes || 0);
      }
    });
    return () => unsubscribe();
  }, [postId, firestore]);

  return <span className="text-xs font-medium">{likes}</span>;
}

// ফায়ারস্টোর থেকে কমেন্টের সংখ্যা রিয়েল-টাইমে ট্র্যাক করার কাউন্টার কম্পোনেন্ট
function LiveCommentCount({ postId, firestore }: { postId: string; firestore: any }) {
  const [comments, setComments] = React.useState(0);

  React.useEffect(() => {
    if (!firestore || !postId) return;
    const postRef = doc(firestore, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setComments(docSnap.data().comments || 0);
      }
    });
    return () => unsubscribe();
  }, [postId, firestore]);

  return <span className="text-xs font-medium">{comments}</span>;
}
// প্রোফাইল পেজের ৫টি বাক্যের বেশি বড় পোস্টের জন্য 'Show More' এবং 'Show Less' কম্পোনেন্ট
function LivePostContent({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!text) return null;

  // নতুন লাইন (\n) বা ডট (.) দিয়ে বাক্য আলাদা করা হচ্ছে
  const sentences = text.split(/(?<=\n)|(?<=\. )/);

  if (sentences.length <= 3) {
    return <p className="whitespace-pre-wrap font-normal leading-relaxed text-left">{text}</p>;
  }

  const truncatedText = sentences.slice(0, 3).join("");

  return (
    <div className="text-left">
      <p className="whitespace-pre-wrap font-normal leading-relaxed">
        {isExpanded ? text : truncatedText}
        {!isExpanded && " ..."}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sky-500 hover:text-sky-600 font-bold text-xs mt-2 transition-colors cursor-pointer block"
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}
