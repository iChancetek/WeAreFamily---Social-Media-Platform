import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getActiveUsers } from "@/app/actions/users";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
    className?: string;
}

export async function RightSidebar({ className }: RightSidebarProps) {
    const activeUsers = await getActiveUsers();

    if (activeUsers.length === 0) {
        return (
            <div className={cn("hidden lg:flex flex-col gap-4 p-4 w-80", className)}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contacts</h3>
                <p className="text-xs text-gray-400">No other family members are online right now.</p>
            </div>
        );
    }

    return (
        <aside className={cn("hidden lg:flex flex-col gap-4 p-4 w-80 overflow-y-auto", className)}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Family Members</h3>
            <div className="flex flex-col gap-2">
                {activeUsers.map((user: any) => {
                    const profile = user.profileData as { firstName: string, lastName: string, imageUrl: string } | null;
                    const name = user.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.email);

                    return (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="relative">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarImage src={profile?.imageUrl} alt={name} />
                                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                                {name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
