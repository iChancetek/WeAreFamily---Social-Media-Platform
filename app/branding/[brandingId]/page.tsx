import { getBranding, getBrandingPosts, getBrandingFollowStatus } from "@/app/actions/branding";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Heart } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card";
import { FollowBrandingButton } from "@/components/branding/follow-branding-button";
import { BrandingPostCreator } from "@/components/branding/branding-post-creator";
import { BrandingCoverButton } from "@/components/branding/branding-cover-button";

import { BrandingManagementDialog } from "@/components/branding/branding-management-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { Trash2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BrandingDetail({ params }: { params: Promise<{ brandingId: string }> }) {
    const { brandingId } = await params;
    const branding = await getBranding(brandingId);
    if (!branding) return notFound();

    const user = await getUserProfile();
    // Use branding.id (resolved) instead of params.brandingId (potential slug)
    const followStatus = await getBrandingFollowStatus(branding.id);
    const posts = await getBrandingPosts(branding.id);

    const isFollowing = !!followStatus;
    const isAdmin = followStatus?.role === 'admin';

    // Construct Branding-as-author object for the Creator component
    const brandingAuthor = {
        name: branding.name,
        imageUrl: branding.imageUrl
    };

    return (
        <MainLayout>
            {/* ... */}
            <div className="flex items-center gap-3">
                {/* Management Dialog for Admins */}
                {isAdmin && user && (
                    <BrandingManagementDialog
                        branding={branding}
                        currentUser={user}
                        isAdmin={true}
                    />
                )}
                <FollowBrandingButton
                    brandingId={branding.id}
                    isFollowing={isFollowing}
                    role={followStatus?.role}
                />
                <ShareButton
                    title={branding.name}
                    text={`Check out this page: ${branding.name}`}
                    variant="secondary"
                />
            </div>



            {/* Soft Delete Notice for Owner */}
            {
                branding.deletedAt && (user?.id === branding.founderId) && (
                    <div className="mt-8 mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg flex items-center justify-between mx-4 lg:mx-0">
                        <div className="flex items-center gap-3">
                            <Trash2 className="h-5 w-5 text-yellow-500" />
                            <div>
                                <h4 className="font-semibold text-yellow-500">This page is scheduled for deletion</h4>
                                <p className="text-sm text-yellow-500/90">
                                    It is currently hidden from the public. It will be permanently deleted on {branding.scheduledPermanentDeleteAt?.toDate().toLocaleDateString()}.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Adjusted margin top for profile pic overlap */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Post Creator for Followers and Admins */}
                    {followStatus && (
                        <BrandingPostCreator
                            brandingId={branding.id}
                            branding={brandingAuthor}
                            currentUser={user!}
                            role={followStatus.role}
                        />
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

        </MainLayout >
    );
}
