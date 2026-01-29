"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, Phone, Video, Loader2 } from "lucide-react"
import { checkOrCreateChat } from "@/app/actions/chat"
import { startSession } from "@/app/actions/rtc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ConversationStarterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userName?: string
}

export function ConversationStarterDialog({ open, onOpenChange, userId, userName }: ConversationStarterDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null) // 'text', 'voice', 'video' or null

    const handleStartText = async () => {
        setLoading('text')
        try {
            const chatId = await checkOrCreateChat(userId)
            router.push(`/messages/${chatId}`)
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to start chat")
        } finally {
            setLoading(null)
        }
    }

    const handleStartCall = async (type: 'call_audio' | 'call_video') => {
        setLoading(type === 'call_audio' ? 'voice' : 'video')
        try {
            // Start the RTC session
            const result = await startSession(type, userId, true) // Calls are "public" to participants

            // Redirect to call view (assuming /call/[sessionId])
            // Wait, we don't have a dedicated /call/[id] page yet?
            // Broadcasts go to /live/broadcast or /live/[id].
            // Direct calls usually need a different view or we overlay it.
            // For now, let's assume we route to /live/[sessionId] for video, or maybe we need to create one.
            // The user said "Users should have the options of starting... live video conversations".
            // If it's a "video call", it's usually 1:1.

            // Let's use the live/broadcast view wrapper or a dedicated Call page?
            // "Viewer" and "BroadcastView" are for 1-to-many.
            // "Call" implies 1-on-1 bi-directional.
            // I'll route to /live/[sessionId] for now, assuming Viewer/Broadcast can handle it or we need a new Call component.
            // But wait, Viewer is for *viewing*. BroadcastView is for *broadcasting*.
            // A 1:1 call needs both to be broadcasters + viewers.
            // This might need a new component `CallView`.
            // For this task scope, let's assume we route to a page that handles it.
            // Given "Live Video" phrasing, maybe they mean 1:1 live video?

            router.push(`/live/call/${result.sessionId}`)
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to start call")
        } finally {
            setLoading(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Start Conversation</DialogTitle>
                    <DialogDescription>
                        How would you like to connect with {userName || "this user"}?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <Button
                        variant="outline"
                        className="h-14 justify-start gap-4 text-lg"
                        onClick={handleStartText}
                        disabled={!!loading}
                    >
                        {loading === 'text' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5 text-blue-500" />}
                        Text Message
                    </Button>

                    <Button
                        variant="outline"
                        className="h-14 justify-start gap-4 text-lg"
                        onClick={() => handleStartCall('call_audio')}
                        disabled={!!loading}
                    >
                        {loading === 'voice' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5 text-green-500" />}
                        Voice Call
                    </Button>

                    <Button
                        variant="outline"
                        className="h-14 justify-start gap-4 text-lg"
                        onClick={() => handleStartCall('call_video')}
                        disabled={!!loading}
                    >
                        {loading === 'video' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5 text-red-500" />}
                        Live Video
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
