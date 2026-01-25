import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { CompanionsCard } from "@/components/profile/companions-card";
import { getCompanions } from "@/app/actions/companions";
import { ProfileFeed } from "@/components/profile/profile-feed";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getUserProfile();

    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const companions = await getCompanions();

    // DEBUG: Log to server console
    console.log("Profile Debug:", {
        userId: user.id,
        userEmail: user.email
    });

    return (
        <MainLayout className="max-w-6xl">
            <div className="pb-16 pt-0">

                <ProfileHeader user={user as any} isCurrentUser={true} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left Column: Sidebar Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <CompanionsCard members={companions as any} />
                    </div>

                    {/* Right Column: Timeline Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        <ProfileFeed userId={user.id} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
