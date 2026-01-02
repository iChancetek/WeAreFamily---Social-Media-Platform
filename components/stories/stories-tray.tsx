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
            currentUserImage={user?.imageUrl}
            currentUserDisplayName={user?.displayName || 'Family Member'}
            activeStories={stories as any} // Cast to any to bypass strict type check for now, knowing structure matches
        />
    );
}
