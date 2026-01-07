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
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Actions
import { toggleReaction, addComment, editPost, deletePostWithContext } from "@/app/actions/posts";
import { ReactionType } from "@/types/posts";
import { REACTIONS, getReactionIcon, getReactionLabel } from "./reaction-selector";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/reporting/report-dialog";

// Dynamic Player
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Helper: Video Detection
function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    if (!post || post.isDeleted) return null;

    // -- State --
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    // Comment State (Real-time)
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Translation State
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Reaction State
    const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
        currentUserId && post.reactions ? post.reactions[currentUserId] : undefined
    );
    const [reactionCount, setReactionCount] = useState(post.reactions ? Object.keys(post.reactions).length : 0);
    const [comments, setComments] = useState<any[]>(post.comments || []);

    const author = post.author || { displayName: "Unknown" };
    const name = author.displayName || author.email || "Unknown";
    const profilePic = author.imageUrl;
    const youtubeMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+(?<![.,!?])/);

    // Context Info
    const contextType = post.context?.type; // 'group' | 'branding'
    const contextId = post.context?.id;
    const isAuthor = currentUserId === post.authorId;

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
            await toggleReaction(post.id, type, contextType, contextId);
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
            const newComment = await addComment(post.id, commentText, contextType, contextId);
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

    const handleEditSave = async () => {
        if (!editContent.trim()) return;
        setIsSavingEdit(true);
        try {
            await editPost(post.id, editContent, contextType, contextId);
            toast.success("Post updated");
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update post");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            await deletePostWithContext(post.id, contextType, contextId);
            toast.success("Post deleted");
            // Hide locally
            const card = document.getElementById(`post-${post.id}`);
            if (card) card.style.display = 'none';
        } catch (e) {
            console.error(e);
            toast.error("Delete failed");
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
            const text = translatedContent || post.content || "";
            const u = new SpeechSynthesisUtterance(text);
            if (translatedContent) u.lang = 'es-ES';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        } catch { toast.error("TTS unavailable"); }
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
        let url = `${window.location.origin}/post/${post.id}`;

        // Context-aware URLs
        if (post.context?.type === 'group' && post.context.id) {
            url = `${window.location.origin}/groups/${post.context.id}/post/${post.id}`;
        } else if (post.context?.type === 'branding' && post.context.id) {
            url = `${window.location.origin}/branding/${post.context.id}/post/${post.id}`;
        }

        if (mode === 'copy') {
            try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
            } catch { toast.error("Failed to copy"); }
        } else if (mode === 'native' && navigator.share) {
            navigator.share({ title: `Post by ${name}`, text: post.content, url }).catch(() => { });
        } else if (mode === 'repost') {
            try {
                const { createPost } = await import("@/app/actions/posts");
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
                        {/* Show Context if available (Group/Branding) */}
                        {post.context?.name && (
                            <>
                                <span className="text-muted-foreground text-xs">▶</span>
                                <span className="font-semibold text-sm">{post.context.name}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground"><SafeDate date={post.createdAt} /></span>
                        {post.isEdited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
                    </div>
                </div>

                {/* Header Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleTranslate}>
                            {translatedContent ? "Show Original" : "Translate to Spanish"}
                        </DropdownMenuItem>

                        {/* Edit/Delete for Author */}
                        {((currentUserId === post.authorId && !post.postedAsBranding) || (post.postedAsBranding /* Requires admin check logic locally or optimistic allow, server validates */)) && (
                            <>
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeletePost} className="text-red-500 focus:text-red-500">
                                    Delete Post
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* Report Logic (Non-authors) */}
                        {!isAuthor && currentUserId && (
                            <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-red-500 focus:text-red-500">
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Report Post
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content */}
            <div className="px-4 py-2">
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleEditSave} disabled={isSavingEdit}>
                                {isSavingEdit ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                        {translatedContent || post.content}
                    </p>
                )}

                {translatedContent && (
                    <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Translated by AI
                    </p>
                )}

                {/* Media */}
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

            {/* Report Dialog */}
            <ReportDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                targetType="post"
                targetId={post.id}
                context={{
                    contextType,
                    contextId,
                    authorId: post.authorId
                }}
            />
        </Card>
    );
}
