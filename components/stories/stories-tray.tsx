import { getActiveStories } from "@/app/actions/stories";
import { getUserProfile } from "@/lib/auth";
import { StoriesTrayClient } from "./stories-tray-client";

export async function StoriesTray() {
    const [user, stories] = await Promise.all([
        getUserProfile(),
        getActiveStories()
    ]);

    // Handle profileData type safety
    const profile = user?.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null;

    return (
        <StoriesTrayClient
            currentUserId={user?.id}
            currentUserRole={user?.role}
            currentUserImage={profile?.imageUrl}
            currentUserFirstName={profile?.firstName || 'User'}
            activeStories={stories}
        />
    );
}
