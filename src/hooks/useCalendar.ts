"use client";

import { useState, useCallback } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  fetchEvents: (action?: "today" | "week") => Promise<void>;
  createEvent: (event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
  }) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  getTodaySummary: () => string;
}

export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar autenticacao OAuth
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calendar?action=auth");
      const data = await response.json();

      if (data.authUrl) {
        // Abrir janela de autenticacao
        window.location.href = data.authUrl;
      } else {
        setError("Erro ao obter URL de autenticacao");
      }
    } catch (err) {
      setError("Erro ao iniciar autenticacao");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar eventos
  const fetchEvents = useCallback(async (action: "today" | "week" = "week") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar?action=${action}`);
      const data = await response.json();

      if (data.authenticated === false) {
        setIsAuthenticated(false);
        setEvents([]);
        return;
      }

      setIsAuthenticated(true);
      setEvents(data.events || []);
    } catch (err) {
      setError("Erro ao buscar eventos");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Criar evento
  const createEvent = useCallback(async (event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
  }): Promise<CalendarEvent | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar eventos
        await fetchEvents();
        return data.event;
      } else {
        setError(data.error || "Erro ao criar evento");
        return null;
      }
    } catch (err) {
      setError("Erro ao criar evento");
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents]);

  // Deletar evento
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar?eventId=${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar eventos
        await fetchEvents();
        return true;
      } else {
        setError(data.error || "Erro ao deletar evento");
        return false;
      }
    } catch (err) {
      setError("Erro ao deletar evento");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents]);

  // Gerar resumo do dia
  const getTodaySummary = useCallback((): string => {
    if (events.length === 0) {
      return "Voce nao tem compromissos para hoje, senhor.";
    }

    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || "");
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    if (todayEvents.length === 0) {
      return "Voce nao tem compromissos para hoje, senhor.";
    }

    let summary = `Voce tem ${todayEvents.length} compromisso${todayEvents.length > 1 ? "s" : ""} para hoje:\n\n`;

    todayEvents.forEach((event, index) => {
      const time = event.start.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Dia inteiro";
      summary += `${index + 1}. ${time} - ${event.summary}\n`;
    });

    return summary;
  }, [events]);

  return {
    events,
    isLoading,
    isAuthenticated,
    error,
    authenticate,
    fetchEvents,
    createEvent,
    deleteEvent,
    getTodaySummary,
  };
}
