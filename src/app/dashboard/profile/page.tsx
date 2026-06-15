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

  const [counts, setCounts] = useState({
    friends: 0,
    following: 0,
    followers: 0,
    blocked: 0
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

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

    // 🔐 কারেন্ট ইউজারের আইডি বনাম ডাটাবেস থেকে আসা অবজেক্ট আইডি ম্যাচিং ফিল্টার
  const displayMyPosts = myPosts.filter(post => {
    const currentId = currentUser?.uid || auth.currentUser?.uid;
    if (!currentId) return false;

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
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" />
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

      <div className="grid grid-cols-4 gap-1.5 mb-6 text-center font-bold text-[11px]">
        <button className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-sm">
          <span className="text-sm font-extrabold">{counts.friends}</span>
          <span>Friends</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl shadow-sm">
          <span className="text-sm font-extrabold">{counts.following}</span>
          <span>Following</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm">
          <span className="text-sm font-extrabold">{counts.followers}</span>
          <span>Followers</span>
        </button>
                <button className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-sm">
          <span className="text-sm font-extrabold">{counts.blocked}</span>
          <span>Blocked</span>
        </button>
      </div>

      {/* 📰 ডাইনামিক নিউজ ফিড বা পোস্ট সেকশন */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 px-1">Your Posts ({displayMyPosts.length})</h3>

         {displayMyPosts.length > 0 ? (
          displayMyPosts.map((post) => (
            <Card key={post.id} className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-8 h-8 border border-purple-100">
                    <AvatarImage src={post.authorAvatar || profile?.avatarUrl} />
                    <AvatarFallback className="text-xs font-bold bg-purple-50 text-purple-700">
                      {post.authorName ? post.authorName.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800">{post.authorName}</h4>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[9px] px-1 py-0 h-auto font-bold">Level: {post.authorLevel}</Badge>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">Post Feed</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">{post.content}</p>

                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-3 border border-slate-100 max-h-60 flex items-center justify-center bg-slate-50">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold border-t border-slate-50 pt-2.5 mt-1 px-1">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.commentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{post.sharesCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            You haven't posted anything yet. 📚
          </div>
        )}
      </div>
    </div>
  );
}
