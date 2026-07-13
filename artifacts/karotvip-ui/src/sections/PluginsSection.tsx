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
  { id: 1, name: "GAME BOT",    color: "#f97316", icon: "game", enabled: false },
  { id: 2, name: "VIDEO EDIT",  color: "#3b82f6", icon: "video", enabled: true  },
  { id: 3, name: "CODE MASTER", color: "#22c55e", icon: "code", enabled: false },
  { id: 4, name: "SCHOOL HELP", color: "#eab308", icon: "book", enabled: true  },
];

interface PluginsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function PluginsSection({ onClose, onSound }: PluginsSectionProps) {
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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(48px) saturate(150%)",
      WebkitBackdropFilter: "blur(48px) saturate(150%)",
    }}>
      <div
        className="droplet-up"
        style={{
        width: 580,
        background: "#000000",
        border: "2px solid rgba(59,130,246,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(59,130,246,0.3), 0 0 160px rgba(59,130,246,0.15)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Close */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 20, right: 12,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 28, zIndex: 10, lineHeight: 1,
        }}>✕</button>

        {/* Title */}
        <div style={{ padding: "40px 40px 28px", textAlign: "center", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32,
            color: "#3b82f6", textShadow: "0 0 20px rgba(59,130,246,0.8)",
            letterSpacing: "0.2em", margin: 0,
          }}>{t("module.plugins")}</h2>
          <div style={{
            marginTop: 8, fontFamily: "'RexBold', sans-serif",
            fontSize: 14,
            color: "rgba(59,130,246,0.4)", letterSpacing: "0.12em",
          }}>SELECT · TOGGLE · LAUNCH</div>
        </div>

        {/* Plugin list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px" }}>
          {plugins.map(plugin => {
            const isHov = hovered === plugin.id;

            return (
              <div
                key={plugin.id}
                onMouseEnter={() => { setHovered(plugin.id); onSound("hover"); }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 18,
                  background: isHov
                    ? "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)"
                    : "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                  border: `2px solid ${plugin.enabled ? plugin.color + "90" : "rgba(255, 255, 255, 0.3)"}`,
                  borderRadius: 20, padding: "18px 20px", marginBottom: 16,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: plugin.enabled ? `0 0 10px ${plugin.color}70, inset 0 0 5px ${plugin.color}40` : "none",
                  transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 56, height: 56,
                  background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                  border: `2px solid ${plugin.enabled ? plugin.color + "90" : "rgba(255, 255, 255, 0.3)"}`,
                  borderRadius: 28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: plugin.enabled ? plugin.color : "rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: plugin.enabled ? `0 0 10px ${plugin.color}70, inset 0 0 5px ${plugin.color}40` : "none",
                  transition: "all 0.22s",
                }}>
                  {plugin.icon === "game" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                      <path d="M6 12h4m-2-2v4m10-2h.01"></path>
                    </svg>
                  )}
                  {plugin.icon === "video" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                  )}
                  {plugin.icon === "code" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  )}
                  {plugin.icon === "book" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  )}
                </div>

                {/* Name + badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: "'RexBold', sans-serif",
                    fontSize: 18, color: isHov ? plugin.color : "rgba(255,255,255,0.85)",
                    letterSpacing: "0.06em", transition: "color 0.2s",
                    textShadow: isHov ? `0 0 10px ${plugin.color}88` : "none",
                    display: "block",
                  }}>{plugin.name}</span>
                </div>

                {/* Toggle circle */}
                <div
                  onClick={() => togglePlugin(plugin.id)}
                  style={{
                    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                    border: `2px solid ${plugin.enabled ? plugin.color : "rgba(255,255,255,0.3)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: plugin.enabled ? `0 0 10px ${plugin.color}70, inset 0 0 5px ${plugin.color}40` : "0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 5px rgba(255, 255, 255, 0.2)",
                    transition: "all 0.25s",
                    color: plugin.enabled ? plugin.color : "rgba(255,255,255,0.5)",
                    fontSize: 18, fontWeight: "bold",
                  }}
                >
                  {plugin.enabled ? "✓" : "○"}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
