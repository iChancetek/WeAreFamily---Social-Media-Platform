export const dynamic = "force-dynamic";

import { getUserProfile } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { UserList } from "@/components/admin/user-list";
import { MainLayout } from "@/components/layout/main-layout";
import { BirthdayTrigger } from "@/components/admin/birthday-trigger";
import { AdminCharts } from "@/components/admin/admin-charts";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Calendar } from "lucide-react";
import { subDays, startOfDay, subYears, format } from "date-fns";
import { sanitizeData } from "@/lib/serialization";
import { BroadcastPanel } from "@/components/admin/broadcast-panel";

export default async function AdminPage() {
    const user = await getUserProfile();

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    const usersSnapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
    const allUsers = usersSnapshot.docs.map((doc: any) => sanitizeData({ id: doc.id, ...doc.data() }));

    // Calculate Metrics
    const now = new Date();
    const today = startOfDay(now);
    const oneWeekAgo = subDays(today, 7);
    const oneMonthAgo = subDays(today, 30);
    const oneYearAgo = subYears(today, 1);

    const newDaily = allUsers.filter(u => new Date(u.createdAt) >= today).length;
    const newWeekly = allUsers.filter(u => new Date(u.createdAt) >= oneWeekAgo).length;
    const newMonthly = allUsers.filter(u => new Date(u.createdAt) >= oneMonthAgo).length;
    const newYearly = allUsers.filter(u => new Date(u.createdAt) >= oneYearAgo).length;

    // Prepare Chart Data (Last 7 Days Registration)
    const registrationData = [];
    for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        const dateStr = format(d, 'MMM dd');
        const count = allUsers.filter(u => {
            const uDate = startOfDay(new Date(u.createdAt));
            return uDate.getTime() === d.getTime();
        }).length;
        registrationData.push({ name: dateStr, total: count });
    }

    // Role Distribution
    const roleCounts = allUsers.reduce((acc, curr) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const roleData = Object.entries(roleCounts).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
    }));

    return (
        <MainLayout>
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Users (Daily)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newDaily}</div>
                            <p className="text-xs text-muted-foreground">Registered today</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Users (Weekly)</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newWeekly}</div>
                            <p className="text-xs text-muted-foreground">Past 7 days</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Users (Monthly)</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newMonthly}</div>
                            <p className="text-xs text-muted-foreground">Past 30 days</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Users (Yearly)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newYearly}</div>
                            <p className="text-xs text-muted-foreground">Past year</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <AdminCharts registrationData={registrationData} roleData={roleData} />

                <div className="bg-white dark:bg-card rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BirthdayTrigger />
                        <BroadcastPanel />
                    </div>
                </div>

                <div className="bg-white dark:bg-card rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">User Management</h2>
                    <UserList users={allUsers} />
                </div>

                <div className="bg-white dark:bg-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
                    <AuditLogViewer />
                </div>
            </div>
        </MainLayout>
    );
}
