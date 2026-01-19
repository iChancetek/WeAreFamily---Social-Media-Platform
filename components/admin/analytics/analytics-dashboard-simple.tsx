"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, LogIn, Activity, AlertCircle, FileText, Briefcase } from "lucide-react";
import { getSimpleAnalytics } from "@/app/actions/simple-analytics";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

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

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Platform Stats Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        Loading...
                                    </div>
                                ) : (
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Users', value: stats?.totalUsers || 0, fill: '#8b5cf6' },
                                                { name: 'Posts', value: stats?.totalPosts || 0, fill: '#0ea5e9' },
                                                { name: 'Groups', value: stats?.totalGroups || 0, fill: '#10b981' },
                                                { name: 'Recent', value: stats?.recentActivity || 0, fill: '#f59e0b' }
                                            ]}>
                                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                    {[
                                                        { name: 'Users', value: stats?.totalUsers || 0, fill: '#8b5cf6' },
                                                        { name: 'Posts', value: stats?.totalPosts || 0, fill: '#0ea5e9' },
                                                        { name: 'Groups', value: stats?.totalGroups || 0, fill: '#10b981' },
                                                        { name: 'Recent', value: stats?.recentActivity || 0, fill: '#f59e0b' }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Content Distribution Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        Loading...
                                    </div>
                                ) : (
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'User Posts', value: stats?.totalPosts || 1 },
                                                        { name: 'Groups', value: stats?.totalGroups || 1 },
                                                        { name: 'Branding', value: stats?.totalBranding || 1 }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill="#8b5cf6" />
                                                    <Cell fill="#0ea5e9" />
                                                    <Cell fill="#10b981" />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="individual">
                    <IndividualUserAnalysis timeRange={timeRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Individual User Analysis Component
function IndividualUserAnalysis({ timeRange }: { timeRange: string }) {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Load users list on mount
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const { getAllUsersList } = await import("@/app/actions/user-analytics");
                const usersList = await getAllUsersList();
                setUsers(usersList);
            } catch (error) {
                console.error("Failed to load users", error);
            }
        };
        loadUsers();
    }, []);

    // Load user stats when user is selected
    useEffect(() => {
        if (!selectedUserId) {
            setUserStats(null);
            return;
        }

        const loadUserStats = async () => {
            setLoading(true);
            try {
                const { getUserAnalyticsSimple } = await import("@/app/actions/user-analytics");
                const stats = await getUserAnalyticsSimple(selectedUserId);
                setUserStats(stats);
            } catch (error) {
                console.error("Failed to load user stats", error);
                toast.error("Failed to load user analytics");
            } finally {
                setLoading(false);
            }
        };

        loadUserStats();
    }, [selectedUserId]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Select User</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a user to analyze..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.displayName} ({user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {loading && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        Loading user analytics...
                    </CardContent>
                </Card>
            )}

            {!loading && userStats && (
                <>
                    {/* User Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {userStats.photoURL && (
                                    <img
                                        src={userStats.photoURL}
                                        alt={userStats.displayName}
                                        className="w-16 h-16 rounded-full"
                                    />
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg">{userStats.displayName}</h3>
                                    <p className="text-sm text-muted-foreground">{userStats.email}</p>
                                    {userStats.joinedDate && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Joined: {new Date(userStats.joinedDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{userStats.totalPosts}</div>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Groups Joined</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{userStats.totalGroups}</div>
                                <p className="text-xs text-muted-foreground">Active memberships</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{userStats.recentPosts}</div>
                                <p className="text-xs text-muted-foreground">Posts last 7 days</p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {!loading && !userStats && selectedUserId && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        User not found or unable to load analytics
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
