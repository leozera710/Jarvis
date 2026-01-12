import { NextRequest, NextResponse } from "next/server";

// Tipos para ofertas/anuncios
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
  impressions?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  tags: string[];
  analysisNotes?: string;
}

// Simular banco de dados de ofertas monitoradas
let monitoredOffers: SpyOffer[] = [];

// GET - Listar ofertas monitoradas ou buscar novas
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");
  const query = searchParams.get("query");

  try {
    // Listar ofertas salvas
    if (action === "list") {
      return NextResponse.json({
        offers: monitoredOffers,
        count: monitoredOffers.length,
      });
    }

    // Buscar ofertas - Prioriza Google Ads e YouTube
    if (action === "search" && query) {
      const platform = searchParams.get("platform") || "google";

      // Simulacao de resultados de busca por plataforma
      const mockResults: SpyOffer[] = [];
      const timestamp = Date.now();

      if (platform === "google" || platform === "all") {
        mockResults.push({
          id: `offer_${timestamp}_google_1`,
          advertiser: `Anunciante Google - ${query}`,
          platform: "google",
          headline: `[Google Ads] ${query} - Oferta Imperdivel`,
          description: "Anuncio de pesquisa Google. Acesse o Google Ads Transparency Center para ver anuncios reais.",
          callToAction: "Comprar Agora",
          creatives: [
            {
              id: "creative_google_1",
              type: "image",
              url: "https://via.placeholder.com/1200x628/4285F4/FFFFFF?text=Google+Ad",
            }
          ],
          isActive: true,
          estimatedSpend: "R$ 500 - R$ 10.000/dia",
          tags: [query, "google-ads", "search", "display"],
          analysisNotes: "Anuncio Google Ads - Verifique: ads.google.com/transparency",
        });
      }

      if (platform === "youtube" || platform === "all") {
        mockResults.push({
          id: `offer_${timestamp}_youtube_1`,
          advertiser: `Canal YouTube - ${query}`,
          platform: "youtube",
          headline: `[YouTube Ads] Video Ad: ${query}`,
          description: "Anuncio em video do YouTube. Skippable after 5s. CTR estimado: 2-5%.",
          callToAction: "Assistir Video",
          creatives: [
            {
              id: "creative_youtube_1",
              type: "video",
              url: "https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=YouTube+Ad",
              thumbnail: "https://via.placeholder.com/320x180/FF0000/FFFFFF?text=Thumb",
            }
          ],
          isActive: true,
          estimatedSpend: "R$ 0.05 - R$ 0.30/view",
          tags: [query, "youtube-ads", "video", "in-stream"],
          analysisNotes: "Anuncio YouTube - Formatos: In-stream, Discovery, Bumper",
        });
      }

      if (platform === "facebook" || platform === "all") {
        mockResults.push({
          id: `offer_${timestamp}_fb_1`,
          advertiser: `Pagina Facebook - ${query}`,
          platform: "facebook",
          headline: `[Facebook] ${query} - Promocao`,
          description: "Anuncio do Facebook. Acesse a Facebook Ad Library para monitoramento.",
          callToAction: "Saiba Mais",
          creatives: [
            {
              id: "creative_fb_1",
              type: "image",
              url: "https://via.placeholder.com/1200x628/1877F2/FFFFFF?text=Facebook+Ad",
            }
          ],
          isActive: true,
          estimatedSpend: "R$ 1.000 - R$ 5.000",
          tags: [query, "facebook-ads", "feed"],
          analysisNotes: "Anuncio Facebook - Biblioteca: facebook.com/ads/library",
        });
      }

      return NextResponse.json({
        results: mockResults,
        query,
        platform,
        sources: {
          google: "https://ads.google.com/transparency",
          youtube: "https://www.youtube.com (buscar anuncios no feed)",
          facebook: "https://www.facebook.com/ads/library",
        },
        message: "Use os links de transparencia para acessar anuncios reais de cada plataforma",
      });
    }

    // Analisar URL de anuncio
    if (action === "analyze") {
      const url = searchParams.get("url");
      if (!url) {
        return NextResponse.json({ error: "URL nao fornecida" }, { status: 400 });
      }

      // Detectar plataforma pela URL
      let platform = "unknown";
      let suggestions: string[] = [];

      if (url.includes("google") || url.includes("googleads") || url.includes("ads.google")) {
        platform = "google";
        suggestions = [
          "Acesse o Google Ads Transparency Center: ads.google.com/transparency",
          "Busque pelo anunciante ou dominio na ferramenta de transparencia",
          "Analise palavras-chave e extensoes de anuncio",
          "Verifique o historico de anuncios do anunciante",
        ];
      } else if (url.includes("youtube") || url.includes("youtu.be")) {
        platform = "youtube";
        suggestions = [
          "Anuncios YouTube sao exibidos via Google Ads",
          "Analise o canal do anunciante para entender o conteudo",
          "Verifique formatos: In-stream, Discovery, Bumper, Shorts",
          "Use o Google Ads Transparency para ver anuncios em video",
        ];
      } else if (url.includes("facebook")) {
        platform = "facebook";
        suggestions = [
          "Acesse a Facebook Ad Library: facebook.com/ads/library",
          "Busque pela pagina do anunciante",
          "Analise criativos ativos e historico de anuncios",
        ];
      } else if (url.includes("instagram")) {
        platform = "instagram";
        suggestions = [
          "Anuncios Instagram estao na Facebook Ad Library",
          "Acesse: facebook.com/ads/library e filtre por Instagram",
        ];
      } else if (url.includes("tiktok")) {
        platform = "tiktok";
        suggestions = [
          "Acesse o TikTok Creative Center: ads.tiktok.com/business/creativecenter",
          "Veja tendencias e anuncios em alta",
        ];
      }

      const analysis = {
        url,
        platform,
        status: platform !== "unknown" ? "Plataforma detectada" : "Plataforma nao identificada",
        suggestions,
        transparencyLinks: {
          google: "https://ads.google.com/transparency",
          youtube: "https://ads.google.com/transparency (filtrar por video)",
          facebook: "https://www.facebook.com/ads/library",
          tiktok: "https://ads.tiktok.com/business/creativecenter",
        },
      };

      return NextResponse.json(analysis);
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Spy API Error:", error);
    return NextResponse.json({ error: "Erro no sistema de spy" }, { status: 500 });
  }
}

// POST - Salvar oferta para monitorar ou clonar estrutura
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, offer, cloneConfig } = body;

    // Salvar oferta para monitorar
    if (action === "save") {
      const newOffer: SpyOffer = {
        ...offer,
        id: `offer_${Date.now()}`,
      };
      monitoredOffers.push(newOffer);

      return NextResponse.json({
        success: true,
        offer: newOffer,
        message: "Oferta salva para monitoramento",
      });
    }

    // Clonar estrutura de oferta
    if (action === "clone") {
      // Gerar estrutura de campanha baseada na oferta
      const clonedStructure = {
        campaign: {
          name: `Clone - ${offer.headline}`,
          objective: "CONVERSIONS",
          status: "PAUSED",
        },
        adSet: {
          name: `AdSet - ${offer.advertiser}`,
          targeting: {
            suggestion: "Configure o publico baseado na analise do anuncio original",
            ageMin: 18,
            ageMax: 65,
            genders: [1, 2],
          },
          budget: {
            type: "daily",
            amount: cloneConfig?.budget || 50,
          },
        },
        ad: {
          name: `Ad - ${offer.headline}`,
          creative: {
            headline: offer.headline,
            description: offer.description,
            callToAction: offer.callToAction,
            mediaUrl: offer.creatives[0]?.url,
          },
        },
        notes: [
          "Esta e uma estrutura sugerida baseada na oferta analisada",
          "Adapte o criativo para evitar copias diretas",
          "Teste diferentes angulos e publicos",
          "Configure o pixel e eventos de conversao",
        ],
      };

      return NextResponse.json({
        success: true,
        structure: clonedStructure,
        message: "CLONA ESSA PORRA executado com sucesso! Estrutura gerada.",
      });
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Spy POST Error:", error);
    return NextResponse.json({ error: "Erro ao processar requisicao" }, { status: 500 });
  }
}

// DELETE - Remover oferta do monitoramento
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const offerId = searchParams.get("id");

  if (!offerId) {
    return NextResponse.json({ error: "ID nao fornecido" }, { status: 400 });
  }

  monitoredOffers = monitoredOffers.filter(o => o.id !== offerId);

  return NextResponse.json({
    success: true,
    message: "Oferta removida do monitoramento",
  });
}
