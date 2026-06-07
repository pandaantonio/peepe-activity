export default async function handler(req, res) {
    const interaction = req.body;

    // Ping do Discord
    if (interaction.type === 1) {
        return res.status(200).json({ type: 1 });
    }

    // Slash Command
    if (interaction.type === 2) {
        const commandName = interaction.data.name;

        if (commandName === "user") {
            return res.status(200).json({
                type: 4,
                data: {
                    content: "Teste"
                }
            });
        }
    }

    return res.status(400).end();
}