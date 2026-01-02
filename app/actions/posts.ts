'use server'

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, mediaUrls: string[] = []) {
    const user = await getUserProfile()
    if (!user || user.role === 'pending') {
        throw new Error("Unauthorized")
    }

    await adminDb.collection("posts").add({
        authorId: user.id,
        content,
        mediaUrls,
        likes: [],
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/')
}

export async function toggleLike(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = adminDb.collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) throw new Error("Post not found")

    const currentLikes = postSnap.data()?.likes || []
    const isLiked = currentLikes.includes(user.id)

    if (isLiked) {
        await postRef.update({
            likes: FieldValue.arrayRemove(user.id)
        });
    } else {
        await postRef.update({
            likes: FieldValue.arrayUnion(user.id)
        });
    }

    revalidatePath('/')
}

export async function addComment(postId: string, content: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const commentsRef = adminDb.collection("posts").doc(postId).collection("comments");
    await commentsRef.add({
        authorId: user.id,
        content,
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/')
}

export async function getPosts() {
    try {
        const user = await getUserProfile()
        if (!user || user.role === 'pending') {
            return [] // Return empty if unauthorized
        }

        const { getFamilyMemberIds } = await import("./family");
        const { getJoinedGroupIds } = await import("./groups");
        const { getFollowedPageIds } = await import("./pages");
        const { getPage } = await import("./pages");
        const { getGroup } = await import("./groups");

        // Parallel fetch of IDs
        const [familyIds, groupIds, pageIds] = await Promise.all([
            getFamilyMemberIds(user.id),
            getJoinedGroupIds(user.id),
            getFollowedPageIds(user.id)
        ]);

        const allowedAuthorIds = [user.id, ...familyIds];

        // Firestore limits 'in' queries to 10-30 items depending on complexity.
        // We'll prioritize recent items or just slice for now.
        // Ideally, we'd fire 3 separate queries and merge them.

        const queries: Promise<any>[] = [];

        // 1. Family Posts
        if (allowedAuthorIds.length > 0) {
            // Chunking might be needed if > 30 family members
            const chunks = chunkArray(allowedAuthorIds, 30);
            chunks.forEach(chunk => {
                queries.push(
                    adminDb.collection("posts")
                        .where("authorId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'personal' })))
                );
            });
        }

        // 2. Group Posts
        // Group posts are in `groups/{groupId}/posts`
        // We can't query all at once easily unless we query collectionGroup("posts") where groupId in [myGroups]
        // But the schema is `groups/{groupId}/posts`.
        // So we use collectionGroup("posts").
        // Wait, standard posts are in `posts` collection. Group posts are in subcollections.
        // We need to query the subcollections.

        if (groupIds.length > 0) {
            const chunks = chunkArray(groupIds, 10); // stricter limit for collectionGroup
            chunks.forEach(chunk => {
                // Note: We need a field 'groupId' in the post doc to query on it via collectionGroup if it's not the parent?
                // Actually, if we use collectionGroup("posts"), we get ALL posts from top level and subcollections?
                // No, top level is "posts", subcollection is "posts". Yes they share name.
                // But we need to distinguish.
                // This is tricky.

                // Alternative: Fetch for each group. (N+1 problem but manageable for small number of groups).
                // Better: collectionGroup("posts") where 'groupId' in chunk. 
                // My `createGroupPost` adds `groupId` to the doc? Let's check.
                // Yes: `createGroupPost` adds field `groupId`.
                // My `createPost` (personal) does NOT add `groupId`.

                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("groupId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'group' })))
                );
            });
        }

        // 3. Page Posts
        // Page posts are in `pages/{pageId}/posts`.
        // `createPagePost` adds `pageId`.
        if (pageIds.length > 0) {
            const chunks = chunkArray(pageIds, 10);
            chunks.forEach(chunk => {
                queries.push(
                    adminDb.collectionGroup("posts")
                        .where("pageId", "in", chunk)
                        .orderBy("createdAt", "desc")
                        .limit(20)
                        .get()
                        .then(snap => snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'page' })))
                );
            });
        }

        const results = await Promise.all(queries);
        const allRawPosts = results.flat();

        // Sort by date desc
        allRawPosts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        // Hydrate authors/groups/pages
        const finalPosts = await Promise.all(allRawPosts.map(async (post: any) => {
            let author = null;
            let context = null; // "Posted in X"

            if (post.type === 'group') {
                // Fetch author (user) AND Group info
                const [authorDoc, group] = await Promise.all([
                    adminDb.collection("users").doc(post.authorId).get(),
                    getGroup(post.groupId) // Cached/Batched potentially?
                ]);

                author = authorDoc.exists ? {
                    id: authorDoc.id,
                    displayName: authorDoc.data()?.displayName,
                    imageUrl: authorDoc.data()?.imageUrl,
                    email: authorDoc.data()?.email,
                } : null;

                if (group) {
                    context = { type: 'group', name: group.name, id: group.id };
                }

            } else if (post.type === 'page') {
                // Author is the Page usually
                if (post.postedAsPage) {
                    const page = await getPage(post.pageId);
                    if (page) {
                        author = {
                            id: page.id,
                            displayName: page.name,
                            imageUrl: page.imageUrl,
                            email: null
                        };
                    }
                } else {
                    // User posted on page? Not implemented yet but handled
                    const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
                    author = authorDoc.exists ? { ...authorDoc.data(), id: authorDoc.id } : null;
                }

            } else {
                // Personal post
                const authorDoc = await adminDb.collection("users").doc(post.authorId).get();
                author = authorDoc.exists ? {
                    id: authorDoc.id,
                    displayName: authorDoc.data()?.displayName,
                    imageUrl: authorDoc.data()?.imageUrl,
                    email: authorDoc.data()?.email,
                } : null;
            }

            // Fetch comments (legacy logic, maybe optimize later)
            // Note: Currently comments are subcollections of the post.
            // Since we have the post Ref (conceptually), we can get comments.
            // But we lost the Ref in the map.
            // We need to know WHICH collection the post is in to fetch comments.
            // Personal: posts/{id}/comments
            // Group: groups/{groupId}/posts/{id}/comments
            // Page: pages/{pageId}/posts/{id}/comments

            let commentsRef;
            if (post.type === 'group') {
                commentsRef = adminDb.collection("groups").doc(post.groupId).collection("posts").doc(post.id).collection("comments");
            } else if (post.type === 'page') {
                commentsRef = adminDb.collection("pages").doc(post.pageId).collection("posts").doc(post.id).collection("comments");
            } else {
                commentsRef = adminDb.collection("posts").doc(post.id).collection("comments");
            }

            const commentsSnapshot = await commentsRef.orderBy("createdAt", "asc").get();
            const comments = await Promise.all(commentsSnapshot.docs.map(async (cDoc) => {
                const cData = cDoc.data();
                const cAuthorDoc = await adminDb.collection("users").doc(cData.authorId).get();
                return {
                    id: cDoc.id,
                    ...cData,
                    author: cAuthorDoc.exists ? {
                        id: cAuthorDoc.id,
                        displayName: cAuthorDoc.data()?.displayName,
                        imageUrl: cAuthorDoc.data()?.imageUrl
                    } : null,
                    createdAt: cData.createdAt?.toDate() || new Date()
                };
            }));

            return {
                id: post.id,
                content: post.content,
                mediaUrls: post.mediaUrls,
                likes: post.likes,
                createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || Date.now()),
                author,
                comments,
                context // Pass this to UI
            };
        }));

        return finalPosts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

function chunkArray(array: any[], size: number) {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, size + index));
        index += size;
    }
    return chunked;
}

export async function deletePost(postId: string) {
    const user = await getUserProfile()
    if (!user) throw new Error("Unauthorized")

    const postRef = adminDb.collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) throw new Error("Post not found")

    const post = postSnap.data();
    if (post?.authorId !== user.id && user.role !== 'admin') {
        throw new Error("Forbidden")
    }

    // Delete all comments first
    const commentsSnapshot = await postRef.collection("comments").get();
    const batch = adminDb.batch();
    commentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    // Add post deletion to batch
    batch.delete(postRef);

    // Commit the batch
    await batch.commit();

    revalidatePath('/')
}
