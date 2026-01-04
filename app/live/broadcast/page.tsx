"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startSession } from "@/app/actions/rtc"
import { BroadcastView } from "@/components/rtc/broadcast-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function BroadcastPage() {
    const router = useRouter()
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    const handleStartBroadcast = async () => {
        setIsStarting(true)
        try {
            const result = await startSession("broadcast")
            setSessionId(result.sessionId)
        } catch (error: any) {
            toast.error(error.message || "Failed to start broadcast")
            setIsStarting(false)
        }
    }

    const handleEndBroadcast = () => {
        setSessionId(null)
        router.push("/live")
    }

    if (sessionId) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <BroadcastView sessionId={sessionId} onEnd={handleEndBroadcast} />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="mb-4">
                <Link href="/live">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Live
                    </Button>
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Start Your Broadcast</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <Video className="h-12 w-12 text-primary" />
                    </div>
                    <div className="text-center max-w-md">
                        <h3 className="font-semibold text-lg mb-2">Go Live with Your Family</h3>
                        <p className="text-muted-foreground text-sm">
                            Share special moments in real-time. Your family members will be able to watch and connect with you instantly.
                        </p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg max-w-md">
                        <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> For best performance, we recommend having no more than 5-10 viewers at once. Make sure you have a stable internet connection.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleStartBroadcast}
                        disabled={isStarting}
                        className="gap-2 px-8"
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Video className="h-5 w-5" />
                                Start Broadcasting
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
