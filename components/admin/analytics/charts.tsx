"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Luminous Palette
const COLORS = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel px-3 py-2 rounded-lg !border-white/40 shadow-glow-sm text-xs">
                <p className="font-semibold mb-1 text-foreground">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground capitalize">{entry.name}:</span>
                        <span className="font-mono font-medium text-foreground">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function SignInBarChart({ data, title }: { data: any[], title: string }) {
    if (!data || data.length === 0) {
        return (
            <Card className="glass-card shadow-lg border-0">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for this period.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-50" />
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <defs>
                                <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                            <Bar
                                dataKey="value"
                                fill="url(#violetGradient)"
                                radius={[6, 6, 0, 0]}
                                name="Sign-ins"
                                className="filter drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}


export function UserDistributionPieChart({ data }: { data: any[] }) {
    return (
        <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Distribution</CardTitle>
                <CardDescription>User breakdown for this period</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        className="filter drop-shadow-sm hover:drop-shadow-md transition-all duration-300"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function UserActivityChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <Card className="glass-card border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>User Activity Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No activity recorded in this period.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Sessions and Duration over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={8}>
                            <defs>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar
                                yAxisId="left"
                                dataKey="sessions"
                                fill="url(#blueGradient)"
                                name="Sessions"
                                radius={[4, 4, 0, 0]}
                                className="filter drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="duration"
                                fill="url(#emeraldGradient)"
                                name="Duration (min)"
                                radius={[4, 4, 0, 0]}
                                className="filter drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
