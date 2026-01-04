"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { NewMessageData } from "@/lib/message-listener"

interface MessageToastProps {
    message: NewMessageData
    onReadNow: () => void
    onIgnore: () => void
}

export function MessageToast({ message, onReadNow, onIgnore }: MessageToastProps) {
    const preview = message.content.length > 50
        ? message.content.substring(0, 50) + "..."
        : message.content

    return (
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px] animate-in slide-in-from-right">
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={message.senderImage} />
                    <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{message.senderName}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2"
                            onClick={onIgnore}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {preview}
                    </p>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={onReadNow}
                            className="flex-1"
                        >
                            Read Now
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onIgnore}
                            className="flex-1"
                        >
                            Ignore
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
