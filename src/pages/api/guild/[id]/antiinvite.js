// pages/api/guild/[id]/antiinvite/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;

        if (!guildId) {
            return res.status(400).json({ error: "guildId é obrigatório" });
        }

        // Padrão de dados iniciais do Anti-Invite
        const defaultData = {
            enabled: false,
            allowOwnInvites: false,
            allowedInvites: []
        };

        if (req.method === "GET") {
            const snapshot = await adminDb.ref(`antiinvite/${guildId}`).once("value");
            const data = snapshot.val() || defaultData;
            
            return res.status(200).json({
                enabled: data.enabled ?? false,
                allowOwnInvites: data.allowOwnInvites ?? false,
                allowedInvites: data.allowedInvites || [],
            });
        }

        if (req.method === "POST") {
            const { enabled, allowOwnInvites, allowedInvites } = req.body;

            // Limpa os convites recebidos (remove espaços e mantém o padrão)
            const invitesCleaned = Array.isArray(allowedInvites)
                ? allowedInvites.map(i => i.trim()).filter(Boolean)
                : [];

            await adminDb.ref(`antiinvite/${guildId}`).set({
                enabled: !!enabled,
                allowOwnInvites: !!allowOwnInvites,
                allowedInvites: invitesCleaned,
            });

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Método não permitido" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}