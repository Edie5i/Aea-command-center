
import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  // When running in a Google Cloud environment, the SDK automatically
  // detects the service account credentials and project ID.
  const credential = admin.credential.applicationDefault();
  
  app = admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = admin.app();
}

export const adminApp = app;
