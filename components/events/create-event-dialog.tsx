"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/app/actions/events";
import { toast } from "sonner";
import { Loader2, Plus, Calendar } from "lucide-react";

export function CreateEventDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        description: "",
        date: "" // YYYY-MM-DDTHH:mm
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.date) {
            toast.error("Title and Date are required");
            return;
        }

        setIsSubmitting(true);
        try {
            await createEvent({
                ...formData,
                date: new Date(formData.date)
            });
            toast.success("Event created! 🎉");
            setOpen(false);
            setFormData({ title: "", location: "", description: "", date: "" });
        } catch {
            toast.error("Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-lg shadow-pink-500/20">
                    <Plus className="w-4 h-4" />
                    New Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Plan a Gathering</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Grandma's 80th Birthday"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date & Time</Label>
                        <Input
                            id="date"
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="e.g. The Old Family House"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Details</Label>
                        <Textarea
                            id="description"
                            placeholder="Add details about food, dress code, etc."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
