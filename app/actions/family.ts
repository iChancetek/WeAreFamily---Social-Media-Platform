'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export type FamilyStatus = {
    status: 'none' | 'pending' | 'accepted' | 'rejected' | 'pending_sent' | 'pending_received';
    requestId?: string;
};

export async function sendFamilyRequest(receiverId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")
    if (user.id === receiverId) throw new Error("Cannot add yourself")

    // Check if request already exists
    const existing = await adminDb.collection("familyRequests")
        .where("senderId", "==", user.id)
        .where("receiverId", "==", receiverId)
        .get();

    if (!existing.empty) {
        throw new Error("Request already exists");
    }

    const docRef = await adminDb.collection("familyRequests").add({
        senderId: user.id,
        receiverId: receiverId,
        status: 'pending',
        createdAt: new Date(),
    });

    revalidatePath(`/u/${receiverId}`)
    return docRef.id;
}

export async function acceptFamilyRequest(requestId: string) {
    const requestDoc = await adminDb.collection("familyRequests").doc(requestId).get();
    const requestData = requestDoc.data();

    if (!requestData) throw new Error("Request not found");

    // Update request status
    await adminDb.collection("familyRequests").doc(requestId).update({
        status: 'accepted'
    });

    // Create denormalized bidirectional family connections for efficient security rules
    const batch = adminDb.batch();

    // Connection from sender to receiver
    const senderConnectionRef = adminDb.collection("users")
        .doc(requestData.senderId)
        .collection("familyConnections")
        .doc(requestData.receiverId);
    batch.set(senderConnectionRef, {
        connectedUserId: requestData.receiverId,
        status: 'accepted',
        createdAt: new Date()
    });

    // Connection from receiver to sender
    const receiverConnectionRef = adminDb.collection("users")
        .doc(requestData.receiverId)
        .collection("familyConnections")
        .doc(requestData.senderId);
    batch.set(receiverConnectionRef, {
        connectedUserId: requestData.senderId,
        status: 'accepted',
        createdAt: new Date()
    });

    await batch.commit();

    revalidatePath('/family');
}

export async function rejectFamilyRequest(requestId: string) {
    const requestDoc = await adminDb.collection("familyRequests").doc(requestId).get();
    const requestData = requestDoc.data();

    await adminDb.collection("familyRequests").doc(requestId).delete();

    // Clean up any family connections if they exist
    if (requestData) {
        const batch = adminDb.batch();

        const senderConnectionRef = adminDb.collection("users")
            .doc(requestData.senderId)
            .collection("familyConnections")
            .doc(requestData.receiverId);
        batch.delete(senderConnectionRef);

        const receiverConnectionRef = adminDb.collection("users")
            .doc(requestData.receiverId)
            .collection("familyConnections")
            .doc(requestData.senderId);
        batch.delete(receiverConnectionRef);

        await batch.commit();
    }

    revalidatePath('/family');
}

export async function cancelFamilyRequest(requestId: string) {
    const requestDoc = await adminDb.collection("familyRequests").doc(requestId).get();
    const requestData = requestDoc.data();

    await adminDb.collection("familyRequests").doc(requestId).delete();

    // Clean up any family connections if they exist
    if (requestData) {
        const batch = adminDb.batch();

        const senderConnectionRef = adminDb.collection("users")
            .doc(requestData.senderId)
            .collection("familyConnections")
            .doc(requestData.receiverId);
        batch.delete(senderConnectionRef);

        const receiverConnectionRef = adminDb.collection("users")
            .doc(requestData.receiverId)
            .collection("familyConnections")
            .doc(requestData.senderId);
        batch.delete(receiverConnectionRef);

        await batch.commit();
    }

    revalidatePath('/family');
}

export async function denyFamilyRequest(requestId: string) {
    await adminDb.collection("familyRequests").doc(requestId).update({
        status: 'rejected'
    });
    revalidatePath('/family')
}

// ... imports

// Helper for serialization removed in favor of @/lib/serialization

// ... send, accept, reject, cancel, deny ...

export async function getFamilyRequests() {
    const user = await getUserProfile();
    if (!user) return { incoming: [], sent: [] };

    const incomingSnapshot = await adminDb.collection("familyRequests")
        .where("receiverId", "==", user.id)
        .where("status", "==", 'pending')
        .get();

    const sentSnapshot = await adminDb.collection("familyRequests")
        .where("senderId", "==", user.id)
        .where("status", "==", 'pending')
        .get();

    const incomingRequests = await Promise.all(incomingSnapshot.docs.map(async doc => {
        const data = doc.data();
        const senderDoc = await adminDb.collection("users").doc(data.senderId).get();
        const sender = senderDoc.exists ? {
            id: senderDoc.id,
            displayName: senderDoc.data()?.displayName,
            imageUrl: senderDoc.data()?.imageUrl,
            email: senderDoc.data()?.email,
        } : { email: 'Unknown' };

        return {
            id: doc.id,
            ...data,
            sender,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        };
    }));

    const sentRequests = await Promise.all(sentSnapshot.docs.map(async doc => {
        const data = doc.data();
        const receiverDoc = await adminDb.collection("users").doc(data.receiverId).get();
        const receiver = receiverDoc.exists ? {
            id: receiverDoc.id,
            displayName: receiverDoc.data()?.displayName,
            imageUrl: receiverDoc.data()?.imageUrl,
            email: receiverDoc.data()?.email,
        } : { email: 'Unknown' };

        return {
            id: doc.id,
            ...data,
            receiver,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        };
    }));

    return {
        incoming: sanitizeData(incomingRequests),
        sent: sanitizeData(sentRequests)
    };
}

// Alias for family page
export const getPendingRequests = getFamilyRequests;

// Filter out invisible users and blocked users
// Note: This is an unoptimized in-memory filter. For production, we'd need a dedicated search index (Algolia/Typesense)
// or denormalized privacy flags.
// or denormalized privacy flags.
export async function searchFamilyMembers(searchTerm: string) {
    const currentUser = await getUserProfile();

    // Filter out invisible users and blocked users
    const usersSnapshot = await adminDb.collection("users").get();

    // Fetch blocked users
    const blockedIds = new Set<string>();
    if (currentUser) {
        const blockedSnapshot = await adminDb.collection("blockedUsers").get();
        blockedSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.blockerId === currentUser.id || data.blockedId === currentUser.id) {
                blockedIds.add(data.blockerId === currentUser.id ? data.blockedId : data.blockerId);
            }
        });
    }

    const allUsers = usersSnapshot.docs.map(doc => {
        return {
            id: doc.id,
            ...doc.data()
        };
    });

    const filteredUsers = allUsers.filter((u: any) => {
        if (blockedIds.has(u.id)) return false;
        // Don't show invisible users unless it's yourself (though why search for yourself?) or admin?
        // Let's just hide invisible users from search completely except for admins.
        if (u.isInvisible && u.id !== currentUser?.id && currentUser?.role !== 'admin') return false;

        const name = (u.displayName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();

        // Check for profile name fields (firstName/lastName)
        const profileFirst = (u.profileData?.firstName || "").toLowerCase();
        const profileLast = (u.profileData?.lastName || "").toLowerCase();
        const profileFull = `${profileFirst} ${profileLast}`.trim();

        const search = searchTerm.toLowerCase();

        return (
            name.includes(search) ||
            email.includes(search) ||
            profileFirst.includes(search) ||
            profileLast.includes(search) ||
            profileFull.includes(search)
        );
    });

    // Enhance with family status & Return Strict POJOs
    const usersWithStatus = await Promise.all(filteredUsers.map(async (u: any) => {
        const status = await getFamilyStatus(u.id);

        // Return ONLY what the UI needs, ensuring simple types
        return {
            id: u.id,
            displayName: u.displayName || null,
            email: u.email || null,
            imageUrl: u.imageUrl || null,
            isInvisible: !!u.isInvisible,
            familyStatus: {
                status: status.status,
                requestId: status.requestId || null
            }
        };
    }));

    // Double safety: JSON parse/stringify to guarantee POJO
    return JSON.parse(JSON.stringify(usersWithStatus));
}

// Alias for backward compatibility
export const searchUsers = searchFamilyMembers;

export async function getFamilyMembers() {
    const user = await getUserProfile();
    if (!user) return [];

    // Use getFamilyMemberIds to get the IDs first (which handles blocking logic)
    const familyIds = await getFamilyMemberIds(user.id);

    // Fetch family member details
    const familyMembers = await Promise.all(
        familyIds.map(async id => {
            const userDoc = await adminDb.collection("users").doc(id).get();
            if (userDoc.exists) {
                const data = userDoc.data()!;
                return {
                    id: userDoc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
                };
            }
            return null;
        })
    );

    return sanitizeData(familyMembers.filter(Boolean));
}

export async function getFamilyMemberIds(userId: string) {
    // Get accepted family requests
    const sentSnapshot = await adminDb.collection("familyRequests")
        .where("senderId", "==", userId)
        .where("status", "==", 'accepted')
        .get();

    const receivedSnapshot = await adminDb.collection("familyRequests")
        .where("receiverId", "==", userId)
        .where("status", "==", 'accepted')
        .get();

    const familyIds = new Set<string>();
    sentSnapshot.docs.forEach(doc => familyIds.add(doc.data().receiverId));
    receivedSnapshot.docs.forEach(doc => familyIds.add(doc.data().senderId));

    // Filter out blocked users
    const blockedSnapshot = await adminDb.collection("blockedUsers").get();
    blockedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.blockerId === userId || data.blockedId === userId) {
            familyIds.delete(data.blockerId === userId ? data.blockedId : data.blockerId);
            // Also delete the request to be clean? No, let's just hide the connection.
        }
    });

    return Array.from(familyIds);
}

// ... family members ...

export async function getFamilyStatus(targetUserId: string): Promise<FamilyStatus> {
    const user = await getUserProfile();
    if (!user) return { status: 'none' } as FamilyStatus;

    const sentSnapshot = await adminDb.collection("familyRequests")
        .where("senderId", "==", user.id)
        .where("receiverId", "==", targetUserId)
        .get();

    const receivedSnapshot = await adminDb.collection("familyRequests")
        .where("senderId", "==", targetUserId)
        .where("receiverId", "==", user.id)
        .get();

    if (!sentSnapshot.empty) {
        const data = sentSnapshot.docs[0].data();
        return { status: data.status, requestId: sentSnapshot.docs[0].id } as FamilyStatus;
    }
    if (!receivedSnapshot.empty) {
        const data = receivedSnapshot.docs[0].data();
        return { status: data.status, requestId: receivedSnapshot.docs[0].id } as FamilyStatus;
    }

    return { status: 'none' } as FamilyStatus;
}
