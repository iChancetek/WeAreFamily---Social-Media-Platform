'use client'

import { useState, useEffect, useTransition } from "react";
import { getNotifications, markAsRead, markAllAsRead, Notification } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCheck, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationsList() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkAllRead() {
        startTransition(async () => {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            router.replace(window.location.href); // Soft refresh
        });
    }

    async function handleClick(notification: Notification) {
        if (!notification.read) {
            await markAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        }

        // Navigate based on type
        switch (notification.type) {
            case 'like':
            case 'comment':
                // Ideally scroll to post? For now just go to feed maybe or we have a single post view?
                // We don't have a single post view yet (except group/branding feeds). 
                // Let's assume we go home for now.
                router.push('/');
                break;
            case 'follow':
                router.push(`/branding/${notification.referenceId}`);
                break;
            case 'group_invite':
                router.push(`/groups/${notification.referenceId}`);
                break;
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading updates...</div>;

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <CheckCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No new notifications to show.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Notifications</h2>
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-muted-foreground">
                    Mark all as read
                </Button>
            </div>

            {notifications.map(notification => (
                <div
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors border-b last:border-0",
                        notification.read ? "bg-background/50 opacity-80" : "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                >
                    <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={notification.sender?.imageUrl || ""} />
                        <AvatarFallback>{notification.sender?.displayName?.[0] || "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                        <p className="text-sm">
                            <span className="font-semibold">{notification.sender?.displayName || "Someone"}</span>
                            {" "}
                            {getNotificationText(notification)}
                        </p>
                        {notification.meta?.postPreview && (
                            <p className="text-xs text-muted-foreground line-clamp-1 italic">
                                "{notification.meta.postPreview}"
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                    </div>

                    <div className="text-muted-foreground">
                        {getIcon(notification.type)}
                    </div>

                    {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                </div>
            ))}
        </div>
    );
}

function getNotificationText(n: Notification) {
    switch (n.type) {
        case 'like': return "liked your post.";
        case 'comment': return "commented on your post.";
        case 'follow': return `started following ${n.meta?.brandingName || "your branding"}.`;
        case 'group_invite': return "invited you to a group.";
        default: return "interacted with you.";
    }
}

function getIcon(type: string) {
    switch (type) {
        case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
        case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
        case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
        case 'group_invite': return <Users className="w-4 h-4 text-purple-500" />;
        default: return <CheckCheck className="w-4 h-4" />;
    }
}
