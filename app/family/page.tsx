export const dynamic = "force-dynamic";

import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingRequests, getFamilyMembers } from "@/app/actions/family";
import { FamilyView } from "@/components/family/family-view";

export default async function FamilyPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    const { incoming, sent } = await getPendingRequests();
    const familyMembers = await getFamilyMembers();

    return (
        <FamilyView
            incoming={incoming}
            sent={sent}
            familyMembers={familyMembers}
        />
    );
}
