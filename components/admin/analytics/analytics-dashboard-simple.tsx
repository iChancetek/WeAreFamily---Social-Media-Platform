"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, LogIn, Activity, AlertCircle, FileText, Briefcase } from "lucide-react";
import { getSimpleAnalytics } from "@/app/actions/simple-analytics";
import { toast } from "sonner";

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getSimpleAnalytics();
                setStats(data);

                if (data._error) {
                    console.error("Analytics error:", data._error);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    return (
        <div className="space-y-6">
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

            {/* Tabs for Global vs Individual */}
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
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : (stats?.totalUsers || 0)}</div>
                                <p className="text-xs text-muted-foreground">Platform members</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : (stats?.totalPosts || 0)}</div>
                                <p className="text-xs text-muted-foreground">All content created</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Groups</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : (stats?.totalGroups || 0)}</div>
                                <p className="text-xs text-muted-foreground">Active communities</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : (stats?.recentActivity || 0)}</div>
                                <p className="text-xs text-muted-foreground">Posts last 7 days</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>📊 Displaying real-time platform statistics from your Firebase database.</p>
                                {stats?._isRealData === false && (
                                    <p className="text-xs bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                        ⚠️ Unable to fetch complete data. Showing available metrics.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="individual">
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual User Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-3">
                                <p>Select a user from your platform to analyze their activity patterns, session history, and engagement metrics across different time periods.</p>
                                <p className="text-xs opacity-70">Note: This feature requires user session data to be available in your database.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
