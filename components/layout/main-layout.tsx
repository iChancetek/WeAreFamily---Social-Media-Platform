"use client";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { RightSidebar } from "./right-sidebar";
import { ActivityTracker } from "@/components/auth/activity-tracker";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/components/auth-provider";

import { cn } from "@/lib/utils";

import { VoiceProvider } from "@/components/ai/voice-provider";

export function MainLayout({ children, className }: { children: React.ReactNode, className?: string }) {
    const { user, profile } = useAuth();
    const isAdmin = profile?.role === 'admin';

    // Default to max-w-2xl if no class provided, but allow override
    const containerClass = className ? cn("mx-auto", className) : "mx-auto max-w-2xl";

    return (
        <VoiceProvider>
            <div className="flex h-screen bg-background overflow-hidden relative">
                <ActivityTracker userId={user?.uid} />

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

                <BottomNav />
            </div>
        </VoiceProvider>
    );
}
