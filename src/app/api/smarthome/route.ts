import { NextRequest, NextResponse } from "next/server";

// Tipos de dispositivos Smart Home
interface SmartDevice {
  id: string;
  name: string;
  type: "light" | "switch" | "ac" | "curtain" | "sensor" | "other";
  room: string;
  isOnline: boolean;
  state: {
    power: boolean;
    brightness?: number;
    temperature?: number;
    color?: string;
    mode?: string;
  };
  capabilities: string[];
}

// Simulacao de dispositivos (em producao viria da Tuya API)
let mockDevices: SmartDevice[] = [
  {
    id: "light_living_1",
    name: "Luz Sala Principal",
    type: "light",
    room: "Sala",
    isOnline: true,
    state: { power: false, brightness: 100, color: "#FFFFFF" },
    capabilities: ["power", "brightness", "color"],
  },
  {
    id: "light_office_1",
    name: "Luz Escritorio",
    type: "light",
    room: "Escritorio",
    isOnline: true,
    state: { power: true, brightness: 80, color: "#39FF14" },
    capabilities: ["power", "brightness", "color"],
  },
  {
    id: "ac_bedroom_1",
    name: "Ar Condicionado Quarto",
    type: "ac",
    room: "Quarto",
    isOnline: true,
    state: { power: false, temperature: 23, mode: "cool" },
    capabilities: ["power", "temperature", "mode"],
  },
  {
    id: "switch_kitchen_1",
    name: "Tomada Cozinha",
    type: "switch",
    room: "Cozinha",
    isOnline: true,
    state: { power: false },
    capabilities: ["power"],
  },
  {
    id: "light_bedroom_1",
    name: "Luz Quarto",
    type: "light",
    room: "Quarto",
    isOnline: false,
    state: { power: false, brightness: 100 },
    capabilities: ["power", "brightness"],
  },
];

// GET - Listar dispositivos ou status
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");
  const deviceId = searchParams.get("deviceId");
  const room = searchParams.get("room");

  try {
    // Verificar configuracao Tuya
    const tuyaConfigured = !!(process.env.TUYA_ACCESS_ID && process.env.TUYA_ACCESS_SECRET);

    // Listar todos os dispositivos
    if (action === "list") {
      let devices = mockDevices;

      // Filtrar por comodo se especificado
      if (room) {
        devices = devices.filter(d => d.room.toLowerCase() === room.toLowerCase());
      }

      return NextResponse.json({
        devices,
        rooms: [...new Set(mockDevices.map(d => d.room))],
        tuyaConfigured,
        message: tuyaConfigured
          ? "Conectado a Tuya IoT"
          : "Usando modo de simulacao. Configure TUYA_ACCESS_ID e TUYA_ACCESS_SECRET para conexao real.",
      });
    }

    // Status de um dispositivo especifico
    if (action === "status" && deviceId) {
      const device = mockDevices.find(d => d.id === deviceId);
      if (!device) {
        return NextResponse.json({ error: "Dispositivo nao encontrado" }, { status: 404 });
      }
      return NextResponse.json({ device });
    }

    // Resumo geral
    if (action === "summary") {
      const summary = {
        totalDevices: mockDevices.length,
        onlineDevices: mockDevices.filter(d => d.isOnline).length,
        devicesOn: mockDevices.filter(d => d.state.power).length,
        rooms: [...new Set(mockDevices.map(d => d.room))],
        byType: {
          lights: mockDevices.filter(d => d.type === "light").length,
          switches: mockDevices.filter(d => d.type === "switch").length,
          ac: mockDevices.filter(d => d.type === "ac").length,
        },
      };
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: "Acao nao especificada" }, { status: 400 });
  } catch (error) {
    console.error("Smart Home API Error:", error);
    return NextResponse.json({ error: "Erro no sistema Smart Home" }, { status: 500 });
  }
}

// POST - Controlar dispositivos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, command, value, room } = body;

    // Comando para um comodo inteiro
    if (room && command) {
      const roomDevices = mockDevices.filter(d => d.room.toLowerCase() === room.toLowerCase());

      if (command === "all_off") {
        roomDevices.forEach(d => {
          d.state.power = false;
        });
        return NextResponse.json({
          success: true,
          message: `Todos os dispositivos da ${room} foram desligados`,
          affected: roomDevices.length,
        });
      }

      if (command === "all_on") {
        roomDevices.forEach(d => {
          if (d.isOnline) d.state.power = true;
        });
        return NextResponse.json({
          success: true,
          message: `Todos os dispositivos da ${room} foram ligados`,
          affected: roomDevices.filter(d => d.isOnline).length,
        });
      }
    }

    // Comando para dispositivo especifico
    if (deviceId) {
      const device = mockDevices.find(d => d.id === deviceId);
      if (!device) {
        return NextResponse.json({ error: "Dispositivo nao encontrado" }, { status: 404 });
      }

      if (!device.isOnline) {
        return NextResponse.json({ error: "Dispositivo offline" }, { status: 400 });
      }

      switch (command) {
        case "power":
          device.state.power = value ?? !device.state.power;
          break;
        case "brightness":
          if (device.capabilities.includes("brightness")) {
            device.state.brightness = Math.min(100, Math.max(0, value));
          }
          break;
        case "temperature":
          if (device.capabilities.includes("temperature")) {
            device.state.temperature = Math.min(30, Math.max(16, value));
          }
          break;
        case "color":
          if (device.capabilities.includes("color")) {
            device.state.color = value;
          }
          break;
        case "mode":
          if (device.capabilities.includes("mode")) {
            device.state.mode = value;
          }
          break;
        default:
          return NextResponse.json({ error: "Comando desconhecido" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        device,
        message: `${device.name}: ${command} = ${value ?? device.state.power}`,
      });
    }

    // Comandos globais
    if (command === "all_off") {
      mockDevices.forEach(d => {
        d.state.power = false;
      });
      return NextResponse.json({
        success: true,
        message: "Todos os dispositivos foram desligados",
      });
    }

    if (command === "scene") {
      // Cenas pre-definidas
      switch (value) {
        case "movie":
          mockDevices.filter(d => d.type === "light").forEach(d => {
            d.state.power = true;
            d.state.brightness = 20;
          });
          break;
        case "work":
          mockDevices.filter(d => d.room === "Escritorio").forEach(d => {
            d.state.power = true;
            if (d.state.brightness !== undefined) d.state.brightness = 100;
          });
          break;
        case "sleep":
          mockDevices.forEach(d => {
            d.state.power = false;
          });
          break;
        case "jarvis":
          // Modo JARVIS - luzes verdes
          mockDevices.filter(d => d.type === "light").forEach(d => {
            d.state.power = true;
            d.state.brightness = 50;
            if (d.state.color !== undefined) d.state.color = "#39FF14";
          });
          break;
      }
      return NextResponse.json({
        success: true,
        message: `Cena "${value}" ativada`,
      });
    }

    return NextResponse.json({ error: "Comando nao especificado" }, { status: 400 });
  } catch (error) {
    console.error("Smart Home POST Error:", error);
    return NextResponse.json({ error: "Erro ao executar comando" }, { status: 500 });
  }
}
