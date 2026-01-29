import 'server-only';
export const dynamic = 'force-dynamic';

import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin
let credential;

// 1. Try Local Secrets (Dev)
if (process.env.NODE_ENV === 'development') {
    try {
        const secrets = require('./firebase-secrets');
        if (secrets.SERVICE_ACCOUNT) {
            credential = cert(secrets.SERVICE_ACCOUNT);
        }
    } catch (e) {
        // Ignore
    }
}

// 2. Try Environment Variables (Manual CI/Vercel)
if (!credential && process.env.FIREBASE_PRIVATE_KEY) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '');
        credential = cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        });
    } catch (e) {
        console.warn("Failed to parse FIREBASE_PRIVATE_KEY from env. Falling back to default credentials.", e);
    }
}

// 3. Fallback to Default Credentials (Google Cloud / App Hosting)
if (!credential) {
    credential = applicationDefault();
}

const firebaseAdminConfig = {
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "we-are-family-221.firebasestorage.app",
};

let app;
let adminAuth: any;
let adminDb: any;
let adminStorage: any;
let adminMessaging: any;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseAdminConfig);
    } else {
        app = getApp();
    }

    // Initialize services ONLY if app exists
    if (app) {
        adminAuth = getAuth(app);
        adminDb = getFirestore(app);
        adminStorage = getStorage(app);
        adminMessaging = getMessaging(app);
    }
} catch (error) {
    console.error("Firebase Admin Initialization Check Failed.");
    console.error("Critical Error: Firebase Admin could not be initialized.", error);
    // Do not throw, but exports will be undefined/null.
    // Downstream code MUST check if adminDb is defined.
}

export { adminAuth, adminDb, adminStorage, adminMessaging };
