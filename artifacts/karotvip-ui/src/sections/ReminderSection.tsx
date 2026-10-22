import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";

interface Reminder {
  id: number;
  text: string;
  original: string;
  target_ts: number;
  created_ts: number;
  user_id: string;
}

interface ReminderSectionProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
}

// ФІКС ("в reminders просто пише виникла помилка"): reminders.db зберігає target_ts
// як SQLite REAL (Unix-час у секундах, через datetime.timestamp() в reminder_system.py),
// А НЕ як рядок ISO. Попередня версія викликала iso.replace(...) на цьому значенні -
// на числі такого методу немає, .replace кидав TypeError на КОЖНІЙ картці з нагадуванням,
// що й ловив AppErrorBoundary в App.tsx (звідси "виникла помилка, перезавантажте" -
// і після перезавантаження помилка одразу поверталася знову, бо нагадування в базі
// нікуди не дівались). Тепер приймаємо число (секунди) і множимо на 1000 для JS Date.
function formatDateTime(targetTs: number): { time: string; date: string } {
  if (!targetTs && targetTs !== 0) return { time: "--:--", date: "" };
  const d = new Date(targetTs * 1000);
  if (isNaN(d.getTime())) return { time: "--:--", date: "" };
  const time = d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "");
  return { time, date };
}

// ФІКС (той самий підхід, що й у MemorySection.tsx): картка нагадування — окремий
// компонент, щоб мати власний локальний стан "expanded" для кожного запису.
function ReminderCard({
  rem,
  onDelete,
  onSound,
  t,
}: {
  rem: Reminder;
  onDelete: (id: number) => void;
  onSound: (type: string) => void;
  t: (k: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const { time, date } = formatDateTime(rem.target_ts);
  const text = rem.original || rem.text || "";
  const isLong = text.split("\n").length > 2 || text.length > 80;

  useEffect(() => {
    if (expanded && itemRef.current) {
      const tmr = setTimeout(() => {
        itemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 50);
      return () => clearTimeout(tmr);
    }
  }, [expanded]);

  return (
    <div
      ref={itemRef}
      style={{
        background: "#eab3080a",
        border: "1px solid #eab30828",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        position: "relative",
        // ФІКС ("фрейми не тримають розмір, якщо їх багато - зменшуються"): та сама причина,
        // що й раніше в MemorySection - список нижче є flex-колонкою, і без flexShrink:0
        // flexbox стискає картки замість того, щоб увімкнути скрол.
        flexShrink: 0,
      }}
    >
      {/* glowing center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "60%",
          height: 2,
          background: "radial-gradient(ellipse, rgba(234,179,8,0.3), transparent)",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#eab308",
              fontFamily: "'RexBold', sans-serif",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            {t("reminder.time")}: {time} {t("reminder.date")} {date}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              // Той самий фікс однакової форми карток, що й у MemorySection: завжди
              // рівно 2 рядки висоти у згорнутому стані, незалежно від довжини тексту.
              height: expanded ? "auto" : "3.2em",
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? ("unset" as any) : 2,
              WebkitBoxOrient: expanded ? undefined : ("vertical" as any),
              overflow: expanded ? "visible" : "hidden",
            }}
          >
            {text || <span style={{ color: "rgba(255,255,255,0.3)" }}>(порожній запис)</span>}
          </div>
        </div>
        <button
          onClick={() => onDelete(rem.id)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,80,80,0.5)",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            transition: "color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
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

      {/* Кнопка розгортання/згортання - завжди рендериться (резервує однакову висоту під
          усіма картками), просто невидима й неклікабельна для коротких записів. */}
      <div
        onClick={() => {
          if (!isLong) return;
          setExpanded(!expanded);
          onSound("click");
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 4,
          padding: "8px 0 0",
          color: "rgba(234,179,8,0.7)",
          cursor: isLong ? "pointer" : "default",
          opacity: isLong ? 1 : 0,
          pointerEvents: isLong ? "auto" : "none",
        }}
      >
        {expanded ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        )}
      </div>
    </div>
  );
}

export function ReminderSection({ open, onClose, onSound }: ReminderSectionProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement | null>(null);

  // ФІКС (раніше секція показувала статичний lorem-ipsum список, видалення було лише
  // локальним): тепер реальні дані з reminders.db через window.pywebview.api.get_reminders()
  // (див. gui_get_reminders у test.py -> reminder_system.gui_list_pending()). Так само,
  // як і в MemorySection, підвантажуємо при відкритті + легкий поллінг кожні 5с, поки
  // секція відкрита, щоб нові голосові нагадування теж з'являлись у реальному часі.
  const fetchReminders = useCallback(() => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_reminders) return;
    api
      .get_reminders()
      .then((list: Reminder[]) => setReminders(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchReminders();
    const id = setInterval(fetchReminders, 5000);
    return () => clearInterval(id);
  }, [open, fetchReminders]);

  // ФІКС ("гортання фреймів немає" - той самий WebView2/backdrop-filter фікс, що й у
  // MemorySection): ручний wheel-фолбек, бо нативний overflow-y:auto ненадійний у
  // пакетованому exe всередині елемента з важким backdropFilter.
  const handleWheel = useCallback((e: { deltaY: number }) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop += e.deltaY;
  }, []);

  function deleteReminder(id: number) {
    onSound("click");
    // Оптимістичне видалення з інтерфейсу одразу, паралельно скасовуємо на бекенді -
    // після цього асистент більше НЕ нагадає про цей запис (reminder_system.gui_cancel_by_id
    // скасовує й саме нагадування, і всі його заплановані завчасні/основні спрацювання).
    setReminders((r) => r.filter((rem) => rem.id !== id));
    const api = (window as any).pywebview?.api;
    if (!api?.delete_reminder) return;
    api.delete_reminder(id).catch(() => {});
  }

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(48px) saturate(150%)",
      WebkitBackdropFilter: "blur(48px) saturate(150%)",
    }}>
      <motion.div
        initial={{ width: 0, height: 0 }}
        animate={{ width: 580, height: "auto" }}
        exit={{ width: 0, height: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut", times: [0, 0.5, 1] }}
        style={{
        background: "#000000",
        border: "2px solid rgba(234,179,8,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(234,179,8,0.3), 0 0 160px rgba(234,179,8,0.15)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={onClose} style={{
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

        <div
          ref={listRef}
          onWheel={handleWheel}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            padding: "0 40px 40px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {reminders.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40, fontFamily: "'RexBold', sans-serif" }}>
              {t("reminder.noReminders")}
            </div>
          )}
          {reminders.map((rem) => (
            <ReminderCard key={rem.id} rem={rem} onDelete={deleteReminder} onSound={onSound} t={t} />
          ))}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
