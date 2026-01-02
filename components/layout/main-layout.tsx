import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { RightSidebar } from "./right-sidebar";
import { ActivityTracker } from "./activity-tracker";
import { BirthdayOnboarding } from "@/components/onboarding/birthday-onboarding";

import { getUserProfile } from "@/lib/auth";

export async function MainLayout({ children }: { children: React.ReactNode }) {
    const user = await getUserProfile();
    const isAdmin = user?.role === 'admin';

    return (
        <div className="flex h-screen bg-transparent">
            <ActivityTracker />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNav className="md:hidden border-b border-white/10" />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mx-auto max-w-2xl">
                        {children}
                    </div>
                </main>
            </div>
            <RightSidebar className="border-l border-white/10 bg-transparent" />
            <BirthdayOnboarding currentBirthday={user?.birthday || null} />
        </div>
    );
}
