"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

    await adminDb.collection("blockedUsers").add({
        blockerId: currentUser.id,
        blockedId: userId,
        createdAt: new Date(),
    });

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function unblockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    const blockedSnapshot = await adminDb.collection("blockedUsers")
        .where("blockerId", "==", currentUser.id)
        .where("blockedId", "==", userId)
        .get();

    const batch = adminDb.batch();
    blockedSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

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
        blockedSnapshot.docs.map(async (blockDoc) => {
            const blockData = blockDoc.data();
            const userDoc = await adminDb.collection("users").doc(blockData.blockedId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                    id: userDoc.id,
                    displayName: userData?.displayName,
                    email: userData?.email,
                    imageUrl: userData?.imageUrl,
                };
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

    revalidatePath("/settings");
    revalidatePath("/");
}
