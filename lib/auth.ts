import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get("session_uid")?.value;

    if (!sessionUid) {
        return null;
    }

    const userDoc = await getDoc(doc(db, "users", sessionUid));

    if (!userDoc.exists()) {
        return null;
    }

    return {
        id: userDoc.id,
        ...userDoc.data()
    } as any;
}

export async function requireUser() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    return profile;
}
