'use server';

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'nudity' | 'violence' | 'other';

export async function createReport(
    targetType: 'post' | 'comment' | 'group' | 'branding' | 'user' | 'marketplace_listing',
    targetId: string,
    reason: ReportReason,
    details?: string,
    context?: any // JSON object for extra context like groupId, brandingId, etc.
) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("reports").add({
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details: details || null,
        context: context || null,
        status: 'pending', // pending, reviewed, dismissed
        createdAt: FieldValue.serverTimestamp(),
    });

    // Increment reportCount on the target resource
    try {
        let targetRef;
        if (targetType === 'post') {
            const contextType = context?.contextType;
            const contextId = context?.contextId;
            if (contextType === 'group' && contextId) {
                targetRef = adminDb.collection("groups").doc(contextId).collection("posts").doc(targetId);
            } else if (contextType === 'branding' && contextId) {
                targetRef = adminDb.collection("pages").doc(contextId).collection("posts").doc(targetId);
            } else {
                targetRef = adminDb.collection("posts").doc(targetId);
            }
        } else if (targetType === 'group') {
            targetRef = adminDb.collection("groups").doc(targetId);
        } else if (targetType === 'branding') {
            targetRef = adminDb.collection("pages").doc(targetId);
        } else if (targetType === 'user') {
            targetRef = adminDb.collection("users").doc(targetId);
        } else if (targetType === 'marketplace_listing') {
            targetRef = adminDb.collection("listings").doc(targetId);
        } else if (targetType === 'comment') {
            // Comments are trickier as they are subcollections of posts
            // For now, we'll try to find it if post context is provided
            if (context?.postId) {
                targetRef = adminDb.collection("posts").doc(context.postId).collection("comments").doc(targetId);
            }
        }

        if (targetRef) {
            await targetRef.update({
                reportCount: FieldValue.increment(1)
            });
        }
    } catch (e) {
        console.error("Failed to increment reportCount:", e);
        // We don't throw here to avoid failing the report itself
    }

    // In a real app, we might trigger a notification to admins here
    console.log(`Report created by ${user.id} against ${targetType}:${targetId} for ${reason}`);
}
