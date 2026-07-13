import { useState, useEffect } from "react";
import { useI18n } from "../i18n";

interface Reminder {
  id: number;
  time: string;
  date: string;
  text: string;
}

const INITIAL_REMINDERS: Reminder[] = [
  { id: 1, time: "12:00", date: "21 NOV", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis suspiendisse ultrices gravida." },
  { id: 2, time: "12:00", date: "21 NOV", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Risus commodo viverra maecenas accumsan lacu vel facilisis." },
  { id: 3, time: "12:00", date: "21 NOV", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis suspiendisse ultrices gravida." },
  { id: 4, time: "12:00", date: "21 NOV", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
];

interface ReminderSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function ReminderSection({ onClose, onSound }: ReminderSectionProps) {
  const [visible, setVisible] = useState(false);
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const { t } = useI18n();

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function deleteReminder(id: number) {
    onSound("click");
    setReminders(r => r.filter(rem => rem.id !== id));
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
        background: "#000000",
        border: "2px solid rgba(234,179,8,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(234,179,8,0.3), 0 0 160px rgba(234,179,8,0.15)",
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
            color: "#eab308", textShadow: "0 0 20px rgba(234,179,8,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.reminder")}</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px" }}>
          {reminders.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40, fontFamily: "'RexBold', sans-serif" }}>
              {t("reminder.noReminders")}
            </div>
          )}
          {reminders.map(rem => (
            <div key={rem.id} style={{
              background: "#eab3080a",
              border: "1px solid #eab30828",
              borderRadius: 12, padding: 20, marginBottom: 16,
              position: "relative",
            }}>
              {/* glowing center */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: "60%", height: 2,
                background: "radial-gradient(ellipse, rgba(234,179,8,0.3), transparent)",
                filter: "blur(8px)",
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: "bold", color: "#eab308",
                    fontFamily: "'RexBold', sans-serif",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}>
                    {t("reminder.time")}: {rem.time} {t("reminder.date")} {rem.date}
                  </div>
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
                    {rem.text}
                  </p>
                </div>
                <button
                  onClick={() => deleteReminder(rem.id)}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,80,80,0.5)", cursor: "pointer",
                    flexShrink: 0, padding: 0,
                    transition: "color 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
                  title={t("common.delete")}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
