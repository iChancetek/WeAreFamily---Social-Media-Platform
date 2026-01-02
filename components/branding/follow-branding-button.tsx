"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { followBranding, unfollowBranding } from "@/app/actions/branding";
import { toast } from "sonner";
import { Loader2, Plus, Check } from "lucide-react";

interface FollowBrandingButtonProps {
    brandingId: string;
    isFollowing: boolean; // We'll infer this from status
    role?: 'admin' | 'follower' | null;
}

export function FollowBrandingButton({ brandingId, isFollowing: initialIsFollowing, role }: FollowBrandingButtonProps) {
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
                await unfollowBranding(brandingId);
                setIsFollowing(false);
                toast.success("Unfollowed branding");
            } else {
                await followBranding(brandingId);
                setIsFollowing(true);
                toast.success("Following branding!");
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
