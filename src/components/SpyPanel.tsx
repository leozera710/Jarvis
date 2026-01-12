"use client";

import { useState, useEffect } from "react";
import { useSpy, MonitoredOffer } from "@/hooks/useSpy";

type Platform = "google" | "youtube" | "facebook" | "all";
type TabType = "search" | "monitoring" | "saved" | "clone";

export default function SpyPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("google");
  const [expandedMonitor, setExpandedMonitor] = useState<string | null>(null);

  const {
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
    loadSavedOffers,
    addToMonitoring,
    removeFromMonitoring,
    loadMonitoredOffers,
    refreshMonitoring,
  } = useSpy();

  useEffect(() => {
    if (isOpen) {
      loadSavedOffers();
      loadMonitoredOffers();
    }
  }, [isOpen, loadSavedOffers, loadMonitoredOffers]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchOffers(searchQuery + `&platform=${selectedPlatform}`);
    }
  };

  const handleClone = async (offer: typeof searchResults[0]) => {
    await cloneOffer(offer, 50);
    setActiveTab("clone");
  };

  const openTransparencyLink = (platform: string) => {
    const links: Record<string, string> = {
      google: "https://adstransparency.google.com/",
      youtube: "https://adstransparency.google.com/?region=BR&format=VIDEO",
      facebook: "https://www.facebook.com/ads/library",
    };
    window.open(links[platform] || links.google, "_blank");
  };

  const getPlatformBadge = (platform: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      google: { bg: "bg-blue-600/30", text: "text-blue-400", label: "GOOGLE ADS" },
      youtube: { bg: "bg-red-600/30", text: "text-red-400", label: "YOUTUBE" },
      facebook: { bg: "bg-blue-800/30", text: "text-blue-300", label: "FACEBOOK" },
      instagram: { bg: "bg-pink-600/30", text: "text-pink-400", label: "INSTAGRAM" },
      tiktok: { bg: "bg-gray-600/30", text: "text-gray-300", label: "TIKTOK" },
    };
    return badges[platform] || badges.google;
  };

  // Calcular variacao percentual
  const calcVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Renderizar grafico simples de barras para historico
  const renderMiniChart = (monitored: MonitoredOffer) => {
    const maxAds = Math.max(...monitored.history.map(h => h.activeAdsCount), 1);
    return (
      <div className="flex items-end gap-1 h-12">
        {monitored.history.slice(-7).map((snapshot, i) => (
          <div
            key={i}
            className="flex-1 bg-[#39FF14]/60 rounded-t hover:bg-[#39FF14] transition-colors cursor-pointer group relative"
            style={{ height: `${(snapshot.activeAdsCount / maxAds) * 100}%`, minHeight: "4px" }}
            title={`${snapshot.date}: ${snapshot.activeAdsCount} anuncios`}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[#39FF14] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {snapshot.date.split("-").slice(1).join("/")}
              <br />{snapshot.activeAdsCount} ads
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] bg-black/95 border border-[#39FF14]/30 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔍</div>
              <div>
                <h2 className="text-[#39FF14] font-mono text-xl font-bold">SPY DE ANUNCIOS</h2>
                <p className="text-[#39FF14]/50 text-xs font-mono">Google Ads • YouTube Ads • Facebook Ads</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Platform Selector */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { id: "google", label: "GOOGLE ADS", color: "blue-600" },
              { id: "youtube", label: "YOUTUBE", color: "red-600" },
              { id: "facebook", label: "FACEBOOK", color: "blue-800" },
              { id: "all", label: "🌐 TODOS", color: "[#39FF14]" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id as Platform)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  selectedPlatform === p.id
                    ? `bg-${p.color} text-white font-bold`
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: "search", icon: "🔍", label: "Buscar" },
              { id: "monitoring", icon: "📊", label: "Monitoramento" },
              { id: "saved", icon: "📁", label: "Salvos" },
              { id: "clone", icon: "📋", label: "Clonado" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-[#39FF14] text-black font-bold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
                {tab.id === "monitoring" && monitoredOffers.length > 0 && (
                  <span className="ml-2 bg-black/30 px-2 py-0.5 rounded text-xs">
                    {monitoredOffers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Tab: Search */}
          {activeTab === "search" && (
            <div className="space-y-4">
              {/* Quick Access */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "google", label: "Google Transparency", color: "blue-600" },
                  { id: "youtube", label: "YouTube Ads", color: "red-600" },
                  { id: "facebook", label: "Facebook Ad Library", color: "blue-800" },
                ].map(link => (
                  <button
                    key={link.id}
                    onClick={() => openTransparencyLink(link.id)}
                    className={`flex items-center justify-center gap-2 bg-${link.color}/20 border border-${link.color}/40 rounded-xl px-4 py-3 text-${link.color.replace("-600", "-400").replace("-800", "-300")} hover:bg-${link.color}/30 transition-all`}
                  >
                    <span className="font-mono text-xs">{link.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={`Buscar anunciantes no ${selectedPlatform === "all" ? "todas plataformas" : selectedPlatform}...`}
                  className="flex-1 bg-black/50 border border-[#39FF14]/30 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-[#39FF14]"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-[#39FF14] text-black font-mono font-bold px-6 py-3 rounded-xl hover:bg-[#4dff28] disabled:opacity-50"
                >
                  {isLoading ? "..." : "BUSCAR"}
                </button>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[#39FF14]/70 text-xs font-mono">
                    {searchResults.length} RESULTADO(S)
                  </div>
                  {searchResults.map((offer) => {
                    const badge = getPlatformBadge(offer.platform);
                    return (
                      <div key={offer.id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-[#39FF14]/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#39FF14] font-mono text-sm font-bold">{offer.advertiser}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                              {offer.isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-400">ATIVO</span>
                              )}
                            </div>
                            <h3 className="text-white font-medium mb-1">{offer.headline}</h3>
                            <p className="text-gray-400 text-sm">{offer.description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => addToMonitoring(offer)}
                              className="text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-lg"
                              title="Adicionar ao Monitoramento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => saveOffer(offer)}
                              className="text-[#39FF14] hover:bg-[#39FF14]/10 p-2 rounded-lg"
                              title="Salvar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleClone(offer)}
                              className="bg-[#FF3939] text-white p-2 rounded-lg hover:bg-red-500"
                              title="CLONA!"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Monitoring */}
          {activeTab === "monitoring" && (
            <div className="space-y-4">
              <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl p-4">
                <div className="text-[#39FF14] font-mono text-sm font-bold mb-2">📊 MONITORAMENTO DIARIO</div>
                <p className="text-[#39FF14]/70 text-sm">
                  Acompanhe a evolucao diaria de anuncios ativos, paginas de destino e dominios unicos.
                  O sistema mostra apenas dominios diferentes (mesmo que o conteudo final seja similar).
                </p>
              </div>

              {monitoredOffers.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="font-mono">Nenhuma oferta em monitoramento</p>
                  <p className="text-sm mt-2">Busque ofertas e clique no icone de grafico para monitorar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monitoredOffers.map((monitored) => {
                    const badge = getPlatformBadge(monitored.platform);
                    const yesterday = monitored.history[monitored.history.length - 1];
                    const adsVariation = yesterday ? calcVariation(monitored.currentSnapshot.activeAdsCount, yesterday.activeAdsCount) : 0;
                    const pagesVariation = yesterday ? calcVariation(monitored.currentSnapshot.activePagesCount, yesterday.activePagesCount) : 0;
                    const isExpanded = expandedMonitor === monitored.id;

                    return (
                      <div key={monitored.id} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                        {/* Header */}
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                          onClick={() => setExpandedMonitor(isExpanded ? null : monitored.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                              <span className="text-white font-medium">{monitored.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-[#39FF14] font-mono text-lg font-bold">
                                  {monitored.currentSnapshot.activeAdsCount} ads
                                </div>
                                <div className={`text-xs ${adsVariation >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {adsVariation >= 0 ? "▲" : "▼"} {Math.abs(adsVariation)}% vs ontem
                                </div>
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </div>

                          {/* Mini chart sempre visivel */}
                          <div className="mt-3">
                            {renderMiniChart(monitored)}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-800 p-4 space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-black/50 rounded-lg p-3">
                                <div className="text-gray-500 text-xs font-mono">ANUNCIOS ATIVOS</div>
                                <div className="text-[#39FF14] text-2xl font-bold">{monitored.currentSnapshot.activeAdsCount}</div>
                                <div className={`text-xs ${adsVariation >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {adsVariation >= 0 ? "+" : ""}{adsVariation}% vs ontem
                                </div>
                              </div>
                              <div className="bg-black/50 rounded-lg p-3">
                                <div className="text-gray-500 text-xs font-mono">PAGINAS ATIVAS</div>
                                <div className="text-[#39FF14] text-2xl font-bold">{monitored.currentSnapshot.activePagesCount}</div>
                                <div className={`text-xs ${pagesVariation >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {pagesVariation >= 0 ? "+" : ""}{pagesVariation}% vs ontem
                                </div>
                              </div>
                              <div className="bg-black/50 rounded-lg p-3">
                                <div className="text-gray-500 text-xs font-mono">DOMINIOS UNICOS</div>
                                <div className="text-[#39FF14] text-2xl font-bold">{monitored.currentSnapshot.uniqueDomains.length}</div>
                                <div className="text-gray-500 text-xs">funis diferentes</div>
                              </div>
                            </div>

                            {/* Dominios Unicos */}
                            <div>
                              <div className="text-[#39FF14]/70 text-xs font-mono mb-2">DOMINIOS UNICOS (LANDING PAGES)</div>
                              <div className="space-y-2">
                                {monitored.currentSnapshot.landingPages.map((lp, i) => (
                                  <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#39FF14]" />
                                      <span className="text-white text-sm font-mono">{lp.domain}</span>
                                    </div>
                                    <a
                                      href={lp.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#39FF14] text-xs hover:underline"
                                    >
                                      Abrir →
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Links dos Ads */}
                            <div>
                              <div className="text-[#39FF14]/70 text-xs font-mono mb-2">LINKS DOS ANUNCIOS</div>
                              <div className="flex flex-wrap gap-2">
                                {monitored.currentSnapshot.adsLinks.slice(0, 5).map((link, i) => (
                                  <a
                                    key={i}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600/20 text-blue-400 text-xs px-3 py-1 rounded-full hover:bg-blue-600/30 transition-colors"
                                  >
                                    Ad #{i + 1} ↗
                                  </a>
                                ))}
                                {monitored.currentSnapshot.adsLinks.length > 5 && (
                                  <span className="text-gray-500 text-xs px-3 py-1">
                                    +{monitored.currentSnapshot.adsLinks.length - 5} mais
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Historico Tabela */}
                            <div>
                              <div className="text-[#39FF14]/70 text-xs font-mono mb-2">HISTORICO (ULTIMOS 7 DIAS)</div>
                              <div className="bg-black/30 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-800">
                                      <th className="text-left text-gray-500 font-mono text-xs p-2">DATA</th>
                                      <th className="text-center text-gray-500 font-mono text-xs p-2">ADS</th>
                                      <th className="text-center text-gray-500 font-mono text-xs p-2">PAGINAS</th>
                                      <th className="text-center text-gray-500 font-mono text-xs p-2">DOMINIOS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monitored.history.slice(-7).reverse().map((snap, i) => (
                                      <tr key={i} className="border-b border-gray-800/50">
                                        <td className="text-white p-2 font-mono text-xs">{snap.date}</td>
                                        <td className="text-center text-[#39FF14] p-2">{snap.activeAdsCount}</td>
                                        <td className="text-center text-white p-2">{snap.activePagesCount}</td>
                                        <td className="text-center text-gray-400 p-2">{snap.uniqueDomains.length}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => refreshMonitoring(monitored.id)}
                                className="flex-1 bg-[#39FF14]/10 text-[#39FF14] font-mono py-2 rounded-lg hover:bg-[#39FF14]/20"
                              >
                                🔄 Atualizar Dados
                              </button>
                              <button
                                onClick={() => removeFromMonitoring(monitored.id)}
                                className="bg-red-900/20 text-red-400 font-mono px-4 py-2 rounded-lg hover:bg-red-900/30"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Saved */}
          {activeTab === "saved" && (
            <div className="space-y-3">
              {offers.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="font-mono">Nenhuma oferta salva</p>
                </div>
              ) : (
                offers.map((offer) => {
                  const badge = getPlatformBadge(offer.platform);
                  return (
                    <div key={offer.id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#39FF14] font-mono text-sm font-bold">{offer.advertiser}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                          </div>
                          <h3 className="text-white font-medium">{offer.headline}</h3>
                        </div>
                        <button onClick={() => removeOffer(offer.id)} className="text-red-500 hover:text-red-400 p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab: Clone */}
          {activeTab === "clone" && (
            <div>
              {clonedStructure ? (
                <div className="space-y-4">
                  <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl p-4">
                    <div className="text-[#39FF14] font-mono font-bold text-lg mb-2">✅ ESTRUTURA CLONADA!</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <pre className="text-[#39FF14] text-sm overflow-auto">
                      {JSON.stringify(clonedStructure, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(clonedStructure, null, 2))}
                    className="w-full bg-gray-800 text-gray-300 font-mono py-3 rounded-xl hover:bg-gray-700"
                  >
                    📋 COPIAR JSON
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="font-mono">Clone uma oferta para ver a estrutura</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
