// pages/api/guild/[id]/autorole/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;

        if (!guildId) {
            return res.status(400).json({ error: "guildId é obrigatório" });
        }

        if (req.method === "GET") {
            const snapshot = await adminDb.ref(`autorole/${guildId}`).once("value");
            const data = snapshot.val() || { users: [], apps: [] };
            return res.status(200).json({
                users: data.users || [],
                apps: data.apps || [],
            });
        }

        if (req.method === "POST") {
            const { users, apps } = req.body;

            await adminDb.ref(`autorole/${guildId}`).set({
                users: users || [],
                apps: apps || [],
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Método não permitido" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}