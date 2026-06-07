import nacl from "tweetnacl";

export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(req) {
    const chunks = [];

    for await (const chunk of req) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    const rawBody = await getRawBody(req);

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    const isValid = nacl.sign.detached.verify(
        Buffer.from(timestamp + rawBody.toString()),
        Buffer.from(signature, "hex"),
        Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
    );

    if (!isValid) {
        return res.status(401).send("invalid request signature");
    }

    const interaction = JSON.parse(rawBody.toString());

    if (interaction.type === 1) {
        return res.json({ type: 1 });
    }

    if (interaction.type === 2) {
        return res.json({
            type: 4,
            data: {
                content: "Teste"
            }
        });
    }
}