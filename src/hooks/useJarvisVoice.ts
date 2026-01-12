"use client";

import { useState, useCallback, useRef } from "react";

interface UseJarvisVoiceReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  voiceType: "elevenlabs" | "browser" | "none";
}

export function useJarvisVoice(): UseJarvisVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceType, setVoiceType] = useState<"elevenlabs" | "browser" | "none">("none");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopBrowserSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Web Speech API nao suportada");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configurar para voz masculina em portugues
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1.0;

    // Tentar encontrar uma voz masculina
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(
      (voice) =>
        voice.lang.includes("pt") &&
        (voice.name.toLowerCase().includes("male") ||
          voice.name.toLowerCase().includes("daniel") ||
          voice.name.toLowerCase().includes("luciano"))
    ) || voices.find((voice) => voice.lang.includes("pt-BR")) ||
    voices.find((voice) => voice.lang.includes("pt"));

    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceType("browser");
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    stopBrowserSpeech();

    try {
      // Tentar usar ElevenLabs primeiro
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("audio/mpeg")) {
        // ElevenLabs funcionou - tocar o audio
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setVoiceType("elevenlabs");
        };
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          // Fallback para browser em caso de erro
          speakWithBrowser(text);
        };

        await audio.play();
      } else {
        // Fallback para Web Speech API
        speakWithBrowser(text);
      }
    } catch (error) {
      console.error("Erro ao falar:", error);
      // Fallback para Web Speech API
      speakWithBrowser(text);
    } finally {
      setIsLoading(false);
    }
  }, [stopBrowserSpeech, speakWithBrowser]);

  const stop = useCallback(() => {
    stopBrowserSpeech();
    setIsLoading(false);
  }, [stopBrowserSpeech]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    voiceType,
  };
}
