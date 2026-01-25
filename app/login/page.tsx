"use client"

import { useState } from "react"
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Loader2, Heart } from "lucide-react"
import "@/lib/firebase"

import { createSession, syncUserToDb } from "@/app/actions/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const [needsVerification, setNeedsVerification] = useState(false)
    const [unverifiedUser, setUnverifiedUser] = useState<any>(null)
    const [resendCooldown, setResendCooldown] = useState(0)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const auth = getAuth()
            const { setPersistence, browserLocalPersistence } = await import("firebase/auth");
            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            if (!user.emailVerified) {
                setUnverifiedUser(user)
                setNeedsVerification(true)
                return;
            }

            console.log("User authenticated, syncing to database...")
            // Sync user (existing users might have empty profileData, that's fine)
            // Split display name into first/last for fallback
            const nameParts = (user.displayName || "").split(' ');
            const firstName = nameParts[0] || "Famio";
            const lastName = nameParts.slice(1).join(' ') || "Member";

            await syncUserToDb(user.uid, user.email!, user.displayName || user.email!.split('@')[0], firstName, lastName, user.emailVerified)

            console.log("Creating session cookie...")
            await createSession(user.uid)

            toast.success("Welcome back!")
            router.push("/")
            router.refresh()
        } catch (error: any) {
            console.error("Login Critical Failure:", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);
            toast.error(`Login Failed: ${error.message} (${error.code || 'Unknown'})`);
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!unverifiedUser || resendCooldown > 0) return;

        setIsLoading(true);
        try {
            const { sendEmailVerification } = await import("firebase/auth");
            await sendEmailVerification(unverifiedUser);
            toast.success("Verification email sent! Please check your inbox.");
            setResendCooldown(60);

            // Start cooldown timer
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error: any) {
            console.error("Error sending verification email:", error);
            toast.error(error.message || "Failed to send verification email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = async () => {
        const auth = getAuth();
        await auth.signOut();
        setNeedsVerification(false);
        setUnverifiedUser(null);
        setEmail("");
        setPassword("");
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            const auth = getAuth()
            const { setPersistence, browserLocalPersistence } = await import("firebase/auth");
            await setPersistence(auth, browserLocalPersistence);
            const provider = new GoogleAuthProvider()
            const userCredential = await signInWithPopup(auth, provider)
            const user = userCredential.user

            // Split display name into first/last
            const nameParts = (user.displayName || "").split(' ');
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(' ') || "";

            // Ensure user exists in database
            await syncUserToDb(
                user.uid,
                user.email!,
                user.displayName || user.email!.split('@')[0],
                firstName,
                lastName,
                user.emailVerified
            )
            await createSession(user.uid)

            toast.success("Welcome back!")
            router.push("/")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to login with Google")
        } finally {
            setIsLoading(false)
        }
    }

    if (needsVerification) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
                <Card className="w-full max-w-md shadow-lg border-blue-100">
                    <CardHeader className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <img src="/icons/icon-96x96.png" alt="Famio" className="w-8 h-8 rounded-xl" />
                            <span className="text-2xl font-bold text-blue-600">Famio</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
                        <CardDescription>
                            We sent a verification email to <span className="font-medium text-foreground">{unverifiedUser?.email}</span>.
                            <br />Please check your inbox and click the link to verify your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
                            <p className="font-semibold mb-1">Account requires verification</p>
                            <p>You must verify your email address before you can access your account.</p>
                            <p className="mt-1 font-medium">Please check your Junk/Spam folder if you don't see the email.</p>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleResendVerification}
                            disabled={isLoading || resendCooldown > 0}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Resend Verification Email"}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" onClick={handleBackToLogin}>
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 relative z-[10]">
            <Card className="w-full max-w-md shadow-lg border-blue-100 relative z-[50]">
                <CardHeader className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <img src="/icons/icon-96x96.png" alt="Famio" className="w-8 h-8 rounded-xl" />
                        <span className="text-2xl font-bold text-blue-600">Famio</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors text-gray-900"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors text-gray-900"
                                autoComplete="current-password"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sign In
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50" onClick={handleGoogleLogin} disabled={isLoading}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </Button>

                    <div className="text-center text-sm text-muted-foreground mt-6">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
                            Create Account
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 left-0 right-0 text-center space-y-2 z-[50]">
                <Link href="/landing" className="block text-sm text-blue-600 hover:underline font-medium mb-2">
                    Return to Landing Page
                </Link>
                <Link href="/privacy" className="text-xs text-muted-foreground hover:text-blue-600 font-medium transition-colors">
                    Privacy Policy
                </Link>
                <p className="text-[10px] text-muted-foreground/60">
                    Built with privacy and security at the core. © ChanceTEK
                </p>
            </div>
        </div >
    )
}
