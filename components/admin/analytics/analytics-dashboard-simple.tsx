"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, LogIn, Activity, AlertCircle } from "lucide-react";

// Simple mock data - no server calls, no complications
function getMockStats(range: string) {
    const baseStats = {
        totalSignIns: 156,
        uniqueUsers: 42,
        avgSessionDuration: 1247000, // ~20 minutes in ms
        avgSessionsPerUser: 3.7,
    };

    return baseStats;
}

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        // Set mock stats immediately
        setStats(getMockStats(timeRange));
    }, [timeRange]);

    return (
        <div className="space-y-6">
            {/* Demo Mode Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h4 className="font-semibold text-yellow-500 mb-1">Demo Mode - Using Sample Data</h4>
                    <p className="text-sm text-yellow-500/90">
                        This dashboard is displaying sample analytics data for demonstration purposes.
                    </p>
                </div>
            </div>

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
                                <CardTitle className="text-sm font-medium">Total Sign-ins</CardTitle>
                                <LogIn className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalSignIns || 0}</div>
                                <p className="text-xs text-muted-foreground">In selected period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.uniqueUsers || 0}</div>
                                <p className="text-xs text-muted-foreground">Active in period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.avgSessionDuration ? Math.round(stats.avgSessionDuration / 60000) + 'm' : '0m'}</div>
                                <p className="text-xs text-muted-foreground">Per session</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Frequency</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.avgSessionsPerUser || 0}</div>
                                <p className="text-xs text-muted-foreground">Sessions / User</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Simple table view instead of charts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                <p className="mb-2">📊 This simplified dashboard shows key metrics at a glance.</p>
                                <p>Advanced charts and visualizations can be added once Firebase indexes are deployed.</p>
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
                                <p>👤 Individual user analytics requires Firebase session tracking to be enabled.</p>
                                <p className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                                    <strong className="text-blue-500">Coming Soon:</strong> Select any user and analyze their activity patterns, session history, and engagement metrics across different time periods.
                                </p>
                                <p className="text-xs">This feature will be available once Firestore indexes are deployed and session tracking is active.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
