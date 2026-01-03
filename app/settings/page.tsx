import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";
import { getBlockedUsers } from "@/app/actions/security";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    const blockedUsers = await getBlockedUsers();

    console.log("[SettingsPage] User ID:", user.id);
    console.log("[SettingsPage] isInvisible:", user.isInvisible);
    console.log("[SettingsPage] Blocked Users Count:", blockedUsers.length);

    return (
        <MainLayout className="max-w-4xl">
            <div className="pb-16 pt-6">
                <SettingsContent user={user} blockedUsers={blockedUsers.filter(Boolean) as any} />
            </div>
        </MainLayout>
    );
}
