import { config } from "dotenv";
config({ path: ".env" });

import { getDb } from "@/lib/db";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schema";

const sql = getDb();
export const db = drizzle(sql, { schema });
