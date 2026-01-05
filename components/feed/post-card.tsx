'use client'

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { generateCommentSuggestion } from "@/app/actions/ai";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    createPost,
    toggleReaction,
    toggleCommentLike,
    addComment,
    deletePost,
    deleteComment,
    editComment,
    archiveComment,
    ReactionType
} from "@/app/actions/posts";
import { useLanguage } from "@/components/language-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
    Archive,
    BookHeart,
    Briefcase,
    ExternalLink,
    GraduationCap,
    Heart,
    Image as ImageIcon,
    Loader2,
    MessageCircle,
    Mic,
    MicOff,
    MoreHorizontal,
    Pencil,
    Repeat2,
    Send,
    Share2,
    Sparkles,
    ThumbsUp,
    Trash2,
    Volume2,
    X,
    Youtube
} from "lucide-react";
import { getReactionIcon, getReactionLabel, getReactionColor, ReactionSelector, REACTIONS } from "./reaction-selector";
import { useAuth } from "@/components/auth-provider";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useEffect } from "react";
import { StopCircle } from "lucide-react";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper to detect video URLs
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    // Remove query params (Firebase tokens)
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') ||
        cleanUrl.endsWith('.mov') ||
        cleanUrl.endsWith('.webm') ||
        cleanUrl.endsWith('.ogg');
}

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    isArchived?: boolean;
    likes?: string[];
    author: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        email?: string | null;
    } | null;
}

// Helper to get YouTube ID from URL
function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function CommentItem({
    comment,
    post,
    currentUserId
}: {
    comment: Comment & { mediaUrl?: string, youtubeUrl?: string },
    post: Post,
    currentUserId?: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isArchived, setIsArchived] = useState(comment.isArchived || false);

    const [likes, setLikes] = useState<string[]>(comment.likes || []);

    useEffect(() => {
        setLikes(comment.likes || []);
    }, [comment.likes]);

    if (isDeleted || isArchived) return null;

    const isAuthor = currentUserId && comment.author && currentUserId === comment.author.id;
    const authorName = comment.author?.displayName || comment.author?.email || "Unknown";
    const authorImage = comment.author?.imageUrl || undefined;

    const handleSaveEdit = async () => {
        try {
            await editComment(post.id, comment.id, editContent, post.type || 'personal', post.context?.id);
            setIsEditing(false);
            toast.success("Comment updated");
        } catch {
            toast.error("Failed to update comment");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteComment(post.id, comment.id, post.type || 'personal', post.context?.id);
            setIsDeleted(true);
            toast.success("Comment deleted");
        } catch {
            toast.error("Failed to delete comment");
        }
    };

    const handleArchive = async () => {
        try {
            await archiveComment(post.id, comment.id, post.type || 'personal', post.context?.id);
            setIsArchived(true);
            toast.success("Comment archived");
        } catch {
            toast.error("Failed to archive comment");
        }
    };

    const isLiked = currentUserId ? likes.includes(currentUserId) : false;

    const handleLike = async () => {
        if (!currentUserId) {
            toast.error("Please log in to like comments");
            return;
        }

        const originalLikes = [...likes];
        const newLikes = isLiked
            ? likes.filter(id => id !== currentUserId)
            : [...likes, currentUserId];

        setLikes(newLikes);

        try {
            await toggleCommentLike(post.id, comment.id, post.type || 'personal', post.context?.id);
        } catch (error) {
            setLikes(originalLikes);
            toast.error("Failed to like comment");
        }
    };

    return (
        <div className="flex gap-3 text-sm mb-3 group/comment">
            <Avatar className="w-8 h-8 rounded-full border border-gray-100 dark:border-white/10 shrink-0">
                <AvatarImage src={authorImage} />
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="bg-muted/50 rounded-2xl px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{authorName}</span>
                            <span className="text-xs text-gray-500">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-6 w-6 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/20 hover:text-pink-600 transition-colors",
                                    isLiked ? "text-pink-600 bg-pink-50 dark:bg-pink-900/10" : "text-muted-foreground"
                                )}
                                onClick={handleLike}
                                title={isLiked ? "Unlike" : "Like"}
                            >
                                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                            </Button>
                            {likes.length > 0 && <span className="text-xs text-muted-foreground">{likes.length}</span>}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2 items-center">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <Button size="sm" onClick={handleSaveEdit} className="h-8">Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8">Cancel</Button>
                        </div>
                    ) : (
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    )}
                </div>

                {/* Media Attachments */}
                {comment.mediaUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-border">
                        {isUrlVideo(comment.mediaUrl) ? (
                            <div className="relative group w-full bg-black">
                                <video
                                    src={comment.mediaUrl}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-auto max-h-[300px] object-contain"
                                    onError={() => toast.error("Playback failed")}
                                />
                            </div>
                        ) : (
                            <img src={comment.mediaUrl} alt="Comment attachment" className="w-full h-auto" />
                        )}
                    </div>
                )}
                {comment.youtubeUrl && getYoutubeId(comment.youtubeUrl) && (
                    <div className="mt-2 rounded-xl overflow-hidden max-w-sm aspect-video border border-border relative group">
                        <ReactPlayer
                            url={`https://www.youtube.com/watch?v=${getYoutubeId(comment.youtubeUrl)}`}
                            width="100%"
                            height="100%"
                            controls
                            onError={() => toast.error("Could not play video", { description: "Try opening it directly." })}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pl-2">
                    {isAuthor && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                                    More
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="w-3 h-3 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleArchive}>
                                    <Archive className="w-3 h-3 mr-2" />
                                    Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
}


type Post = {
    id: string;
    content: string;
    mediaUrls: string[] | null;
    createdAt: Date;
    author: {
        id: string;
        email?: string | null;
        displayName?: string | null;
        imageUrl?: string | null;
    } | null;
    likes: string[] | null; // Keep for backward compatibility/types
    reactions?: Record<string, ReactionType>;
    comments?: Comment[];
    context?: {
        type: 'group' | 'branding';
        name: string;
        id: string;
    } | null;
    type?: 'personal' | 'group' | 'branding';
}

export function PostCard({ post, currentUserId }: { post: Post, currentUserId?: string }) {
    const { t } = useLanguage();
    const author = post.author;
    const profile = author ? {
        displayName: author.displayName || author.email || "Unknown",
        imageUrl: author.imageUrl
    } : { displayName: "Unknown User", imageUrl: undefined };

    // Prioritize displayName, then email
    const name = profile.displayName || "Unknown User";
    const initials = name.slice(0, 2).toUpperCase();

    const reactionsMap = post.reactions || {};
    const myReaction = currentUserId ? reactionsMap[currentUserId] : undefined;

    const [currentMyReaction, setCurrentMyReaction] = useState<ReactionType | undefined>(myReaction);
    const [allReactions, setAllReactions] = useState<Record<string, ReactionType>>(reactionsMap);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null);
    const [commentYoutubeUrl, setCommentYoutubeUrl] = useState("");
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [isUploadingComment, setIsUploadingComment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Import storage for comment uploads
    const { user } = useAuth(); // We need auth context for upload checks
    const [commentFileInputRef] = useState<any>({ current: null }); // Placeholder ref, real one below

    const { isListening: isCommentListening, startListening: startCommentListening, stopListening: stopCommentListening, isSupported: isSpeechSupported } = useSpeechRecognition({
        onResult: (result) => setCommentText(prev => prev ? prev + " " + result : result)
    });
    const handleReaction = async (type: ReactionType) => {
        if (!currentUserId) {
            toast.error(t("auth.login_required") || "Please log in to react");
            return;
        }

        try {
            // Optimistic update
            const isRemoving = currentMyReaction === type;
            const newMyReaction = isRemoving ? undefined : type;

            setCurrentMyReaction(newMyReaction);
            setAllReactions(prev => {
                const next = { ...prev };
                if (isRemoving) {
                    delete next[currentUserId];
                } else {
                    next[currentUserId] = type;
                }
                return next;
            });

            await toggleReaction(post.id, type, post.type || 'personal', post.context?.id);
        } catch (error) {
            console.error("Reaction failed:", error);
            // Revert on failure
            setCurrentMyReaction(currentMyReaction);
            setAllReactions(reactionsMap);
            toast.error(t("profile.update.error") || "Failed to update reaction");
        }
    };


    const handleComment = async () => {
        if (!commentText.trim() && !commentMediaUrl && !commentYoutubeUrl) return;

        try {
            await addComment(post.id, commentText, post.type || 'personal', post.context?.id, commentMediaUrl || undefined, commentYoutubeUrl || undefined);
            setCommentText("");
            setCommentMediaUrl(null);
            setCommentYoutubeUrl("");
            setShowYoutubeInput(false);
            toast.success(t("feed.comment.success") || "Comment added!");
        } catch {
            toast.error(t("feed.comment.error") || "Failed to add comment");
        }
    };

    const handleCommentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            toast.error("Please log in.");
            return;
        }

        if (e.target.files && e.target.files[0]) {
            setIsUploadingComment(true);
            try {
                const file = e.target.files[0];

                // Strict SDK Auth Check
                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                if (!auth.currentUser) {
                    toast.error("Auth sync error. Please refresh.");
                    return;
                }

                const { storage } = await import("@/lib/firebase");
                const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

                // Use 'users/' path to match our working storage rules
                const storageRef = ref(storage, `users/${user.uid}/comments/${Date.now()}-${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);

                setCommentMediaUrl(url);
                toast.success("Image attached");
            } catch (error: any) {
                console.error("Comment upload failed", error);
                toast.error("Upload failed");
            } finally {
                setIsUploadingComment(false);
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}/post/${post.id}`;
            await navigator.clipboard.writeText(url);
            toast.success(t("feed.share.copy.success") || "Link copied to clipboard! 📋");
        } catch {
            toast.error(t("feed.share.copy.error") || "Failed to copy link");
        }
    };

    const handleExternalShare = async () => {
        const shareData = {
            title: `Post by ${name}`,
            text: post.content,
            url: `${window.location.origin}/post/${post.id}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            handleCopyLink();
        }
    };

    const handleRepost = async () => {
        try {
            const repostContent = `🔄 Reposted from ${name}:\n\n${post.content}`;
            await createPost(repostContent, post.mediaUrls || []);
            toast.success(t("feed.repost.success") || "Shared to your feed! 🔄");
        } catch {
            toast.error(t("feed.repost.error") || "Failed to repost");
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            toast.success(t("feed.delete.success") || "Post deleted");
        } catch {
            toast.error(t("feed.delete.error") || "Failed to delete post");
            setIsDeleting(false);
        }
    };

    const isAuthor = currentUserId && post.author && currentUserId === post.author.id;

    return (
        <Card className="mb-4 overflow-hidden glass-card border-none rounded-lg relative group">
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-gray-200">
                    <AvatarImage src={profile?.imageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-white font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-card-foreground text-[15px]">{name}</span>
                        {post.context && post.context.type === 'group' && (
                            <>
                                <span className="text-muted-foreground text-xs">▶</span>
                                <span className="font-semibold text-card-foreground text-[15px] hover:underline cursor-pointer">
                                    {post.context.name}
                                </span>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-normal hover:underline cursor-pointer">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {isAuthor && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove this memory? This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white" disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>
            <CardContent className="px-4 py-2">
                <p className="whitespace-pre-wrap text-card-foreground text-[15px] leading-normal">{post.content}</p>

                {/* Auto-embed YouTube if link detected in content */}
                {(() => {
                    // Capture URL but exclude trailing punctuation commonly found in sentences
                    const ytMatch = post.content.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);
                    if (ytMatch) {
                        return (
                            <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black relative group">
                                <div className="aspect-video w-full">
                                    <ReactPlayer
                                        url={ytMatch[0]}
                                        width="100%"
                                        height="100%"
                                        controls
                                        onError={() => toast.error("Could not play video", { description: "Try opening it directly." })}
                                    />
                                </div>
                                <a
                                    href={ytMatch[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Open on YouTube"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        );
                    }
                    return null;
                })()}

                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-3 -mx-4">
                        {post.mediaUrls.map((url, idx) => {
                            const isVideo = isUrlVideo(url);
                            return isVideo ? (
                                <div key={idx} className="relative group w-full bg-black border-t border-b border-border">
                                    <video
                                        src={url}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-auto max-h-[600px] object-contain"
                                        onError={(e: any) => {
                                            console.error("Video error:", e);
                                            toast.error("Video playback failed", { description: "Try the 'Open Video' button." });
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Open file directly"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            ) : (
                                <img key={idx} src={url} alt="Post media" className="w-full h-auto object-cover max-h-[600px] border-t border-b border-border" />
                            );
                        })}
                    </div>
                )}

                {(Object.keys(allReactions).length > 0 || (post.comments && post.comments.length > 0)) && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 px-1">
                        {Object.keys(allReactions).length > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="flex -space-x-1">
                                    {Array.from(new Set(Object.values(allReactions))).slice(0, 3).map((type, idx) => (
                                        <span key={idx} className="z-[1]">{getReactionIcon(type)}</span>
                                    ))}
                                </div>
                                <span className="ml-1">{Object.keys(allReactions).length}</span>
                            </div>
                        )}
                        {post.comments && post.comments.length > 0 && (
                            <div className="ml-auto hover:underline cursor-pointer" onClick={() => setShowComments(!showComments)}>
                                {post.comments.length} comments
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col !items-stretch px-2 py-1 mx-2 mt-1 border-t border-border">
                <div className="flex justify-between items-center text-muted-foreground w-full mb-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "flex-1 gap-2 hover:bg-muted h-9 font-medium rounded-md transition-all duration-200",
                                    currentMyReaction ? getReactionColor(currentMyReaction) : "text-muted-foreground"
                                )}
                            >
                                <span className="text-xl">{getReactionIcon(currentMyReaction)}</span>
                                <span className="text-[15px]">{getReactionLabel(currentMyReaction)}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-auto p-2">
                            <div className="flex items-center gap-1">
                                {REACTIONS.map((reaction: any) => (
                                    <DropdownMenuItem
                                        key={reaction.type}
                                        onClick={() => handleReaction(reaction.type)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-full cursor-pointer transition-transform hover:scale-125 focus:bg-muted",
                                            currentMyReaction === reaction.type && "bg-muted"
                                        )}
                                        title={reaction.label}
                                    >
                                        <span className="text-2xl">{reaction.emoji}</span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        onClick={() => setShowComments(!showComments)}
                        className="flex-1 gap-2 hover:bg-muted h-9 font-medium text-muted-foreground rounded-md"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[15px]">{t("btn.comment")}</span>
                    </Button>

                    {/* TTS Quick Button */}
                    <Button
                        variant="ghost"
                        className="flex-none px-3 gap-2 hover:bg-muted h-9 font-medium text-muted-foreground rounded-md"
                        onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(post.content || "This post has no text content.");
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(utterance);
                        }}
                        title="Read Post"
                    >
                        <Volume2 className="w-5 h-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex-1 gap-2 hover:bg-indigo-50 hover:text-indigo-600 h-9 font-medium text-muted-foreground rounded-md transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[15px]">Ask AI</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                            <DropdownMenuItem
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('famio:open-ai', {
                                        detail: { context: post.content, mode: 'executive', type: 'post_context' }
                                    }));
                                }}
                                className="gap-2"
                            >
                                <Briefcase className="w-4 h-4" />
                                Summarize (Executive)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('famio:open-ai', {
                                        detail: { context: post.content, mode: 'tutor', type: 'post_context' }
                                    }));
                                }}
                                className="gap-2"
                            >
                                <GraduationCap className="w-4 h-4" />
                                Explain (Tutor)
                            </DropdownMenuItem>

                            {/* TTS Option */}
                            <DropdownMenuItem
                                onClick={() => {
                                    // Use the window.speechSynthesis directly or trigger a custom event if the hook is not available in this scope
                                    // But we CAN use the hook here since we are inside the component
                                    const utterance = new SpeechSynthesisUtterance(post.content || "This post has no text content.");
                                    window.speechSynthesis.cancel(); // Stop any previous
                                    window.speechSynthesis.speak(utterance);
                                }}
                                className="gap-2 cursor-pointer"
                            >
                                <Volume2 className="w-4 h-4" />
                                Read Aloud
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('famio:open-ai', {
                                        detail: { context: post.content, mode: 'biographer', type: 'post_context' }
                                    }));
                                }}
                                className="gap-2"
                            >
                                <BookHeart className="w-4 h-4" />
                                Save as Memory (Biographer)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex-1 gap-2 hover:bg-muted h-9 font-medium text-muted-foreground rounded-md transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-[15px]">{t("btn.share")}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleRepost} className="gap-2 cursor-pointer">
                                <Repeat2 className="w-4 h-4" />
                                Repost to Feed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                                <Share2 className="w-4 h-4" />
                                Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExternalShare} className="gap-2 cursor-pointer">
                                <Share2 className="w-4 h-4" />
                                Share Externally
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const event = new CustomEvent('famio:open-ai', {
                                        detail: {
                                            context: post.content,
                                            type: 'post_context'
                                        }
                                    });
                                    window.dispatchEvent(event);
                                    toast.success("Opened in AI Assistant! 🧠", { duration: 1500 });
                                }}
                                className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600"
                            >
                                <Sparkles className="w-4 h-4" />
                                Ask AI about this...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {showComments && (
                    <div className="w-full pt-2 border-t border-border animate-in slide-in-from-top-2">
                        {post.comments?.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                post={post}
                                currentUserId={currentUserId}
                            />
                        ))}

                        <div className="flex gap-2 mt-2 items-center">
                            <Avatar className="w-8 h-8">
                                {/* Current user avatar would be nice here but we'll use placeholder or pass it down */}
                                <AvatarFallback className="bg-muted text-muted-foreground">Me</AvatarFallback>
                            </Avatar>
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Write a comment..."
                                    className="bg-muted border-none rounded-full h-9 pl-4 pr-20 text-card-foreground placeholder:text-muted-foreground"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                />
                                <div className="absolute right-1 top-1 flex gap-1">
                                    <input
                                        type="file"
                                        hidden
                                        ref={commentFileInputRef}
                                        accept="image/*,video/*,.mov"
                                        onChange={handleCommentFileSelect}
                                    />

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn("h-7 w-7 rounded-full", showYoutubeInput ? "text-red-500 bg-red-50" : "text-muted-foreground hover:bg-muted")}
                                        onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                                        title="Add YouTube Video"
                                    >
                                        <Youtube className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn("h-7 w-7 rounded-full", commentMediaUrl ? "text-blue-500 bg-blue-50" : "text-muted-foreground hover:bg-muted")}
                                        onClick={() => commentFileInputRef.current?.click()}
                                        disabled={isUploadingComment}
                                        title="Upload Photo or Video"
                                    >
                                        {isUploadingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-purple-500 hover:bg-purple-100 rounded-full"
                                        onClick={async () => {
                                            try {
                                                const suggestion = await generateCommentSuggestion(post.content);
                                                setCommentText(suggestion);
                                                toast.success("Magic comment ready! ✨");
                                            } catch {
                                                toast.error("Magic failed. Try again!");
                                            }
                                        }}
                                        title="Magic AI Reply"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn("h-7 w-7 rounded-full", isCommentListening ? "text-red-500 bg-red-50 animate-pulse" : "text-muted-foreground hover:bg-muted")}
                                        onClick={isCommentListening ? stopCommentListening : startCommentListening}
                                        title="Voice Input"
                                    >
                                        {isCommentListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-primary hover:bg-primary/10 rounded-full"
                                        onClick={handleComment}
                                        disabled={(!commentText.trim() && !commentMediaUrl && !commentYoutubeUrl) || isUploadingComment}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Attachments Preview Area */}
                            {(showYoutubeInput || commentMediaUrl || commentYoutubeUrl) && (
                                <div className="mt-2 pl-10 space-y-2">
                                    {showYoutubeInput && (
                                        <Input
                                            placeholder="Paste YouTube Link..."
                                            className="h-8 text-xs"
                                            value={commentYoutubeUrl}
                                            onChange={(e) => setCommentYoutubeUrl(e.target.value)}
                                        />
                                    )}
                                    {commentMediaUrl && (
                                        <div className="relative inline-block">
                                            <img src={commentMediaUrl} className="h-20 w-auto rounded-md border" alt="Preview" />
                                            <button
                                                onClick={() => setCommentMediaUrl(null)}
                                                className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card >
    );
}
