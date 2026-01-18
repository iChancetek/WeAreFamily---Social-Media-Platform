"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Mail, Loader2, Send } from "lucide-react";
import { sendVerificationEmail } from "@/app/actions/verification"; // We will create this
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface VerificationBannerProps {
    className?: string;
}

export function VerificationBanner({ className }: VerificationBannerProps) {
    const { profile, loading } = useAuth();
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState<number>(0);
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();

    // Check rate limit timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    if (loading || !profile) return null;

    // Hidden if verified or admin
    if (profile.emailVerified || profile.role === 'admin') return null;

    const handleSendEmail = async () => {
        if (cooldown > 0) return;

        setSending(true);
        try {
            const result = await sendVerificationEmail();
            if (result.success) {
                toast.success("Verification email sent!", {
                    description: "Please check your inbox (and spam folder)."
                });
                setLastSent(Date.now());
                setCooldown(300); // 5 minutes 300s
            } else {
                toast.error("Failed to send", { description: result.error });
                if (result.nextAvailableIn) {
                    setCooldown(result.nextAvailableIn);
                }
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={cn("bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 px-4 py-2.5", className)}>
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                        <span className="font-semibold">Account Unverified:</span> You have limited access. Verify your email to unlock posting and messaging.
                    </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-transparent text-amber-900 border-amber-300 hover:bg-amber-200 dark:text-amber-100 dark:border-amber-700 dark:hover:bg-amber-800 ml-auto sm:ml-0"
                        onClick={handleSendEmail}
                        disabled={sending || cooldown > 0}
                    >
                        {sending ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-3 h-3 mr-2" />
                        )}
                        {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Email"}
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-amber-800 hover:bg-amber-200 dark:text-amber-200 dark:hover:bg-amber-800"
                        onClick={() => {
                            window.location.reload(); // Hard reload to re-sync auth
                        }}
                    >
                        I've Verified
                    </Button>
                </div>
            </div>
        </div>
    );
}
