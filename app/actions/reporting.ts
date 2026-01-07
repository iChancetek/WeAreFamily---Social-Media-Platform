'use server';

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'nudity' | 'violence' | 'other';

export async function createReport(
    targetType: 'post' | 'comment' | 'group' | 'branding' | 'user',
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

    // In a real app, we might trigger a notification to admins here
    console.log(`Report created by ${user.id} against ${targetType}:${targetId} for ${reason}`);
}
