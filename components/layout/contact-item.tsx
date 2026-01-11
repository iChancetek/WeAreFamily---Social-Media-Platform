'use client'

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFamilyStatus, sendFamilyRequest } from "@/app/actions/family";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContactItemProps {
    user: {
        id: string;
        displayName: string;
        imageUrl?: string | null;
        profileData?: any;
    }
}

export function ContactItem({ user }: ContactItemProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showRequestDialog, setShowRequestDialog] = useState(false);

    const profile = user.profileData as { firstName: string, lastName: string, imageUrl: string } | null;
    const name = user.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Unknown");
    const imageUrl = user.imageUrl || profile?.imageUrl;

    async function handleClick() {
        if (loading) return;
        setLoading(true);

        try {
            const status = await getFamilyStatus(user.id);

            if (status.status === 'accepted') {
                router.push(`/u/${user.id}`);
            } else if (status.status === 'pending') {
                toast.info("Family request pending", {
                    description: "You have already sent or received a request from this person."
                });
            } else {
                setShowRequestDialog(true);
            }
        } catch (error) {
            console.error("Error checking status:", error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleSendRequest() {
        try {
            setLoading(true);
            await sendFamilyRequest(user.id);
            toast.success("Request sent!", {
                description: `Family request sent to ${name}`
            });
            setShowRequestDialog(false);
        } catch (error) {
            console.error("Error sending request:", error);
            toast.error("Failed to send request");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div
                onClick={handleClick}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
            >
                <div className="relative">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={imageUrl || ""} alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate block">
                        {name}
                    </span>
                </div>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>

            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Family Request?</DialogTitle>
                        <DialogDescription>
                            Connect with {name} to share posts, photos, and see their updates on your timeline.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                        <Button onClick={handleSendRequest} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
