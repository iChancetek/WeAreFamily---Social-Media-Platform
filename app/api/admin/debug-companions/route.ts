
import { adminDb } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getUserProfile();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const debugData: any = {
            userId: user.id,
            checks: {}
        };

        // 1. Check Subcollection (New Way)
        const connectionsSnap = await adminDb.collection("users")
            .doc(user.id)
            .collection("companionConnections")
            .get();

        debugData.checks.subcollection = {
            count: connectionsSnap.size,
            docs: connectionsSnap.docs.map((d: any) => ({ id: d.id, data: d.data() }))
        };

        // 2. Check Legacy Requests (Sent)
        const sentSnap = await adminDb.collection("companionRequests")
            .where("senderId", "==", user.id)
            .get();

        debugData.checks.legacySent = {
            count: sentSnap.size,
            docs: sentSnap.docs.map((d: any) => ({ id: d.id, data: d.data() }))
        };

        // 3. Check Legacy Requests (Received)
        const receivedSnap = await adminDb.collection("companionRequests")
            .where("receiverId", "==", user.id)
            .get();

        debugData.checks.legacyReceived = {
            count: receivedSnap.size,
            docs: receivedSnap.docs.map((d: any) => ({ id: d.id, data: d.data() }))
        };

        return NextResponse.json(debugData);

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
