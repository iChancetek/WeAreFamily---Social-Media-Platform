import { MainLayout } from "@/components/layout/main-layout";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventList } from "@/components/events/event-list";
import { getEvents } from "@/app/actions/events";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EventsPage() {
    const user = await getUserProfile();
    if (!user || user.role === 'pending') {
        redirect("/");
    }

    const events = await getEvents();

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Family Events</h1>
                    <p className="text-gray-500">Upcoming gatherings and celebrations</p>
                </div>
                <CreateEventDialog />
            </div>
            <EventList events={events} />
        </MainLayout>
    )
}
