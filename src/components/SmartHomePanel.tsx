"use client";

import { useState, useEffect, useCallback } from "react";

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

function DeviceCard({ device, onControl }: { device: SmartDevice; onControl: (id: string, command: string, value?: unknown) => void }) {
  const typeIcons = {
    light: "💡",
    switch: "🔌",
    ac: "❄️",
    curtain: "🪟",
    sensor: "📡",
    other: "📦",
  };

  return (
    <div className={`bg-gray-900/50 rounded-xl p-4 border transition-all ${
      device.isOnline
        ? device.state.power
          ? "border-[#39FF14]/50 bg-[#39FF14]/5"
          : "border-gray-700 hover:border-gray-600"
        : "border-red-900/30 opacity-50"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeIcons[device.type]}</span>
          <div>
            <div className="font-medium text-white text-sm">{device.name}</div>
            <div className="text-[10px] text-gray-500">{device.room}</div>
          </div>
        </div>
        <div className={`text-[10px] px-2 py-0.5 rounded ${
          device.isOnline ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
        }`}>
          {device.isOnline ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-3">
        {/* Botao Power */}
        <button
          onClick={() => onControl(device.id, "power")}
          disabled={!device.isOnline}
          className={`w-full py-2 rounded-lg font-mono text-sm transition-all ${
            device.state.power
              ? "bg-[#39FF14] text-black font-bold"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {device.state.power ? "LIGADO" : "DESLIGADO"}
        </button>

        {/* Brilho */}
        {device.capabilities.includes("brightness") && device.state.power && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Brilho</span>
              <span>{device.state.brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={device.state.brightness || 0}
              onChange={(e) => onControl(device.id, "brightness", parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#39FF14]"
            />
          </div>
        )}

        {/* Temperatura (AC) */}
        {device.capabilities.includes("temperature") && device.state.power && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => onControl(device.id, "temperature", (device.state.temperature || 23) - 1)}
              className="w-8 h-8 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{device.state.temperature}°C</div>
              <div className="text-[10px] text-gray-500">{device.state.mode}</div>
            </div>
            <button
              onClick={() => onControl(device.id, "temperature", (device.state.temperature || 23) + 1)}
              className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50"
            >
              +
            </button>
          </div>
        )}

        {/* Cor */}
        {device.capabilities.includes("color") && device.state.power && (
          <div className="flex gap-2">
            {["#FFFFFF", "#39FF14", "#FF3939", "#3939FF", "#FFFF00"].map(color => (
              <button
                key={color}
                onClick={() => onControl(device.id, "color", color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  device.state.color === color ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SmartHomePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tuyaConfigured, setTuyaConfigured] = useState(false);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = selectedRoom
        ? `/api/smarthome?action=list&room=${encodeURIComponent(selectedRoom)}`
        : "/api/smarthome?action=list";
      const response = await fetch(url);
      const data = await response.json();
      setDevices(data.devices || []);
      setRooms(data.rooms || []);
      setTuyaConfigured(data.tuyaConfigured);
    } catch (error) {
      console.error("Erro ao carregar dispositivos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen, loadDevices]);

  const handleControl = async (deviceId: string, command: string, value?: unknown) => {
    try {
      await fetch("/api/smarthome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, command, value }),
      });
      await loadDevices();
    } catch (error) {
      console.error("Erro ao controlar dispositivo:", error);
    }
  };

  const handleScene = async (scene: string) => {
    try {
      await fetch("/api/smarthome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "scene", value: scene }),
      });
      await loadDevices();
    } catch (error) {
      console.error("Erro ao ativar cena:", error);
    }
  };

  const handleRoomControl = async (room: string, command: string) => {
    try {
      await fetch("/api/smarthome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, command }),
      });
      await loadDevices();
    } catch (error) {
      console.error("Erro ao controlar comodo:", error);
    }
  };

  if (!isOpen) return null;

  const filteredDevices = selectedRoom
    ? devices.filter(d => d.room === selectedRoom)
    : devices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black/95 border border-[#39FF14]/30 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#39FF14]/20 bg-gradient-to-r from-[#39FF14]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <h2 className="text-[#39FF14] font-mono text-xl font-bold">SMART HOME</h2>
                <p className="text-[#39FF14]/50 text-xs font-mono">
                  {tuyaConfigured ? "Conectado a Tuya IoT" : "Modo Simulacao"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cenas rapidas */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleScene("jarvis")}
              className="flex-1 bg-[#39FF14]/20 border border-[#39FF14]/30 text-[#39FF14] rounded-lg py-2 font-mono text-sm hover:bg-[#39FF14]/30"
            >
              🤖 MODO JARVIS
            </button>
            <button
              onClick={() => handleScene("movie")}
              className="flex-1 bg-purple-900/20 border border-purple-500/30 text-purple-400 rounded-lg py-2 font-mono text-sm hover:bg-purple-900/30"
            >
              🎬 FILME
            </button>
            <button
              onClick={() => handleScene("work")}
              className="flex-1 bg-blue-900/20 border border-blue-500/30 text-blue-400 rounded-lg py-2 font-mono text-sm hover:bg-blue-900/30"
            >
              💼 TRABALHO
            </button>
            <button
              onClick={() => handleScene("sleep")}
              className="flex-1 bg-gray-800 border border-gray-600 text-gray-400 rounded-lg py-2 font-mono text-sm hover:bg-gray-700"
            >
              😴 DORMIR
            </button>
          </div>

          {/* Filtro por comodo */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedRoom(null)}
              className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                !selectedRoom
                  ? "bg-[#39FF14] text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Todos
            </button>
            {rooms.map(room => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                  selectedRoom === room
                    ? "bg-[#39FF14] text-black font-bold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        </div>

        {/* Controles do comodo */}
        {selectedRoom && (
          <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex gap-2">
            <button
              onClick={() => handleRoomControl(selectedRoom, "all_on")}
              className="px-4 py-1 bg-[#39FF14]/20 text-[#39FF14] rounded-lg text-xs font-mono hover:bg-[#39FF14]/30"
            >
              Ligar Tudo
            </button>
            <button
              onClick={() => handleRoomControl(selectedRoom, "all_off")}
              className="px-4 py-1 bg-red-900/20 text-red-400 rounded-lg text-xs font-mono hover:bg-red-900/30"
            >
              Desligar Tudo
            </button>
          </div>
        )}

        {/* Lista de dispositivos */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="font-mono">Carregando dispositivos...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">🔌</div>
              <p className="font-mono">Nenhum dispositivo encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map(device => (
                <DeviceCard key={device.id} device={device} onControl={handleControl} />
              ))}
            </div>
          )}
        </div>

        {/* Info Tuya */}
        {!tuyaConfigured && (
          <div className="p-4 bg-yellow-900/10 border-t border-yellow-500/20">
            <div className="text-yellow-400 text-xs font-mono">
              ⚠️ Configure TUYA_ACCESS_ID e TUYA_ACCESS_SECRET no .env.local para conectar dispositivos reais.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
