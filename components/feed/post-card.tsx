'use client'

import { useState } from "react";
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
import { createPost, toggleReaction, addComment, deletePost, ReactionType } from "@/app/actions/posts";
import { Heart, MessageCircle, Share2, Trash2, Send, Sparkles, Repeat2 } from "lucide-react";
import { getReactionIcon, getReactionLabel, getReactionColor, ReactionSelector } from "./reaction-selector";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    author: {
        id: string;
        displayName?: string | null;
        imageUrl?: string | null;
        email?: string | null;
    } | null;
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
    const [isDeleting, setIsDeleting] = useState(false);

    const handleReaction = async (type: ReactionType) => {
        // Optimistic update
        const isRemoving = currentMyReaction === type;
        const newMyReaction = isRemoving ? undefined : type;

        setCurrentMyReaction(newMyReaction);
        setAllReactions(prev => {
            const next = { ...prev };
            if (isRemoving) {
                delete next[currentUserId || ""];
            } else {
                next[currentUserId || ""] = type;
            }
            return next;
        });

        try {
            await toggleReaction(post.id, type, post.type || 'personal', post.context?.id);
        } catch {
            // Revert on failure
            setCurrentMyReaction(currentMyReaction);
            setAllReactions(reactionsMap);
            toast.error("Failed to update reaction");
        }
    };


    const handleComment = async () => {
        if (!commentText.trim()) return;

        try {
            await addComment(post.id, commentText, post.type || 'personal', post.context?.id);
            setCommentText("");
            toast.success("Comment added!");
        } catch {
            toast.error("Failed to add comment");
        }
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}/post/${post.id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard! 📋");
        } catch {
            toast.error("Failed to copy link");
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
            toast.success("Shared to your feed! 🔄");
        } catch {
            toast.error("Failed to repost");
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            toast.success("Post deleted");
        } catch {
            toast.error("Failed to delete post");
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
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-3 -mx-4">
                        {post.mediaUrls.map((url, idx) => (
                            <img key={idx} src={url} alt="Post media" className="w-full h-auto object-cover max-h-[600px] border-t border-b border-border" />
                        ))}
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
                    <Popover>
                        <PopoverTrigger asChild>
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
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="start" sideOffset={10}>
                            <ReactionSelector onSelect={handleReaction} currentReaction={currentMyReaction} />
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="ghost"
                        onClick={() => setShowComments(!showComments)}
                        className="flex-1 gap-2 hover:bg-muted text-muted-foreground h-9 font-medium rounded-md"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[15px]">Comment</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex-1 gap-2 hover:bg-muted text-muted-foreground h-9 font-medium rounded-md"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-[15px]">Share</span>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {showComments && (
                    <div className="w-full pt-2 border-t border-border animate-in slide-in-from-top-2">
                        {post.comments?.map(comment => {
                            const commentAuthor = comment.author;
                            const commentAuthorName = commentAuthor?.displayName || commentAuthor?.email || "Unknown";
                            const commentAuthorImage = commentAuthor?.imageUrl || undefined;

                            return (
                                <div key={comment.id} className="flex gap-3 text-sm mb-3">
                                    <Avatar className="w-8 h-8 rounded-full border border-gray-100 dark:border-white/10 shrink-0">
                                        <AvatarImage src={commentAuthorImage} />
                                        <AvatarFallback>{commentAuthorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{commentAuthorName}</span>
                                            <span className="text-xs text-gray-500">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                    </div>
                                </div>
                            );
                        })}

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
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-purple-500 hover:bg-purple-100 rounded-full"
                                        onClick={async () => {
                                            if (commentText) return; // Don't overwrite if user typed something? Or maybe append?
                                            // Actually let's just generate fresh.
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
                                        className="h-7 w-7 text-primary hover:bg-primary/10 rounded-full"
                                        onClick={handleComment}
                                        disabled={!commentText.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
