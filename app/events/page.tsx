import { MainLayout } from "@/components/layout/main-layout";
import { EventsFeed } from "@/components/events/events-feed";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Events | Famio",
    description: "Discover and RSVP to upcoming family events and gatherings.",
};

export default function EventsPage() {
    return (
        <MainLayout>
            <EventsFeed />
        </MainLayout>
    );
}
