"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getCompanions } from "@/app/actions/companions";
import { inviteMember } from "@/app/actions/groups";

interface InviteCompanionsDialogProps {
    groupId: string;
    trigger?: React.ReactNode;
}

export function InviteCompanionsDialog({ groupId, trigger }: InviteCompanionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [companions, setCompanions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [invitingId, setInvitingId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchCompanions();
        }
    }, [open]);

    const fetchCompanions = async () => {
        setLoading(true);
        try {
            const data = await getCompanions();
            setCompanions(data);
        } catch (error) {
            console.error("Failed to fetch companions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userId: string) => {
        setInvitingId(userId);
        try {
            const result = await inviteMember(groupId, userId);
            if (result.success) {
                toast.success("Invitation sent");
                setInvitedIds(prev => new Set(prev).add(userId));
            } else {
                toast.warning(result.message);
                // If already member, mark as invited/done
                if (result.message.includes("already")) {
                    setInvitedIds(prev => new Set(prev).add(userId));
                }
            }
        } catch (error) {
            toast.error("Failed to send invitation");
        } finally {
            setInvitingId(null);
        }
    };

    const filteredCompanions = companions.filter(c =>
        c.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Companions</DialogTitle>
                    <DialogDescription>
                        Invite your companions to join this group.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search companions..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <ScrollArea className="h-[300px] pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredCompanions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "No companions found matching search." : "You have no companions yet."}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCompanions.map((companion) => (
                                <div key={companion.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={companion.imageUrl || undefined} />
                                            <AvatarFallback>{companion.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{companion.displayName}</p>
                                            <p className="text-xs text-muted-foreground">Companion</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={invitedIds.has(companion.id) ? "ghost" : "default"}
                                        disabled={invitedIds.has(companion.id) || invitingId === companion.id}
                                        onClick={() => handleInvite(companion.id)}
                                    >
                                        {invitedIds.has(companion.id) ? (
                                            <span className="text-green-500 flex items-center gap-1">
                                                <Check className="w-4 h-4" />
                                                Sent
                                            </span>
                                        ) : invitingId === companion.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Invite"
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
