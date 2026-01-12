"use client";

import { useState, useEffect, useCallback } from "react";
import AtomWidget from "@/components/AtomWidget";
import ChatInterface from "@/components/ChatInterface";
import MatrixRain from "@/components/effects/MatrixRain";
import CircuitLines from "@/components/effects/CircuitLines";
import HUDOverlay from "@/components/effects/HUDOverlay";
import BootScreen from "@/components/effects/BootScreen";
import SpyPanel from "@/components/SpyPanel";
import SmartHomePanel from "@/components/SmartHomePanel";
import RemoteControlPanel from "@/components/RemoteControlPanel";
import AdsPanel from "@/components/AdsPanel";
import AppsPanel from "@/components/AppsPanel";
import MobileInterface from "@/components/MobileInterface";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function Home() {
  const [isBooting, setIsBooting] = useState(true);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSpyOpen, setIsSpyOpen] = useState(false);
  const [isSmartHomeOpen, setIsSmartHomeOpen] = useState(false);
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [isAdsOpen, setIsAdsOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string | null>(null);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  const {
    mode,
    transcript,
    command,
    startWakeWordDetection,
    stopWakeWordDetection,
    isSupported,
  } = useSpeechRecognition();

  // Handler para conclusao do boot (recebe dispositivo selecionado)
  const handleBootComplete = (device: "desktop" | "mobile") => {
    setDeviceMode(device);
    setIsBooting(false);
  };

  // Handler para trocar de mobile para desktop
  const handleSwitchToDesktop = () => {
    setDeviceMode("desktop");
  };

  // Processar comando de voz
  const processVoiceCommand = useCallback((cmd: string) => {
    const normalizedCmd = cmd.toLowerCase().trim();
    console.log("Processando comando:", normalizedCmd);

    if (normalizedCmd.includes("spy") || normalizedCmd.includes("espionar") || normalizedCmd.includes("ofertas")) {
      setIsSpyOpen(true);
      return;
    }
    if (normalizedCmd.includes("casa") || normalizedCmd.includes("home") || normalizedCmd.includes("luz") || normalizedCmd.includes("luzes")) {
      setIsSmartHomeOpen(true);
      return;
    }
    if (normalizedCmd.includes("remote") || normalizedCmd.includes("remoto") || normalizedCmd.includes("computador")) {
      setIsRemoteOpen(true);
      return;
    }
    if (normalizedCmd.includes("ads") || normalizedCmd.includes("campanha") || normalizedCmd.includes("anuncio") || normalizedCmd.includes("anúncio")) {
      setIsAdsOpen(true);
      return;
    }
    if (normalizedCmd.includes("apps") || normalizedCmd.includes("aplicativos") || normalizedCmd.includes("ferramentas")) {
      setIsAppsOpen(true);
      return;
    }
    if (normalizedCmd.includes("fechar") || normalizedCmd.includes("fecha") || normalizedCmd.includes("sair")) {
      setIsSpyOpen(false);
      setIsSmartHomeOpen(false);
      setIsRemoteOpen(false);
      setIsAdsOpen(false);
      setIsAppsOpen(false);
      setIsChatOpen(false);
      return;
    }

    setVoiceCommand(cmd);
    setIsChatOpen(true);
  }, []);

  // Reagir a comandos recebidos
  useEffect(() => {
    if (command) {
      processVoiceCommand(command);
    }
  }, [command, processVoiceCommand]);

  // Iniciar wake word apos boot
  useEffect(() => {
    if (!isBooting && isSupported && !wakeWordEnabled) {
      const timer = setTimeout(() => {
        startWakeWordDetection();
        setWakeWordEnabled(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isBooting, isSupported, wakeWordEnabled, startWakeWordDetection]);

  // Toggle wake word
  const toggleWakeWord = useCallback(() => {
    if (wakeWordEnabled) {
      stopWakeWordDetection();
      setWakeWordEnabled(false);
    } else {
      startWakeWordDetection();
      setWakeWordEnabled(true);
    }
  }, [wakeWordEnabled, startWakeWordDetection, stopWakeWordDetection]);

  // Tela de boot unificada
  if (isBooting) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  // Interface Mobile
  if (deviceMode === "mobile") {
    return <MobileInterface onSwitchToDesktop={handleSwitchToDesktop} />;
  }

  // Interface Desktop
  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Camadas de efeitos visuais */}
      <MatrixRain />
      <CircuitLines />
      <HUDOverlay />

      {/* Indicador de Wake Word - Topo da tela */}
      {isSupported && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={toggleWakeWord}
            className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
              wakeWordEnabled
                ? mode === "command"
                  ? "bg-[#39FF14]/20 border-2 border-[#39FF14] shadow-[0_0_20px_#39FF14]"
                  : "bg-black/60 border border-[#39FF14]/50"
                : "bg-black/60 border border-gray-600/50"
            }`}
          >
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${
                wakeWordEnabled
                  ? mode === "command"
                    ? "bg-[#39FF14] animate-pulse shadow-[0_0_10px_#39FF14]"
                    : "bg-[#39FF14]/70"
                  : "bg-gray-500"
              }`} />
              {mode === "command" && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#39FF14] animate-ping" />
              )}
            </div>

            <span className={`font-mono text-sm ${
              wakeWordEnabled ? "text-[#39FF14]" : "text-gray-500"
            }`}>
              {mode === "command" ? "ESCUTANDO..." : wakeWordEnabled ? "DIGA \"JARVIS\"" : "VOZ OFF"}
            </span>

            {mode === "command" && (
              <div className="flex items-center gap-0.5 ml-2">
                <div className="w-1 h-3 bg-[#39FF14] rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-1 h-4 bg-[#39FF14] rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-2 bg-[#39FF14] rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                <div className="w-1 h-5 bg-[#39FF14] rounded animate-pulse" style={{ animationDelay: "450ms" }} />
                <div className="w-1 h-3 bg-[#39FF14] rounded animate-pulse" style={{ animationDelay: "600ms" }} />
              </div>
            )}
          </button>

          {transcript && mode !== "idle" && (
            <div className="mt-2 bg-black/80 backdrop-blur-sm border border-[#39FF14]/30 rounded-lg px-4 py-2 max-w-md">
              <p className="text-[#39FF14] font-mono text-sm text-center">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conteudo principal */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Centro - Atomo grande centralizado */}
        <div className="flex flex-col items-center">
          <div className="transform scale-150 mb-8">
            <AtomWidget
              onClick={() => setIsChatOpen(true)}
              isListening={mode === "command"}
            />
          </div>

          <div className="text-center mt-16">
            <p className="text-[#39FF14]/70 font-mono text-sm animate-pulse">
              {mode === "command" ? "Pode falar seu comando..." : "Clique no nucleo para interagir"}
            </p>
            <p className="text-gray-600 font-mono text-xs mt-2">
              {wakeWordEnabled ? "Wake word ativo - diga \"Jarvis\"" : "Clique no botao acima para ativar voz"}
            </p>
          </div>
        </div>

        {/* Cards de status flutuantes - canto inferior esquerdo */}
        <div className="fixed bottom-6 left-6 flex gap-4 z-30">
          <div className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span className="text-[#39FF14] text-xs font-mono">GEMINI</span>
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-sm border border-gray-600/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-500 text-xs font-mono">CLAUDE</span>
            </div>
          </div>
          <div className={`bg-black/60 backdrop-blur-sm border rounded-lg px-4 py-2 ${
            wakeWordEnabled ? "border-[#39FF14]/30" : "border-gray-600/30"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                wakeWordEnabled
                  ? mode === "command"
                    ? "bg-[#39FF14] animate-ping"
                    : "bg-[#39FF14] animate-pulse"
                  : "bg-gray-500"
              }`} />
              <span className={`text-xs font-mono ${wakeWordEnabled ? "text-[#39FF14]" : "text-gray-500"}`}>
                VOZ {wakeWordEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Menu rapido - lado esquerdo */}
        <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
          <button
            onClick={() => setIsSpyOpen(true)}
            className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-xl p-3 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all group"
            title="Spy de Ofertas"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">🕵️</span>
            <span className="text-[#39FF14] text-[10px] font-mono mt-1 block">SPY</span>
          </button>
          <button
            onClick={() => setIsSmartHomeOpen(true)}
            className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-xl p-3 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all group"
            title="Smart Home"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">🏠</span>
            <span className="text-[#39FF14] text-[10px] font-mono mt-1 block">HOME</span>
          </button>
          <button
            onClick={() => setIsRemoteOpen(true)}
            className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-xl p-3 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all group"
            title="Controle Remoto"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">🖥️</span>
            <span className="text-[#39FF14] text-[10px] font-mono mt-1 block">REMOTE</span>
          </button>
          <button
            onClick={() => setIsAdsOpen(true)}
            className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-xl p-3 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all group"
            title="Automacao Google Ads"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">📊</span>
            <span className="text-[#39FF14] text-[10px] font-mono mt-1 block">ADS</span>
          </button>
          <button
            onClick={() => setIsAppsOpen(true)}
            className="bg-black/60 backdrop-blur-sm border border-[#39FF14]/30 rounded-xl p-3 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all group"
            title="Meus Apps"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">📱</span>
            <span className="text-[#39FF14] text-[10px] font-mono mt-1 block">APPS</span>
          </button>
          <button
            className="bg-black/60 backdrop-blur-sm border border-gray-600/30 rounded-xl p-3 hover:bg-gray-600/10 hover:border-gray-500 transition-all group opacity-50"
            title="Calendario (Configure Google OAuth)"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform block">📅</span>
            <span className="text-gray-500 text-[10px] font-mono mt-1 block">AGENDA</span>
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setVoiceCommand(null);
        }}
        initialMessage={voiceCommand}
      />

      {/* Spy Panel */}
      <SpyPanel
        isOpen={isSpyOpen}
        onClose={() => setIsSpyOpen(false)}
      />

      {/* Smart Home Panel */}
      <SmartHomePanel
        isOpen={isSmartHomeOpen}
        onClose={() => setIsSmartHomeOpen(false)}
      />

      {/* Remote Control Panel */}
      <RemoteControlPanel
        isOpen={isRemoteOpen}
        onClose={() => setIsRemoteOpen(false)}
      />

      {/* Ads Automation Panel */}
      <AdsPanel
        isOpen={isAdsOpen}
        onClose={() => setIsAdsOpen(false)}
      />

      {/* Apps Panel */}
      <AppsPanel
        isOpen={isAppsOpen}
        onClose={() => setIsAppsOpen(false)}
      />
    </main>
  );
}
