import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Audio de standby - quando usuario nao responde
const STANDBY_AUDIO_PATH = path.join(process.cwd(), "public", "audio", "jarvis-standby.mp3");
const STANDBY_TEXT = "Estou pronto, te esperando. E so me chamar, senhor.";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";

export async function GET() {
  try {
    // Tentar ler audio cacheado
    try {
      const cachedAudio = await fs.readFile(STANDBY_AUDIO_PATH);
      console.log("📁 Retornando audio de standby cacheado");

      return new NextResponse(cachedAudio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": cachedAudio.byteLength.toString(),
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } catch {
      console.log("🎤 Gerando novo audio de standby...");
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        fallback: true,
        message: "ElevenLabs API Key nao configurada"
      });
    }

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
          text: STANDBY_TEXT,
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
      return NextResponse.json({ fallback: true, message: "Erro na API ElevenLabs" });
    }

    const audioBuffer = await response.arrayBuffer();

    // Salvar em cache
    try {
      const audioDir = path.dirname(STANDBY_AUDIO_PATH);
      await fs.mkdir(audioDir, { recursive: true });
      await fs.writeFile(STANDBY_AUDIO_PATH, Buffer.from(audioBuffer));
      console.log("💾 Audio de standby salvo em cache");
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
    console.error("Standby Audio API Error:", error);
    return NextResponse.json({ fallback: true, message: "Erro ao gerar audio" });
  }
}
