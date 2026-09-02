'use client';

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Heart, Share2, Image as ImageIcon, Film, Loader2, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, increment, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as nsfwjs from 'nsfwjs';


import type { User } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<User>(userRef);

  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);


  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const { toast } = useToast();



  const fullPlaceholder = "What's on your mind, bookworm?";
const [currentPlaceholder, setCurrentPlaceholder] = useState("");

useEffect(() => {
  // বাক্যটিকে স্পেস দিয়ে ভাগ করে শব্দগুলোর একটি অ্যারে তৈরি করা হলো
  const words = fullPlaceholder.split(" ");
  let wordIndex = 0;
  let isDeleting = false;
  let timer: NodeJS.Timeout;

    const handleWordTyping = () => {
      // এক এক করে পুরো শব্দ স্ক্রিনে যুক্ত হবে
      setCurrentPlaceholder(words.slice(0, wordIndex + 1).join(" "));
      wordIndex++;

      // যখন সব শব্দ স্ক্রিনে চলে আসবে (বাক্যটি শেষ হবে)
      if (wordIndex > words.length) {
        wordIndex = 0; // ইন্ডেক্স রিসেট করে আবার শুরুতে নিয়ে যাওয়া হলো
        setCurrentPlaceholder(""); // প্লেসহোল্ডার খালি করে দেওয়া হলো
        
        // বাক্যটি শেষ হওয়ার পর আবার নতুন করে শুরু হওয়ার মাঝখানের বিরতি (১.৫ সেকেন্ড)
        timer = setTimeout(handleWordTyping, 1500); 
        return;
      }

      // একটি শব্দ আসার পর পরবর্তী শব্দ আসার গতি (৩০০ মিলি-সেকেন্ড)
      // তবে শেষ শব্দটির পর পুরো বাক্যটি স্ক্রিনে ৩ সেকেন্ড স্থির হয়ে থাকবে
      const speed = wordIndex === words.length ? 3000 : 300;
      timer = setTimeout(handleWordTyping, speed);
    };


  handleWordTyping();

  return () => clearTimeout(timer); // কম্পোনেন্ট বন্ধ হলে টাইমার ক্লিয়ার হবে
}, []);

  
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScrollVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  const handleScrollToTopAndRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // নতুন ডাটা ফেচ করার আগে পুরানো স্টেট ক্লিয়ার করা হচ্ছে যেন স্পিনার ওভারল্যাপ না হয়
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    fetchInitialPosts(); 
  };


  
  useEffect(() => {
  window.scrollTo(0, 0);
  fetchInitialPosts();

    // কম্পোনেন্ট আনমাউন্ট হওয়ার সময় সব লিসেনার বন্ধ করার লজিক
    return () => {
      // ১. ইনিশিয়াল লিসেনার বন্ধ করা
      if (unsubscribePostsRef.current) {
        unsubscribePostsRef.current();
      }

      // ২. স্ক্রোল করে লোড হওয়া সব লিসেনার একে একে বন্ধ করা
      if (unsubscribeMorePostsRef.current) {
        Object.values(unsubscribeMorePostsRef.current).forEach(unsub => {
          if (typeof unsub === 'function') unsub();
        });
      }
    };
  }, [firestore]);


  
// === নোটিফিকেশন থেকে আসা সিলেক্টেড পোস্টকে ইমেজের পরে অটো-স্ক্রোল করানোর লজিক ===
useEffect(() => {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#post-')) {
    const triggerTargetScroll = () => {
      setTimeout(() => {
        const selectedPostId = hash.substring(1);
        const targetPostElement = document.getElementById(selectedPostId);
        if (targetPostElement) {
          targetPostElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400); // ৪০০ মিলি-সেকেন্ডের সেফ বাফার যাতে ইমেজ রেন্ডারিং শেষ হতে পারে
    };

    if (document.readyState === 'complete') {
      triggerTargetScroll();
    } else {
      window.addEventListener('load', triggerTargetScroll);
      return () => window.removeEventListener('load', triggerTargetScroll);
    }
  }
}, [postsLoading]); // পেজের বেসিক পোস্ট লোড সম্পন্ন হলে রান করবে

  // ১. লিসেনার আনসাবস্ক্রাইব করার জন্য একটি রেফ (Ref) ডিক্লেয়ার করুন (ফাইলের ওপরে বা স্টেটগুলোর সাথে রাখুন)
const unsubscribePostsRef = useRef<(() => void) | null>(null);

const fetchInitialPosts = async () => {
if (!firestore) return;
setPostsLoading(true);
try {
const firebaseFirestore = await import("firebase/firestore");
const q = firebaseFirestore.query(
firebaseFirestore.collection(firestore, 'posts'),
firebaseFirestore.orderBy('createdAt', 'desc'),
firebaseFirestore.limit(10)
);

// আগের কোনো লিসেনার চালু থাকলে তা বন্ধ করে নিন
if (unsubscribePostsRef.current) unsubscribePostsRef.current();

// getDocs-এর বদলে onSnapshot ব্যবহার করা হলো রিয়েল-টাইম আপডেটের জন্য
unsubscribePostsRef.current = firebaseFirestore.onSnapshot(q, (snapshot) => {
const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
setPosts(fetchedPosts);
setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
setHasMore(snapshot.docs.length === 10);
setPostsLoading(false);
}, (error) => {
console.error("Error streaming posts:", error);
setPostsLoading(false);
});

} catch (error) {
console.error("Error setting up post listener:", error);
setPostsLoading(false);
}
};


  // আরও পোস্টের রিয়েল-টাইম লিসেনার ট্র্যাক করার জন্য আরেকটি রেফ ডিক্লেয়ার করুন
const unsubscribeMorePostsRef = useRef<{ [key: string]: () => void }>({});

const fetchMorePosts = async () => {
if (!firestore || loadingMore || !hasMore || !lastVisible) return;
setLoadingMore(true);
try {
const firebaseFirestore = await import("firebase/firestore");
const q = firebaseFirestore.query(
firebaseFirestore.collection(firestore, 'posts'),
firebaseFirestore.orderBy('createdAt', 'desc'),
firebaseFirestore.startAfter(lastVisible),
firebaseFirestore.limit(10)
);

const currentLastVisibleId = lastVisible.id;

// আগের একই স্ক্রোল ট্রিগারের লিসেনার থাকলে তা বন্ধ করুন
if (unsubscribeMorePostsRef.current[currentLastVisibleId]) {
unsubscribeMorePostsRef.current[currentLastVisibleId]();
}

unsubscribeMorePostsRef.current[currentLastVisibleId] = firebaseFirestore.onSnapshot(q, (snapshot) => {
const fetchedMore = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

if (fetchedMore.length > 0) {
setPosts(prev => {
// ডুপ্লিকেট পোস্ট এড়াতে Map ব্যবহার করে ইউনিক আইডি ফিল্টার লজিক
const postMap = new Map();
prev.forEach(p => postMap.set(p.id, p));
fetchedMore.forEach(p => postMap.set(p.id, p));
return Array.from(postMap.values()).sort((a, b) => {
const timeA = a.createdAt?.seconds || 0;
const timeB = b.createdAt?.seconds || 0;
return timeB - timeA; // Descending অর্ডারে সর্ট রাখা
});
});

setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
setHasMore(snapshot.docs.length === 10);
} else {
setHasMore(false);
}
setLoadingMore(false);
}, (error) => {
console.error("Error streaming more posts:", error);
setLoadingMore(false);
});

} catch (error) {
console.error("Error fetching more posts setup:", error);
setLoadingMore(false);
}
};


// ৪. অটোমেটিক স্ক্রোল ডিটেক্টর লিসেনার
useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
      fetchMorePosts();
    }
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [lastVisible, loadingMore, hasMore, firestore]);

  const handleCancel = () => {
    setPostContent("");
    setPostImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setIsPosting(false);
  };


  const handleImageClick = () => {
  imageInputRef.current?.click();
};


  const handleVideoClick = () => {
    toast({
      title: "Coming soon!",
      description: "Video upload feature is currently under development.",
    });
  };
  //When the VIP users will be introduce the above 2 const will be deleted.


    const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent.trim() && !postImage) || !user || !firestore || !profile) return;

    setIsSubmitting(true);
    try {
    // কোডের শুরু (Beginning of the code)
    // ১. পরিচিত অ্যাডাল্ট ওয়েবসাইট ও ডোমেইন সমূহের তালিকা
    const badDomains = [
      "xhamster", "xvideos", "pornhub", "xnxx", "youporn", "brazzers", "chaturbate", 
      "onlyfans", "redtube", "stripchat", "bongacams", "livejasmin", "xv-videos", 
      "spankbang", "eporner", "hqporner", "txxx", "voyeurhouse", "xhamsterlive"
    ];

    // ২. ট্রিকি বাইপাস (যেমন: p0rn, p*rn, s3x) ধরার জন্য রেগুলার এক্সপ্রেশন (Regex) প্যাটার্ন
    // এটি 'porn', 'p0rn', 'p*rn', 'p_orn', 'p.orn' ইত্যাদি সব ধরনের কম্বিনেশন একসাথে ব্লক করবে
    const badPatterns = [
      /p[o0\*\_]rn/i,          // porn, p0rn, p*rn
      /s[e3\*\_]x/i,           // sex, s3x, s*x
      /n[u0\*\_]d[e3\*\_]/i,   // nude, n0de, n*de
      /b[o0\*\_]{2}bs/i,       // boobs, b00bs
      /p[e3\*\_]n[i1\*\_]s/i,   // penis, p3n1s
      /v[a4\*\_]g[i1\*\_]n[a4\*\_]/i, // vagina
      /n[i1\*\_]ppl[e3\*\_]/i,  // nipple
      /c[h0\*\_]t[i1\*\_]/i,   // choti (বাংলা চটি)
      /[a4\*\_]d[u0\*\_]lt/i,   // adult
      /n[a4\*\_]k[e3\*\_]d/i,   // naked
      /xxx/i,                  // xxx
      /hentai/i,               // hentai
      /milf/i                  // milf
    ];

    const lowercaseContent = postContent.toLowerCase();

    // চেক করা: টেক্সটের ভেতর কোনো পর্নো ডোমেইন আছে কিনা
    const hasBadDomain = badDomains.some(domain => lowercaseContent.includes(domain));

    // চেক করা: টেক্সটের ভেতর ট্রিকি কোনো অ্যাডাল্ট প্যাটার্ন ম্যাচ করে কিনা
    const hasBadPattern = badPatterns.some(pattern => pattern.test(lowercaseContent));

    // যেকোনো একটি সত্য হলেই পোস্ট ব্লক হবে
    if (hasBadDomain || hasBadPattern) {
      toast({
        variant: "destructive",
        title: "অ্যাকশন ব্লক করা হয়েছে!",
        description: "You can't post it here!",
      });
      setIsSubmitting(false);
      return;
    }

    if (postImage) {
      try {
        // মোবাইল স্ক্রিন বা মোবাইল ব্রাউজার কি না তা ডিটেক্ট করার শর্ত (User Agent এবং Window Width চেক)
        const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;

        // শুধুমাত্র ডেস্কটপ বা পিসির জন্য AI স্ক্যানিং রান করবে, মোবাইলে স্কিপ হবে
        if (!isMobileDevice) {
          // ১. ক্লায়েন্ট-সাইড এআই মডেল ব্যাকগ্রাউন্ডে লোড করা
          const model = await nsfwjs.load();
          // ২. ইমেজ এলিমেন্ট তৈরি
          const imgElement = document.createElement('img');
          imgElement.src = URL.createObjectURL(postImage);
          
          await new Promise((resolve) => {
            imgElement.onload = resolve;
          });
          // ৩. এআই মডেল দিয়ে ছবি স্ক্যান করা
          const predictions = await model.classify(imgElement);
          // ৪. কোনো নোংরা ছবি থাকলে তা ব্লক করা
          const isNSFW = predictions.some(p =>
            (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.7
          );
          if (isNSFW) {
            toast({
              variant: "destructive",
              title: "অ্যাকশন ব্লক করা হয়েছে!",
              description: "You can't post it here!",
            });
            setIsSubmitting(false);
            return; 
          }
        } else {
          console.log("Mobile device detected. Skipping NSFW AI image scanning for performance.");
        }
      } catch (error) {
        console.error("AI Image scanning failed:", error);
      }
    }

      let finalImageUrl = null;

      // ১. ইউজার ছবি সিলেক্ট করে থাকলে সেটি ফায়ারবেস স্টোরেজে আপলোড করা
      if (postImage) {
        const firebaseStorage = await import("firebase/storage");
        const storage = firebaseStorage.getStorage();
        const storageRef = firebaseStorage.ref(storage, `posts/${user.uid}_${Date.now()}`);
        
        console.log("Uploading post image...");
        await firebaseStorage.uploadBytes(storageRef, postImage);
        finalImageUrl = await firebaseStorage.getDownloadURL(storageRef);
        console.log("Post image uploaded successfully! URL:", finalImageUrl);
      }

      // ২. ফায়ারস্টোর ডাটাবেজে পোস্ট সেভ করা
      const firebaseFirestore = await import("firebase/firestore");
      await firebaseFirestore.addDoc(firebaseFirestore.collection(firestore, 'posts'), {
        content: postContent,
        author: {
          id: user.uid,
          name: profile.name || 'Anonymous',
          avatarUrl: profile.avatarUrl || `https://picsum.photos/${user.uid}/100/100`,
          level: profile.level ?? 0.0
        },
        createdAt: firebaseFirestore.serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        imageUrl: finalImageUrl
      });

      // ৩. স্টেটগুলো রিসেট করা এবং নতুন পোস্ট লিস্টের শুরুতে রিফ্রেশ করা
    setPostContent("");
    setPostImage(null);
    if (typeof setImagePreview === 'function') setImagePreview(null);
    setIsPosting(false);
    toast({ title: "Post published!" });
    fetchInitialPosts(); // নতুন পোস্ট দেওয়ার পর লিস্ট রিফ্রেশ করবে


    } catch (error: any) {
      console.error("Post creation error:", error);
      toast({ title: "Failed to publish post", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

    const handleLike = async (postId: string) => {
    if (!user || !firestore) return;
    const likeRef = doc(firestore, `posts/${postId}/likes`, user.uid);
    const postRef = doc(firestore, 'posts', postId);
    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
        toast({ title: "Removed like" });
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });
        toast({ title: "Liked post!" });

        // নোটিফিকেশন পাঠানোর লজিক
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          if (postData.author && postData.author.id !== user.uid) {
            await addDoc(collection(firestore, 'notifications'), {
              type: 'LIKE',
              postId: postId,
              senderId: user.uid,
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

  const handleAddComment = async (postId: string) => {
    if (!user || !firestore || !profile || !commentText[postId]?.trim()) return;
    const currentComment = commentText[postId].trim();
    const postRef = doc(firestore, 'posts', postId);
    try {
      await addDoc(collection(firestore, `posts/${postId}/comments`), {
        text: currentComment,
        author: {
          id: user.uid,
          name: profile.name || 'Anonymous',
          avatarUrl: profile.avatarUrl || `https://picsum.photos{user.uid}/100/100`,
        },
        createdAt: serverTimestamp()
      });
      
      await updateDoc(postRef, { comments: increment(1) });
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      toast({ title: "Comment added!" });

      // নোটিফিকেশন পাঠানোর লজিক
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        if (postData.author && postData.author.id !== user.uid) {
          await addDoc(collection(firestore, 'notifications'), {
            type: 'COMMENT',
            postId: postId,
            senderId: user.uid,
            senderName: profile?.name || 'Someone',
            targetUserId: postData.author.id,
            isSeen: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to comment", description: error.message });
    }
  };


  const handleShare = () => {
    toast({ title: "Sharing options coming soon!", duration: 2000 });
  };


  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const userName = profile?.name || user.displayName || user.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`;


  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-blue-90 text-slate-800 p-1 md:max-w-3xl md:bg-blue-90 md:text-slate-800 space-y-3">
      <Card id="post">
        <CardContent className="p-2 pt-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <form onSubmit={handleCreatePost}>
                <Textarea
                  rows={1}
                  className={cn(
                    "text-sm transition-all duration-200 ease-in-out p-1 border-0 focus-visible:ring-0 resize-none h-auto min-h-0", 
                    isPosting ? "min-h-[60px] border rounded-md p-2 mt-1" : ""
                  )}
                  placeholder={currentPlaceholder} //  এখানে ফিক্সড টেক্সটের বদলে currentPlaceholder বসানো হলো
                  onFocus={() => setIsPosting(true)}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />

                {imagePreview && (
                  <div className="relative mt-2 w-full max-h-60 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/10 flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Selected preview" 
                      className={cn(
                        "w-full h-auto object-cover max-h-60 transition-all",
                        isSubmitting ? "blur-[2px] opacity-70" : ""
                      )} 
                    />
                    
                    {/* ছবি আপলোড হওয়ার সময় লোডিং স্পিনার এবং টেক্সট */}
                    {isSubmitting && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 gap-2 text-white font-medium text-xs">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                        <span>Uploading image...</span>
                      </div>
                    )}

                    {/* ক্যানসেল বাটন (লোডিং চলার সময় হাইড থাকবে) */}
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => { 
                          setPostImage(null); 
                          setImagePreview(null); 
                          if (imageInputRef.current) imageInputRef.current.value = ""; 
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors z-10"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

              </form>
            </div>
          </div>
        </CardContent>
        {isPosting && (
          <CardFooter className="flex items-center justify-between p-2 border-t">
            <div className="flex">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*, image/jpeg, image/jpg, image/png, image/webp"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                      if (file) {
                        // ১০ MB সাইজ ভ্যালিডেশন (10 * 1024 * 1024 bytes)
                        if (file.size > 10485760) {
                          toast({
                            variant: "destructive",
                            title: "File too large",
                            description: "Please select an image smaller than 10MB.",
                          });
                          // ইনপুট ফিল্ড রিসেট করা হচ্ছে
                          if (imageInputRef.current) imageInputRef.current.value = "";
                          return;
                        }
                        setPostImage(file);
                        setImagePreview(URL.createObjectURL(file));
                        console.log("Image selected:", file.name);
                      }
                  }}
                /> 
                <input type="file" ref={videoInputRef} accept="video/*" className="hidden" />
                <Button variant="ghost" size="icon" onClick={handleImageClick}>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Add image</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleVideoClick}>
                    <Film className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Add video</span>
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
                </Button>
                <Button 
                    size="sm" 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={handleCreatePost}
                    disabled={isSubmitting || (!postContent.trim() && !postImage)}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <div className="space-y-4">
        {postsLoading ? (
            <div className="flex flex-col items-center py-10 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading posts...</p>
            </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post: any) => {
            const isMe = user && post.author.id === user.uid;
            const authorName = post.author.name;
            const authorAvatar = post.author.avatarUrl;
                    // 💡 নিজের পোস্ট হলে সরাসরি লাইভ প্রোফাইল থেকে লেভেল দেখাবে, অন্যথায় ডেটাবেজের লেভেল দেখাবে
            const authorLevel = isMe && profile ? (profile.level ?? 0.0) : (post.author.level ?? 0.0);

            const profileUrl = isMe ? "/dashboard/profile" : `/dashboard/user/${post.author.id}`;
            const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now';
            
            return (
              <Card key={post.id} className="mb-4 shadow-sm border border-slate-200/80 overflow-hidden bg-white rounded-xl">
                {/* 👤 পোস্ট হেডার */}
                <CardHeader className="flex flex-row items-center gap-3 p-1.5 pb-1">
                  <Link href={profileUrl} className="active:scale-95 transition-transform shrink-0">
                    <LiveAuthorAvatar authorId={post.author.id} fallbackAvatar={authorAvatar} userName={authorName} />

                  </Link>
                  <div className="grid gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={profileUrl}>
                        <span className="font-semibold text-sm hover:text-pink-500 hover:underline cursor-pointer transition-colors truncate block max-w-[180px]">
                          {authorName}
                        </span>
                      </Link>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-white-50 text-pink-600 border border-purple-100 rounded font-bold">
                        Level: <LiveAuthorLevel authorId={post.author.id} fallbackLevel={authorLevel} firestore={firestore} />
                      </Badge>


                    </div>
                    <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                  </div>
                </CardHeader>

                  {/* 📄 ২য় বক্স: বডি (পোস্টের মূল লেখা - সাদা ব্যাকগ্রাউন্ড এবং মোটা হালকা নীল বর্ডার ডিজাইন) */}
                  <CardContent className="p-4 bg-white min-h-[60px] border-t-2 border-b-2 border-sky-200/80 text-sm text-slate-700 text-left my-1.5 transition-all">

                    <LivePostContent text={post.content || post.text} />
                      {post.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 max-h-[500px] w-full bg-pink/95 flex items-center justify-center">
                        <img 
                          src={post.imageUrl} 
                          alt="Post attachment" 
                          className="w-full h-auto object-contain max-h-[500px]" 
                        />
                      </div>
                      )}



                  </CardContent>

                {/* 👍 💬 🔗 অ্যাকশন বাটনসমূহ (একেবারে কাছাকাছি ও সুন্দরভাবে সাজানো) */}
                <CardFooter className="flex items-center gap-6 p-2 px-3 border-t bg-slate-50/50 justify-start">
                  {/* লাইক বাটন */}
                  <button 
                    onClick={() => handleLike(post.id)} 
                    className="flex items-center gap-1 text-slate-500 hover:text-pink-500 transition-colors active:scale-90 duration-100"
                  >
                    <LiveHeartIcon postId={post.id} userId={user?.uid} firestore={firestore} />
                    <span className="text-xs font-medium">{post.likes || 0}</span>
                  </button>

                  {/* কমেন্ট বাটন (ক্লিক করলে ওপেন হবে) */}
                  <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-1 text-slate-500 hover:text-purple-500 transition-colors active:scale-90 duration-100">
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{post.comments || 0}</span>
                  </button>

                  {/* শেয়ার বাটন */}
                  <button onClick={handleShare} className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors active:scale-90 duration-100">
                    <Share2 className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{post.shares || 0}</span>
                  </button>
                </CardFooter>

                {/* 💬 লাইভ কমেন্ট সেকশন (বাটনে ক্লিক করলে ডাইনামিকালি লোড হবে) */}
                {commentingOn === post.id && (
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 space-y-3">
                    {/* কমেন্ট ইনপুট বক্স (সিঙ্গেল বক্স ডিজাইন) */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(post.id);
                        setCommentingOn(null);
                      }}
                      // এখানে 'flex-col' যোগ করা হয়েছে যা ইনপুট এবং বাটনগুলোকে ওপরে-নিচে সাজাবে
                      className="flex flex-col gap-3 w-full"
                    >
                      {/* টেক্সট ইনপুট বক্স */}
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        // 'flex-1' বাদ দিয়ে 'w-full' ব্যবহার করা হয়েছে যাতে বক্সটি পুরো চওড়া হয়
                        className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-600 shadow-sm text-slate-800"
                      />

                      {/* বাটনগুলোর জন্য একটি নতুন ডিভ (Div) যা বাটন দুটিকে নিচে ডানপাশে রাখবে */}
                      <div className="flex justify-end gap-2">
                        {/* Cancel বাটনটি আগে দেওয়া হলো যাতে এটি বামে থাকে */}
                        <button
                          type="button"
                          onClick={() => {
                            setCommentText(prev => ({ ...prev, [post.id]: "" }));
                            setCommentingOn(null);
                          }}
                          className="bg-amber-100/70 text-amber-800 hover:bg-amber-200 hover:text-amber-900 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors duration-150 h-[34px]"
                        >
                          Cancel
                        </button>

                        {/* Comment বাটন */}
                        <button
                          type="submit"
                          disabled={!commentText[post.id]?.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1.5 rounded-xl h-[34px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Comment
                        </button>
                      </div>
                    </form>

                    {/* 👇 ৩. লাইভ কমেন্ট লিস্ট (Descending Order-এ দেখানোর কাস্টম কম্পোনেন্ট) */}
                          <LiveCommentsList postId={post.id} firestore={firestore} />
                        </div>
                      )}
                    </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                    <p>No posts yet. Be the first to share something!</p>
                  </div>
                )}

                {/* === এখানে অটো-লোডিং স্পিনার কোডটি রাখুন (শর্তহীনভাবে বা ম্যাপের বাইরে) === */}
                {loadingMore && (
                  <div className="flex flex-col items-center py-4 gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                    <p className="text-xs text-muted-foreground">Loading more posts...</p>
                  </div>
                )}
      </div>
        {showScrollTop && (
          <div className="sticky bottom-6 left-full flex justify-end pr-2 z-50 pointer-events-none">
            <button
              onClick={handleScrollToTopAndRefresh}
              className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer pointer-events-auto animate-fade-in"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        )}
    </div>
  );
}



function LiveAuthorLevel({ authorId, fallbackLevel, firestore }: { authorId: string; fallbackLevel: any; firestore: any }) {
  const [level, setLevel] = useState(fallbackLevel);

  useEffect(() => {
    if (!authorId || !firestore) return;

    const userDocRef = doc(firestore, "users", authorId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setLevel(userData.level ?? userData.admin_level ?? fallbackLevel);
      }
    });

    return () => unsubscribe();
  }, [authorId, firestore, fallbackLevel]);

  return <>{Number(level).toFixed(1)}</>;

}

// ফায়ারস্টোর থেকে লেখকের প্রোফাইল পিকচার রিয়েল-টাইমে তুলে আনার কম্পোনেন্ট
function LiveAuthorAvatar({ authorId, fallbackAvatar, userName }: { authorId: string; fallbackAvatar: string; userName: string }) {
  const firestore = useFirestore();
  const [avatarUrl, setAvatarUrl] = useState(fallbackAvatar);

  useEffect(() => {
    if (!firestore || !authorId) return;
    const userRef = doc(firestore, 'users', authorId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.avatarUrl) setAvatarUrl(userData.avatarUrl);
      }
    });
    return () => unsubscribe();
  }, [firestore, authorId, fallbackAvatar]);

  return (
    <Avatar className="h-11 w-11 border">
      <AvatarImage src={avatarUrl} alt={userName} />
      <AvatarFallback>{userName ? userName.charAt(0) : 'U'}</AvatarFallback>
    </Avatar>
  );
}


// ফায়ারবেস থেকে কারেন্ট ইউজার এই পোস্টে লাইক দিয়েছে কি না তা রিয়েল-টাইম ট্র্যাক করার কম্পোনেন্ট
function LiveHeartIcon({ postId, userId, firestore }: { postId: string; userId: string | undefined; firestore: any }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
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


// 💬 ফায়ারবেস থেকে লাইভ কমেন্ট Descending অর্ডার-এ তুলে আনার কম্পোনেন্ট
function LiveCommentsList({ postId, firestore }: { postId: string; firestore: any }) {
  const { user } = useUser();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !postId) return;

    const commentsQuery = query(
      collection(firestore, `posts/${postId}/comments`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Comments sub-fetch error:", error);
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
              <AvatarImage src={comment.author?.avatarUrl} alt={comment.author?.name} />
              <AvatarFallback>{comment.author?.name ? comment.author.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5 min-w-0">
              <div className="flex items-baseline gap-1.5">
                  <Link 
                  href={comment.author?.id === user?.uid ? "/dashboard/profile" : `/dashboard/user/${comment.author?.id}`}
                  className="text-xs font-bold text-slate-800 hover:text-pink-500 hover:underline truncate max-w-[120px] block"
                >
                  {comment.author?.name}
                </Link>
                <span className="text-[9px] text-slate-400 shrink-0">{commentTime}</span>
              </div>
              <p className="text-xs text-slate-600 break-words">{comment.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// কোডের শুরু (Beginning of the code)
// লিঙ্ক ক্লিকেবল করা এবং ওয়েবসাইটের ছোট প্রিভিউ/ছবি দেখানোর কম্পোনেন্ট
function LivePostContent({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  // ইউআরএল (URL) ডিটেক্ট করার জন্য রেগুলার এক্সপ্রেশন
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matchedUrls = text.match(urlRegex);

  // টেক্সটকে লিঙ্কে রূপান্তর করার ফাংশন
  const renderClickableText = (inputText: string) => {
    const parts = inputText.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 hover:text-pink-600 hover:underline font-medium break-all inline-block"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const sentences = text.split(/(?<=\n)|(?<=\. )|(?<=। )|(?<=।)/);
  // ৩টির বেশি বাক্য অথবা টেক্সট ২৫০ অক্ষরের বেশি হলে 'Show More' দেখাবে
  const isLongText = sentences.length > 3 || text.length > 200;
  const truncatedText = text.length > 200 ? text.substring(0, 200) : sentences.slice(0, 3).join("");



  return (
    <div className="text-left space-y-3">
      <div>
        <p className="whitespace-pre-wrap font-normal leading-relaxed">
          {isLongText ? (isExpanded ? renderClickableText(text) : renderClickableText(truncatedText)) : renderClickableText(text)}
          {isLongText && !isExpanded && " ..."}
        </p>
        {isLongText && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sky-500 hover:text-sky-600 font-bold text-xs mt-2 transition-colors cursor-pointer block"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>

      {/* ২ নম্বর কাজের সমাধান: লিঙ্কের ছোট ছবি/প্রিভিউ দেখানো */}
      {matchedUrls && matchedUrls.map((url, idx) => (
        <LinkPreviewCard key={idx} url={url} />
      ))}
    </div>
  );
}

// ওয়েবসাইটের মেটাডাটা থেকে ছবি এনে ছোট প্রিভিউ কার্ড বানানোর কম্পোনent
function LinkPreviewCard({ url }: { url: string }) {
  const [previewData, setPreviewData] = useState<{ title: string; image: string } | null>(null);

  useEffect(() => {
    // ওপেন গ্রাফ (OpenGraph) ডাটা ফ্রিতে স্ক্র্যাপ করার একটি পাবলিক এপিআই ব্যবহার
    fetch(`https://microlink.io{encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.data) {
          setPreviewData({
            title: data.data.title || 'Shared Link',
            image: data.data.image?.url || data.data.logo?.url || '',
          });
        }
      })
      .catch(() => setPreviewData(null));
  }, [url]);

  if (!previewData || !previewData.image) return null;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex items-center gap-3 p-2 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors max-w-md mt-2"
    >
      <img 
        src={previewData.image} 
        alt="Preview" 
        className="w-16 h-16 object-cover rounded border bg-white shrink-0"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">{previewData.title}</p>
        <p className="text-[10px] text-slate-400 truncate">{url}</p>
      </div>
    </a>
  );
}

