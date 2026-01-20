"use client"

import { Button } from "@/components/ui/button"
import { sendFamilyRequest, cancelFamilyRequest, acceptFamilyRequest, denyFamilyRequest, FamilyStatus } from "@/app/actions/family"
import { toast } from "sonner"
import { UserPlus, UserCheck, UserX, Loader2 } from "lucide-react"
import { useState, useTransition, useEffect } from "react"
import { cn } from "@/lib/utils"

interface FamilyRequestButtonProps {
    targetUserId: string
    initialStatus: FamilyStatus
    initialRequestId?: string
    className?: string
}

export function FamilyRequestButton({ targetUserId, initialStatus, initialRequestId, className }: FamilyRequestButtonProps) {
    const [status, setStatus] = useState<FamilyStatus>(initialStatus)
    const [requestId, setRequestId] = useState<string | undefined>(initialRequestId)
    const [isPending, startTransition] = useTransition()

    // Sync state with props if they change (e.g. navigation)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus(initialStatus)
         
        setRequestId(initialRequestId)
    }, [initialStatus, initialRequestId])

    const handleSend = () => {
        startTransition(async () => {
            try {
                const newId = await sendFamilyRequest(targetUserId)
                setStatus({ status: 'pending_sent', requestId: newId })
                setRequestId(newId)
                toast.success("Request sent")
            } catch (err: any) {
                toast.error(err.message)
            }
        })
    }

    const handleCancel = () => {
        if (!requestId) return
        startTransition(async () => {
            try {
                await cancelFamilyRequest(requestId)
                setStatus({ status: 'none' })
                setRequestId(undefined)
                toast.success("Request canceled")
            } catch (err: any) {
                toast.error(err.message)
            }
        })
    }

    const handleAccept = () => {
        if (!requestId) return
        startTransition(async () => {
            try {
                await acceptFamilyRequest(requestId)
                setStatus({ status: 'accepted', requestId })
                toast.success("Request accepted")
            } catch (err: any) {
                toast.error(err.message)
            }
        })
    }

    if (status.status === 'accepted') {
        return (
            <Button variant="outline" className={cn("gap-2 text-green-600 border-green-200 cursor-default hover:text-green-600 hover:bg-green-50", className)}>
                <UserCheck className="w-4 h-4" />
                Family
            </Button>
        )
    }

    if (status.status === 'pending_sent') {
        return (
            <Button
                variant="secondary"
                className={cn("gap-2 whitespace-nowrap", className)}
                onClick={handleCancel}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                Cancel Request
            </Button>
        )
    }

    if (status.status === 'pending_received') {
        const handleDeny = () => {
            if (!requestId) return
            startTransition(async () => {
                try {
                    await denyFamilyRequest(requestId)
                    setStatus({ status: 'none' })
                    setRequestId(undefined)
                    toast.success("Request denied")
                } catch (err: any) {
                    toast.error(err.message)
                }
            })
        }

        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="default"
                    className={cn("gap-2 bg-blue-600 hover:bg-blue-700", className)}
                    onClick={handleAccept}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Accept
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleDeny}
                    disabled={isPending}
                    title="Deny Request"
                >
                    <UserX className="w-4 h-4" />
                    <span className="sr-only">Deny</span>
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant="default"
            className={cn("gap-2 whitespace-nowrap", className)}
            onClick={handleSend}
            disabled={isPending}
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Family
        </Button>
    )
}
