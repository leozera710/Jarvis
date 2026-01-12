"use client";

import { useState, useCallback } from "react";

interface AdCreative {
  id: string;
  type: "image" | "video" | "carousel";
  url: string;
  thumbnail?: string;
}

interface SpyOffer {
  id: string;
  advertiser: string;
  platform: "google" | "youtube" | "facebook" | "instagram" | "tiktok";
  headline: string;
  description: string;
  callToAction: string;
  landingPage?: string;
  creatives: AdCreative[];
  startDate?: string;
  isActive: boolean;
  estimatedSpend?: string;
  tags: string[];
  analysisNotes?: string;
}

interface ClonedStructure {
  campaign: {
    name: string;
    objective: string;
    status: string;
  };
  adSet: {
    name: string;
    targeting: object;
    budget: object;
  };
  ad: {
    name: string;
    creative: object;
  };
  notes: string[];
}

// Interface para monitoramento diario
export interface DailySnapshot {
  date: string;
  activeAdsCount: number;
  activePagesCount: number;
  uniqueDomains: string[];
  adsLinks: string[];
  landingPages: { url: string; domain: string }[];
}

export interface MonitoredOffer {
  id: string;
  name: string;
  advertiser: string;
  platform: string;
  startDate: string;
  lastChecked: string;
  history: DailySnapshot[];
  currentSnapshot: DailySnapshot;
}

interface UseSpyReturn {
  offers: SpyOffer[];
  searchResults: SpyOffer[];
  monitoredOffers: MonitoredOffer[];
  isLoading: boolean;
  error: string | null;
  clonedStructure: ClonedStructure | null;
  searchOffers: (query: string) => Promise<void>;
  saveOffer: (offer: Partial<SpyOffer>) => Promise<void>;
  cloneOffer: (offer: SpyOffer, budget?: number) => Promise<ClonedStructure | null>;
  removeOffer: (id: string) => Promise<void>;
  analyzeUrl: (url: string) => Promise<object | null>;
  loadSavedOffers: () => Promise<void>;
  addToMonitoring: (offer: SpyOffer) => void;
  removeFromMonitoring: (id: string) => void;
  loadMonitoredOffers: () => void;
  refreshMonitoring: (id: string) => void;
}

// Helper para extrair dominio de URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Helper para gerar dados de monitoramento simulados
function generateMockSnapshot(baseAds: number, basePages: number): DailySnapshot {
  const variance = () => Math.floor(Math.random() * 5) - 2; // -2 to +2
  const adsCount = Math.max(1, baseAds + variance());
  const pagesCount = Math.max(1, basePages + variance());

  const domains = [
    "oferta-especial.com",
    "promocao-hoje.com.br",
    "compre-agora.net",
    "desconto-exclusivo.com",
  ].slice(0, Math.min(pagesCount, 4));

  const landingPages = domains.map(domain => ({
    url: `https://${domain}/lp/oferta`,
    domain
  }));

  return {
    date: new Date().toISOString().split("T")[0],
    activeAdsCount: adsCount,
    activePagesCount: pagesCount,
    uniqueDomains: domains,
    adsLinks: Array.from({ length: adsCount }, (_, i) =>
      `https://ads.google.com/transparency/advertiser/AD${Date.now()}${i}`
    ),
    landingPages
  };
}

// Helper para gerar historico
function generateMockHistory(days: number): DailySnapshot[] {
  const history: DailySnapshot[] = [];
  const baseAds = Math.floor(Math.random() * 10) + 5;
  const basePages = Math.floor(Math.random() * 4) + 2;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    history.push({
      ...generateMockSnapshot(baseAds, basePages),
      date: date.toISOString().split("T")[0]
    });
  }

  return history;
}

export function useSpy(): UseSpyReturn {
  const [offers, setOffers] = useState<SpyOffer[]>([]);
  const [searchResults, setSearchResults] = useState<SpyOffer[]>([]);
  const [monitoredOffers, setMonitoredOffers] = useState<MonitoredOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clonedStructure, setClonedStructure] = useState<ClonedStructure | null>(null);

  // Buscar ofertas
  const searchOffers = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spy?action=search&query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      setError("Erro ao buscar ofertas");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar oferta para monitorar
  const saveOffer = useCallback(async (offer: Partial<SpyOffer>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", offer }),
      });
      const data = await response.json();

      if (data.success) {
        setOffers(prev => [...prev, data.offer]);
      } else {
        setError(data.error || "Erro ao salvar oferta");
      }
    } catch (err) {
      setError("Erro ao salvar oferta");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clonar estrutura de oferta
  const cloneOffer = useCallback(async (offer: SpyOffer, budget = 50): Promise<ClonedStructure | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clone",
          offer,
          cloneConfig: { budget },
        }),
      });
      const data = await response.json();

      if (data.success) {
        setClonedStructure(data.structure);
        return data.structure;
      } else {
        setError(data.error || "Erro ao clonar oferta");
        return null;
      }
    } catch (err) {
      setError("Erro ao clonar oferta");
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remover oferta do monitoramento
  const removeOffer = useCallback(async (id: string) => {
    try {
      await fetch(`/api/spy?id=${id}`, { method: "DELETE" });
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError("Erro ao remover oferta");
      console.error(err);
    }
  }, []);

  // Analisar URL de anuncio
  const analyzeUrl = useCallback(async (url: string): Promise<object | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spy?action=analyze&url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return null;
      }

      return data;
    } catch (err) {
      setError("Erro ao analisar URL");
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar ofertas salvas
  const loadSavedOffers = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/spy?action=list");
      const data = await response.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Adicionar oferta ao monitoramento diario
  const addToMonitoring = useCallback((offer: SpyOffer) => {
    const history = generateMockHistory(7);
    const currentSnapshot = generateMockSnapshot(
      history[history.length - 1]?.activeAdsCount || 5,
      history[history.length - 1]?.activePagesCount || 3
    );

    const monitored: MonitoredOffer = {
      id: `mon_${Date.now()}`,
      name: offer.headline,
      advertiser: offer.advertiser,
      platform: offer.platform,
      startDate: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      history,
      currentSnapshot
    };

    setMonitoredOffers(prev => {
      const updated = [...prev, monitored];
      localStorage.setItem("jarvis_monitored_offers", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remover do monitoramento
  const removeFromMonitoring = useCallback((id: string) => {
    setMonitoredOffers(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem("jarvis_monitored_offers", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Carregar ofertas monitoradas do localStorage
  const loadMonitoredOffers = useCallback(() => {
    try {
      const saved = localStorage.getItem("jarvis_monitored_offers");
      if (saved) {
        setMonitoredOffers(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Erro ao carregar monitoramento:", err);
    }
  }, []);

  // Atualizar monitoramento de uma oferta
  const refreshMonitoring = useCallback((id: string) => {
    setMonitoredOffers(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const newSnapshot = generateMockSnapshot(
            m.currentSnapshot.activeAdsCount,
            m.currentSnapshot.activePagesCount
          );

          // Adicionar snapshot atual ao historico se for de um dia diferente
          const lastHistoryDate = m.history[m.history.length - 1]?.date;
          const today = new Date().toISOString().split("T")[0];

          const newHistory = lastHistoryDate !== today
            ? [...m.history, m.currentSnapshot].slice(-30) // Manter ultimos 30 dias
            : m.history;

          return {
            ...m,
            lastChecked: new Date().toISOString(),
            history: newHistory,
            currentSnapshot: newSnapshot
          };
        }
        return m;
      });

      localStorage.setItem("jarvis_monitored_offers", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    offers,
    searchResults,
    monitoredOffers,
    isLoading,
    error,
    clonedStructure,
    searchOffers,
    saveOffer,
    cloneOffer,
    removeOffer,
    analyzeUrl,
    loadSavedOffers,
    addToMonitoring,
    removeFromMonitoring,
    loadMonitoredOffers,
    refreshMonitoring,
  };
}

export type { SpyOffer, ClonedStructure };
