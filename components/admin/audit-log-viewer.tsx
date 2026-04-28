"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, TrendingUp, User, MessageCircle, FileText, Settings, ShieldCheck } from "lucide-react";

interface AuditLogViewerProps {
    logs: any[];
    isLoading: boolean;
}

export function AuditLogViewer({ logs, isLoading }: AuditLogViewerProps) {
    const getActionIcon = (action: string) => {
        if (action.startsWith('post.view')) return <Eye className="w-3 h-3 text-blue-400" />;
        if (action.startsWith('post.rank')) return <TrendingUp className="w-3 h-3 text-green-500" />;
        if (action.startsWith('user.')) return <User className="w-3 h-3 text-purple-400" />;
        if (action.startsWith('comment.')) return <MessageCircle className="w-3 h-3 text-orange-400" />;
        if (action.startsWith('admin.')) return <ShieldCheck className="w-3 h-3 text-red-500" />;
        if (action.startsWith('settings.')) return <Settings className="w-3 h-3 text-gray-400" />;
        return <FileText className="w-3 h-3 text-blue-400" />;
    };

    const getActionColor = (action: string) => {
        if (action === 'post.rank_update') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (action === 'post.view') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.startsWith('admin.')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-secondary text-secondary-foreground';
    };

    return (
        <Card className="shadow-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl">Platform Audit Log</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Real-time monitoring of engagement, ranking, and discovery metrics.</p>
                </div>
                <Badge variant="outline" className="font-mono">
                    {logs.length} Recent Events
                </Badge>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No audit logs found.
                    </div>
                ) : (
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target / Metrics</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm truncate max-w-[150px]">{log.userName}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{log.userEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-md ${getActionColor(log.action)}`}>
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <span className="text-xs font-medium capitalize">{log.action.replace(/[._]/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                {log.action === 'post.rank_update' && log.details?.metrics ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Score: {Number(log.details.rankScore).toFixed(2)}</Badge>
                                                        <span className="text-muted-foreground text-[10px] flex gap-1">
                                                            <span>👁️ {log.details.metrics.viewCount}</span>
                                                            <span>❤️ {log.details.metrics.likesCount}</span>
                                                            <span>💬 {log.details.metrics.commentCount}</span>
                                                            <span>🔄 {log.details.metrics.repostCount}</span>
                                                        </span>
                                                    </div>
                                                ) : log.targetType ? (
                                                    <span className="text-muted-foreground">
                                                        {log.targetType}: <span className="font-mono text-[10px]">{log.targetId?.substring(0, 8)}...</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">No extra details</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
