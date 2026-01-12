"use client";

import { useState, useEffect, useCallback } from "react";
import ChatInterface from "./ChatInterface";
import SpyPanel from "./SpyPanel";
import SmartHomePanel from "./SmartHomePanel";
import RemoteControlPanel from "./RemoteControlPanel";
import AdsPanel from "./AdsPanel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface MobileInterfaceProps {
  onSwitchToDesktop?: () => void;
}

export default function MobileInterface({ onSwitchToDesktop }: MobileInterfaceProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  // Processar comando de voz
  const processVoiceCommand = useCallback((cmd: string) => {
    const normalizedCmd = cmd.toLowerCase().trim();

    if (normalizedCmd.includes("spy") || normalizedCmd.includes("espionar") || normalizedCmd.includes("ofertas")) {
      setActivePanel("spy");
      return;
    }
    if (normalizedCmd.includes("casa") || normalizedCmd.includes("home") || normalizedCmd.includes("luz")) {
      setActivePanel("home");
      return;
    }
    if (normalizedCmd.includes("remote") || normalizedCmd.includes("remoto")) {
      setActivePanel("remote");
      return;
    }
    if (normalizedCmd.includes("ads") || normalizedCmd.includes("campanha")) {
      setActivePanel("ads");
      return;
    }
    if (normalizedCmd.includes("fechar") || normalizedCmd.includes("sair")) {
      setActivePanel(null);
      setIsChatOpen(false);
      return;
    }

    setVoiceCommand(cmd);
    setIsChatOpen(true);
  }, []);

  useEffect(() => {
    if (command) {
      processVoiceCommand(command);
    }
  }, [command, processVoiceCommand]);

  // Iniciar wake word
  useEffect(() => {
    if (isSupported && !wakeWordEnabled) {
      const timer = setTimeout(() => {
        startWakeWordDetection();
        setWakeWordEnabled(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, wakeWordEnabled, startWakeWordDetection]);

  const toggleWakeWord = useCallback(() => {
    if (wakeWordEnabled) {
      stopWakeWordDetection();
      setWakeWordEnabled(false);
    } else {
      startWakeWordDetection();
      setWakeWordEnabled(true);
    }
  }, [wakeWordEnabled, startWakeWordDetection, stopWakeWordDetection]);

  const menuItems = [
    { id: "chat", icon: "💬", label: "CHAT", action: () => setIsChatOpen(true) },
    { id: "spy", icon: "🕵️", label: "SPY", action: () => setActivePanel("spy") },
    { id: "home", icon: "🏠", label: "HOME", action: () => setActivePanel("home") },
    { id: "remote", icon: "🖥️", label: "REMOTE", action: () => setActivePanel("remote") },
    { id: "ads", icon: "📊", label: "ADS", action: () => setActivePanel("ads") },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-b border-[#39FF14]/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1
            className="text-2xl font-bold text-[#39FF14] tracking-wider"
            style={{ textShadow: "0 0 10px rgba(57, 255, 20, 0.5)" }}
          >
            JARVIS
          </h1>

          {/* Wake word toggle */}
          <button
            onClick={toggleWakeWord}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              wakeWordEnabled
                ? mode === "command"
                  ? "bg-[#39FF14]/20 border border-[#39FF14]"
                  : "bg-black/60 border border-[#39FF14]/50"
                : "bg-black/60 border border-gray-600/50"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              wakeWordEnabled
                ? mode === "command"
                  ? "bg-[#39FF14] animate-ping"
                  : "bg-[#39FF14]"
                : "bg-gray-500"
            }`} />
            <span className={`text-xs font-mono ${wakeWordEnabled ? "text-[#39FF14]" : "text-gray-500"}`}>
              {mode === "command" ? "ESCUTANDO" : wakeWordEnabled ? "VOZ ON" : "VOZ OFF"}
            </span>
          </button>
        </div>

        {/* Transcricao */}
        {transcript && mode !== "idle" && (
          <div className="px-4 pb-2">
            <div className="bg-black/60 border border-[#39FF14]/30 rounded-lg px-3 py-2">
              <p className="text-[#39FF14] font-mono text-sm">{transcript}</p>
            </div>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="flex-1 pt-16 pb-24 px-4">
        {/* Central Jarvis display */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          {/* Atomo simplificado para mobile */}
          <div className="relative w-40 h-40 mb-8">
            {/* Nucleo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#39FF14] to-[#2dd310] animate-pulse cursor-pointer"
                style={{ boxShadow: "0 0 30px rgba(57, 255, 20, 0.5), 0 0 60px rgba(57, 255, 20, 0.3)" }}
                onClick={() => setIsChatOpen(true)}
              />
            </div>

            {/* Orbitas */}
            <div className="absolute inset-0 border border-[#39FF14]/30 rounded-full animate-spin" style={{ animationDuration: "8s" }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#39FF14]" />
            </div>
            <div className="absolute inset-4 border border-[#39FF14]/20 rounded-full animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }}>
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#39FF14]" />
            </div>
          </div>

          <p className="text-[#39FF14]/70 font-mono text-sm mb-2">
            {mode === "command" ? "Pode falar seu comando..." : "Toque no nucleo para conversar"}
          </p>
          <p className="text-gray-600 font-mono text-xs">
            {wakeWordEnabled ? "Diga \"Jarvis\" para ativar" : "Ative a voz no topo"}
          </p>

          {/* Status cards */}
          <div className="flex gap-3 mt-8">
            <div className="bg-black/60 border border-[#39FF14]/30 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                <span className="text-[#39FF14] text-xs font-mono">GEMINI</span>
              </div>
            </div>
            <div className="bg-black/60 border border-gray-600/30 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                <span className="text-gray-500 text-xs font-mono">CLAUDE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {menuItems.slice(1).map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="bg-black/60 border border-[#39FF14]/30 rounded-xl p-4 hover:bg-[#39FF14]/10 hover:border-[#39FF14] transition-all active:scale-95"
            >
              <span className="text-3xl block mb-2">{item.icon}</span>
              <span className="text-[#39FF14] text-xs font-mono">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Switch to desktop */}
        {onSwitchToDesktop && (
          <button
            onClick={onSwitchToDesktop}
            className="w-full mt-6 py-3 border border-gray-600/30 rounded-xl text-gray-500 font-mono text-sm hover:border-[#39FF14]/30 hover:text-[#39FF14]/50 transition-all"
          >
            Mudar para modo Desktop
          </button>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-[#39FF14]/30">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-[#39FF14]/10 transition-all active:scale-90"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[#39FF14]/70 text-[10px] font-mono">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Panels */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setVoiceCommand(null);
        }}
        initialMessage={voiceCommand}
      />

      <SpyPanel
        isOpen={activePanel === "spy"}
        onClose={() => setActivePanel(null)}
      />

      <SmartHomePanel
        isOpen={activePanel === "home"}
        onClose={() => setActivePanel(null)}
      />

      <RemoteControlPanel
        isOpen={activePanel === "remote"}
        onClose={() => setActivePanel(null)}
      />

      <AdsPanel
        isOpen={activePanel === "ads"}
        onClose={() => setActivePanel(null)}
      />
    </div>
  );
}
