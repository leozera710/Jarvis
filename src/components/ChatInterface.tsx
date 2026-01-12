"use client";

import { useState, useRef, useEffect } from "react";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface Attachment {
  type: "image" | "video";
  data: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  aiUsed?: "claude" | "gemini";
  attachments?: Attachment[];
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string | null;
}

export default function ChatInterface({ isOpen, onClose, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Ola, senhor. Sou JARVIS, seu assistente pessoal. Como posso ajuda-lo hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedAI, setSelectedAI] = useState<"claude" | "gemini" | "auto">("auto");
  const [currentAI, setCurrentAI] = useState<"claude" | "gemini">("claude");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [capturedScreen, setCapturedScreen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks de voz
  const { speak, stop: stopSpeaking, isSpeaking, voiceType } = useJarvisVoice();
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported: speechSupported
  } = useSpeechRecognition();

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>("");

  // Gravacao de voz estilo WhatsApp - um clique grava e envia
  const handleVoiceRecord = async () => {
    if (isRecordingVoice) {
      // Parar gravacao e enviar
      stopListening();
      setIsRecordingVoice(false);
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }

      // Enviar mensagem se tiver conteudo
      if (lastTranscriptRef.current.trim()) {
        setInput(lastTranscriptRef.current);
        // Aguardar state atualizar e enviar
        setTimeout(() => {
          const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          }
        }, 100);
      }
      lastTranscriptRef.current = "";
    } else {
      // Iniciar gravacao
      setIsRecordingVoice(true);
      lastTranscriptRef.current = "";
      startListening();
    }
  };

  // Atualizar input quando o usuario fala e detectar silencio
  useEffect(() => {
    if (transcript && isRecordingVoice) {
      setInput(transcript);
      lastTranscriptRef.current = transcript;

      // Resetar timeout de silencio
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }

      // Se ficar 2 segundos sem falar, parar e enviar
      voiceTimeoutRef.current = setTimeout(() => {
        if (isRecordingVoice && lastTranscriptRef.current.trim()) {
          stopListening();
          setIsRecordingVoice(false);

          // Enviar mensagem automaticamente
          setTimeout(() => {
            const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
            if (sendButton && !sendButton.disabled) {
              sendButton.click();
            }
          }, 100);
          lastTranscriptRef.current = "";
        }
      }, 2000);
    }
  }, [transcript, isRecordingVoice, stopListening]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
    };
  }, []);

  // Listener para capturas da extensao
  useEffect(() => {
    const handleCapture = (event: CustomEvent) => {
      const { image, captureAction, sourceUrl } = event.detail;
      setCapturedScreen(image);

      // Auto-gerar prompt baseado na acao
      let prompt = "";
      switch (captureAction) {
        case "fill_form":
          prompt = "Analise esta tela e me ajude a preencher o formulario. Identifique os campos e sugira os valores.";
          break;
        case "analyze_error":
          prompt = "Analise este erro na tela e me explique o que esta acontecendo e como resolver.";
          break;
        case "element":
          prompt = "Analise este elemento capturado e me diga o que voce identifica.";
          break;
        default:
          prompt = "Analise esta captura de tela e me diga o que voce ve.";
      }

      setInput(prompt);
      setAttachments([{
        type: "image",
        data: image,
        name: `captura_${new Date().toISOString()}.png`
      }]);
    };

    window.addEventListener("jarvis-capture", handleCapture as EventListener);
    return () => window.removeEventListener("jarvis-capture", handleCapture as EventListener);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Processar mensagem inicial de voz
  useEffect(() => {
    if (isOpen && initialMessage && initialMessage.trim()) {
      // Pequeno delay para garantir que o componente está montado
      const timer = setTimeout(() => {
        setInput(initialMessage);
        // Auto-enviar após definir o input
        setTimeout(() => {
          const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
          if (sendButton) {
            sendButton.click();
          }
        }, 100);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        const type = file.type.startsWith("video/") ? "video" : "image";

        setAttachments(prev => [...prev, {
          type,
          data,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setCapturedScreen(null);
    setIsLoading(true);

    try {
      // Preparar mensagens para API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Se tem imagens, adicionar ao conteudo (para Claude)
      let imageData = null;
      if (userMessage.attachments && userMessage.attachments.length > 0) {
        const imageAttachment = userMessage.attachments.find(a => a.type === "image");
        if (imageAttachment) {
          imageData = imageAttachment.data;
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          forceAI: selectedAI !== "auto" ? selectedAI : undefined,
          imageData: imageData,
        }),
      });

      const data = await response.json();

      const responseText = data.response || data.error || "Desculpe, nao consegui processar sua solicitacao.";
      const aiUsed = data.aiUsed || "gemini";

      // Atualizar qual IA esta sendo usada
      setCurrentAI(aiUsed);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        aiUsed: aiUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Falar a resposta se voz estiver habilitada
      if (voiceEnabled && !data.error) {
        speak(responseText);
      }
    } catch (error) {
      console.error("Erro:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, houve um erro. Verifique se as API Keys estao configuradas.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-black/90 border border-[#39FF14]/30 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        {/* Header futurista */}
        <div className="flex items-center justify-between p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[#39FF14] animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#39FF14] animate-ping opacity-50" />
            </div>
            <div>
              <h2 className="text-[#39FF14] font-mono text-xl font-bold tracking-wider" style={{ textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>
                J.A.R.V.I.S
              </h2>
              <p className="text-[#39FF14]/50 text-[10px] font-mono">NEURAL INTERFACE ACTIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Seletor de IA */}
            <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1 border border-[#39FF14]/20">
              <button
                onClick={() => setSelectedAI("auto")}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${
                  selectedAI === "auto"
                    ? "bg-[#39FF14] text-black font-bold"
                    : "text-gray-400 hover:text-[#39FF14]"
                }`}
              >
                AUTO
              </button>
              <button
                onClick={() => setSelectedAI("claude")}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${
                  selectedAI === "claude"
                    ? "bg-purple-600 text-white font-bold"
                    : "text-gray-400 hover:text-purple-400"
                }`}
              >
                CLAUDE
              </button>
              <button
                onClick={() => setSelectedAI("gemini")}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${
                  selectedAI === "gemini"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-gray-400 hover:text-blue-400"
                }`}
              >
                GEMINI
              </button>
            </div>

            {/* Status da IA atual */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className={`flex items-center gap-1 ${currentAI === "claude" ? "text-purple-400" : "text-blue-400"}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${currentAI === "claude" ? "bg-purple-400" : "bg-blue-400"}`} />
                {currentAI.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Indicador de voz */}
              {isSpeaking && (
                <div className="flex items-center gap-1 text-[#39FF14] text-xs font-mono">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-3 bg-[#39FF14] animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-4 bg-[#39FF14] animate-pulse" style={{ animationDelay: "100ms" }} />
                    <span className="w-1 h-2 bg-[#39FF14] animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1 h-5 bg-[#39FF14] animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="ml-1">{voiceType === "elevenlabs" ? "JARVIS" : "VOZ"}</span>
                </div>
              )}
              {/* Toggle voz */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled
                    ? "text-[#39FF14] bg-[#39FF14]/10"
                    : "text-gray-500 hover:bg-gray-800"
                }`}
                title={voiceEnabled ? "Desativar voz" : "Ativar voz"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {voiceEnabled ? (
                    <>
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </>
                  ) : (
                    <>
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="22" y1="9" x2="16" y2="15" />
                      <line x1="16" y1="9" x2="22" y2="15" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-[#39FF14]/60 hover:text-[#39FF14] transition-colors p-2 hover:bg-[#39FF14]/10 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Area de mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-xl ${
                  message.role === "user"
                    ? "bg-[#1a1a1a] border border-[#333] text-gray-100"
                    : "bg-[#0a1a0a] border border-[#39FF14]/30 text-[#39FF14]/90"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#39FF14]/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                      <span className="text-[#39FF14]/60 text-[10px] font-mono">JARVIS</span>
                    </div>
                    {message.aiUsed && (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                        message.aiUsed === "claude"
                          ? "bg-purple-900/30 text-purple-400 border border-purple-500/30"
                          : "bg-blue-900/30 text-blue-400 border border-blue-500/30"
                      }`}>
                        {message.aiUsed.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                {/* Mostrar anexos da mensagem */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {message.attachments.map((att, idx) => (
                      <div key={idx} className="relative">
                        {att.type === "image" ? (
                          <img
                            src={att.data}
                            alt={att.name}
                            className="max-w-[200px] max-h-[150px] rounded-lg border border-[#39FF14]/20"
                          />
                        ) : (
                          <video
                            src={att.data}
                            className="max-w-[200px] max-h-[150px] rounded-lg border border-[#39FF14]/20"
                            controls
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <div className="text-[8px] text-gray-600 mt-2 font-mono">
                  {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#0a1a0a] border border-[#39FF14]/30 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[#39FF14]/50 text-xs font-mono">
                    {selectedAI === "auto" ? "Processando..." : `${selectedAI.toUpperCase()} processando...`}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preview de anexos */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-[#39FF14]/10 bg-black/30">
            <div className="flex gap-2 overflow-x-auto">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  {att.type === "image" ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-16 h-16 object-cover rounded-lg border border-[#39FF14]/30"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-lg border border-[#39FF14]/30 flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input futurista */}
        <div className="p-4 border-t border-[#39FF14]/20 bg-gradient-to-r from-transparent via-[#39FF14]/5 to-transparent">
          {/* Indicador de gravacao de voz */}
          {isRecordingVoice && (
            <div className="flex items-center justify-center gap-3 mb-3 py-2 px-4 bg-[#FF3939]/10 border border-[#FF3939]/30 rounded-lg">
              <div className="flex gap-1 items-end h-5">
                <span className="w-1.5 bg-[#FF3939] rounded animate-pulse" style={{ height: "40%", animationDelay: "0ms" }} />
                <span className="w-1.5 bg-[#FF3939] rounded animate-pulse" style={{ height: "80%", animationDelay: "100ms" }} />
                <span className="w-1.5 bg-[#FF3939] rounded animate-pulse" style={{ height: "50%", animationDelay: "200ms" }} />
                <span className="w-1.5 bg-[#FF3939] rounded animate-pulse" style={{ height: "100%", animationDelay: "300ms" }} />
                <span className="w-1.5 bg-[#FF3939] rounded animate-pulse" style={{ height: "60%", animationDelay: "400ms" }} />
              </div>
              <span className="text-[#FF3939] text-sm font-mono">GRAVANDO... Clique para enviar</span>
              <div className="w-3 h-3 bg-[#FF3939] rounded-full animate-pulse" />
            </div>
          )}
          <div className="flex gap-3">
            {/* Input de arquivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />

            {/* Botao de anexar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-black/50 border border-[#39FF14]/30 text-[#39FF14]/60 hover:text-[#39FF14] hover:border-[#39FF14] transition-all"
              title="Anexar imagem ou video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Botao de microfone estilo WhatsApp - um clique grava e envia */}
            {speechSupported && (
              <button
                onClick={handleVoiceRecord}
                className={`p-3 rounded-xl transition-all ${
                  isRecordingVoice
                    ? "bg-[#FF3939] text-white animate-pulse shadow-[0_0_20px_rgba(255,57,57,0.4)]"
                    : "bg-black/50 border border-[#39FF14]/30 text-[#39FF14]/60 hover:text-[#39FF14] hover:border-[#39FF14]"
                }`}
                title={isRecordingVoice ? "Clique para enviar" : "Clique para gravar mensagem de voz"}
              >
                {isRecordingVoice ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
            )}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "Ouvindo sua voz..." : "Digite sua mensagem..."}
                className={`w-full bg-black/50 border rounded-xl px-5 py-3
                  text-white placeholder-gray-600 font-mono
                  focus:outline-none focus:shadow-[0_0_20px_rgba(57,255,20,0.2)]
                  transition-all ${
                    isListening
                      ? "border-[#FF3939]/50 focus:border-[#FF3939]"
                      : "border-[#39FF14]/30 focus:border-[#39FF14]"
                  }`}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              data-send-button
              className="bg-[#39FF14] hover:bg-[#4dff28] disabled:opacity-30 disabled:hover:bg-[#39FF14]
                text-black font-mono font-bold px-6 py-3 rounded-xl
                transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]
                flex items-center gap-2"
            >
              <span>ENVIAR</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
