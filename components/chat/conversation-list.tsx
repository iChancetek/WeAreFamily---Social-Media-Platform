'use client';

import { useRealtimeChats } from "@/hooks/use-realtime-chats";
import { Link } from "@/components/ui/link"; // Assuming generic link or next/link
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/app/actions/auth"; // We might need this to know who the "other" user is? 
// Actually useRealtimeChats returns participants. We need to fetch user details.
// Or we can rely on the data being present?
// The server action returns enriched data, but useRealtimeChats only returns raw data updates?
// A better pattern: Initial load via Server Action (passed as props), then Realtime updates for "lastMessage" and sorting.
// However, to keep it simple and client-side dynamic:
// We can fetch user details for each chat async or use a user cache.
// For now, let's implement a simple version that requires full data.
// Wait, useRealtimeChats only gives IDs. We need names and avatars.
// Let's create a helper to fetch user details if not present.

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationList({ className }: { className?: string }) {
    const { chats, loading } = useRealtimeChats();
    const pathname = usePathname();
    const [userDetails, setUserDetails] = useState<Record<string, any>>({});

    // Fetch user details for participants
    useEffect(() => {
        const fetchMissingUsers = async () => {
            const missingIds = new Set<string>();
            chats.forEach(chat => {
                chat.participants.forEach(pid => {
                    // Logic to exclude 'me' happens here or in rendering
                    if (!userDetails[pid]) missingIds.add(pid);
                });
            });

            if (missingIds.size === 0) return;

            // Batch fetching would be better, but loop is fine for MVP
            const newDetails = { ...userDetails };
            await Promise.all(Array.from(missingIds).map(async (uid) => {
                try {
                    const snap = await getDoc(doc(db, "users", uid));
                    if (snap.exists()) {
                        newDetails[uid] = snap.data();
                    }
                } catch (e) {
                    console.error("Failed to fetch user", uid, e);
                }
            }));
            setUserDetails(newDetails);
        };

        if (chats.length > 0) {
            fetchMissingUsers();
        }
    }, [chats]);

    // We need current user ID to filter "other participant"
    // Assuming we can get it from auth context or implicit knowledge that "other" is logical
    // Let's use a simple hook for current user
    const { user: currentUser } = useAuth();

    if (loading) {
        return (
            <div className={`p-4 space-y-4 ${className}`}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (chats.length === 0) {
        return <div className="p-4 text-center text-gray-500">No conversations yet.</div>;
    }

    return (
        <div className={cn("flex flex-col h-full overflow-y-auto", className)}>
            {chats.map(chat => {
                const otherId = chat.participants.find(p => p !== currentUser?.uid) || chat.participants[0];
                const otherUser = userDetails[otherId];
                const isActive = pathname === `/messages/${chat.id}`;

                // Fallback name
                const displayName = otherUser?.displayName || "Loading...";
                const avatarUrl = otherUser?.imageUrl;
                const initials = displayName.slice(0, 2).toUpperCase();

                return (
                    <Link
                        key={chat.id}
                        href={`/messages/${chat.id}`}
                        className={cn(
                            "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b",
                            isActive && "bg-muted"
                        )}
                    >
                        <Avatar>
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-semibold truncate">{displayName}</h4>
                                {chat.lastMessageAt && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <p className={cn("text-sm truncate", isActive ? "text-foreground" : "text-muted-foreground")}>
                                {chat.lastMessage || "Start chatting..."}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// Helper hook import (needs to be available)
import { useAuth } from "@/components/auth-provider";
