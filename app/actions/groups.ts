'use server'

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export type Group = {
    id: string;
    name: string;
    description: string;
    category: string;
    privacy: 'public' | 'private';
    founderId: string;
    imageUrl?: string;
    createdAt: Date;
    memberCount?: number;
    isMember?: boolean;
};

export async function createGroup(data: { name: string; description: string; category: string; privacy: 'public' | 'private'; imageUrl?: string }) {
    console.log("Creating group", data);
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const groupRef = await adminDb.collection("groups").add({
        ...data,
        founderId: user.id,
        createdAt: FieldValue.serverTimestamp(),
        memberCount: 1, // Founder is first member
    });

    // Add founder as admin member
    await groupRef.collection("members").doc(user.id).set({
        userId: user.id,
        role: 'admin',
        joinedAt: FieldValue.serverTimestamp(),
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.create", {
        targetType: "group",
        targetId: groupRef.id,
        details: { name: data.name }
    });

    revalidatePath('/groups');
    return groupRef.id;
}

export async function getGroups() {
    const user = await getUserProfile();
    const groupsSnapshot = await adminDb.collection("groups").orderBy("createdAt", "desc").get();

    // In a real app, we might want to check membership for each group efficiently
    // For now, we'll just return the groups.

    return groupsSnapshot.docs.map(doc => {
        return sanitizeData({
            id: doc.id,
            ...doc.data()
        }) as Group;
    });
}

export async function getGroup(groupId: string) {
    const doc = await adminDb.collection("groups").doc(groupId).get();
    if (!doc.exists) return null;

    return sanitizeData({
        id: doc.id,
        ...doc.data()
    }) as Group;
}

export async function joinGroup(groupId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const memberRef = adminDb.collection("groups").doc(groupId).collection("members").doc(user.id);
    const memberDoc = await memberRef.get();

    if (memberDoc.exists) return; // Already a member

    await memberRef.set({
        userId: user.id,
        role: 'member',
        joinedAt: FieldValue.serverTimestamp(),
    });

    // Increment member count
    await adminDb.collection("groups").doc(groupId).update({
        memberCount: FieldValue.increment(1)
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.join", {
        targetType: "group",
        targetId: groupId
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/groups');
}

export async function leaveGroup(groupId: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    await adminDb.collection("groups").doc(groupId).collection("members").doc(user.id).delete();

    // Decrement member count
    await adminDb.collection("groups").doc(groupId).update({
        memberCount: FieldValue.increment(-1)
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.leave", {
        targetType: "group",
        targetId: groupId
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/groups');
}

export async function getGroupMemberStatus(groupId: string) {
    const user = await getUserProfile();
    if (!user) return null;

    const memberDoc = await adminDb.collection("groups").doc(groupId).collection("members").doc(user.id).get();
    if (!memberDoc.exists) return null;

    return sanitizeData(memberDoc.data()) as { role: 'admin' | 'member', joinedAt: any };
}

export async function createGroupPost(groupId: string, content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Check membership
    const memberStatus = await getGroupMemberStatus(groupId);
    if (!memberStatus) throw new Error("Must be a member to post");

    await adminDb.collection("groups").doc(groupId).collection("posts").add({
        authorId: user.id,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.post_create", {
        targetType: "group_post",
        targetId: groupId,
        details: { content: content.substring(0, 50) }
    });

    revalidatePath(`/groups/${groupId}`);
}

export async function getGroupPosts(groupId: string) {
    const user = await getUserProfile();
    if (!user) return [];

    // Check privacy
    const group = await getGroup(groupId);
    if (group?.privacy === 'private') {
        const memberStatus = await getGroupMemberStatus(groupId);
        if (!memberStatus) return [];
    }

    const postsSnapshot = await adminDb.collection("groups").doc(groupId).collection("posts")
        .orderBy("createdAt", "desc")
        .get();

    const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();

        // Fetch author
        const authorDoc = await adminDb.collection("users").doc(postData.authorId).get();
        const author = authorDoc.exists ? {
            id: authorDoc.id,
            displayName: authorDoc.data()?.displayName,
            imageUrl: authorDoc.data()?.imageUrl,
            email: authorDoc.data()?.email,
        } : null;

        return sanitizeData({
            id: postDoc.id,
            content: postData.content || "",
            mediaUrls: postData.mediaUrls || [],
            createdAt: postData.createdAt,
            likes: postData.likes || [],
            author
        });
    }));

    return allPosts;
}

export async function getJoinedGroupIds(userId: string) {
    // Use collectionGroup query to find all 'members' docs where userId matches
    const snapshot = await adminDb.collectionGroup("members")
        .where("userId", "==", userId)
        .get();

    const groupIds = new Set<string>();

    snapshot.docs.forEach(doc => {
        // Doc path: groups/{groupId}/members/{userId}
        // doc.ref.parent is 'members' collection
        // doc.ref.parent.parent is 'groups/{groupId}' doc
        const groupDoc = doc.ref.parent.parent;
        if (groupDoc) {
            groupIds.add(groupDoc.id);
        }
    });

    return Array.from(groupIds);
}
