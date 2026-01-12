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
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, ExternalLink, AlertTriangle, Settings2, Lock, Globe, Users, Image as ImageIcon, Video, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Actions
import { toggleReaction, addComment, editPost, deletePostWithContext } from "@/app/actions/posts";
import { ReactionType } from "@/types/posts";
import { REACTIONS, getReactionIcon, getReactionLabel } from "./reaction-selector";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/reporting/report-dialog";

import { Linkify } from "@/components/shared/linkify";
import { CommentItem } from "./comment-item";
import { EngagementSettingsDialog } from "./engagement-settings-dialog";
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { chatWithAgent } from '@/app/actions/ai-agents';

// Dynamic Player
import { MediaEmbed } from "./media-embed";

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
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null);
    const [isUploadingComment, setIsUploadingComment] = useState(false);
    const [isGeneratingComment, setIsGeneratingComment] = useState(false);
    const commentFileInputRef = useRef<HTMLInputElement>(null);

    // Engagement settings from post
    const engagementSettings = post.engagementSettings || {
        allowLikes: true,
        allowComments: true,
        privacy: 'friends'
    };

    const author = post.author || { displayName: "Unknown" };
    const name = (author.displayName && author.displayName !== "Family Member") ? author.displayName : "Unknown";
    const profilePic = author.imageUrl;

    // Broad Media Matching for YouTube, Facebook, LinkedIn, SoundCloud, Vimeo, etc.
    // Enhanced regex to handle mobile input (line breaks, extra spaces, etc.)
    const rawMediaMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com|linkedin\.com|vimeo\.com|dailymotion\.com|soundcloud\.com)\/\S+/gi);
    let mediaUrl = rawMediaMatch ? rawMediaMatch[0] : null;

    // Clean trailing punctuation and whitespace if present
    if (mediaUrl) {
        // Remove trailing punctuation and whitespace
        mediaUrl = mediaUrl.replace(/[\s.,!?;:]+$/, '').trim();
    }

    // Context Info
    const contextType = post.context?.type; // 'group' | 'branding'
    const contextId = post.context?.id;
    const isAuthor = currentUserId === post.authorId;

    // Get privacy icon
    const getPrivacyIcon = () => {
        switch (engagementSettings.privacy) {
            case 'public': return <Globe className="w-3.5 h-3.5" />;
            case 'private': return <Lock className="w-3.5 h-3.5" />;
            default: return <Users className="w-3.5 h-3.5" />;
        }
    };

    // -- Handlers --
    const handleReaction = async (type: ReactionType) => {
        if (!currentUserId) return toast.error("Please login");
        if (!engagementSettings.allowLikes) return toast.error("Likes are disabled on this post");

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
        if (!engagementSettings.allowComments) return toast.error("Comments are disabled on this post");

        setIsSubmitting(true);
        try {
            const newComment = await addComment(post.id, commentText, contextType, contextId);
            if (newComment) {
                setComments(prev => [...prev, newComment]);
            }
            setCommentText("");
            setCommentMediaUrl(null);
            toast.success("Comment added");
        } catch (e) {
            console.error(e);
            toast.error("Failed to comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Magic AI for comment
    const handleCommentMagic = async () => {
        if (!commentText.trim()) {
            toast.error('Type something first!');
            return;
        }
        setIsGeneratingComment(true);
        try {
            const magicText = await chatWithAgent(
                `Write a friendly, engaging comment about: "${commentText}". Keep it under 140 chars. Use emojis naturally.`,
                'general'
            );
            setCommentText(magicText || commentText);
            toast.success('Magic applied! ✨');
        } catch {
            toast.error('Magic failed');
        } finally {
            setIsGeneratingComment(false);
        }
    };

    // Handle file upload for comment
    const handleCommentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploadingComment(true);
            try {
                const timestamp = Date.now();
                const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const storageRef = ref(storage, `comments/${filename}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                setCommentMediaUrl(url);
                toast.success('File uploaded');
            } catch (error: any) {
                console.error('Error uploading:', error);
                toast.error('Upload failed');
            } finally {
                setIsUploadingComment(false);
                if (commentFileInputRef.current) commentFileInputRef.current.value = '';
            }
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
        <Card id={`post-${post.id}`} className="mb-6 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-white dark:bg-card/50 backdrop-blur-sm rounded-3xl">
            {/* Header */}
            <div className="flex flex-row items-center gap-4 p-5 pb-3">
                <Link href={`/u/${post.authorId}`} className="relative group">
                    <Avatar className="w-11 h-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={profilePic || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/u/${post.authorId}`} className="font-bold text-[15px] hover:text-primary transition-colors cursor-pointer text-foreground">
                            {name}
                        </Link>
                        {/* Show Context if available (Group/Branding) */}
                        {post.context?.name && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                                <span>in</span>
                                <span className="text-foreground">{post.context.name}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-0.5">
                        <span><SafeDate date={post.createdAt} /></span>
                        {/* Privacy Indicator */}
                        <span className="flex items-center gap-1 opacity-60" title={`Privacy: ${engagementSettings.privacy}`}>
                            {getPrivacyIcon()}
                        </span>
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

                        {/* Edit/Delete/Settings for Author */}
                        {((currentUserId === post.authorId && !post.postedAsBranding) || (post.postedAsBranding /* Requires admin check logic locally or optimistic allow, server validates */)) && (
                            <>
                                <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                                    <Settings2 className="w-4 h-4 mr-2" /> Post Settings
                                </DropdownMenuItem>
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
                        <Linkify
                            text={translatedContent || post.content}
                            hideUrls={mediaUrl ? [mediaUrl] : []}
                            onMediaFound={(url) => {
                                // Only set if not already matched
                                if (!mediaUrl) {
                                    // logic for onMediaFound... 
                                }
                            }} />
                    </p>
                )}

                {translatedContent && (
                    <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Translated by AI
                    </p>
                )}

                {/* Media Embeds (YouTube, FB, LinkedIn, etc) */}
                {/* We prefer the mediaMatch from the top level regex if possible, but Linkify support is dynamic. 
                    Let's update the match logic in the body to include more types. */}
                {/* Media Embeds (YouTube, FB, LinkedIn, etc) */}
                {mediaUrl && (
                    <MediaEmbed url={mediaUrl} />
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
                <div className="flex items-center justify-between w-full p-1 bg-secondary/30 rounded-2xl">

                    {/* 1. Reaction Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("flex-1 gap-2 hover:bg-white dark:hover:bg-black/20 hover:shadow-xs rounded-xl h-10 transition-all", currentReaction && "text-primary bg-primary/5")}>
                                <span className={cn("text-xl transition-transform", currentReaction && "scale-110")}>{getReactionIcon(currentReaction)}</span>
                                <span>{currentReaction ? getReactionLabel(currentReaction) : "Like"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="flex gap-2 p-3 bg-background/95 backdrop-blur-sm">
                            {REACTIONS.map(r => (
                                <button
                                    key={r.type}
                                    onClick={() => handleReaction(r.type as ReactionType)}
                                    className="text-3xl cursor-pointer hover:scale-150 transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                                    title={r.label}
                                >
                                    {r.emoji}
                                </button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 2. Comment Button */}
                    <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex-1 gap-2 text-muted-foreground hover:bg-white dark:hover:bg-black/20 hover:text-foreground rounded-xl h-10">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                    </Button>

                    {/* 3. Ask AI Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-indigo-500 hover:bg-white dark:hover:bg-black/20 rounded-xl h-10">
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
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-white dark:hover:bg-black/20 rounded-xl h-10">
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

                {/* Comment Area with Threaded Replies */}
                {showComments && (
                    <div className="w-full mt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                        {engagementSettings.allowComments ? (
                            <div className="space-y-2">
                                {commentMediaUrl && (
                                    <div className="relative inline-block">
                                        <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                                            {commentMediaUrl.includes('.mp4') || commentMediaUrl.includes('.webm') ? (
                                                <div className="w-full h-full bg-black flex items-center justify-center">
                                                    <Video className="w-6 h-6 text-white/70" />
                                                </div>
                                            ) : (
                                                <img src={commentMediaUrl} alt="Upload" className="w-full h-full object-cover" />
                                            )}
                                            <button
                                                onClick={() => setCommentMediaUrl(null)}
                                                className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCommentSubmit()}
                                    />
                                    <input
                                        type="file"
                                        ref={commentFileInputRef}
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={handleCommentFileSelect}
                                        disabled={isUploadingComment}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => commentFileInputRef.current?.click()}
                                        disabled={isUploadingComment}
                                        title="Add photo/video"
                                    >
                                        {isUploadingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCommentMagic}
                                        disabled={isGeneratingComment}
                                        className="text-indigo-600 hover:bg-indigo-50"
                                        title="Magic AI"
                                    >
                                        {isGeneratingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    </Button>
                                    <Button size="icon" onClick={handleCommentSubmit} disabled={isSubmitting || !commentText}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg text-sm text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                Comments are disabled on this post
                            </div>
                        )}

                        <div className="space-y-3">
                            {comments.map((c: any) => (
                                <CommentItem
                                    key={c.id}
                                    comment={c}
                                    postId={post.id}
                                    currentUserId={currentUserId}
                                    contextType={contextType}
                                    contextId={contextId}
                                    postAuthorId={post.authorId}
                                />
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

            {/* Engagement Settings Dialog */}
            {isAuthor && (
                <EngagementSettingsDialog
                    open={settingsDialogOpen}
                    onOpenChange={setSettingsDialogOpen}
                    postId={post.id}
                    currentSettings={engagementSettings}
                    contextType={contextType}
                    contextId={contextId}
                />
            )}
        </Card>
    );
}
