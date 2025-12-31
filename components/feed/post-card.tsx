'use client'

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toggleLike, addComment, deletePost } from "@/app/actions/posts";
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
import { createPost } from "@/app/actions/posts";
import { Heart, MessageCircle, Share2, Trash2, Send, Sparkles, Repeat2 } from "lucide-react";

type Comment = {
    id: number;
    content: string;
    createdAt: Date;
    author: {
        id: string;
        profileData: unknown;
    };
}

type Post = {
    id: number;
    content: string;
    mediaUrls: string[] | null;
    createdAt: Date;
    author: {
        id: string;
        email: string;
        profileData: unknown;
    };
    likes: string[] | null;
    comments?: Comment[];
}

export function PostCard({ post, currentUserId }: { post: Post, currentUserId?: string }) {
    const profile = post.author.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null;
    const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : post.author.email;
    const initials = name.slice(0, 2).toUpperCase();

    const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId || ""));
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLike = async () => {
        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await toggleLike(post.id);
        } catch {
            // Revert on failure
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
            toast.error("Failed to like post");
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;

        try {
            await addComment(post.id, commentText);
            setCommentText("");
            toast.success("Comment added!");
        } catch {
            toast.error("Failed to add comment");
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Post by ${name}`,
            text: post.content,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or failed
                console.log("Share cancelled");
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${post.content}\n\n- Shared from WeAreFamily`);
                toast.success("Copied to clipboard! 📋");
            } catch {
                toast.error("Failed to share");
            }
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

    const isAuthor = currentUserId === post.author.id;

    return (
        <Card className="mb-4 overflow-hidden glass-card border-none rounded-lg relative group">
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-gray-200">
                    <AvatarImage src={profile?.imageUrl} />
                    <AvatarFallback className="bg-primary text-white font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <span className="font-semibold text-card-foreground text-[15px]">{name}</span>
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

                {(likesCount > 0 || (post.comments && post.comments.length > 0)) && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-3 px-1">
                        {likesCount > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="bg-primary rounded-full p-1">
                                    <Heart className="w-2 h-2 text-primary-foreground fill-primary-foreground" />
                                </div>
                                <span>{likesCount}</span>
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
                    <Button
                        variant="ghost"
                        onClick={handleLike}
                        className={`flex-1 gap-2 hover:bg-muted h-9 font-medium rounded-md ${isLiked ? "text-primary" : "text-muted-foreground"}`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? "fill-primary" : ""}`} />
                        <span className="text-[15px]">Like</span>
                    </Button>
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
                            <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer">
                                <Share2 className="w-4 h-4" />
                                Share Externally
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {showComments && (
                    <div className="w-full pt-2 border-t border-border animate-in slide-in-from-top-2">
                        {post.comments?.map(comment => (
                            <div key={comment.id} className="flex gap-2 mb-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={(comment.author.profileData as any)?.imageUrl} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-2xl px-3 py-2">
                                    <span className="font-semibold text-xs block text-card-foreground">
                                        {(comment.author.profileData as any)?.firstName || 'User'}
                                    </span>
                                    <span className="text-sm text-card-foreground">{comment.content}</span>
                                </div>
                            </div>
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
