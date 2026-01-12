"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: Date;
  recurring?: "daily" | "weekly" | "monthly" | null;
  sound?: boolean;
  notified: boolean;
}

interface UseRemindersReturn {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, "id" | "notified">) => void;
  removeReminder: (id: string) => void;
  clearAllReminders: () => void;
  upcomingReminders: Reminder[];
  requestNotificationPermission: () => Promise<boolean>;
  hasNotificationPermission: boolean;
}

export function useReminders(): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar lembretes do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jarvis_reminders");
      if (saved) {
        const parsed = JSON.parse(saved);
        setReminders(parsed.map((r: Reminder) => ({
          ...r,
          time: new Date(r.time),
        })));
      }

      // Verificar permissao de notificacao
      if ("Notification" in window) {
        setHasNotificationPermission(Notification.permission === "granted");
      }
    }
  }, []);

  // Salvar lembretes no localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && reminders.length > 0) {
      localStorage.setItem("jarvis_reminders", JSON.stringify(reminders));
    }
  }, [reminders]);

  // Verificar lembretes a cada minuto
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      setReminders(prev => prev.map(reminder => {
        if (reminder.notified) return reminder;

        const reminderTime = new Date(reminder.time);
        const timeDiff = reminderTime.getTime() - now.getTime();

        // Notificar se esta na hora (margem de 1 minuto)
        if (timeDiff <= 60000 && timeDiff > -60000) {
          // Enviar notificacao
          if (hasNotificationPermission && "Notification" in window) {
            new Notification("JARVIS - Lembrete", {
              body: reminder.title,
              icon: "/jarvis-icon.png",
              tag: reminder.id,
            });
          }

          // Tocar som se habilitado
          if (reminder.sound && audioRef.current) {
            audioRef.current.play().catch(console.error);
          }

          return { ...reminder, notified: true };
        }

        return reminder;
      }));
    };

    // Verificar imediatamente
    checkReminders();

    // Verificar a cada 30 segundos
    checkIntervalRef.current = setInterval(checkReminders, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [hasNotificationPermission]);

  // Solicitar permissao de notificacao
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      setHasNotificationPermission(true);
      return true;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === "granted";
    setHasNotificationPermission(granted);
    return granted;
  }, []);

  // Adicionar lembrete
  const addReminder = useCallback((reminder: Omit<Reminder, "id" | "notified">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      notified: false,
    };

    setReminders(prev => [...prev, newReminder]);
  }, []);

  // Remover lembrete
  const removeReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  // Limpar todos os lembretes
  const clearAllReminders = useCallback(() => {
    setReminders([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("jarvis_reminders");
    }
  }, []);

  // Lembretes proximos (nas proximas 24h)
  const upcomingReminders = reminders
    .filter(r => {
      const now = new Date();
      const reminderTime = new Date(r.time);
      const timeDiff = reminderTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 && !r.notified;
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return {
    reminders,
    addReminder,
    removeReminder,
    clearAllReminders,
    upcomingReminders,
    requestNotificationPermission,
    hasNotificationPermission,
  };
}
