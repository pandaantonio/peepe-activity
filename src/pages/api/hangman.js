import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ,
});

const fallbackWords = [
    { word: "codigo", hint: "Conjunto de instrucoes escritas por um programador." },
    { word: "servidor", hint: "Computador que fornece servicos para outros dispositivos." },
    { word: "console", hint: "Local onde aparecem mensagens e logs." },
    { word: "pixel", hint: "Menor unidade de uma imagem digital." },
    { word: "kernel", hint: "Nucleo de um sistema operacional." }
];

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Metodo nao permitido"
        });
    }

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            response_format: {
                type: "json_object"
            },
            temperature: 1,
            max_tokens: 100,
            messages: [
                {
                    role: "system",
                    content: `
Gere uma palavra para um jogo da forca.

Retorne SOMENTE JSON valido:

{
  "word": "codigo",
  "hint": "Conjunto de instrucoes escritas por um programador."
}

Regras:
- Palavra em portugues.
- Entre 5 e 10 letras.
- Apenas letras minusculas.
- Sem acentos.
- Sem espacos.
- Relacionada a qualquer coisa.
- Nenhum texto fora do JSON.
`
                }
            ]
        });

        const content = completion.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Resposta vazia");
        }

        const data = JSON.parse(content);

        const word = String(data.word || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z]/g, "");

        const hint = String(data.hint || "").trim();

        if (
            word.length < 5 ||
            word.length > 10 ||
            !hint
        ) {
            throw new Error("Resposta invalida");
        }

        return res.status(200).json({
            word,
            hint
        });

    } catch (error) {
        console.error("Hangman Error:", error);

        const fallback =
            fallbackWords[Math.floor(Math.random() * fallbackWords.length)];

        return res.status(200).json({
            ...fallback,
            fallback: true
        });
    }
}