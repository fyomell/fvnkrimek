// api/admin/getAllUsers.js
import { db, verifyUser } from '../_firebase-admin.js';

export default async function handler(req, res) {
    try {
        // Owner dan web_reseller bisa akses
        const { userData } = await verifyUser(req, 'web_reseller');
        
        let usersSnapshot;
        // Owner melihat semua, web_reseller melihat yang dia tambahkan
        if (userData.role === 'owner') {
            usersSnapshot = await db.collection('users').get();
        } else {
            usersSnapshot = await db.collection('users').where('addedBy', '==', userData.uid).get();
        }

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            delete data.email;
            return { id: doc.id, ...data };
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}