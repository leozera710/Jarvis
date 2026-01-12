"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Action {
  id: string;
  type: "task" | "automation" | "api_call" | "navigation" | "file_operation" | "system";
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "cancelled" | "error";
  progress?: number;
  startTime: Date;
  endTime?: Date;
  logs: ActionLog[];
  cancellable: boolean;
}

export interface ActionLog {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface ActionContextType {
  actions: Action[];
  currentAction: Action | null;
  isExecuting: boolean;
  isStopped: boolean;
  startAction: (action: Omit<Action, "id" | "startTime" | "logs" | "status">) => string;
  updateAction: (id: string, updates: Partial<Action>) => void;
  addLog: (id: string, message: string, type?: ActionLog["type"]) => void;
  completeAction: (id: string, success?: boolean) => void;
  cancelAction: (id: string) => void;
  stopAllActions: () => void;
  resumeActions: () => void;
  clearHistory: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<Action[]>([]);
  const [isStopped, setIsStopped] = useState(false);

  const currentAction = actions.find(a => a.status === "running") || null;
  const isExecuting = actions.some(a => a.status === "running" || a.status === "pending");

  const startAction = useCallback((actionData: Omit<Action, "id" | "startTime" | "logs" | "status">): string => {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAction: Action = {
      ...actionData,
      id,
      status: isStopped ? "pending" : "running",
      startTime: new Date(),
      logs: [{
        timestamp: new Date(),
        message: `Iniciando: ${actionData.title}`,
        type: "info"
      }],
    };

    setActions(prev => [newAction, ...prev].slice(0, 50)); // Manter ultimas 50 acoes
    return id;
  }, [isStopped]);

  const updateAction = useCallback((id: string, updates: Partial<Action>) => {
    setActions(prev => prev.map(action =>
      action.id === id ? { ...action, ...updates } : action
    ));
  }, []);

  const addLog = useCallback((id: string, message: string, type: ActionLog["type"] = "info") => {
    setActions(prev => prev.map(action => {
      if (action.id === id) {
        return {
          ...action,
          logs: [...action.logs, { timestamp: new Date(), message, type }]
        };
      }
      return action;
    }));
  }, []);

  const completeAction = useCallback((id: string, success = true) => {
    setActions(prev => prev.map(action => {
      if (action.id === id) {
        return {
          ...action,
          status: success ? "completed" : "error",
          endTime: new Date(),
          progress: 100,
          logs: [
            ...action.logs,
            {
              timestamp: new Date(),
              message: success ? "Acao concluida com sucesso" : "Acao falhou",
              type: success ? "success" : "error"
            }
          ]
        };
      }
      return action;
    }));
  }, []);

  const cancelAction = useCallback((id: string) => {
    setActions(prev => prev.map(action => {
      if (action.id === id && action.cancellable) {
        return {
          ...action,
          status: "cancelled",
          endTime: new Date(),
          logs: [
            ...action.logs,
            { timestamp: new Date(), message: "Acao cancelada pelo usuario", type: "warning" }
          ]
        };
      }
      return action;
    }));
  }, []);

  const stopAllActions = useCallback(() => {
    setIsStopped(true);
    setActions(prev => prev.map(action => {
      if (action.status === "running" && action.cancellable) {
        return {
          ...action,
          status: "cancelled",
          endTime: new Date(),
          logs: [
            ...action.logs,
            { timestamp: new Date(), message: "PARADA DE EMERGENCIA - Todas as acoes canceladas", type: "warning" }
          ]
        };
      }
      return action;
    }));
  }, []);

  const resumeActions = useCallback(() => {
    setIsStopped(false);
  }, []);

  const clearHistory = useCallback(() => {
    setActions(prev => prev.filter(a => a.status === "running" || a.status === "pending"));
  }, []);

  return (
    <ActionContext.Provider value={{
      actions,
      currentAction,
      isExecuting,
      isStopped,
      startAction,
      updateAction,
      addLog,
      completeAction,
      cancelAction,
      stopAllActions,
      resumeActions,
      clearHistory,
    }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActions() {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error("useActions must be used within ActionProvider");
  }
  return context;
}
