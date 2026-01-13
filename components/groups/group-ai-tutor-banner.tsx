'use client';

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function GroupAITutorBanner() {
    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white flex items-center justify-between shadow-md mb-6">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Need Homework Help?
                </h3>
                <p className="text-white/90 text-sm">The AI Tutor is here to explain tricky concepts!</p>
            </div>
            <Button
                variant="secondary"
                size="sm"
                className="gap-2 font-semibold text-primary hover:bg-white/90"
                onClick={() => {
                    const event = new CustomEvent('famio:open-ai', {
                        detail: {
                            mode: 'tutor',
                            context: "I need help with my homework from this group.",
                            type: 'tutor_start'
                        }
                    });
                    window.dispatchEvent(event);
                    toast.success("AI Tutor Summoned! 🎓");
                }}
            >
                Ask Tutor
            </Button>
        </div>
    );
}
