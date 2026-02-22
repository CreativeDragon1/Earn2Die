import admin from 'firebase-admin';

// Initialise Firebase Admin SDK once using env vars (populated from GitHub secrets in CI/CD)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // GitHub secret stores the key with literal \n — convert back to real newlines
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

export default admin;
