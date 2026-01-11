export interface Reply {
    id: string;
    commentId: string;
    postId: string;
    authorId: string;
    content: string;
    reactions?: { [userId: string]: string }; // Map of userId to reaction type
    likes?: string[]; // Deprecated - kept for backwards compatibility
    createdAt: Date | string;
    updatedAt?: Date | string;
    isEdited?: boolean;
    isDeleted?: boolean;
    author?: {
        id: string;
        displayName: string;
        imageUrl?: string;
        email?: string;
    };
}

export interface EngagementSettings {
    allowLikes: boolean;
    allowComments: boolean;
    privacy: 'public' | 'friends' | 'private';
}

export interface EngagementPermissions {
    canView: boolean;
    canLike: boolean;
    canComment: boolean;
    canReply: boolean;
    reason?: string; // Why permission was denied
}

export interface PostActivity {
    postId: string;
    likeCount: number;
    commentCount: number;
    replyCount: number;
    recentLikes: Array<{
        userId: string;
        displayName: string;
        imageUrl?: string;
        reactionType: string;
        timestamp: Date | string;
    }>;
    recentComments: Array<{
        id: string;
        authorId: string;
        displayName: string;
        imageUrl?: string;
        content: string;
        timestamp: Date | string;
    }>;
}

export interface EngagementNotification {
    id: string;
    userId: string; // Recipient
    type: 'like' | 'comment' | 'reply' | 'comment_reply' | 'reply_like';
    postId: string;
    commentId?: string;
    replyId?: string;
    actorId: string; // Who performed the action
    actorName: string;
    actorImage?: string;
    message: string;
    isRead: boolean;
    createdAt: Date | string;
    deepLink?: string; // Direct link to the engagement
}

export type PostPrivacy = 'public' | 'friends' | 'private';

export interface EnhancedComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    mediaUrl?: string | null;
    youtubeUrl?: string | null;
    reactions?: { [userId: string]: string }; // Map of userId to reaction type
    likes?: string[]; // Deprecated - kept for backwards compatibility
    replies?: Reply[];
    replyCount?: number;
    createdAt: Date | string;
    updatedAt?: Date | string;
    isEdited?: boolean;
    isArchived?: boolean;
    author?: {
        id: string;
        displayName: string;
        imageUrl?: string;
        email?: string;
    };
}
