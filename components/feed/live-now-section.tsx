"use client"

import { useLivePresence } from "@/components/live/live-presence-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function LiveNowSection() {
    const { activeBroadcasts } = useLivePresence()
    const router = useRouter()

    if (!activeBroadcasts || activeBroadcasts.length === 0) {
        return null
    }

    return (
        <div className="w-full py-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-6 mb-2">
                <h3 className="font-semibold text-sm text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live Now
                </h3>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 px-6 pb-2">
                    {activeBroadcasts.map((broadcast) => (
                        <button
                            key={broadcast.id}
                            onClick={() => router.push(`/live/${broadcast.id}`)}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                                <div className="absolute -inset-[2px] bg-gradient-to-tr from-red-500 to-orange-500 rounded-full animate-pulse"></div>
                                <Avatar className="w-16 h-16 border-2 border-background relative z-10">
                                    <AvatarImage src={broadcast.hostPhotoURL || undefined} alt="Host" />
                                    <AvatarFallback>{broadcast.hostName?.slice(0, 2).toUpperCase() || "LI"}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 z-20">
                                    <Badge className="bg-red-500 border-2 border-background px-1 h-5 text-[10px]">LIVE</Badge>
                                </div>
                            </div>
                            <span className="text-xs font-medium max-w-[80px] truncate">
                                {broadcast.hostName || "User"}
                            </span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
