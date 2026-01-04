"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMessages, sendMessage, Message } from "@/app/actions/chat"
import { Send, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface QuickReplyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: string
    senderName: string
    senderImage?: string
    currentUserId: string
}

export function QuickReplyModal({
    open,
    onOpenChange,
    sessionId,
    senderName,
    senderImage,
    currentUserId,
}: QuickReplyModalProps) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (open) {
            loadMessages()
        }
    }, [open, sessionId])

    const loadMessages = async () => {
        try {
            setIsLoading(true)
            const data = await getMessages(sessionId)
            // Show last 5 messages
            setMessages(data.slice(-5))
        } catch (error) {
            console.error("Error loading messages:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSend = async () => {
        if (!inputText.trim()) return

        const content = inputText
        setInputText("")

        setIsSending(true)
        try {
            await sendMessage(sessionId, content)
            await loadMessages()
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSending(false)
        }
    }

    const handleOpenFullChat = () => {
        onOpenChange(false)
        router.push("/messages")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={senderImage} />
                            <AvatarFallback>{senderName[0]}</AvatarFallback>
                        </Avatar>
                        {senderName}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[300px] pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No messages yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => {
                                const isOwn = msg.senderId === currentUserId
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwn
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <p
                                                className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                    }`}
                                            >
                                                {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        disabled={isSending}
                    />
                    <Button onClick={handleSend} disabled={isSending || !inputText.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    onClick={handleOpenFullChat}
                    className="w-full gap-2"
                >
                    <ExternalLink className="h-4 w-4" />
                    Open Full Chat
                </Button>
            </DialogContent>
        </Dialog>
    )
}
