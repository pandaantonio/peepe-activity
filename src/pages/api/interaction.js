import nacl from "tweetnacl";
import { glob } from "glob";
import { resolve } from "path";

export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(req) {
    const chunks = [];

    for await (const chunk of req) {
        chunks.push(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk
        );
    }

    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    try {
        const rawBody = await getRawBody(req);

        const signature = req.headers["x-signature-ed25519"];
        const timestamp = req.headers["x-signature-timestamp"];

        if (!signature || !timestamp) {
            return res.status(401).send("Missing signature headers");
        }

        const isValid = nacl.sign.detached.verify(
            Buffer.from(timestamp + rawBody.toString("utf8")),
            Buffer.from(signature, "hex"),
            Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
        );

        if (!isValid) {
            return res.status(401).send("Invalid request signature");
        }

        const interaction = JSON.parse(rawBody.toString("utf8"));

        // Ping do Discord
        if (interaction.type === 1) {
            return res.status(200).json({
                type: 1,
            });
        }

        // Slash Commands
        if (interaction.type === 2) {
            const commandName = interaction.data.name;
            const subcommand = interaction.data.options?.[0];

            if (
                commandName === "user" &&
                (subcommand?.name === "avatar" || subcommand?.name === "banner")
            ) {
                const userId = subcommand.options?.find(
                    option => option.name === "user"
                )?.value;

                let user;

                if (userId) {
                    user = interaction.data.resolved?.users?.[userId];
                } else {
                    user = interaction.member?.user || interaction.user;
                }

                // Avatar
                if (subcommand.name === "avatar") {
                    const avatarURL = user.avatar
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=4096`
                        : "https://cdn.discordapp.com/embed/avatars/0.png";

                    return res.status(200).json({
                        type: 4,
                        data: {
                            embeds: [
                                {
                                    title: `Avatar de ${user.username}`,
                                    image: {
                                        url: avatarURL
                                    }
                                }
                            ]
                        }
                    });
                }

                // Banner
                if (subcommand.name === "banner") {
                    const response = await fetch(
                        `https://discord.com/api/v10/users/${user.id}`,
                        {
                            headers: {
                                Authorization: `Bot ${process.env.BOT_TOKEN}`
                            }
                        }
                    );

                    const fullUser = await response.json();

                    if (!fullUser.banner) {
                        return res.status(200).json({
                            type: 4,
                            data: {
                                content: `${user.username} não possui banner.`,
                                flags: 64
                            }
                        });
                    }

                    const extension = fullUser.banner.startsWith("a_")
                        ? "gif"
                        : "png";

                    const bannerURL =
                        `https://cdn.discordapp.com/banners/${user.id}/${fullUser.banner}.${extension}?size=4096`;

                    return res.status(200).json({
                        type: 4,
                        data: {
                            embeds: [
                                {
                                    title: `Banner de ${user.username}`,
                                    image: {
                                        url: bannerURL
                                    }
                                }
                            ]
                        }
                    });
                }
            }

            return res.status(200).json({
                type: 4,
                data: {
                    content: `Comando /${commandName} não encontrado.`,
                    flags: 64,
                },
            });
        }

        return res.status(200).end();
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal Server Error",
        });
    }
}