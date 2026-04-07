'use client';

import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
// If we had a server action to mark resolved, we'd import it here
// import { resolveReport } from "@/app/actions/admin"; 

interface ReportData {
    id: string;
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
    status: string;
    createdAt?: number;
    reporter: {
        displayName: string;
        email: string;
    };
}

export function ReportList({ reports: initialReports }: { reports: ReportData[] }) {
    const [reports, setReports] = useState(initialReports);

    if (reports.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p>No reports currently pending.</p>
            </div>
        );
    }

    const handleResolve = async (reportId: string) => {
        if (!confirm("Mark this report as reviewed/resolved?")) return;
        
        // Optimistic UI
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
        
        // Future mapping: await resolveReport(reportId);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Target</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium whitespace-pre-wrap">
                                <span className="uppercase text-xs text-muted-foreground block mb-1">{report.targetType}</span>
                                {report.targetType === 'post' ? (
                                    <Link href={`/post/${report.targetId}`} className="text-blue-500 hover:underline flex items-center gap-1 text-xs" target="_blank">
                                        View Content <ExternalLink className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <span className="text-xs break-all">{report.targetId}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-sm font-medium">{report.reporter.displayName}</div>
                                <div className="text-xs text-muted-foreground">{report.reporter.email}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {report.reason.replace(/_/g, ' ')}
                                </Badge>
                                {report.details && (
                                    <p className="text-xs mt-1 text-muted-foreground italic line-clamp-2 w-48">"{report.details}"</p>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {report.createdAt ? format(new Date(report.createdAt), 'MMM d, yyyy') : 'Unknown'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'} className="capitalize">
                                    {report.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {report.status === 'pending' && (
                                    <Button size="sm" variant="outline" onClick={() => handleResolve(report.id)}>
                                        <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
