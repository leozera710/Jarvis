import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/calendar/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Erro na autorizacao
  if (error) {
    return NextResponse.redirect(new URL("/?auth_error=" + error, req.url));
  }

  // Codigo nao fornecido
  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=no_code", req.url));
  }

  try {
    const oauth2Client = getOAuth2Client();

    // Trocar codigo por tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Criar resposta com redirect
    const response = NextResponse.redirect(new URL("/?auth_success=true", req.url));

    // Salvar tokens em cookies seguros
    if (tokens.access_token) {
      response.cookies.set("google_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 dias
      });
    }

    return response;
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.redirect(new URL("/?auth_error=token_exchange", req.url));
  }
}
