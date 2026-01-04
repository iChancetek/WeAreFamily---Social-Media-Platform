import { getGroups, Group } from "@/app/actions/groups";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { MainLayout } from "@/components/layout/main-layout";
import { getUserProfile } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
    const groups = await getGroups();

    return (
        <MainLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
                    <p className="text-muted-foreground">
                        Discover and join communities based on your interests.
                    </p>
                </div>
                <CreateGroupDialog />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: Group) => (
                    <GroupCard key={group.id} group={group} />
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No groups yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Be the first to create a community for your family.
                    </p>
                    <CreateGroupDialog />
                </div>
            )}
        </MainLayout>
    );
}

// Need to import Users icon for the empty state
import { Users } from "lucide-react";
