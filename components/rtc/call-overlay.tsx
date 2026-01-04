"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { getIncomingCall, endSession, sendSignal, getActiveSession } from "@/app/actions/rtc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"

interface CallOverlayProps {
    sessionId?: string;
    onClose?: () => void;
}

export function CallOverlay({ sessionId: initialSessionId, onClose }: CallOverlayProps) {
    const { user } = useAuth()
    const [incomingCall, setIncomingCall] = useState<any>(null)
    const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null)
    const [callState, setCallState] = useState<"ringing" | "connecting" | "active" | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)

    // Listen for incoming calls
    useEffect(() => {
        if (!user || activeSessionId) return

        const checkInterval = setInterval(async () => {
            try {
                const call = await getIncomingCall(user.uid)
                if (call && call.id !== incomingCall?.id) {
                    setIncomingCall(call)
                    setCallState("ringing")
                    // Play ringtone (optional)
                }
            } catch (error) {
                console.error("Error checking for calls:", error)
            }
        }, 2000)

        return () => clearInterval(checkInterval)
    }, [user, activeSessionId, incomingCall?.id])

    // Setup WebRTC
    const setupWebRTC = async (sessionId: string, isInitiator: boolean) => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: incomingCall?.type === "call_video" || true,
                audio: true,
            })

            localStreamRef.current = stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                ],
            })

            peerConnectionRef.current = pc

            // Add local stream to peer connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })

            // Handle remote stream
            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                }
            }

            // Handle ICE candidates
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await sendSignal(sessionId, {
                        type: "candidate",
                        candidate: event.candidate.toJSON(),
                        to: incomingCall?.hostId || user!.uid,
                    })
                }
            }

            // Listen for signals
            const signalsRef = collection(db, `active_sessions/${sessionId}/signals`)
            const signalsQuery = query(
                signalsRef,
                where("to", "==", user!.uid),
                orderBy("timestamp", "asc")
            )

            const unsubscribe = onSnapshot(signalsQuery, async (snapshot) => {
                for (const change of snapshot.docChanges()) {
                    if (change.type === "added") {
                        const signal = change.doc.data()

                        if (signal.type === "offer") {
                            await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp }))
                            const answer = await pc.createAnswer()
                            await pc.setLocalDescription(answer)
                            await sendSignal(sessionId, {
                                type: "answer",
                                sdp: answer.sdp!,
                                to: signal.from,
                            })
                        } else if (signal.type === "answer") {
                            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signal.sdp }))
                        } else if (signal.type === "candidate") {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
                        }
                    }
                }
            })

            // If initiator, create offer
            if (isInitiator) {
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                await sendSignal(sessionId, {
                    type: "offer",
                    sdp: offer.sdp!,
                    to: incomingCall?.hostId || user!.uid,
                })
            }

            setCallState("active")

            return () => {
                unsubscribe()
            }
        } catch (error) {
            console.error("WebRTC setup error:", error)
            toast.error("Failed to setup call")
            handleEndCall()
        }
    }

    const handleAcceptCall = async () => {
        if (!incomingCall) return
        setCallState("connecting")
        setActiveSessionId(incomingCall.id)
        await setupWebRTC(incomingCall.id, false)
    }

    const handleRejectCall = async () => {
        if (incomingCall) {
            await endSession(incomingCall.id)
        }
        setIncomingCall(null)
        setCallState(null)
    }

    const handleEndCall = async () => {
        // Clean up media
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop())
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
        }

        // End session
        if (activeSessionId) {
            await endSession(activeSessionId)
        }

        // Reset state
        setActiveSessionId(null)
        setCallState(null)
        setIncomingCall(null)
        onClose?.()
    }

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoOff(!videoTrack.enabled)
            }
        }
    }

    if (!callState) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            {callState === "ringing" && (
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Incoming Call</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={incomingCall?.callerImage} />
                            <AvatarFallback>{incomingCall?.callerName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-xl font-semibold">{incomingCall?.callerName}</div>
                        <div className="text-sm text-muted-foreground">
                            {incomingCall?.type === "call_video" ? "Video Call" : "Voice Call"}
                        </div>
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                variant="destructive"
                                onClick={handleRejectCall}
                                className="rounded-full h-16 w-16"
                            >
                                <PhoneOff className="h-6 w-6" />
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleAcceptCall}
                                className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
                            >
                                <Phone className="h-6 w-6" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(callState === "connecting" || callState === "active") && (
                <div className="relative w-full h-full">
                    {/* Remote Video (Full Screen) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Local Video (PiP) */}
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg"
                    />

                    {/* Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                        <Button
                            size="lg"
                            variant={isMuted ? "destructive" : "secondary"}
                            onClick={toggleMute}
                            className="rounded-full h-14 w-14"
                        >
                            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </Button>

                        {incomingCall?.type === "call_video" && (
                            <Button
                                size="lg"
                                variant={isVideoOff ? "destructive" : "secondary"}
                                onClick={toggleVideo}
                                className="rounded-full h-14 w-14"
                            >
                                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                            </Button>
                        )}

                        <Button
                            size="lg"
                            variant="destructive"
                            onClick={handleEndCall}
                            className="rounded-full h-14 w-14"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                    </div>

                    {callState === "connecting" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-white text-xl">Connecting...</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
