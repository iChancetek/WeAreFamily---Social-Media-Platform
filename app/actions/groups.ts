'use server'

import { slugify } from "@/lib/utils";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { sanitizeData } from "@/lib/serialization";

export type Group = {
    id: string;
    slug?: string;
    name: string;
    description: string;
    category: string;
    privacy: 'public' | 'private';
    founderId: string;
    imageUrl?: string;
    coverUrl?: string;
    createdAt: Date;
    memberCount?: number;
    isMember?: boolean;
};

export async function createGroup(data: { name: string; description: string; category: string; privacy: 'public' | 'private'; imageUrl?: string; coverUrl?: string }) {
    console.log("Creating group", data);
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    let slug = slugify(data.name);
    let potentialId = slug;
    let counter = 0;

    // Check for uniqueness
    while (true) {
        // 1. Check ID collision
        const doc = await adminDb.collection("groups").doc(potentialId).get();
        if (doc.exists) {
            counter++;
            potentialId = `${slug}-${counter}`;
            continue;
        }

        // 2. Check Slug collision (for old groups)
        const slugCheck = await adminDb.collection("groups").where("slug", "==", potentialId).limit(1).get();
        if (!slugCheck.empty) {
            counter++;
            potentialId = `${slug}-${counter}`;
            continue;
        }

        break;
    }

    const groupRef = adminDb.collection("groups").doc(potentialId);
    await groupRef.set({
        ...data,
        slug: potentialId, // Force slug to match ID for new groups
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

    return groupsSnapshot.docs.map((doc: any) => {
        return sanitizeData({
            id: doc.id,
            ...doc.data()
        }) as Group;
    });
}

export async function getGroup(identifier: string) {
    // 1. Try by ID (Fastest/Default for new groups)
    let doc = await adminDb.collection("groups").doc(identifier).get();

    // 2. If not found, try by slug (for old groups migrated to have slugs)
    if (!doc.exists) {
        const snapshot = await adminDb.collection("groups").where("slug", "==", identifier).limit(1).get();
        if (!snapshot.empty) {
            doc = snapshot.docs[0];
        } else {
            return null;
        }
    }

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

    const docRef = await adminDb.collection("groups").doc(groupId).collection("posts").add({
        authorId: user.id,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.post_create", {
        targetType: "group_post",
        targetId: docRef.id,
        details: { groupId, content: content.substring(0, 50) }
    });

    revalidatePath(`/groups/${groupId}`);
}

export async function editGroupPost(groupId: string, postId: string, content: string) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const postRef = adminDb.collection("groups").doc(groupId).collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) throw new Error("Post not found");
    // Only author can edit
    if (postDoc.data()?.authorId !== user.id) throw new Error("Unauthorized");

    await postRef.update({
        content,
        isEdited: true,
        updatedAt: FieldValue.serverTimestamp()
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

    const allPosts = await Promise.all(postsSnapshot.docs.map(async (postDoc: any) => {
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
            author,
            context: { type: 'group', id: groupId, name: group?.name }
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

    snapshot.docs.forEach((doc: any) => {
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

export async function updateGroupCover(groupId: string, coverUrl: string | null) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    // Check if user is founder or admin
    const groupDoc = await adminDb.collection("groups").doc(groupId).get();
    if (!groupDoc.exists) throw new Error("Group not found");

    const groupData = groupDoc.data();
    const isFounder = groupData?.founderId === user.id;

    if (!isFounder) {
        // Check if admin member
        const memberDoc = await adminDb.collection("groups").doc(groupId).collection("members").doc(user.id).get();
        const isAdmin = memberDoc.exists && memberDoc.data()?.role === 'admin';
        if (!isAdmin) {
            throw new Error("Only group founder or admins can update the cover");
        }
    }

    await adminDb.collection("groups").doc(groupId).update({
        coverUrl: coverUrl || null
    });

    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("group.update_cover", {
        targetType: "group",
        targetId: groupId,
        details: { hasCover: !!coverUrl }
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/groups');
}

