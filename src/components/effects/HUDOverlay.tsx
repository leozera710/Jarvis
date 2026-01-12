"use client";

import { useEffect, useState, useRef } from "react";

export default function HUDOverlay() {
  const [time, setTime] = useState(new Date());
  const [sessionTime, setSessionTime] = useState(0); // em segundos
  const sessionStartRef = useRef<number>(Date.now());
  const [systemStatus, setSystemStatus] = useState({
    cpu: Math.floor(Math.random() * 30 + 10),
    memory: Math.floor(Math.random() * 40 + 30),
    network: "ONLINE",
  });

  // Carregar tempo de sessao do localStorage
  useEffect(() => {
    const savedStart = localStorage.getItem("jarvis_session_start");
    if (savedStart) {
      sessionStartRef.current = parseInt(savedStart);
    } else {
      localStorage.setItem("jarvis_session_start", sessionStartRef.current.toString());
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      // Calcular tempo de sessao
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setSessionTime(elapsed);
      // Atualizar status do sistema
      setSystemStatus({
        cpu: Math.floor(Math.random() * 30 + 10),
        memory: Math.floor(Math.random() * 40 + 30),
        network: "ONLINE",
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatar tempo de sessao
  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none p-4">
      {/* Cantos decorativos */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="#39FF14" strokeWidth="2" opacity="0.5" />
          <path d="M0 20 L0 10 L10 10 L10 0" fill="none" stroke="#39FF14" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 rotate-90">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="#39FF14" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 -rotate-90">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="#39FF14" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="#39FF14" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>

      {/* Status do sistema - Topo direito */}
      <div className="absolute top-6 right-6 text-right font-mono text-xs">
        <div className="text-[#39FF14]/70">SYSTEM STATUS</div>
        <div className="text-[#39FF14] text-2xl font-bold">
          {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <div className="text-gray-500 text-[10px]">
          {time.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </div>

        {/* Cronometro de Sessao */}
        <div className="mt-3 bg-black/50 border border-[#39FF14]/30 rounded-lg px-3 py-2">
          <div className="flex items-center justify-end gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2" className="opacity-70">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-gray-500 text-[10px]">SESSAO</span>
          </div>
          <div className="text-[#39FF14] text-lg font-bold tracking-wider">
            {formatSessionTime(sessionTime)}
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-gray-500">CPU</span>
            <div className="w-20 h-1 bg-gray-800 rounded">
              <div className="h-full bg-[#39FF14] rounded transition-all duration-500" style={{ width: systemStatus.cpu + "%" }} />
            </div>
            <span className="text-[#39FF14] w-8">{systemStatus.cpu}%</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-gray-500">MEM</span>
            <div className="w-20 h-1 bg-gray-800 rounded">
              <div className="h-full bg-[#39FF14] rounded transition-all duration-500" style={{ width: systemStatus.memory + "%" }} />
            </div>
            <span className="text-[#39FF14] w-8">{systemStatus.memory}%</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-gray-500">NET</span>
            <span className="text-[#39FF14]">{systemStatus.network}</span>
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Logo JARVIS - Topo esquerdo */}
      <div className="absolute top-6 left-6">
        <div className="text-[#39FF14]/30 text-[10px] font-mono">STARK INDUSTRIES</div>
        <div className="text-[#39FF14] text-3xl font-bold font-mono tracking-wider text-glow-green">
          J.A.R.V.I.S
        </div>
        <div className="text-[#39FF14]/50 text-[10px] font-mono">
          Just A Rather Very Intelligent System
        </div>
        <div className="text-gray-600 text-[10px] font-mono mt-1">
          v2.0.0 | NEGRAO EDITION
        </div>
      </div>

      {/* Linha de scan horizontal */}
      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent animate-scan"
           style={{ top: "50%", animation: "scan 4s linear infinite" }} />

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-50vh); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(50vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
