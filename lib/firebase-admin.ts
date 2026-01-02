import 'server-only';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
// In production (App Hosting), applicationDefault() is used automatically if no credential is provided
// For local development, you might need a service account key, but for now we rely on default env or limited local emulation if set up.
// Note: If running locally without GOOGLE_APPLICATION_CREDENTIALS, this might fail unless we mock it or provide a key.
// However, since the user is deploying, this is the correct path.

const firebaseAdminConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "we-are-family-221.firebasestorage.app",
};

export function getAdminApp() {
    if (getApps().length === 0) {
        return initializeApp(firebaseAdminConfig);
    }
    return getApp();
}

const adminApp = getAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
