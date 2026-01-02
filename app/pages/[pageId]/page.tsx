import { getPage, getPagePosts, getPageFollowStatus } from "@/app/actions/pages";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Users, Heart } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card";
import { FollowPageButton } from "@/components/pages/follow-page-button";
import { PagePostCreator } from "@/components/pages/page-post-creator";

export default async function PageDetail({ params }: { params: { pageId: string } }) {
    const page = await getPage(params.pageId);
    if (!page) return notFound();

    const user = await getUserProfile();
    const followStatus = await getPageFollowStatus(params.pageId);
    const posts = await getPagePosts(params.pageId);

    const isAdmin = followStatus?.role === 'admin';

    // Construct Page-as-author object for the Creator component
    const pageAuthor = {
        name: page.name,
        imageUrl: page.imageUrl
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="relative h-64 w-full rounded-b-xl overflow-hidden mb-8">
                {page.bannerUrl ? (
                    <img
                        src={page.bannerUrl}
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
                                {page.imageUrl ? (
                                    <img src={page.imageUrl} alt={page.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                        <Briefcase className="w-10 h-10 text-emerald-600" />
                                    </div>
                                )}
                            </div>

                            <div className="mb-1 ml-4"> {/* Offset for the overlap */}
                                <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-1">
                                    <span className="capitalize">{page.category.replace('_', ' ')}</span>
                                </div>
                                <h1 className="text-4xl font-bold">{page.name}</h1>

                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FollowPageButton
                                pageId={page.id}
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
                        <PagePostCreator pageId={page.id} page={pageAuthor} />
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
                            {page.description}
                        </p>
                        <Separator className="my-4" />
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Created</span>
                                <span>{page.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Followers</span>
                                <span>{page.followerCount || 1}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </MainLayout>
    );
}
