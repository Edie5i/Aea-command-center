
'use client';

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

// Check if the service account key is available in environment variables
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Only initialize admin if it hasn't been initialized yet and the key is available
if (!admin.apps.length && serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(
      // The key is expected to be a Base64 encoded string.
      Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
} else if (process.env.NODE_ENV !== 'production' && !admin.apps.length) {
    // This allows for local development without the base64 encoded key
    // You would typically use a local service account file here.
    console.warn("Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT_KEY is missing. This is expected for client-side rendering, but will fail for server-side actions.");
}


export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
