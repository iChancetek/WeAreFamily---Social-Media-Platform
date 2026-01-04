import 'server-only';
import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

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
    credential = cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });
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
try {
    if (!getApps().length) {
        app = initializeApp(firebaseAdminConfig);
    } else {
        app = getApp();
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
    // Return a dummy app/db to prevent module crash, subsequent calls will fail but we'll see the log
}

export const adminAuth = app ? getAuth(app) : {} as any;
export const adminDb = app ? getFirestore(app) : {} as any;
export const adminStorage = app ? getStorage(app) : {} as any;
