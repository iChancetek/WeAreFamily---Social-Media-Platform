"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { getRepostAnalytics } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";

const COLORS = ['#ec4899', '#3b82f6', '#94a3b8']; // pink, blue, slate

export function RepostAnalytics() {
    const [data, setData] = useState<{ topPosts: any[], distribution: any[], allTop: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchAnalytics = async () => {
            try {
                const result = await getRepostAnalytics();
                if (mounted) setData(result);
            } catch (err: any) {
                if (mounted) setError(err.message || "Failed to load repost analytics");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchAnalytics();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-red-500">Error: {error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mt-8 mb-4">Repost Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Top Reposted */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Reposted Posts</CardTitle>
                        <CardDescription>Most shared content across the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.topPosts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                                    <XAxis 
                                        dataKey="title" 
                                        tick={{ fontSize: 10 }} 
                                        tickFormatter={(val) => val.substring(0, 10) + '...'} 
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="repostCount" name="Reposts" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart: Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Distribution</CardTitle>
                        <CardDescription>Breakdown based on repost volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Pie
                                        data={data.distribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    >
                                        {data.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table or List: Top Ranked */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Ranked Posts</CardTitle>
                    <CardDescription>Rank score formula: (Reposts*0.6) + (Likes*0.25) + (Comments*0.15)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Post Snippet</th>
                                    <th className="px-4 py-3">Reposts</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Rank Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.allTop.slice(0, 10).map((post, i) => (
                                    <tr key={i} className="border-b last:border-0 border-border hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{post.title}</td>
                                        <td className="px-4 py-3">{post.repostCount}</td>
                                        <td className="px-4 py-3 font-semibold text-pink-500">{post.rankScore.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {data.allTop.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No repost data available yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
