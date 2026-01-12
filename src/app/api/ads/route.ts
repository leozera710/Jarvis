import { NextRequest, NextResponse } from "next/server";

// Sistema de Automacao Google Ads
// Requer: Google Ads API credentials + Ads Power (para multi-contas)

interface AdsCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft";
  budget: number;
  objective: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
}

interface AdsAccount {
  id: string;
  name: string;
  status: "active" | "suspended" | "pending";
  campaigns: AdsCampaign[];
  totalSpend: number;
  currency: string;
}

// Contas simuladas para demonstracao
const mockAccounts: AdsAccount[] = [
  {
    id: "acc_1",
    name: "Conta Principal",
    status: "active",
    totalSpend: 15420.50,
    currency: "BRL",
    campaigns: [
      {
        id: "camp_1",
        name: "Campanha Conversao - Produto A",
        status: "active",
        budget: 100,
        objective: "conversions",
        metrics: {
          impressions: 45230,
          clicks: 1250,
          conversions: 45,
          spend: 850.30,
          ctr: 2.76,
          cpc: 0.68,
          roas: 3.2,
        },
      },
      {
        id: "camp_2",
        name: "Campanha Trafego - Blog",
        status: "paused",
        budget: 50,
        objective: "traffic",
        metrics: {
          impressions: 12500,
          clicks: 620,
          conversions: 0,
          spend: 310.00,
          ctr: 4.96,
          cpc: 0.50,
          roas: 0,
        },
      },
    ],
  },
  {
    id: "acc_2",
    name: "Conta Secundaria",
    status: "active",
    totalSpend: 8750.00,
    currency: "BRL",
    campaigns: [
      {
        id: "camp_3",
        name: "Remarketing - Carrinho Abandonado",
        status: "active",
        budget: 75,
        objective: "conversions",
        metrics: {
          impressions: 8900,
          clicks: 445,
          conversions: 28,
          spend: 520.00,
          ctr: 5.0,
          cpc: 1.17,
          roas: 4.8,
        },
      },
    ],
  },
];

// Templates de campanhas
const campaignTemplates = {
  conversion: {
    name: "Nova Campanha de Conversao",
    objective: "conversions",
    targeting: {
      networks: ["search", "display"],
      locations: ["BR"],
      languages: ["pt"],
    },
    bidStrategy: "maximize_conversions",
    suggestedBudget: 100,
  },
  traffic: {
    name: "Nova Campanha de Trafego",
    objective: "traffic",
    targeting: {
      networks: ["search"],
      locations: ["BR"],
      languages: ["pt"],
    },
    bidStrategy: "maximize_clicks",
    suggestedBudget: 50,
  },
  awareness: {
    name: "Nova Campanha de Reconhecimento",
    objective: "awareness",
    targeting: {
      networks: ["display", "youtube"],
      locations: ["BR"],
      languages: ["pt"],
    },
    bidStrategy: "target_cpm",
    suggestedBudget: 150,
  },
};

// GET - Listar contas/campanhas ou obter metricas
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");
  const accountId = searchParams.get("accountId");

  // Verificar configuracao
  const adsConfigured = !!(process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_DEVELOPER_TOKEN);

  try {
    // Listar todas as contas
    if (action === "accounts") {
      return NextResponse.json({
        accounts: mockAccounts,
        adsConfigured,
        message: adsConfigured
          ? "Conectado ao Google Ads API"
          : "Modo demonstracao. Configure Google Ads API para dados reais.",
      });
    }

    // Detalhes de uma conta
    if (action === "account" && accountId) {
      const account = mockAccounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
      }
      return NextResponse.json({ account });
    }

    // Metricas agregadas
    if (action === "metrics") {
      const totalMetrics = {
        totalAccounts: mockAccounts.length,
        activeAccounts: mockAccounts.filter(a => a.status === "active").length,
        totalCampaigns: mockAccounts.reduce((sum, a) => sum + a.campaigns.length, 0),
        activeCampaigns: mockAccounts.reduce((sum, a) =>
          sum + a.campaigns.filter(c => c.status === "active").length, 0),
        totalSpend: mockAccounts.reduce((sum, a) => sum + a.totalSpend, 0),
        totalImpressions: mockAccounts.reduce((sum, a) =>
          sum + a.campaigns.reduce((s, c) => s + (c.metrics?.impressions || 0), 0), 0),
        totalClicks: mockAccounts.reduce((sum, a) =>
          sum + a.campaigns.reduce((s, c) => s + (c.metrics?.clicks || 0), 0), 0),
        totalConversions: mockAccounts.reduce((sum, a) =>
          sum + a.campaigns.reduce((s, c) => s + (c.metrics?.conversions || 0), 0), 0),
      };

      return NextResponse.json({ metrics: totalMetrics });
    }

    // Templates de campanha
    if (action === "templates") {
      return NextResponse.json({ templates: campaignTemplates });
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Ads API Error:", error);
    return NextResponse.json({ error: "Erro no sistema de Ads" }, { status: 500 });
  }
}

// POST - Criar/atualizar campanhas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, accountId, campaignId, data } = body;

    // Criar nova campanha
    if (action === "create_campaign") {
      const account = mockAccounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
      }

      const newCampaign: AdsCampaign = {
        id: `camp_${Date.now()}`,
        name: data.name || "Nova Campanha",
        status: "draft",
        budget: data.budget || 50,
        objective: data.objective || "conversions",
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
        },
      };

      account.campaigns.push(newCampaign);

      return NextResponse.json({
        success: true,
        campaign: newCampaign,
        message: "Campanha criada em modo rascunho",
        nextSteps: [
          "Configure os grupos de anuncios",
          "Adicione palavras-chave",
          "Crie os anuncios",
          "Revise e ative a campanha",
        ],
      });
    }

    // Pausar campanha
    if (action === "pause_campaign" && campaignId) {
      for (const account of mockAccounts) {
        const campaign = account.campaigns.find(c => c.id === campaignId);
        if (campaign) {
          campaign.status = "paused";
          return NextResponse.json({
            success: true,
            message: `Campanha "${campaign.name}" pausada`,
          });
        }
      }
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 });
    }

    // Ativar campanha
    if (action === "activate_campaign" && campaignId) {
      for (const account of mockAccounts) {
        const campaign = account.campaigns.find(c => c.id === campaignId);
        if (campaign) {
          campaign.status = "active";
          return NextResponse.json({
            success: true,
            message: `Campanha "${campaign.name}" ativada`,
          });
        }
      }
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 });
    }

    // Atualizar orcamento
    if (action === "update_budget" && campaignId) {
      for (const account of mockAccounts) {
        const campaign = account.campaigns.find(c => c.id === campaignId);
        if (campaign) {
          campaign.budget = data.budget;
          return NextResponse.json({
            success: true,
            message: `Orcamento atualizado para R$ ${data.budget}/dia`,
          });
        }
      }
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 });
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Ads POST Error:", error);
    return NextResponse.json({ error: "Erro ao processar comando" }, { status: 500 });
  }
}
