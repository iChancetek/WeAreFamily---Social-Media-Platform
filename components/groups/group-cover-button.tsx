"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { CoverUploadDialog } from "@/components/shared/cover-upload-dialog";

interface GroupCoverButtonProps {
    groupId: string;
    currentCoverUrl?: string | null;
    userId: string;
}

export function GroupCoverButton({ groupId, currentCoverUrl, userId }: GroupCoverButtonProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                title="Change Cover Photo"
                onClick={() => setDialogOpen(true)}
            >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Cover</span>
            </Button>

            <CoverUploadDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                type="group"
                id={groupId}
                currentCoverUrl={currentCoverUrl}
                userId={userId}
            />
        </>
    );
}
