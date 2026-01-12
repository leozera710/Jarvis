"use client";

import { useState, useEffect, useCallback } from "react";

interface RemoteCommand {
  id: string;
  type: string;
  command: string;
  timestamp: string;
  status: "pending" | "executed" | "failed";
  result?: string;
}

interface Macro {
  id: string;
  name: string;
  voiceTrigger: string;
  commands: Array<{
    type: string;
    command: string;
    delay?: number;
  }>;
  createdAt: string;
}

const QUICK_APPS = [
  { id: "chrome", name: "Chrome", icon: "🌐" },
  { id: "vscode", name: "VS Code", icon: "💻" },
  { id: "spotify", name: "Spotify", icon: "🎵" },
  { id: "explorer", name: "Explorer", icon: "📁" },
  { id: "terminal", name: "Terminal", icon: "⬛" },
  { id: "calculator", name: "Calculadora", icon: "🔢" },
];

const QUICK_URLS = [
  { id: "google", name: "Google", url: "https://www.google.com", icon: "🔍" },
  { id: "youtube", name: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
  { id: "github", name: "GitHub", url: "https://www.github.com", icon: "🐙" },
  { id: "facebook", name: "Facebook", url: "https://www.facebook.com", icon: "👤" },
];

const COMMAND_TYPES = [
  { id: "open_app", name: "Abrir App", icon: "📱" },
  { id: "open_url", name: "Abrir URL", icon: "🌐" },
  { id: "notification", name: "Notificacao", icon: "📢" },
  { id: "volume", name: "Volume", icon: "🔊" },
];

export default function RemoteControlPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [history, setHistory] = useState<RemoteCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [volume, setVolume] = useState(50);
  const [status, setStatus] = useState<{ online: boolean; securityLevel: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"quick" | "macros" | "history">("quick");

  // Estado de Macros
  const [macros, setMacros] = useState<Macro[]>([]);
  const [isCreatingMacro, setIsCreatingMacro] = useState(false);
  const [newMacro, setNewMacro] = useState<Partial<Macro>>({
    name: "",
    voiceTrigger: "",
    commands: [],
  });
  const [editingCommandIndex, setEditingCommandIndex] = useState<number | null>(null);
  const [newCommand, setNewCommand] = useState({ type: "open_app", command: "", delay: 0 });

  // Carregar macros do localStorage
  useEffect(() => {
    const savedMacros = localStorage.getItem("jarvis_macros");
    if (savedMacros) {
      setMacros(JSON.parse(savedMacros));
    }
  }, []);

  // Salvar macros no localStorage
  const saveMacros = (updatedMacros: Macro[]) => {
    setMacros(updatedMacros);
    localStorage.setItem("jarvis_macros", JSON.stringify(updatedMacros));
  };

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/remote?action=status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/remote?action=history");
      const data = await response.json();
      setHistory(data.commands || []);
    } catch (error) {
      console.error("Erro ao carregar historico:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadHistory();
    }
  }, [isOpen, loadStatus, loadHistory]);

  const sendCommand = async (type: string, command: string, params?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, command, params }),
      });
      const data = await response.json();

      if (data.success) {
        await loadHistory();
      }
      return data;
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenApp = (appId: string) => {
    sendCommand("open_app", appId);
  };

  const handleOpenUrl = (url: string) => {
    sendCommand("open_url", url);
  };

  const handleNotification = () => {
    if (notification.trim()) {
      sendCommand("notification", notification);
      setNotification("");
    }
  };

  const handleVolume = (newVolume: number) => {
    setVolume(newVolume);
    sendCommand("volume", newVolume.toString());
  };

  // Funcoes de Macro
  const addCommandToMacro = () => {
    if (!newCommand.command.trim()) return;

    setNewMacro(prev => ({
      ...prev,
      commands: [...(prev.commands || []), { ...newCommand }],
    }));
    setNewCommand({ type: "open_app", command: "", delay: 0 });
  };

  const removeCommandFromMacro = (index: number) => {
    setNewMacro(prev => ({
      ...prev,
      commands: prev.commands?.filter((_, i) => i !== index) || [],
    }));
  };

  const saveMacro = () => {
    if (!newMacro.name?.trim() || !newMacro.voiceTrigger?.trim() || !newMacro.commands?.length) {
      alert("Preencha nome, comando de voz e adicione pelo menos um comando");
      return;
    }

    const macro: Macro = {
      id: `macro_${Date.now()}`,
      name: newMacro.name,
      voiceTrigger: newMacro.voiceTrigger.toLowerCase(),
      commands: newMacro.commands,
      createdAt: new Date().toISOString(),
    };

    saveMacros([...macros, macro]);
    setNewMacro({ name: "", voiceTrigger: "", commands: [] });
    setIsCreatingMacro(false);
  };

  const deleteMacro = (id: string) => {
    saveMacros(macros.filter(m => m.id !== id));
  };

  const executeMacro = async (macro: Macro) => {
    setIsLoading(true);
    for (const cmd of macro.commands) {
      if (cmd.delay) {
        await new Promise(resolve => setTimeout(resolve, cmd.delay));
      }
      await sendCommand(cmd.type, cmd.command);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-black/95 border border-[#39FF14]/30 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🖥️</div>
              <div>
                <h2 className="text-[#39FF14] font-mono text-xl font-bold">CONTROLE REMOTO</h2>
                <p className="text-[#39FF14]/50 text-xs font-mono">
                  {status?.online ? "Sistema Online" : "Conectando..."} | {status?.securityLevel || "..."}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("quick")}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                activeTab === "quick"
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              ACOES RAPIDAS
            </button>
            <button
              onClick={() => setActiveTab("macros")}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                activeTab === "macros"
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              MACROS ({macros.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                activeTab === "history"
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              HISTORICO
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Tab: Acoes Rapidas */}
          {activeTab === "quick" && (
            <div className="space-y-6">
              {/* Apps Rapidos */}
              <div>
                <div className="text-[#39FF14]/70 text-xs font-mono mb-3">ABRIR APLICATIVO</div>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_APPS.map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleOpenApp(app.id)}
                      disabled={isLoading}
                      className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/5 transition-all disabled:opacity-50"
                    >
                      <span className="text-2xl block mb-1">{app.icon}</span>
                      <span className="text-white text-xs font-mono">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URLs Rapidas */}
              <div>
                <div className="text-[#39FF14]/70 text-xs font-mono mb-3">ABRIR SITE</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_URLS.map(site => (
                    <button
                      key={site.id}
                      onClick={() => handleOpenUrl(site.url)}
                      disabled={isLoading}
                      className="bg-gray-900/50 border border-gray-700 rounded-xl p-3 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/5 transition-all disabled:opacity-50"
                    >
                      <span className="text-xl block mb-1">{site.icon}</span>
                      <span className="text-white text-[10px] font-mono">{site.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <div className="text-[#39FF14]/70 text-xs font-mono mb-3">VOLUME DO SISTEMA</div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">🔊</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      onMouseUp={() => handleVolume(volume)}
                      onTouchEnd={() => handleVolume(volume)}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#39FF14]"
                    />
                    <span className="text-white font-mono w-12 text-right">{volume}%</span>
                  </div>
                </div>
              </div>

              {/* Notificacao */}
              <div>
                <div className="text-[#39FF14]/70 text-xs font-mono mb-3">ENVIAR NOTIFICACAO</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={notification}
                    onChange={(e) => setNotification(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNotification()}
                    placeholder="Digite a mensagem..."
                    className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-[#39FF14]"
                  />
                  <button
                    onClick={handleNotification}
                    disabled={isLoading || !notification.trim()}
                    className="bg-[#39FF14] text-black font-mono font-bold px-4 rounded-xl hover:bg-[#4dff28] disabled:opacity-50"
                  >
                    📢
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Macros */}
          {activeTab === "macros" && (
            <div className="space-y-4">
              {/* Botao criar macro */}
              {!isCreatingMacro && (
                <button
                  onClick={() => setIsCreatingMacro(true)}
                  className="w-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] rounded-xl p-4 hover:bg-[#39FF14]/20 transition-all font-mono"
                >
                  + CRIAR NOVA MACRO
                </button>
              )}

              {/* Formulario criar macro */}
              {isCreatingMacro && (
                <div className="bg-gray-900/50 border border-[#39FF14]/30 rounded-xl p-4 space-y-4">
                  <div className="text-[#39FF14] font-mono font-bold mb-2">NOVA MACRO</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-xs font-mono block mb-1">Nome da Macro</label>
                      <input
                        type="text"
                        value={newMacro.name || ""}
                        onChange={(e) => setNewMacro(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Modo Trabalho"
                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs font-mono block mb-1">Comando de Voz</label>
                      <input
                        type="text"
                        value={newMacro.voiceTrigger || ""}
                        onChange={(e) => setNewMacro(prev => ({ ...prev, voiceTrigger: e.target.value }))}
                        placeholder="Ex: ativar modo trabalho"
                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                      />
                    </div>
                  </div>

                  {/* Lista de comandos da macro */}
                  <div>
                    <div className="text-gray-400 text-xs font-mono mb-2">
                      Comandos ({newMacro.commands?.length || 0})
                    </div>
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {newMacro.commands?.map((cmd, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                          <span className="text-[#39FF14] text-xs font-mono">{idx + 1}.</span>
                          <span className="text-gray-400 text-xs">{cmd.type}</span>
                          <span className="text-white text-xs flex-1">{cmd.command}</span>
                          {cmd.delay ? (
                            <span className="text-yellow-400 text-xs">{cmd.delay}ms</span>
                          ) : null}
                          <button
                            onClick={() => removeCommandFromMacro(idx)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar comando */}
                    <div className="flex gap-2">
                      <select
                        value={newCommand.type}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-black/50 border border-gray-700 rounded-lg px-2 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                      >
                        {COMMAND_TYPES.map(ct => (
                          <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newCommand.command}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, command: e.target.value }))}
                        placeholder={newCommand.type === "open_url" ? "https://..." : "Nome do app/comando"}
                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                      />
                      <input
                        type="number"
                        value={newCommand.delay}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                        placeholder="Delay (ms)"
                        className="w-24 bg-black/50 border border-gray-700 rounded-lg px-2 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                      />
                      <button
                        onClick={addCommandToMacro}
                        disabled={!newCommand.command.trim()}
                        className="bg-[#39FF14] text-black px-3 rounded-lg font-bold disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Botoes */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setIsCreatingMacro(false);
                        setNewMacro({ name: "", voiceTrigger: "", commands: [] });
                      }}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-lg font-mono text-sm hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveMacro}
                      className="flex-1 bg-[#39FF14] text-black py-2 rounded-lg font-mono font-bold text-sm hover:bg-[#4dff28]"
                    >
                      Salvar Macro
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de macros existentes */}
              {macros.length === 0 && !isCreatingMacro && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="font-mono text-sm">Nenhuma macro criada</p>
                  <p className="font-mono text-xs mt-1">Crie sequencias de comandos para executar por voz</p>
                </div>
              )}

              {macros.map(macro => (
                <div key={macro.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-white font-mono font-bold">{macro.name}</div>
                      <div className="text-[#39FF14] text-xs font-mono mt-1">
                        🎤 &quot;{macro.voiceTrigger}&quot;
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeMacro(macro)}
                        disabled={isLoading}
                        className="bg-[#39FF14] text-black px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#4dff28] disabled:opacity-50"
                      >
                        ▶ Executar
                      </button>
                      <button
                        onClick={() => deleteMacro(macro.id)}
                        className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs hover:bg-red-500/30"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {macro.commands.map((cmd, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{idx + 1}.</span>
                        <span className="text-gray-400">{cmd.type}:</span>
                        <span className="text-white">{cmd.command}</span>
                        {cmd.delay ? (
                          <span className="text-yellow-400 ml-auto">+{cmd.delay}ms</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Historico */}
          {activeTab === "history" && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="font-mono text-sm">Nenhum comando executado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {history.slice().reverse().slice(0, 20).map(cmd => (
                    <div key={cmd.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-mono ${
                          cmd.status === "executed" ? "text-green-400" :
                          cmd.status === "failed" ? "text-red-400" :
                          "text-yellow-400"
                        }`}>
                          {cmd.type.toUpperCase()}
                        </span>
                        <span className="text-white text-sm ml-2">{cmd.command}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        cmd.status === "executed" ? "bg-green-900/30 text-green-400" :
                        cmd.status === "failed" ? "bg-red-900/30 text-red-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {cmd.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-yellow-900/10 border-t border-yellow-500/20">
          <div className="text-yellow-400 text-xs font-mono">
            ⚠️ Para execucao real, configure um agente local. Macros podem ser ativadas por comando de voz.
          </div>
        </div>
      </div>
    </div>
  );
}
