import { PendingApprovalScreen } from "@/components/auth/pending-approval-screen";
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreatePost } from "@/components/feed/create-post";
import { FeedList } from "@/components/feed/feed-list";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const user = await currentUser();

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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Welcome Home, {profile?.firstName || user.firstName}!</h1>
        <CreatePost />
        <FeedList />
      </div>
    </MainLayout>
  );
}
