// api/_firebase-admin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log("--- [ADMIN SDK] Trying to initialize ---");

// Inisialisasi Firebase Admin hanya sekali
if (!admin.apps.length) {
  try {
    console.log("[ADMIN SDK] No existing app, creating new one.");
    const serviceAccountPath = resolve(process.cwd(), 'serviceAccountKey.json');
    console.log(`[ADMIN SDK] Looking for service account key at: ${serviceAccountPath}`);

    // Cek apakah file ada sebelum dibaca
    try {
        readFileSync(serviceAccountPath, 'utf8');
        console.log("[ADMIN SDK] serviceAccountKey.json found!");
    } catch (fileError) {
        console.error("[ADMIN SDK] CRITICAL ERROR: serviceAccountKey.json NOT FOUND at the specified path.", fileError);
        throw new Error("serviceAccountKey.json not found in project root.");
    }
    
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log(`[ADMIN SDK] Service account JSON parsed successfully for project: ${serviceAccount.project_id}`);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("[ADMIN SDK] Firebase Admin App initialized successfully!");

  } catch (error) {
    console.error('[ADMIN SDK] FINAL INITIALIZATION FAILED:', error.stack);
  }
} else {
    console.log("[ADMIN SDK] App already initialized.");
}

const db = admin.firestore();
const auth = admin.auth();

export async function verifyUser(req, requiredRole = 'user') {
    // ... sisa kodenya tetap sama ...
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new Error('Unauthorized: No token provided.');
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new Error('User not found in Firestore.');
    }
    const userData = userDoc.data();
    if (userData.banned) {
        throw new Error('User is banned.');
    }
    const userRole = userData.role || 'user';
    const roles = ['user', 'reseller', 'web_reseller', 'owner'];
    if (roles.indexOf(userRole) < roles.indexOf(requiredRole)) {
        throw new Error('Insufficient permissions.');
    }
    return { uid, userDoc, userData };
}

export { db, auth };
