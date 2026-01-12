import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Configurar cliente OAuth2
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/calendar/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// GET - Listar eventos ou iniciar autenticacao
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");

  try {
    const oauth2Client = getOAuth2Client();

    // Iniciar fluxo de autenticacao
    if (action === "auth") {
      const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
      });

      return NextResponse.json({ authUrl });
    }

    // Verificar se tem token salvo
    const accessToken = req.cookies.get("google_access_token")?.value;
    const refreshToken = req.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
      return NextResponse.json({
        authenticated: false,
        message: "Nao autenticado. Use action=auth para iniciar.",
      });
    }

    // Configurar tokens
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Listar eventos
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Eventos de hoje
    if (action === "today") {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      return NextResponse.json({
        authenticated: true,
        events: response.data.items || [],
      });
    }

    // Proximos eventos (padrao: proximos 7 dias)
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      authenticated: true,
      events: response.data.items || [],
    });
  } catch (error) {
    console.error("Calendar API Error:", error);
    return NextResponse.json(
      { error: "Erro ao acessar calendario", details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar evento
export async function POST(req: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client();
    const accessToken = req.cookies.get("google_access_token")?.value;
    const refreshToken = req.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const body = await req.json();
    const { summary, description, start, end, reminders } = body;

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary,
      description,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      reminders: reminders || {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json({
      success: true,
      event: response.data,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar evento", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remover evento
export async function DELETE(req: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client();
    const accessToken = req.cookies.get("google_access_token")?.value;
    const refreshToken = req.cookies.get("google_refresh_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId nao fornecido" },
        { status: 400 }
      );
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar evento", details: String(error) },
      { status: 500 }
    );
  }
}
