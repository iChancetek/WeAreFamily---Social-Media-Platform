"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, Lock, Globe, Loader2 } from "lucide-react"
import { startSession } from "@/app/actions/rtc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface LiveSetupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger?: React.ReactNode
}

export function LiveSetupDialog({ open, onOpenChange }: LiveSetupDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [privacy, setPrivacy] = useState("public") // public, family, private

    const handleGoLive = async () => {
        if (!title.trim()) {
            toast.error("Please enter a title for your broadcast")
            return
        }

        setLoading(true)
        try {
            const isPublic = privacy === "public"
            // We pass privacy setting. For "family", backend treats as !isPublic and checks family connections

            const result = await startSession("broadcast", undefined, isPublic, {
                title,
                description
            })

            onOpenChange(false)
            router.push(`/live/broadcast?sessionId=${result.sessionId}`)
            toast.success("Starting broadcast...")
        } catch (error: any) {
            console.error("Failed to start broadcast:", error)
            toast.error(error.message || "Failed to go live")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Video className="h-6 w-6 text-red-500" />
                        Go Live
                    </DialogTitle>
                    <DialogDescription>
                        Start a live broadcast to share moments with your family and friends.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Broadcast Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Sunday Family Dinner"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="What's this broadcast about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Privacy</Label>
                        <Select value={privacy} onValueChange={setPrivacy}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-green-500" />
                                        <span>Public (All Followers)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="family">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-blue-500" />
                                        <span>Family Only</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {privacy === "public"
                                ? "Anyone who follows you can watch."
                                : "Only your connected family members can watch."}
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGoLive} disabled={loading} className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Video className="h-4 w-4" />
                                Go Live Now
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
