"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { sendSignal, endSession, updateSessionPrivacy, updateSessionHeartbeat } from "@/app/actions/rtc"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Lock, Globe, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { ViewerListPanel } from "./viewer-list-panel"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface BroadcastViewProps {
    sessionId: string;
    onEnd?: () => void;
}

export function BroadcastView({ sessionId, onEnd }: BroadcastViewProps) {
    const { user } = useAuth()
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [viewerCount, setViewerCount] = useState(0)
    const [isLive, setIsLive] = useState(false)
    const [showViewerPanel, setShowViewerPanel] = useState(true)
    const [isPublic, setIsPublic] = useState(false)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

    // Heartbeat Effect
    useEffect(() => {
        const interval = setInterval(() => {
            updateSessionHeartbeat(sessionId).catch(console.error)
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [sessionId])



    useEffect(() => {
        startBroadcast()
        return () => {
            cleanup()
        }
    }, [sessionId])

    const startBroadcast = async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            })

            localStreamRef.current = stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }

            setIsLive(true)

            // Listen for viewers joining (signals with type 'offer')
            const signalsRef = collection(db, `active_sessions/${sessionId}/signals`)
            const signalsQuery = query(
                signalsRef,
                where("to", "==", user!.uid),
                orderBy("timestamp", "asc")
            )

            onSnapshot(signalsQuery, async (snapshot) => {
                for (const change of snapshot.docChanges()) {
                    if (change.type === "added") {
                        const signal = change.doc.data()

                        if (signal.type === "offer") {
                            // New viewer joining
                            await handleNewViewer(signal.from, signal.sdp)
                        } else if (signal.type === "candidate") {
                            // ICE candidate from viewer
                            const pc = peerConnectionsRef.current.get(signal.from)
                            if (pc) {
                                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
                            }
                        }
                    }
                }
            })

            toast.success("You're now live!")
        } catch (error) {
            console.error("Broadcast setup error:", error)
            toast.error("Failed to start broadcast")
        }
    }

    const handleNewViewer = async (viewerId: string, offerSdp: string) => {
        if (!localStreamRef.current) return

        // Create peer connection for this viewer
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        })

        // Add local stream
        localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!)
        })

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                await sendSignal(sessionId, {
                    type: "candidate",
                    candidate: event.candidate.toJSON(),
                    to: viewerId,
                })
            }
        }

        // Handle connection state
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setViewerCount(prev => prev + 1)
            } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                setViewerCount(prev => Math.max(0, prev - 1))
                peerConnectionsRef.current.delete(viewerId)
            }
        }

        // Set remote description and create answer
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offerSdp }))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        // Send answer to viewer
        await sendSignal(sessionId, {
            type: "answer",
            sdp: answer.sdp!,
            to: viewerId,
        })

        peerConnectionsRef.current.set(viewerId, pc)
    }

    const cleanup = () => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop())
        }

        // Close all peer connections
        peerConnectionsRef.current.forEach((pc) => pc.close())
        peerConnectionsRef.current.clear()
    }

    const handleEndBroadcast = async () => {
        cleanup()
        await endSession(sessionId)
        setIsLive(false)
        toast.success("Broadcast ended")
        onEnd?.()
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

    const handlePrivacyToggle = async (checked: boolean) => {
        try {
            await updateSessionPrivacy(sessionId, checked)
            setIsPublic(checked)
            toast.success(checked ? "Broadcast is now public" : "Broadcast is now family-only")
        } catch (error: any) {
            toast.error(error.message || "Failed to update privacy")
        }
    }

    return (
        <div className="flex gap-4 w-full h-full min-h-[600px]">
            {/* Main Broadcast View */}
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
                {/* Local Video */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Live Indicator */}
                {isLive && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>
                )}

                {/* Privacy Toggle */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                    <Lock className="h-4 w-4" />
                    <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
                        {isPublic ? "Public" : "Family Only"}
                    </Label>
                    <Switch
                        id="privacy-toggle"
                        checked={isPublic}
                        onCheckedChange={handlePrivacyToggle}
                    />
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>

                {/* Viewer Panel Toggle */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full"
                    onClick={() => setShowViewerPanel(!showViewerPanel)}
                >
                    {showViewerPanel ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>

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

                    <Button
                        size="lg"
                        variant={isVideoOff ? "destructive" : "secondary"}
                        onClick={toggleVideo}
                        className="rounded-full h-14 w-14"
                    >
                        {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </Button>

                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleEndBroadcast}
                        className="rounded-full h-14 w-14"
                    >
                        <PhoneOff className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Viewer List Panel */}
            {showViewerPanel && (
                <div className="w-80 rounded-lg overflow-hidden">
                    <ViewerListPanel sessionId={sessionId} viewerCount={viewerCount} />
                </div>
            )}
        </div>
    )
}
