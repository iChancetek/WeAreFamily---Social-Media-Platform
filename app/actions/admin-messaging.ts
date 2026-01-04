"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

// 1. Send Global Broadcast (Notification)
export async function sendSystemBroadcast(title: string, message: string, link?: string) {
    const admin = await getUserProfile();
    if (!admin || admin.role !== "admin") throw new Error("Unauthorized: Admin only");

    if (!title || !message) throw new Error("Title and message are required");

    console.log(`[Admin] Starting system broadcast: ${title}`);

    // Fetch ALL users (batching handled if > 1000, but for now standard fetch is ok)
    // Optimization: Store user IDs in a stripped list or use Cloud Functions.
    // For this app scale, fetching 'users' collection is acceptable.
    const usersSnapshot = await adminDb.collection("users").get();

    if (usersSnapshot.empty) return { count: 0 };

    const batchSize = 500;
    let batch = adminDb.batch();
    let count = 0;
    const total = usersSnapshot.size;

    for (const doc of usersSnapshot.docs) {
        const userId = doc.id;
        const ref = adminDb.collection("notifications").doc();

        batch.set(ref, {
            recipientId: userId,
            type: "system_broadcast",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            meta: {
                title,
                message,
                link: link || "/",
                action: "announcement"
            }
        });

        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            batch = adminDb.batch();
        }
    }

    if (count % batchSize !== 0) {
        await batch.commit(); // Commit remaining
    }

    // Also Log to Audit
    const { logAuditEvent } = await import("./audit");
    await logAuditEvent("admin.broadcast", {
        details: { title, message, recipientCount: total }
    });

    return { success: true, count: total };
}

// 2. Send Direct Message as Admin (Bypassing some checks if needed, but reusing chat logic is best)
export async function sendAdminMessage(targetUserId: string, message: string) {
    const admin = await getUserProfile();
    if (!admin || admin.role !== "admin") throw new Error("Unauthorized");

    // Reuse existing chat logic but wrapped for admin explicit action
    const { checkOrCreateChat, sendMessage } = await import("./chat");

    // Ensure chat exists
    const chatId = await checkOrCreateChat(targetUserId);

    // Send message
    await sendMessage(chatId, message);

    return { success: true };
}

// 3. Send Message to a Group (Admin override)
export async function sendAdminGroupMessage(groupId: string, message: string) {
    const admin = await getUserProfile();
    if (!admin || admin.role !== "admin") throw new Error("Unauthorized");

    // Check availability
    const groupDoc = await adminDb.collection("chats").doc(groupId).get();
    if (!groupDoc.exists) throw new Error("Group not found");

    // Force add message even if not participant? 
    // Ideally Admin adds themselves first? Or just forced write?
    // Let's stick to "Join and Send" or just "Force Write".
    // Force write is cleaner for "System" messages.

    await adminDb.collection("chats").doc(groupId).collection("messages").add({
        senderId: admin.id,
        content: message,
        createdAt: FieldValue.serverTimestamp(),
        isSystemMessage: true // distinct flag
    });

    await adminDb.collection("chats").doc(groupId).update({
        lastMessageAt: FieldValue.serverTimestamp()
    });
}
