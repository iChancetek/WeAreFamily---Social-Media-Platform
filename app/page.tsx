export const dynamic = 'force-dynamic';

import { PendingApprovalScreen } from "@/components/auth/pending-approval-screen";
import { MainLayout } from "@/components/layout/main-layout";
import { LandingPage } from "@/components/landing-page";
import { LandingChatWidget } from "@/components/landing/landing-chat-widget";
import { WelcomeHeader } from "@/components/feed/welcome-header";
import { StoriesTray } from "@/components/stories/stories-tray";
import { HomeFeed } from "@/components/feed/home-feed";
import { LiveNowSection } from "@/components/feed/live-now-section";
import { getUserProfile, enforceVerificationAccess } from "@/lib/auth";

export default async function Home() {
    await enforceVerificationAccess();
    const profile = await getUserProfile();

    if (!profile) {
        return (
            <>
                <LandingPage />
                <LandingChatWidget />
            </>
        );
    }

    if (profile.role === 'pending') {
        return <PendingApprovalScreen />;
    }

    const displayName = profile.firstName || profile.displayName || "Family";

    return (
        <MainLayout>
            <div className="pb-8">

                {/* Live Now Section */}
                <LiveNowSection />

                {/* Server Component nested inside Client Component (MainLayout) via children prop pattern */}
                <StoriesTray />

                <HomeFeed />
            </div>
        </MainLayout>
    );
}
