"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BootScreenProps {
  onComplete: (device: "desktop" | "mobile") => void;
}

type Phase = "matrix" | "select" | "neural" | "circuits" | "complete";

export default function BootScreen({ onComplete }: BootScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circuitCanvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("matrix");
  const [jarvisFormed, setJarvisFormed] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<"desktop" | "mobile" | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<"desktop" | "mobile" | null>(null);
  const [presentationCount, setPresentationCount] = useState(0);
  const [showStandbyMessage, setShowStandbyMessage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const standbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const standbyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar audios de boas-vindas e standby
  useEffect(() => {
    const loadAudios = async () => {
      try {
        // Audio de boas-vindas
        const welcomeResponse = await fetch("/api/welcome-audio");
        if (welcomeResponse.ok && welcomeResponse.headers.get("content-type")?.includes("audio")) {
          const blob = await welcomeResponse.blob();
          audioRef.current = new Audio(URL.createObjectURL(blob));
        }

        // Audio de standby
        const standbyResponse = await fetch("/api/standby-audio");
        if (standbyResponse.ok && standbyResponse.headers.get("content-type")?.includes("audio")) {
          const blob = await standbyResponse.blob();
          standbyAudioRef.current = new Audio(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.log("Audio não disponível", e);
      }
    };
    loadAudios();

    return () => {
      if (standbyTimerRef.current) clearTimeout(standbyTimerRef.current);
    };
  }, []);

  // Matrix Rain OTIMIZADO com requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Configurar tamanho
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Configuracoes otimizadas
    const fontSize = 18;
    const columns = Math.floor(canvas.width / fontSize);
    const chars = "01アイウエオカキクケコ";
    const jarvisText = "JARVIS";

    // Arrays tipados para melhor performance
    const drops = new Float32Array(columns);
    const speeds = new Float32Array(columns);

    // Inicializar
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
      speeds[i] = 0.5 + Math.random() * 0.5;
    }

    // Posicao do JARVIS - mais acima (30% da altura)
    const jarvisY = Math.floor(canvas.height * 0.30);
    const jarvisFontSize = Math.min(80, canvas.width / 8);
    const jarvisWidth = jarvisText.length * jarvisFontSize * 0.6;
    const jarvisX = (canvas.width - jarvisWidth) / 2;

    let frame = 0;
    let formed = false;
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const draw = (currentTime: number) => {
      // Limitar FPS
      if (currentTime - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;
      frame++;

      // Fundo com fade
      ctx.fillStyle = formed ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenhar chuva matrix (apenas se nao formou ou com opacidade baixa)
      if (!formed || frame % 2 === 0) {
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = formed ? "rgba(57, 255, 20, 0.15)" : "#39FF14";

        for (let i = 0; i < columns; i++) {
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          if (!formed) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            ctx.fillText(char, x, y);
            ctx.globalAlpha = 1;
          }

          // Resetar quando sair da tela
          if (y > canvas.height) {
            drops[i] = Math.random() * -20;
          }
          drops[i] += speeds[i];
        }
      }

      // Desenhar JARVIS formado
      if (frame > 60 || formed) {
        if (!formed && frame === 61) {
          formed = true;
          setJarvisFormed(true);
        }

        // Limpar area do JARVIS
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(jarvisX - 20, jarvisY - jarvisFontSize, jarvisWidth + 40, jarvisFontSize + 40);

        // Texto JARVIS com glow
        ctx.font = `bold ${jarvisFontSize}px monospace`;
        ctx.textAlign = "center";

        // Glow
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 30 + Math.sin(frame * 0.05) * 10;
        ctx.fillStyle = "#39FF14";
        ctx.fillText(jarvisText, canvas.width / 2, jarvisY);

        // Texto solido por cima
        ctx.shadowBlur = 0;
        ctx.fillText(jarvisText, canvas.width / 2, jarvisY);

        ctx.textAlign = "left";
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Mostrar selecao apos JARVIS formar
  useEffect(() => {
    if (jarvisFormed && phase === "matrix") {
      setTimeout(() => setPhase("select"), 800);
    }
  }, [jarvisFormed, phase]);

  // Handler de selecao de dispositivo
  const handleDeviceSelect = (device: "desktop" | "mobile") => {
    setSelectedDevice(device);
    setPhase("neural");
  };

  // Handler do botao neural - logica de apresentacao
  const handleNeuralAccess = async () => {
    setPhase("circuits");

    // Limpar timer de standby anterior
    if (standbyTimerRef.current) {
      clearTimeout(standbyTimerRef.current);
    }

    // Tocar audio de boas-vindas (primeira vez)
    if (audioRef.current && presentationCount === 0) {
      try {
        audioRef.current.volume = 0.8;
        await audioRef.current.play();
        setPresentationCount(1);

        // Quando terminar o audio, iniciar timer para standby
        audioRef.current.onended = () => {
          // Aguardar 8 segundos sem interacao
          standbyTimerRef.current = setTimeout(async () => {
            // Se ainda nao houve interacao, tocar mensagem de standby
            if (standbyAudioRef.current) {
              try {
                setShowStandbyMessage(true);
                standbyAudioRef.current.volume = 0.8;
                await standbyAudioRef.current.play();

                standbyAudioRef.current.onended = () => {
                  // Apos standby, ir para interface com wake word ativo
                  onComplete(selectedDevice || "desktop");
                };
              } catch (e) {
                console.log("Erro ao tocar standby", e);
                onComplete(selectedDevice || "desktop");
              }
            } else {
              onComplete(selectedDevice || "desktop");
            }
          }, 8000);
        };
      } catch (e) {
        console.log("Erro ao tocar audio", e);
        // Se falhar, continua normalmente
        setTimeout(() => onComplete(selectedDevice || "desktop"), 3500);
      }
    } else {
      // Se ja tocou antes, ir direto
      setTimeout(() => onComplete(selectedDevice || "desktop"), 3500);
    }
  };

  // Cancelar standby se usuario interagir
  const handleUserInteraction = useCallback(() => {
    if (standbyTimerRef.current) {
      clearTimeout(standbyTimerRef.current);
      standbyTimerRef.current = null;
    }
    // Ir para interface
    onComplete(selectedDevice || "desktop");
  }, [selectedDevice, onComplete]);

  // Animacao de circuitos
  useEffect(() => {
    if (phase !== "circuits") return;

    const canvas = circuitCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Circuit {
      x: number;
      y: number;
      tx: number;
      ty: number;
      progress: number;
      speed: number;
    }

    const circuits: Circuit[] = [];

    // Criar circuitos iniciais
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const len = 80 + Math.random() * 150;
      circuits.push({
        x, y,
        tx: x + Math.cos(angle) * len,
        ty: y + Math.sin(angle) * len,
        progress: 0,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    let startTime = Date.now();
    let circuitAnimId: number;

    const drawCircuits = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      circuits.forEach((c, i) => {
        const cx = c.x + (c.tx - c.x) * c.progress;
        const cy = c.y + (c.ty - c.y) * c.progress;

        // Linha com gradiente
        const grad = ctx.createLinearGradient(c.x, c.y, cx, cy);
        grad.addColorStop(0, "rgba(57, 255, 20, 0.2)");
        grad.addColorStop(1, "rgba(57, 255, 20, 0.9)");

        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ponto na ponta
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#39FF14";
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        c.progress += c.speed;
        if (c.progress >= 1) {
          // Resetar
          c.x = Math.random() * canvas.width;
          c.y = Math.random() * canvas.height;
          const angle = Math.random() * Math.PI * 2;
          const len = 80 + Math.random() * 150;
          c.tx = c.x + Math.cos(angle) * len;
          c.ty = c.y + Math.sin(angle) * len;
          c.progress = 0;
        }
      });

      // Finalizar apos 3.5 segundos
      if (Date.now() - startTime > 3500) {
        cancelAnimationFrame(circuitAnimId);
        onComplete(selectedDevice || "desktop");
        return;
      }

      circuitAnimId = requestAnimationFrame(drawCircuits);
    };

    circuitAnimId = requestAnimationFrame(drawCircuits);

    return () => cancelAnimationFrame(circuitAnimId);
  }, [phase, selectedDevice, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Canvas Matrix */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Canvas Circuitos */}
      {phase === "circuits" && (
        <canvas ref={circuitCanvasRef} className="absolute inset-0 z-10" />
      )}

      {/* Conteudo sobreposto */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center">

        {/* Subtitulo JARVIS - posicionado abaixo do nome no canvas */}
        <div className={`transition-all duration-700 mt-32 ${jarvisFormed && phase !== "circuits" ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[#39FF14]/60 text-sm font-mono tracking-[0.3em]">
            Just A Rather Very Intelligent System
          </p>
        </div>

        {/* Selecao de dispositivo */}
        {phase === "select" && (
          <div className="mt-12 animate-fade-in-scale">
            <p className="text-white/70 text-center font-mono mb-8">
              Selecione o modo de interface
            </p>

            <div className="flex gap-8">
              {/* Desktop */}
              <button
                onClick={() => handleDeviceSelect("desktop")}
                onMouseEnter={() => setHoveredDevice("desktop")}
                onMouseLeave={() => setHoveredDevice(null)}
                className={`relative w-44 h-52 rounded-xl border-2 transition-all duration-300 bg-black/50 backdrop-blur-sm
                  ${hoveredDevice === "desktop"
                    ? "border-[#39FF14] scale-105 shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                    : "border-[#39FF14]/30 hover:border-[#39FF14]/60"}`}
              >
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <svg className="w-16 h-16 text-[#39FF14] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5" />
                    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" />
                  </svg>
                  <span className="text-[#39FF14] font-bold text-lg">DESKTOP</span>
                  <span className="text-[#39FF14]/50 text-xs mt-1">Interface completa</span>
                </div>
              </button>

              {/* Mobile */}
              <button
                onClick={() => handleDeviceSelect("mobile")}
                onMouseEnter={() => setHoveredDevice("mobile")}
                onMouseLeave={() => setHoveredDevice(null)}
                className={`relative w-44 h-52 rounded-xl border-2 transition-all duration-300 bg-black/50 backdrop-blur-sm
                  ${hoveredDevice === "mobile"
                    ? "border-[#39FF14] scale-105 shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                    : "border-[#39FF14]/30 hover:border-[#39FF14]/60"}`}
              >
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <svg className="w-16 h-16 text-[#39FF14] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5" />
                    <line x1="9" y1="19" x2="15" y2="19" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[#39FF14] font-bold text-lg">MOBILE</span>
                  <span className="text-[#39FF14]/50 text-xs mt-1">Interface otimizada</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Botao Liberar Acesso Neural */}
        {phase === "neural" && (
          <div className="mt-16 animate-fade-in-scale">
            <button
              onClick={handleNeuralAccess}
              className="group relative"
            >
              {/* Aneis pulsantes */}
              <div className="absolute inset-0 -m-6">
                <div className="absolute inset-0 rounded-full border-2 border-[#39FF14]/40 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-3 rounded-full border border-[#39FF14]/20 animate-ping" style={{ animationDuration: "2.5s" }} />
              </div>

              {/* Botao */}
              <div className="relative px-10 py-5 rounded-full bg-black/60 border-2 border-[#39FF14]
                transition-all duration-300 hover:bg-[#39FF14]/20 hover:scale-105 hover:shadow-[0_0_40px_rgba(57,255,20,0.4)]"
                style={{ boxShadow: "0 0 25px rgba(57, 255, 20, 0.3)" }}>
                <span className="text-[#39FF14] font-mono text-lg tracking-wider">
                  LIBERAR ACESSO AO LINK NEURAL
                </span>
              </div>

              {/* Indicador */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                <span className="text-[#39FF14]/50 text-xs font-mono">AGUARDANDO</span>
                <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              </div>
            </button>
          </div>
        )}

        {/* Texto durante circuitos */}
        {phase === "circuits" && (
          <div className="mt-16 text-center" onClick={handleUserInteraction}>
            <h2 className="text-3xl md:text-4xl font-bold text-[#39FF14] animate-pulse"
                style={{ textShadow: "0 0 30px rgba(57, 255, 20, 0.8)" }}>
              {showStandbyMessage ? "AGUARDANDO COMANDO" : "LINK NEURAL ESTABELECIDO"}
            </h2>
            <p className="text-[#39FF14]/60 font-mono mt-3">
              {showStandbyMessage ? "Diga \"Jarvis\" para ativar..." : "Sincronizando sistemas..."}
            </p>
            {showStandbyMessage && (
              <button
                onClick={handleUserInteraction}
                className="mt-6 px-6 py-2 border border-[#39FF14]/50 rounded-full text-[#39FF14]/70 font-mono text-sm hover:bg-[#39FF14]/10 transition-all"
              >
                CLIQUE PARA CONTINUAR
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vinheta */}
      <div className="fixed inset-0 pointer-events-none z-30"
           style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)" }} />
    </div>
  );
}
