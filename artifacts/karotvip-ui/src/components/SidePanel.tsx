import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidGlass } from "./LiquidGlass";
import memoryIcon from "../../../../images-icons/memory.png";
import settingsIcon from "../../../../images-icons/settings.png";
import peopleIcon from "../../../../images-icons/people.png";
import reminderIcon from "../../../../images-icons/reminder.png";
import pluginsIcon from "../../../../images-icons/plugins.png";
import commandsIcon from "../../../../images-icons/comands.png";
import addCommandsIcon from "../../../../images-icons/add comands.png";

type Section =
  | "memory"
  | "settings"
  | "reminder"
  | "plugins"
  | "commands"
  | "addcommands"
  | "people";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
  onOpenSection: (section: Section) => void;
}

const MODULES: { key: Section; name: string; color: string; icon: string }[] = [
  { key: "memory", name: "module.memory", color: "#f97316", icon: memoryIcon },
  {
    key: "settings",
    name: "module.settings",
    color: "#a855f7",
    icon: settingsIcon,
  },
  { key: "people", name: "module.people", color: "#22c55e", icon: peopleIcon },
  {
    key: "reminder",
    name: "module.reminder",
    color: "#eab308",
    icon: reminderIcon,
  },
  {
    key: "plugins",
    name: "module.plugins",
    color: "#3b82f6",
    icon: pluginsIcon,
  },
  {
    key: "commands",
    name: "module.commands",
    color: "#06b6d4",
    icon: commandsIcon,
  },
  {
    key: "addcommands",
    name: "module.addcommands",
    color: "#10b981",
    icon: addCommandsIcon,
  },
];

interface PluginConfig {
  id: string;
  label: string;
  color: string;
  options: string[];
}

const LLM_MODELS_MAP: Record<string, string[]> = {
  CEREBRAS: ["llama3.1-8b"],
  REQUESTS: [
    "openai/gpt-4o-mini",
    "baidu/cobuddy:free",
    "google/gemma-3-27b-it",
    "google/gemma-3-4b-it",
    "google/gemma-4-26b-a4b-it",
    "google/gemma-4-31b-it",
  ],
  GROQ: [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
  ],
  "LLAMA-CPP": ["Default Model"],
};

function PluginDropdown({
  plugin,
  onSound,
  alignRight = false,
  selected,
  onSelect,
  fullWidth = false,
}: {
  plugin: PluginConfig;
  onSound: (t: string) => void;
  alignRight?: boolean;
  selected: string;
  onSelect: (opt: string) => void;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggle() {
    setOpen((v) => !v);
    onSound(open ? "close" : "click");
  }

  function choose(opt: string) {
    onSelect(opt);
    setOpen(false);
    onSound("switch");
  }

  return (
    <div
      ref={ref}
      style={{
        flex: fullWidth ? "none" : 1,
        width: fullWidth ? "100%" : "auto",
        position: "relative",
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: "100%",
          minHeight: 60,
          background: open ? `${plugin.color}18` : `${plugin.color}0a`,
          border: `1px solid ${open ? plugin.color + "55" : plugin.color + "28"}`,
          borderRadius: open ? "8px 8px 0 0" : 8,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "8px 6px",
          transition: "background 0.15s, border-color 0.15s, border-radius 0.15s, box-shadow 0.15s",
          boxShadow: open ? `0 0 14px ${plugin.color}30` : "none",
          position: "relative",
          fontFamily: "'RexBold', sans-serif",
        }}
        onMouseEnter={() => onSound("hover")}
      >
        <div
          style={{
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            height: 10,
            flexShrink: 0,
          }}
        >
          {[3, 6, 4, 7, 5, 8, 4].map((h, i) => (
            <div
              key={i}
              style={{
                width: 2,
                height: h * 0.7,
                background: plugin.color,
                borderRadius: 1,
                opacity: open ? 1 : 0.75,
                transition: "opacity 0.15s ease-out",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: open ? plugin.color : "rgba(255,255,255,0.80)",
            letterSpacing: "0.02em",
            fontFamily: "'RexBold', sans-serif",
            fontWeight: "bold",
            transition: "color 0.15s ease-out",
            textAlign: "center",
            lineHeight: "1.2",
            wordBreak: "break-word",
            whiteSpace: "normal",
            width: "100%",
          }}
        >
          {plugin.label}: {selected.toUpperCase()}
        </span>
        <span
          style={{
            position: "absolute",
            right: 3,
            top: 3,
            fontSize: 6,
            color: `${plugin.color}80`,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease-out",
          }}
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.5 }}
            style={{
              position: "absolute",
              top: "100%",
              left: alignRight ? "auto" : 0,
              right: alignRight ? 0 : "auto",
              minWidth: fullWidth ? "100%" : "100%",
              width: fullWidth ? "100%" : "max-content",
              maxWidth: fullWidth ? "100%" : "280px",
              background: "#000000",
              border: `1px solid ${plugin.color}40`,
              borderTop: "none",
              borderRadius: alignRight ? "8px 0 8px 8px" : "0 8px 8px 8px",
              overflow: "hidden",
              zIndex: 400,
              boxShadow: open
                ? `0 8px 24px rgba(0,0,0,0.8), 0 0 18px ${plugin.color}25`
                : "none",
              overflowY: "auto",
              maxHeight: 250,
            }}
          >
            {plugin.options.map((opt, i) => {
              const isActive = opt === selected;
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    background: isActive ? `${plugin.color}18` : "transparent",
                    border: "none",
                    borderBottom:
                      i < plugin.options.length - 1
                        ? `1px solid ${plugin.color}15`
                        : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isActive ? plugin.color : "rgba(255,255,255,0.70)",
                    fontSize: 13,
                    fontFamily: "'RexBold', sans-serif",
                    fontWeight: isActive ? "bold" : "normal",
                    letterSpacing: "0.04em",
                    transition: "background 0.1s, color 0.1s",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    whiteSpace: "nowrap",
                    lineHeight: "1.4",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = `${plugin.color}12`;
                      e.currentTarget.style.color = `${plugin.color}cc`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.70)";
                    }
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isActive ? plugin.color : "rgba(255,255,255,0.2)",
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 6px ${plugin.color}` : "none",
                      transition: "all 0.1s",
                    }}
                  />
                  {opt.toUpperCase()}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useI18n } from "../i18n";

// ... props ...
export function SidePanel({
  open,
  onClose,
  onSound,
  onOpenSection,
}: SidePanelProps) {
  const { t } = useI18n();

  // Lifted plugin states
  const [tts, setTts] = useState("ElevenLabs");
  const [stt, setStt] = useState("Vosk");
  const [picovoice, setPicovoice] = useState("Picovoice");
  const [llmEngine, setLlmEngine] = useState("GROQ");
  const [llmModel, setLlmModel] = useState(LLM_MODELS_MAP["GROQ"][0]);

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        onSound("close");
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose, onSound]);

  function handleModuleClick(key: Section) {
    onOpenSection(key);
    onSound("open");
    onClose();
  }

  const pluginsConfig: (PluginConfig & {
    selected: string;
    onSelect: (v: string) => void;
  })[] = [
    {
      id: "elevenlabs",
      label: "TTS",
      color: "#00cfff",
      options: ["ElevenLabs", "Edge", "XTTS"],
      selected: tts,
      onSelect: setTts,
    },
    {
      id: "vosk",
      label: "STT",
      color: "#a855f7",
      options: ["Vosk", "Google SR"],
      selected: stt,
      onSelect: setStt,
    },
    {
      id: "picovoice",
      label: "ACT",
      color: "#22c55e",
      options: ["Picovoice", "Vosk", "Rustpotter"],
      selected: picovoice,
      onSelect: setPicovoice,
    },
    {
      id: "llm_engine",
      label: "LLM",
      color: "#f87171",
      options: Object.keys(LLM_MODELS_MAP),
      selected: llmEngine,
      onSelect: (val) => {
        setLlmEngine(val);
        setLlmModel(LLM_MODELS_MAP[val][0]);
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose();
              onSound("close");
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 200,
              backdropFilter: "blur(3px)",
            }}
          />
        )}
      </AnimatePresence>


      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 35,
              mass: 0.6,
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 450,
              height: "100%",
              zIndex: 300,
              display: "flex",
              flexDirection: "column",
              boxShadow: "10px 0 60px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            {/* WebGL liquid glass effect */}
            <LiquidGlass
              width={450}
              height="100%"
              style={{ position: "absolute", top: 0, left: 0, zIndex: 0, width: "100%", height: "100%" }}
              borderRadius={0}
            />
            
            {/* Content wrapper with higher z-index */}
            <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <div
          style={{
            padding: "36px 32px 24px",
            borderBottom: "1px solid rgba(0,180,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#00cfff",
                boxShadow: "0 0 10px #00cfff, 0 0 20px #00cfff",
              }}
            />
            <span
              style={{
                fontFamily: "pdark",
                fontSize: 22,
                fontWeight: "bold",
                letterSpacing: "0.15em",
                color: "#00cfff",
                textShadow: "0 0 12px rgba(0,200,255,0.6)",
              }}
            >
              {t("appName")}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onSound("close");
            }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 22,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s ease-out, background 0.15s ease-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
            }
          >
            ✕
          </button>
        </div>

        {/* Plugin dropdowns area */}
        <div
          style={{
            padding: "24px 28px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderBottom: "1px solid rgba(120,120,120,0.15)",
            flexShrink: 0,
            position: "relative",
            zIndex: 350,
          }}
        >
          {/* First 4: Grid 2x2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px 16px",
            }}
          >
            {pluginsConfig.map((p, idx) => (
              <PluginDropdown
                key={p.id}
                plugin={p}
                onSound={onSound}
                selected={p.selected}
                onSelect={p.onSelect}
                alignRight={idx % 2 === 1}
              />
            ))}
          </div>

          {/* LLM Model: Full width row */}
          <PluginDropdown
            plugin={{
              id: "llm_model",
              label: "MODEL",
              color: "#f87171",
              options: LLM_MODELS_MAP[llmEngine],
            }}
            onSound={onSound}
            selected={llmModel}
            onSelect={setLlmModel}
            fullWidth
          />
        </div>

        {/* Module buttons */}
        <div style={{ padding: "28px 28px", flex: 1, overflowY: "auto", borderTop: "1px solid rgba(120,120,120,0.15)" }}>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.14em",
              marginBottom: 18,
              fontFamily: "pdark",
              paddingLeft: 4,
            }}
          >
            MODULES
          </p>

          {MODULES.map((item) => {
            return (
              <motion.button
                key={item.key}
                onClick={() => handleModuleClick(item.key)}
                onMouseEnter={() => {
                  onSound("hover");
                }}
                whileHover="hover"
                initial="initial"
                whileTap={{ scale: 0.98 }}
                variants={{
                  initial: { 
                    background: "transparent",
                    borderLeftColor: "transparent" 
                  },
                  hover: { 
                    x: 6,
                    background: `${item.color}12`,
                    borderLeftColor: item.color 
                  }
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  width: "100%",
                  padding: "16px 28px",
                  borderRadius: 0,
                  marginBottom: 0,
                  cursor: "pointer",
                  border: "none",
                  borderLeft: `3px solid transparent`,
                  textAlign: "left",
                  position: "relative",
                }}
              >
                <motion.div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  variants={{
                    initial: { scale: 1 },
                    hover: { scale: 1.05 }
                  }}
                >
                  <img
                    src={item.icon}
                    alt={item.name.toLowerCase()}
                    style={{ width: 26, height: 26, objectFit: "contain" }}
                  />
                </motion.div>

                <motion.span
                  variants={{
                    initial: { color: "rgba(255,255,255,0.60)" },
                    hover: { color: item.color }
                  }}
                  style={{
                    fontSize: 15,
                    fontFamily: "RexBold",
                    fontWeight: "bold",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}
                >
                  {t(item.name)}
                </motion.span>

                <motion.div
                  variants={{
                    initial: { color: "rgba(255,255,255,0.1)", x: 0 },
                    hover: { color: item.color, x: 4 }
                  }}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                  }}
                >
                  ▶
                </motion.div>
              </motion.button>
            );
          })}
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
