import { useEffect, useState } from "react";

type Section = "memory" | "settings" | "reminder" | "plugins" | "commands" | "addcommands" | "people";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
  onOpenSection: (section: Section) => void;
}

const MODULES: { key: Section; name: string; color: string; icon: string }[] = [
  { key: "memory",      name: "MEMORY",       color: "#f97316", icon: "🧠" },
  { key: "settings",    name: "SETTINGS",     color: "#a855f7", icon: "⚙️" },
  { key: "people",      name: "PEOPLE",       color: "#22c55e", icon: "👥" },
  { key: "reminder",    name: "REMINDER",     color: "#eab308", icon: "🔔" },
  { key: "plugins",     name: "PLUGINS",      color: "#3b82f6", icon: "🔌" },
  { key: "commands",    name: "COMMANDS",     color: "#06b6d4", icon: "⚡" },
  { key: "addcommands", name: "ADD COMMANDS", color: "#10b981", icon: "➕" },
];

export function SidePanel({ open, onClose, onSound, onOpenSection }: SidePanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); onSound("close"); }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose, onSound]);

  function handleModuleClick(key: Section) {
    onOpenSection(key);
    onSound("open");
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => { onClose(); onSound("close"); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200,
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 264,
          height: "100%",
          background: "rgba(4, 12, 26, 0.96)",
          backdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(0,180,255,0.18)",
          zIndex: 300,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? "6px 0 50px rgba(0,80,220,0.25)" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "22px 18px 14px",
          borderBottom: "1px solid rgba(0,180,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#00cfff",
              boxShadow: "0 0 10px #00cfff, 0 0 20px #00cfff",
            }} />
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 15,
              fontWeight: "bold",
              letterSpacing: "0.2em",
              color: "#00cfff",
              textShadow: "0 0 12px rgba(0,200,255,0.6)",
            }}>
              KAROTVIP
            </span>
          </div>
          <button
            onClick={() => { onClose(); onSound("close"); }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14,
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >✕</button>
        </div>

        {/* Plugin icons row */}
        <div style={{
          padding: "14px 18px",
          display: "flex",
          gap: 10,
          borderBottom: "1px solid rgba(0,180,255,0.08)",
          flexShrink: 0,
        }}>
          {[
            { name: "ELEVENLABS", color: "#00cfff" },
            { name: "VOSK",       color: "#a855f7" },
            { name: "PICOVOICE",  color: "#22c55e" },
          ].map(p => (
            <div key={p.name} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}>
              <div style={{
                width: "100%",
                height: 38,
                background: `${p.color}0a`,
                border: `1px solid ${p.color}25`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18 }}>
                  {[3, 6, 4, 7, 5, 8, 4].map((h, i) => (
                    <div key={i} style={{
                      width: 2.5, height: h,
                      background: p.color,
                      borderRadius: 1,
                      opacity: 0.8,
                    }} />
                  ))}
                </div>
              </div>
              <span style={{
                fontSize: 8, color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.04em", fontFamily: "'Courier New', monospace",
              }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>

        {/* Module buttons */}
        <div style={{ padding: "16px 14px", flex: 1, overflowY: "auto" }}>
          <p style={{
            fontSize: 9, color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.14em", marginBottom: 10,
            fontFamily: "'Courier New', monospace", paddingLeft: 4,
          }}>
            MODULES
          </p>

          {MODULES.map(item => {
            const isHov = hovered === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleModuleClick(item.key)}
                onMouseEnter={() => { setHovered(item.key); onSound("hover"); }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  cursor: "pointer",
                  background: isHov ? `${item.color}16` : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isHov ? item.color + "50" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: isHov ? `0 0 18px ${item.color}25, inset 0 0 12px ${item.color}08` : "none",
                  transform: isHov ? "translateX(3px)" : "translateX(0)",
                  textAlign: "left",
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: isHov ? `0 0 10px ${item.color}60` : "none",
                  transition: "box-shadow 0.2s",
                }}>
                  {item.icon}
                </div>

                <span style={{
                  fontSize: 12,
                  fontFamily: "'Courier New', monospace",
                  fontWeight: "bold",
                  color: isHov ? item.color : "rgba(255,255,255,0.65)",
                  letterSpacing: "0.07em",
                  transition: "color 0.2s",
                  textShadow: isHov ? `0 0 10px ${item.color}80` : "none",
                }}>
                  {item.name}
                </span>

                {/* Arrow */}
                <div style={{
                  marginLeft: "auto",
                  color: isHov ? item.color : "rgba(255,255,255,0.15)",
                  fontSize: 10,
                  transition: "all 0.2s",
                  transform: isHov ? "translateX(2px)" : "translateX(0)",
                }}>▶</div>
              </button>
            );
          })}
        </div>

        <div style={{
          padding: "12px 18px",
          borderTop: "1px solid rgba(0,180,255,0.08)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "Arial, sans-serif" }}>
            v1.0.0 — Karotvip Industries Inc.
          </span>
        </div>
      </div>
    </>
  );
}
