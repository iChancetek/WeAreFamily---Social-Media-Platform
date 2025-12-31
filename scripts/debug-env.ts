
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');

console.log(`Checking for .env file at: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log("file exists!");
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    console.log(`File has ${lines.length} lines.`);

    // Check for DATABASE_URL key manually
    const hasDbUrl = lines.some(line => line.trim().startsWith('DATABASE_URL='));
    console.log(`Contains 'DATABASE_URL=': ${hasDbUrl}`);

    // Try loading with dotenv
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error("dotenv parsing error:", result.error);
    } else {
        console.log("dotenv parsed successfully.");
        console.log("DATABASE_URL in process.env:", !!process.env.DATABASE_URL);
        if (process.env.DATABASE_URL) {
            console.log("DATABASE_URL length:", process.env.DATABASE_URL.length);
        }
    }

} else {
    console.log("file does NOT exist.");
}
