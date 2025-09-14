// api/telegram-webhook.js
import { db } from './_firebase-admin.js';
import { telegramConfig } from '../config.js';

async function promoteToReseller(username) {
    const usersRef = db.collection('users');
    const q = usersRef.where('username', '==', username.toLowerCase());
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        console.error(`User ${username} not found for promotion.`);
        return `Gagal: User ${username} tidak ditemukan.`;
    }
    const userDoc = querySnapshot.docs[0];
    await userDoc.ref.update({ role: 'reseller' });
    return `Sukses! User ${username} sekarang adalah Reseller Panel.`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    try {
        const { callback_query } = req.body;
        if (!callback_query) {
            return res.status(200).send('OK (Bukan callback)');
        }
        const botToken = telegramConfig.botToken;
        const ownerChatId = telegramConfig.chatId;
        const data = callback_query.data;
        const messageId = callback_query.message.message_id;
        const chatId = callback_query.message.chat.id;
        if (String(chatId) !== ownerChatId) {
            console.warn(`Unauthorized callback attempt from chat ID: ${chatId}`);
            return res.status(403).send('Forbidden');
        }
        let responseText = "Aksi tidak diketahui.";
        const [action, username] = data.split(':');
        if (action === 'approve_reseller') {
            responseText = await promoteToReseller(username);
        } else if (action === 'reject_reseller') {
            responseText = `Permintaan untuk ${username} telah ditolak.`;
        }
        const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: `${callback_query.message.text}\n\n--- *[Dikonfirmasi oleh Owner: ${responseText}]* ---`,
                parse_mode: 'Markdown'
            })
        });
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
}