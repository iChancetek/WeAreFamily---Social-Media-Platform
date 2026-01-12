import { MainLayout } from "@/components/layout/main-layout";
import AnalyticsDashboard from "@/components/admin/analytics/analytics-dashboard";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
    const user = await getUserProfile();

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-10">
                <AnalyticsDashboard />
            </div>
        </MainLayout>
    );
}
