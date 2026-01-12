"use server"
import { cookies } from "next/headers"
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function createSession(uid: string) {
    // In Next.js 15/16, cookies() is async
    const cookieStore = await cookies()

    console.log(`[createSession] Setting session_uid for ${uid}`);

    cookieStore.set("session_uid", uid, {
        httpOnly: true,
        // Force secure false locally if needed, but standardizing on NODE_ENV is best.
        // If users have issues locally with production builds, this might be the cause.
        // Forcing secure: false to resolve login issues on localhost/http environments.
        // Revert this only when deploying to strict HTTPS production.
        secure: false, // process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax' // Add explicit SameSite
    })
}


export async function deleteSession() {
    // We should ideally end the session in DB too, but we need the sessionId.
    // Since we don't track sessionId in cookie currently (only uid), 
    // we will rely on the client-side 'endTrackingSession' call for the specific session ID
    // OR we can mark all 'active' sessions for this user as 'completed' here as a fallback.

    // Fallback: Mark all active sessions as completed
    try {
        const cookieStore = await cookies()
        // Note: we can't get the user ID easily if we just delete cookie first? 
        // Actually we should get it before deleting.
        const uid = cookieStore.get("session_uid")?.value;

        if (uid) {
            const { adminDb } = await import("@/lib/firebase-admin"); // Dynamic import to avoid cycles if any
            const { FieldValue } = await import("firebase-admin/firestore");

            // Get all active sessions
            const sessionsSnapshot = await adminDb.collection("users").doc(uid).collection("sessions")
                .where("status", "==", "active")
                .get();

            const batch = adminDb.batch();
            sessionsSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'completed',
                    endedAt: FieldValue.serverTimestamp()
                });
            });

            // Update User Status
            batch.update(adminDb.collection("users").doc(uid), {
                isOnline: false,
                lastSignOffAt: FieldValue.serverTimestamp()
            });

            await batch.commit();
        }

        cookieStore.delete("session_uid")
    } catch (e) {
        console.error("Error during sign out tracking:", e);
        // Ensure cookie is deleted even if tracking fails
        const cookieStore = await cookies()
        cookieStore.delete("session_uid")
    }
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
        if (!adminDb || !adminDb.collection) {
            throw new Error("Firebase Admin DB not initialized");
        }
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

            // Send Automated Welcome Message
            await sendWelcomeMessageInternal(uid, displayName).catch(err => {
                console.error("Failed to send welcome message:", err);
            });

            // Notify Admins
            await notifyAdminNewUser(uid, email, displayName, firstName, lastName).catch(err => {
                console.error("Failed to notify admins:", err);
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

export async function notifyAdminNewUser(uid: string, email: string, displayName: string, firstName?: string, lastName?: string) {
    try {
        const fullName = firstName ? `${firstName} ${lastName || ''}`.trim() : displayName;
        const displayInfo = firstName ? `${displayName} (${fullName})` : displayName;

        // 1. Send Email to Chancellor via 'mail' collection (Trigger Email Extension)
        await adminDb.collection("mail").add({
            to: "chancellor@ichancetek.com",
            message: {
                subject: `New Famio Member: ${displayInfo}`,
                text: `A new user has joined Famio!\n\nDisplay Name: ${displayName}\nFull Name: ${fullName}\nEmail: ${email}\nUID: ${uid}\n\nThey have been auto-approved as a Member.`,
                html: `<p>A new user has joined <strong>Famio</strong>!</p><ul><li><strong>Display Name:</strong> ${displayName}</li><li><strong>Full Name:</strong> ${fullName}</li><li><strong>Email:</strong> ${email}</li><li><strong>UID:</strong> ${uid}</li></ul><p>They have been auto-approved as a Member.</p>`,
            },
        });

        // 2. Create In-App Notifications for all Admins
        const adminsSnapshot = await adminDb.collection("users")
            .where("role", "==", "admin")
            .get();

        // We write directly to adminDb to ensure it works even if session isn't fully propagated yet
        // (createNotification relies on getUserProfile() which might be flaky in this specific exact moment)
        const timestamp = FieldValue.serverTimestamp();

        const notificationPromises = adminsSnapshot.docs.map((adminDoc: any) =>
            adminDb.collection("notifications").add({
                recipientId: adminDoc.id,
                senderId: uid, // The new user is the sender
                type: 'admin_action',
                referenceId: uid, // Link to the new user
                read: false,
                createdAt: timestamp,
                meta: {
                    action: 'new_user_registration',
                    userName: displayName,
                    userEmail: email,
                    message: `New User: ${displayInfo} has joined Famio.`
                }
            })
        );

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error("Error notifying admins:", error);
        // Don't throw - this shouldn't block the signup process
    }
}


// Internal helper to avoid circular dependency with chat.ts
async function sendWelcomeMessageInternal(targetUserId: string, targetUserDisplayName: string) {
    if (!adminDb) return;

    // 1. Find Admin User
    const adminQuery = await adminDb.collection("users")
        .where("email", "==", "chancellor@ichancetek.com")
        .limit(1)
        .get();

    if (adminQuery.empty) {
        console.error("Welcome Message Error: Admin user 'chancellor@ichancetek.com' not found.");
        return;
    }

    const adminUser = adminQuery.docs[0];
    const adminId = adminUser.id;

    if (adminId === targetUserId) return;

    // 2. Check/Create Chat
    const chatsSnapshot = await adminDb.collection("chats")
        .where("participants", "array-contains", targetUserId)
        .get();

    // Find existing 1-on-1 chat with Admin
    let chatDoc = chatsSnapshot.docs.find((chatDoc: any) => {
        const chatData = chatDoc.data();
        return !chatData.isGroup && chatData.participants.includes(adminId);
    });

    let chatId;
    if (chatDoc) {
        chatId = chatDoc.id;
    } else {
        const newChatRef = await adminDb.collection("chats").add({
            participants: [targetUserId, adminId],
            isGroup: false,
            lastMessageAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
        });
        chatId = newChatRef.id;
    }

    // 3. Send Message
    const welcomeText = `Welcome to the Famio Family!

Thank you for joining us — we’re excited to have you here. We hope you enjoy a wonderful experience on the Famio platform as you connect, share, and grow with the community.

These are exciting times at Famio! We’re rolling out new enhancements and updates every week to make your experience even better.

We truly appreciate you being part of the Famio Family.

Best regards,
Chancellor Minus
Founder & CEO
ChanceTEK | Famio`;

    await adminDb.collection("chats").doc(chatId).collection("messages").add({
        senderId: adminId,
        content: welcomeText,
        createdAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("chats").doc(chatId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
    });

    // Notify logic (inlined simple create no-import to be safe or use raw db)
    // We will simple write directly to db to avoid import cycle with notifications.ts if that is risky.
    // notifications.ts imports lib/auth which is safe, but let's be 100% safe and write raw.
    await adminDb.collection("notifications").add({
        recipientId: targetUserId,
        senderId: adminId,
        type: 'message',
        referenceId: chatId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        meta: { message: "You have a new message from Chancellor Minus" }
    });

    console.log(`[Internal] Welcome message sent to ${targetUserDisplayName} (${targetUserId}) from Admin.`);
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
