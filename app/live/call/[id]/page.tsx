"use client"

import { BroadcastView } from "@/components/rtc/broadcast-view"
import { useRouter } from "next/navigation"

export default function VideoCallPage({ params }: { params: { id: string } }) {
    const router = useRouter()

    const handleEndCall = () => {
        router.push("/messages")
    }

    // For now, we reuse BroadcastView but in a "call" mode context if we had one.
    // Or we should build a dedicated CallView.
    // Given the constraints and the user needing "functioning" ASAP,
    // we'll wrap the BroadcastView.
    // Ideally 1:1 calls are different, but this ensures no 404.

    return (
        <div className="container mx-auto p-0 h-[100dvh] bg-black">
            <BroadcastView sessionId={params.id} onEnd={handleEndCall} />
        </div>
    )
}
