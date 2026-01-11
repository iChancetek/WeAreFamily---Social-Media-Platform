import { getActiveStories } from "@/app/actions/stories";
import { getUserProfile } from "@/lib/auth";
import { StoriesTrayClient } from "./stories-tray-client";

export async function StoriesTray() {
    try {
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
                currentUserDisplayName={user?.displayName || 'Unknown'}
                activeStories={stories as any} // Cast to any to bypass strict type check for now, knowing structure matches
            />
        );
    } catch (error) {
        console.error("Error loading stories:", error)
        // Return empty stories tray on error
        return <StoriesTrayClient currentUserId={undefined} currentUserRole={undefined} currentUserImage={undefined} currentUserDisplayName="Unknown" activeStories={[]} />
    }
}
