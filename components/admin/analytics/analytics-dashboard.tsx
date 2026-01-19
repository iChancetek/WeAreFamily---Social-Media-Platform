"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalAnalytics } from "@/app/actions/analytics";
import { SignInBarChart, UserDistributionPieChart } from "@/components/admin/analytics/charts";
import { Users, Clock, LogIn, Activity } from "lucide-react";
import { toast } from "sonner";
import { UserAnalyticsView } from "@/components/admin/analytics/user-analytics-view";

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getGlobalAnalytics(timeRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    return (
        <div className="space-y-6">
            {/* Mock Data Warning Banner */}
            {stats?._isMockData && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                    <Activity className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-yellow-500 mb-1">Demo Mode - Using Mock Data</h4>
                        <p className="text-sm text-yellow-500/90">
                            {stats._error || "Firestore indexes are missing. Deploy indexes with:"}
                        </p>
                        <code className="text-xs bg-yellow-500/10 px-2 py-1 rounded mt-2 inline-block">
                            firebase deploy --only firestore:indexes
                        </code>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">Monitor platform growth and user engagement trends.</p>
                </div>
                <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="global" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="global">Global Overview</TabsTrigger>
                    <TabsTrigger value="individual">Individual User Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="space-y-4">
                    {/* Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sign-ins</CardTitle>
                                <LogIn className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : stats?.totalSignIns}</div>
                                <p className="text-xs text-muted-foreground">In selected period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : stats?.uniqueUsers}</div>
                                <p className="text-xs text-muted-foreground">Active in period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : (stats?.avgSessionDuration ? Math.round(stats.avgSessionDuration / 60000) + 'm' : '0m')}</div>
                                <p className="text-xs text-muted-foreground">Per session</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Frequency</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : stats?.avgSessionsPerUser}</div>
                                <p className="text-xs text-muted-foreground">Sessions / User</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            <SignInBarChart data={stats?.chartData || []} title="Sign-ins Over Time" />
                        </div>
                        <div className="col-span-3">
                            {/* Construct Pie Data dynamically if possible, or just mock New/Returning if backend doesn't support yet */}
                            {/* For now we enable the visual container, but data might be placeholder until we add filtering logic */}
                            <UserDistributionPieChart data={[
                                { name: 'Active', value: stats?.uniqueUsers || 0 },
                                { name: 'Sessions', value: stats?.totalSignIns || 0 }
                            ]} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="individual">
                    <UserAnalyticsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
