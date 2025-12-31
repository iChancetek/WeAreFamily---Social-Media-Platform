"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkAndCelebrateBirthdays } from "@/app/actions/birthdays";
import { toast } from "sonner";
import { Cake, Loader2 } from "lucide-react";

export function BirthdayTrigger() {
    const [isLoading, setIsLoading] = useState(false);

    const handleRun = async () => {
        setIsLoading(true);
        try {
            const result = await checkAndCelebrateBirthdays();
            if (result.success) {
                toast.success(result.message);
            }
        } catch (error) {
            toast.error("Failed to run birthday check.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="bg-rose-500/20 p-3 rounded-full">
                <Cake className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-center">
                <h3 className="font-semibold text-lg">Birthday Automation</h3>
                <p className="text-sm text-gray-400">Run the daily check to celebrate birthdays.</p>
            </div>
            <Button
                onClick={handleRun}
                disabled={isLoading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                    </>
                ) : (
                    "Run Check Now"
                )}
            </Button>
        </div>
    );
}
