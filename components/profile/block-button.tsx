"use client";

import { Button } from "@/components/ui/button";
import { blockUser, unblockUser } from "@/app/actions/security";
import { toast } from "sonner";
import { Ban, CheckCircle } from "lucide-react";
import { useState } from "react";

interface BlockButtonProps {
    targetUserId: string;
    isBlocked?: boolean;
    className?: string;
}

export function BlockButton({ targetUserId, isBlocked: initialBlocked = false, className }: BlockButtonProps) {
    const [isBlocked, setIsBlocked] = useState(initialBlocked);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleBlock = async () => {
        setIsLoading(true);
        try {
            if (isBlocked) {
                await unblockUser(targetUserId);
                toast.success("User unblocked");
                setIsBlocked(false);
            } else {
                await blockUser(targetUserId);
                toast.error("User blocked"); // Using error style for blocking action often fits better conceptually (destructive), or use custom
                setIsBlocked(true);
            }
        } catch (error) {
            toast.error("Failed to update block status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={isBlocked ? "outline" : "destructive"}
            size="sm"
            onClick={handleToggleBlock}
            disabled={isLoading}
            className={className}
        >
            {isBlocked ? (
                <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unblock
                </>
            ) : (
                <>
                    <Ban className="w-4 h-4 mr-2" />
                    Block
                </>
            )}
        </Button>
    );
}
