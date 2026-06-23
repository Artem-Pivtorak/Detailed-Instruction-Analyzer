import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [cycleIdx, setCycleIdx] = useState(0);

  const labels = labelCycles[label] || [label];
  const currentLabel = labels[cycleIdx];

  function handleClick() {
    setCycleIdx((i) => (i + 1) % labels.length);
    onClick?.();
  }

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={onHover}
      whileHover="hover"
      whileTap={{ scale: 0.96 }}
      initial="initial"
      variants={{
        initial: {
          scale: 1,
          background: "rgba(255, 255, 255, 0.05)",
          borderColor: "rgba(255, 255, 255, 0.10)",
          boxShadow: "none",
        },
        hover: {
          scale: 1.05,
          background: "rgba(0, 180, 255, 0.15)",
          borderColor: "rgba(0, 180, 255, 0.45)",
          boxShadow: "0 0 16px rgba(0, 180, 255, 0.20)",
        }
      }}
      style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Invisible expanded hit area for even better precision */}
      <div 
        style={{ 
          position: "absolute", 
          inset: -6, 
          borderRadius: "inherit",
          zIndex: -1 
        }} 
      />

      <motion.div 
        variants={{
          initial: { color: "rgba(255, 255, 255, 0.65)" },
          hover: { color: "#00cfff" }
        }}
        transition={{ duration: 0.15 }}
        style={{ 
          fontSize: 24, 
          display: "flex"
        }}
      >
        {icon}
      </motion.div>
      <motion.span 
        variants={{
          initial: { color: "rgba(255, 255, 255, 0.45)" },
          hover: { color: "#00cfff" }
        }}
        transition={{ duration: 0.15 }}
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          fontFamily: "'RexBold', sans-serif",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {currentLabel}
      </motion.span>
    </motion.div>
  );
}
