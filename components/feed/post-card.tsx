'use client';

// Pinterest-Style Card Redesign
// Goal: Media First, Title/Content below, Clean Actions.

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { X, Users, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleReaction, addComment, editPost, deletePostWithContext, incrementRepostCount } from "@/app/actions/posts";
import { ReactionType } from "@/types/posts";
import { ReportDialog } from "@/components/reporting/report-dialog";
import { EngagementSettingsDialog } from "./engagement-settings-dialog";
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { chatWithAgent } from '@/app/actions/ai-agents';
import { AskAIDialog } from "./ask-ai-dialog";
import { useLanguage } from "@/components/language-context";
import { useRouter } from "next/navigation";

// Sub Components
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";
import { PostContent } from "./post-content";
import { PostActions } from "./post-actions";
import { ArticleLinkPreview } from "./article-link-preview";

function isUrlVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

interface PostCardProps {
    post: any;
    currentUserId?: string;
    isEnlarged?: boolean;
    variant?: 'standard' | 'pinterest';
    initialTranslatedContent?: string | null;
    initialLanguage?: 'es' | 'en' | 'fr' | 'zh' | 'hi' | 'ar';
}

export function PostCard({ post, currentUserId, isEnlarged = false, variant = 'standard', initialTranslatedContent = null, initialLanguage }: PostCardProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const isPinterest = variant === 'pinterest' && !isEnlarged;
    // Hooks must be called unconditionally
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [showComments, setShowComments] = useState(isEnlarged); // Auto-show comments if enlarged
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [editContent, setEditContent] = useState(post?.content || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(initialTranslatedContent);
    const [targetLanguage, setTargetLanguage] = useState<typeof initialLanguage | undefined>(initialLanguage);
    const [isTranslating, setIsTranslating] = useState(false);
    const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
        currentUserId && post?.reactions ? post.reactions[currentUserId] : undefined
    );
    const [reactionCount, setReactionCount] = useState(post?.reactions ? Object.keys(post.reactions).length : 0);
    const [comments, setComments] = useState<any[]>(post?.comments || []);
    const [isLocked, setIsLocked] = useState(post.isLocked);
    const [reportCount, setReportCount] = useState(post?.reportCount || 0);
    const [engagementSettings, setEngagementSettings] = useState(post.engagementSettings || { allowLikes: true, allowComments: true, privacy: 'friends' });
    const [repostCount, setRepostCount] = useState(post?.repostCount || 0);
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

    const handleTranslate = async (targetLang: 'es' | 'en' | 'fr' | 'zh' | 'hi' | 'ar' = 'en') => {
        setIsTranslating(true);
        setTargetLanguage(targetLang);
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
                const { createPost, incrementRepostCount } = await import("@/app/actions/posts");
                // Check if already reposted is handled server-side, but we can catch the error here
                await createPost(`🔄 ${t("feed.repost")}: ${post.content.substring(0, 100)}...`, post.media || []);
                await incrementRepostCount(post.id, contextType, contextId);
                setRepostCount((prev: number) => prev + 1); // Increment local counter
                toast.success(t("feed.repost.success"));
            } catch (error: any) { 
                console.error("Repost error:", error);
                const message = error.message || "Repost failed";
                toast.error(message === "You have already reposted this." ? "Already reposted" : message); 
            }
        }
    };

    // --- RENDER ---
    const pinterestPreview = (post as any).linkPreview;
    const hasUploadedMedia = post.media && post.media.length > 0;
    const hasLinkPreview = !!pinterestPreview?.image;
    let mainMedia = hasUploadedMedia ? post.media[0].url : (hasLinkPreview ? pinterestPreview.image : mediaUrl);
    const hasMedia = !!mainMedia || !!post.audioUrl;
    const isEmbeddable = !hasUploadedMedia && !hasLinkPreview && (mainMedia === mediaUrl);
    const isVideoFile = hasUploadedMedia ? post.media[0].type === 'video' : isUrlVideo(mainMedia);
    const isPinterestLinkPreview = hasLinkPreview && !hasUploadedMedia;

    // Determine if we should show a standalone article link preview card
    // Show when: post has linkPreview data, no uploaded media, and the link is NOT an embeddable video (YouTube etc.)
    const isEmbeddableUrl = !!mediaUrl; // YouTube, LinkedIn, etc.
    const showArticlePreview = pinterestPreview && pinterestPreview.title && !hasUploadedMedia && !isEmbeddableUrl;

    const cardClasses = isEnlarged
        ? "w-full max-w-3xl bg-card rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar border border-border"
        : isPinterest
            ? "group relative break-inside-avoid border-none shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl overflow-hidden flex flex-col cursor-pointer border border-border/50"
            : "group relative break-inside-avoid border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-card rounded-[1.5rem] overflow-hidden flex flex-col cursor-pointer border border-border/50";

    return (
        <>
            <Card
                id={`post-${post.id}`}
                className={cardClasses}
                onClick={!isEnlarged ? handleEnlarge : undefined}
                data-post-card="true"
            >
                {/* 1. MEDIA ANCHOR (Top) */}
                <PostMedia
                    post={post}
                    isEnlarged={isEnlarged}
                    isPinterest={isPinterest}
                    hasMedia={hasMedia}
                    mainMedia={mainMedia}
                    isEmbeddable={isEmbeddable}
                    isVideoFile={isVideoFile}
                    videoRef={videoRef}
                    mediaUrl={mediaUrl}
                    pinterestPreview={pinterestPreview}
                    isPinterestLinkPreview={isPinterestLinkPreview}
                    currentReaction={currentReaction}
                    isAuthor={isAuthor}
                    t={t}
                    translatedContent={translatedContent}
                    onEnlarge={handleEnlarge}
                    onReaction={handleReaction}
                    onShare={handleShare}
                    onTranslate={handleTranslate}
                    onClearTranslation={() => setTranslatedContent(null)}
                    onAskAI={() => setAskAIDialogOpen(true)}
                    onEdit={() => setIsEditing(true)}
                    onDelete={handleDeletePost}
                    onReport={() => setReportDialogOpen(true)}
                />

                {/* 2. CONTENT & TITLE (Middle) */}
                <div className={cn(
                    isPinterest ? "px-3 py-2 flex flex-col gap-1.5" : "px-4 pt-3 pb-2 flex flex-col gap-2",
                    !hasMedia && !isPinterest && "pt-4"
                )}>
                    <PostHeader
                        post={post}
                        isLocked={isLocked}
                        isPinterest={isPinterest}
                        name={name}
                        profilePic={profilePic}
                        t={t}
                        isAuthor={isAuthor}
                        engagementSettings={engagementSettings}
                        privacyIcon={getPrivacyIcon()}
                        translatedContent={translatedContent}
                        onTranslate={handleTranslate}
                        onClearTranslation={() => setTranslatedContent(null)}
                        onAskAI={() => setAskAIDialogOpen(true)}
                        onEdit={() => setIsEditing(true)}
                        onDelete={handleDeletePost}
                        onReport={() => setReportDialogOpen(true)}
                        onSubscribeSuccess={() => {
                            setIsLocked(false);
                            router.refresh();
                        }}
                    />

                    <PostContent
                        isEditing={isEditing}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
                        onEditCancel={() => setIsEditing(false)}
                        onEditSave={handleEditSave}
                        isEnlarged={isEnlarged}
                        isPinterest={isPinterest}
                        hasMedia={hasMedia}
                        translatedContent={translatedContent}
                        postContent={post.content}
                        mediaUrl={mediaUrl}
                        title={post.title}
                        linkPreviewUrl={showArticlePreview ? pinterestPreview?.url : null}
                    />

                    {/* Article Link Preview Card */}
                    {showArticlePreview && (
                        <div onClick={e => e.stopPropagation()}>
                            <ArticleLinkPreview linkPreview={pinterestPreview} />
                        </div>
                    )}
                </div>

                {/* 3. ACTIONS & STATS (Bottom) */}
                <PostActions
                    isPinterest={isPinterest}
                    currentReaction={currentReaction}
                    reactionCount={reactionCount}
                    onReaction={handleReaction}
                    onCommentClick={() => !isEnlarged ? handleEnlarge() : setShowComments(!showComments)}
                    showComments={showComments}
                    comments={comments}
                    onShare={handleShare}
                    commentText={commentText}
                    onCommentTextChange={setCommentText}
                    onCommentSubmit={handleCommentSubmit}
                    isSubmitting={isSubmitting}
                    isEnlarged={isEnlarged}
                    postId={post.id}
                    currentUserId={currentUserId}
                    contextType={contextType}
                    contextId={contextId}
                    postAuthorId={post.authorId}
                    repostCount={repostCount}
                    reportCount={reportCount}
                    onReport={() => setReportDialogOpen(true)}
                />

                <ReportDialog
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                    onSuccess={() => {
                        setReportCount((prev: number) => prev + 1);
                        setReportDialogOpen(false);
                    }}
                    targetId={post.id}
                    targetType="post"
                    context={{ contextType, contextId, authorId: post.authorId }}
                />
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
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEnlargedViewOpen(false)}>
                    {/* Close Button */}
                    <button onClick={() => setEnlargedViewOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="w-full max-w-3xl max-h-[95vh] flex flex-col items-center justify-center pointer-events-none">
                        {/* Prevent clicks on the card itself from closing the modal */}
                        <div className="w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <Card className="w-full max-w-3xl bg-card rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar ring-1 ring-black/5 relative">
                                {/* Inside Modal Close button */}
                                <button onClick={() => setEnlargedViewOpen(false)} className="absolute top-4 right-4 p-2 text-foreground/70 hover:text-foreground rounded-full bg-muted/50 hover:bg-muted transition-colors z-30">
                                    <X className="w-5 h-5" />
                                </button>

                                <PostMedia
                                    post={post}
                                    isEnlarged={true}
                                    isPinterest={false}
                                    hasMedia={hasMedia}
                                    mainMedia={mainMedia}
                                    isEmbeddable={isEmbeddable}
                                    isVideoFile={isVideoFile}
                                    videoRef={videoRef}
                                    mediaUrl={mediaUrl}
                                    pinterestPreview={pinterestPreview}
                                    isPinterestLinkPreview={isPinterestLinkPreview}
                                    currentReaction={currentReaction}
                                    isAuthor={isAuthor}
                                    t={t}
                                    translatedContent={translatedContent}
                                    onEnlarge={() => {}}
                                    onReaction={handleReaction}
                                    onShare={handleShare}
                                    onTranslate={handleTranslate}
                                    onClearTranslation={() => setTranslatedContent(null)}
                                    onAskAI={() => setAskAIDialogOpen(true)}
                                    onEdit={() => setIsEditing(true)}
                                    onDelete={handleDeletePost}
                                    onReport={() => setReportDialogOpen(true)}
                                />

                                <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
                                    <PostHeader
                                        post={post}
                                        isLocked={isLocked}
                                        isPinterest={false}
                                        name={name}
                                        profilePic={profilePic}
                                        t={t}
                                        isAuthor={isAuthor}
                                        engagementSettings={engagementSettings}
                                        privacyIcon={getPrivacyIcon()}
                                        translatedContent={translatedContent}
                                        onTranslate={handleTranslate}
                                        onClearTranslation={() => setTranslatedContent(null)}
                                        onAskAI={() => setAskAIDialogOpen(true)}
                                        onEdit={() => setIsEditing(true)}
                                        onDelete={handleDeletePost}
                                        onReport={() => setReportDialogOpen(true)}
                                        onSubscribeSuccess={() => {
                                            setIsLocked(false);
                                            router.refresh();
                                        }}
                                    />

                                    <PostContent
                                        isEditing={isEditing}
                                        editContent={editContent}
                                        onEditContentChange={setEditContent}
                                        onEditCancel={() => setIsEditing(false)}
                                        onEditSave={handleEditSave}
                                        isEnlarged={true}
                                        isPinterest={false}
                                        hasMedia={hasMedia}
                                        translatedContent={translatedContent}
                                        postContent={post.content}
                                        mediaUrl={mediaUrl}
                                        linkPreviewUrl={showArticlePreview ? pinterestPreview?.url : null}
                                    />

                                    {/* Article Link Preview Card (Enlarged) */}
                                    {showArticlePreview && (
                                        <div onClick={e => e.stopPropagation()}>
                                            <ArticleLinkPreview linkPreview={pinterestPreview} />
                                        </div>
                                    )}
                                </div>

                                <PostActions
                                    isPinterest={false}
                                    currentReaction={currentReaction}
                                    reactionCount={reactionCount}
                                    onReaction={handleReaction}
                                    onCommentClick={() => setShowComments(!showComments)}
                                    showComments={showComments}
                                    comments={comments}
                                    onShare={handleShare}
                                    commentText={commentText}
                                    onCommentTextChange={setCommentText}
                                    onCommentSubmit={handleCommentSubmit}
                                    isSubmitting={isSubmitting}
                                    isEnlarged={true}
                                    postId={post.id}
                                    currentUserId={currentUserId}
                                    contextType={contextType}
                                    contextId={contextId}
                                    postAuthorId={post.authorId}
                                    repostCount={repostCount}
                                    reportCount={reportCount}
                                    onReport={() => setReportDialogOpen(true)}
                                />
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
