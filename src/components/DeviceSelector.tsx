"use client";

import { useState } from "react";

interface DeviceSelectorProps {
  onSelect: (device: "desktop" | "mobile") => void;
}

export default function DeviceSelector({ onSelect }: DeviceSelectorProps) {
  const [hoveredDevice, setHoveredDevice] = useState<"desktop" | "mobile" | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<"desktop" | "mobile" | null>(null);

  const handleSelect = (device: "desktop" | "mobile") => {
    setSelectedDevice(device);
    setTimeout(() => onSelect(device), 600);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background com particulas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#39FF14]/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Logo JARVIS */}
      <div className={`text-center mb-16 transition-all duration-500 ${selectedDevice ? 'opacity-0 scale-50' : 'opacity-100'}`}>
        <h1 className="text-6xl md:text-8xl font-bold text-[#39FF14] tracking-widest mb-4"
            style={{ textShadow: "0 0 30px rgba(57, 255, 20, 0.5), 0 0 60px rgba(57, 255, 20, 0.3)" }}>
          JARVIS
        </h1>
        <p className="text-[#39FF14]/60 text-sm md:text-base font-mono tracking-[0.3em]">
          Just A Rather Very Intelligent System
        </p>
      </div>

      {/* Titulo de selecao */}
      <div className={`text-center mb-12 transition-all duration-500 ${selectedDevice ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-white/80 text-lg md:text-xl font-mono">
          Selecione o modo de interface
        </p>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent mx-auto mt-4" />
      </div>

      {/* Cards de selecao */}
      <div className={`flex flex-col md:flex-row gap-8 md:gap-16 transition-all duration-500 ${selectedDevice ? 'opacity-0 scale-90' : 'opacity-100'}`}>
        {/* Desktop */}
        <button
          onClick={() => handleSelect("desktop")}
          onMouseEnter={() => setHoveredDevice("desktop")}
          onMouseLeave={() => setHoveredDevice(null)}
          className={`group relative w-64 h-72 rounded-2xl border-2 transition-all duration-300 overflow-hidden
            ${hoveredDevice === "desktop"
              ? "border-[#39FF14] bg-[#39FF14]/10 scale-105 shadow-[0_0_40px_rgba(57,255,20,0.3)]"
              : "border-[#39FF14]/30 bg-black/60 hover:bg-[#39FF14]/5"
            }
            ${selectedDevice === "desktop" ? "scale-110 border-[#39FF14] shadow-[0_0_60px_rgba(57,255,20,0.5)]" : ""}
          `}
        >
          {/* Icone Desktop */}
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className={`mb-6 transition-transform duration-300 ${hoveredDevice === "desktop" ? "scale-110" : ""}`}>
              <svg className="w-24 h-24 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5" />
                <line x1="8" y1="21" x2="16" y2="21" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="text-[#39FF14] text-2xl font-bold mb-2">DESKTOP</h3>
            <p className="text-[#39FF14]/60 text-sm text-center font-mono">
              Interface completa com todos os recursos
            </p>
          </div>

          {/* Efeito de borda animada */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${hoveredDevice === "desktop" ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse" />
          </div>
        </button>

        {/* Mobile */}
        <button
          onClick={() => handleSelect("mobile")}
          onMouseEnter={() => setHoveredDevice("mobile")}
          onMouseLeave={() => setHoveredDevice(null)}
          className={`group relative w-64 h-72 rounded-2xl border-2 transition-all duration-300 overflow-hidden
            ${hoveredDevice === "mobile"
              ? "border-[#39FF14] bg-[#39FF14]/10 scale-105 shadow-[0_0_40px_rgba(57,255,20,0.3)]"
              : "border-[#39FF14]/30 bg-black/60 hover:bg-[#39FF14]/5"
            }
            ${selectedDevice === "mobile" ? "scale-110 border-[#39FF14] shadow-[0_0_60px_rgba(57,255,20,0.5)]" : ""}
          `}
        >
          {/* Icone Mobile */}
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className={`mb-6 transition-transform duration-300 ${hoveredDevice === "mobile" ? "scale-110" : ""}`}>
              <svg className="w-24 h-24 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5" />
                <line x1="9" y1="19" x2="15" y2="19" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-[#39FF14] text-2xl font-bold mb-2">MOBILE</h3>
            <p className="text-[#39FF14]/60 text-sm text-center font-mono">
              Interface otimizada para dispositivos moveis
            </p>
          </div>

          {/* Efeito de borda animada */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${hoveredDevice === "mobile" ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse" />
          </div>
        </button>
      </div>

      {/* Indicador inferior */}
      <div className={`mt-12 transition-all duration-500 ${selectedDevice ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 text-[#39FF14]/40 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-[#39FF14]/40 animate-pulse" />
          <span>v1.0.0</span>
          <span className="mx-2">|</span>
          <span>SISTEMA JARVIS</span>
        </div>
      </div>

      {/* Animacao de transicao */}
      {selectedDevice && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 bg-[#39FF14] rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}
