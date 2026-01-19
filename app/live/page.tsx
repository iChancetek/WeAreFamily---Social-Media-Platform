import { getActiveBroadcasts } from "@/app/actions/rtc";
import { LiveView } from "@/components/live/live-view";

// Force dynamic rendering to avoid build-time Firestore index requirement
export const dynamic = 'force-dynamic';

// Live broadcasts page - deployed 2026-01-04 03:40
export default async function LivePage() {
    let broadcasts: any[] = [];
    let error: string | null = null;

    try {
        broadcasts = await getActiveBroadcasts();
    } catch (err: any) {
        console.error("Error loading broadcasts:", err);
        error = err.message;
    }

    return <LiveView broadcasts={broadcasts} error={error} />;
}
