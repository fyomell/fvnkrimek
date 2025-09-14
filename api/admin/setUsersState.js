// api/admin/setUserState.js
import { db, auth, verifyUser } from '../_firebase-admin.js';
import { telegramConfig } from '../../config.js';

async function sendTelegramNotification(requesterUsername, targetUsername) {
    const botToken = telegramConfig.botToken;
    const chatId = telegramConfig.chatId;
    if (!botToken || !chatId || botToken === "TOKEN_BOT_TELEGRAM_KAMU") {
        console.error("Telegram credentials are not set correctly in config.js.");
        throw new Error("Konfigurasi notifikasi tidak lengkap atau belum diisi.");
    }
    const message = `Konfirmasi Aksi:\n\nReseller Web **${requesterUsername}** ingin mengangkat **${targetUsername}** menjadi **Reseller Panel**.\n\nSetujui?`;
    const callbackDataApprove = `approve_reseller:${targetUsername}`;
    const callbackDataReject = `reject_reseller:${targetUsername}`;
    const keyboard = {
        inline_keyboard: [
            [{ text: "✅ Konfirmasi", callback_data: callbackDataApprove }, { text: "❌ Tolak", callback_data: callbackDataReject }]
        ]
    };
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId, text: message, reply_markup: keyboard, parse_mode: 'Markdown'
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Telegram API error:", errorData);
        throw new Error("Gagal mengirim notifikasi ke Telegram.");
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    try {
        const { userData } = await verifyUser(req, 'web_reseller');
        const requesterRole = userData.role;
        const requesterUsername = userData.username;
        const { username, role, banned } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required.' });
        }
        if (requesterRole === 'web_reseller') {
            if (role === 'reseller') {
                await sendTelegramNotification(requesterUsername, username);
                return res.status(200).json({ message: `Permintaan untuk menjadikan ${username} Reseller Panel telah dikirim ke Owner untuk konfirmasi.` });
            } else if (role === 'user') {
                 const usersRef = db.collection('users');
                 const q = usersRef.where('username', '==', username.toLowerCase());
                 const querySnapshot = await q.get();
                 if (querySnapshot.empty) {
                     return res.status(404).json({ message: `User '${username}' not found.` });
                 }
                 const userDoc = querySnapshot.docs[0];
                 await userDoc.ref.update({ role: 'user' });
                 return res.status(200).json({ message: `User ${username} berhasil diubah menjadi User.` });
            } else {
                return res.status(403).json({ message: 'Anda tidak memiliki izin untuk aksi ini.' });
            }
        }
        const usersRef = db.collection('users');
        const q = usersRef.where('username', '==', username.toLowerCase());
        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            return res.status(404).json({ message: `User '${username}' not found.` });
        }
        const userDoc = querySnapshot.docs[0];
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (banned !== undefined) {
             updateData.banned = banned;
             await auth.updateUser(userDoc.id, { disabled: banned });
        }
        if (Object.keys(updateData).length > 0) {
            await userDoc.ref.update(updateData);
        }
        res.status(200).json({ message: `User ${username} has been updated successfully by Owner.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}