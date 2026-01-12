"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Tipos para Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [0]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type ListeningMode = "idle" | "wake_word" | "command";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isWakeWordActive: boolean;
  mode: ListeningMode;
  transcript: string;
  command: string;
  startListening: () => void;
  stopListening: () => void;
  startWakeWordDetection: () => void;
  stopWakeWordDetection: () => void;
  isSupported: boolean;
}

// Wake words aceitas (variações)
const WAKE_WORDS = [
  "jarvis",
  "jarvice",
  "jarves",
  "hey jarvis",
  "ei jarvis",
  "oi jarvis",
  "ok jarvis",
  "ô jarvis",
  "o jarvis",
];

function containsWakeWord(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return WAKE_WORDS.some(word => normalized.includes(word));
}

// Extrair comando após wake word
function extractCommand(text: string): string {
  const normalized = text.toLowerCase();
  for (const word of WAKE_WORDS) {
    const index = normalized.indexOf(word);
    if (index !== -1) {
      return text.substring(index + word.length).trim();
    }
  }
  return text.trim();
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [mode, setMode] = useState<ListeningMode>("idle");
  const [transcript, setTranscript] = useState("");
  const [command, setCommand] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isWakeWordActiveRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Callback para quando wake word é detectada
  const onWakeWordDetected = useCallback(() => {
    console.log("🎯 Wake word detectada! Modo comando ativado.");
    setMode("command");
    setTranscript("");

    // Timeout de 10 segundos para receber comando
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    commandTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Timeout do comando. Voltando para wake word.");
      if (isWakeWordActiveRef.current) {
        setMode("wake_word");
        setTranscript("");
      }
    }, 10000);
  }, []);

  // Callback para quando comando é recebido
  const onCommandReceived = useCallback((cmd: string) => {
    console.log("📝 Comando recebido:", cmd);
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    setCommand(cmd);

    // Volta para modo wake word após processar
    setTimeout(() => {
      if (isWakeWordActiveRef.current) {
        setMode("wake_word");
        setTranscript("");
      }
    }, 500);
  }, []);

  // Inicializar reconhecimento
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "pt-BR";

        recog.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentTranscript = finalTranscript || interimTranscript;
          setTranscript(currentTranscript);

          // Modo wake word - procurar por "Jarvis"
          if (isWakeWordActiveRef.current && mode === "wake_word") {
            if (containsWakeWord(currentTranscript)) {
              const remainingCommand = extractCommand(currentTranscript);
              if (remainingCommand && finalTranscript) {
                // Já tem comando junto com wake word
                onCommandReceived(remainingCommand);
              } else {
                // Só wake word, esperar comando
                onWakeWordDetected();
              }
            }
          }

          // Modo comando - capturar o que foi dito
          if (mode === "command" && finalTranscript) {
            onCommandReceived(finalTranscript);
          }
        };

        recog.onend = () => {
          console.log("🔇 Reconhecimento encerrado");
          // Reiniciar automaticamente se wake word estiver ativo
          if (isWakeWordActiveRef.current && shouldRestartRef.current) {
            console.log("🔄 Reiniciando reconhecimento...");
            setTimeout(() => {
              try {
                recog.start();
              } catch (e) {
                console.error("Erro ao reiniciar:", e);
              }
            }, 100);
          } else {
            setMode("idle");
          }
        };

        recog.onerror = (event: Event) => {
          console.error("Erro no reconhecimento:", event);
          // Tentar reiniciar em caso de erro não fatal
          if (isWakeWordActiveRef.current) {
            setTimeout(() => {
              try {
                recog.start();
              } catch (e) {
                console.error("Erro ao reiniciar após erro:", e);
              }
            }, 1000);
          }
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [mode, onWakeWordDetected, onCommandReceived]);

  // Iniciar detecção de wake word
  const startWakeWordDetection = useCallback(() => {
    if (recognitionRef.current && !isWakeWordActiveRef.current) {
      console.log("🎤 Iniciando detecção de wake word...");
      isWakeWordActiveRef.current = true;
      shouldRestartRef.current = true;
      setMode("wake_word");
      setTranscript("");
      setCommand("");

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Erro ao iniciar:", e);
      }
    }
  }, []);

  // Parar detecção de wake word
  const stopWakeWordDetection = useCallback(() => {
    console.log("🛑 Parando detecção de wake word...");
    isWakeWordActiveRef.current = false;
    shouldRestartRef.current = false;
    setMode("idle");

    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Erro ao parar:", e);
      }
    }
  }, []);

  // Iniciar escuta manual (sem wake word)
  const startListening = useCallback(() => {
    if (recognitionRef.current && mode === "idle") {
      setMode("command");
      setTranscript("");
      shouldRestartRef.current = false;

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Erro ao iniciar escuta:", e);
      }
    }
  }, [mode]);

  // Parar escuta manual
  const stopListening = useCallback(() => {
    if (recognitionRef.current && mode === "command") {
      shouldRestartRef.current = false;

      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Erro ao parar escuta:", e);
      }
    }
  }, [mode]);

  return {
    isListening: mode !== "idle",
    isWakeWordActive: isWakeWordActiveRef.current && mode === "wake_word",
    mode,
    transcript,
    command,
    startListening,
    stopListening,
    startWakeWordDetection,
    stopWakeWordDetection,
    isSupported,
  };
}
