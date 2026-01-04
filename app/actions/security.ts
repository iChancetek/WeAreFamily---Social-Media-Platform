"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";
import { logAuditEvent } from "@/app/actions/audit";

export async function blockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    if (currentUser.id === userId) throw new Error("Cannot block yourself");

    // Check if already blocked
    const existing = await adminDb.collection("blockedUsers")
        .where("blockerId", "==", currentUser.id)
        .where("blockedId", "==", userId)
        .get();

    if (!existing.empty) return;

    // Get blocked user info for audit
    const blockedUserDoc = await adminDb.collection("users").doc(userId).get();
    const blockedUserData = blockedUserDoc.data();

    await adminDb.collection("blockedUsers").add({
        blockerId: currentUser.id,
        blockedId: userId,
        createdAt: new Date(),
    });

    await logAuditEvent("user.block", {
        targetType: "user",
        targetId: userId,
        targetName: blockedUserData?.displayName || blockedUserData?.email || "Unknown",
    });

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function unblockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    // Get user info for audit before unblocking
    const unblockedUserDoc = await adminDb.collection("users").doc(userId).get();
    const unblockedUserData = unblockedUserDoc.data();

    const blockedSnapshot = await adminDb.collection("blockedUsers")
        .where("blockerId", "==", currentUser.id)
        .where("blockedId", "==", userId)
        .get();

    const batch = adminDb.batch();
    blockedSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    await logAuditEvent("user.unblock", {
        targetType: "user",
        targetId: userId,
        targetName: unblockedUserData?.displayName || unblockedUserData?.email || "Unknown",
    });

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function getBlockedUsers() {
    const currentUser = await getUserProfile();
    if (!currentUser) return [];

    const blockedSnapshot = await adminDb.collection("blockedUsers")
        .where("blockerId", "==", currentUser.id)
        .get();

    // Fetch user details for each blocked user
    const blockedUsers = await Promise.all(
        blockedSnapshot.docs.map(async (blockDoc: any) => {
            const blockData = blockDoc.data();
            const userDoc = await adminDb.collection("users").doc(blockData.blockedId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return sanitizeData({
                    id: userDoc.id,
                    displayName: userData?.displayName,
                    email: userData?.email,
                    imageUrl: userData?.imageUrl,
                });
            }
            return null;
        })
    );

    return blockedUsers.filter(Boolean);
}

export async function toggleInvisibleMode(isInvisible: boolean) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    await adminDb.collection("users").doc(currentUser.id).update({ isInvisible });

    await logAuditEvent("security.invisible_mode", {
        details: { enabled: isInvisible },
    });

    revalidatePath("/settings");
    revalidatePath("/");
}
