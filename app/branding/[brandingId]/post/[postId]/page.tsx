import { getBrandingPost, getBranding } from "@/app/actions/branding";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/feed/post-card";
import { getUserProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BrandingPostPage({ params }: { params: Promise<{ brandingId: string; postId: string }> }) {
    const { brandingId, postId } = await params;
    const branding = await getBranding(brandingId);

    const { getBrandingPost } = await import("@/app/actions/branding");
    const post = await getBrandingPost(brandingId, postId);

    if (!post || !branding) return notFound();

    const user = await getUserProfile();

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8">
                <Link href={`/branding/${brandingId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-1 w-4 h-4" />
                    Back to {branding.name}
                </Link>
                <PostCard post={post} currentUserId={user?.id} />
            </div>
        </MainLayout>
    );
}
