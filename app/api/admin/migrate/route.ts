
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Security Check
        const currentUser = await getUserProfile();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Migration] Starting Global Family Member Removal...");

        // 2. Fetch all users
        const usersSnap = await adminDb.collection("users").get();
        let migratedCount = 0;
        let errorsCount = 0;

        let batch = adminDb.batch();
        let batchSize = 0;
        const MAX_BATCH_SIZE = 450; // Firestore limit is 500

        // 3. Iterate and Update
        for (const doc of usersSnap.docs) {
            const data = doc.data();
            let needsUpdate = false;
            const updates: any = {};

            // CHECK 1: Remove "Family Member" display name
            if (data.displayName === "Family Member") {
                // Check if we can derive a better name from profile
                if (data.profileData?.firstName) {
                    updates.displayName = `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim();
                } else if (data.firstName) {
                    updates.displayName = `${data.firstName} ${data.lastName || ''}`.trim();
                } else {
                    // Set to null so the strict utility takes over (returning "Unnamed User")
                    updates.displayName = null;
                }
                needsUpdate = true;
            }

            // CHECK 2: Migrate "family_member" role -> "member"
            if (data.role === "family_member") {
                updates.role = "member";
                needsUpdate = true;
            }

            // CHECK 3: Ensure no "Family Member" string in role (just in case)
            if (data.role === "Family Member") {
                updates.role = "member";
                needsUpdate = true;
            }

            if (needsUpdate) {
                batch.update(doc.ref, updates);
                batchSize++;
                migratedCount++;

                // Commit batch if full
                if (batchSize >= MAX_BATCH_SIZE) {
                    await batch.commit();
                    batchSize = 0;
                    batch = adminDb.batch(); // Create new batch
                }
            }
        }

        // Commit remaining
        if (batchSize > 0) {
            await batch.commit();
        }

        console.log(`[Migration] Complete. Migrated ${migratedCount} users.`);

        return NextResponse.json({
            success: true,
            migrated: migratedCount,
            totalScanned: usersSnap.size
        });

    } catch (error: any) {
        console.error("[Migration] Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
