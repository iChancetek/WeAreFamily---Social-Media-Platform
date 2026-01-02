import { PendingApprovalScreen } from "@/components/auth/pending-approval-screen";
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreatePost } from "@/components/feed/create-post";
import { FeedList } from "@/components/feed/feed-list";
import { LandingPage } from "@/components/landing-page";

import { BirthdayModal } from "@/components/birthdays/birthday-modal";

import { StoriesTray } from "@/components/stories/stories-tray";

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
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-600 dark:from-white dark:via-blue-100 dark:to-gray-400 animate-in fade-in slide-in-from-left-4 duration-700">
          Welcome Home, {profile?.firstName || user.displayName}!
        </h1>
        <BirthdayModal hasBirthday={!!dbUser.birthday} />
        <StoriesTray />
        <CreatePost />
        <FeedList />
      </div>
    </MainLayout>
  );
}
