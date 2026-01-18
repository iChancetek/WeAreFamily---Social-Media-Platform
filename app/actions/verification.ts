"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS_PER_24H = 3;

export async function sendVerificationEmail() {
    try {
        const user = await getUserProfile();
        if (!user) return { success: false, error: "Not logged in" };

        const userRef = adminDb.collection("users").doc(user.id);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (!userData) return { success: false, error: "User not found" };
        if (userData.emailVerified) return { success: false, error: "Already verified" };

        // Rate Limiting Checks
        const now = Date.now();
        const lastSent = userData.verificationEmailSentAt?.toDate().getTime() || 0;
        const attempts = userData.verificationResendCountToday || 0;
        const lastReset = userData.verificationCountResetAt?.toDate().getTime() || 0;

        // Reset daily counter if > 24h
        let currentAttempts = attempts;
        if (now - lastReset > 24 * 60 * 60 * 1000) {
            currentAttempts = 0;
            await userRef.update({
                verificationResendCountToday: 0,
                verificationCountResetAt: FieldValue.serverTimestamp()
            });
        }

        // Check Cooldown
        if (now - lastSent < RATE_LIMIT_COOLDOWN_MS) {
            const remainingS = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - lastSent)) / 1000);
            return { success: false, error: `Please wait ${remainingS}s before resending.`, nextAvailableIn: remainingS };
        }

        // Check Max Daily
        if (currentAttempts >= MAX_ATTEMPTS_PER_24H) {
            return { success: false, error: "Daily limit reached. Try again tomorrow." };
        }

        // Send Email via Firebase Admin Auth (Generate Link)
        // Firebase Admin doesn't natively "send" the template email like Client SDK does.
        // It provides 'generateEmailVerificationLink'.
        // To stick to the prompt "Verification email must be sent immediately... default behavior must not be trusted",
        // we can GENERATE the link and send it via our own mailer (Firestore 'mail' collection trigger).

        // However, standard Firebase Auth 'sendEmailVerification' on CLIENT side is the easiest path for "Magic Link" equivalent.
        // But prompt says "Backend Enforcement Rules... No trusted action rely solely on frontend".

        // Let's use the Admin SDK to generic the link and send it via our Email Extension/System.
        // This ensures WE control the delivery and can log it.

        const auth = getAuth();
        const link = await auth.generateEmailVerificationLink(user.email);

        // Log to 'mail' collection for delivery
        await adminDb.collection("mail").add({
            to: user.email,
            message: {
                subject: "Verify your Famio email",
                text: `Please verify your email for Famio by clicking here: ${link}`,
                html: `
                <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                    <h1>Verify your email</h1>
                    <p>Click the button below to verify your email address and unlock full access to Famio.</p>
                    <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, you can ignore this email.</p>
                </div>
                `
            }
        });

        // Update Stats
        await userRef.update({
            verificationEmailSentAt: FieldValue.serverTimestamp(),
            verificationResendCountToday: FieldValue.increment(1),
            verificationCountResetAt: (!userData.verificationCountResetAt || currentAttempts === 0) ? FieldValue.serverTimestamp() : userData.verificationCountResetAt // Set reset time if new cycle
        });

        return { success: true };

    } catch (error: any) {
        console.error("Verification email failed:", error);
        return { success: false, error: error.message };
    }
}
