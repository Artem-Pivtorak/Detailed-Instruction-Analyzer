import { useState, useEffect } from "react";
import { useI18n } from "../i18n";

interface Command {
  id: number;
  text: string;
}

const INITIAL_COMMANDS: Command[] = [
  { id: 1, text: "Open application: Chrome browser at default homepage with user profile loaded" },
  { id: 2, text: "Play music: Spotify — resume last playlist from beginning" },
  { id: 3, text: "Search YouTube: trending videos in technology category" },
  { id: 4, text: "Set reminder: daily standup at 10:00 AM every weekday" },
  { id: 5, text: "Open file: project document in default editor application" },
];

interface CommandsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function CommandsSection({ onClose, onSound }: CommandsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { t } = useI18n();

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 380,
        background: "rgba(5,10,20,0.94)",
        border: "1px solid rgba(6,182,212,0.3)",
        borderRadius: 16,
        position: "relative",
        boxShadow: "0 0 60px rgba(6,182,212,0.2), 0 0 120px rgba(6,182,212,0.08)",
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
            fontFamily: "'RexBold', sans-serif",
            color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.commands")}</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {INITIAL_COMMANDS.map(cmd => {
            const isExpanded = expanded === cmd.id;
            const truncated = cmd.text.length > 45 ? cmd.text.slice(0, 45) + "..." : cmd.text;
            return (
              <div key={cmd.id} style={{
                background: "rgba(6,182,212,0.06)",
                border: `1px solid rgba(6,182,212,${isExpanded ? "0.35" : "0.18"})`,
                borderRadius: 10, padding: 14, marginBottom: 10,
                boxShadow: isExpanded ? "0 0 20px rgba(6,182,212,0.15)" : "none",
                transition: "all 0.3s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0, flex: 1,
                    fontFamily: "'RexBold', sans-serif",
                  }}>
                    {isExpanded ? cmd.text : truncated}
                  </p>
                  <button
                    onClick={() => {
                      setExpanded(isExpanded ? null : cmd.id);
                      onSound("click");
                    }}
                    style={{
                      background: "rgba(6,182,212,0.15)",
                      border: "1px solid rgba(6,182,212,0.3)",
                      borderRadius: 6, color: "#06b6d4",
                      cursor: "pointer", fontSize: 11,
                      padding: "3px 8px",
                      fontFamily: "'RexBold', sans-serif",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
