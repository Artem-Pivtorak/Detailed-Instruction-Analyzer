import { useEffect, useRef, useState } from "react";
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
  | "people"
  | "kraken";

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
    key: "kraken",
    name: "K.R.A.K.E.N.",
    color: "#ff0080",
    icon: pluginsIcon,
  },
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
          minHeight: 46,
          background: open ? `${plugin.color}18` : `${plugin.color}0a`,
          border: `1px solid ${open ? plugin.color + "55" : plugin.color + "28"}`,
          borderRadius: open ? "8px 8px 0 0" : 8,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: "6px 4px",
          transition: "all 0.20s ease",
          boxShadow: open ? `0 0 14px ${plugin.color}30` : "none",
          position: "relative",
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
                transition: "opacity 0.2s",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: 7.5,
            color: open ? plugin.color : "rgba(255,255,255,0.80)",
            letterSpacing: "0.01em",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            transition: "color 0.2s",
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
            transition: "transform 0.2s ease",
          }}
        >
          ▾
        </span>
      </button>

      <div
        style={{
          position: "absolute",
          top: "100%",
          left: alignRight ? "auto" : 0,
          right: alignRight ? 0 : "auto",
          minWidth: "100%",
          width: fullWidth ? "100%" : "max-content",
          background: "rgba(4, 12, 26, 0.99)",
          border: `1px solid ${plugin.color}40`,
          borderTop: "none",
          borderRadius: alignRight ? "8px 0 8px 8px" : "0 8px 8px 8px",
          overflow: "hidden",
          maxHeight: open ? 250 : 0,
          opacity: open ? 1 : 0,
          transition:
            "max-height 0.26s cubic-bezier(0.22,1,0.36,1), opacity 0.20s ease",
          zIndex: 400,
          boxShadow: open
            ? `0 8px 24px rgba(0,0,0,0.8), 0 0 18px ${plugin.color}25`
            : "none",
          overflowY: "auto",
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
                padding: "10px 12px",
                background: isActive ? `${plugin.color}18` : "transparent",
                border: "none",
                borderBottom:
                  i < plugin.options.length - 1
                    ? `1px solid ${plugin.color}15`
                    : "none",
                cursor: "pointer",
                textAlign: "left",
                color: isActive ? plugin.color : "rgba(255,255,255,0.70)",
                fontSize: 9,
                fontFamily: "'Courier New', monospace",
                fontWeight: isActive ? "bold" : "normal",
                letterSpacing: "0.04em",
                transition: "background 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
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
                  transition: "all 0.15s",
                }}
              />
              {opt.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useI18n } from "../i18n";

export function SidePanel({
  open,
  onClose,
  onSound,
  onOpenSection,
}: SidePanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);
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
      {open && (
        <div
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

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 280,
          height: "100%",
          background: "rgba(4, 12, 26, 0.96)",
          backdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(0,180,255,0.18)",
          zIndex: 300,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? "6px 0 50px rgba(0,80,220,0.25)" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 18px 14px",
            borderBottom: "1px solid rgba(0,180,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00cfff",
                boxShadow: "0 0 10px #00cfff, 0 0 20px #00cfff",
              }}
            />
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 15,
                fontWeight: "bold",
                letterSpacing: "0.2em",
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
              borderRadius: 6,
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 14,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
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
            padding: "14px 14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderBottom: "1px solid rgba(0,180,255,0.08)",
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
              gap: "8px 10px",
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
        <div style={{ padding: "16px 14px", flex: 1, overflowY: "auto" }}>
          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.14em",
              marginBottom: 10,
              fontFamily: "'Courier New', monospace",
              paddingLeft: 4,
            }}
          >
            MODULES
          </p>

          {MODULES.map((item) => {
            const isHov = hovered === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleModuleClick(item.key)}
                onMouseEnter={() => {
                  setHovered(item.key);
                  onSound("hover");
                }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  cursor: "pointer",
                  background: isHov
                    ? `${item.color}16`
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isHov ? item.color + "50" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: isHov
                    ? `0 0 18px ${item.color}25, inset 0 0 12px ${item.color}08`
                    : "none",
                  transform: isHov ? "translateX(3px)" : "translateX(0)",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: isHov ? `0 0 10px ${item.color}60` : "none",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  <img
                    src={item.icon}
                    alt={item.name.toLowerCase()}
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "bold",
                    color: isHov ? item.color : "rgba(255,255,255,0.65)",
                    letterSpacing: "0.07em",
                    transition: "color 0.2s",
                    textShadow: isHov ? `0 0 10px ${item.color}80` : "none",
                  }}
                >
                  {t(item.name)}
                </span>

                <div
                  style={{
                    marginLeft: "auto",
                    color: isHov ? item.color : "rgba(255,255,255,0.15)",
                    fontSize: 10,
                    transition: "all 0.2s",
                    transform: isHov ? "translateX(2px)" : "translateX(0)",
                  }}
                >
                  ▶
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid rgba(0,180,255,0.08)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.18)",
              fontFamily: "Arial, sans-serif",
            }}
          >
            v2.0 — M.A.R.T.I.N. Industries Inc.
          </span>
        </div>
      </div>
    </>
  );
}
