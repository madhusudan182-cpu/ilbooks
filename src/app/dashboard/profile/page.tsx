'use client';
import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageCircle, Heart, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// কাস্টম হুক এবং ফায়ারস্টোর কোর মেথডস
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, setDoc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // ফায়ারস্টোর ভ্যালিডেশন সহ ইউজার রেফারেন্স
  const userRef = useMemo(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  // মূল পোস্ট কুয়েরি সেফটি গার্ড
  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, loading: postsLoading } = useCollection<any>(postsQuery);

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
          element.scrollIntoView({ behavior: "smooth", block: "center" });
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
              <Avatar className="w-24 h-24 border-4 border-purple-100 shadow-sm">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="text-xl font-bold bg-purple-50 text-purple-700">{userName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{userName}</h2>
            <Badge className="bg-purple-600 hover:bg-purple-700 my-1 text-xs font-semibold">
              Level: {(Number(profile?.level) || 0.0).toFixed(1)}
            </Badge>
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
                  "mb-6 shadow-sm border overflow-hidden bg-white rounded-xl text-left transition-all duration-300 w-full",
                  highlightedPostId === post.id 
                    ? "border-pink-500 border-[3px] shadow-md ring-4 ring-pink-100/50" 
                    : "border-slate-200/80"
                )}
              >
                <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={post.author?.avatarUrl || profile?.avatarUrl} />
                    <AvatarFallback>{(post.author?.name || userName).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5 min-w-0">
                    <span className="font-bold text-sm text-slate-800">{post.author?.name || userName}</span>
                    <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-white min-h-[60px] border-t-2 border-b-2 border-sky-200/80 text-sm text-slate-700 my-1.5 transition-all">
                  <LivePostContent text={post.content || post.text} />
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
