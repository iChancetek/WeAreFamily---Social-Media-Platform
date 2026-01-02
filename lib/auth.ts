import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get("session_uid")?.value;

    if (!sessionUid) {
        return null;
    }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, sessionUid),
    });

    return dbUser || null;
}

export async function requireUser() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    return profile;
}
