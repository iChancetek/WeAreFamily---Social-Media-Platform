import { PendingApprovalScreen } from "@/components/auth/pending-approval-screen";
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreatePost } from "@/components/feed/create-post";
import { FeedList } from "@/components/feed/feed-list";
import { LandingPage } from "@/components/landing-page";

import { BirthdayModal } from "@/components/birthdays/birthday-modal";

import { WelcomeHeader } from "@/components/feed/welcome-header";
import { StoriesTray } from "@/components/stories/stories-tray";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUserProfile();

  if (!user) {
    return <LandingPage />;
  }

  const dbUser = await getUserProfile();

  // If user is not synced yet (webhook latency), show loading or pending
  if (!dbUser) {
    return <PendingApprovalScreen />;
  }

  if (dbUser.role === 'pending') {
    return <PendingApprovalScreen />;
  }

  // Cast profileData for type safety
  const profile = dbUser.profileData as { firstName?: string };

  return (
    <MainLayout>
      <div className="pb-8">
        <WelcomeHeader displayName={profile?.firstName || user.displayName || "Family"} />
        {/* <BirthdayModal hasBirthday={!!dbUser.birthday} /> */}
        <StoriesTray />
        <CreatePost />
        <FeedList />
      </div>
    </MainLayout>
  );
}
