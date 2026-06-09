// pages/api/guild/[id]/antilink/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;

        if (!guildId) {
            return res.status(400).json({ error: "guildId é obrigatório" });
        }

        // Padrão de dados iniciais do Anti-Link
        const defaultData = {
            enabled: false,
            allowMedia: false,
            allowSocials: false,
            allowedDomains: []
        };

        if (req.method === "GET") {
            const snapshot = await adminDb.ref(`antilink/${guildId}`).once("value");
            const data = snapshot.val() || defaultData;
            
            return res.status(200).json({
                enabled: data.enabled ?? false,
                allowMedia: data.allowMedia ?? false,
                allowSocials: data.allowSocials ?? false,
                allowedDomains: data.allowedDomains || [],
            });
        }

        if (req.method === "POST") {
            const { enabled, allowMedia, allowSocials, allowedDomains } = req.body;

            // Filtra e limpa o array de domínios enviados
            const domainsCleaned = Array.isArray(allowedDomains)
                ? allowedDomains.map(d => d.trim().toLowerCase()).filter(Boolean)
                : [];

            await adminDb.ref(`antilink/${guildId}`).set({
                enabled: !!enabled,
                allowMedia: !!allowMedia,
                allowSocials: !!allowSocials,
                allowedDomains: domainsCleaned,
            });

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Método não permitido" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}