import { getBranding, getBrandingFollowStatus } from "@/app/actions/branding";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Briefcase, ArrowLeft } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { BrandingFeed } from "@/components/branding/branding-feed";
import { BrandingHeader } from "@/components/branding/branding-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function BrandingDetail({ params }: { params: Promise<{ brandingId: string }> }) {
    const { brandingId } = await params;
    const branding = await getBranding(brandingId);
    if (!branding) return notFound();

    const user = await getUserProfile();
    // Use branding.id (resolved) instead of params.brandingId (potential slug)
    const followStatus = await getBrandingFollowStatus(branding.id);

    const isFollowing = !!followStatus;
    const isBrandingAdmin = followStatus?.role === 'admin';

    // Construct Branding-as-author object for the Creator component
    const brandingAuthor = {
        name: branding.name,
        imageUrl: branding.imageUrl
    };

    return (
        <MainLayout>
            {/* Back Button */}
            <Link href="/branding">
                <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Branding
                </Button>
            </Link>

            <BrandingHeader
                branding={branding}
                currentUser={user}
                isBrandingAdmin={isBrandingAdmin}
                isFollowing={isFollowing}
                followStatusRole={followStatus?.role}
            />

            {/* Soft Delete Notice for Owner */}
            {
                branding.deletedAt && (user?.id === branding.founderId) && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg flex items-center justify-between mx-4 lg:mx-0">
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

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Post Creator for Followers and Admins */}
                    <BrandingFeed
                        brandingId={branding.id}
                        currentUser={user}
                        brandingAuthor={brandingAuthor}
                        role={followStatus?.role || ''}
                    />
                </div>

                <div className="space-y-6">
                    <Card className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            About
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
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
