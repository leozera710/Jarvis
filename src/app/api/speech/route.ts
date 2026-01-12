import { NextRequest, NextResponse } from "next/server";

// Voz do JARVIS - usar uma voz masculina britanica
// Vozes recomendadas: "Daniel" (britanico), "Adam" (profundo), "Antoni" (jovem)
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel como fallback

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Texto nao fornecido" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      // Fallback para Web Speech API se nao tiver ElevenLabs configurado
      return NextResponse.json({
        fallback: true,
        message: "ElevenLabs API Key nao configurada. Usando voz do navegador."
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
          text: text,
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
        message: "Erro na API ElevenLabs. Usando voz do navegador."
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Speech API Error:", error);
    return NextResponse.json({
      fallback: true,
      message: "Erro ao gerar audio. Usando voz do navegador."
    });
  }
}
