import { MainLayout } from "@/components/layout/main-layout";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GalleryPage() {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    // Fetch posts that have mediaUrls
    // Drizzle doesn't have "array_length" helper ease in ORM query builder for jsonb text array without raw sql usually
    // But since we store as string[], we can filter where not null.
    // Ideally we filter where jsonb_array_length(media_urls) > 0.
    // For now, fetch all posts and filter in code (simplistic for MVP). 
    // Or use raw SQL if needed. Let's use code filter for simplicity.

    const allPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
    });

    const mediaItems = allPosts.flatMap(post => (post.mediaUrls || []).map(url => ({ url, postId: post.id })));

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
