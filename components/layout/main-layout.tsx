import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { RightSidebar } from "./right-sidebar";
import { ActivityTracker } from "@/components/auth/activity-tracker";
import { BirthdayOnboarding } from "@/components/onboarding/birthday-onboarding";
import { BottomNav } from "./bottom-nav";

import { getUserProfile } from "@/lib/auth";

import { cn } from "@/lib/utils";

export async function MainLayout({ children, className }: { children: React.ReactNode, className?: string }) {
    const user = await getUserProfile();
    const isAdmin = user?.role === 'admin';

    // Default to max-w-2xl if no class provided, but allow override
    const containerClass = className ? cn("mx-auto", className) : "mx-auto max-w-2xl";

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            <ActivityTracker userId={user?.id} />

            {/* Sidebar is now floating, fixed position */}
            <Sidebar isAdmin={isAdmin} className="hidden md:flex" />

            {/* Main Content Area - Added left margin to account for floating sidebar */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-[105px] transition-all duration-300">
                <TopNav className="md:hidden border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40" />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className={containerClass}>
                        {children}
                    </div>
                </main>
            </div>

            <RightSidebar className="hidden xl:flex border-l border-border/50 bg-background/50 backdrop-blur-sm w-80 p-4" />

            {/* BirthdayOnboarding disabled to debug sidebar interactions - potentially blocking clicks */}
            {/* <BirthdayOnboarding currentBirthday={user?.birthday || null} /> */}
            <BottomNav />
        </div>
    );
}
