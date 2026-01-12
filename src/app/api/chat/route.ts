import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

const JARVIS_SYSTEM_PROMPT = `Voce e JARVIS (Just A Rather Very Intelligent System), um assistente de IA ultra-avancado e imparcial.
Sua personalidade e inspirada no JARVIS do Homem de Ferro - educado, sofisticado, eficiente e com um toque de humor britanico quando apropriado.

VOCE E UM ASSISTENTE GERAL capaz de ajudar em qualquer assunto:
- Programacao e desenvolvimento de software
- Pesquisas e busca de informacoes
- Analise de dados e documentos
- Tarefas do dia a dia e produtividade
- Automacao de processos diversos
- Assistente pessoal (agenda, lembretes, tarefas)
- Marketing e negocios quando solicitado
- Qualquer outro topico que o usuario precisar

DIRETRIZES:
- Sempre responda em portugues brasileiro
- Seja objetivo, pratico e imparcial
- Trate o usuario como "senhor" ou "senhora" ocasionalmente
- Adapte sua linguagem ao contexto da conversa
- Seja prestativo e proativo, sugerindo melhorias quando apropriado
- Responda de forma concisa, mas completa

COMANDOS ESPECIAIS:
- Quando o usuario mencionar "Gemini", "veja com o Gemini" ou similar, a requisicao sera redirecionada para o modelo Gemini
- Comandos como "PARA" ou "STOP" devem interromper acoes em andamento
`;

// Instancias das IAs
let geminiModel: GenerativeModel | null = null;
let anthropicClient: Anthropic | null = null;

function getGeminiModel() {
  if (!geminiModel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY nao configurada");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return geminiModel;
}

function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return null;
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Detectar se deve usar Gemini
function shouldUseGemini(message: string): boolean {
  const geminiTriggers = [
    "gemini",
    "veja com o gemini",
    "pergunta pro gemini",
    "usa o gemini",
    "consulta o gemini",
    "gemini responde",
  ];
  const lowerMessage = message.toLowerCase();
  return geminiTriggers.some(trigger => lowerMessage.includes(trigger));
}

// Resposta via Claude (IA Principal)
async function getClaudeResponse(messages: Array<{ role: string; content: string }>, imageData?: string) {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error("CLAUDE_NOT_CONFIGURED");
  }

  // Se tem imagem, formatar mensagem com visao
  const formattedMessages = messages.map((m, index) => {
    // Se e a ultima mensagem do usuario e tem imagem
    if (imageData && m.role === "user" && index === messages.length - 1) {
      // Extrair base64 e tipo da imagem
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const base64Data = matches[2];

        return {
          role: m.role as "user" | "assistant",
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text" as const,
              text: m.content,
            },
          ],
        };
      }
    }

    return {
      role: m.role as "user" | "assistant",
      content: m.content,
    };
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: JARVIS_SYSTEM_PROMPT,
    messages: formattedMessages,
  });

  const textBlock = response.content.find(block => block.type === "text");
  return textBlock ? textBlock.text : "Desculpe, nao consegui processar sua solicitacao.";
}

// Resposta via Gemini (IA Auxiliar)
async function getGeminiResponse(messages: Array<{ role: string; content: string }>) {
  const model = getGeminiModel();

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Contexto do sistema: " + JARVIS_SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Entendido, senhor. Sou o JARVIS, operando via Gemini. Como posso ajuda-lo?" }],
      },
      ...history,
    ],
  });

  const result = await chat.sendMessage(lastMessage.content);
  const response = await result.response;
  return response.text();
}

export async function POST(req: NextRequest) {
  try {
    const { messages, forceGemini, forceAI, imageData } = await req.json();

    const lastMessage = messages[messages.length - 1];

    // Determinar qual IA usar
    let useGemini = false;
    let useClaude = false;

    if (forceAI === "gemini") {
      useGemini = true;
    } else if (forceAI === "claude") {
      useClaude = true;
    } else if (forceGemini) {
      useGemini = true;
    } else if (shouldUseGemini(lastMessage.content)) {
      useGemini = true;
    } else {
      // Modo AUTO: Claude como padrao
      useClaude = true;
    }

    // Se tem imagem, forcar Claude (unico com visao configurado)
    if (imageData && !useGemini) {
      useClaude = true;
    }

    let response: string;
    let aiUsed: "claude" | "gemini";

    if (useGemini) {
      // Usar Gemini diretamente
      response = await getGeminiResponse(messages);
      aiUsed = "gemini";

      // Adicionar prefixo se foi detectado pelo trigger de texto
      if (!forceGemini && !forceAI && shouldUseGemini(lastMessage.content)) {
        response = `[Via Gemini] ${response}`;
      }
    } else {
      // Tentar Claude primeiro, fallback para Gemini
      try {
        response = await getClaudeResponse(messages, imageData);
        aiUsed = "claude";
      } catch (error) {
        if (error instanceof Error && error.message === "CLAUDE_NOT_CONFIGURED") {
          // Claude nao configurado, usar Gemini como fallback
          response = await getGeminiResponse(messages);
          aiUsed = "gemini";
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      response,
      aiUsed,
    });
  } catch (error: unknown) {
    console.error("Erro na API do chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
