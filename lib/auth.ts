import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { sanitizeData } from "@/lib/serialization";

export async function getUserProfile() {
    try {
        const cookieStore = await cookies();
        const sessionUid = cookieStore.get("session_uid")?.value;

        if (!sessionUid) {
            console.log("[getUserProfile] No session cookie found");
            return null;
        }

        console.log(`[getUserProfile] Fetching profile for uid: ${sessionUid}`);
        const userDoc = await adminDb.collection("users").doc(sessionUid).get();

        if (!userDoc.exists) {
            console.warn(`[getUserProfile] User document not found for ${sessionUid}`);
            return null;
        }

        const data = userDoc.data();
        return sanitizeData({
            id: userDoc.id,
            ...data
        });
    } catch (error) {
        console.error("[getUserProfile] Critical Error fetching user profile:", error);
        return null;
    }
}

export async function requireUser() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    return profile;
}

export const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isVerified(profile: any): boolean {
    if (!profile) return false;
    // Admins bypass verification requirements
    if (profile.role === 'admin') return true;
    return profile.emailVerified === true;
}

/**
 * Enforces Access Policy:
 * - Unverified > 24h: Redirects to /verify-email (BLOCKED)
 * - Be lenient if verifying login state
 */
export async function enforceVerificationAccess() {
    const profile = await getUserProfile();
    if (!profile) return; // Not logged in

    if (isVerified(profile)) return;

    // Unverified Logic
    const createdAt = profile.createdAt instanceof Date ? profile.createdAt : new Date();
    const age = Date.now() - createdAt.getTime();

    if (age > GRACE_PERIOD_MS) {
        redirect("/verify-email");
    }
}

/**
 * STRICTLY enforces verification for Mutations (Writes).
 * NO Grace Period for writing (per policy).
 */
export async function requireVerifiedAction() {
    const profile = await requireUser();

    if (!isVerified(profile)) {
        throw new Error("Email verification required for this action.");
    }
    return profile;
}
