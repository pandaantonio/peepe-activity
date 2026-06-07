export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            error: "User ID é obrigatório."
        });
    }

    try {
        const response = await fetch(
            `https://discord.com/api/v10/users/${id}`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Usuário não encontrado."
            });
        }

        const user = await response.json();

        const avatar = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=4096`
            : null;

        const banner = user.banner
            ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=4096`
            : null;

        return res.status(200).json({
            id: user.id,
            username: user.username,
            global_name: user.global_name,
            avatar,
            banner
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
}