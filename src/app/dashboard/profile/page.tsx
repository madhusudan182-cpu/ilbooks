'use client';

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Camera, Loader2, Lock, Unlock, Heart, MessageCircle, Share2 } from "lucide-react";
import { getFirestore, doc, updateDoc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // 🎯 ফায়ারবেস অথেনটিকেশন মডিউল ইমপোর্ট করলাম
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const firestore = getFirestore();
  const auth = getAuth(); // 🎯 ফায়ারবেস অথেনটিকেশন ইনিশিয়েলাইজ করলাম

  // 👤 ইউজার এবং প্রোফাইল স্টেটসমূহ
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [myPosts, setMyPosts] = useState<PostData[]>([]);
  const [relationship, setRelationship] = useState<'friend' | 'follower' | 'following' | 'none'>('none');
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
  if (file.size > 2 * 1024 * 1024) {
    alert("ছবিটি অনেক বড়! দয়া করে ২ এমবি (2MB) এর চেয়ে ছোট ছবি সিলেক্ট করুন।");
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
            <Badge className="bg-purple-600 hover:bg-purple-700 my-1 text-xs font-semibold">Level: {profile?.level || "0.1"}</Badge>
            
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
            // নিজের প্রোফাইল হলে শুধু এডিট বাটন থাকবে
            <Button variant="outline" className="w-full">Edit Profile</Button>
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
        <h3 className="font-bold text-lg text-foreground px-1">
          Your Posts ({displayMyPosts.length})
        </h3>

        {showFullProfile ? (
          // যদি নিজের প্রোফাইল বা ফ্রেন্ড হয়—তবেই পোস্ট রেন্ডার হবে
          displayMyPosts.length > 0 ? (
            displayMyPosts.map((post: any) => (
              <div key={post.id} className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{post.authorName}</span>
                </div>
                <p className="text-sm">{post.text}</p>
              </div>
            ))
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
