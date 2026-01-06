import { getBranding, getBrandingPosts, getBrandingFollowStatus } from "@/app/actions/branding";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Users, Heart, Camera } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card";
import { FollowBrandingButton } from "@/components/branding/follow-branding-button";
import { BrandingPostCreator } from "@/components/branding/branding-post-creator";

export const dynamic = 'force-dynamic';

export default async function BrandingDetail({ params }: { params: Promise<{ brandingId: string }> }) {
    const { brandingId } = await params;
    const branding = await getBranding(brandingId);
    if (!branding) return notFound();

    const user = await getUserProfile();
    const followStatus = await getBrandingFollowStatus(brandingId);
    const posts = await getBrandingPosts(brandingId);

    const isAdmin = followStatus?.role === 'admin';

    // Construct Branding-as-author object for the Creator component
    const brandingAuthor = {
        name: branding.name,
        imageUrl: branding.imageUrl
    };

    return (
        <MainLayout>
            {/* Branding Header */}
            <div className="relative h-64 w-full rounded-b-xl overflow-hidden mb-8">
                {branding.coverUrl ? (
                    branding.coverUrl.includes('mp4') || branding.coverUrl.includes('webm') ? (
                        <video
                            src={branding.coverUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={branding.coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    )
                ) : branding.bannerUrl ? (
                    <img
                        src={branding.bannerUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-600" />
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24 text-white">
                    <div className="flex items-end justify-between">
                        <div className="flex items-center gap-4">
                            {/* Profile Pic Overlay */}
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden -mb-10 shadow-lg relative z-10">
                                {branding.imageUrl ? (
                                    <img src={branding.imageUrl} alt={branding.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                        <Briefcase className="w-10 h-10 text-emerald-600" />
                                    </div>
                                )}
                            </div>

                            <div className="mb-1 ml-4"> {/* Offset for the overlap */}
                                <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-1">
                                    <span className="capitalize">{branding.category.replace('_', ' ')}</span>
                                </div>
                                <h1 className="text-4xl font-bold">{branding.name}</h1>

                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Edit Cover Button for Admins */}
                            {isAdmin && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2"
                                    title="Change Cover Photo"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cover</span>
                                </Button>
                            )}
                            <FollowBrandingButton
                                brandingId={branding.id}
                                isFollowing={!!followStatus}
                                role={followStatus?.role}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Adjusted margin top for profile pic overlap */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Admin Post Creator */}
                    {isAdmin && (
                        <BrandingPostCreator brandingId={branding.id} branding={brandingAuthor} />
                    )}

                    <div className="space-y-4">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} currentUserId={user?.id || ''} />
                        ))}
                        {posts.length === 0 && (
                            <div className="text-center py-12 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">No updates yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            About
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {branding.description}
                        </p>
                        <Separator className="my-4" />
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Created</span>
                                <span>{branding.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Followers</span>
                                <span>{branding.followerCount || 1}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </MainLayout>
    );
}
