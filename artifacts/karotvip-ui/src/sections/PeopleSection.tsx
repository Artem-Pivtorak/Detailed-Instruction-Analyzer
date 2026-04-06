import { useState, useEffect } from "react";

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
  onClose: () => void;
  onSound: (type: string) => void;
}

function PersonCard({ person, onChange, onSound }: { person: Person; onChange: (p: Person) => void; onSound: (t: string) => void }) {
  const color = person.isMain ? "#22c55e" : "#16a34a";

  function toggleExpand() {
    onSound("open");
    onChange({ ...person, expanded: !person.expanded });
  }

  return (
    <div style={{
      background: person.isMain ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.05)",
      border: `1px solid ${person.isMain ? "rgba(34,197,94,0.3)" : "rgba(22,163,74,0.2)"}`,
      borderRadius: 12,
      marginBottom: 12,
      overflow: "hidden",
      marginLeft: person.isMain ? 0 : 12,
      transition: "all 0.3s",
      boxShadow: person.isMain ? "0 0 20px rgba(34,197,94,0.15)" : "none",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: `${color}22`,
          border: `2px solid ${color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
          boxShadow: `0 0 12px ${color}44`,
        }}>
          {person.isMain ? "👤" : "👥"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontWeight: "bold", color: "#fff", fontSize: 13 }}>
            {person.name}
          </div>
          <div style={{ fontSize: 10, color, fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}>
            {person.role}
          </div>
        </div>
        <button
          onClick={toggleExpand}
          style={{
            background: "none", border: "none", color,
            cursor: "pointer", fontSize: 16, transition: "transform 0.3s",
            transform: person.expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >▶</button>
      </div>

      {/* Expanded fields */}
      {person.expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(34,197,94,0.1)" }}>
          {[
            ["ID", String(person.id), false],
            ["Name", person.name, true],
            ["Status", person.status, true],
            ["Info", person.info, true],
            ["Country", person.country, true],
            ["City", person.city, true],
            ["Gender", person.gender, true],
            ["Audio Path", person.audioPath, false],
          ].map(([label, val, editable]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", width: 72, flexShrink: 0, fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}>
                {label}
              </span>
              {editable ? (
                <input
                  value={val as string}
                  onChange={e => onChange({ ...person, [label.toLowerCase()]: e.target.value })}
                  style={{
                    flex: 1, background: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 6, padding: "4px 8px",
                    color: "rgba(255,255,255,0.8)", fontSize: 11,
                    fontFamily: "'Courier New', monospace", outline: "none",
                  }}
                />
              ) : (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace" }}>{val}</span>
              )}
            </div>
          ))}
          <button style={{
            marginTop: 12,
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 8, padding: "6px 18px",
            color: "#22c55e",
            fontSize: 11, fontFamily: "'Courier New', monospace",
            fontWeight: "bold", cursor: "pointer",
          }}
          onClick={() => onSound("click")}
          >Зберегти</button>
        </div>
      )}
    </div>
  );
}

export function PeopleSection({ onClose, onSound }: PeopleSectionProps) {
  const [visible, setVisible] = useState(false);
  const [people, setPeople] = useState(INITIAL_PEOPLE);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function addPerson() {
    onSound("click");
    setPeople(prev => [...prev, {
      id: Date.now(),
      name: "New User", role: "Guest", status: "Offline",
      info: "", country: "", city: "", gender: "Unknown",
      audioPath: "", expanded: true, isMain: false,
    }]);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 380,
        background: "rgba(5,12,20,0.94)",
        border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 16,
        position: "relative",
        boxShadow: "0 0 60px rgba(34,197,94,0.2), 0 0 120px rgba(34,197,94,0.08)",
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

        <div style={{ padding: "24px 28px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: "bold",
            color: "#22c55e", textShadow: "0 0 20px rgba(34,197,94,0.8)",
            letterSpacing: "0.2em",
          }}>PEOPLE</h2>
          <button
            onClick={addPerson}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#22c55e", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}
          >+</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {people.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              onChange={updated => setPeople(prev => prev.map(x => x.id === updated.id ? updated : x))}
              onSound={onSound}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
