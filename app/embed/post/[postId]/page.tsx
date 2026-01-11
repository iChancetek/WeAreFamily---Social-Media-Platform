import { getPostGlobal } from "@/app/actions/posts";
import { isUrlVideo } from "@/lib/media-utils";
import { Play } from "lucide-react";
import Head from "next/head";

// Allow standalone embedding
export const dynamic = 'force-dynamic';

export default async function EmbedPostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const post = await getPostGlobal(postId);

    if (!post || post.engagementSettings?.privacy === 'private') {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-black text-white p-4 text-center">
                <p>Content is unavailable or private.</p>
            </div>
        );
    }

    const firstMedia = post.mediaUrls?.[0];
    if (!firstMedia) {
        // Text post embed?
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-white text-black p-4 text-center font-sans">
                <div className="max-w-md">
                    <p className="text-xl font-medium mb-4">"{post.content}"</p>
                    <div className="flex items-center justify-center gap-2">
                        {post.author.imageUrl && <img src={post.author.imageUrl} className="w-8 h-8 rounded-full" />}
                        <span className="font-bold">{post.author.displayName}</span>
                    </div>
                </div>
            </div>
        );
    }

    const isVideo = isUrlVideo(firstMedia);

    return (
        <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center relative group">
            {isVideo ? (
                <video
                    src={firstMedia}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    muted
                    playsInline
                    loop
                    poster={post.mediaUrls?.[1] || undefined} // Fallback if 2nd media is thumbnail? Unlikely.
                />
            ) : (
                <img src={firstMedia} className="w-full h-full object-contain" alt="Famio Content" />
            )}

            {/* Overlay branding */}
            <a href="https://famio.us" target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs font-bold hover:bg-black/70 transition-colors z-10">
                Famio
            </a>
        </div>
    );
}
