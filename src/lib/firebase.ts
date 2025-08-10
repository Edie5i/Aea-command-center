
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as admin from 'firebase-admin';

// --- Client-Side Firebase Initialization ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: App;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Admin (Server-Side) Firebase Initialization ---
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount: admin.ServiceAccount;

try {
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }
  serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
} catch (e) {
  console.error("Failed to parse Firebase service account key. Make sure it's a valid base64 encoded JSON.", e);
  // We throw here to prevent the app from starting with a misconfigured admin SDK
  throw new Error("Invalid Firebase service account key.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
