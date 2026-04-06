import { useState, useEffect } from "react";

interface Plugin {
  id: number;
  name: string;
  color: string;
  icon: string;
  enabled: boolean;
}

const PLUGINS: Plugin[] = [
  { id: 1, name: "GAME BOT",    color: "#f97316", icon: "🎮", enabled: false },
  { id: 2, name: "VIDEO EDIT",  color: "#3b82f6", icon: "🎬", enabled: true  },
  { id: 3, name: "CODE MASTER", color: "#22c55e", icon: "💻", enabled: false },
  { id: 4, name: "SCHOOL HELP", color: "#eab308", icon: "📚", enabled: true  },
];

interface PluginsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function PluginsSection({ onClose, onSound }: PluginsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [plugins, setPlugins] = useState(PLUGINS);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function togglePlugin(id: number) {
    onSound("toggle");
    setPlugins(p => p.map(pl => pl.id === id ? { ...pl, enabled: !pl.enabled } : pl));
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 360,
        background: "rgba(5,10,20,0.94)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: 16,
        position: "relative",
        boxShadow: "0 0 60px rgba(59,130,246,0.2), 0 0 120px rgba(59,130,246,0.08)",
        backdropFilter: "blur(24px)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 18, zIndex: 2,
        }}>✕</button>

        <div style={{ padding: "24px 28px 16px", textAlign: "center", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: "bold",
            color: "#3b82f6", textShadow: "0 0 20px rgba(59,130,246,0.8)",
            letterSpacing: "0.2em",
          }}>PLUGINS</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {plugins.map(plugin => (
            <div key={plugin.id} style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.18)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 10,
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44,
                background: `${plugin.color}18`,
                border: `1px solid ${plugin.color}40`,
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {plugin.icon}
              </div>

              {/* Name */}
              <span style={{
                flex: 1,
                fontFamily: "'Courier New', monospace", fontWeight: "bold",
                fontSize: 13, color: "rgba(255,255,255,0.85)",
                letterSpacing: "0.06em",
              }}>{plugin.name}</span>

              {/* Toggle circle */}
              <div
                onClick={() => togglePlugin(plugin.id)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: `2px solid ${plugin.enabled ? plugin.color : "rgba(255,255,255,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  background: plugin.enabled ? `${plugin.color}22` : "transparent",
                  boxShadow: plugin.enabled ? `0 0 12px ${plugin.color}66` : "none",
                  transition: "all 0.25s",
                  color: plugin.enabled ? plugin.color : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: "bold",
                }}
              >
                {plugin.enabled ? "✓" : "○"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
