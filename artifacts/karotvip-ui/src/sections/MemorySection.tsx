import { useState, useEffect } from "react";
import { useI18n } from "../i18n";

interface MemoryBlock {
  speaker: string;
  text: string;
  color: string;
}

const MEMORY_BLOCKS: MemoryBlock[] = [
  {
    speaker: "Martin",
    text: "The neural network has stabilized. Core systems nominal.",
    color: "#00cfff",
  },
  {
    speaker: "Roman",
    text: "Processing external signals at optimal levels.",
    color: "#f97316",
  },
  {
    speaker: "Martin",
    text: "Initiating cache optimization sequence.",
    color: "#00cfff",
  },
  {
    speaker: "Alice",
    text: "Memory allocation: 73% utilized. Recommend cleanup cycle.",
    color: "#22c55e",
  },
  {
    speaker: "Roman",
    text: "Acknowledged. Running diagnostic protocols now.",
    color: "#f97316",
  },
  {
    speaker: "Martin",
    text: "All subsystems verified. Standing by for next command.",
    color: "#00cfff",
  },
];

interface MemorySectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
  language?: "EN" | "RU" | "UK";
}

export function MemorySection({
  onClose,
  onSound,
  language: _language = "EN",
}: MemorySectionProps) {
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [memoryFull, setMemoryFull] = useState(73);
  const { t } = useI18n();

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function handleDelete() {
    onSound("click");
    setMemoryFull(0);
  }

  function handleUnload() {
    onSound("switch");
    setMemoryFull(Math.max(0, memoryFull - 20));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(48px) saturate(150%)",
        WebkitBackdropFilter: "blur(48px) saturate(150%)", // Strong blur for the background
      }}
    >
      <div
        className="droplet-up"
        style={{
          width: 580,
          background: "#000000",
          border: "none",
          borderRadius: 24,
          padding: 40,
          position: "relative",
          boxShadow:
            "0 0 80px rgba(249,115,22,0.3), 0 0 160px rgba(249,115,22,0.15)",
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(20px)",
          opacity: visible ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 20,
            right: 12,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32, // Increased title size
            fontWeight: "bold",
            color: "#f97316",
            textShadow: "0 0 20px rgba(249,115,22,0.8)",
            letterSpacing: "0.2em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          {t("module.memory")}
        </h2>

        {/* Memory blocks — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: 20,
            paddingRight: 8,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {MEMORY_BLOCKS.map((block, idx) => (
            <div
              key={idx}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                onSound("hover");
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background:
                  hoveredIdx === idx
                    ? "rgba(249,115,22,0.15)"
                    : "rgba(249,115,22,0.08)",
                border: `1px solid ${hoveredIdx === idx ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.2)"}`,
                borderRadius: 8,
                padding: 12,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow:
                  hoveredIdx === idx
                    ? `0 0 12px rgba(249,115,22,0.25)`
                    : "none",
                transform:
                  hoveredIdx === idx ? "translateX(4px)" : "translateX(0)",
              }}
            >
              <div
                style={{
                  fontFamily: "'RexBold', sans-serif",
                  fontSize: 16, // Increased speaker size
                  fontWeight: "bold",
                  color: block.color,
                  textShadow: `0 0 12px ${block.color}80`,
                  marginBottom: 8,
                  letterSpacing: "0.08em",
                }}
              >
                {block.speaker}
              </div>
              <div
                style={{
                  fontFamily: "'RexBold', sans-serif",
                  fontSize: 18, // Increased text size
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.6,
                }}
              >
                {block.text}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom controls: 3 buttons and memory percentage */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          {/* Delete button (red) */}
          <button
            onClick={handleDelete}
            onMouseEnter={() => onSound("hover")}
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              borderRadius: 10,
              color: "#ef4444",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16, // Increased font
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.boxShadow =
                "0 0 12px rgba(239, 68, 68, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("common.delete")}
          </button>

          {/* Memory percentage frame (middle) */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(249,115,22,0.12)",
              border: "2px solid rgba(249,115,22,0.4)",
              borderRadius: 10,
              textAlign: "center",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16, // Increased font
              fontWeight: "bold",
              color: "#f97316",
              textShadow: "0 0 12px rgba(249,115,22,0.6)",
              letterSpacing: "0.08em",
            }}
          >
            {memoryFull}% {t("memory.full")}
          </div>

          {/* Unload button (orange) */}
          <button
            onClick={handleUnload}
            onMouseEnter={() => onSound("hover")}
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(249,115,22,0.2)",
              border: "2px solid rgba(249,115,22,0.5)",
              borderRadius: 10,
              color: "#f97316",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16, // Increased font
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(249,115,22,0.3)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(249,115,22,0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(249,115,22,0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("memory.unload")}
          </button>
        </div>
      </div>
    </div>
  );
}
