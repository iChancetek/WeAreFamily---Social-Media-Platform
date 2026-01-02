```javascript
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { FamilyMembersCard } from "@/components/profile/family-members-card";
import { PostCard } from "@/components/feed/post-card";
import { getUserPosts } from "@/app/actions/posts";
import { getFamilyMembers } from "@/app/actions/family";
import { CreatePost } from "@/components/feed/create-post";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const [userPosts, familyMembers] = await Promise.all([
        getUserPosts(user.id),
        getFamilyMembers(),
    ]);

    return (
                        <FamilyMembersCard members={familyMembers as any} />

                        {/* You could add a "Photos" card or "Intro" card here later */}
                    </div>

                    {/* Right Column: Timeline Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <PostCard key={post.id} post={post as any} currentUserId={user.id} />
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-dashed border-gray-200 dark:border-white/10">
                                <p className="text-muted-foreground">No posts yet on your timeline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
