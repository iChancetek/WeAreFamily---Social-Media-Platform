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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal, Send, Loader2, Lock, Globe, Users, Image as ImageIcon, Video, X, Play } from "lucide-react";
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
import { AskAIDialog } from "./ask-ai-dialog";

function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

// ... imports ...

interface PostCardProps {
    post: any;
    currentUserId?: string;
    isEnlarged?: boolean;
    variant?: 'standard' | 'pinterest';
}

import { useLanguage } from "@/components/language-context";

export function PostCard({ post, currentUserId, isEnlarged = false, variant = 'standard' }: PostCardProps) {
    const { t } = useLanguage();
    const isPinterest = variant === 'pinterest' && !isEnlarged;
    // Hooks must be called unconditionally
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [showComments, setShowComments] = useState(isEnlarged); // Auto-show comments if enlarged
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post?.content || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
        currentUserId && post?.reactions ? post.reactions[currentUserId] : undefined
    );
    const [reactionCount, setReactionCount] = useState(post?.reactions ? Object.keys(post.reactions).length : 0);
    const [comments, setComments] = useState<any[]>(post?.comments || []);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null);
    const [isUploadingComment, setIsUploadingComment] = useState(false);
    const [isGeneratingComment, setIsGeneratingComment] = useState(false);
    const commentFileInputRef = useRef<HTMLInputElement>(null);

    // Enlargement State (Only used if !isEnlarged)
    const [enlargedViewOpen, setEnlargedViewOpen] = useState(false);
    const [askAIDialogOpen, setAskAIDialogOpen] = useState(false);

    // Early return AFTER hooks
    if (!post || post.isDeleted) return null;

    const handleEnlarge = () => {
        if (!isEnlarged) setEnlargedViewOpen(true);
    };

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
        const privacy = engagementSettings.privacy;
        switch (privacy) {
            case 'public': return <Globe className="w-3 h-3" />;
            case 'private': return <Lock className="w-3 h-3" />;
            case 'specific': return <Users className="w-3 h-3 text-blue-500" />;
            default: return <Users className="w-3 h-3" />; // 'companions' or legacy 'friends'
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

    const handleTranslate = async (targetLang: string = 'en') => {
        setIsTranslating(true);
        try {
            const { translateText } = await import("@/app/actions/ai");
            setTranslatedContent(await translateText(post.content, targetLang));
        } catch { toast.error("Translation failed"); } finally { setIsTranslating(false); }
    };

    const handleShare = async (mode: 'copy' | 'native' | 'repost') => {
        let url = `${window.location.origin}/post/${post.id}`;
        if (mode === 'copy') { try { await navigator.clipboard.writeText(url); toast.success(t("feed.share.copy")); } catch { } }
        else if (mode === 'native' && navigator.share) navigator.share({ title: `Post by ${name}`, text: post.content, url }).catch(() => { });
        else if (mode === 'repost') {
            try {
                const { createPost } = await import("@/app/actions/posts");
                await createPost(`🔄 ${t("feed.repost")}: ${post.content.substring(0, 100)}...`, post.mediaUrls || []);
                toast.success(t("feed.repost.success"));
            } catch { toast.error("Repost failed"); }
        }
    };

    // --- RENDER ---
    const pinterestPreview = (post as any).linkPreview;
    const hasUploadedMedia = post.mediaUrls && post.mediaUrls.length > 0;
    const hasLinkPreview = !!pinterestPreview?.image;

    // Determine Main Media Anchor (use first image/video, OR the embedded link, OR link preview)
    let mainMedia = hasUploadedMedia ? post.mediaUrls[0] : (hasLinkPreview ? pinterestPreview.image : mediaUrl);
    const hasMedia = !!mainMedia;

    const isEmbeddable = !hasUploadedMedia && !hasLinkPreview && (mainMedia === mediaUrl);
    const isVideoFile = isUrlVideo(mainMedia);
    const isPinterestLinkPreview = hasLinkPreview && !hasUploadedMedia;

    // Card Styles
    const cardClasses = isEnlarged
        ? "w-full max-w-3xl bg-card rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar ring-1 ring-black/5"
        : isPinterest
            ? "group relative break-inside-avoid border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card rounded-2xl overflow-hidden flex flex-col cursor-pointer ring-1 ring-black/[0.03]"
            : "group relative break-inside-avoid border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-card rounded-[1.5rem] overflow-hidden flex flex-col cursor-pointer ring-1 ring-black/5";

    return (
        <>
            <Card
                id={`post-${post.id}`}
                className={cardClasses}
                onClick={!isEnlarged ? handleEnlarge : undefined}
                data-post-card="true"
            >

                {/* 1. MEDIA ANCHOR (Top) */}
                {hasMedia && (
                    <div className="w-full relative">
                        {isEmbeddable && mediaUrl ? (
                            // Embeddable (YouTube etc)
                            // In Feed: playInline=false (Show Preview). onClick -> Enlarge
                            // In Modal: playInline=true (Playable).
                            <div className="w-full">
                                <MediaEmbed
                                    url={mediaUrl}
                                    playInline={isEnlarged}
                                    onPlayRequest={handleEnlarge}
                                />
                            </div>
                        ) : isVideoFile ? (
                            <div className="w-full bg-black rounded-lg overflow-hidden relative">
                                <video
                                    src={`${mainMedia}#t=0.001`}
                                    poster={post.thumbnailUrl || undefined}
                                    className="w-full h-auto object-cover max-h-[500px]"
                                    controls={isEnlarged} // Only controls if enlarged
                                    autoPlay={isEnlarged}
                                    preload="metadata"
                                    playsInline
                                    onClick={(e) => {
                                        if (!isEnlarged) {
                                            e.stopPropagation();
                                            handleEnlarge();
                                        }
                                    }}
                                />
                                {!isEnlarged && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                                            <Play className="w-6 h-6 text-white fill-current" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full relative overflow-hidden bg-muted">
                                <img
                                    src={mainMedia}
                                    alt=""
                                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        )}

                        {/* Pinterest Overlay Actions (Mobile Only) */}
                        {isPinterest && hasMedia && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none">
                                {/* Top-right: Save + Share */}
                                <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-md text-foreground border-none"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction('love');
                                        }}
                                    >
                                        <Heart className={cn("w-4 h-4", currentReaction && "fill-current text-pink-600")} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-md text-foreground border-none"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShare('native');
                                        }}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Bottom-right: More menu */}
                                <div className="absolute bottom-2 right-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white border-none">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={handleTranslate}>{translatedContent ? t("post.translate.original") : t("post.translate")}</DropdownMenuItem>
                                            {isAuthor && <DropdownMenuItem onClick={() => setIsEditing(true)}>{t("post.edit")}</DropdownMenuItem>}
                                            {isAuthor && <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">{t("post.delete")}</DropdownMenuItem>}
                                            {!isAuthor && <DropdownMenuItem className="text-red-500">{t("post.report")}</DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {/* Original Pinterest Link Preview Overlay */}
                        {!isPinterest && isPinterestLinkPreview && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white flex flex-col justify-end pt-16 pointer-events-none">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="bg-[#E60023] rounded-full p-1 shadow-sm"><span className="sr-only">Pinterest</span><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.228.085.355-.09.376-.292 1.199-.332 1.363-.053.225-.172.271-.399.165-1.487-.695-2.42-2.875-2.42-4.646 0-3.778 2.305-7.252 7.951-7.252 4.173 0 6.949 3.018 6.949 6.169 0 3.714-2.313 6.649-5.512 6.649-1.084 0-2.092-.565-2.435-1.229l-.665 2.527c-.237.906-.883 2.052-1.314 2.749 1.002.301 2.05.461 3.137.461 6.613 0 11.979-5.368 11.979-11.987001C24 5.367 18.618 0 12.017 0z" /></svg></div>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-95 drop-shadow-md">Pinterest</span>
                                </div>
                                {pinterestPreview.title && <h3 className="text-sm font-bold line-clamp-2 leading-tight drop-shadow-md">{pinterestPreview.title}</h3>}
                            </div>
                        )}

                        {/* Additional media indicator */}
                        {post.mediaUrls?.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium pointer-events-none">
                                +{post.mediaUrls.length - 1} more
                            </div>
                        )}

                        {/* Enlarge Hint Overlay (Only in Feed) */}
                        {!isEnlarged && !isEmbeddable && !isVideoFile && (
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                <span className="text-white text-xs font-medium flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> {t("post.view")}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CONTENT & TITLE (Middle) */}
                <div className={cn(
                    isPinterest ? "px-3 py-2 flex flex-col gap-1.5" : "px-4 pt-3 pb-2 flex flex-col gap-2",
                    !hasMedia && !isPinterest && "pt-4"
                )}>
                    {/* Author Info - Always visible, but styled differently for Pinterest */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                                    {post.context?.name && <span>{t("post.posted_in")} {post.context.name}</span>}
                                    <span className="opacity-50 flex items-center gap-1">
                                        {getPrivacyIcon()}
                                        {engagementSettings.privacy === 'specific' && post.allowedViewerIds?.length > 0 && (
                                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded-sm">
                                                +{post.allowedViewerIds.length}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Menu - Stop Propagation */}
                        <div onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Globe className="w-4 h-4 mr-2" />
                                            <span>{t("post.translate")}</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => handleTranslate('en')}>English</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTranslate('zh')}>中文 (Mandarin)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTranslate('hi')}>हिन्दी (Hindi)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTranslate('es')}>Español</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTranslate('fr')}>Français</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTranslate('ar')}>العربية (Arabic)</DropdownMenuItem>
                                                {translatedContent && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setTranslatedContent(null)}>
                                                            {t("post.translate.original")}
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem onClick={() => setAskAIDialogOpen(true)} className="text-purple-600 dark:text-purple-400 gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        {t("post.ask_ai")}
                                    </DropdownMenuItem>
                                    {isAuthor && <DropdownMenuItem onClick={() => setIsEditing(true)}>{t("post.edit")}</DropdownMenuItem>}
                                    {isAuthor && <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">{t("post.delete")}</DropdownMenuItem>}
                                    {!isAuthor && <DropdownMenuItem className="text-red-500">{t("post.report")}</DropdownMenuItem>}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div onClick={e => !isEditing && isEnlarged ? e.stopPropagation() : undefined}>
                        {isEditing ? (
                            <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm" />
                                <div className="flex justify-end gap-2"><Button size="sm" onClick={() => setIsEditing(false)} variant="outline">Cancel</Button><Button size="sm" onClick={handleEditSave}>Save</Button></div>
                            </div>
                        ) : (
                            // If in feed (!isEnlarged), clicking text bubbles to Card onClick -> handleEnlarge
                            <div className={cn(
                                "text-sm leading-relaxed whitespace-pre-wrap",
                                isPinterest ? "text-foreground/95 font-medium line-clamp-2" : "text-foreground/90",
                                !isPinterest && (!isEnlarged && hasMedia ? "line-clamp-3" : "line-clamp-6")
                            )}>
                                <Linkify text={translatedContent || post.content} hideUrls={mediaUrl ? [mediaUrl] : []} onMediaFound={() => { }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. ACTIONS & STATS (Bottom) - Minimal on Pinterest, full on standard */}
                <div className={cn(
                    "mt-auto pt-2 pb-3",
                    isPinterest ? "px-3" : "px-3"
                )} onClick={e => e.stopPropagation()}>
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

                            <Button variant="ghost" size="sm" onClick={() => !isEnlarged ? handleEnlarge() : setShowComments(!showComments)} className="h-8 px-2 gap-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">{comments.length > 0 ? comments.length : ""}</span>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => handleShare('native')} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 p-0">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* COMMENTS SECTION (Expandable) */}
                    {(showComments || isEnlarged) && (
                        <div className="mt-3 pt-3 border-t border-border animate-in fade-in zoom-in-95 duration-200">
                            {/* Comment Input */}
                            <div className="flex gap-2 items-center mb-3">
                                <Input placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()} className="h-9 text-sm rounded-full bg-muted/50 border-none focus-visible:ring-1" />
                                <Button size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={handleCommentSubmit} disabled={!commentText.trim() || isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                            {/* Comments List */}
                            <div className={cn("space-y-3 pr-1 custom-scrollbar", isEnlarged ? "max-h-[min(300px,40vh)] overflow-y-auto" : "max-h-[300px] overflow-y-auto")}>
                                {comments.map(c => (
                                    <CommentItem key={c.id} comment={c} postId={post.id} currentUserId={currentUserId} contextType={contextType} contextId={contextId} postAuthorId={post.authorId} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <ReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} targetType="post" targetId={post.id} context={{ contextType, contextId, authorId: post.authorId }} />
                {isAuthor && <EngagementSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} postId={post.id} currentSettings={engagementSettings} contextType={contextType} contextId={contextId} />}
                <AskAIDialog
                    isOpen={askAIDialogOpen}
                    onClose={() => setAskAIDialogOpen(false)}
                    postContent={translatedContent || post.content}
                    postAuthor={name}
                />
            </Card>

            {/* ENLARGED VIEW MODAL */}
            {enlargedViewOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEnlargedViewOpen(false)}>
                    {/* Close Button */}
                    <button onClick={() => setEnlargedViewOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="w-full max-w-3xl max-h-[95vh] flex flex-col items-center justify-center pointer-events-none">
                        {/* Prevent clicks on the card itself from closing the modal */}
                        <div className="w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <PostCard post={post} currentUserId={currentUserId} isEnlarged={true} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

