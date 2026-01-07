'use client';

// Level 2.5: Basic Interactions (No Dropdowns, No Deep Hooks)
// Goal: Enable Like and Commenting to verify Server Actions and local state work.

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeDate } from "@/components/shared/safe-date";
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleReaction, addComment } from "@/app/actions/posts";
import { ReactionType } from "@/types/posts";

// Dynamic Player
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper: Video Detection
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    if (!post) return null;

    // -- minimalistic state --
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Optimistic Reaction State
    const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
        currentUserId && post.reactions ? post.reactions[currentUserId] : undefined
    );
    const [reactionCount, setReactionCount] = useState(post.reactions ? Object.keys(post.reactions).length : 0);

    const author = post.author || { displayName: "Unknown" };
    const name = author.displayName || author.email || "Unknown";
    const profilePic = author.imageUrl;
    const youtubeMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);

    // -- Handlers (Simple) --

    const handleLike = async () => {
        if (!currentUserId) return toast.error("Please login");

        const isLiked = !!currentReaction;
        // Optimistic UI
        setCurrentReaction(isLiked ? undefined : 'like');
        setReactionCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            // Toggle 'like' specifically
            await toggleReaction(post.id, 'like', post.type || 'personal', post.context?.id);
        } catch {
            // Rollback
            setCurrentReaction(currentReaction);
            setReactionCount(post.reactions ? Object.keys(post.reactions).length : 0);
            toast.error("Failed to like");
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !currentUserId) return;
        setIsSubmitting(true);
        try {
            await addComment(post.id, commentText, post.type || 'personal', post.context?.id);
            setCommentText("");
            toast.success("Comment added");
            // Real-time update isn't here yet without listeners, but toast confirms action
        } catch {
            toast.error("Failed to comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mb-4 overflow-hidden border-none shadow-sm bg-card">
            {/* Header */}
            <div className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profilePic || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-sm">{name}</span>
                        {post.context?.type === 'group' && (
                            <>
                                <span className="text-muted-foreground text-xs">▶</span>
                                <span className="font-semibold text-sm">{post.context.name}</span>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground"><SafeDate date={post.createdAt} /></span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
            </div>

            {/* Content */}
            <div className="px-4 py-2">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{post.content}</p>
                {youtubeMatch && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black aspect-video relative group">
                        <ReactPlayer url={youtubeMatch[0]} width="100%" height="100%" controls />
                    </div>
                )}
                {post.mediaUrls?.map((url: string, idx: number) => (
                    <div key={idx} className="mt-3 rounded-xl overflow-hidden border border-border">
                        {isUrlVideo(url) ? <video src={url} controls className="w-full max-h-[600px] bg-black" /> : <img src={url} alt="media" className="w-full h-auto max-h-[600px] object-cover" />}
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col px-2 py-1 mx-2 mt-1 border-t border-border">
                <div className="flex justify-between items-center text-xs text-muted-foreground w-full mb-2 px-1 pt-2">
                    <span className={cn(currentReaction && "text-pink-600 font-medium")}>{reactionCount} reactions</span>
                    <span>{post.comments ? post.comments.length : 0} comments</span>
                </div>

                <div className="flex justify-between items-center w-full mb-1">
                    {/* Like - Direct Toggle */}
                    <Button variant="ghost" onClick={handleLike} className={cn("flex-1 gap-2 hover:bg-pink-50", currentReaction && "text-pink-600")}>
                        <Heart className={cn("w-5 h-5", currentReaction && "fill-current")} />
                        <span>Like</span>
                    </Button>

                    {/* Comment - Toggle View */}
                    <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex-1 gap-2 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                    </Button>

                    {/* AI & Share - Visual Only for now */}
                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground" onClick={() => toast.info("Coming soon")}>
                        <Sparkles className="w-4 h-4" />
                        <span>AI</span>
                    </Button>
                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground" onClick={() => toast.info("Coming soon")}>
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                    </Button>
                </div>

                {/* Simple Comment Area */}
                {showComments && (
                    <div className="w-full mt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                            />
                            <Button size="icon" onClick={handleCommentSubmit} disabled={isSubmitting || !commentText}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="space-y-3 pl-2">
                            {post.comments?.map((c: any) => (
                                <div key={c.id} className="text-sm bg-muted/40 p-2 rounded-lg">
                                    <div className="font-semibold text-xs mb-1 flex justify-between">
                                        {c.author?.displayName || "User"}
                                        <span className="font-normal text-muted-foreground"><SafeDate date={c.createdAt} /></span>
                                    </div>
                                    <p>{c.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
