'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkOrCreateChat } from "@/app/actions/chat";
import { toast } from "sonner";
import { ConversationStarterDialog } from "@/components/chat/conversation-starter-dialog";

interface MessageButtonProps {
    userId: string;
    className?: string;
    children?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function MessageButton({ userId, className, children, variant = "secondary", size = "default" }: MessageButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDialog(true);
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
        <ConversationStarterDialog 
            open={showDialog} 
            onOpenChange={setShowDialog} 
            userId={userId} 
        />
    );
}
