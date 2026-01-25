export const dynamic = "force-dynamic";

import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingRequests, getCompanions } from "@/app/actions/companions";
import { CompanionsView } from "@/components/companions/companions-view";

export default async function CompanionsPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/");
    }

    const { incoming, sent } = await getPendingRequests();
    const companions = await getCompanions();

    return (
        <CompanionsView
            incoming={incoming}
            sent={sent}
            companions={companions}
        />
    );
}
