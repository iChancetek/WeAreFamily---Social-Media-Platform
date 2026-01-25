'use client';

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventCard } from "@/components/events/event-card";
import { getEvents } from "@/app/actions/events";
import { useEffect, useState } from "react";
import { Event } from "@/types/events";

export function EventsFeed() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await getEvents();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Events</h1>
                    <p className="text-muted-foreground">Discover moments to share together.</p>
                </div>
                <CreateEventDialog onEventCreated={fetchEvents}>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </CreateEventDialog>
            </div>

            {/* Event Calendar / List Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />
                    ))
                ) : events.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                        No upcoming events. Plan something fun!
                    </div>
                ) : (
                    events.map(event => (
                        <EventCard key={event.id} event={event} onRsvpChange={fetchEvents} />
                    ))
                )}
            </div>
        </div>
    );
}
