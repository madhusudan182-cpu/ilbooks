'use client';

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Heart, Share2, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, increment, setDoc, deleteDoc, getDoc } from "firebase/firestore";

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

  const { data: posts, loading: postsLoading } = useCollection<any>(postsQuery);

  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCancel = () => {
    setPostContent("");
    setIsPosting(false);
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

    const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent.trim() && !postImage) || !user || !firestore || !profile) return;

    setIsSubmitting(true);
    try {
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
          avatarUrl: profile.avatarUrl || `https://picsum.photos{user.uid}/100/100`,
        },
        createdAt: firebaseFirestore.serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        imageUrl: finalImageUrl
      });

      // ৩. স্টেটগুলো রিসেট করা
      setPostContent("");
      setPostImage(null);
      if (typeof setImagePreview === 'function') setImagePreview(null);
      setIsPosting(false);
      toast({ title: "Post published!" });

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
      }
    } catch (error: any) {
      console.error("Like error: ", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !firestore || !profile || !commentText[postId]?.trim()) return;
    const currentComment = commentText[postId].trim();
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
      const postRef = doc(firestore, 'posts', postId);
      await updateDoc(postRef, { comments: increment(1) });
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      toast({ title: "Comment added!" });
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
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-3xl mx-auto">
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
                  placeholder="What's on your mind, bookworm?"
                  onFocus={() => setIsPosting(true)}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                {imagePreview && (
                  <div className="relative mt-2 w-full max-h-60 overflow-hidden rounded-lg border border-slate-700">
                    <img src={imagePreview} alt="Selected preview" className="w-full h-auto object-cover max-h-60" />
                    <button 
                      type="button"
                      onClick={() => { setPostImage(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors"
                    >
                      ✕
                    </button>
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
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]; // এখানে অবশ্যই [0] হতে হবে
                    if (file) {
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
              <Card key={post.id} className="overflow-hidden border border-slate-100 shadow-sm bg-white rounded-xl">
                {/* 👤 পোস্ট হেডার */}
                <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
                  <Link href={profileUrl} className="active:scale-95 transition-transform shrink-0">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={authorAvatar} alt={authorName} />
                      <AvatarFallback>{authorName ? authorName.charAt(0) : 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="grid gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={profileUrl}>
                        <span className="font-semibold text-sm hover:text-pink-500 hover:underline cursor-pointer transition-colors truncate block max-w-[180px]">
                          {authorName}
                        </span>
                      </Link>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-purple-50 text-purple-600 border border-purple-100 rounded font-bold">
                        Level: {typeof post?.user?.level === 'number' ? post.user.level.toFixed(1) : (Number(post?.user?.level) || 0).toFixed(1)}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                  </div>
                </CardHeader>

                {/* 📝 পোস্ট কন্টেন্ট */}
                <CardContent className="p-3 pt-1 pb-3 text-sm text-slate-700">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>

                {/* 👍 💬 🔗 অ্যাকশন বাটনসমূহ (একেবারে কাছাকাছি ও সুন্দরভাবে সাজানো) */}
                <CardFooter className="flex items-center gap-6 p-2 px-3 border-t bg-slate-50/50 justify-start">
                  {/* লাইক বাটন */}
                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-slate-500 hover:text-pink-500 transition-colors active:scale-90 duration-100">
                    <Heart className="h-4 w-4 shrink-0" />
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
                                        {/* 📝 আপডেট করা কমেন্ট ফর্ম (Enter সাপোর্ট এবং অটো-ক্লোজ লজিকসহ) */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault(); // পেজ রিফ্রেশ হওয়া বন্ধ করবে
                        handleAddComment(post.id);
                        setCommentingOn(null); // কমেন্ট সাবমিট হলে বক্স অটো বন্ধ হয়ে যাবে
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-600 shadow-sm text-slate-800"
                      />
                      <Button 
                        type="submit" // টাইপ সাবমিট করায় Enter বাটন কাজ করবে
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 rounded-xl h-[34px]"
                        disabled={!commentText[post.id]?.trim()}
                      >
                        Comment
                      </Button>
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
      </div>
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

  return <>{level}</>;
}

// 💬 ফায়ারবেস থেকে লাইভ কমেন্ট Descending অর্ডার-এ তুলে আনার কম্পোনেন্ট
function LiveCommentsList({ postId, firestore }: { postId: string; firestore: any }) {
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
                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{comment.author?.name}</span>
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

