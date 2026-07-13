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
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(48px) saturate(150%)",
      WebkitBackdropFilter: "blur(48px) saturate(150%)",
    }}>
      <div
        className="droplet-up"
        style={{
        width: 580,
        background: "#000000",
        border: "2px solid rgba(6,182,212,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(6,182,212,0.3), 0 0 160px rgba(6,182,212,0.15)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={handleClose} style={{
          position: "absolute", top: 20, right: 12,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 28, zIndex: 10, lineHeight: 1,
        }}>✕</button>

        <div style={{ padding: "40px 40px 28px", textAlign: "center", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32,
            color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.commands")}</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`
          .commands-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
          {INITIAL_COMMANDS.map(cmd => {
            const isExpanded = expanded === cmd.id;
            const truncated = cmd.text.length > 45 ? cmd.text.slice(0, 45) + "..." : cmd.text;
            return (
              <div key={cmd.id} style={{
                background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                border: `2px solid ${isExpanded ? "rgba(6,182,212,0.9)" : "rgba(6,182,212,0.6)"}`,
                borderRadius: 20, padding: 20, marginBottom: 16,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: isExpanded ? "0 0 10px rgba(6,182,212,0.7), inset 0 0 5px rgba(6,182,212,0.4)" : "0 0 10px rgba(6,182,212,0.5), inset 0 0 5px rgba(6,182,212,0.3)",
                transition: "all 0.3s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <p style={{
                    fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0, flex: 1,
                    fontFamily: "'RexBold', sans-serif",
                  }}>
                    {isExpanded ? cmd.text : truncated}
                  </p>
                  <button
                    onClick={() => {
                      setExpanded(isExpanded ? null : cmd.id);
                      onSound("click");
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)";
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 15px rgba(6,182,212,0.9), inset 0 0 8px rgba(6,182,212,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 10px rgba(6,182,212,0.7), inset 0 0 5px rgba(6,182,212,0.4)";
                    }}
                    style={{
                      background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                      border: "2px solid rgba(6,182,212,0.9)",
                      borderRadius: 20, color: "#06b6d4",
                      cursor: "pointer", fontSize: 16,
                      padding: "8px 16px",
                      fontFamily: "'RexBold', sans-serif",
                      flexShrink: 0,
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      boxShadow: "0 0 10px rgba(6,182,212,0.7), inset 0 0 5px rgba(6,182,212,0.4)",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s",
                    }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
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
