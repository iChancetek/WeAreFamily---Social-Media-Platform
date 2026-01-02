'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPin } from "lucide-react"
import { format } from "date-fns"
import { joinEvent, leaveEvent } from "@/app/actions/events"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"

type Event = {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    location: string | null;
    attendees: string[] | null;
    creatorId: string;
}

export function EventList({ events }: { events: Event[] }) {
    const { user } = useAuth();

    const handleJoin = async (id: string) => {
        try {
            await joinEvent(id);
            toast.success("You're going! 🏃‍♂️");
        } catch {
            toast.error("Failed to join.");
        }
    };

    const handleLeave = async (id: string) => {
        try {
            await leaveEvent(id);
            toast.success("Cancelled RSVP");
        } catch {
            toast.error("Failed to leave.");
        }
    };

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500">No upcoming events. Plan one now!</p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 gap-4">
            {events.map((event) => {
                const isAttending = user && event.attendees?.includes(user.uid);

                return (
                    <Card key={event.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-start text-lg">
                                <span>{event.title}</span>
                                {isAttending && <Badge variant="secondary" className="bg-primary/10 text-primary">Going</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center text-sm text-gray-500 gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{format(new Date(event.date), "PPP")}</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center text-sm text-gray-500 gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                </div>
                            )}
                            {event.description && (
                                <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                            )}

                            <div className="pt-2 flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                    {(event.attendees?.length || 0)} attending
                                </span>
                                {!isAttending && (
                                    <Button size="sm" variant="outline" onClick={() => handleJoin(event.id)}>
                                        I'll be there
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
