import { getGroups } from "@/app/actions/groups";
import { MainLayout } from "@/components/layout/main-layout";
import { GroupsView } from "@/components/groups/groups-view";

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
    const groups = await getGroups();

    return (
        <MainLayout>
            <GroupsView groups={groups} />
        </MainLayout>
    );
}

// Need to import Users icon for the empty state
import { Users } from "lucide-react";
