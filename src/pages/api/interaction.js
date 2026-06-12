import { InteractionType, InteractionResponseType } from 'discord-interactions';
import nacl from 'tweetnacl';

// Força o Next.js (Pages Router) a não mexer no Body da requisição
export const config = {
    api: {
        bodyParser: false,
    },
};

// Transforma o fluxo de entrada da requisição em um Buffer de bytes puros
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

// Dicionários para o Código Morse
const MORSE_CODE = { 
    'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 
    'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 
    'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 
    'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', 
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/' 
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_CODE).map(([k, v]) => [v, k]));

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    // 1. CAPTURA DOS CABEÇALHOS DE SEGURANÇA
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    
    // Captura o corpo da mensagem exatamente como o Discord enviou (em bytes)
    const rawBody = await getRawBody(req);
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp || !PUBLIC_KEY) {
        return res.status(401).send('Configurações de segurança ausentes ou incompletas.');
    }

    // 2. VALIDAÇÃO DA ASSINATURA CRIPTOGRÁFICA (O que faz o Discord aceitar a URL)
    let isVerified = false;
    try {
        isVerified = nacl.sign.detached.verify(
            Buffer.concat([Buffer.from(timestamp), rawBody]),
            Buffer.from(signature, 'hex'),
            Buffer.from(PUBLIC_KEY, 'hex')
        );
    } catch (e) {
        isVerified = false;
    }

    if (!isVerified) {
        return res.status(401).send('Assinatura digital inválida.');
    }

    // Agora que foi verificado, transformamos o texto bruto em um objeto JavaScript
    const interaction = JSON.parse(rawBody.toString('utf-8'));

    // 3. SE FOR UM PING, RESPONDE PONG IMEDIATAMENTE
    if (interaction.type === InteractionType.PING) {
        return res.status(200).json({ type: InteractionResponseType.PONG });
    }

    // 4. PROCESSAMENTO DOS SLASH COMMANDS (/encode e /decode)
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const commandName = interaction.data.name;

        if (commandName === "encode" || commandName === "decode") {
            // Acessa as opções do subcomando (morse, binary, base64)
            const subcommandGroup = interaction.data.options?.[0];
            
            if (!subcommandGroup) {
                return res.status(200).json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "❌ Subcomando inválido.", flags: 64 }
                });
            }

            const subcommandName = subcommandGroup.name; 
            const options = subcommandGroup.options || [];

            // Pega os parâmetros passados pelo usuário dentro do subcomando
            const textValue = options.find(opt => opt.name === "text")?.value;
            const isEphemeral = options.find(opt => opt.name === "ephemeral")?.value === true;

            if (!textValue) {
                return res.status(200).json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "❌ Você precisa fornecer um texto.", flags: 64 }
                });
            }

            let resultText = "";

            try {
                if (commandName === "encode") {
                    resultText = handleEncode(subcommandName, textValue);
                } else if (commandName === "decode") {
                    resultText = handleDecode(subcommandName, textValue);
                }
            } catch (error) {
                resultText = `❌ Erro: ${error.message}`;
            }

            // Envia a resposta final para o chat do Discord
            return res.status(200).json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `\`\`\`${resultText}\`\`\``,
                    flags: isEphemeral ? 64 : 0
                }
            });
        }
    }

    return res.status(400).end();
}

// --- FUNÇÕES DE CONVERSÃO ---

function handleEncode(type, text) {
    switch (type) {
        case "base64":
            return Buffer.from(text).toString('base64');
        case "binary":
            return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        case "morse":
            return text.toLowerCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
        default:
            throw new Error("Formato inválido.");
    }
}

function handleDecode(type, text) {
    switch (type) {
        case "base64":
            try {
                return Buffer.from(text, 'base64').toString('utf-8');
            } catch {
                throw new Error("Base64 inválido.");
            }
        case "binary":
            try {
                return text.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
            } catch {
                throw new Error("Binário inválido (separe por espaços).");
            }
        case "morse":
            return text.split(' ').map(code => REVERSE_MORSE[code] || code).join('');
        default:
            throw new Error("Formato inválido.");
    }
}