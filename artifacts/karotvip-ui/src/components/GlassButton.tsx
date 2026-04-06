import { ReactNode, useState } from "react";

interface GlassButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  onHover?: () => void;
}

const labelCycles: Record<string, string[]> = {
  Sound: ["Sound", "Audio", "Muted"],
  Mic: ["Mic", "Voice", "Muted"],
  Info: ["Info", "Help", "About"],
};

export function GlassButton({ icon, label, onClick, onHover }: GlassButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);

  const labels = labelCycles[label] || [label];
  const currentLabel = labels[cycleIdx];

  function handleClick() {
    setCycleIdx((i) => (i + 1) % labels.length);
    onClick?.();
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => { setHovered(true); onHover?.(); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 72,
        height: 72,
        borderRadius: 12,
        background: hovered
          ? "rgba(0, 180, 255, 0.15)"
          : "rgba(255, 255, 255, 0.06)",
        border: `1px solid ${hovered ? "rgba(0,180,255,0.5)" : "rgba(255,255,255,0.12)"}`,
        backdropFilter: "blur(16px)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transition: "all 0.25s ease",
        boxShadow: hovered ? "0 0 20px rgba(0,180,255,0.3)" : "none",
        userSelect: "none",
      }}
    >
      <div style={{ color: hovered ? "#00cfff" : "rgba(255,255,255,0.7)", fontSize: 22, transition: "color 0.2s" }}>
        {icon}
      </div>
      <span style={{
        color: hovered ? "#00cfff" : "rgba(255,255,255,0.5)",
        fontSize: 10,
        letterSpacing: "0.05em",
        fontFamily: "'Courier New', monospace",
        fontWeight: "bold",
        transition: "color 0.2s",
      }}>
        {currentLabel}
      </span>
    </div>
  );
}
