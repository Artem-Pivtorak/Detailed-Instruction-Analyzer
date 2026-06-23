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
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 360,
        background: "rgba(5,10,20,0.94)",
        border: "1px solid rgba(234,179,8,0.3)",
        borderRadius: 16,
        position: "relative",
        boxShadow: "0 0 60px rgba(234,179,8,0.2), 0 0 120px rgba(234,179,8,0.08)",
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
            color: "#eab308", textShadow: "0 0 20px rgba(234,179,8,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.reminder")}</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {reminders.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40, fontFamily: "'RexBold', sans-serif" }}>
              {t("reminder.noReminders")}
            </div>
          )}
          {reminders.map(rem => (
            <div key={rem.id} style={{
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 10, padding: 14, marginBottom: 12,
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
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1, paddingRight: 30 }}>
                  <div style={{
                    fontSize: 11, fontWeight: "bold", color: "#eab308",
                    fontFamily: "'RexBold', sans-serif",
                    letterSpacing: "0.08em",
                  }}>
                    {t("reminder.time")}: {rem.time} {t("reminder.date")} {rem.date}
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
                    {rem.text}
                  </p>
                </div>
                <button
                  onClick={() => deleteReminder(rem.id)}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,80,80,0.5)", cursor: "pointer",
                    fontSize: 16, flexShrink: 0, paddingTop: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
                  title={t("common.delete")}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
