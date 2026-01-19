import { MainLayout } from "@/components/layout/main-layout";
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sanitizeData } from "@/lib/serialization";
import { GalleryView } from "@/components/gallery/gallery-view";

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const { getFamilyMemberIds } = await import("@/app/actions/family");
    const familyIds = await getFamilyMemberIds(user.id);
    const allowedIds = [user.id, ...familyIds];
    const queryIds = allowedIds.slice(0, 30); // Limit to 30 for Firestore 'in' query

    if (queryIds.length === 0) {
        return <GalleryView mediaItems={[]} currentUserId={user.id} />;
    }

    let postsSnapshot;
    try {
        postsSnapshot = await adminDb.collection("posts")
            .where("authorId", "in", queryIds)
            .orderBy("createdAt", "desc")
            .get();
    } catch (e) {
        console.log("Gallery index missing, falling back to unordered query");
        postsSnapshot = await adminDb.collection("posts")
            .where("authorId", "in", queryIds)
            .get();
        // We will sort in memory below
    }

    const allPosts = postsSnapshot.docs.map((doc: any) => sanitizeData({
        id: doc.id,
        ...doc.data()
    })) as any[];

    // Sort in memory to handle fallback case
    allPosts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
    });

    const mediaItems = allPosts.flatMap((post: any) =>
        (post.mediaUrls || []).map((url: string) => ({
            url,
            postId: post.id,
            authorId: post.authorId
        }))
    );

    return (
        <GalleryView
            mediaItems={mediaItems}
            currentUserId={user.id}
        />
    )
}
