"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/app/actions/settings";
import { toast } from "sonner";
import { PartyPopper } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export function BirthdayOnboarding({ currentBirthday }: { currentBirthday: string | null }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [birthday, setBirthday] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Only show if user is loaded and birthday is missing
        if (user && !currentBirthday) {
            // Add a small delay so it doesn't pop up instantly on load
            const timer = setTimeout(() => {
                setOpen(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, currentBirthday]);

    const handleSubmit = async () => {
        // Simple validation for MM-DD format
        const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        if (!regex.test(birthday)) {
            toast.error("Please enter format MM-DD (e.g. 12-25)");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateProfile({ birthday });
            toast.success("Birthday saved! Get ready for balloons! 🎈");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to save birthday");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                        <PartyPopper className="w-10 h-10 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">When is your birthday?</DialogTitle>
                    <DialogDescription className="text-center">
                        We want to celebrate with you! Enter your birthday so the family can send you meaningful wishes.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Input
                        placeholder="MM-DD (e.g. 05-20)"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="text-center text-lg tracking-widest"
                        maxLength={5}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Skip for now</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !birthday}>
                        {isSubmitting ? "Saving..." : "Save Celebration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
