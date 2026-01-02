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
    // Check if request already exists (in either direction)
    const [existingSent, existingReceived] = await Promise.all([
        adminDb.collection("familyRequests")
            .where("senderId", "==", user.id)
            .where("receiverId", "==", receiverId)
            .get(),
        adminDb.collection("familyRequests")
            .where("senderId", "==", receiverId)
            .where("receiverId", "==", user.id)
            .get()
    ]);

    if (!existingSent.empty || !existingReceived.empty) {
        const status = !existingSent.empty ? existingSent.docs[0].data().status : existingReceived.docs[0].data().status;
        if (status === 'accepted') throw new Error("You are already family");
        if (status === 'pending') throw new Error("A request is already pending between you");
        if (!existingSent.empty && status === 'rejected') {
            // Allow resending if previously rejected? Maybe. But for now let's block to avoid spam.
            // Or maybe we treat rejected as 'none' here to allow retry? 
            // Logic: If I sent it and it was rejected, I probably shouldn't spam.
            throw new Error("Request was rejected previously.");
        }
        // If received and rejected, maybe I can try again? 
        // Let's safe block for now.
        // Actually, if existing reverse request exists, we should tell them to accept it!
        if (!existingReceived.empty && status === 'pending') {
            throw new Error("This person already sent you a request. Please accept it.");
        }
    }

    const docRef = await adminDb.collection("familyRequests").add({
        senderId: user.id,
        receiverId: receiverId,
        status: 'pending',
        createdAt: new Date(),
    });

    revalidatePath(`/u/${receiverId}`)

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("family.request_sent", {
        targetType: "user",
        targetId: receiverId,
        details: { requestId: docRef.id }
    });

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

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("family.request_accepted", {
        targetType: "family_request",
        targetId: requestId
    });

    revalidatePath('/family');
    revalidatePath('/'); // Refresh home feed to show new posts
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

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("family.request_rejected", {
        targetType: "family_request",
        targetId: requestId
    });

    revalidatePath('/family');
    revalidatePath('/');
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

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("family.request_cancelled", {
        targetType: "family_request",
        targetId: requestId
    });

    revalidatePath('/family');
    revalidatePath('/');
}

export async function denyFamilyRequest(requestId: string) {
    await adminDb.collection("familyRequests").doc(requestId).update({
        status: 'rejected'
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("family.request_rejected", { // Reuse rejected for denied
        targetType: "family_request",
        targetId: requestId,
        details: { action: 'deny' }
    });

    revalidatePath('/family')
    revalidatePath('/')
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
    // Queries can be expensive, but we initialized familyConnections for this!
    // Wait, did we? Yes, in acceptFamilyRequest we write to `users/{id}/familyConnections`.
    // Let's use THAT if it exists, as it's cleaner.
    // BUT, we must be sure it's populated. 
    // Legacy requests might not have it.
    // Safer to stick to familyRequests collection for now to support old data + new data, 
    // OR we could migrate? 
    // Let's stick to querying familyRequests properly in both directions.

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
        adminDb.collection("familyRequests")
            .where("senderId", "==", userId)
            .where("status", "==", 'accepted')
            .get(),
        adminDb.collection("familyRequests")
            .where("receiverId", "==", userId)
            .where("status", "==", 'accepted')
            .get()
    ]);

    const familyIds = new Set<string>();
    sentSnapshot.docs.forEach(doc => familyIds.add(doc.data().receiverId));
    receivedSnapshot.docs.forEach(doc => familyIds.add(doc.data().senderId));

    // Filter out blocked users
    const blockedSnapshot = await adminDb.collection("blockedUsers").get();
    blockedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.blockerId === userId || data.blockedId === userId) {
            familyIds.delete(data.blockerId === userId ? data.blockedId : data.blockerId);
        }
    });

    return Array.from(familyIds);
}

// ... family members ...

export async function getFamilyStatus(targetUserId: string): Promise<FamilyStatus> {
    const user = await getUserProfile();
    if (!user) return { status: 'none' } as FamilyStatus;

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
        adminDb.collection("familyRequests")
            .where("senderId", "==", user.id)
            .where("receiverId", "==", targetUserId)
            .get(),
        adminDb.collection("familyRequests")
            .where("senderId", "==", targetUserId)
            .where("receiverId", "==", user.id)
            .get()
    ]);

    const sentData = !sentSnapshot.empty ? sentSnapshot.docs[0].data() : null;
    const receivedData = !receivedSnapshot.empty ? receivedSnapshot.docs[0].data() : null;

    // Check for ANY accepted status first
    if (sentData?.status === 'accepted') return { status: 'accepted', requestId: sentSnapshot.docs[0].id };
    if (receivedData?.status === 'accepted') return { status: 'accepted', requestId: receivedSnapshot.docs[0].id };

    // Then check for pending logic
    // If I sent a request, I see 'pending_sent'
    if (sentData?.status === 'pending') return { status: 'pending_sent', requestId: sentSnapshot.docs[0].id };

    // If I received a request, I see 'pending_received' (or just 'pending' which UI interprets)
    // The UI likely expects 'pending' or 'pending_received'. 
    // Looking at family-request-button.tsx might help, but let's stick to standard 'pending' or differentiate.
    // Existing code returned raw status. 'pending' usually implies "I can accept it" or "Waiting".
    // If received, I CAN accept it.
    if (receivedData?.status === 'pending') return { status: 'pending_received', requestId: receivedSnapshot.docs[0].id };

    // If rejected?
    if (sentData?.status === 'rejected') return { status: 'rejected', requestId: sentSnapshot.docs[0].id };
    // Received rejected? user shouldn't probably know? or yes?

    return { status: 'none' };
}

export async function getUserFamilyMembers(targetUserId: string) {
    const currentUser = await getUserProfile();
    if (!currentUser) return [];

    // 1. Check permissions
    // Allow if: Own Profile OR Admin OR Accepted Family
    const isOwnProfile = currentUser.id === targetUserId;
    const isAdmin = currentUser.role === 'admin';
    let hasAccess = isOwnProfile || isAdmin;

    if (!hasAccess) {
        const familyStatus = await getFamilyStatus(targetUserId);
        if (familyStatus.status === 'accepted') {
            hasAccess = true;
        }
    }

    if (!hasAccess) {
        // Return empty or throw? Return empty for safety so UI just shows nothing.
        return [];
    }

    // 2. Fetch Family Members of the TARGET user
    const familyIds = await getFamilyMemberIds(targetUserId);

    // 3. Hydrate details
    const familyMembers = await Promise.all(
        familyIds.map(async id => {
            const userDoc = await adminDb.collection("users").doc(id).get();
            if (userDoc.exists) {
                const data = userDoc.data()!;
                return {
                    id: userDoc.id,
                    ...data,
                    // Sanitize sensitive fields? 
                    // Family members can generally see other family members' basic info.
                    // Let's stick to standard public profile fields.
                    displayName: data.displayName,
                    imageUrl: data.imageUrl,
                    email: data.email, // Maybe? 
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
                };
            }
            return null;
        })
    );

    return sanitizeData(familyMembers.filter(Boolean));
}
