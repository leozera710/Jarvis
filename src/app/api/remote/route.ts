import { NextRequest, NextResponse } from "next/server";

// Sistema de controle remoto do computador
// AVISO: Este sistema requer configuracao de seguranca adequada

interface RemoteCommand {
  id: string;
  type: "open_app" | "open_url" | "notification" | "screenshot" | "volume" | "power" | "custom";
  command: string;
  params?: Record<string, unknown>;
  timestamp: Date;
  status: "pending" | "executed" | "failed";
  result?: string;
}

// Fila de comandos pendentes (em producao usaria um banco de dados)
let commandQueue: RemoteCommand[] = [];
let commandHistory: RemoteCommand[] = [];

// Apps pre-definidos para abrir
const ALLOWED_APPS: Record<string, string> = {
  "chrome": "start chrome",
  "firefox": "start firefox",
  "notepad": "start notepad",
  "calculator": "start calc",
  "explorer": "start explorer",
  "spotify": "start spotify",
  "vscode": "start code",
  "terminal": "start cmd",
};

// URLs permitidas
const ALLOWED_URL_PATTERNS = [
  /^https?:\/\/(www\.)?google\.com/,
  /^https?:\/\/(www\.)?facebook\.com/,
  /^https?:\/\/(www\.)?instagram\.com/,
  /^https?:\/\/(www\.)?youtube\.com/,
  /^https?:\/\/(www\.)?github\.com/,
  /^https?:\/\/localhost/,
];

// Verificar se URL e permitida
function isUrlAllowed(url: string): boolean {
  return ALLOWED_URL_PATTERNS.some(pattern => pattern.test(url));
}

// GET - Buscar comandos pendentes ou status
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");

  // Verificar autenticacao (em producao usar JWT ou similar)
  const authToken = req.headers.get("x-jarvis-token");
  const validToken = process.env.JARVIS_REMOTE_TOKEN;

  if (validToken && authToken !== validToken) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    // Buscar comandos pendentes
    if (action === "pending") {
      return NextResponse.json({
        commands: commandQueue,
        count: commandQueue.length,
      });
    }

    // Historico de comandos
    if (action === "history") {
      return NextResponse.json({
        commands: commandHistory.slice(-50),
        count: commandHistory.length,
      });
    }

    // Status do sistema
    if (action === "status") {
      return NextResponse.json({
        online: true,
        pendingCommands: commandQueue.length,
        lastActivity: commandHistory[commandHistory.length - 1]?.timestamp || null,
        capabilities: [
          "open_app",
          "open_url",
          "notification",
          "volume",
        ],
        securityLevel: validToken ? "token_auth" : "no_auth",
      });
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Remote API Error:", error);
    return NextResponse.json({ error: "Erro no sistema remoto" }, { status: 500 });
  }
}

// POST - Enviar comando
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, command, params } = body;

    // Criar comando
    const newCommand: RemoteCommand = {
      id: `cmd_${Date.now()}`,
      type,
      command,
      params,
      timestamp: new Date(),
      status: "pending",
    };

    // Validar comando
    switch (type) {
      case "open_app":
        if (!ALLOWED_APPS[command.toLowerCase()]) {
          return NextResponse.json({
            error: `App "${command}" nao permitido`,
            allowedApps: Object.keys(ALLOWED_APPS),
          }, { status: 400 });
        }
        newCommand.command = ALLOWED_APPS[command.toLowerCase()];
        break;

      case "open_url":
        if (!isUrlAllowed(command)) {
          return NextResponse.json({
            error: "URL nao permitida por razoes de seguranca",
            hint: "Configure ALLOWED_URL_PATTERNS para adicionar mais URLs",
          }, { status: 400 });
        }
        break;

      case "volume":
        const volume = parseInt(command);
        if (isNaN(volume) || volume < 0 || volume > 100) {
          return NextResponse.json({
            error: "Volume deve ser um numero entre 0 e 100",
          }, { status: 400 });
        }
        break;

      case "notification":
        // Notificacoes sao sempre permitidas
        break;

      case "screenshot":
        // Screenshot permitido
        break;

      case "power":
        // Comandos de energia requerem confirmacao
        if (!params?.confirmed) {
          return NextResponse.json({
            requiresConfirmation: true,
            message: "Comando de energia requer confirmacao. Envie com params.confirmed = true",
          });
        }
        break;

      case "custom":
        // Comandos customizados desabilitados por seguranca
        return NextResponse.json({
          error: "Comandos customizados desabilitados por seguranca",
        }, { status: 403 });

      default:
        return NextResponse.json({
          error: `Tipo de comando desconhecido: ${type}`,
        }, { status: 400 });
    }

    // Adicionar a fila
    commandQueue.push(newCommand);

    // Simular execucao (em producao, um servico local executaria)
    setTimeout(() => {
      const cmd = commandQueue.find(c => c.id === newCommand.id);
      if (cmd) {
        cmd.status = "executed";
        cmd.result = `Comando simulado: ${cmd.type} - ${cmd.command}`;
        commandQueue = commandQueue.filter(c => c.id !== cmd.id);
        commandHistory.push(cmd);
      }
    }, 1000);

    return NextResponse.json({
      success: true,
      command: newCommand,
      message: "Comando adicionado a fila",
      note: "Em modo de desenvolvimento, comandos sao simulados. Configure um agente local para execucao real.",
    });
  } catch (error) {
    console.error("Remote POST Error:", error);
    return NextResponse.json({ error: "Erro ao processar comando" }, { status: 500 });
  }
}

// DELETE - Cancelar comando pendente
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const commandId = searchParams.get("id");

  if (!commandId) {
    return NextResponse.json({ error: "ID do comando nao fornecido" }, { status: 400 });
  }

  const command = commandQueue.find(c => c.id === commandId);
  if (!command) {
    return NextResponse.json({ error: "Comando nao encontrado" }, { status: 404 });
  }

  commandQueue = commandQueue.filter(c => c.id !== commandId);
  command.status = "failed";
  command.result = "Cancelado pelo usuario";
  commandHistory.push(command);

  return NextResponse.json({
    success: true,
    message: "Comando cancelado",
  });
}
