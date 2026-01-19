
import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('--- Debug Script: User Lookup ---');

    // Initialize Firebase Admin
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221";
    console.log('Project ID:', projectId);

    let credential;
    try {
        if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log('FIREBASE_PRIVATE_KEY found in env (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')');
            credential = cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else {
            console.warn('No FIREBASE_PRIVATE_KEY found in env or empty.');
            credential = applicationDefault();
        }

        if (!getApps().length) {
            initializeApp({
                credential,
                projectId,
            });
        }
    } catch (err) {
        console.error("Initialization Error:", err);
        return;
    }

    const db = getFirestore();
    const targetEmail = "chancellor@ichancetek.com";

    try {
        console.log(`\nListing first 5 users to verify connection...`);
        const recentUsers = await db.collection("users").limit(5).get();
        if (recentUsers.empty) {
            console.log("No users found in 'users' collection.");
        } else {
            recentUsers.docs.forEach(d => console.log(`- [${d.id}] ${d.data().email} (${d.data().displayName})`));
        }

        console.log(`\nSearching for user with email: ${targetEmail}`);
        const snapshot = await db.collection("users").where("email", "==", targetEmail).limit(1).get();

        if (snapshot.empty) {
            console.error("User NOT FOUND by email:", targetEmail);
        } else {
            const doc = snapshot.docs[0];
            console.log("User FOUND.");
            console.log("ID:", doc.id);
            console.log("Email:", doc.data().email);

            // Re-verify by ID
            const verifyPath = await db.collection("users").doc(doc.id).get();
            console.log(`Direct lookup by ID (${doc.id}) exists:`, verifyPath.exists);
        }

    } catch (e: any) {
        console.error("Error querying Firestore:", e);
        if (e.code === 7) { // PERMISSION_DENIED
            console.error("Hint: Permission Denied. Check service account roles.");
        }
    }
}

main();
