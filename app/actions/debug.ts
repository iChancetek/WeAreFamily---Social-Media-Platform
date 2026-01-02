'use server'

import { remove } from "firebase/database";
import { getUserProfile } from "@/lib/auth";
import { getFamilyMemberIds } from "./family";
import { adminDb } from "@/lib/firebase-admin";

export async function checkFeedDiagnostics() {
    const user = await getUserProfile();
    if (!user) return { status: "Unauthorized" };

    try {
        const familyIds = await getFamilyMemberIds(user.id);

        // Check raw counts
        const allowedIds = [user.id, ...familyIds];
        const chunks = [];
        for (let i = 0; i < allowedIds.length; i += 10) {
            chunks.push(allowedIds.slice(i, i + 10));
        }

        let totalPostsFound = 0;
        let errors = [];

        for (const chunk of chunks) {
            try {
                const snap = await adminDb.collection("posts")
                    .where("authorId", "in", chunk)
                    .orderBy("createdAt", "desc")
                    .limit(5)
                    .get();
                totalPostsFound += snap.size;
            } catch (e: any) {
                errors.push(`Ordered query failed: ${e.message}`);
                // Try fallback
                try {
                    const snap = await adminDb.collection("posts")
                        .where("authorId", "in", chunk)
                        .limit(5)
                        .get();
                    totalPostsFound += snap.size;
                    errors.push(`Fallback query success: found ${snap.size}`);
                } catch (e2: any) {
                    errors.push(`Fallback failed: ${e2.message}`);
                }
            }
        }

        return {
            user: { id: user.id, name: user.displayName },
            familyCount: familyIds.length,
            familyIds: familyIds,
            totalPostsFound,
            errors
        };
    } catch (e: any) {
        return { error: e.message };
    }
}
