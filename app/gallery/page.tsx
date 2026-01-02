import { MainLayout } from "@/components/layout/main-layout";
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sanitizeData } from "@/lib/serialization";

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
        return (
            <MainLayout>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Family Gallery</h1>
                    <p className="text-gray-500">Shared memories from everyone</p>
                </div>
                <p className="text-center text-gray-500 py-10">No photos shared yet.</p>
            </MainLayout>
        );
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

    const allPosts = postsSnapshot.docs.map(doc => sanitizeData({
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
        (post.mediaUrls || []).map((url: string) => ({ url, postId: post.id }))
    );

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Family Gallery</h1>
                <p className="text-gray-500">Shared memories from everyone</p>
            </div>

            {mediaItems.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No photos shared yet.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaItems.map((item: any, idx: number) => (
                        <div key={`${item.postId}-${idx}`} className="aspect-square rounded-lg overflow-hidden relative group">
                            <img src={item.url} alt="Gallery item" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    )
}
