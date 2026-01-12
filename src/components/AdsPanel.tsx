"use client";

import { useState, useEffect, useCallback } from "react";

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft";
  budget: number;
  objective: string;
  metrics?: CampaignMetrics;
}

interface Account {
  id: string;
  name: string;
  status: string;
  campaigns: Campaign[];
  totalSpend: number;
  currency: string;
}

// Interface para dados do UTMify
interface UtmifyData {
  connected: boolean;
  lastSync?: string;
  totalRevenue: number;
  totalConversions: number;
  todayRevenue: number;
  todayConversions: number;
  topSources: { source: string; revenue: number; conversions: number }[];
  recentConversions: { id: string; value: number; source: string; timestamp: string }[];
}

type TabType = "campaigns" | "utmify";

export default function AdsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [adsConfigured, setAdsConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [utmifyData, setUtmifyData] = useState<UtmifyData | null>(null);
  const [utmifyApiKey, setUtmifyApiKey] = useState("");
  const [showUtmifyConfig, setShowUtmifyConfig] = useState(false);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ads?action=accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
      setAdsConfigured(data.adsConfigured);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/ads?action=metrics");
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error("Erro ao carregar metricas:", error);
    }
  }, []);

  // Carregar dados do UTMify
  const loadUtmifyData = useCallback(async () => {
    try {
      const response = await fetch("/api/ads?action=utmify");
      const data = await response.json();
      setUtmifyData(data);
    } catch (error) {
      console.error("Erro ao carregar dados UTMify:", error);
      // Dados de demonstracao
      setUtmifyData({
        connected: false,
        totalRevenue: 45780.50,
        totalConversions: 342,
        todayRevenue: 3250.00,
        todayConversions: 28,
        topSources: [
          { source: "google_cpc", revenue: 18500, conversions: 145 },
          { source: "facebook_ads", revenue: 12300, conversions: 98 },
          { source: "youtube_ads", revenue: 8900, conversions: 67 },
          { source: "native_ads", revenue: 6080.50, conversions: 32 },
        ],
        recentConversions: [
          { id: "conv_001", value: 197.00, source: "google_cpc", timestamp: new Date().toISOString() },
          { id: "conv_002", value: 97.00, source: "facebook_ads", timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: "conv_003", value: 297.00, source: "youtube_ads", timestamp: new Date(Date.now() - 7200000).toISOString() },
        ],
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      loadMetrics();
      loadUtmifyData();
    }
  }, [isOpen, loadAccounts, loadMetrics, loadUtmifyData]);

  const handleCampaignAction = async (action: string, campaignId: string) => {
    try {
      await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, campaignId }),
      });
      await loadAccounts();
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const handleConnectUtmify = async () => {
    if (!utmifyApiKey.trim()) return;
    // Simulacao de conexao
    setUtmifyData(prev => prev ? { ...prev, connected: true, lastSync: new Date().toISOString() } : null);
    setShowUtmifyConfig(false);
    setUtmifyApiKey("");
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl max-h-[90vh] bg-black/95 border border-[#39FF14]/30 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h2 className="text-[#39FF14] font-mono text-xl font-bold">AUTOMACAO ADS</h2>
                <p className="text-[#39FF14]/50 text-xs font-mono">
                  Google Ads + UTMify Integration
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
              onClick={() => setActiveTab("campaigns")}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                activeTab === "campaigns"
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              📈 Campanhas
            </button>
            <button
              onClick={() => setActiveTab("utmify")}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all flex items-center gap-2 ${
                activeTab === "utmify"
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span>💰</span> UTMify
              {utmifyData?.connected && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Tab: Campanhas */}
          {activeTab === "campaigns" && (
            <div className="flex h-full">
              {/* Metricas Gerais no topo */}
              {metrics && (
                <div className="absolute top-32 left-4 right-4 z-10">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-500 text-[10px] font-mono">CONTAS ATIVAS</div>
                      <div className="text-[#39FF14] text-xl font-bold">{metrics.activeAccounts}/{metrics.totalAccounts}</div>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-500 text-[10px] font-mono">CAMPANHAS ATIVAS</div>
                      <div className="text-[#39FF14] text-xl font-bold">{metrics.activeCampaigns}/{metrics.totalCampaigns}</div>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-500 text-[10px] font-mono">GASTO TOTAL</div>
                      <div className="text-[#39FF14] text-xl font-bold">R$ {metrics.totalSpend?.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-500 text-[10px] font-mono">CONVERSOES</div>
                      <div className="text-[#39FF14] text-xl font-bold">{metrics.totalConversions}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Contas */}
              <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto pt-24">
                <div className="text-[#39FF14]/70 text-xs font-mono mb-3">CONTAS</div>
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                      selectedAccount === account.id
                        ? "bg-[#39FF14]/10 border border-[#39FF14]/30"
                        : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{account.name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        account.status === "active" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                      }`}>
                        {account.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-500">{account.campaigns.length} camp.</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Campanhas */}
              <div className="flex-1 p-4 overflow-y-auto pt-24">
                {selectedAccountData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#39FF14] font-mono font-bold">{selectedAccountData.name}</h3>
                      <button className="bg-[#39FF14] text-black text-xs font-mono font-bold px-4 py-2 rounded-lg hover:bg-[#4dff28]">
                        + NOVA CAMPANHA
                      </button>
                    </div>

                    {selectedAccountData.campaigns.map(campaign => (
                      <div key={campaign.id} className={`bg-gray-900/50 rounded-xl p-4 border ${
                        campaign.status === "active" ? "border-green-500/30" :
                        campaign.status === "paused" ? "border-yellow-500/30" :
                        "border-gray-700"
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-white">{campaign.name}</div>
                            <div className="text-xs text-gray-500">
                              {campaign.objective.toUpperCase()} | R$ {campaign.budget}/dia
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              campaign.status === "active" ? "bg-green-900/30 text-green-400" :
                              campaign.status === "paused" ? "bg-yellow-900/30 text-yellow-400" :
                              "bg-gray-700 text-gray-400"
                            }`}>
                              {campaign.status.toUpperCase()}
                            </span>
                            {campaign.status === "active" ? (
                              <button
                                onClick={() => handleCampaignAction("pause_campaign", campaign.id)}
                                className="text-yellow-500 hover:text-yellow-400 text-xs"
                              >
                                Pausar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCampaignAction("activate_campaign", campaign.id)}
                                className="text-green-500 hover:text-green-400 text-xs"
                              >
                                Ativar
                              </button>
                            )}
                          </div>
                        </div>

                        {campaign.metrics && (
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className="text-[10px] text-gray-500">Impressoes</div>
                              <div className="text-white font-mono">{campaign.metrics.impressions.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Cliques</div>
                              <div className="text-white font-mono">{campaign.metrics.clicks.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">CTR</div>
                              <div className="text-white font-mono">{campaign.metrics.ctr}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">ROAS</div>
                              <div className={`font-mono ${campaign.metrics.roas >= 2 ? "text-green-400" : "text-yellow-400"}`}>
                                {campaign.metrics.roas}x
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📊</div>
                      <p className="font-mono">Selecione uma conta para ver as campanhas</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: UTMify */}
          {activeTab === "utmify" && utmifyData && (
            <div className="p-4 overflow-y-auto h-full">
              {/* Header UTMify */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                    💰
                  </div>
                  <div>
                    <h3 className="text-white font-mono font-bold text-lg">UTMify Dashboard</h3>
                    <div className="flex items-center gap-2">
                      {utmifyData.connected ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-green-400 text-xs font-mono">CONECTADO</span>
                          {utmifyData.lastSync && (
                            <span className="text-gray-500 text-xs">
                              • Sync: {new Date(utmifyData.lastSync).toLocaleTimeString()}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-yellow-400 text-xs font-mono">MODO DEMO</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowUtmifyConfig(!showUtmifyConfig)}
                  className="bg-purple-600/20 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-600/30 font-mono text-sm"
                >
                  {utmifyData.connected ? "⚙️ Configurar" : "🔗 Conectar UTMify"}
                </button>
              </div>

              {/* Config Modal */}
              {showUtmifyConfig && (
                <div className="bg-gray-900/80 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <div className="text-purple-400 font-mono text-sm font-bold mb-3">Conectar UTMify</div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={utmifyApiKey}
                      onChange={(e) => setUtmifyApiKey(e.target.value)}
                      placeholder="Cole sua API Key do UTMify..."
                      className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleConnectUtmify}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 font-mono text-sm"
                    >
                      Conectar
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Obtenha sua API Key em: utmify.com.br/configuracoes/api
                  </p>
                </div>
              )}

              {/* Metricas Principais UTMify */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-400/70 text-xs font-mono">RECEITA TOTAL</div>
                  <div className="text-green-400 text-2xl font-bold font-mono">
                    R$ {utmifyData.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-blue-400/70 text-xs font-mono">CONVERSOES TOTAL</div>
                  <div className="text-blue-400 text-2xl font-bold font-mono">
                    {utmifyData.totalConversions}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-purple-400/70 text-xs font-mono">RECEITA HOJE</div>
                  <div className="text-purple-400 text-2xl font-bold font-mono">
                    R$ {utmifyData.todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="text-yellow-400/70 text-xs font-mono">CONVERSOES HOJE</div>
                  <div className="text-yellow-400 text-2xl font-bold font-mono">
                    {utmifyData.todayConversions}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Top Sources */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <div className="text-[#39FF14]/70 text-xs font-mono mb-4">TOP FONTES DE TRAFEGO</div>
                  <div className="space-y-3">
                    {utmifyData.topSources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                            source.source.includes("google") ? "bg-blue-600/20 text-blue-400" :
                            source.source.includes("facebook") ? "bg-blue-800/20 text-blue-300" :
                            source.source.includes("youtube") ? "bg-red-600/20 text-red-400" :
                            "bg-gray-700/20 text-gray-400"
                          }`}>
                            {source.source.includes("google") ? "G" :
                             source.source.includes("facebook") ? "F" :
                             source.source.includes("youtube") ? "Y" : "N"}
                          </span>
                          <div>
                            <div className="text-white text-sm font-medium">{source.source.replace("_", " ").toUpperCase()}</div>
                            <div className="text-gray-500 text-xs">{source.conversions} conversoes</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#39FF14] font-mono font-bold">
                            R$ {source.revenue.toLocaleString("pt-BR")}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {((source.revenue / utmifyData.totalRevenue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversoes Recentes */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <div className="text-[#39FF14]/70 text-xs font-mono mb-4">CONVERSOES RECENTES</div>
                  <div className="space-y-3">
                    {utmifyData.recentConversions.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <div>
                            <div className="text-white text-sm">
                              R$ {conv.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-gray-500 text-xs">{conv.source.replace("_", " ")}</div>
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(conv.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botao Refresh */}
                  <button
                    onClick={loadUtmifyData}
                    className="w-full mt-4 bg-[#39FF14]/10 text-[#39FF14] font-mono text-sm py-2 rounded-lg hover:bg-[#39FF14]/20"
                  >
                    🔄 Atualizar Dados
                  </button>
                </div>
              </div>

              {/* Info */}
              {!utmifyData.connected && (
                <div className="mt-6 bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="text-purple-400 text-sm font-mono">
                    💡 Conecte sua conta UTMify para ver dados reais de conversao e receita.
                    <br />
                    <span className="text-purple-400/70">
                      A integracao permite acompanhar em tempo real todas as vendas atribuidas aos seus anuncios.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!adsConfigured && activeTab === "campaigns" && (
          <div className="p-4 bg-yellow-900/10 border-t border-yellow-500/20">
            <div className="text-yellow-400 text-xs font-mono">
              ⚠️ Para gerenciamento real, configure as credenciais do Google Ads API no .env.local
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
