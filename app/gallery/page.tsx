import { MainLayout } from "@/components/layout/main-layout";
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GalleryPage() {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const postsSnapshot = await adminDb.collection("posts").orderBy("createdAt", "desc").get();
    const allPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);

    const mediaItems = allPosts.flatMap((post: any) => (post.mediaUrls || []).map((url: string) => ({ url, postId: post.id })));

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
                    {mediaItems.map((item, idx) => (
                        <div key={`${item.postId}-${idx}`} className="aspect-square rounded-lg overflow-hidden relative group">
                            <img src={item.url} alt="Gallery item" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    )
}
