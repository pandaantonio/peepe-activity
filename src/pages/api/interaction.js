import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

// Configuração necessária para o Next.js/Vercel não alterar o corpo bruto (raw body) da requisição.
// A validação de assinatura falha se o body já tiver sido transformado em objeto.
export const config = {
    api: {
        bodyParser: false,
    },
};

// Função auxiliar para capturar o Buffer bruto da requisição
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
    // Apenas requisições POST são aceitas pelo Discord
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    // 1. VALIDAÇÃO DE SEGURANÇA (Obrigatório para o Discord aceitar sua URL)
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    
    const rawBody = await getRawBody(req);
    const CLIENT_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY; // Configure esta variável no seu ambiente

    if (!signature || !timestamp || !CLIENT_PUBLIC_KEY) {
        return res.status(401).end('Configuração de segurança ausente.');
    }

    const isValidRequest = verifyKey(rawBody, signature, timestamp, CLIENT_PUBLIC_KEY);
    
    if (!isValidRequest) {
        return res.status(401).end('Assinatura inválida.');
    }

    // Convertemos o corpo bruto para objeto JSON após a validação
    const interaction = JSON.parse(rawBody.toString());

    // 2. RESPOSTA AO PING (Validação inicial da URL no Painel do Developer)
    if (interaction.type === InteractionType.PING) {
        return res.json({ type: InteractionResponseType.PONG });
    }

    // 3. TRATAMENTO DOS COMANDOS
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const commandName = interaction.data.name;

        if (commandName === "encode" || commandName === "decode") {
            // Estrutura de subcomandos do Discord: interaction.data.options[0] é o subcomando
            const subcommandGroup = interaction.data.options?.[0];
            
            if (!subcommandGroup) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "❌ Subcomando não fornecido.", flags: 64 }
                });
            }

            const subcommandName = subcommandGroup.name; // morse, binary ou base64
            const options = subcommandGroup.options || [];

            // Extrai as opções passadas de dentro do subcomando
            const textValue = options.find(opt => opt.name === "text")?.value;
            const isEphemeral = options.find(opt => opt.name === "ephemeral")?.value === true;

            if (!textValue) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: { content: "❌ O argumento 'text' é obrigatório.", flags: 64 }
                });
            }

            let resultText = "";

            // Processa a lógica baseada no comando e subcomando
            try {
                if (commandName === "encode") {
                    resultText = handleEncode(subcommandName, textValue);
                } else if (commandName === "decode") {
                    resultText = handleDecode(subcommandName, textValue);
                }
            } catch (error) {
                resultText = `❌ Erro de processamento: ${error.message}`;
            }

            // Retorna o resultado para o Discord
            return res.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: resultText,
                    flags: isEphemeral ? 64 : 0 // 64 torna a mensagem oculta para os outros usuários
                }
            });
        }
    }

    return res.status(400).end();
}

// --- FUNÇÕES AUXILIARES DE CONVERSÃO ---

function handleEncode(type, text) {
    switch (type) {
        case "base64":
            return Buffer.from(text).toString('base64');
            
        case "binary":
            return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            
        case "morse":
            return text.toLowerCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
            
        default:
            throw new Error("Formato de codificação desconhecido.");
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
                throw new Error("Binário inválido (certifique-se de separar os bytes por espaço).");
            }
            
        case "morse":
            return text.split(' ').map(code => REVERSE_MORSE[code] || code).join('');
            
        default:
            throw new Error("Formato de decodificação desconhecido.");
    }
}