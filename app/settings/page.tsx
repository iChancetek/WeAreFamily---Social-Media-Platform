import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    return (
        <MainLayout>
            <div className="pb-16 pt-6">
                <SettingsContent user={user} />
            </div>
        </MainLayout>
    );
}
