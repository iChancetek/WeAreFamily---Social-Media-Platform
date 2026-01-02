import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";
import { getBlockedUsers } from "@/app/actions/security";

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    const blockedUsers = await getBlockedUsers();

    return (
        <MainLayout>
            <div className="pb-16 pt-6">
                <SettingsContent user={user} blockedUsers={blockedUsers} />
            </div>
        </MainLayout>
    );
}
