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

    const serializedUser = user ? {
        ...user,
        createdAt: user.createdAt?.toDate ? user.createdAt.toDate() : new Date(),
        birthday: user.birthday?.toDate ? user.birthday.toDate() : user.birthday || null,
    } : null;

    const blockedUsers = await getBlockedUsers();

    return (
        <MainLayout className="max-w-4xl">
            <div className="pb-16 pt-6">
                <SettingsContent user={serializedUser} blockedUsers={blockedUsers.filter(Boolean) as any} />
            </div>
        </MainLayout>
    );
}
