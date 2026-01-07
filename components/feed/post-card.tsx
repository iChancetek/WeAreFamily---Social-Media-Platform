'use client';

// Level 3: Full Feature Restoration
// Goal: Re-enable DropdownMenus for Custom Reactions, AI, and Share.
// We are careful to import DropdownMenu correctly to avoid crashes.

import { useState, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeDate } from "@/components/shared/safe-date";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Actions
import { toggleReaction, addComment, createPost } from "@/app/actions/posts";
import { ReactionType } from "@/types/posts";
import { REACTIONS, getReactionIcon, getReactionLabel } from "./reaction-selector";

// Dynamic Player
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper: Video Detection
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    if (!post || post.isDeleted) return null; // Don't show deleted posts (unless we are in a 'Trash' view, handled elsewhere)

    // -- State --
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Translation State
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Reaction State
    const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
        currentUserId && post.reactions ? post.reactions[currentUserId] : undefined
    );
    const [reactionCount, setReactionCount] = useState(post.reactions ? Object.keys(post.reactions).length : 0);

    // Comment State (Real-time)
    const [comments, setComments] = useState<any[]>(post.comments || []);

    const author = post.author || { displayName: "Unknown" };
    const name = author.displayName || author.email || "Unknown";
    const profilePic = author.imageUrl;
    const youtubeMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);

    // -- Handlers --

    const handleReaction = async (type: ReactionType) => {
        if (!currentUserId) return toast.error("Please login");

        const previousReaction = currentReaction;
        const previousCount = reactionCount;
        const isRemoving = currentReaction === type;

        // Optimistic UI
        setCurrentReaction(isRemoving ? undefined : type);
        setReactionCount(prev => {
            if (previousReaction && !isRemoving) return prev; // Change type, count same
            if (isRemoving) return prev - 1;
            if (!previousReaction) return prev + 1;
            return prev;
        });

        try {
            await toggleReaction(post.id, type, post.type || 'personal', post.context?.id);
        } catch {
            // Rollback
            setCurrentReaction(previousReaction);
            setReactionCount(previousCount);
            toast.error("Reaction failed");
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !currentUserId) return;
        setIsSubmitting(true);
        try {
            // Server action now returns the new comment object
            const newComment = await addComment(post.id, commentText, post.type || 'personal', post.context?.id);
            if (newComment) {
                setComments(prev => [...prev, newComment]);
            }
            setCommentText("");
            toast.success("Comment added");
        } catch (e) {
            console.error(e);
            toast.error("Failed to comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTranslate = async () => {
        if (translatedContent) {
            setTranslatedContent(null); // Toggle off
            return;
        }
        setIsTranslating(true);
        try {
            const { translateText } = await import("@/app/actions/ai");
            // Simple heuristic based on browser language or user preference could go here.
            // For now, we cycle: If content seems English, target Spanish, else English.
            // Since detection is complex client-side, we'll default to Spanish for this "English to Spanish" request.
            const target = 'es';
            const result = await translateText(post.content, target);
            setTranslatedContent(result);
            toast.success("Translated!");
        } catch {
            toast.error("Translation failed");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSpeak = () => {
        try {
            // Speak translated content if active, otherwise original
            const text = translatedContent || post.content || "";
            const u = new SpeechSynthesisUtterance(text);
            if (translatedContent) u.lang = 'es-ES'; // Hint for Spanish
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        } catch { toast.error("TTS unavailable"); }
    };

    const handleDeletePost = async () => {
        try {
            const { deletePost, restorePost } = await import("@/app/actions/posts");
            await deletePost(post.id);
            toast.success("Post moved to trash", {
                action: {
                    label: "Undo",
                    onClick: () => {
                        restorePost(post.id).then(() => {
                            toast.success("Restored!");
                            window.location.reload(); // Hard refresh to show it back
                        });
                    }
                }
            });
            // Hide locally immediately
            const card = document.getElementById(`post-${post.id}`);
            if (card) card.style.display = 'none';
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleAI = (mode: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('famio:open-ai', {
                detail: { context: post.content, mode, type: 'post_context' }
            }));
            toast.success(`Opening AI: ${mode}`);
        }
    };

    const handleShare = async (mode: 'copy' | 'native' | 'repost') => {
        const url = `${window.location.origin}/post/${post.id}`;
        if (mode === 'copy') {
            try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
            } catch { toast.error("Failed to copy"); }
        } else if (mode === 'native' && navigator.share) {
            navigator.share({ title: `Post by ${name}`, text: post.content, url }).catch(() => { });
        } else if (mode === 'repost') {
            try {
                await createPost(`🔄 Reposted from ${name}:\n\n${post.content}`, post.mediaUrls || []);
                toast.success("Reposted!");
            } catch { toast.error("Repost failed"); }
        }
    };

    return (
        <Card id={`post-${post.id}`} className="mb-4 overflow-hidden border-none shadow-sm bg-card">
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

                {/* Header Menu (Delete Option) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleTranslate}>
                            {translatedContent ? "Show Original" : "Translate to Spanish"}
                        </DropdownMenuItem>
                        {currentUserId === post.authorId && (
                            <DropdownMenuItem onClick={handleDeletePost} className="text-red-500 focus:text-red-500">
                                Delete Post
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content */}
            <div className="px-4 py-2">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                    {translatedContent || post.content}
                </p>
                {translatedContent && (
                    <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Translated by AI
                    </p>
                )}

                {/* Media ... (Same as before) */}
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
                {/* Stats */}
                <div className="flex justify-between items-center text-xs text-muted-foreground w-full mb-2 px-1 pt-2">
                    <div className="flex items-center gap-1">
                        {currentReaction && <span className="text-lg">{getReactionIcon(currentReaction)}</span>}
                        <span className={cn(currentReaction && "font-medium text-pink-600")}>{reactionCount > 0 ? `${reactionCount} reactions` : 'Be the first to react'}</span>
                    </div>
                    <span>{comments.length} comments</span>
                </div>

                {/* Main Buttons */}
                <div className="flex justify-between items-center w-full mb-1">

                    {/* 1. Reaction Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("flex-1 gap-2 hover:bg-pink-50", currentReaction && "text-pink-600")}>
                                <span className={cn("text-xl transition-transform", currentReaction && "scale-110")}>{getReactionIcon(currentReaction)}</span>
                                <span>{currentReaction ? getReactionLabel(currentReaction) : "Like"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="flex gap-1 p-2">
                            {REACTIONS.map(r => (
                                <DropdownMenuItem key={r.type} onClick={() => handleReaction(r.type as ReactionType)} className="text-2xl cursor-pointer hover:scale-125 transition-transform" title={r.label}>
                                    {r.emoji}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 2. Comment Button */}
                    <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex-1 gap-2 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                    </Button>

                    {/* 3. Ask AI Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-50">
                                <Sparkles className="w-4 h-4" />
                                <span>AI</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleAI('executive')}>Summarize</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAI('tutor')}>Explain Context</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleTranslate}>{translatedContent ? "Show Original" : "Translate (ES)"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSpeak}>Read Aloud</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 4. Share Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShare('repost')}>Repost to Feed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('copy')}>Copy Link</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('native')}>Share via...</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Comment Area (Simple) */}
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
                            {comments.map((c: any) => (
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
