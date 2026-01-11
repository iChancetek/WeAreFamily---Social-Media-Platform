import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getActiveUsers } from "@/app/actions/users";
import { cn } from "@/lib/utils";
import { ContactItem } from "./contact-item";
import { NewsFeed } from "@/components/news/news-feed";

interface RightSidebarProps {
    className?: string;
}

export async function RightSidebar({ className }: RightSidebarProps) {
    const activeUsers = await getActiveUsers();

    return (
        <aside className={cn("hidden lg:flex flex-col gap-4 p-4 w-80 overflow-y-auto border-l border-border/50", className)}>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Members
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeUsers.length}</span>
                </h3>

                {activeUsers.length === 0 ? (
                    <div className="text-xs text-gray-400 p-2 text-center border border-dashed border-gray-700/50 rounded-lg">
                        No other members are online right now.
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
