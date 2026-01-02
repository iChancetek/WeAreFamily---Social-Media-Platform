"use client";

import { Event, joinEvent, leaveEvent } from "@/app/actions/events";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { MapPin, Calendar as CalendarIcon, Users, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EventCardProps {
    event: Event;
    currentUserId: string;
}

export function EventCard({ event, currentUserId }: EventCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const isAttending = event.attendees.includes(currentUserId);
    const date = new Date(event.date);

    const handleToggle = async () => {
        setIsUpdating(true);
        try {
            if (isAttending) {
                await leaveEvent(event.id);
                toast.info("You're no longer attending.");
            } else {
                await joinEvent(event.id);
                toast.success("You're going! 🏃‍♂️");
            }
        } catch {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow dark:border-white/10 overflow-hidden group">
            <div className="flex flex-col sm:flex-row h-full">
                {/* Date Badge */}
                <div className="bg-primary/10 dark:bg-primary/20 sm:w-24 flex sm:flex-col items-center justify-center p-4 gap-2 sm:gap-0 border-b sm:border-b-0 sm:border-r border-primary/10 dark:border-white/5">
                    <span className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-foreground uppercase">
                        {format(date, "MMM")}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                        {format(date, "d")}
                    </span>
                    <span className="text-sm font-medium text-slate-500 uppercase">
                        {format(date, "EEE")}
                    </span>
                </div>

                <div className="flex-1 flex flex-col p-5">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {event.title}
                            </h3>
                            {event.location && (
                                <div className="flex items-center text-sm text-gray-500 gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center text-xs text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(date, "h:mm a")}
                        </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {event.description}
                    </p>

                    <div className="mt-auto flex justify-between items-center pt-2 sm:pt-0">
                        <div className="flex -space-x-2">
                            {event.attendeeProfiles?.slice(0, 5).map((profile, i) => (
                                <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-zinc-900">
                                    <AvatarImage src={profile.imageUrl || undefined} />
                                    <AvatarFallback>{profile.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {event.attendees.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-600 border-2 border-white dark:border-zinc-900">
                                    +{event.attendees.length - 5}
                                </div>
                            )}
                            {event.attendees.length === 0 && (
                                <span className="text-sm text-gray-400 italic">Be the first to join!</span>
                            )}
                        </div>

                        <Button
                            variant={isAttending ? "outline" : "default"}
                            size="sm"
                            onClick={handleToggle}
                            disabled={isUpdating}
                            className={isAttending ? "border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : isAttending ? (
                                <>
                                    <Check className="w-4 h-4 mr-1" /> Going
                                </>
                            ) : "Join"}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
