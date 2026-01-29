'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkOrCreateChat } from "@/app/actions/chat";
import { toast } from "sonner";

interface MessageButtonProps {
    userId: string;
    className?: string;
    children?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function MessageButton({ userId, className, children, variant = "secondary", size = "default" }: MessageButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        try {
            const chatId = await checkOrCreateChat(userId);
            router.push(`/messages/${chatId}`);
        } catch (error: any) {
            console.error("Failed to start chat", error);
            if (error.message === "Unauthorized") {
                toast.error("Please login to message");
            } else if (error.message === "Cannot chat with yourself") {
                toast.error("You cannot message yourself");
            } else {
                toast.error("Failed to start conversation");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className={children ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
            {children || (size !== "icon" && "Message")}
        </Button>
    );
}
