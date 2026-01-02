'use server'

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
    const requestsQuery = query(
        collection(db, "familyRequests"),
        where("senderId", "==", user.id),
        where("receiverId", "==", receiverId)
    );
    const existing = await getDocs(requestsQuery);

    if (!existing.empty) {
        throw new Error("Request already exists");
    }

    const docRef = await addDoc(collection(db, "familyRequests"), {
        senderId: user.id,
        receiverId: receiverId,
        status: 'pending',
        createdAt: new Date(),
    });

    revalidatePath(`/u/${receiverId}`)
    return docRef.id;
}

export async function acceptFamilyRequest(requestId: string) {
    await updateDoc(doc(db, "familyRequests", requestId), {
        status: 'accepted'
    });
    revalidatePath('/family')
}

export async function rejectFamilyRequest(requestId: string) {
    await deleteDoc(doc(db, "familyRequests", requestId));
    revalidatePath('/family')
}

export async function cancelFamilyRequest(requestId: string) {
    await deleteDoc(doc(db, "familyRequests", requestId));
    revalidatePath('/family')
}

export async function denyFamilyRequest(requestId: string) {
    await updateDoc(doc(db, "familyRequests", requestId), {
        status: 'rejected'
    });
    revalidatePath('/family')
}

export async function getFamilyRequests() {
    const user = await getUserProfile();
    if (!user) return { incoming: [], sent: [] };

    const incomingQuery = query(
        collection(db, "familyRequests"),
        where("receiverId", "==", user.id),
        where("status", "==", 'pending')
    );

    const sentQuery = query(
        collection(db, "familyRequests"),
        where("senderId", "==", user.id),
        where("status", "==", 'pending')
    );

    const [incomingSnapshot, sentSnapshot] = await Promise.all([
        getDocs(incomingQuery),
        getDocs(sentQuery)
    ]);

    return {
        incoming: incomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any),
        sent: sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any)
    };
}

// Alias for family page
export const getPendingRequests = getFamilyRequests;

export async function searchFamilyMembers(searchTerm: string) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);

    return allUsers.filter((u: any) =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

// Alias for backward compatibility
export const searchUsers = searchFamilyMembers;

export async function getFamilyMembers() {
    const user = await getUserProfile();
    if (!user) return [];

    // Get accepted family requests
    const sentQuery = query(
        collection(db, "familyRequests"),
        where("senderId", "==", user.id),
        where("status", "==", 'accepted')
    );
    const receivedQuery = query(
        collection(db, "familyRequests"),
        where("receiverId", "==", user.id),
        where("status", "==", 'accepted')
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
    ]);

    const familyIds = new Set<string>();
    sentSnapshot.docs.forEach(doc => familyIds.add(doc.data().receiverId));
    receivedSnapshot.docs.forEach(doc => familyIds.add(doc.data().senderId));

    // Fetch family member details
    const familyMembers = await Promise.all(
        Array.from(familyIds).map(async id => {
            const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", id)));
            if (!userDoc.empty) {
                return { id: userDoc.docs[0].id, ...userDoc.docs[0].data() };
            }
            return null;
        })
    );

    return familyMembers.filter(Boolean);
}

export async function getFamilyStatus(targetUserId: string): Promise<FamilyStatus> {
    const user = await getUserProfile();
    if (!user) return { status: 'none' } as FamilyStatus;

    const sentQuery = query(
        collection(db, "familyRequests"),
        where("senderId", "==", user.id),
        where("receiverId", "==", targetUserId)
    );
    const receivedQuery = query(
        collection(db, "familyRequests"),
        where("senderId", "==", targetUserId),
        where("receiverId", "==", user.id)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
    ]);

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
