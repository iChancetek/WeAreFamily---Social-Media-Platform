'use client';

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { formatDistanceToNow } from "date-fns";
import {
    Archive, BookHeart, Briefcase, ExternalLink, GraduationCap, Heart,
    Image as ImageIcon, Loader2, MessageCircle, Mic, MicOff, MoreHorizontal,
    Pencil, Repeat2, Send, Share2, Sparkles, ThumbsUp, Trash2, Volume2, X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ReactionType } from "@/types/posts";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getReactionIcon, getReactionLabel, getReactionColor, REACTIONS } from "./reaction-selector";
import { SafeDate } from "@/components/shared/safe-date";

// Server Actions
import {
    createPost, toggleReaction, toggleCommentLike, addComment, deletePost,
    deleteComment, editComment, archiveComment
} from "@/app/actions/posts";
import { generateCommentSuggestion } from "@/app/actions/ai";
import { toast } from "sonner"; // Using 'sonner' for toasts as per previous files

// Firebase Imports (Dynamic to avoid server issues)
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

// -- Components --

// Dynamic Player for Media Safe Rendering
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

// Helper: Video Detection
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

// Helper: YouTube ID Extraction
function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}


// --- Sub-Component: Comment Item ---
function CommentItem({
    comment,
    post,
    currentUserId
}: {
    comment: any, // Using 'any' briefly to match existing messy types, usually Post Comment type
    post: any,
    currentUserId?: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isArchived, setIsArchived] = useState(comment.isArchived || false);
    const [likes, setLikes] = useState<string[]>(comment.likes || []);

    if (isDeleted || isArchived) return null;

    const isAuthor = currentUserId && comment.author && currentUserId === comment.author.id;
    const authorName = comment.author?.displayName || comment.author?.email || "Unknown";
    const authorImage = comment.author?.imageUrl;
    const isLiked = currentUserId ? likes.includes(currentUserId) : false;

    const handleLike = async () => {
        if (!currentUserId) return toast.error("Login required");
        const newLikes = isLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId];
        setLikes(newLikes);
        try {
            await toggleCommentLike(post.id, comment.id, post.type || 'personal', post.context?.id);
        } catch {
            setLikes(likes); // Revert
            toast.error("Action failed");
        }
    };

    const handleSaveEdit = async () => {
        try {
            await editComment(post.id, comment.id, editContent, post.type || 'personal', post.context?.id);
            setIsEditing(false);
            toast.success("Updated");
        } catch { toast.error("Update failed"); }
    };

    const handleDelete = async () => {
        try {
            await deleteComment(post.id, comment.id, post.type || 'personal', post.context?.id);
            setIsDeleted(true);
        } catch { toast.error("Delete failed"); }
    };

    const handleArchive = async () => {
        try {
            await archiveComment(post.id, comment.id, post.type || 'personal', post.context?.id);
            setIsArchived(true);
        } catch { toast.error("Archive failed"); }
    };

    return (
        <div className="flex gap-3 text-sm mb-3 group/comment">
            <Avatar className="w-8 h-8 rounded-full border border-gray-100 shrink-0">
                <AvatarImage src={authorImage} />
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="bg-muted/50 rounded-2xl px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{authorName}</span>
                            <span className="text-xs text-muted-foreground">
                                <SafeDate date={comment.createdAt} />
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLike}>
                                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-pink-600 text-pink-600")} />
                            </Button>
                            {likes.length > 0 && <span className="text-xs">{likes.length}</span>}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2">
                            <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-8" autoFocus />
                            <Button size="sm" onClick={handleSaveEdit} className="h-8">Save</Button>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                    )}
                </div>

                {/* Media rendering for comments */}
                {comment.mediaUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-border">
                        {isUrlVideo(comment.mediaUrl) ? (
                            <video src={comment.mediaUrl} controls className="w-full max-h-[300px]" />
                        ) : (
                            <img src={comment.mediaUrl} alt="attachment" className="w-full h-auto" />
                        )}
                    </div>
                )}

                {/* Dropdown Actions for Author */}
                {isAuthor && (
                    <div className="pl-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">More</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleArchive}>Archive</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-500">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Component: PostCard ---

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    const { t } = useLanguage();
    const { user } = useAuth();

    // -- State --
    const [currentMyReaction, setCurrentMyReaction] = useState<ReactionType | undefined>(
        currentUserId && post.reactions ? post.reactions[currentUserId] : undefined
    );
    const [allReactions, setAllReactions] = useState(post.reactions || {});
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    const commentInputRef = useRef<HTMLInputElement>(null);

    // -- Derived Data --
    const author = post.author || { displayName: "Unknown" };
    const name = author.displayName || author.email || "Unknown"; // Fallback
    const profilePic = author.imageUrl;
    const isAuthor = currentUserId && post.author && currentUserId === post.author.id;

    // Safely extract YouTube link
    const youtubeMatch = useMemo(() => {
        if (!post.content) return null;
        return post.content.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);
    }, [post.content]);

    // -- Handlers --

    const onReaction = async (type: ReactionType) => {
        if (!currentUserId) return toast.error("Please log in");

        // Optimistic Update
        const previousReaction = currentMyReaction;
        const previousAll = { ...allReactions };
        const isRemoving = currentMyReaction === type;
        const newReaction = isRemoving ? undefined : type;

        setCurrentMyReaction(newReaction);
        setAllReactions((prev: any) => {
            const next = { ...prev };
            if (isRemoving) delete next[currentUserId];
            else next[currentUserId] = type;
            return next;
        });

        try {
            await toggleReaction(post.id, type, post.type || 'personal', post.context?.id);
        } catch (e) {
            // Rollback
            setCurrentMyReaction(previousReaction);
            setAllReactions(previousAll);
            toast.error("Reaction failed");
        }
    };

    const onDeletePost = async () => {
        setIsDeletingPost(true);
        try {
            await deletePost(post.id);
            toast.success("Post deleted");
        } catch {
            toast.error("Delete failed");
            setIsDeletingPost(false);
        }
    };

    const onSubmitComment = async () => {
        if (!commentText.trim() && !commentMediaUrl) return;
        try {
            await addComment(post.id, commentText, post.type || 'personal', post.context?.id, commentMediaUrl || undefined);
            setCommentText("");
            setCommentMediaUrl(null);
            setShowComments(true);
            toast.success("Comment added");
        } catch {
            toast.error("Failed to add comment");
        }
    };

    // AI & TTS Handlers (Safe Wrappers)
    const handleSpeak = () => {
        try {
            const u = new SpeechSynthesisUtterance(post.content || "");
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        } catch { toast.error("TTS unavailable"); }
    };

    const handleAI = (mode: string) => {
        try {
            window.dispatchEvent(new CustomEvent('famio:open-ai', {
                detail: { context: post.content, mode, type: 'post_context' }
            }));
        } catch { toast.error("AI service error"); }
    };

    const handleShare = async (mode: 'copy' | 'native' | 'repost') => {
        const url = `${window.location.origin}/post/${post.id}`;
        if (mode === 'copy') {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
        } else if (mode === 'native' && navigator.share) {
            navigator.share({ title: `Post by ${name}`, text: post.content, url }).catch(() => { });
        } else if (mode === 'repost') {
            try {
                await createPost(`🔄 Reposted from ${name}:\n\n${post.content}`, post.mediaUrls || []);
                toast.success("Reposted!");
            } catch { toast.error("Repost failed"); }
        }
    };

    // File Upload for Comments
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(true);
        try {
            const auth = getAuth();
            if (!auth.currentUser) throw new Error("No auth");
            const storage = getStorage();
            const storageRef = ref(storage, `users/${user.uid}/comments/${Date.now()}-${file.name}`);
            const snap = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snap.ref);
            setCommentMediaUrl(url);
            toast.success("File attached");
        } catch {
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    // Speech Recon
    const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
        onResult: (res) => setCommentText(prev => (prev ? prev + " " + res : res))
    });


    // -- Render --
    return (
        <Card className="mb-4 overflow-hidden glass-card border-none rounded-lg relative group">
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-gray-200">
                    <AvatarImage src={profilePic || undefined} />
                    <AvatarFallback className="bg-primary text-white font-bold">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-card-foreground text-[15px]">{name}</span>
                        {/* Group Context (Safe Render) */}
                        {post.context?.type === 'group' && (
                            <>
                                <span className="text-muted-foreground text-xs">▶</span>
                                <span className="font-semibold text-card-foreground text-[15px]">{post.context.name}</span>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-normal hover:underline cursor-pointer">
                        <SafeDate date={post.createdAt} />
                    </span>
                </div>

                {/* Delete Post Button (Author Only) */}
                {isAuthor && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                                <AlertDialogDescription>Cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDeletePost} className="bg-red-500" disabled={isDeletingPost}>
                                    {isDeletingPost ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>

            <CardContent className="px-4 py-2">
                <p className="whitespace-pre-wrap text-card-foreground text-[15px] leading-normal">{post.content}</p>

                {/* YouTube Embed */}
                {youtubeMatch && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black aspect-video relative group">
                        <ReactPlayer url={youtubeMatch[0]} width="100%" height="100%" controls />
                        <a href={youtubeMatch[0]} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}

                {/* Post Media */}
                {post.mediaUrls?.map((url: string, idx: number) => (
                    <div key={idx} className="mt-3 -mx-4">
                        {isUrlVideo(url) ? (
                            <video src={url} controls className="w-full max-h-[600px] bg-black" />
                        ) : (
                            <img src={url} alt="Post media" className="w-full h-auto max-h-[600px] object-cover" />
                        )}
                    </div>
                ))}
            </CardContent>

            <CardFooter className="flex-col !items-stretch px-2 py-1 mx-2 mt-1 border-t border-border">
                {/* Stats Row */}
                <div className="flex justify-between items-center text-xs text-muted-foreground w-full mb-2 px-1">
                    <div className="flex items-center gap-1">
                        {/* Reaction Icons preview */}
                        {Object.keys(allReactions).length > 0 && <span>{Object.keys(allReactions).length} reactions</span>}
                    </div>
                    {post.comments?.length > 0 && (
                        <div className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
                            {post.comments.length} comments
                        </div>
                    )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-between items-center w-full mb-1">
                    {/* 1. Like / Reaction */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("flex-1 gap-2", currentMyReaction ? "text-pink-600" : "text-muted-foreground")}>
                                <span className="text-xl">{getReactionIcon(currentMyReaction)}</span>
                                <span>Like</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="flex gap-1 p-2">
                            {REACTIONS.map(r => (
                                <DropdownMenuItem key={r.type} onClick={() => onReaction(r.type)} className="text-2xl cursor-pointer hover:scale-125 transition-transform">
                                    {r.emoji}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 2. Comment */}
                    <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex-1 gap-2 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                    </Button>

                    {/* 3. Ask AI */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-indigo-500">
                                <Sparkles className="w-4 h-4" />
                                <span>AI</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleAI('executive')}>Summarize</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAI('tutor')}>Explain</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSpeak}>Read Aloud</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 4. Share */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShare('repost')}>Repost</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('copy')}>Copy Link</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('native')}>Share Externally</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="w-full mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {/* Input Area */}
                        <div className="flex gap-2 items-start">
                            <Avatar className="w-8 h-8 rounded-full">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback>Me</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    className="pr-24"
                                    onKeyDown={e => e.key === 'Enter' && onSubmitComment()}
                                />

                                <div className="absolute right-1 top-1 flex items-center gap-1">
                                    {/* Magic Suggestion */}
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-purple-500" onClick={async () => {
                                        try {
                                            const s = await generateCommentSuggestion(post.content);
                                            setCommentText(s);
                                        } catch { toast.error("AI Error"); }
                                    }}>
                                        <Sparkles className="w-4 h-4" />
                                    </Button>

                                    {/* Voice Input */}
                                    {isSupported && (
                                        <Button size="icon" variant="ghost" className={cn("h-7 w-7", isListening && "text-red-500 animate-pulse")}
                                            onClick={isListening ? stopListening : startListening}>
                                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </Button>
                                    )}

                                    {/* File Upload Icon */}
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => commentInputRef.current?.click()}>
                                        <ImageIcon className="w-4 h-4" />
                                    </Button>
                                    <input
                                        type="file"
                                        hidden
                                        ref={commentInputRef}
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                            </div>
                            <Button size="icon" onClick={onSubmitComment} disabled={!commentText.trim() && !commentMediaUrl}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Upload Indicator */}
                        {isUploading && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading media...</div>}
                        {commentMediaUrl && <div className="text-xs text-green-600">Media attached</div>}

                        {/* Comments List */}
                        <div className="space-y-4 pt-2">
                            {post.comments?.map((comment: any) => (
                                <CommentItem key={comment.id} comment={comment} post={post} currentUserId={currentUserId} />
                            ))}
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
