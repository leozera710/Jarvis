"use client";

import { useState } from "react";

interface AtomWidgetProps {
  onClick?: () => void;
  isListening?: boolean;
}

export default function AtomWidget({ onClick, isListening = false }: AtomWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative z-50 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative w-32 h-32 transition-transform duration-300 ${
          isHovered ? "scale-110" : "scale-100"
        }`}
      >
        {/* Container central para alinhamento perfeito */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Anel externo de energia */}
          <div className="absolute w-32 h-32 rounded-full border-2 border-[#39FF14]/20 animate-pulse" />
          <div className="absolute w-28 h-28 rounded-full border border-[#39FF14]/10" />

          {/* Nucleo central - maior e mais dramatico */}
          <div
            className={`absolute w-8 h-8 rounded-full bg-gradient-radial from-[#FF5555] to-[#FF3939]
              shadow-[0_0_30px_#FF3939,0_0_60px_#FF393960,0_0_100px_#FF393930]
              ${isListening ? "animate-pulse" : ""}`}
          />

          {/* Nucleo interno brilhante */}
          <div className="absolute w-3 h-3 rounded-full bg-white/80" />

          {/* Orbita 1 - Principal (horizontal) */}
          <div
            className="absolute w-24 h-24 rounded-full border-2 border-[#39FF14]/60"
            style={{ animation: "orbit 4s linear infinite" }}
          >
            <div
              className="absolute w-3 h-3 rounded-full bg-[#39FF14] shadow-[0_0_10px_#39FF14,0_0_20px_#39FF14]"
              style={{ top: "-6px", left: "50%", transform: "translateX(-50%)" }}
            />
          </div>

          {/* Orbita 2 - Inclinada X */}
          <div
            className="absolute w-20 h-20 rounded-full border border-[#39FF14]/40"
            style={{
              transform: "rotateX(70deg)",
              animation: "orbit-reverse 3s linear infinite"
            }}
          >
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]"
              style={{ top: "-5px", left: "50%", transform: "translateX(-50%)" }}
            />
          </div>

          {/* Orbita 3 - Inclinada XY */}
          <div
            className="absolute w-28 h-28 rounded-full border border-[#39FF14]/30"
            style={{
              transform: "rotateX(-50deg) rotateY(40deg)",
              animation: "orbit-slow 6s linear infinite"
            }}
          >
            <div
              className="absolute w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14]"
              style={{ top: "-4px", left: "50%", transform: "translateX(-50%)" }}
            />
          </div>
        </div>

        {/* Particulas flutuantes ao redor */}
        <div className="absolute top-0 left-1/4 w-1 h-1 rounded-full bg-[#39FF14]/50 animate-float" />
        <div className="absolute bottom-2 right-1/4 w-1.5 h-1.5 rounded-full bg-[#39FF14]/40 animate-float" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/4 right-0 w-1 h-1 rounded-full bg-[#39FF14]/60 animate-float" style={{ animationDelay: "1s" }} />

        {/* Indicador de escuta */}
        {isListening && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#39FF14]"></span>
            </span>
          </div>
        )}
      </div>

      {/* Label ao passar mouse */}
      <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[#39FF14] text-lg font-mono font-bold tracking-widest" style={{ textShadow: '0 0 10px #39FF14, 0 0 20px #39FF14' }}>
          INICIAR
        </span>
      </div>

      {/* CSS para animacoes */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-reverse {
          from { transform: rotateX(70deg) rotate(360deg); }
          to { transform: rotateX(70deg) rotate(0deg); }
        }
        @keyframes orbit-slow {
          from { transform: rotateX(-50deg) rotateY(40deg) rotate(0deg); }
          to { transform: rotateX(-50deg) rotateY(40deg) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
