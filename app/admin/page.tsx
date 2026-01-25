'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Activity } from "lucide-react";
import { redirect } from "next/navigation";

export default function AdminDashboardPage() {
    const { profile, loading } = useAuth();

    if (loading) return null;
    if (profile?.role !== 'admin') {
        // Simple client-side protect for now
        // redirect("/"); 
        // For demo/scaffold purposes, let's just show text
        // return <MainLayout><div>Access Denied</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Platform overview and management.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Total Users" value="1,234" icon={<Users className="w-4 h-4" />} trend="+12%" />
                    <StatsCard title="Active Posts" value="5,678" icon={<FileText className="w-4 h-4" />} trend="+5%" />
                    <StatsCard title="Reports" value="23" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} trend="-2%" />
                    <StatsCard title="Server Health" value="99.9%" icon={<Activity className="w-4 h-4 text-green-500" />} trend="Stable" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
                        <CardContent><div className="text-sm text-muted-foreground">No pending reports.</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
                        <CardContent><div className="h-[200px] flex items-center justify-center bg-muted/20 rounded">Chart Placeholder</div></CardContent>
                    </Card>
                </div>
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
