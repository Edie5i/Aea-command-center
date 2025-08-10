
import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  if (serviceAccountKey) {
     try {
        const serviceAccount = JSON.parse(
            Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
        );
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
     } catch (error) {
        console.error('Error initializing Firebase Admin SDK from service account key:', error);
     }
  } else {
    // This will use Application Default Credentials on App Hosting.
    admin.initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
