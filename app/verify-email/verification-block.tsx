"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, RefreshCw, LogOut, CheckCircle2, ShieldCheck } from "lucide-react";
import { sendVerificationEmail } from "@/app/actions/verification";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function VerificationBlock({ email }: { email: string }) {
    const { refreshUser, signOut } = useAuth();
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const [isPolling, setIsPolling] = useState(true);
    const router = useRouter();

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    // Auto-polling for verification status — checks every 5 seconds
    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(async () => {
            try {
                const { getAuth } = await import("firebase/auth");
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                    await user.reload();
                    setPollCount(c => c + 1);

                    if (user.emailVerified) {
                        clearInterval(interval);
                        setIsPolling(false);

                        // Re-establish session now that user is verified
                        const { createSession, syncUserToDb } = await import("@/app/actions/auth");
                        const nameParts = (user.displayName || "").split(' ');
                        const firstName = nameParts[0] || "famio";
                        const lastName = nameParts.slice(1).join(' ') || "Member";

                        try {
                            await syncUserToDb(
                                user.uid,
                                user.email || "",
                                user.displayName || user.email?.split('@')[0] || "User",
                                firstName,
                                lastName,
                                true
                            );
                        } catch { /* non-fatal */ }
                        await createSession(user.uid);

                        toast.success("Email verified! Welcome to famio!");
                        router.push('/');
                    }
                }
            } catch {
                // Silently retry on next interval
            }
        }, 5000);

        // Stop polling after 10 minutes to conserve resources
        const maxPollTimer = setTimeout(() => {
            clearInterval(interval);
            setIsPolling(false);
        }, 10 * 60 * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(maxPollTimer);
        };
    }, [isPolling, router]);

    const handleResend = async () => {
        if (cooldown > 0) return;
        setSending(true);
        try {
            const result = await sendVerificationEmail();
            if (result.success) {
                toast.success("Email sent!");
                setCooldown(300);
            } else {
                toast.error(result.error);
                if (result.nextAvailableIn) setCooldown(result.nextAvailableIn);
            }
        } catch {
            toast.error("Error sending email");
        } finally {
            setSending(false);
        }
    }

    const handleCheck = async () => {
        setVerifying(true);
        try {
            await refreshUser();

            const { getAuth } = await import("firebase/auth");
            const { createSession, syncUserToDb } = await import("@/app/actions/auth");
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (currentUser && currentUser.emailVerified) {
                const nameParts = (currentUser.displayName || "").split(' ');
                const firstName = nameParts[0] || "famio";
                const lastName = nameParts.slice(1).join(' ') || "Member";
                try {
                    await syncUserToDb(
                        currentUser.uid,
                        currentUser.email || "",
                        currentUser.displayName || currentUser.email?.split('@')[0] || "User",
                        firstName,
                        lastName,
                        true
                    );
                } catch { /* non-fatal */ }
                await createSession(currentUser.uid);
                router.push('/');
            } else {
                toast.error("Email not yet verified. Please click the link in your inbox and try again.");
            }
        } catch (error) {
            console.error("Verification check failed:", error);
            toast.error("Could not confirm verification. Please try again.");
        } finally {
            setVerifying(false);
        }
    }

    return (
        <Card className="w-full max-w-md shadow-2xl border-2 border-blue-500/10 overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-50 dark:ring-blue-900/20">
                    <Mail className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                <CardDescription className="pt-2">
                    We sent a verification email to <br />
                    <span className="font-semibold text-foreground">{email}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Account requires verification
                    </p>
                    <p className="opacity-90">
                        You must verify your email address before you can access your account.
                        Please check your <strong>Junk/Spam</strong> folder if you don't see the email.
                    </p>
                </div>

                {/* Auto-polling status indicator */}
                {isPolling && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
                        <div className="relative">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
                        </div>
                        Listening for verification… (auto-detects when you click the email link)
                    </div>
                )}

                {!isPolling && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
                        <span className="text-yellow-600">Auto-detection paused.</span>
                        <button
                            className="underline text-blue-600 hover:text-blue-800"
                            onClick={() => setIsPolling(true)}
                        >
                            Resume
                        </button>
                    </div>
                )}

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                    onClick={handleResend}
                    disabled={sending || cooldown > 0}
                >
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {cooldown > 0 ? `Resend available in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}` : "Resend Verification Email"}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full h-11 font-medium" onClick={handleCheck} disabled={verifying}>
                    {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                    I've verified my email
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-4">
                <Button variant="link" className="text-muted-foreground" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Back to Login
                </Button>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                    We use approximate location and device information to improve security and personalize your experience.
                </p>
            </CardFooter>
        </Card>
    )
}
