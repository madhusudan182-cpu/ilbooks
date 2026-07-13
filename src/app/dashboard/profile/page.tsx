'use client';
import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageCircle, Heart, Share2, Loader2, MoreVertical } from "lucide-react";
import { cn} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, increment,
setDoc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
import { Camera } from "lucide-react";


export default function ProfilePage() {
  
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const handlePostAction = async (actionType: string, postId: string, currentContent?: string) => {
    if (!firestore) return;
    const postRef = doc(firestore, 'posts', postId);
    setActiveMenuPostId(null);

    try {
      if (actionType === 'delete') {
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (confirmDelete) {
          await deleteDoc(postRef);
          toast({ title: "Post deleted successfully!" });
        }
      } else if (actionType === 'edit') {
        // অ্যালার্ট ওপেন না করে ইনলাইন এডিট মোড অন হবে
        setEditingPostId(postId);
        setEditText(currentContent || "");
      } else {
        await updateDoc(postRef, { privacy: actionType });
        toast({ title: `Privacy updated to ${actionType}!` });
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Action failed", description: error.message });
    }
  };

  // ইনলাইন এডিট সেভ করার ফাংশন
  const handleSaveEdit = async (postId: string) => {
    if (!firestore || !editText.trim()) return;
    try {
      const postRef = doc(firestore, 'posts', postId);
      await updateDoc(postRef, { content: editText });
      setEditingPostId(null);
      toast({ title: "Post updated successfully!" });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    }
  };



  // ফায়ারস্টোর ভ্যালিডেশন সহ ইউজার রেফারেন্স
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

 const isOwnProfile = useMemo(() => {
    if (!user || !profile) return false;
    return true; 
  }, [user, profile]);
const followsRef = useMemo(() => (firestore ? collection(firestore, "follows") : null), [firestore]);
const { data: allFollows = [] } = useCollection<any>(followsRef);

  // START OF CODE TO REPLACE
  const counts = useMemo(() => {
    if (!user?.uid || !allFollows) return { friends: 0, following: 0, followers: 0, blocked: 0 };

    const myFollowings = new Set<string>();
    const myFollowers = new Set<string>();

    // ১. সোশ্যাল পেজের মতো হুবহু স্ন্যাপশট ফিল্টারিং ইঞ্জিন
    allFollows.forEach((f: any) => {
      if (f.status === "ACTIVE") {
        if (f.followerId === user.uid) {
          myFollowings.add(f.followingId); // আমি যাদের ফলো করি (Following)
        }
        if (f.followingId === user.uid) {
          myFollowers.add(f.followerId); // যারা আমাকে ফলো করে (Followers)
        }
      }
    });

    let friendsCount = 0;
    let followingCount = 0;
    let followersCount = 0;

    // ২. রিলেশনশিপ ম্যাপিং অ্যানালাইসিস (সোশ্যাল পেজের স্ট্রাকচার অনুযায়ী)
    // আমি যাদের ফলো করেছি, তাদের মধ্যে মিউচুয়াল চেক
    myFollowings.forEach((targetId) => {
      if (myFollowers.has(targetId)) {
        friendsCount++; // দুজন দুজনকে ফলো করলে তবেই ফ্রেন্ড
      } else {
        followingCount++; // শুধু আমি ফলো করেছি, সে ব্যাক করেনি
      }
    });

    // যারা আমাকে ফলো করেছে কিন্তু আমি ব্যাক করিনি
    myFollowers.forEach((targetId) => {
      if (!myFollowings.has(targetId)) {
        followersCount++;
      }
    });

    const blocked = 0;

    return { 
      friends: friendsCount, 
      following: followingCount, 
      followers: followersCount, 
      blocked 
    };
  }, [allFollows, user?.uid]);
// END OF CODE TO REPLACE




  const avatarInputRef = useRef<HTMLInputElement>(null);

const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    
    // ১০ এমবি সাইজ ভ্যালিডেশন
    if (file.size > 10485760) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const newAvatarUrl = loadEvent.target?.result as string;
      if (userRef) {
        await updateDoc(userRef, { avatarUrl: newAvatarUrl });
        toast({ title: "Profile picture updated successfully!" });
      }
    };
    reader.readAsDataURL(file);
  }
};


const toggleProfileLock = async () => {
  if (!userRef || !profile) return;
  const currentLockState = profile.isLocked || false;
  
  try {
    await updateDoc(userRef, { isLocked: !currentLockState });
    toast({
      title: !currentLockState ? "Profile Locked 🔒" : "Profile Unlocked 🔓",
      description: !currentLockState 
        ? "Only your friends can see your posts now." 
        : "Anyone can see your posts now.",
    });
  } catch (error: any) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
  }
};



  // মূল পোস্ট কুয়েরি সেফটি গার্ড
  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, loading: postsLoading } = useCollection<any>(postsQuery);

useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeMenuPostId) {
        // যদি ক্লিকটি ৩-ডট বাটনের ভেতরে না হয়, তবে মেনু বন্ধ হবে
        const target = e.target as HTMLElement;
        if (!target.closest('.relative.overflow-visible')) {
          setActiveMenuPostId(null);
        }
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeMenuPostId]);

  // নিজস্ব পোস্ট ফিল্টারিং লজিক
  const displayMyPosts = useMemo(() => {
    if (!posts || !user) return [];
    return posts.filter((post: any) => {
      const postAuthorId = post.author?.id || post.userId;
      return String(postAuthorId).trim() === String(user.uid).trim();
    });
  }, [posts, user]);
  
    useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.startsWith('#post-')) {
      const id = hash.replace('#post-', '');
      setHighlightedPostId(id);

      // ডাটাবেজ থেকে পোস্ট স্ক্রিনে আসার সাথে সাথে অটো-স্ক্রোল করার মেকানিজম
      setTimeout(() => {
        const element = document.getElementById(`post-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "center" });
        }
      }, 400); // ৪০০ মিলিসেকেন্ডের একটি ডিলে, যাতে ফায়ারবেস ডাটা রেন্ডার হতে সুবিধা হয়
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setHighlightedPostId(null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [posts]);


    const handleLike = async (postId: string) => {
    if (!user || !firestore) return;
    const likeRef = doc(firestore, `posts/${postId}/likes`, user.uid);
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
        if (postSnap.exists() && postSnap.data().author?.id !== user.uid) {
          const safeSenderName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
          await addDoc(collection(firestore, 'notifications'), {
            type: 'LIKE',
            postId: postId,
            senderId: user.uid,
            senderName: safeSenderName,
            targetUserId: postSnap.data().author.id,
            isSeen: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !firestore || !profile || !commentText[postId]?.trim()) return;
    const currentComment = commentText[postId].trim();
    const postRef = doc(firestore, 'posts', postId);
    try {
      await addDoc(collection(firestore, `posts/${postId}/comments`), {
        text: currentComment,
        author: { id: user.uid, name: profile.name || 'Anonymous', avatarUrl: profile.avatarUrl || "" },
        createdAt: serverTimestamp()
      });
      await updateDoc(postRef, { comments: increment(1) });
      setCommentText(prev => ({ ...prev, [postId]: "" }));

      const postSnap = await getDoc(postRef);
      if (postSnap.exists() && postSnap.data().author?.id !== user.uid) {
        const safeSenderName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
        await addDoc(collection(firestore, 'notifications'), {
          type: 'COMMENT',
          postId: postId,
          senderId: user.uid,
          senderName: safeSenderName,
          targetUserId: postSnap.data().author.id,
          isSeen: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  };


  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || !firestore) return null;
  const userName = profile?.name || user.displayName || 'User';
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-20 font-sans">
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              {/* ইনপুট ফাইল ট্যাগ (লুকানো থাকবে) */}
              {isOwnProfile && (
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={avatarInputRef} 
                  onChange={handleProfilePictureChange} 
                />
              )}

              <Avatar className="w-24 h-24 border-4 border-purple-100 shadow-sm relative">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="text-xl font-bold bg-purple-50 text-purple-700">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* ক্যামেরা বাটন - শুধুমাত্র নিজের প্রোফাইল হলে দেখাবে */}
              {isOwnProfile && (
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white border-white shadow-md z-10"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Upload Picture</span>
                </Button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-800">{userName}</h2>
            <Badge className="bg-purple-600 hover:bg-purple-700 my-1 text-xs font-semibold">
              Level: {(Number(profile?.level) || 0.0).toFixed(1)}
            </Badge>
{/* 🎯 এক লাইনে নোট, লক এবং এডিট প্রোফাইল বাটন */}
{isOwnProfile && (
  <div className="flex flex-row items-center justify-center gap-3 mt-4 flex-wrap text-sm text-slate-600 font-medium w-full">
    {/* 🎯 বর্ডার ও সুন্দর ব্যাকগ্রাউন্ড সহ সিম্পল নোট */}
      <span className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full shadow-sm">
        {profile?.isLocked ? "Your profile is locked" : "Your profile is unlocked"}
      </span>

    <Button 
      onClick={toggleProfileLock}
      variant={profile?.isLocked ? "destructive" : "outline"}
      className="text-xs gap-1.5 h-8 px-3 rounded-full transition-all border-slate-300"
    >
      {profile?.isLocked ? (
        <>
          <span>Unlock Profile</span>
          <span>🔓</span>
        </>
      ) : (
        <>
          <span>Lock Profile</span>
          <span>🔒</span>
        </>
      )}
    </Button>

    <Button 
      asChild 
      variant="outline" 
      className="text-xs h-8 px-4 rounded-full border-purple-500 text-purple-600 hover:bg-purple-50 transition-all font-medium"
    >
      <Link href="/dashboard/profile/edit">
        Edit Profile
      </Link>
    </Button>
  </div>
)}

           

{/* 🎯 ২. এক লাইনে থাকা লাইভ কাউন্টার সহ ৪টি সোশ্যাল বাটন */}
{isOwnProfile && (

  <div className="w-full mt-5 bg-slate-100/90 p-2 rounded-2xl border border-slate-200/60">
    <div className="flex flex-row flex-nowrap justify-between gap-1.5 overflow-x-auto no-scrollbar">
      
      <Button asChild className="flex-1 min-w-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-[12px] p-1 h-12 rounded-xl shadow-sm transition-all active:scale-95 text-center">
        <Link href="/dashboard/social?tab=friends" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
          <span>Friends</span>
          <span className="text-[12px] font-bold leading-none">{counts.friends}</span>
        </Link>
      </Button>

      <Button asChild className="flex-1 min-w-0 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-[12px] p-1 h-12 rounded-xl shadow-sm transition-all active:scale-95 text-center">
        <Link href="/dashboard/social?tab=following" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
          <span>Following</span>
          <span className="text-[12px] font-bold leading-none">{counts.following}</span>
        </Link>
      </Button>

      <Button asChild className="flex-1 min-w-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-[12px] p-1 h-12 rounded-xl shadow-sm transition-all active:scale-95 text-center">
        <Link href="/dashboard/social?tab=followers" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
          <span>Followers</span>
          <span className="text-[12px] font-bold leading-none">{counts.followers}</span>
        </Link>
      </Button>

      <Button asChild className="flex-1 min-w-0 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-[12px] p-1 h-12 rounded-xl shadow-sm transition-all active:scale-95 text-center">
        <Link href="/dashboard/profile/blocked" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
          <span>Blocked</span>
          <span className="text-[12px] font-bold leading-none">{counts.blocked}</span>
        </Link>
      </Button>
    </div>
  </div>
)}


          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 w-full mt-4">
        <h2 className="text-xl font-bold text-purple-900 mb-4">Your Posts ({displayMyPosts.length})</h2>
        
        {postsLoading ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : displayMyPosts.length > 0 ? (
          displayMyPosts.map((post: any) => {
            const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now';

            return (
                <Card
                  key={post.id}
                  id={`post-${post.id}`}
                  className={cn(
                    "mb-6 shadow-sm border bg-white rounded-xl text-left transition-all duration-300 w-full overflow-visible", // overflow-hidden থেকে overflow-visible করা হলো
                    highlightedPostId === post.id
                      ? "border-pink-500 border-[3px] shadow-md ring-4 ring-pink-100/50"
                      : "border-slate-200/80"
                  )}
                >
                  <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2 relative overflow-visible"> {/* এখানেও overflow-visible করা হলো */}
                    <Avatar className="h-9 w-9 border shrink-0">
                      {/* ইউজার তার নিজের প্রোফাইল দেখুক বা অন্য কারও, এই পেজের মেইন profile স্টেট থেকে লাইভ ছবি রেন্ডার হবে */}
                      <AvatarImage src={profile?.avatarUrl || post.author?.avatarUrl} />
                      <AvatarFallback>{(post.author?.name || userName).charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="grid gap-0.5 min-w-0 flex-1">
                      <span className="font-bold text-sm text-slate-800">{post.author?.name || userName}</span>
                      <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>

                    {/* ৩-ডট মেনু বাটন এবং ড্রপডাউন */}
                    <div className="relative overflow-visible">
                      <button 
                        onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs"> {/* z-index বাড়িয়ে z-50 করা হলো */}
                          <button 
                            onClick={() => handlePostAction('edit', post.id, post.content || post.text)} 
                            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 transition-colors font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handlePostAction('delete', post.id)} 
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 transition-colors font-medium"
                          >
                            Delete
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button 
                            onClick={() => handlePostAction('only me', post.id)} 
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${post.privacy === 'only me' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}
                          >
                            Only me
                          </button>
                          <button 
                            onClick={() => handlePostAction('friends', post.id)} 
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${post.privacy === 'friends' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}
                          >
                            Friends
                          </button>
                          <button 
                            onClick={() => handlePostAction('public', post.id)} 
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${post.privacy === 'public' ? 'text-purple-600 font-bold' : 'text-slate-600'}`}
                          >
                            Public
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 bg-white min-h-[60px] border-t-2 border-b-2 border-sky-200/80 text-sm text-slate-700 my-1.5 transition-all">
                    {editingPostId === post.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-normal"
                          rows={2}
                          autoFocus // এর ফলে এডিটে ক্লিক করলেই কার্সার ব্লিংক করা শুরু করবে
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button 
                            onClick={() => setEditingPostId(null)} 
                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 font-medium"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleSaveEdit(post.id)} 
                            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LivePostContent text={post.content || post.text} />
                    )}
                  </CardContent>
                <CardFooter className="flex items-center gap-6 p-2 px-3 border-t bg-slate-50/50 justify-start">
                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-slate-500 hover:text-pink-500 transition-colors active:scale-90 duration-100">
                    <LiveHeartIcon postId={post.id} userId={user.uid} firestore={firestore} />
                    <span className="text-xs font-medium">{post.likes || 0}</span>
                  </button>

                  <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-1 text-slate-500 hover:text-purple-500 transition-colors active:scale-90 duration-100">
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{post.comments || 0}</span>
                  </button>

                  <button className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors active:scale-90 duration-100 ml-auto">
                    <Share2 className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{post.shares || 0}</span>
                  </button>
                </CardFooter>

                {commentingOn === post.id && (
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 space-y-3 w-full rounded-b-xl">
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id); setCommentingOn(null); }} className="flex flex-col gap-3 w-full">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-600 shadow-sm text-slate-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setCommentText(prev => ({ ...prev, [post.id]: "" })); setCommentingOn(null); }} className="bg-amber-100/70 text-amber-800 hover:bg-amber-200 px-4 py-1.5 rounded-xl text-xs font-medium h-[34px]">Cancel</button>
                        <button type="submit" disabled={!commentText[post.id]?.trim()} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1.5 rounded-xl h-[34px] disabled:opacity-50">Comment</button>
                      </div>
                    </form>
                    <LiveCommentsList postId={post.id} firestore={firestore} />
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
function LiveHeartIcon({ postId, userId, firestore }: { postId: string; userId: string | undefined; firestore: any }) {
  const [isLiked, setIsLiked] = useState(false);
  useEffect(() => {
    if (!firestore || !userId || !postId) return;
    const likeRef = doc(firestore, `posts/${postId}/likes`, userId);
    const unsubscribe = onSnapshot(likeRef, (docSnap) => { setIsLiked(docSnap.exists()); });
    return () => unsubscribe();
  }, [postId, userId, firestore]);
  return <Heart className="h-4 w-4 shrink-0 transition-colors duration-200" style={{ color: isLiked ? '#ef4444' : '#64748b', fill: isLiked ? '#ef4444' : 'none' }} />;
}

function LiveCommentsList({ postId, firestore }: { postId: string; firestore: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !postId) return;
    // কাস্টম হুক সম্পূর্ণ বাদ দিয়ে পিওর ফায়ারস্টোর লিসেনার সেট করা হলো
    const commentsRef = collection(firestore, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(docs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [postId, firestore]);

  if (loading) return <p className="text-[11px] text-slate-400 italic pl-1">Loading comments...</p>;
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2.5 pt-2 border-t border-slate-100 max-h-[200px] overflow-y-auto pr-1">
      {comments.map((comment: any) => {
        const commentTime = comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'Just now';
        return (
          <div key={comment.id} className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100/80 shadow-sm">
            <Avatar className="h-6 w-6 border shrink-0">
              <AvatarImage src={comment.author?.avatarUrl} />
              <AvatarFallback>{comment.author?.name ? comment.author.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-slate-800 block">{comment.author?.name}</span>
                <span className="text-[9px] text-slate-400 shrink-0">{commentTime}</span>
              </div>
              <p className="text-xs text-slate-600 break-words">{comment.text || comment.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LivePostContent({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  const sentences = text.split(/(?<=\n)|(?<=\. )/);
  if (sentences.length <= 3) {
    return <p className="whitespace-pre-wrap font-normal leading-relaxed text-left">{text}</p>;
  }
  const truncatedText = sentences.slice(0, 3).join("");
  return (
    <div className="text-left">
      <p className="whitespace-pre-wrap font-normal leading-relaxed">
        {isExpanded ? text : truncatedText}
        {!isExpanded && "..."}
      </p>
      <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="text-sky-500 hover:text-sky-600 font-bold text-xs mt-2 transition-colors cursor-pointer block">
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}
