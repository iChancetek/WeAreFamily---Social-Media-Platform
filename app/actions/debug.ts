'use server';

import { adminDb } from "@/lib/firebase-admin";

export async function debugEnv() {
    try {
        const postsRef = adminDb.collection("posts");
        const countSnapshot = await postsRef.count().get();

        return {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "unknown",
            numPosts: countSnapshot.data().count,
            envProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "N/A",
            nodeEnv: process.env.NODE_ENV,
            serviceAccount: process.env.FIREBASE_CLIENT_EMAIL ? "Custom" : "ADC"
        };
    } catch (e: any) {
        return {
            error: e.message,
            projectId: "ALLOCATION_FAILED"
        }
    }
}
