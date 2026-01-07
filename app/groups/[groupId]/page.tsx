import { getGroup, getGroupPosts, joinGroup, leaveGroup, getGroupMemberStatus } from "@/app/actions/groups";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Lock, Globe, Plus, Sparkles } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { CreatePost } from "@/components/feed/create-post";
// Note: CreatePost might need adjustment to support group posting context.
// For now, I'll create a dedicated GroupPostCreator or adapt the existing one if possible.
// Let's create a simple inline poster for groups for now.

import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card"; // Assuming this creates the post view
import { GroupPostCreator } from "@/components/groups/group-post-creator"; // Will create this next
import { JoinGroupButton } from "@/components/groups/join-group-button"; // Client component for actions
import { GroupAITutorBanner } from "@/components/groups/group-ai-tutor-banner";
import { GroupCoverButton } from "@/components/groups/group-cover-button";
import { GroupManagementDialog } from "@/components/groups/group-management-dialog";
import { Trash2 } from "lucide-react";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
    const group = await getGroup(groupId);
    if (!group) return notFound();

    const user = await getUserProfile();
    // Use group.id (resolved) instead of params.groupId (potential slug)
    const memberStatus = await getGroupMemberStatus(group.id);
    const isMember = !!memberStatus;
    const posts = await getGroupPosts(group.id);

    // If private and not member, check if we can see anything?
    // Usually show basic info and join button.
    const canViewContent = group.privacy === 'public' || isMember;

    return (
        <MainLayout>
            {/* Group Header */}
            <div className="relative h-64 w-full rounded-b-xl overflow-hidden mb-8">
                {group.coverUrl ? (
                    group.coverUrl.includes('mp4') || group.coverUrl.includes('webm') ? (
                        <video
                            src={group.coverUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={group.coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    )
                ) : group.imageUrl ? (
                    <img
                        src={group.imageUrl}
                        alt={group.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" />
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24 text-white">
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-1">
                                {group.privacy === 'private' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                <span className="capitalize">{group.privacy} Group</span>
                                <span>•</span>
                                <span className="capitalize">{group.category}</span>
                            </div>
                            <h1 className="text-4xl font-bold">{group.name}</h1>
                            <p className="mt-2 max-w-2xl opacity-90">{group.description}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Management Dialog for Admins/Founders */}
                            {(user?.id === group.founderId || memberStatus?.role === 'admin') && user && (
                                <GroupManagementDialog
                                    group={group}
                                    currentUser={user}
                                    isAdmin={true}
                                />
                            )}
                            {/* Join/Leave Button Client Component */}
                            <JoinGroupButton
                                groupId={group.id}
                                isMember={isMember}
                                memberCount={group.memberCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Soft Delete Notice for Owner */}
            {group.deletedAt && (user?.id === group.founderId) && (
                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trash2 className="h-5 w-5 text-yellow-500" />
                        <div>
                            <h4 className="font-semibold text-yellow-500">This group is scheduled for deletion</h4>
                            <p className="text-sm text-yellow-500/90">
                                It is currently hidden from the public. It will be permanently deleted on {group.scheduledPermanentDeleteAt?.toDate().toLocaleDateString()}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {canViewContent ? (
                        <>
                            {isMember && (
                                <GroupPostCreator groupId={group.id} user={user!} />
                            )}

                            {/* AI Tutor Banner for School Groups */}
                            {(group.name.toLowerCase().includes('school') || group.name.toLowerCase().includes('homework') || group.category.toLowerCase() === 'education') && (
                                <GroupAITutorBanner />
                            )}

                            <div className="space-y-4">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} currentUserId={user?.id || ''} />
                                ))}
                                {posts.length === 0 && (
                                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                                        <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-medium mb-2">This group is private</h3>
                            <p className="text-muted-foreground">Join this group to view posts and participate in the discussion.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            About
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Created</span>
                                <span>{group.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Members</span>
                                <span>{group.memberCount || 1}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Category</span>
                                <span className="capitalize">{group.category}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </MainLayout>
    );
}
