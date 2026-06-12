export default async function handler(req, res) {
    // 1. Validação do tipo de Interação (PING do Discord)
    const interaction = req.body;
    if (interaction.type === 1) {
        return res.json({ type: 1 });
    }

    // Aceita apenas Application Commands (type 2)
    if (interaction.type !== 2) {
        return res.status(400).end();
    }

    const commandName = interaction.data.name;

    // Verificar se é um dos seus comandos principais
    if (commandName !== "encode" && commandName !== "decode") {
        return res.status(400).json({ error: "Comando não reconhecido." });
    }

    // 2. Extrair o Subcomando (morse, binary, base64)
    const subcommandGroup = interaction.data.options?.[0];
    if (!subcommandGroup) {
        return res.status(400).json({ error: "Subcomando ausente." });
    }
    
    const subcommandName = subcommandGroup.name; // 'morse', 'binary' ou 'base64'

    // 3. Extrair as Opções de dentro do Subcomando (text, ephemeral)
    const options = subcommandGroup.options || [];
    
    // Busca os valores passados pelo usuário
    const textValue = options.find(opt => opt.name === "text")?.value;
    const isEphemeral = options.find(opt => opt.name === "ephemeral")?.value === true;

    if (!textValue) {
        return res.status(400).json({ error: "O texto é obrigatório." });
    }

    // 4. Processamento da Lógica
    let resultText = "";

    try {
        if (commandName === "encode") {
            resultText = handleEncode(subcommandName, textValue);
        } else if (commandName === "decode") {
            resultText = handleDecode(subcommandName, textValue);
        }
    } catch (error) {
        resultText = `❌ Erro ao processar: ${error.message}`;
    }

    // 5. Responder ao Discord
    return res.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
            content: resultText,
            // 64 é a flag para mensagens efêmeras (visíveis apenas para o autor)
            flags: isEphemeral ? 64 : 0 
        }
    });
}

// --- Funções Auxiliares de Conversão ---

function handleEncode(type, text) {
    switch (type) {
        case "base64":
            return Buffer.from(text).toString('base64');
        case "binary":
            return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        case "morse":
            return convertToMorse(text);
        default:
            throw new Error("Formato inválido");
    }
}

function handleDecode(type, text) {
    switch (type) {
        case "base64":
            return Buffer.from(text, 'base64').toString('utf-8');
        case "binary":
            return text.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
        case "morse":
            return convertFromMorse(text);
        default:
            throw new Error("Formato inválido");
    }
}

// Implementações simples de Morse para exemplo
const MORSE_CODE = { 'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/' };
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_CODE).map(([k, v]) => [v, k]));

function convertToMorse(text) {
    return text.toLowerCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
}

function convertFromMorse(text) {
    return text.split(' ').map(code => REVERSE_MORSE[code] || code).join('');
}