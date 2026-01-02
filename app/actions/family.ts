'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
    await adminDb.collection("familyRequests").doc(requestId).update({
        status: 'accepted'
    });
    revalidatePath('/family')
}

export async function rejectFamilyRequest(requestId: string) {
    await adminDb.collection("familyRequests").doc(requestId).delete();
    revalidatePath('/family')
}

export async function cancelFamilyRequest(requestId: string) {
    await adminDb.collection("familyRequests").doc(requestId).delete();
    revalidatePath('/family')
}

export async function denyFamilyRequest(requestId: string) {
    await adminDb.collection("familyRequests").doc(requestId).update({
        status: 'rejected'
    });
    revalidatePath('/family')
}

// ... imports

// Helper for serialization
const serialize = (data: any) => JSON.parse(JSON.stringify(data));

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

    return {
        incoming: incomingSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
            };
        }) as any,
        sent: sentSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
            };
        }) as any
    };
}

// ... alias ...

export async function searchFamilyMembers(searchTerm: string) {
    const usersSnapshot = await adminDb.collection("users").get();
    const allUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        };
    }) as any;

    return allUsers.filter((u: any) =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

// ... alias ...

export async function getFamilyMembers() {
    const user = await getUserProfile();
    if (!user) return [];

    // Get accepted family requests
    const sentSnapshot = await adminDb.collection("familyRequests")
        .where("senderId", "==", user.id)
        .where("status", "==", 'accepted')
        .get();

    const receivedSnapshot = await adminDb.collection("familyRequests")
        .where("receiverId", "==", user.id)
        .where("status", "==", 'accepted')
        .get();

    const familyIds = new Set<string>();
    sentSnapshot.docs.forEach(doc => familyIds.add(doc.data().receiverId));
    receivedSnapshot.docs.forEach(doc => familyIds.add(doc.data().senderId));

    // Fetch family member details
    const familyMembers = await Promise.all(
        Array.from(familyIds).map(async id => {
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

    return familyMembers.filter(Boolean);
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
