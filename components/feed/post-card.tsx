'use client';

// Pinterest-Style Card Redesign
// Goal: Media First, Title/Content below, Clean Actions.

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeDate } from "@/components/shared/safe-date";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, Lock, Globe, Users, Image as ImageIcon, Video, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { MediaEmbed } from "./media-embed";

function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

export function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
    if (!post || post.isDeleted) return null;

    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
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

    const engagementSettings = post.engagementSettings || { allowLikes: true, allowComments: true, privacy: 'friends' };
    const author = post.author || { displayName: "Unknown" };
    const name = (author.displayName && author.displayName !== "Family Member") ? author.displayName : "Unknown";
    const profilePic = author.imageUrl;

    const rawMediaMatch = post.content?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com|linkedin\.com|vimeo\.com|dailymotion\.com|soundcloud\.com)\/\S+/gi);
    let mediaUrl = rawMediaMatch ? rawMediaMatch[0]?.replace(/[\s.,!?;:]+$/, '').trim() : null;

    const contextType = post.context?.type;
    const contextId = post.context?.id;
    const isAuthor = currentUserId === post.authorId;

    const getPrivacyIcon = () => {
        switch (engagementSettings.privacy) {
            case 'public': return <Globe className="w-3 h-3" />;
            case 'private': return <Lock className="w-3 h-3" />;
            default: return <Users className="w-3 h-3" />;
        }
    };

    const handleReaction = async (type: ReactionType) => {
        if (!currentUserId) return toast.error("Please login");
        if (!engagementSettings.allowLikes) return toast.error("Likes disabled");
        const previousReaction = currentReaction;
        const isRemoving = currentReaction === type;
        setCurrentReaction(isRemoving ? undefined : type);
        setReactionCount(prev => (previousReaction && !isRemoving ? prev : isRemoving ? prev - 1 : prev + 1));
        try { await toggleReaction(post.id, type, contextType, contextId); }
        catch { setCurrentReaction(previousReaction); setReactionCount(prev => (previousReaction && !isRemoving ? prev : isRemoving ? prev + 1 : prev - 1)); }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !currentUserId) return;
        setIsSubmitting(true);
        try {
            const newComment = await addComment(post.id, commentText, contextType, contextId);
            if (newComment) setComments(prev => [...prev, newComment]);
            setCommentText(""); setCommentMediaUrl(null);
            toast.success("Comment added");
            // Auto open comments on submit
            setShowComments(true);
        } catch { toast.error("Failed to comment"); }
        finally { setIsSubmitting(false); }
    };

    const handleCommentMagic = async () => {
        if (!commentText.trim()) return toast.error('Type something first!');
        setIsGeneratingComment(true);
        try {
            const magicText = await chatWithAgent(`Make this comment witty and friendly: "${commentText}"`, 'general');
            setCommentText(magicText || commentText);
        } catch { toast.error("Magic failed"); }
        finally { setIsGeneratingComment(false); }
    };

    const handleCommentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploadingComment(true);
            try {
                const snapshot = await uploadBytes(ref(storage, `comments/${Date.now()}-${e.target.files[0].name}`), e.target.files[0]);
                setCommentMediaUrl(await getDownloadURL(snapshot.ref));
            } catch { toast.error('Upload failed'); }
            finally { setIsUploadingComment(false); if (commentFileInputRef.current) commentFileInputRef.current.value = ''; }
        }
    };

    const handleEditSave = async () => {
        if (!editContent.trim()) return;
        setIsSavingEdit(true);
        try { await editPost(post.id, editContent, contextType, contextId); toast.success("Updated"); setIsEditing(false); }
        catch { toast.error("Update failed"); } finally { setIsSavingEdit(false); }
    };

    const handleDeletePost = async () => {
        if (!confirm("Delete post?")) return;
        try { await deletePostWithContext(post.id, contextType, contextId); toast.success("Deleted"); const card = document.getElementById(`post-${post.id}`); if (card) card.style.display = 'none'; }
        catch { toast.error("Delete failed"); }
    };

    const handleTranslate = async () => {
        if (translatedContent) return setTranslatedContent(null);
        setIsTranslating(true);
        try {
            const { translateText } = await import("@/app/actions/ai");
            setTranslatedContent(await translateText(post.content, 'es'));
        } catch { toast.error("Translation failed"); } finally { setIsTranslating(false); }
    };

    const handleShare = async (mode: 'copy' | 'native' | 'repost') => {
        let url = `${window.location.origin}/post/${post.id}`;
        if (mode === 'copy') { try { await navigator.clipboard.writeText(url); toast.success("Copied"); } catch { } }
        else if (mode === 'native' && navigator.share) navigator.share({ title: `Post by ${name}`, text: post.content, url }).catch(() => { });
        else if (mode === 'repost') {
            try {
                const { createPost } = await import("@/app/actions/posts");
                await createPost(`🔄 Repost: ${post.content.substring(0, 100)}...`, post.mediaUrls || []);
                toast.success("Reposted!");
            } catch { toast.error("Repost failed"); }
        }
    };

    // --- RENDER ---
    const hasMedia = (post.mediaUrls && post.mediaUrls.length > 0) || mediaUrl;
    // Determine Main Media Anchor (use first image/video)
    const mainMedia = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : mediaUrl;
    const isMainVideo = isUrlVideo(mainMedia) || (mediaUrl && isUrlVideo(mediaUrl)); // Basic check

    return (
        <Card id={`post-${post.id}`} className="group relative break-inside-avoid mb-4 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card rounded-2xl overflow-hidden flex flex-col">

            {/* 1. MEDIA ANCHOR (Top) */}
            {hasMedia && (
                <div className="w-full relative cursor-pointer" onClick={() => setShowComments(!showComments)}>
                    {mainMedia && (
                        isMainVideo ? (
                            <div className="w-full bg-black rounded-lg overflow-hidden">
                                {mediaUrl ? <MediaEmbed url={mediaUrl} /> : <video src={mainMedia} controls className="w-full h-auto object-cover max-h-[500px]" />}
                            </div>
                        ) : (
                            <img src={mainMedia} alt="Post content" className="w-full h-auto object-cover hover:brightness-95 transition-all" />
                        )
                    )}
                    {/* Additional media indicator if multiple */}
                    {post.mediaUrls?.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                            +{post.mediaUrls.length - 1} more
                        </div>
                    )}
                </div>
            )}

            {/* 2. CONTENT & TITLE (Middle) */}
            <div className={cn("px-4 pt-3 pb-2 flex flex-col gap-2", !hasMedia && "pt-4")}>
                {/* Author Info (Small & Subtle) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={`/u/${post.authorId}`}>
                            <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={profilePic || undefined} />
                                <AvatarFallback className="text-[10px]">{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col">
                            <Link href={`/u/${post.authorId}`} className="text-xs font-semibold hover:underline line-clamp-1">{name}</Link>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <SafeDate date={post.createdAt} />
                                {post.context?.name && <span>in {post.context.name}</span>}
                                <span className="opacity-50">{getPrivacyIcon()}</span>
                            </div>
                        </div>
                    </div>
                    {/* Menu Trigger (Visible on Hover or always on mobile) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleTranslate}>{translatedContent ? "Show Original" : "Translate"}</DropdownMenuItem>
                            {isAuthor && <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>}
                            {isAuthor && <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">Delete</DropdownMenuItem>}
                            {!isAuthor && <DropdownMenuItem className="text-red-500">Report</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Text Content (Headline style) */}
                {isEditing ? (
                    <div className="space-y-2 mt-2">
                        <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm" />
                        <div className="flex justify-end gap-2"><Button size="sm" onClick={() => setIsEditing(false)} variant="outline">Cancel</Button><Button size="sm" onClick={handleEditSave}>Save</Button></div>
                    </div>
                ) : (
                    <div className="cursor-pointer" onClick={() => setShowComments(!showComments)}>
                        <p className={cn("text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap", hasMedia ? "line-clamp-3" : "line-clamp-6")}>
                            <Linkify text={translatedContent || post.content} hideUrls={mediaUrl ? [mediaUrl] : []} onMediaFound={() => { }} />
                        </p>
                    </div>
                )}
            </div>

            {/* 3. ACTIONS & STATS (Bottom) */}
            <div className="mt-auto pt-2 pb-3 px-3">
                <div className="flex items-center justify-between">
                    {/* Reactions */}
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={cn("h-8 px-2 gap-1.5 rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/20", currentReaction && "text-pink-600 bg-pink-50 dark:bg-pink-900/10")}>
                                    {currentReaction ? <span className="text-lg">{getReactionIcon(currentReaction)}</span> : <Heart className="w-4 h-4" />}
                                    <span className="text-xs font-medium">{reactionCount > 0 ? reactionCount : ""}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="flex p-2 gap-1">
                                {REACTIONS.map(r => <button key={r.type} onClick={() => handleReaction(r.type as ReactionType)} className="text-2xl hover:scale-125 transition-transform p-1">{r.emoji}</button>)}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="h-8 px-2 gap-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">{comments.length > 0 ? comments.length : ""}</span>
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => handleShare('native')} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 p-0">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* COMMENTS SECTION (Expandable) */}
                {showComments && (
                    <div className="mt-3 pt-3 border-t border-border animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex gap-2 items-center mb-3">
                            <Input placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()} className="h-9 text-sm rounded-full bg-muted/50 border-none focus-visible:ring-1" />
                            <Button size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={handleCommentSubmit} disabled={!commentText.trim() || isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {comments.map(c => (
                                <CommentItem key={c.id} comment={c} postId={post.id} currentUserId={currentUserId} contextType={contextType} contextId={contextId} postAuthorId={post.authorId} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} targetType="post" targetId={post.id} context={{ contextType, contextId, authorId: post.authorId }} />
            {isAuthor && <EngagementSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} postId={post.id} currentSettings={engagementSettings} contextType={contextType} contextId={contextId} />}
        </Card>
    );
}

