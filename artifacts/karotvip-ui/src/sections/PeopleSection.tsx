import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import peopleIcon from "../../../../images-icons/people.png";

interface Person {
  id: number;
  name: string;
  role: string;
  status: string;
  info: string;
  country: string;
  city: string;
  gender: string;
  audioPath: string;
  expanded: boolean;
  isMain: boolean;
}

const INITIAL_PEOPLE: Person[] = [
  {
    id: 1, name: "John Doe", role: "Admin", status: "Active",
    info: "Main system user", country: "Ukraine", city: "Kyiv",
    gender: "Male", audioPath: "/audio/main.wav", expanded: false, isMain: true,
  },
  {
    id: 2, name: "Jane Smith", role: "User", status: "Online",
    info: "Assistant profile", country: "USA", city: "New York",
    gender: "Female", audioPath: "/audio/jane.wav", expanded: false, isMain: false,
  },
];

interface PeopleSectionProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
}

function PersonCard({ person, onChange, onDelete, onSound }: { person: Person; onChange: (p: Person) => void; onDelete: (id: number) => void; onSound: (t: string) => void }) {
  const { t } = useI18n();
  const color = person.isMain ? "#22c55e" : "#16a34a";

  function toggleExpand() {
    onSound("open");
    onChange({ ...person, expanded: !person.expanded });
  }

  return (
    <div style={{
      background: person.isMain ? "#22c55e0a" : "#16a34a0a",
      border: `1px solid ${person.isMain ? "#22c55e28" : "#16a34a28"}`,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      marginLeft: person.isMain ? 0 : 12,
      transition: "all 0.3s",
      boxShadow: person.isMain ? "0 0 20px rgba(34,197,94,0.15)" : "none",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: `${color}22`,
          border: `2px solid ${color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
          boxShadow: `0 0 12px ${color}44`,
          overflow: "hidden",
        }}>
          <img src={peopleIcon} alt="avatar" style={{ width: "60%", height: "60%", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'RexBold', sans-serif", fontSize: 18 }}>
            {person.name}
          </div>
          <div style={{ fontSize: 14, color, fontFamily: "'RexBold', sans-serif" }}>
            {person.role}
          </div>
        </div>
        
        {/* Delete Button */}
        {!person.isMain && (
          <button
            onClick={() => onDelete(person.id)}
            style={{
              background: "none", border: "none", color: "rgba(255,80,80,0.5)",
              cursor: "pointer", fontSize: 20, transition: "color 0.2s",
              padding: "6px", display: "flex", alignItems: "center", justifyContent: "center"
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
        )}

        <button
          onClick={toggleExpand}
          style={{
            background: "none", border: "none", color,
            cursor: "pointer", transition: "transform 0.3s",
            transform: person.expanded ? "rotate(90deg)" : "rotate(0deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Expanded fields */}
      {person.expanded && (
        <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(34,197,94,0.1)" }}>
          {[
            [t("people.id"), String(person.id), false, "id"],
            [t("people.name"), person.name, true, "name"],
            [t("people.status"), person.status, true, "status"],
            [t("people.info"), person.info, true, "info"],
            [t("people.country"), person.country, true, "country"],
            [t("people.city"), person.city, true, "city"],
            [t("people.gender"), person.gender, true, "gender"],
            [t("people.audioPath"), person.audioPath, true, "audioPath"],
          ].map(([label, val, editable, key]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", width: 90, flexShrink: 0, fontFamily: "'RexBold', sans-serif" }}>
                {label}
              </span>
              {editable ? (
                <input
                  value={val as string}
                  onChange={e => onChange({ ...person, [key as string]: e.target.value })}
                  style={{
                    flex: 1, background: "#22c55e0a",
                    border: "1px solid #22c55e28",
                    borderRadius: 6, padding: "8px 12px",
                    color: "rgba(255,255,255,0.8)", fontSize: 16,
                    fontFamily: "'RexBold', sans-serif",
                  }}
                />
              ) : (
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "'RexBold', sans-serif" }}>
                  {val}
                </span>
              )}
            </div>
          ))}
          <button style={{
            marginTop: 16,
            background: "#22c55e0a",
            border: "1px solid #22c55e28",
            borderRadius: 8, padding: "10px 24px",
            color: "#22c55e",
            fontSize: 16, fontFamily: "'RexBold', sans-serif",
            fontWeight: "bold", cursor: "pointer",
          }}
          onClick={() => onSound("click")}
          >{t("common.save")}</button>
        </div>
      )}
    </div>
  );
}

export function PeopleSection({ open, onClose, onSound }: PeopleSectionProps) {
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const { t } = useI18n();

  function addPerson() {
    onSound("click");
    setPeople(prev => [...prev, {
      id: Date.now(),
      name: "New User", role: "Guest", status: "Offline",
      info: "", country: "", city: "", gender: "Unknown",
      audioPath: "", expanded: true, isMain: false,
    }]);
  }

  function removePerson(id: number) {
    onSound("click");
    setPeople(prev => prev.filter(p => p.id !== id));
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
        border: "2px solid rgba(34,197,94,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(34,197,94,0.3), 0 0 160px rgba(34,197,94,0.15)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 12,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 28, zIndex: 10, lineHeight: 1,
        }}>✕</button>

        <div style={{ padding: "40px 40px 28px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32,
            color: "#22c55e", textShadow: "0 0 20px rgba(34,197,94,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.people")}</h2>
          <button
            onClick={addPerson}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#22c55e0a",
              border: "1px solid #22c55e28",
              color: "#22c55e", fontSize: 24, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}
          >+</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px" }}>
          {people.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              onChange={updated => setPeople(prev => prev.map(x => x.id === updated.id ? updated : x))}
              onDelete={removePerson}
              onSound={onSound}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
