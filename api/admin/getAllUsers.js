// api/admin/getAllUsers.js
import { db, auth } from '../_firebase-admin.js';

export default async function handler(req, res) {
    console.log("--- DEBUG LOGS for getAllUsers ---");
    try {
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            console.log("STEP 1 FAILED: No Authorization header found.");
            throw new Error('Unauthorized: No token provided.');
        }
        console.log("STEP 1 SUCCESS: Authorization header found.");
        
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        console.log(`STEP 2 SUCCESS: Token verified for UID: ${uid}`);

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            console.log(`STEP 3 FAILED: User with UID ${uid} not found in Firestore.`);
            throw new Error('User not found in Firestore.');
        }
        
        const userData = userDoc.data();
        console.log("STEP 3 SUCCESS: User data found in Firestore:", userData);
        
        const userRole = userData.role || 'user';
        console.log(`STEP 4: Verifying role. User role is '${userRole}'. Required role is 'web_reseller' or higher.`);

        // Pengecekan role
        const roles = ['user', 'reseller', 'web_reseller', 'owner'];
        if (roles.indexOf(userRole) < roles.indexOf('web_reseller')) {
            console.log(`STEP 4 FAILED: Insufficient permissions. Role '${userRole}' is not high enough.`);
            throw new Error('Insufficient permissions.');
        }
        console.log("STEP 4 SUCCESS: User has sufficient permissions.");

        // Jika semua verifikasi lolos, ambil data
        let usersSnapshot;
        if (userData.role === 'owner') {
            usersSnapshot = await db.collection('users').get();
        } else {
            usersSnapshot = await db.collection('users').where('addedBy', '==', uid).get();
        }

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            delete data.email;
            return { id: doc.id, ...data };
        });
        
        console.log("FINAL STEP: Successfully fetched users. Sending response.");
        console.log("---------------------------------");
        res.status(200).json(users);

    } catch (error) {
        console.error("--- ERROR in getAllUsers ---");
        console.error(error);
        console.log("---------------------------------");
        res.status(403).json({ message: error.message });
    }
}
