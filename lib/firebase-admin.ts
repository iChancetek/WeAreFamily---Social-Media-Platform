import 'server-only';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
// Initialize Firebase Admin
let SERVICE_ACCOUNT: any;

try {
    // Attempt to load local secrets for development
    // Using explicit condition to help bundlers ignore this in production
    if (process.env.NODE_ENV === 'development') {
        const secrets = require('./firebase-secrets');
        SERVICE_ACCOUNT = secrets.SERVICE_ACCOUNT;
    }
} catch (e) {
    // Ignore missing secrets in dev or prod fallback
}

if (!SERVICE_ACCOUNT) {
    // Fallback to Environment Variables for Production (Vercel/CI)
    SERVICE_ACCOUNT = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "we-are-family-221",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
}

const firebaseAdminConfig = {
    credential: cert(SERVICE_ACCOUNT),
    projectId: SERVICE_ACCOUNT.projectId,
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
