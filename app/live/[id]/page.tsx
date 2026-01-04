"use client"

import { Viewer } from "@/components/rtc/viewer"

export default function LiveStreamPage({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Viewer sessionId={params.id} />
        </div>
    )
}
