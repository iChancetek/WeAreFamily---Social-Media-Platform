"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinGroup, leaveGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JoinGroupButtonProps {
    groupId: string;
    isMember: boolean;
    memberCount?: number;
}

export function JoinGroupButton({ groupId, isMember: initialIsMember, memberCount }: JoinGroupButtonProps) {
    const [isMember, setIsMember] = useState(initialIsMember);
    const [isLoading, setIsLoading] = useState(false);

    async function handleToggle() {
        setIsLoading(true);
        try {
            if (isMember) {
                await leaveGroup(groupId);
                setIsMember(false);
                toast.success("Left group");
            } else {
                await joinGroup(groupId);
                setIsMember(true);
                toast.success("Joined group!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button
            variant={isMember ? "outline" : "default"}
            onClick={handleToggle}
            disabled={isLoading}
            className="min-w-[100px]"
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isMember ? "Leave" : "Join Group"}
        </Button>
    );
}
