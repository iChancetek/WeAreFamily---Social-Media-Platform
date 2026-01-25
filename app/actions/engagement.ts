'use server';

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { sanitizeData } from "@/lib/serialization";
import { getCompanionIds } from "./companions";
import { EngagementPermissions, PostActivity } from "@/types/engagement";

/**
 * Check if a user has permission to engage with a post
 * Based on friend status and blocked users
 */
export async function checkEngagementPermissions(
    postAuthorId: string,
    postPrivacy: 'public' | 'friends' | 'private' = 'friends',
    allowLikes: boolean = true,
    allowComments: boolean = true
): Promise<EngagementPermissions> {
    const currentUser = await getUserProfile();

    // Not logged in - can only view public posts, no engagement
    if (!currentUser) {
        return {
            canView: postPrivacy === 'public',
            canLike: false,
            canComment: false,
            canReply: false,
            reason: 'Please log in to engage with posts'
        };
    }

    // Own post - full access
    if (currentUser.id === postAuthorId) {
        return {
            canView: true,
            canLike: true,
            canComment: allowComments,
            canReply: allowComments,
        };
    }

    // Check if blocked
    const blockedSnapshot = await adminDb.collection("blockedUsers").get();
    const isBlocked = blockedSnapshot.docs.some((doc: any) => {
        const data = doc.data();
        return (
            (data.blockerId === currentUser.id && data.blockedId === postAuthorId) ||
            (data.blockerId === postAuthorId && data.blockedId === currentUser.id)
        );
    });

    if (isBlocked) {
        return {
            canView: false,
            canLike: false,
            canComment: false,
            canReply: false,
            reason: 'This content is not available'
        };
    }

    // Check companion status
    const companionIds = await getCompanionIds(postAuthorId);
    const isCompanion = companionIds.includes(currentUser.id);

    // Handle privacy levels
    if (postPrivacy === 'private') {
        return {
            canView: false,
            canLike: false,
            canComment: false,
            canReply: false,
            reason: 'This post is private'
        };
    }

    if (postPrivacy === 'friends' && !isCompanion) {
        return {
            canView: false,
            canLike: false,
            canComment: false,
            canReply: false,
            reason: 'Connect as friends to view this content'
        };
    }

    // Public post visible to non-companions but engagement requires companionship
    if (postPrivacy === 'public' && !isCompanion) {
        return {
            canView: true,
            canLike: false,
            canComment: false,
            canReply: false,
            reason: 'Connect as friends to engage with this post'
        };
    }

    // Friends can engage based on post settings
    return {
        canView: true,
        canLike: isCompanion && allowLikes,
        canComment: isCompanion && allowComments,
        canReply: isCompanion && allowComments,
    };
}

/**
 * Get detailed activity for a post
 * Shows who liked, recent comments, etc.
 */
export async function getPostActivity(postId: string, contextType?: string, contextId?: string): Promise<PostActivity | null> {
    const user = await getUserProfile();
    if (!user) return null;

    // Get post reference
    let postRef;
    if (contextType === 'group' && contextId) {
        postRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(postId);
    } else if (contextType === 'branding' && contextId) {
        postRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(postId);
    } else {
        postRef = adminDb.collection("posts").doc(postId);
    }

    const postDoc = await postRef.get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data()!;

    // Get all reactions with user details
    const reactions = postData.reactions || {};
    const recentLikes = await Promise.all(
        Object.entries(reactions).slice(-10).map(async ([userId, reactionType]) => {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const userData = userDoc.data();
            return {
                userId,
                displayName: userData?.displayName || 'Unknown',
                imageUrl: userData?.imageUrl,
                reactionType: reactionType as string,
                timestamp: new Date().toISOString() // We don't store reaction timestamps currently
            };
        })
    );

    // Get comments with replies
    const commentsSnapshot = await postRef.collection("comments")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

    const recentComments = await Promise.all(
        commentsSnapshot.docs.map(async (doc) => {
            const commentData = doc.data();
            const authorDoc = await adminDb.collection("users").doc(commentData.authorId).get();
            const authorData = authorDoc.data();

            // Count replies
            const repliesSnapshot = await doc.ref.collection("replies").get();

            return {
                id: doc.id,
                authorId: commentData.authorId,
                displayName: authorData?.displayName || 'Unknown',
                imageUrl: authorData?.imageUrl,
                content: commentData.content,
                timestamp: commentData.createdAt?.toDate ? commentData.createdAt.toDate().toISOString() : new Date().toISOString(),
                replyCount: repliesSnapshot.size
            };
        })
    );

    // Count total comments and replies
    const allCommentsSnapshot = await postRef.collection("comments").get();
    let totalReplies = 0;

    for (const commentDoc of allCommentsSnapshot.docs) {
        const repliesSnapshot = await commentDoc.ref.collection("replies").get();
        totalReplies += repliesSnapshot.size;
    }

    return sanitizeData({
        postId,
        likeCount: Object.keys(reactions).length,
        commentCount: allCommentsSnapshot.size,
        replyCount: totalReplies,
        recentLikes,
        recentComments
    });
}

/**
 * Check if two users are friends
 */
export async function checkFriendStatus(userId: string, targetId: string): Promise<boolean> {
    const companionIds = await getCompanionIds(userId);
    return companionIds.includes(targetId);
}
