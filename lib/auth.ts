import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getUserProfile() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });

    return dbUser;
}

export async function requireUser() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/sign-in");
    }

    return profile;
}
