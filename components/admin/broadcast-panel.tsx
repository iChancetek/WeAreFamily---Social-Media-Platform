"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sendSystemBroadcast, sendAdminMessage } from "@/app/actions/admin-messaging";
import { Loader2, Send } from "lucide-react";

export function BroadcastPanel() {
    const [mode, setMode] = useState<"broadcast" | "direct">("broadcast");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [targetId, setTargetId] = useState(""); // For direct message
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!message) return;
        setLoading(true);

        try {
            if (mode === "broadcast") {
                if (!title) {
                    toast.error("Title is required for broadcast");
                    return;
                }
                const result = await sendSystemBroadcast(title, message);
                toast.success(`Broadcast sent to ${result.count} users!`);
                setTitle("");
                setMessage("");
            } else {
                if (!targetId) {
                    toast.error("User ID is required for direct message");
                    return;
                }
                await sendAdminMessage(targetId, message);
                toast.success("Direct message sent!");
                setMessage("");
                setTargetId("");
            }
        } catch (error: any) {
            console.error("Failed to send:", error);
            toast.error(error.message || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Messaging Center</CardTitle>
                <CardDescription>Send system-wide announcements or helper messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Message Type</label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="broadcast">📢 System Broadcast (All Users)</SelectItem>
                            <SelectItem value="direct">👤 Direct Message (Specific User)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {mode === "broadcast" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notification Title</label>
                        <Input
                            placeholder="e.g. System Maintenance or New Feature!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                )}

                {mode === "direct" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target User ID</label>
                        <Input
                            placeholder="Paste User ID here..."
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                        placeholder={mode === "broadcast" ? "Detailed announcement..." : "Hello, how can I help you today?"}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                    />
                </div>

                <Button className="w-full" onClick={handleSend} disabled={loading || !message}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {mode === "broadcast" ? "Send Broadcast" : "Send Message"}
                </Button>
            </CardContent>
        </Card>
    );
}
