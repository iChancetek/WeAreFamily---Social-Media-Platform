"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuditLogs, getAuditStats } from "@/app/actions/audit"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Shield, Activity, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    action: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    timestamp: Date;
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [stats, setStats] = useState<{ last24h: number; last7days: number; total: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>("all")

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching audit logs...");
                const [logsData, statsData] = await Promise.all([
                    getAuditLogs({ limit: 100 }),
                    getAuditStats()
                ])
                console.log("Logs fetched:", logsData?.length);
                setLogs(logsData as AuditLog[])
                setStats(statsData)
            } catch (error) {
                console.error("Failed to load audit logs:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredLogs = filter === "all" ? logs : logs.filter(log => {
        if (filter === "admin") return log.action.startsWith("admin.")
        if (filter === "security") return log.action.startsWith("security.") || log.action.includes("block")
        if (filter === "user") return log.action.startsWith("user.")
        if (filter === "content") return ["post", "comment", "story", "event"].some(t => log.action.includes(t))
        return true
    })

    const getActionBadgeColor = (action: string) => {
        if (action.startsWith("admin.")) return "destructive"
        if (action.includes("delete") || action.includes("block") || action.includes("reject")) return "destructive"
        if (action.includes("create") || action.includes("approve")) return "default"
        return "secondary"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.last24h || 0}</div>
                        <p className="text-xs text-muted-foreground">Actions logged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.last7days || 0}</div>
                        <p className="text-xs text-muted-foreground">Actions logged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Logs */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity Audit Log</CardTitle>
                            <CardDescription>Track all user and admin actions on the platform</CardDescription>
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="admin">Admin Actions</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="user">User Actions</SelectItem>
                                <SelectItem value="content">Content</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getActionBadgeColor(log.action)}>
                                            {log.action}
                                        </Badge>
                                        <span className="text-sm font-medium">{log.userName}</span>
                                        <span className="text-xs text-muted-foreground">({log.userRole})</span>
                                    </div>
                                    {log.targetName && (
                                        <p className="text-sm text-muted-foreground">
                                            Target: {log.targetType} - {log.targetName}
                                        </p>
                                    )}
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {JSON.stringify(log.details)}
                                        </p>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </div>
                            </div>
                        ))}
                        {filteredLogs.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No audit logs found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
