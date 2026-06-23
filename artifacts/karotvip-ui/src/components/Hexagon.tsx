import { useState } from "react";
import { motion } from "framer-motion";

interface HexagonProps {
  label: string;
  color: string;
  glowColor: string;
  size?: number;
  isNeighbor?: boolean;
  onClick: () => void;
  onHover?: () => void;
}

export function Hexagon({ label, color, glowColor, size = 100, isNeighbor = false, onClick, onHover }: HexagonProps) {
  const [hovered, setHovered] = useState(false);

  // Perceived speed: scale transition should be instant but smooth
  const scale = isNeighbor ? 0.92 : hovered ? 1.10 : 1.0;

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onHover?.(); }}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: isNeighbor ? 0.95 : 1.10 }}
      whileTap={{ scale: 0.94 }}
      animate={{ scale }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30, 
        mass: 0.8,
        duration: 0.2
      }}
      style={{
        width: size,
        height: size,
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: "none",
        position: "relative",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Invisible expanded hit area for ergonomic precision */}
      <div 
        style={{ 
          position: "absolute", 
          inset: -4, 
          clipPath: "inherit",
          zIndex: -1 
        }} 
      />

      {/* SVG hex border with glow */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation={hovered ? "4" : "2"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon
          points="50,2 98,26 98,74 50,98 2,74 2,26"
          fill="none"
          stroke={glowColor}
          strokeWidth={hovered ? "3" : "2"}
          filter={`url(#glow-${label})`}
          opacity={hovered ? 1 : 0.7}
        />
        <polygon
          points="50,2 98,26 98,74 50,98 2,74 2,26"
          fill={`${glowColor}08`}
        />
        {/* inner glow */}
        <ellipse
          cx="50" cy="55" rx="25" ry="20"
          fill={glowColor}
          opacity={hovered ? 0.18 : 0.10}
        />
      </svg>
      <span
        style={{
          color: glowColor,
          fontSize: size * 0.13,
          fontWeight: "bold",
          letterSpacing: "0.08em",
          textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}88`,
          fontFamily: "'RexBold', sans-serif",
          textTransform: "uppercase",
          zIndex: 1,
          userSelect: "none",
          textAlign: "center",
          padding: "0 6px",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}
