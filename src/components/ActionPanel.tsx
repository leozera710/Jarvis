"use client";

import { useState } from "react";
import { useActions, Action } from "@/context/ActionContext";

function ActionItem({ action }: { action: Action }) {
  const [expanded, setExpanded] = useState(false);
  const { cancelAction } = useActions();

  const statusColors = {
    pending: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    running: "text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/30",
    completed: "text-green-500 bg-green-500/10 border-green-500/30",
    cancelled: "text-orange-500 bg-orange-500/10 border-orange-500/30",
    error: "text-red-500 bg-red-500/10 border-red-500/30",
  };

  const statusLabels = {
    pending: "AGUARDANDO",
    running: "EXECUTANDO",
    completed: "CONCLUIDO",
    cancelled: "CANCELADO",
    error: "ERRO",
  };

  const typeIcons = {
    task: "📋",
    automation: "🤖",
    api_call: "🌐",
    navigation: "🧭",
    file_operation: "📁",
    system: "⚙️",
  };

  return (
    <div className={`border rounded-lg p-3 ${statusColors[action.status]} transition-all`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{typeIcons[action.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-bold truncate">{action.title}</div>
            <div className="text-xs opacity-70 truncate">{action.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-black/20">
            {statusLabels[action.status]}
          </span>
          {action.status === "running" && action.cancellable && (
            <button
              onClick={() => cancelAction(action.id)}
              className="text-red-500 hover:text-red-400 p-1"
              title="Cancelar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      {action.status === "running" && action.progress !== undefined && (
        <div className="mt-2">
          <div className="h-1 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#39FF14] transition-all duration-300"
              style={{ width: `${action.progress}%` }}
            />
          </div>
          <div className="text-[10px] text-right mt-0.5 opacity-70">{action.progress}%</div>
        </div>
      )}

      {/* Indicador de execucao */}
      {action.status === "running" && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-current animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-3 bg-current animate-pulse" style={{ animationDelay: "100ms" }} />
            <span className="w-1 h-2 bg-current animate-pulse" style={{ animationDelay: "200ms" }} />
            <span className="w-1 h-4 bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-[10px] font-mono animate-pulse">Processando...</span>
        </div>
      )}

      {/* Logs expandiveis */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] mt-2 opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {action.logs.length} log(s)
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {action.logs.map((log, i) => (
            <div key={i} className="text-[10px] font-mono flex gap-2">
              <span className="opacity-50">
                {log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className={
                log.type === "error" ? "text-red-400" :
                log.type === "warning" ? "text-yellow-400" :
                log.type === "success" ? "text-green-400" :
                "opacity-70"
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActionPanel() {
  const { actions, currentAction, isExecuting, isStopped, stopAllActions, resumeActions, clearHistory } = useActions();
  const [isOpen, setIsOpen] = useState(false);

  const runningCount = actions.filter(a => a.status === "running").length;
  const pendingCount = actions.filter(a => a.status === "pending").length;

  return (
    <>
      {/* Botao flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full transition-all ${
          isExecuting
            ? "bg-[#39FF14] text-black animate-pulse shadow-[0_0_30px_rgba(57,255,20,0.5)]"
            : isStopped
              ? "bg-red-600 text-white"
              : "bg-[#1a1a1a] border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/10"
        }`}
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          {(runningCount > 0 || pendingCount > 0) && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {runningCount + pendingCount}
            </span>
          )}
        </div>
      </button>

      {/* Painel lateral */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          {/* Painel */}
          <div className="relative w-full max-w-md bg-black/95 border-l border-[#39FF14]/30 h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#39FF14] font-mono text-lg font-bold">MONITOR DE ACOES</h2>
                  <p className="text-[#39FF14]/50 text-xs font-mono">
                    {isExecuting ? `${runningCount} em execucao` : isStopped ? "PARADO" : "Aguardando"}
                  </p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Controles */}
              <div className="flex gap-2 mt-3">
                {isStopped ? (
                  <button
                    onClick={resumeActions}
                    className="flex-1 bg-[#39FF14] text-black font-mono font-bold py-2 rounded-lg hover:bg-[#4dff28] transition-colors"
                  >
                    RETOMAR
                  </button>
                ) : (
                  <button
                    onClick={stopAllActions}
                    className="flex-1 bg-red-600 text-white font-mono font-bold py-2 rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                    PARA JARVIS
                  </button>
                )}
                <button
                  onClick={clearHistory}
                  className="px-4 bg-gray-800 text-gray-400 font-mono py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Limpar historico"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista de acoes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {actions.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 opacity-30">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <p className="font-mono text-sm">Nenhuma acao registrada</p>
                </div>
              ) : (
                actions.map(action => (
                  <ActionItem key={action.id} action={action} />
                ))
              )}
            </div>

            {/* Acao atual destacada */}
            {currentAction && (
              <div className="p-4 border-t border-[#39FF14]/20 bg-[#39FF14]/5">
                <div className="text-[10px] text-[#39FF14]/70 font-mono mb-1">ACAO ATUAL</div>
                <div className="text-[#39FF14] font-mono font-bold">{currentAction.title}</div>
                <div className="text-[#39FF14]/60 text-xs">{currentAction.description}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
