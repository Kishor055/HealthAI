import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK for server-side operations.
 * This handles session cookie creation and token verification.
 * Updated with a resilience wrapper to prevent crashes in partially configured environments.
 */
function ensureAdminInitialized(): boolean {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        return true;
      } else {
        console.warn('Firebase Admin Node: Missing credentials. Server-side session sync will be limited.');
        return false;
      }
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return false;
    }
  }
  return true;
}

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const initialized = ensureAdminInitialized();
    if (!initialized || !admin.apps.length) {
      if (prop === 'createSessionCookie') {
        return async () => {
          throw new Error('Firebase Admin SDK is not initialized with credentials.');
        };
      }
      throw new Error('Firebase Admin SDK is not initialized with credentials.');
    }
    const authInstance = admin.auth();
    const value = (authInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(authInstance);
    }
    return value;
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const initialized = ensureAdminInitialized();
    if (!initialized || !admin.apps.length) {
      throw new Error('Firebase Admin SDK is not initialized with credentials.');
    }
    const dbInstance = admin.firestore();
    const value = (dbInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    return value;
  },
});
