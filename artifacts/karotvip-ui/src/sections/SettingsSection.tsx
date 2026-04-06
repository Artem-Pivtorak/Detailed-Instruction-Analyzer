import { useState, useEffect, useRef } from "react";

interface SettingsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
  soundEnabled: boolean;
  onSoundToggle: (v: boolean) => void;
}

const LANGUAGES = ["ENGLISH", "UKRAINIAN", "GERMAN", "FRENCH", "JAPANESE"];
const CITIES = ["KYIV", "NEW YORK", "LONDON", "TOKYO", "BERLIN"];

function FloatingSphere({ x, y, r, color, dur }: { x: number; y: number; r: number; color: string; dur: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const node = el.current;
    let t = 0;
    let ox = x, oy = y;
    let vx = (Math.random() - 0.5) * 0.15;
    let vy = (Math.random() - 0.5) * 0.15;
    let frame: number;
    function tick() {
      t += 0.005 / dur;
      ox += vx;
      oy += vy;
      if (ox < 5 || ox > 95) vx *= -1;
      if (oy < 5 || oy > 95) vy *= -1;
      const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.08;
      node.style.left = `${ox}%`;
      node.style.top = `${oy}%`;
      node.style.transform = `translate(-50%,-50%) scale(${pulse})`;
      frame = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={el} style={{
      position: "absolute",
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44, transparent)`,
      boxShadow: `0 0 ${r}px ${color}66, 0 0 ${r * 2}px ${color}22`,
      pointerEvents: "none",
    }} />
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}>{label}</span>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: on ? "rgba(160,50,255,0.4)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${on ? "rgba(160,50,255,0.6)" : "rgba(255,255,255,0.15)"}`,
          cursor: "pointer", position: "relative",
          transition: "all 0.3s",
          boxShadow: on ? "0 0 12px rgba(160,50,255,0.4)" : "none",
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: on ? 22 : 3,
          width: 16, height: 16, borderRadius: "50%",
          background: on ? "#c084fc" : "rgba(255,255,255,0.4)",
          transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: on ? "0 0 8px rgba(160,50,255,0.8)" : "none",
        }} />
      </div>
    </div>
  );
}

function GlassPlaqueCycler({ value, values, onCycle }: { value: string; values: string[]; onCycle: () => void }) {
  return (
    <div
      onClick={onCycle}
      style={{
        background: "rgba(160,50,255,0.08)",
        border: "1px solid rgba(160,50,255,0.25)",
        borderRadius: 10,
        padding: "10px 16px",
        cursor: "pointer",
        marginBottom: 16,
        transition: "all 0.2s",
        userSelect: "none",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(160,50,255,0.16)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(160,50,255,0.08)"}
    >
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Courier New', monospace" }}>
        {value}
      </span>
    </div>
  );
}

function ApiKeyPlaque({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
      background: "rgba(160,50,255,0.06)",
      border: "1px solid rgba(160,50,255,0.18)",
      borderRadius: 10, padding: "8px 12px",
    }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Courier New', monospace", flex: 1 }}>{name}</span>
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="enter key..."
          style={{
            background: "transparent", border: "none", outline: "none",
            color: "#c084fc", fontSize: 12, fontFamily: "'Courier New', monospace",
            width: 80,
          }}
        />
      ) : null}
      <button
        onClick={() => setEditing(!editing)}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, padding: 0 }}
        title="Edit"
      >✎</button>
      <button
        onClick={() => { setEditing(false); }}
        style={{ background: "none", border: "none", color: "rgba(160,50,255,0.7)", cursor: "pointer", fontSize: 14, padding: 0 }}
        title="Save"
      >✓</button>
    </div>
  );
}

const spheres = [
  { x: 20, y: 25, r: 30, color: "#9333ea", dur: 0.7 },
  { x: 70, y: 60, r: 50, color: "#7c3aed", dur: 0.4 },
  { x: 45, y: 80, r: 22, color: "#a855f7", dur: 0.9 },
  { x: 80, y: 20, r: 18, color: "#6d28d9", dur: 0.6 },
  { x: 10, y: 65, r: 14, color: "#8b5cf6", dur: 1.1 },
];

export function SettingsSection({ onClose, onSound, soundEnabled, onSoundToggle }: SettingsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [langIdx, setLangIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [sysVoice, setSysVoice] = useState(false);

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
        width: 360,
        background: "rgba(5,5,20,0.95)",
        border: "1px solid rgba(160,50,255,0.3)",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(160,50,255,0.3), 0 0 120px rgba(160,50,255,0.1)",
        backdropFilter: "blur(24px)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Animated spheres bg */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {spheres.map((s, i) => <FloatingSphere key={i} {...s} />)}
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: 28 }}>
          <button onClick={handleClose} style={{
            position: "absolute", top: 12, right: 16,
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            cursor: "pointer", fontSize: 18,
          }}>✕</button>

          <h2 style={{
            fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: "bold",
            color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.8)",
            letterSpacing: "0.2em", marginBottom: 24, textAlign: "center",
          }}>Settings</h2>

          <p style={{ fontSize: 11, color: "#a855f7", letterSpacing: "0.15em", fontFamily: "'Courier New', monospace", marginBottom: 8 }}>LANGUAGE</p>
          <GlassPlaqueCycler
            value={`LANGUAGE: ${LANGUAGES[langIdx]}`}
            values={LANGUAGES}
            onCycle={() => { setLangIdx(i => (i + 1) % LANGUAGES.length); onSound("toggle"); }}
          />

          <p style={{ fontSize: 11, color: "#a855f7", letterSpacing: "0.15em", fontFamily: "'Courier New', monospace", marginBottom: 8 }}>API KEYS</p>
          {["Picovoice", "Weather", "ElevenLabs"].map(name => (
            <ApiKeyPlaque key={name} name={name} />
          ))}

          <p style={{ fontSize: 11, color: "#a855f7", letterSpacing: "0.15em", fontFamily: "'Courier New', monospace", marginBottom: 8, marginTop: 8 }}>CITY</p>
          <GlassPlaqueCycler
            value={CITIES[cityIdx]}
            values={CITIES}
            onCycle={() => { setCityIdx(i => (i + 1) % CITIES.length); onSound("toggle"); }}
          />

          <div style={{ marginTop: 8, borderTop: "1px solid rgba(160,50,255,0.15)", paddingTop: 14 }}>
            <Switch on={soundEnabled} onChange={v => { onSoundToggle(v); onSound("switch"); }} label="Sound Off / On" />
            <Switch on={sysVoice} onChange={v => { setSysVoice(v); onSound("switch"); }} label="System Text & Voice" />
          </div>

          {/* Usage indicators */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[["RAM", "6.2 GB", "#a855f7"], ["VRAM", "2.1 GB", "#9333ea"], ["CPU", "34%", "#8b5cf6"]].map(([label, val, color]) => (
              <div key={label} style={{
                flex: 1,
                background: `${color}0a`,
                border: `1px solid ${color}30`,
                borderRadius: 8, padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'Courier New', monospace" }}>{label}</div>
                <div style={{ fontSize: 14, color, fontWeight: "bold", fontFamily: "'Courier New', monospace", marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
