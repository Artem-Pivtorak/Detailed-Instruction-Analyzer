import { useState, useEffect } from "react";

const LOREM = [
  "SYSTEM: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Quis suspiendisse ultrices gravida. Risus commodo viverra maecenas accumsan.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
  "MEMORY CORE: Active threads running. Stack trace analysis complete. 42 objects in heap.",
  "Neural cache loaded. Processing unit at 78% efficiency. Standby mode disabled.",
];

interface MemorySectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function MemorySection({ onClose, onSound }: MemorySectionProps) {
  const [visible, setVisible] = useState(false);
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    const iv = setInterval(() => setTextIdx(i => (i + 1) % LOREM.length), 4000);
    return () => clearInterval(iv);
  }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 380,
        background: "rgba(5,12,25,0.92)",
        border: "1px solid rgba(249,115,22,0.3)",
        borderRadius: 16,
        padding: 32,
        position: "relative",
        boxShadow: "0 0 60px rgba(249,115,22,0.25), 0 0 120px rgba(249,115,22,0.1)",
        backdropFilter: "blur(24px)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Close button */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 18, lineHeight: 1,
        }}>✕</button>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 22,
          fontWeight: "bold",
          color: "#f97316",
          textShadow: "0 0 20px rgba(249,115,22,0.8)",
          letterSpacing: "0.2em",
          marginBottom: 24,
          textAlign: "center",
        }}>MEMORY</h2>

        {/* Glass frame with triangular glow */}
        <div style={{
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.25)",
          borderRadius: 12,
          padding: 20,
          position: "relative",
          overflow: "hidden",
          minHeight: 200,
        }}>
          {/* Triangle glow */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 0,
            height: 0,
            borderLeft: "80px solid transparent",
            borderRight: "80px solid transparent",
            borderBottom: "140px solid rgba(249,115,22,0.08)",
            pointerEvents: "none",
            filter: "blur(20px)",
          }} />

          <div style={{
            position: "relative",
            zIndex: 1,
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.85)",
          }}>
            {LOREM.map((line, i) => (
              <p key={i} style={{
                margin: "0 0 8px 0",
                opacity: i === textIdx ? 1 : 0.5,
                transition: "opacity 0.5s",
                color: i === 0 ? "#fb923c" : "rgba(255,255,255,0.75)",
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* RAM / VRAM indicators */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {[["RAM", "6.2 GB", "#f97316"], ["VRAM", "2.1 GB", "#f97316"], ["CPU", "34%", "#fb923c"]].map(([label, val, color]) => (
            <div key={label} style={{
              flex: 1,
              background: "rgba(249,115,22,0.06)",
              border: `1px solid ${color}33`,
              borderRadius: 8,
              padding: "8px 10px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'Courier New', monospace" }}>{label}</div>
              <div style={{ fontSize: 14, color, fontWeight: "bold", fontFamily: "'Courier New', monospace", marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
