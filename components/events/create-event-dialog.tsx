'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createEvent } from "@/app/actions/events";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

export function CreateEventDialog({ children, onEventCreated }: { children: React.ReactNode, onEventCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Default start time: tomorrow at 9am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        locationName: "",
        startTime: tomorrow.toISOString().slice(0, 16) // Format for datetime-local
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createEvent({
                title: formData.title,
                description: formData.description,
                location: { name: formData.locationName },
                startTime: new Date(formData.startTime).toISOString(),
            });
            toast.success("Event created!");
            setOpen(false);
            setFormData({ ...formData, title: "", description: "" }); // Reset some fields
            if (onEventCreated) onEventCreated();
        } catch (error) {
            toast.error("Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Event Name</Label>
                        <Input
                            required
                            placeholder="Birthday Party, Meetup..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Date & Time</Label>
                        <Input
                            type="datetime-local"
                            required
                            value={formData.startTime}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            required
                            placeholder="123 Main St OR 'Online'"
                            value={formData.locationName}
                            onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            required
                            placeholder="What's happening?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Event
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
