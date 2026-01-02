import { getEvents } from "@/app/actions/events";
import { getUserProfile } from "@/lib/auth";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default async function EventsPage() {
    const user = await getUserProfile();
    if (!user) redirect("/login");

    const events = await getEvents();

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Family Events</h1>
                    <p className="text-slate-500 dark:text-slate-400">Plan reunions, dinners, and birthday parties!</p>
                </div>
                <CreateEventDialog />
            </div>

            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-500">
                        <CalendarDays className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
                    <p className="text-gray-500 max-w-sm text-center mb-6">
                        The calendar is clear! Why not start a discussion for the next get-together?
                    </p>
                    <CreateEventDialog />
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} currentUserId={user.id} />
                    ))}
                </div>
            )}
        </div>
    );
}
