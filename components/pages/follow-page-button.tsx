"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { followPage, unfollowPage } from "@/app/actions/pages";
import { toast } from "sonner";
import { Loader2, Plus, Check } from "lucide-react";

interface FollowPageButtonProps {
    pageId: string;
    isFollowing: boolean; // We'll infer this from status
    role?: 'admin' | 'follower' | null;
}

export function FollowPageButton({ pageId, isFollowing: initialIsFollowing, role }: FollowPageButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    if (role === 'admin') {
        return (
            <Button variant="secondary" disabled>
                Admin
            </Button>
        );
    }

    async function handleToggle() {
        setIsLoading(true);
        try {
            if (isFollowing) {
                await unfollowPage(pageId);
                setIsFollowing(false);
                toast.success("Unfollowed page");
            } else {
                await followPage(pageId);
                setIsFollowing(true);
                toast.success("Following page!");
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
            variant={isFollowing ? "outline" : "default"}
            onClick={handleToggle}
            disabled={isLoading}
            className="min-w-[100px]"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                isFollowing ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />
            )}
            {isFollowing ? "Following" : "Follow"}
        </Button>
    );
}
