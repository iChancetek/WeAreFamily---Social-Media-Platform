"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getActiveUsers } from "@/app/actions/users";
import { cn } from "@/lib/utils";
import { ContactItem } from "./contact-item";
import { NewsFeed } from "@/components/news/news-feed";
import { useEffect, useState } from "react";

import { useLanguage } from "@/components/language-context";

interface RightSidebarProps {
    className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
    const { t } = useLanguage();
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getActiveUsers();
                setActiveUsers(users);
            } catch (error) {
                console.error("Failed to load active users", error);
            }
        };

        fetchUsers();
        // Refresh every minute
        const interval = setInterval(fetchUsers, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className={cn("hidden lg:flex flex-col gap-4 p-4 w-80 overflow-y-auto border-l border-border/50", className)}>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    {t("sidebar.members")}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeUsers.length}</span>
                </h3>

                {activeUsers.length === 0 ? (
                    <div className="text-xs text-gray-400 p-2 text-center border border-dashed border-gray-700/50 rounded-lg">
                        {t("sidebar.members.empty")}
                    </div>
                ) : (
                    activeUsers.map((user: any) => (
                        <ContactItem key={user.id} user={user} />
                    ))
                )}
            </div>

            <div className="my-2 border-t border-border/50" />

            <NewsFeed />
        </aside>
    );
}
