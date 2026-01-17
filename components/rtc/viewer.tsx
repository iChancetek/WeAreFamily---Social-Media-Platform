"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { sendSignal, getActiveSession, addViewer } from "@/app/actions/rtc"
import { Button } from "@/components/ui/button"
import { Loader2, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface ViewerProps {
    sessionId: string;
}

export function Viewer({ sessionId }: ViewerProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [isConnecting, setIsConnecting] = useState(true)
    const [isConnected, setIsConnected] = useState(false)

    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

    const cleanup = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
        }
    }, [])

    const handleLeave = () => {
        cleanup()
        router.push("/live")
    }

    const joinStream = useCallback(async () => {
        if (!user) return undefined

        try {
            // Add viewer to session (checks privacy and kicked status)
            await addViewer(sessionId)

            // Get session info
            const session = await getActiveSession(sessionId)
            if (!session || session.status !== "active") {
                toast.error("This broadcast has ended")
                router.push("/live")
                return
            }

            // Create peer connection
            const { RTC_CONFIG } = await import("@/lib/rtc-config")
            const pc = new RTCPeerConnection(RTC_CONFIG)

            peerConnectionRef.current = pc

            // Handle remote stream
            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                    setIsConnected(true)
                    setIsConnecting(false)
                }
            }

            // Handle ICE candidates
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await sendSignal(sessionId, {
                        type: "candidate",
                        candidate: event.candidate.toJSON(),
                        to: session.hostId,
                    })
                }
            }

            // Handle connection state
            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") {
                    setIsConnected(true)
                    setIsConnecting(false)
                } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                    toast.error("Connection lost")
                    router.push("/live")
                }
            }

            // Listen for signals from host
            const signalsRef = collection(db, `active_sessions/${sessionId}/signals`)
            const signalsQuery = query(
                signalsRef,
                where("to", "==", user.uid),
                orderBy("timestamp", "asc")
            )

            // Return unsubscribe for cleanup
            const unsubscribe = onSnapshot(signalsQuery, async (snapshot) => {
                for (const change of snapshot.docChanges()) {
                    if (change.type === "added") {
                        const signal = change.doc.data()

                        if (signal.type === "answer") {
                            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signal.sdp }))
                        } else if (signal.type === "candidate") {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
                        } else if (signal.type === "kicked") {
                            // Host kicked this viewer
                            toast.error("You have been removed from this broadcast")
                            cleanup()
                            router.push("/live")
                        }
                    }
                }
            })

            // Create and send offer
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            await sendSignal(sessionId, {
                type: "offer",
                sdp: offer.sdp!,
                to: session.hostId,
            })

            return unsubscribe

        } catch (error) {
            console.error("Viewer setup error:", error)
            toast.error("Failed to join stream")
            router.push("/live")
            return undefined
        }
    }, [sessionId, user, router, cleanup])

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const init = async () => {
            unsubscribe = await joinStream()
        }

        init()

        return () => {
            if (unsubscribe) unsubscribe()
            cleanup()
        }
    }, [joinStream, cleanup])

    return (
        <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
            {/* Remote Video */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />

            {/* Loading State */}
            {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                        <p className="text-white text-lg">Connecting to stream...</p>
                    </div>
                </div>
            )}

            {/* Leave Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleLeave}
                    className="rounded-full h-14 w-14"
                >
                    <PhoneOff className="h-6 w-6" />
                </Button>
            </div>
        </div>
    )
}
