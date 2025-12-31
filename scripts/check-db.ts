
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
    console.log("Checking database connection...");
    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL is missing in .env");
        process.exit(1);
    }
    console.log("DATABASE_URL found (length: " + process.env.DATABASE_URL.length + ")");

    try {
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("SUCCESS: Database connected!", result);
    } catch (err: any) {
        console.error("CONNECTION FAILED:", err.message);
    }
    process.exit(0);
}

main();
