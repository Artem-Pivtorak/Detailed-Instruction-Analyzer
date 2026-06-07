import { useState, useEffect } from "react";
import { useI18n } from "../i18n";

interface Plugin {
  id: number;
  name: string;
  color: string;
  icon: string;
  enabled: boolean;
  openable?: boolean;
  openLabel?: string;
}

const PLUGINS: Plugin[] = [
  { id: 1, name: "GAME BOT",    color: "#f97316", icon: "🎮", enabled: false },
  { id: 2, name: "VIDEO EDIT",  color: "#3b82f6", icon: "🎬", enabled: true  },
  { id: 3, name: "CODE MASTER", color: "#22c55e", icon: "💻", enabled: false },
  { id: 4, name: "SCHOOL HELP", color: "#eab308", icon: "📚", enabled: true  },
  {
    id: 5,
    name: "WORLD MAP",
    color: "#00CFFF",
    icon: "🌍",
    enabled: false,
    openable: true,
    openLabel: "OPEN MAP",
  },
];

interface PluginsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
  onOpenWorldMap?: () => void;
}

export function PluginsSection({ onClose, onSound, onOpenWorldMap }: PluginsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [plugins, setPlugins] = useState(PLUGINS);
  const [hovered, setHovered] = useState<number | null>(null);
  const { t } = useI18n();

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

  function handleOpenWorldMap() {
    onSound("open");
    // Передаємо управління вгору — App відкриє WorldMapSection
    onOpenWorldMap?.();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 380,
        background: "rgba(5,10,20,0.95)",
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
        {/* Close */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 18, zIndex: 2,
        }}>✕</button>

        {/* Title */}
        <div style={{ padding: "24px 28px 14px", textAlign: "center", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: "bold",
            color: "#3b82f6", textShadow: "0 0 20px rgba(59,130,246,0.8)",
            letterSpacing: "0.2em", margin: 0,
          }}>{t("module.plugins")}</h2>
          <div style={{
            marginTop: 6, fontFamily: "'Courier New',monospace", fontSize: 9,
            color: "rgba(59,130,246,0.4)", letterSpacing: "0.12em",
          }}>SELECT · TOGGLE · LAUNCH</div>
        </div>

        {/* Plugin list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {plugins.map(plugin => {
            const isHov = hovered === plugin.id;
            const isWorldMap = plugin.id === 5;

            return (
              <div
                key={plugin.id}
                onMouseEnter={() => { setHovered(plugin.id); onSound("hover"); }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: isHov
                    ? `${plugin.color}0e`
                    : "rgba(59,130,246,0.05)",
                  border: `1px solid ${isHov ? plugin.color + "44" : "rgba(59,130,246,0.16)"}`,
                  borderRadius: 10, padding: "12px 14px", marginBottom: 10,
                  transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: isHov ? `0 0 18px ${plugin.color}18` : "none",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44,
                  background: `${plugin.color}18`,
                  border: `1px solid ${plugin.color}${isHov ? "66" : "38"}`,
                  borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 21, flexShrink: 0,
                  boxShadow: isHov ? `0 0 14px ${plugin.color}44` : "none",
                  transition: "all 0.22s",
                }}>
                  {plugin.icon}
                </div>

                {/* Name + badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: "'Courier New', monospace", fontWeight: "bold",
                    fontSize: 13, color: isHov ? plugin.color : "rgba(255,255,255,0.85)",
                    letterSpacing: "0.06em", transition: "color 0.2s",
                    textShadow: isHov ? `0 0 10px ${plugin.color}88` : "none",
                    display: "block",
                  }}>{plugin.name}</span>

                  {isWorldMap && (
                    <span style={{
                      fontFamily: "'Courier New',monospace", fontSize: 8,
                      color: `${plugin.color}88`, letterSpacing: "0.08em",
                    }}>
                      REAL-TIME · 6 REGIONS · 195 COUNTRIES
                    </span>
                  )}
                </div>

                {/* World Map: Open button */}
                {isWorldMap && (
                  <button
                    onClick={handleOpenWorldMap}
                    style={{
                      padding: "6px 12px",
                      background: isHov ? `${plugin.color}22` : `${plugin.color}0e`,
                      border: `1px solid ${plugin.color}${isHov ? "88" : "44"}`,
                      borderRadius: 7,
                      color: plugin.color,
                      cursor: "pointer",
                      fontFamily: "'Courier New',monospace",
                      fontSize: 9, fontWeight: "bold",
                      letterSpacing: "0.1em",
                      boxShadow: isHov ? `0 0 14px ${plugin.color}44` : "none",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${plugin.color}33`;
                      e.currentTarget.style.boxShadow = `0 0 18px ${plugin.color}66`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isHov ? `${plugin.color}22` : `${plugin.color}0e`;
                      e.currentTarget.style.boxShadow = isHov ? `0 0 14px ${plugin.color}44` : "none";
                    }}
                  >
                    🌐 OPEN
                  </button>
                )}

                {/* Toggle circle (for non-worldmap or also worldmap) */}
                <div
                  onClick={() => togglePlugin(plugin.id)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${plugin.enabled ? plugin.color : "rgba(255,255,255,0.18)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: plugin.enabled ? `${plugin.color}22` : "transparent",
                    boxShadow: plugin.enabled ? `0 0 12px ${plugin.color}66` : "none",
                    transition: "all 0.25s",
                    color: plugin.enabled ? plugin.color : "rgba(255,255,255,0.28)",
                    fontSize: 12, fontWeight: "bold",
                  }}
                >
                  {plugin.enabled ? "✓" : "○"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          borderTop: "1px solid rgba(59,130,246,0.1)",
          padding: "8px 20px",
          fontFamily: "'Courier New',monospace", fontSize: 8,
          color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em",
          textAlign: "center", flexShrink: 0,
        }}>
          ✓ = ACTIVE PLUGIN &nbsp;·&nbsp; 🌐 OPEN = LAUNCH SECTION
        </div>
      </div>
    </div>
  );
}
