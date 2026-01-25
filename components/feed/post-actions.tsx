"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { REACTIONS, getReactionIcon } from "./reaction-selector";
import { ReactionType } from "@/types/posts";
import { CommentItem } from "./comment-item";

interface PostActionsProps {
    isPinterest: boolean;
    currentReaction?: ReactionType;
    reactionCount: number;
    onReaction: (type: ReactionType) => void;
    onCommentClick: () => void;
    showComments: boolean;
    comments: any[];
    onShare: (mode: 'native') => void;
    commentText: string;
    onCommentTextChange: (val: string) => void;
    onCommentSubmit: () => void;
    isSubmitting: boolean;
    isEnlarged: boolean;
    postId: string;
    currentUserId?: string;
    contextType?: string;
    contextId?: string;
    postAuthorId: string;
}

export function PostActions({
    isPinterest,
    currentReaction,
    reactionCount,
    onReaction,
    onCommentClick,
    showComments,
    comments,
    onShare,
    commentText,
    onCommentTextChange,
    onCommentSubmit,
    isSubmitting,
    isEnlarged,
    postId,
    currentUserId,
    contextType,
    contextId,
    postAuthorId
}: PostActionsProps) {
    return (
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
                            {REACTIONS.map(r => <button key={r.type} onClick={() => onReaction(r.type as ReactionType)} className="text-2xl hover:scale-125 transition-transform p-1">{r.emoji}</button>)}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="sm" onClick={onCommentClick} className="h-8 px-2 gap-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{comments.length > 0 ? comments.length : ""}</span>
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => onShare('native')} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 p-0">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* COMMENTS SECTION (Expandable) */}
            {(showComments || isEnlarged) && (
                <div className="mt-3 pt-3 border-t border-border animate-in fade-in zoom-in-95 duration-200">
                    {/* Comment Input */}
                    <div className="flex gap-2 items-center mb-3">
                        <Input placeholder="Write a comment..." value={commentText} onChange={e => onCommentTextChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onCommentSubmit()} className="h-9 text-sm rounded-full bg-muted/50 border-none focus-visible:ring-1" />
                        <Button size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={onCommentSubmit} disabled={!commentText.trim() || isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                    {/* Comments List */}
                    <div className={cn("space-y-3 pr-1 custom-scrollbar", isEnlarged ? "max-h-[min(300px,40vh)] overflow-y-auto" : "max-h-[300px] overflow-y-auto")}>
                        {comments.map(c => (
                            <CommentItem key={c.id} comment={c} postId={postId} currentUserId={currentUserId} contextType={contextType} contextId={contextId} postAuthorId={postAuthorId} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
