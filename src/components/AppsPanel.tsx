"use client";

import { useState, useEffect } from "react";

interface App {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  color?: string;
}

interface AppsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Apps salvos em localStorage
const STORAGE_KEY = "jarvis_apps";

export default function AppsPanel({ isOpen, onClose }: AppsPanelProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({ name: "", url: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Carregar apps do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setApps(JSON.parse(saved));
      } catch {
        setApps([]);
      }
    }
  }, []);

  // Salvar apps no localStorage
  const saveApps = (newApps: App[]) => {
    setApps(newApps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newApps));
  };

  // Adicionar novo app
  const handleAddApp = () => {
    if (!newApp.name.trim() || !newApp.url.trim()) return;

    const app: App = {
      id: Date.now().toString(),
      name: newApp.name.trim(),
      url: newApp.url.startsWith("http") ? newApp.url : `https://${newApp.url}`,
      description: newApp.description.trim(),
      color: getRandomColor(),
    };

    saveApps([...apps, app]);
    setNewApp({ name: "", url: "", description: "" });
    setIsAdding(false);
  };

  // Remover app
  const handleRemoveApp = (id: string) => {
    saveApps(apps.filter(app => app.id !== id));
  };

  // Abrir app
  const handleOpenApp = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Gerar cor aleatoria
  const getRandomColor = () => {
    const colors = [
      "from-emerald-500/20 to-emerald-900/20",
      "from-cyan-500/20 to-cyan-900/20",
      "from-blue-500/20 to-blue-900/20",
      "from-purple-500/20 to-purple-900/20",
      "from-pink-500/20 to-pink-900/20",
      "from-amber-500/20 to-amber-900/20",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Gerar icone baseado no nome
  const getAppIcon = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return firstLetter;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0a0a0a] border border-[#39FF14]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39FF14]/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <h2 className="text-[#39FF14] text-xl font-bold">MEUS APPS</h2>
              <p className="text-[#39FF14]/50 text-sm font-mono">Suas ferramentas vinculadas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#39FF14]/10 border border-[#39FF14]/50 rounded-lg text-[#39FF14] font-mono text-sm hover:bg-[#39FF14]/20 transition-all"
            >
              <span>+</span>
              <span>ADICIONAR APP</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/10 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Formulario de adicao */}
          {isAdding && (
            <div className="mb-6 p-4 bg-black/50 border border-[#39FF14]/30 rounded-xl">
              <h3 className="text-[#39FF14] font-mono mb-4">Novo App</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do App"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  className="px-4 py-3 bg-black/60 border border-[#39FF14]/30 rounded-lg text-white font-mono focus:border-[#39FF14] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="URL (ex: https://meuapp.com)"
                  value={newApp.url}
                  onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                  className="px-4 py-3 bg-black/60 border border-[#39FF14]/30 rounded-lg text-white font-mono focus:border-[#39FF14] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Descricao (opcional)"
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  className="md:col-span-2 px-4 py-3 bg-black/60 border border-[#39FF14]/30 rounded-lg text-white font-mono focus:border-[#39FF14] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewApp({ name: "", url: "", description: "" });
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddApp}
                  disabled={!newApp.name.trim() || !newApp.url.trim()}
                  className="px-4 py-2 bg-[#39FF14]/20 border border-[#39FF14] rounded-lg text-[#39FF14] hover:bg-[#39FF14]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Grid de Apps */}
          {apps.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-30">📱</div>
              <p className="text-[#39FF14]/50 font-mono">Nenhum app cadastrado</p>
              <p className="text-gray-600 text-sm mt-2">Clique em "Adicionar App" para comecar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className={`group relative bg-gradient-to-br ${app.color || "from-emerald-500/20 to-emerald-900/20"} border border-[#39FF14]/30 rounded-xl overflow-hidden hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.2)] transition-all cursor-pointer`}
                  onClick={() => handleOpenApp(app.url)}
                >
                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39FF14]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  <div className="relative p-5">
                    {/* Icone */}
                    <div className="w-14 h-14 rounded-xl bg-[#39FF14]/20 border border-[#39FF14]/30 flex items-center justify-center mb-4">
                      <span className="text-[#39FF14] text-2xl font-bold">{getAppIcon(app.name)}</span>
                    </div>

                    {/* Info */}
                    <h3 className="text-white font-bold text-lg mb-1 group-hover:text-[#39FF14] transition-colors">
                      {app.name}
                    </h3>
                    {app.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{app.description}</p>
                    )}
                    <p className="text-[#39FF14]/50 text-xs font-mono truncate">{app.url}</p>

                    {/* Botao de remover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveApp(app.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all flex items-center justify-center"
                    >
                      ✕
                    </button>

                    {/* Indicador de link externo */}
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-[#39FF14]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-4 h-4 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
