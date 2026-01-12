"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [circuitAnimation, setCircuitAnimation] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carregar audio pre-gravado via API com cache
  useEffect(() => {
    const loadWelcomeAudio = async () => {
      try {
        // Usar API que faz cache do audio
        const response = await fetch("/api/welcome-audio");

        if (response.ok) {
          const contentType = response.headers.get("content-type");

          if (contentType?.includes("audio")) {
            // Audio retornado com sucesso
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(audioUrl);
            console.log("🎵 Audio de boas-vindas carregado");
          } else {
            // Fallback response (JSON)
            console.log("⚠️ Usando fallback sem audio");
          }
        }
        setAudioLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar audio:", error);
        setAudioLoaded(true); // Continuar mesmo sem audio
      }
    };

    loadWelcomeAudio();

    // Mostrar botao apos delay
    const timer = setTimeout(() => setShowButton(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Tocar audio de boas-vindas
  const playWelcomeAudio = useCallback(async () => {
    if (!audioRef.current || isPlaying) return;

    setIsPlaying(true);
    audioRef.current.volume = 0.8;

    try {
      await audioRef.current.play();
    } catch (error) {
      console.error("Erro ao tocar audio:", error);
    }
  }, [isPlaying]);

  // Animacao de circuitos eletricos no canvas
  useEffect(() => {
    if (!circuitAnimation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface CircuitLine {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
      width: number;
      branches: CircuitLine[];
      opacity: number;
    }

    const circuits: CircuitLine[] = [];
    const maxCircuits = 30;

    // Criar circuito inicial
    const createCircuit = (startX?: number, startY?: number): CircuitLine => {
      const x = startX ?? Math.random() * canvas.width;
      const y = startY ?? Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const length = 100 + Math.random() * 200;

      return {
        x,
        y,
        targetX: x + Math.cos(angle) * length,
        targetY: y + Math.sin(angle) * length,
        progress: 0,
        speed: 0.02 + Math.random() * 0.03,
        width: 1 + Math.random() * 2,
        branches: [],
        opacity: 0.3 + Math.random() * 0.7,
      };
    };

    // Inicializar circuitos
    for (let i = 0; i < maxCircuits; i++) {
      circuits.push(createCircuit());
    }

    let animationId: number;
    let completionTimer: number | null = null;

    const draw = () => {
      // Fundo com fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      circuits.forEach((circuit, index) => {
        if (circuit.progress >= 1) {
          // Criar novo circuito quando terminar
          circuits[index] = createCircuit();
          return;
        }

        // Calcular posicao atual
        const currentX = circuit.x + (circuit.targetX - circuit.x) * circuit.progress;
        const currentY = circuit.y + (circuit.targetY - circuit.y) * circuit.progress;

        // Desenhar linha do circuito
        ctx.beginPath();
        ctx.moveTo(circuit.x, circuit.y);
        ctx.lineTo(currentX, currentY);

        // Gradiente para efeito de energia
        const gradient = ctx.createLinearGradient(circuit.x, circuit.y, currentX, currentY);
        gradient.addColorStop(0, `rgba(57, 255, 20, ${circuit.opacity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(57, 255, 20, ${circuit.opacity})`);
        gradient.addColorStop(1, `rgba(57, 255, 20, ${circuit.opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = circuit.width;
        ctx.lineCap = "round";
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Desenhar ponto de energia na ponta
        ctx.beginPath();
        ctx.arc(currentX, currentY, circuit.width + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(57, 255, 20, ${circuit.opacity})`;
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Criar ramificacoes aleatorias
        if (circuit.progress > 0.3 && Math.random() > 0.995 && circuit.branches.length < 2) {
          const branch = createCircuit(currentX, currentY);
          branch.width = circuit.width * 0.6;
          branch.opacity = circuit.opacity * 0.7;
          circuit.branches.push(branch);
        }

        // Atualizar progresso
        circuit.progress += circuit.speed;

        // Desenhar branches
        circuit.branches.forEach((branch) => {
          if (branch.progress >= 1) return;

          const branchX = branch.x + (branch.targetX - branch.x) * branch.progress;
          const branchY = branch.y + (branch.targetY - branch.y) * branch.progress;

          ctx.beginPath();
          ctx.moveTo(branch.x, branch.y);
          ctx.lineTo(branchX, branchY);
          ctx.strokeStyle = `rgba(57, 255, 20, ${branch.opacity})`;
          ctx.lineWidth = branch.width;
          ctx.stroke();

          branch.progress += branch.speed;
        });
      });

      // Adicionar nos de conexao aleatorios
      if (Math.random() > 0.95) {
        const nodeX = Math.random() * canvas.width;
        const nodeY = Math.random() * canvas.height;

        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(57, 255, 20, 0.8)";
        ctx.shadowColor = "#39FF14";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Completar apos 4 segundos
    completionTimer = window.setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      cancelAnimationFrame(animationId);
      if (completionTimer) clearTimeout(completionTimer);
    };
  }, [circuitAnimation, onComplete]);

  // Handler do botao
  const handleActivate = async () => {
    setIsActivating(true);

    // Tocar audio
    await playWelcomeAudio();

    // Aguardar um pouco e iniciar animacao de circuitos
    setTimeout(() => {
      setCircuitAnimation(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Canvas para animacao de circuitos */}
      {circuitAnimation && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10"
        />
      )}

      {/* Particulas de fundo */}
      {!circuitAnimation && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#39FF14]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Conteudo principal */}
      <div className={`relative z-20 text-center transition-all duration-1000 ${circuitAnimation ? 'opacity-0 scale-90' : 'opacity-100'}`}>
        {/* Logo JARVIS grande */}
        <div className="mb-8">
          <h1
            className="text-7xl md:text-9xl font-bold text-[#39FF14] tracking-widest animate-pulse"
            style={{
              textShadow: "0 0 30px rgba(57, 255, 20, 0.5), 0 0 60px rgba(57, 255, 20, 0.3), 0 0 100px rgba(57, 255, 20, 0.2)"
            }}
          >
            JARVIS
          </h1>
          <p className="text-[#39FF14]/50 text-sm font-mono tracking-[0.4em] mt-4">
            Just A Rather Very Intelligent System
          </p>
        </div>

        {/* Indicador de audio */}
        {isPlaying && !circuitAnimation && (
          <div className="flex items-center justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-[#39FF14] rounded animate-pulse"
                style={{
                  height: `${12 + Math.random() * 20}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
            <span className="text-[#39FF14]/70 text-sm font-mono ml-3">
              JARVIS falando...
            </span>
          </div>
        )}

        {/* Botao pulsando */}
        {showButton && !isActivating && (
          <button
            onClick={handleActivate}
            disabled={!audioLoaded}
            className="group relative mt-8"
          >
            {/* Aneis pulsantes ao redor do botao */}
            <div className="absolute inset-0 -m-4">
              <div className="absolute inset-0 rounded-full border-2 border-[#39FF14]/30 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-2 rounded-full border border-[#39FF14]/20 animate-ping" style={{ animationDuration: "2.5s" }} />
              <div className="absolute inset-4 rounded-full border border-[#39FF14]/10 animate-ping" style={{ animationDuration: "3s" }} />
            </div>

            {/* Botao principal */}
            <div className={`
              relative px-8 py-4 rounded-full
              bg-gradient-to-r from-[#39FF14]/20 via-[#39FF14]/10 to-[#39FF14]/20
              border-2 border-[#39FF14]
              transition-all duration-300
              hover:bg-[#39FF14]/30 hover:scale-105
              hover:shadow-[0_0_40px_rgba(57,255,20,0.5)]
              active:scale-95
              ${!audioLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
              style={{
                boxShadow: "0 0 20px rgba(57, 255, 20, 0.3), inset 0 0 20px rgba(57, 255, 20, 0.1)"
              }}
            >
              {/* Texto do botao */}
              <span className="text-[#39FF14] font-mono text-lg tracking-wider">
                {audioLoaded ? "LIBERAR ACESSO AO LINK NEURAL" : "CARREGANDO..."}
              </span>

              {/* Efeito de brilho interno */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>

            {/* Indicador pulsante abaixo */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span className="text-[#39FF14]/50 text-xs font-mono">
                AGUARDANDO CONEXAO
              </span>
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            </div>
          </button>
        )}

        {/* Status de ativacao */}
        {isActivating && !circuitAnimation && (
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#39FF14] animate-ping" />
              <span className="text-[#39FF14] font-mono text-lg">
                INICIANDO CONEXAO NEURAL...
              </span>
            </div>
            <div className="w-64 h-1 bg-[#39FF14]/20 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#39FF14] rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        )}
      </div>

      {/* Texto durante animacao de circuitos */}
      {circuitAnimation && (
        <div className="relative z-30 text-center">
          <h2
            className="text-4xl md:text-6xl font-bold text-[#39FF14] animate-pulse"
            style={{ textShadow: "0 0 30px rgba(57, 255, 20, 0.8)" }}
          >
            LINK NEURAL ESTABELECIDO
          </h2>
          <p className="text-[#39FF14]/70 font-mono mt-4 text-lg">
            Sincronizando sistemas...
          </p>
        </div>
      )}

      {/* Vinheta nas bordas */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)"
        }}
      />
    </div>
  );
}
