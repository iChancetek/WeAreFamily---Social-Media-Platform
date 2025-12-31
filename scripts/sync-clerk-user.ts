
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const TARGET_EMAIL = "Chancellor@ichancetek.com";

async function main() {
    if (!CLERK_SECRET_KEY) {
        console.error("Missing CLERK_SECRET_KEY in .env");
        process.exit(1);
    }

    console.log(`Fetching user ${TARGET_EMAIL} from Clerk API...`);

    try {
        // 1. Fetch user from Clerk
        const response = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(TARGET_EMAIL)}`, {
            headers: {
                Authorization: `Bearer ${CLERK_SECRET_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Clerk API error: ${response.statusText}`);
        }

        const clerkUsers = await response.json();

        if (clerkUsers.length === 0) {
            console.log("❌ User not found in Clerk.");
            console.log("ACTION REQUIRED: Please go to http://localhost:3000 and Sign Up first!");
            return;
        }

        const clerkUser = clerkUsers[0];
        console.log(`Found Clerk User ID: ${clerkUser.id}`);

        // 2. Check if exists in DB
        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, clerkUser.id)
        });

        if (existingUser) {
            console.log("User already exists in DB. Updating role to ADMIN...");
            await db.update(users)
                .set({ role: 'admin' })
                .where(eq(users.id, clerkUser.id));
        } else {
            console.log("User not in DB. Creating new ADMIN user...");
            await db.insert(users).values({
                id: clerkUser.id,
                email: clerkUser.email_addresses[0].email_address,
                role: 'admin',
                profileData: {
                    firstName: clerkUser.first_name,
                    lastName: clerkUser.last_name,
                    imageUrl: clerkUser.image_url
                }
            });
        }

        console.log("✅ SUCCESS: User synced and promoted to Admin!");

    } catch (error) {
        console.error("Script failed:", error);
    }
}

main();
