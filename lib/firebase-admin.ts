import 'server-only';
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
// In App Hosting, applicationDefault() will automatically find the credentials.
const firebaseAdminConfig = {
    credential: applicationDefault(),
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
