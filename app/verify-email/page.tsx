import { Suspense } from "react"
import { getUserProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { VerificationBanner } from "@/components/auth/verification-banner"
import { VerificationBlock } from "./verification-block" // Client component

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/login");
    }

    // If already verified, go home
    if (user.emailVerified || user.role === 'admin') {
        redirect("/");
    }

    // This page is the "Jail". It renders a blocking UI.
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <VerificationBlock email={user.email} />
        </div>
    );
}
