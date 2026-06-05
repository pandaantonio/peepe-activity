export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Método não permitido',
        });
    }

    const { code } = req.body;

    if (!code) {
        return res.status(400).json({
            error: 'Código OAuth2 não informado',
        });
    }

    try {
        const response = await fetch(
            'https://discord.com/api/v10/oauth2/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'OAuth2 falhou',
                details: data.error_description || data.error,
            });
        }

        return res.status(200).json({
            access_token: data.access_token,
        });
    } catch (error) {
        console.error('Erro OAuth2:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor',
        });
    }
}