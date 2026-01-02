import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileContent } from "@/components/profile/profile-content";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    return (
        <MainLayout className="max-w-4xl">
            <div className="pb-16 pt-6">
                <ProfileContent user={user as any} />
            </div>
        </MainLayout>
    );
}
