"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { getUserAnalytics } from "@/app/actions/analytics";
import { UserActivityChart } from "@/components/admin/analytics/charts";
import { toast } from "sonner";
import { format } from "date-fns";

export function UserAnalyticsView() {
    const [userId, setUserId] = useState("");
    const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!userId.trim()) return;
        setLoading(true);
        try {
            const data = await getUserAnalytics(userId, range);
            if (!data) {
                toast.error("User not found or no data available");
                setUserData(null);
            } else {
                setUserData(data);
            }
        } catch (e) {
            toast.error("Failed to fetch user data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Query</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            {/* Ideally this is a Combobox that searches users by name/email. 
                                 For now, simplistic input for UID. 
                                 TODO: Upgrade to UserCombobox 
                             */}
                            <Input
                                placeholder="Enter User ID (for now)"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                            <Button onClick={handleSearch} disabled={loading}>
                                <Search className="mr-2 h-4 w-4" />
                                {loading ? "Searching..." : "Analyze"}
                            </Button>
                        </div>
                        <Select value={range} onValueChange={(val: any) => setRange(val)}>
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
                </CardContent>
            </Card>

            {userData && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{userData.summary.totalSignIns}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Math.round(userData.summary.totalTimeSpent / 60000)}m
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {userData.summary.totalSignIns > 0
                                        ? Math.round((userData.summary.totalTimeSpent / userData.summary.totalSignIns) / 60000)
                                        : 0}m
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <UserActivityChart data={userData.chartData} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Session History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Start Time</TableHead>
                                        <TableHead>End Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Device</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userData.history.map((session: any) => (
                                        <TableRow key={session.id}>
                                            <TableCell>{format(new Date(session.startedAt), "PPpp")}</TableCell>
                                            <TableCell>{session.endedAt ? format(new Date(session.endedAt), "PPpp") : '-'}</TableCell>
                                            <TableCell>{Math.round(session.duration / 60000)} min</TableCell>
                                            <TableCell>{session.status}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={session.deviceInfo}>{session.deviceInfo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
