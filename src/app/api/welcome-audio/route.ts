import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Caminho para o audio de boas-vindas cacheado
const WELCOME_AUDIO_PATH = path.join(process.cwd(), "public", "audio", "jarvis-welcome.mp3");
const WELCOME_TEXT = "Ola Senhor, sou o Jarvis, em que posso te ajudar?";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";

// GET - Retorna audio cacheado ou gera novo
export async function GET() {
  try {
    // Tentar ler audio cacheado
    try {
      const cachedAudio = await fs.readFile(WELCOME_AUDIO_PATH);
      console.log("📁 Retornando audio de boas-vindas cacheado");

      return new NextResponse(cachedAudio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": cachedAudio.byteLength.toString(),
          "Cache-Control": "public, max-age=31536000", // Cache por 1 ano
        },
      });
    } catch {
      // Arquivo nao existe, gerar novo
      console.log("🎤 Gerando novo audio de boas-vindas...");
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        fallback: true,
        message: "ElevenLabs API Key nao configurada"
      });
    }

    // Gerar audio via ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: WELCOME_TEXT,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs Error:", errorText);
      return NextResponse.json({
        fallback: true,
        message: "Erro na API ElevenLabs"
      });
    }

    const audioBuffer = await response.arrayBuffer();

    // Salvar em cache para proximas requisicoes
    try {
      const audioDir = path.dirname(WELCOME_AUDIO_PATH);
      await fs.mkdir(audioDir, { recursive: true });
      await fs.writeFile(WELCOME_AUDIO_PATH, Buffer.from(audioBuffer));
      console.log("💾 Audio de boas-vindas salvo em cache");
    } catch (saveError) {
      console.error("Erro ao salvar cache:", saveError);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Welcome Audio API Error:", error);
    return NextResponse.json({
      fallback: true,
      message: "Erro ao gerar audio de boas-vindas"
    });
  }
}

// POST - Forcar regeneracao do audio
export async function POST() {
  try {
    // Deletar cache existente
    try {
      await fs.unlink(WELCOME_AUDIO_PATH);
      console.log("🗑️ Cache de audio removido");
    } catch {
      // Arquivo nao existia
    }

    // Chamar GET para gerar novo
    const getResponse = await GET();
    return getResponse;
  } catch (error) {
    console.error("Erro ao regenerar audio:", error);
    return NextResponse.json({ error: "Erro ao regenerar audio" }, { status: 500 });
  }
}
