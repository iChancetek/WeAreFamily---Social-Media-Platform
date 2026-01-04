"use server"
import { cookies } from "next/headers"
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function createSession(uid: string) {
    // In Next.js 15/16, cookies() is async
    const cookieStore = await cookies()
    cookieStore.set("session_uid", uid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })
}


export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete("session_uid")
}

export async function syncUserToDb(
    uid: string,
    email: string,
    displayName: string,
    firstName?: string,
    lastName?: string,
    emailVerified: boolean = false
) {
    try {
        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Default to 'member' (auto-approve) unless it's the specific admin email
            const isAdmin = email === "chancellor@ichancetek.com";
            const role = isAdmin ? "admin" : "member";
            const isVerified = isAdmin || emailVerified;

            await userRef.set({
                email: email,
                displayName: displayName,
                profileData: {
                    firstName: firstName || "",
                    lastName: lastName || "",
                },
                role: role,
                isActive: true,
                emailVerified: isVerified,
                createdAt: FieldValue.serverTimestamp(),
            });
        } else {
            // Check if we need to promote existing user
            const userData = userDoc.data();
            if (email === "chancellor@ichancetek.com" && userData?.role !== "admin") {
                await userRef.update({ role: "admin" });
            }
        }
    } catch (error) {
        console.error("Error syncing user to database:", error)
        throw new Error("Failed to sync user to database")
    }
}

export async function notifyAdminNewUser(uid: string, email: string, fullName: string) {
    try {
        // 1. Send Email to Chancellor via 'mail' collection (Trigger Email Extension)
        await adminDb.collection("mail").add({
            to: "chancellor@ichancetek.com",
            message: {
                subject: `New Famio Member: ${fullName}`,
                text: `A new user has joined Famio!\n\nName: ${fullName}\nEmail: ${email}\nUID: ${uid}\n\nThey have been auto-approved as a Member.`,
                html: `<p>A new user has joined <strong>Famio</strong>!</p><ul><li><strong>Name:</strong> ${fullName}</li><li><strong>Email:</strong> ${email}</li><li><strong>UID:</strong> ${uid}</li></ul><p>They have been auto-approved as a Member.</p>`,
            },
        });

        // 2. Create In-App Notifications for all Admins
        const adminsSnapshot = await adminDb.collection("users")
            .where("role", "==", "admin")
            .get();

        const { createNotification } = await import("./notifications");

        const notificationPromises = adminsSnapshot.docs.map(adminDoc =>
            createNotification(
                adminDoc.id,
                'admin_action' as any,
                uid,
                {
                    action: 'new_user_registration',
                    userName: fullName,
                    userEmail: email,
                    message: `New user ${fullName} (${email}) has joined.`
                }
            )
        );

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error("Error notifying admins:", error);
        // Don't throw - this shouldn't block the signup process
    }
}

export async function sendPasswordReset(email: string) {
    // This is typically handled on the client in Firebase, 
    // but we can provide a server-side trigger if needed 
    // or just document that it should be called on client.
    // Actually, Firebase Admin doesn't have a direct 'sendPasswordReset' method 
    // like the client SDK. It usually generates a link.
    // To keep it simple and consistent with Firebase patterns,
    // we'll implement this on the client side in the Settings UI.
    // But I'll provide a placeholder here if any server-side logic is needed.
    return { success: true };
}
