"use server";

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateDoc } from "firebase/firestore";

export async function blockUser(userId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) throw new Error("Unauthorized");

    if (currentUser.id === userId) throw new Error("Cannot block yourself");

    // Check if already blocked
    const blockedQuery = query(
        collection(db, "blockedUsers"),
        where("blockerId", "==", currentUser.id),
        where("blockedId", "==", userId)
    );
    const existing = await getDocs(blockedQuery);

    if (!existing.empty) return;

    await addDoc(collection(db, "blockedUsers"), {
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

    const blockedQuery = query(
        collection(db, "blockedUsers"),
        where("blockerId", "==", currentUser.id),
        where("blockedId", "==", userId)
    );
    const blockedSnapshot = await getDocs(blockedQuery);

    await Promise.all(blockedSnapshot.docs.map(blockDoc => deleteDoc(blockDoc.ref)));

    revalidatePath("/settings");
    revalidatePath(`/u/${userId}`);
    revalidatePath("/");
}

export async function getBlockedUsers() {
    const currentUser = await getUserProfile();
    if (!currentUser) return [];

    const blockedQuery = query(
        collection(db, "blockedUsers"),
        where("blockerId", "==", currentUser.id)
    );
    const blockedSnapshot = await getDocs(blockedQuery);

    // Fetch user details for each blocked user
    const blockedUsers = await Promise.all(
        blockedSnapshot.docs.map(async (blockDoc) => {
            const blockData = blockDoc.data();
            const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", blockData.blockedId)));
            if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                return {
                    id: userDoc.docs[0].id,
                    displayName: userData.displayName,
                    email: userData.email,
                    imageUrl: userData.imageUrl,
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

    await updateDoc(doc(db, "users", currentUser.id), { isInvisible });

    revalidatePath("/settings");
    revalidatePath("/");
}
