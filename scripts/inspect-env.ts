
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        console.log("--- .env ANALYSIS ---");
        content.split('\n').forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('#')) return;

            const equalsIndex = trimmed.indexOf('=');
            if (equalsIndex === -1) {
                console.log(`Line ${idx + 1}: [INVALID] No '=' found: "${trimmed.substring(0, 10)}..."`);
            } else {
                const key = trimmed.substring(0, equalsIndex);
                const hasValue = trimmed.substring(equalsIndex + 1).length > 0;
                console.log(`Line ${idx + 1}: [VALID] Key: "${key}" | Has Value: ${hasValue}`);
            }
        });
        console.log("--- END ANALYSIS ---");
    } else {
        console.log(".env file NOT FOUND at " + envPath);
    }
} catch (e) {
    console.error("Error reading file:", e);
}
