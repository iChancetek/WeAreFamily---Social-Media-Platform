"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserX, Users as UsersIcon } from "lucide-react"
import { getSessionViewers, kickViewer } from "@/app/actions/rtc"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Viewer {
    id: string
    displayName: string
    imageUrl?: string
}

interface ViewerListPanelProps {
    sessionId: string
    viewerCount: number
}

export function ViewerListPanel({ sessionId, viewerCount }: ViewerListPanelProps) {
    const [viewers, setViewers] = useState<Viewer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [kickingViewerId, setKickingViewerId] = useState<string | null>(null)
    const [viewerToKick, setViewerToKick] = useState<Viewer | null>(null)

    const loadViewers = useCallback(async () => {
        try {
            const data = await getSessionViewers(sessionId)
            setViewers(data)
        } catch (error) {
            console.error("Error loading viewers:", error)
        } finally {
            setIsLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        loadViewers()
        // Refresh viewer list every 5 seconds
        const interval = setInterval(loadViewers, 5000)
        return () => clearInterval(interval)
    }, [loadViewers, viewerCount])

    const handleKickClick = (viewer: Viewer) => {
        setViewerToKick(viewer)
    }

    const confirmKick = async () => {
        if (!viewerToKick) return

        setKickingViewerId(viewerToKick.id)
        try {
            await kickViewer(sessionId, viewerToKick.id)
            toast.success(`Removed ${viewerToKick.displayName} from broadcast`)
            setViewers(prev => prev.filter(v => v.id !== viewerToKick.id))
        } catch (error: any) {
            toast.error(error.message || "Failed to remove viewer")
        } finally {
            setKickingViewerId(null)
            setViewerToKick(null)
        }
    }

    return (
        <>
            <div className="w-full h-full bg-black/80 backdrop-blur-sm text-white flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        <h3 className="font-semibold">Viewers ({viewerCount})</h3>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="p-4 text-center text-white/60">
                            Loading viewers...
                        </div>
                    ) : viewers.length === 0 ? (
                        <div className="p-4 text-center text-white/60">
                            <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No viewers yet</p>
                            <p className="text-sm mt-1">Waiting for people to join...</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {viewers.map((viewer) => (
                                <div
                                    key={viewer.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={viewer.imageUrl} />
                                        <AvatarFallback>{viewer.displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{viewer.displayName}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white/60 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => handleKickClick(viewer)}
                                        disabled={kickingViewerId === viewer.id}
                                    >
                                        <UserX className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <AlertDialog open={!!viewerToKick} onOpenChange={() => setViewerToKick(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Viewer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{viewerToKick?.displayName}</strong> from your broadcast? They will be disconnected immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmKick} className="bg-destructive hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
