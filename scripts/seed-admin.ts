
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
    const email = "Chancellor@ichancetek.com"; // Default admin email

    console.log(`Attempting to promote ${email} to admin...`);

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            console.log(`User ${email} not found. Please sign up first!`);

            // Fallback: If you want to seed a placeholder, we can't because we need the Clerk ID.
            // The webhook handles the creation.
            return;
        }

        await db.update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, email));

        console.log(`SUCCESS: ${email} is now an ADMIN.`);
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
    process.exit(0);
}

main();
