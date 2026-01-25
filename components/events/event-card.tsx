'use client';

import { Event } from "@/types/events";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, HelpCircle, XCircle } from "lucide-react";
import { SafeDate } from "@/components/shared/safe-date";
import { rsvpEvent } from "@/app/actions/events";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function EventCard({ event, onRsvpChange }: { event: Event, onRsvpChange?: () => void }) {
    const [rsvp, setRsvp] = useState(event.currentUserRsvp);
    const [loading, setLoading] = useState(false);

    const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
        setLoading(true);
        const prev = rsvp;
        setRsvp(status); // Optimistic
        try {
            await rsvpEvent(event.id, status);
            toast.success(`RSVP Updated: ${status.replace('_', ' ')}`);
            if (onRsvpChange) onRsvpChange();
        } catch {
            setRsvp(prev);
            toast.error("Failed to update RSVP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden flex flex-col h-full border-l-4 border-l-primary">
            <CardContent className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col items-center bg-muted/50 rounded-lg p-2 min-w-[60px] border border-border/50">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                            {new Date(event.startTime).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold">
                            {new Date(event.startTime).getDate()}
                        </span>
                    </div>
                    <div className="flex-1 ml-3">
                        <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    </div>
                </div>

                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span suppressHydrationWarning>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.organizerName} hosting</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-muted/30 p-2 flex gap-1 justify-between">
                <Button
                    variant={rsvp === 'going' ? "default" : "ghost"}
                    size="sm"
                    className={cn("flex-1 h-8 rounded-md", rsvp === 'going' && "bg-green-600 hover:bg-green-700")}
                    onClick={() => handleRsvp('going')}
                    disabled={loading}
                >
                    <Check className="w-4 h-4 mr-1" /> Going
                </Button>
                <Button
                    variant={rsvp === 'maybe' ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 h-8 rounded-md"
                    onClick={() => handleRsvp('maybe')}
                    disabled={loading}
                >
                    <HelpCircle className="w-4 h-4 mr-1" /> Maybe
                </Button>
                <Button
                    variant={rsvp === 'not_going' ? "outline" : "ghost"}
                    size="sm"
                    className="flex-1 h-8 rounded-md text-muted-foreground"
                    onClick={() => handleRsvp('not_going')}
                    disabled={loading}
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
