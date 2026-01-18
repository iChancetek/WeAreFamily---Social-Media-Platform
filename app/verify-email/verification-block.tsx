"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, RefreshCw, LogOut } from "lucide-react";
import { sendVerificationEmail } from "@/app/actions/verification";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function VerificationBlock({ email }: { email: string }) {
    const { refreshUser, signOut } = useAuth();
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

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
            // If verified, refreshUser triggers router.refresh which might redirect if the page logic re-runs 
            // OR we can manually check and push.
            // But layout/page logic handles redirect if verified.
            // Let's force a hard reload or router replace to home to trigger server check.
            router.push('/');
        } finally {
            setVerifying(false);
        }
    }

    return (
        <Card className="w-full max-w-md shadow-lg border-2 border-amber-500/10">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                <CardDescription className="pt-2">
                    We sent a verification email to <br />
                    <span className="font-semibold text-foreground">{email}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm">
                    <p className="font-medium mb-1">Account requires verification</p>
                    <p className="opacity-90">
                        You must verify your email address before you can access your account.
                        Please check your Junk/Spam folder if you don't see the email.
                    </p>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleResend}
                    disabled={sending || cooldown > 0}
                >
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Verification Email"}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleCheck} disabled={verifying}>
                    {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                    I've verified my email
                </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
                <Button variant="link" className="text-muted-foreground" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Back to Login
                </Button>
            </CardFooter>
        </Card>
    )
}
