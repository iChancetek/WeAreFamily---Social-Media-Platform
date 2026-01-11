import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getActiveUsers } from "@/app/actions/users";
import { cn } from "@/lib/utils";
import { ContactItem } from "./contact-item";

interface RightSidebarProps {
    className?: string;
}

export async function RightSidebar({ className }: RightSidebarProps) {
    const activeUsers = await getActiveUsers();

    if (activeUsers.length === 0) {
        return (
            <div className={cn("hidden lg:flex flex-col gap-4 p-4 w-80", className)}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contacts</h3>
                <p className="text-xs text-gray-400">No other members are online right now.</p>
            </div>
        );
    }

    return (
        <aside className={cn("hidden lg:flex flex-col gap-4 p-4 w-80 overflow-y-auto", className)}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Members</h3>
            <div className="flex flex-col gap-2">
                {activeUsers.map((user: any) => (
                    <ContactItem key={user.id} user={user} />
                ))}
            </div>
        </aside>
    );
}
