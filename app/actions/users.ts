"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, Timestamp, query, where } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";

export async function updateLastActive() {
    const user = await getUserProfile();
    if (!user) return;

    await updateDoc(doc(db, "users", user.id), {
        lastActiveAt: Timestamp.now()
    });
}

export async function getActiveUsers() {
    // Active in the last 15 minutes
    const fifteenMinutesAgo = Timestamp.fromMillis(Date.now() - 15 * 60 * 1000);
    const currentUser = await getUserProfile();

    // Query users active recently
    const usersQuery = query(
        collection(db, "users"),
        where("lastActiveAt", ">", fifteenMinutesAgo),
        where("isInvisible", "==", false)
    );

    const usersSnapshot = await getDocs(usersQuery);

    // Filter out current user and blocked users
    let activeUsers = usersSnapshot.docs
        .map(userDoc => ({ id: userDoc.id, ...userDoc.data() }) as any)
        .filter(u => u.id !== currentUser?.id);

    if (currentUser) {
        // Fetch blocked users
        const blockedSnapshot = await getDocs(collection(db, "blockedUsers"));
        const excludedIds = new Set<string>();

        blockedSnapshot.docs.forEach(blockDoc => {
            const blockData = blockDoc.data();
            if (blockData.blockerId === currentUser.id || blockData.blockedId === currentUser.id) {
                excludedIds.add(blockData.blockerId);
                excludedIds.add(blockData.blockedId);
            }
        });

        activeUsers = activeUsers.filter(u => !excludedIds.has(u.id));
    }

    return activeUsers.map(u => ({
        id: u.id,
        displayName: u.displayName || "Family Member",
        imageUrl: u.imageUrl || null,
    }));
}

export async function getProfileById(userId: string) {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;

    return {
        id: userDoc.id,
        ...userDoc.data()
    } as any;
}
