"use client";

import { useEffect, useRef } from "react";
import { startTrackingSession, updateSessionHeartbeat, endTrackingSession } from "@/app/actions/activity";

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

export function ActivityTracker({ userId }: { userId: string | null | undefined }) {
    const sessionIdRef = useRef<string | null>(null);
    const durationRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!userId) return;

        let isActive = true;

        const initSession = async () => {
            try {
                const sid = await startTrackingSession();
                if (isActive && sid) {
                    sessionIdRef.current = sid;
                    console.log("[ActivityTracker] Session started:", sid);

                    // Start Heartbeat
                    intervalRef.current = setInterval(async () => {
                        if (!sessionIdRef.current) return;

                        // Only track time if page is visible
                        if (document.visibilityState === 'visible') {
                            durationRef.current += HEARTBEAT_INTERVAL_MS;

                            // We send the accumulated duration
                            await updateSessionHeartbeat(sessionIdRef.current, durationRef.current).catch(err => {
                                console.error("[ActivityTracker] Heartbeat failed", err);
                            });
                        }
                    }, HEARTBEAT_INTERVAL_MS);
                }
            } catch (error) {
                console.error("[ActivityTracker] Failed to start session", error);
            }
        };

        initSession();

        const handleUnload = () => {
            if (sessionIdRef.current) {
                // Try to send beacon or simple fetch safely?
                // Next.js actions might not work reliably in 'unload'.
                // We rely on the heartbeat validity window usually.
                // But let's try calling the action via keepalive fetch if we had an endpoint, 
                // but actions are POST.
                // For now, we rely on the server cleaning up "stale" sessions if needed, 
                // or just the last heartbeat time as the "end" time roughly.
                // Explicit logout handles the clean "Completed" status.
                // Tab close will leave it as "Active" until considered stale?
                // Actually, we can use `navigator.sendBeacon` if we had an API route.
                // Given the constraints, we accept that tab-close might miss the absolute final second.
                // We will just clear the interval.
            }
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            isActive = false;
            window.removeEventListener("beforeunload", handleUnload);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // Note: We do NOT end the session on unmount because unmount happens on route change in SPAs.
            // We only end it on explicit logout or let it timeout on server/next-visit.
            // Wait, MainLayout persists? Yes. So unmount means Refresh or Leave.
            // If Refresh, we want to continue? Actually unmount means leaving the SPA context.
            // So we SHOULD probably end it or let a new one start?
            // If we start a new one on refresh, we get a lot of sessions.
            // Better to keep it simple: New Load = New Session.

            // Allow session to be marked completed on unmount if we can?
            // But strict mode mounts/unmounts.
            // Implementation detail: We'll leave it 'active' and rely on "lastHeartbeat" to determine validity.
            // Explicit logout calls 'deleteSession' which cleans up.
        };
    }, [userId]);

    return null; // Invisible component
}
