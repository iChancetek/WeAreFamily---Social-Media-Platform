export interface Event {
    id: string;
    title: string;
    description: string;
    startTime: string; // ISO string
    endTime?: string;
    location: {
        name: string;
        lat?: number;
        lng?: number;
    };
    organizerId: string;
    organizerName: string;
    organizerImage?: string;
    createdAt: string;
    attendeeCount: number;
    currentUserRsvp?: 'going' | 'maybe' | 'not_going';
}
