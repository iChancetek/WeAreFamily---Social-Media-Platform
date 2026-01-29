'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/app/actions/admin";
import { AdminCharts } from "@/components/admin/admin-charts";
import { UserList } from "@/components/admin/user-list";
import { sanitizeForClient } from "@/lib/serialization";

export default function AdminDashboardPage() {
    const { profile, loading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        newThisMonth: 0
    });
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && profile?.role === 'admin') {
            const fetchData = async () => {
                try {
                    console.log("Fetching all users...");
                    const allUsers = await getAllUsers();
                    console.log("Users fetched:", allUsers.length);
                    setUsers(allUsers);

                    // Calculate stats
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    const newUsers = allUsers.filter((u: any) => new Date(u.createdAt) >= startOfMonth).length;
                    const activeUsers = allUsers.filter((u: any) => u.lastActiveAt && new Date(u.lastActiveAt) >= startOfDay).length;

                    setStats({
                        totalUsers: allUsers.length,
                        activeToday: activeUsers,
                        newThisMonth: newUsers
                    });
                } catch (error: any) {
                    console.error("Failed to fetch admin data", error);
                    setError(error.message || "Failed to fetch data");
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
        }
    }, [loading, profile]);


    if (loading) return null;
    if (profile?.role !== 'admin') {
        // Simple client-side protect
        return <MainLayout><div>Access Denied</div></MainLayout>
    }

    const registrationData = processRegistrationData(users);
    const roleData = processRoleData(users);

    return (
        <MainLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Platform overview and management.</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="w-4 h-4" />} trend={`+${stats.newThisMonth} this month`} />
                    <StatsCard title="Active Today" value={stats.activeToday.toLocaleString()} icon={<Activity className="w-4 h-4 text-green-500" />} trend="Daily Active" />
                    {/* Placeholders for now */}
                    <StatsCard title="Reports" value="0" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} trend="No pending" />
                    <StatsCard title="Server Health" value="100%" icon={<Activity className="w-4 h-4 text-green-500" />} trend="Stable" />
                </div>

                <AdminCharts
                    registrationData={registrationData}
                    roleData={roleData}
                />

                <Card>
                    <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <div>Loading users...</div>
                        ) : (
                            <UserList users={sanitizeForClient(users)} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

function StatsCard({ title, value, icon, trend }: any) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                    <p className="text-xs text-green-500 mt-1">{trend}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">{icon}</div>
            </CardContent>
        </Card>
    );
}

function processRegistrationData(users: any[]) {
    // Group by month (last 6 months)
    const months: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        months[key] = 0;
    }

    users.forEach(user => {
        const d = new Date(user.createdAt);
        // Only count if within last 6 months (roughly)
        if (now.getTime() - d.getTime() < 180 * 24 * 60 * 60 * 1000) {
            const key = d.toLocaleString('default', { month: 'short' });
            if (months[key] !== undefined) {
                months[key]++;
            }
        }
    });

    return Object.entries(months).map(([name, total]) => ({ name, total }));
}

function processRoleData(users: any[]) {
    const roles: Record<string, number> = { admin: 0, member: 0 };
    users.forEach(user => {
        const role = user.role || 'member';
        roles[role] = (roles[role] || 0) + 1;
    });

    return Object.entries(roles).map(([name, value]) => ({ name, value }));
}
