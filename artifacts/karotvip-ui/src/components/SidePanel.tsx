import { useEffect } from "react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
}

export function SidePanel({ open, onClose, onSound }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); onSound("close"); }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose, onSound]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => { onClose(); onSound("close"); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 260,
          height: "100%",
          background: "rgba(5, 15, 30, 0.92)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0,180,255,0.2)",
          zIndex: 300,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? "4px 0 40px rgba(0,100,255,0.2)" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 20px 16px",
          borderBottom: "1px solid rgba(0,180,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 16,
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: "#00cfff",
            textShadow: "0 0 10px rgba(0,200,255,0.5)",
          }}>
            KAROTVIP
          </span>
          <button
            onClick={() => { onClose(); onSound("close"); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        {/* Plugin icons row */}
        <div style={{
          padding: "16px 20px",
          display: "flex",
          gap: 16,
          borderBottom: "1px solid rgba(0,180,255,0.1)",
        }}>
          {["ELEVENLABS", "VOSK", "PICOVOICE"].map(name => (
            <div key={name} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}>
              <div style={{
                width: 52,
                height: 40,
                background: "rgba(0,180,255,0.08)",
                border: "1px solid rgba(0,180,255,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-end",
                  height: 20,
                }}>
                  {[3,6,4,7,5,8,4].map((h, i) => (
                    <div key={i} style={{
                      width: 3,
                      height: h,
                      background: name === "ELEVENLABS" ? "#00cfff" : name === "VOSK" ? "#a855f7" : "#22c55e",
                      borderRadius: 1,
                    }} />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", fontFamily: "'Courier New', monospace" }}>
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Hexagon mini-map */}
        <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'Courier New', monospace" }}>
            MODULES
          </p>
          {[
            { name: "MEMORY",       color: "#f97316" },
            { name: "SETTINGS",     color: "#a855f7" },
            { name: "PEOPLE",       color: "#22c55e" },
            { name: "REMINDER",     color: "#eab308" },
            { name: "PLUGINS",      color: "#3b82f6" },
            { name: "COMMANDS",     color: "#06b6d4" },
            { name: "ADD COMMANDS", color: "#10b981" },
          ].map(item => (
            <div key={item.name} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 4,
              cursor: "pointer",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid transparent",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = `${item.color}18`;
              (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}40`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
            }}
            >
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: item.color,
                boxShadow: `0 0 8px ${item.color}`,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12,
                fontFamily: "'Courier New', monospace",
                fontWeight: "bold",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.06em",
              }}>
                {item.name}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,180,255,0.1)" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "Arial, sans-serif" }}>
            v1.0.0 — Karotvip Industries
          </span>
        </div>
      </div>
    </>
  );
}
