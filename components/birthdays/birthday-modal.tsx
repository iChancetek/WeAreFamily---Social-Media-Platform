"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBirthday } from "@/app/actions/user";
import { toast } from "sonner";
import { Cake } from "lucide-react";
import { useRouter } from "next/navigation";

interface BirthdayModalProps {
    hasBirthday: boolean;
}

export function BirthdayModal({ hasBirthday }: BirthdayModalProps) {
    const [open, setOpen] = useState(!hasBirthday);
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    if (hasBirthday) return null;

    const months = [
        { value: "01", label: "January" }, { value: "02", label: "February" },
        { value: "03", label: "March" }, { value: "04", label: "April" },
        { value: "05", label: "May" }, { value: "06", label: "June" },
        { value: "07", label: "July" }, { value: "08", label: "August" },
        { value: "09", label: "September" }, { value: "10", label: "October" },
        { value: "11", label: "November" }, { value: "12", label: "December" },
    ];

    const days = Array.from({ length: 31 }, (_, i) => {
        const d = (i + 1).toString().padStart(2, "0");
        return { value: d, label: d };
    });

    const handleSubmit = async () => {
        if (!month || !day) return;
        setIsLoading(true);
        try {
            await updateBirthday(`${month}-${day}`);
            toast.success("Birthday saved! Get ready to celebrate! 🎂");
            setOpen(false);
            router.refresh();
        } catch {
            toast.error("Failed to save birthday.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md bg-white text-black border-gray-200">
                <DialogHeader>
                    <div className="mx-auto bg-rose-100 p-3 rounded-full mb-4 w-fit">
                        <Cake className="w-8 h-8 text-rose-500" />
                    </div>
                    <DialogTitle className="text-center text-xl">When is your birthday?</DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        We want to celebrate with you! Enter your birthday so we can fill your timeline with confetti on your special day.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-4 py-4 justify-center">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[140px] border-gray-300">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={day} onValueChange={setDay}>
                        <SelectTrigger className="w-[100px] border-gray-300">
                            <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-[200px]">
                            {days.map((d) => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!month || !day || isLoading}
                        className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white border-0"
                    >
                        {isLoading ? "Saving..." : "Save Celebration Date 🎉"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
