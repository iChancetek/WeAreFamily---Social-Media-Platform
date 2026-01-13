'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SafeDate } from '@/components/shared/safe-date';
import { Heart, MessageCircle, Send, Loader2, MoreHorizontal, Trash2, Edit2, Image as ImageIcon, Video, X, Sparkles } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { chatWithAgent } from '@/app/actions/ai-agents';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    toggleCommentLike,
    deleteComment,
    editComment,
    addReply,
    toggleReplyLike,
    deleteReply,
    editReply
} from '@/app/actions/posts';
import { Linkify } from '@/components/shared/linkify';
import { Reply } from '@/types/engagement';
import { REACTIONS, getReactionIcon } from './reaction-selector';
import { ReactionType } from '@/types/posts';

interface CommentItemProps {
    comment: any;
    postId: string;
    currentUserId?: string;
    contextType?: string;
    contextId?: string;
    onUpdate?: () => void;
}

export function CommentItem({
    comment,
    postId,
    currentUserId,
    contextType,

    contextId,
    onUpdate,
    postAuthorId
}: CommentItemProps & { postAuthorId?: string }) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [replyMediaUrl, setReplyMediaUrl] = useState<string | null>(null);
    const [isUploadingReply, setIsUploadingReply] = useState(false);
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    const [isEditingComment, setIsEditingComment] = useState(false);
    const [editContent, setEditContent] = useState(comment.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const [likesState, setLikesState] = useState(comment.reactions || {});
    const [replies, setReplies] = useState<Reply[]>(comment.replies || []);

    const isAuthor = currentUserId === comment.authorId;
    const canDelete = currentUserId === comment.authorId || currentUserId === postAuthorId;
    const canEdit = currentUserId === comment.authorId;

    // DEBUG LOGGING
    if (typeof window !== 'undefined') {
        console.log(`Comment ${comment.id} permissions:`, {
            currentUserId,
            commentAuthor: comment.authorId,
            postAuthor: postAuthorId,
            canEdit,
            canDelete
        });
    }

    const userReaction = currentUserId ? likesState[currentUserId] : null;
    const hasLiked = !!userReaction;
    const commentAuthor = comment.author ? {
        ...comment.author,
        displayName: (comment.author.displayName && comment.author.displayName !== "Family Member")
            ? comment.author.displayName
            : "Unknown"
    } : { displayName: 'Unknown' };

    // Handle comment like
    const handleLike = async (reactionType: ReactionType) => {
        if (!currentUserId) return toast.error('Please login');

        const prevLikes = { ...likesState };
        const newLikes = { ...likesState };

        // If clicking the same reaction, remove it. Otherwise, set new reaction
        if (newLikes[currentUserId] === reactionType) {
            delete newLikes[currentUserId];
        } else {
            newLikes[currentUserId] = reactionType;
        }

        setLikesState(newLikes);

        try {
            await toggleCommentLike(postId, comment.id, reactionType, contextType, contextId);
        } catch (error) {
            setLikesState(prevLikes);
            toast.error('Failed to react to comment');
        }
    };

    // Handle Magic AI for reply
    const handleReplyMagic = async () => {
        if (!replyText.trim()) {
            toast.error('Type something first!');
            return;
        }
        setIsGeneratingReply(true);
        try {
            const magicText = await chatWithAgent(
                `Write a thoughtful, friendly reply to this: "${replyText}". Keep it under 140 chars. Use emojis naturally.`,
                'general'
            );
            setReplyText(magicText || replyText);
            toast.success('Magic applied! ✨');
        } catch {
            toast.error('Magic failed');
        } finally {
            setIsGeneratingReply(false);
        }
    };

    // Handle file upload for reply
    const handleReplyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploadingReply(true);
            try {
                const timestamp = Date.now();
                const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const storageRef = ref(storage, `comments/replies/${filename}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                setReplyMediaUrl(url);
                toast.success('File uploaded');
            } catch (error: any) {
                console.error('Error uploading:', error);
                toast.error('Upload failed');
            } finally {
                setIsUploadingReply(false);
                if (replyFileInputRef.current) replyFileInputRef.current.value = '';
            }
        }
    };

    // Handle reply submission
    const handleReplySubmit = async () => {
        if (!replyText.trim() || !currentUserId) return;

        console.log('🔵 Starting reply submission:', {
            postId,
            commentId: comment.id,
            replyText,
            contextType,
            contextId
        });

        setIsSubmittingReply(true);

        try {
            const newReply = await addReply(postId, comment.id, replyText, contextType, contextId);
            console.log('✅ Reply created successfully:', newReply);

            if (newReply) {
                // Cast to Reply with required fields
                const replyWithMetadata: Reply = {
                    ...newReply,
                    commentId: comment.id,
                    postId: postId
                } as Reply;
                setReplies(prev => [...prev, replyWithMetadata]);
                setReplyText('');
                setReplyMediaUrl(null);
                setShowReplyInput(false);
                toast.success('Reply added');
                onUpdate?.();
            }
        } catch (error: any) {
            console.error('❌ Reply submission failed:', error);

            // Check for Server Action version mismatch
            // "Server Action ... was not found on the server"
            if (error?.message?.includes('not found on the server')) {
                toast.error('New update available. Refreshing...');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                return;
            }

            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                stack: error?.stack
            });
            toast.error(`Failed to add reply: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Handle comment edit
    const handleEditSave = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);

        try {
            await editComment(postId, comment.id, editContent, contextType, contextId);
            toast.success('Comment updated');
            setIsEditingComment(false);
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to update comment');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle comment delete
    const handleDelete = async () => {
        if (!confirm('Delete this comment?')) return;

        try {
            await deleteComment(postId, comment.id, contextType, contextId);
            toast.success('Comment deleted');
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div className="space-y-2">
            {/* Main Comment */}
            <div className="bg-muted/40 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                    <Link href={`/u/${comment.authorId}`}>
                        <Avatar className="w-8 h-8 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src={commentAuthor.imageUrl || undefined} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {commentAuthor.displayName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/u/${comment.authorId}`} className="font-semibold text-sm hover:underline cursor-pointer">
                                    {commentAuthor.displayName}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    <SafeDate date={comment.createdAt} />
                                </span>
                                {comment.isEdited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
                            </div>

                            {(canEdit || canDelete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {canEdit && (
                                            <DropdownMenuItem onClick={() => setIsEditingComment(true)}>
                                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {isEditingComment ? (
                            <div className="space-y-2">
                                <Input
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsEditingComment(false)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleEditSave} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">
                                <Linkify text={comment.content} />
                            </p>
                        )}

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-2">
                            {/* Emoji Reaction Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-7 px-2 gap-1", hasLiked && "text-pink-600")}
                                    >
                                        <span className={cn("text-base", hasLiked && "scale-110")}>
                                            {hasLiked ? getReactionIcon(userReaction as ReactionType) : '🤍'}
                                        </span>
                                        <span className="text-xs">{Object.keys(likesState).length > 0 && Object.keys(likesState).length}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="flex gap-2 p-3 bg-background/95 backdrop-blur-sm">
                                    {REACTIONS.map(r => (
                                        <button
                                            key={r.type}
                                            onClick={() => handleLike(r.type as ReactionType)}
                                            className="text-2xl cursor-pointer hover:scale-150 transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                                            title={r.label}
                                        >
                                            {r.emoji}
                                        </button>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="h-7 px-2 gap-1"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="text-xs">Reply</span>
                            </Button>

                            {replies.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="h-7 px-2 text-xs text-muted-foreground"
                                >
                                    {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {showReplyInput && (
                <div className="ml-10 space-y-2 animate-in fade-in slide-in-from-top-1">
                    {replyMediaUrl && (
                        <div className="relative inline-block">
                            <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                                {replyMediaUrl.includes('.mp4') || replyMediaUrl.includes('.webm') ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <Video className="w-6 h-6 text-white/70" />
                                    </div>
                                ) : (
                                    <img src={replyMediaUrl} alt="Upload" className="w-full h-full object-cover" />
                                )}
                                <button
                                    onClick={() => setReplyMediaUrl(null)}
                                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReplySubmit()}
                            className="flex-1"
                        />
                        <input
                            type="file"
                            ref={replyFileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleReplyFileSelect}
                            disabled={isUploadingReply}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => replyFileInputRef.current?.click()}
                            disabled={isUploadingReply}
                            title="Add photo/video"
                        >
                            {isUploadingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleReplyMagic}
                            disabled={isGeneratingReply}
                            className="text-primary hover:bg-primary/10"
                            title="Magic AI"
                        >
                            {isGeneratingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleReplySubmit}
                            disabled={isSubmittingReply || !replyText.trim()}
                        >
                            {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {showReplies && replies.length > 0 && (
                <div className="ml-10 space-y-2">
                    {replies.map((reply) => (
                        <ReplyItem
                            key={reply.id}
                            reply={reply}
                            postId={postId}
                            commentId={comment.id}
                            currentUserId={currentUserId}
                            contextType={contextType}
                            contextId={contextId}
                            postAuthorId={postAuthorId}
                            commentAuthorId={comment.authorId}
                            onUpdate={() => onUpdate?.()}
                            onDelete={(replyId) => setReplies(prev => prev.filter(r => r.id !== replyId))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Reply Item Component (nested under comments)
function ReplyItem({
    reply,
    postId,
    commentId,
    currentUserId,
    contextType,
    contextId,
    onUpdate,
    onDelete,
    postAuthorId,
    commentAuthorId
}: {
    reply: Reply;
    postId: string;
    commentId: string;
    currentUserId?: string;
    contextType?: string;
    contextId?: string;
    onUpdate?: () => void;
    onDelete?: (replyId: string) => void;
    postAuthorId?: string;
    commentAuthorId?: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(reply.content || '');
    const [isSaving, setIsSaving] = useState(false);
    const [likesState, setLikesState] = useState(reply.reactions || {});

    const isAuthor = currentUserId === reply.authorId;
    const canEdit = currentUserId === reply.authorId;
    // Delete rights: Reply Author OR Comment Author OR Post Author
    const canDelete = currentUserId === reply.authorId ||
        currentUserId === commentAuthorId ||
        currentUserId === postAuthorId;
    const userReaction = currentUserId ? likesState[currentUserId] : null;
    const hasLiked = !!userReaction;
    const replyAuthor = reply.author ? {
        ...reply.author,
        displayName: (reply.author.displayName && reply.author.displayName !== "Family Member")
            ? reply.author.displayName
            : "Unknown"
    } : { displayName: 'Unknown', imageUrl: undefined };

    const handleLike = async (reactionType: ReactionType) => {
        if (!currentUserId) return toast.error('Please login');

        const prevLikes = { ...likesState };
        const newLikes = { ...likesState };

        // If clicking the same reaction, remove it. Otherwise, set new reaction
        if (newLikes[currentUserId] === reactionType) {
            delete newLikes[currentUserId];
        } else {
            newLikes[currentUserId] = reactionType;
        }

        setLikesState(newLikes);

        try {
            await toggleReplyLike(postId, commentId, reply.id || '', reactionType, contextType, contextId);
        } catch (error) {
            setLikesState(prevLikes);
            toast.error('Failed to react to reply');
        }
    };

    const handleEditSave = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);

        try {
            await editReply(postId, commentId, reply.id || '', editContent, contextType, contextId);
            toast.success('Reply updated');
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to update reply');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this reply?')) return;

        try {
            await deleteReply(postId, commentId, reply.id || '', contextType, contextId);
            toast.success('Reply deleted');
            onDelete?.(reply.id || '');
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to delete reply');
        }
    };

    return (
        <div className="bg-muted/20 p-2.5 rounded-lg border-l-2 border-border">
            <div className="flex items-start gap-2">
                <Link href={`/u/${reply.authorId}`}>
                    <Avatar className="w-7 h-7 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={replyAuthor.imageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {replyAuthor.displayName?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/u/${reply.authorId}`} className="font-semibold text-xs hover:underline cursor-pointer">
                                {replyAuthor.displayName}
                            </Link>
                            <span className="text-[10px] text-muted-foreground">
                                <SafeDate date={reply.createdAt} />
                            </span>
                            {reply.isEdited && <span className="text-[9px] text-muted-foreground">(edited)</span>}
                        </div>

                        {(canEdit || canDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5">
                                        <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {canEdit && (
                                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                            <Edit2 className="w-3 h-3 mr-2" /> Edit
                                        </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                                            <Trash2 className="w-3 h-3 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full text-sm"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleEditSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs whitespace-pre-wrap break-words">
                            <Linkify text={reply.content} />
                        </p>
                    )}

                    <div className="mt-1.5">
                        {/* Emoji Reaction Dropdown for Replies */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-6 px-2 gap-1", hasLiked && "text-pink-600")}
                                >
                                    <span className={cn("text-sm", hasLiked && "scale-110")}>
                                        {hasLiked ? getReactionIcon(userReaction as ReactionType) : '🤍'}
                                    </span>
                                    <span className="text-[10px]">{Object.keys(likesState).length > 0 && Object.keys(likesState).length}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="flex gap-2 p-3 bg-background/95 backdrop-blur-sm">
                                {REACTIONS.map(r => (
                                    <button
                                        key={r.type}
                                        onClick={() => handleLike(r.type as ReactionType)}
                                        className="text-2xl cursor-pointer hover:scale-150 transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                                        title={r.label}
                                    >
                                        {r.emoji}
                                    </button>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
