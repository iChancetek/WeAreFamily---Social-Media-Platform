export const dynamic = "force-dynamic";

import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { AccountForm } from "@/components/settings/account-form";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    return (
        <MainLayout>
            <div className="space-y-6 pb-16">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <div className="flex-1 lg:max-w-2xl space-y-6">
                        <ProfileForm user={user} />
                        <AccountForm user={user} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
