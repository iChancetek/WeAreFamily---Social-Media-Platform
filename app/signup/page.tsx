"use client"

import { useState } from "react"
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Loader2, Heart } from "lucide-react"
import "@/lib/firebase"
import { createSession, syncUserToDb, notifyAdminNewUser } from "@/app/actions/auth"
import { z } from "zod";

const signupSchema = z.object({
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    displayName: z.string().min(2, "Display Name is required (min 2 characters)"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function SignupPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isDisplayNameManuallyEdited, setIsDisplayNameManuallyEdited] = useState(false)
    const router = useRouter()

    // Auto-generate Display Name
    const updateDisplayName = (fName: string, lName: string) => {
        if (!isDisplayNameManuallyEdited && fName && lName) {
            setDisplayName(`${fName} ${lName}`.trim())
        }
    }

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFirstName(val);
        updateDisplayName(val, lastName);
    }

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLastName(val);
        updateDisplayName(firstName, val);
    }

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
        setIsDisplayNameManuallyEdited(true);
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!")
            return
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        if (displayName.trim().length < 2) {
            toast.error("Display Name is required (min 2 characters)")
            return
        }

        setIsLoading(true)
        try {
            const auth = getAuth()
            const { setPersistence, browserLocalPersistence } = await import("firebase/auth");
            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Update display name in Firebase (use displayName if provided, otherwise firstName)
            const finalDisplayName = displayName || firstName
            await updateProfile(user, { displayName: finalDisplayName })

            // Send verification email
            await sendEmailVerification(user);

            // Sync to Database with all fields
            await syncUserToDb(user.uid, email, finalDisplayName, firstName, lastName)

            // Notify admins of new user registration
            await notifyAdminNewUser(user.uid, email, `${firstName} ${lastName}`)

            // Do NOT create session. Enforce verification.
            await auth.signOut();

            toast.success("Account created! Please check your email (and Junk folder) to verify.")
            router.push("/login")
        } catch (error: any) {
            console.error(error)
            if (error.code === 'auth/email-already-in-use') {
                toast.error("This email is already registered. Please login instead.")
            } else if (error.code === 'auth/invalid-email') {
                toast.error("Invalid email address")
            } else if (error.code === 'auth/weak-password') {
                toast.error("Password is too weak. Please use a stronger password.")
            } else {
                toast.error(error.message || "Failed to create account")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Heart className="w-8 h-8 text-blue-600" fill="currentColor" />
                        <span className="text-2xl font-bold text-blue-600">Famio</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
                    <CardDescription>Join your family network on Famio</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={handleFirstNameChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={handleLastNameChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="How you'd like to be known"
                                value={displayName}
                                onChange={handleDisplayNameChange}
                                required
                                minLength={2}
                            />
                            <p className="text-xs text-muted-foreground">This will be your public name on Famio</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                            <p className="font-semibold mb-1">Next Steps:</p>
                            <ul className="text-xs space-y-1 text-gray-600">
                                <li>• Check your email to verify your account</li>
                                <li>• <strong>Note:</strong> Check your Junk or Spam folder if you don't see it</li>
                                <li>• You can login immediately after verification</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Account
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                            Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

