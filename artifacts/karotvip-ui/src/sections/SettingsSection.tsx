import { useState, useEffect, useRef } from "react";
import { HoneycombBackground } from "../components/HoneycombBackground";
import { useI18n } from "../i18n";

interface SettingsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
  soundEnabled: boolean;
  onSoundToggle: (v: boolean) => void;
  language?: "EN" | "RU" | "UK";
  onLanguageChange?: (l: "EN"|"RU"|"UK") => void;
}

const LANGUAGES = ["EN", "RU", "UK"];

function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'Courier New', monospace",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: on ? "rgba(160,50,255,0.4)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${on ? "rgba(160,50,255,0.6)" : "rgba(255,255,255,0.15)"}`,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.3s",
          boxShadow: on ? "0 0 12px rgba(160,50,255,0.4)" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: on ? 22 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: on ? "#c084fc" : "rgba(255,255,255,0.4)",
            transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: on ? "0 0 8px rgba(160,50,255,0.8)" : "none",
          }}
        />
      </div>
    </div>
  );
}

function GlassPlaqueCycler({
  value,
  values,
  onCycle,
}: {
  value: string;
  values: string[];
  onCycle: () => void;
}) {
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
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "rgba(160,50,255,0.16)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "rgba(160,50,255,0.08)")
      }
    >
      <span
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "'Courier New', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ApiKeyPlaque({ name, t }: { name: string, t: (k:string)=>string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        background: "rgba(160,50,255,0.06)",
        border: "1px solid rgba(160,50,255,0.18)",
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'Courier New', monospace",
          flex: 1,
        }}
      >
        {name}
      </span>
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="enter key..."
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#c084fc",
            fontSize: 12,
            fontFamily: "'Courier New', monospace",
            width: 80,
          }}
        />
      ) : null}
      <button
        onClick={() => setEditing(!editing)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: 14,
          padding: 0,
        }}
        title={t("common.edit")}
      >
        ✎
      </button>
      <button
        onClick={() => {
          setEditing(false);
        }}
        style={{
          background: "none",
          border: "none",
          color: "rgba(160,50,255,0.7)",
          cursor: "pointer",
          fontSize: 14,
          padding: 0,
        }}
        title={t("common.save")}
      >
        ✓
      </button>
    </div>
  );
}

export function SettingsSection({
  onClose,
  onSound,
  soundEnabled,
  onSoundToggle,
  language: propLanguage,
  onLanguageChange,
}: SettingsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [langIdx, setLangIdx] = useState(0);
  const [sysVoice, setSysVoice] = useState(false);
  const [city, setCity] = useState("");
  const [storage, setStorage] = useState("");
  const { t } = useI18n();
  const apiList = [
    "Cerebras",
    "OpenRouter",
    "Groq",
    "Picovoice",
    "Weather",
    "ElevenLabs",
  ];

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  useEffect(() => {
    if (propLanguage) {
      const idx = LANGUAGES.indexOf(propLanguage as string);
      if (idx >= 0) setLangIdx(idx);
    }
  }, [propLanguage]);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
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
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: 360,
          background: "rgba(5,5,20,0.95)",
          border: "1px solid rgba(160,50,255,0.3)",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 0 60px rgba(160,50,255,0.3), 0 0 120px rgba(160,50,255,0.1)",
          backdropFilter: "blur(24px)",
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(20px)",
          opacity: visible ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <HoneycombBackground />
        <div style={{ position: "relative", zIndex: 1, padding: 28 }}>
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ✕
          </button>

          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              background: "transparent",
              paddingBottom: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 22,
                fontWeight: "bold",
                color: "#a855f7",
                textShadow: "0 0 20px rgba(168,85,247,0.8)",
                letterSpacing: "0.2em",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {t("module.settings")}
            </h2>
          </div>

          <p
            style={{
              fontSize: 11,
              color: "#a855f7",
              letterSpacing: "0.15em",
              fontFamily: "'Courier New', monospace",
              marginBottom: 8,
            }}
          >
            {t("settings.language")}
          </p>
          <GlassPlaqueCycler
            value={`${t("settings.language")}: ${LANGUAGES[langIdx]}`}
            values={LANGUAGES}
            onCycle={() => {
              const next = (langIdx + 1) % LANGUAGES.length;
              setLangIdx(next);
              onSound("toggle");
              if (onLanguageChange) onLanguageChange(LANGUAGES[next] as any);
              if (typeof (window as any).setAppLanguage === "function")
                (window as any).setAppLanguage(LANGUAGES[next]);
            }}
          />

          <p
            style={{
              fontSize: 11,
              color: "#a855f7",
              letterSpacing: "0.15em",
              fontFamily: "'Courier New', monospace",
              marginBottom: 8,
            }}
          >
            {t("settings.apiKeys")}
          </p>
          {apiList.map((name) => (
            <ApiKeyPlaque key={name} name={name} t={t} />
          ))}

          {/* City input + save (replaces cycler) */}
          <div
            style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 6 }}
          >
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("settings.city")}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid rgba(168,85,247,0.45)",
                boxShadow: "0 0 10px rgba(168,85,247,0.06)",
                padding: "8px 10px",
                borderRadius: 6,
                color: "white",
              }}
            />
            <button
              onClick={() => {
                onSound("click"); /* pretend save */
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid rgba(168,85,247,0.35)",
                background: "rgba(160,50,255,0.08)",
                color: "#c084fc",
              }}
            >
              {t("common.save")}
            </button>
          </div>

          {/* Storage location selection */}
          <div
            style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 6 }}
          >
            <input
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder={t("settings.storage")}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid rgba(168,85,247,0.45)",
                boxShadow: "0 0 10px rgba(168,85,247,0.06)",
                padding: "8px 10px",
                borderRadius: 6,
                color: "white",
              }}
            />
            <button
              onClick={() => {
                onSound("click"); /* pretend select */
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid rgba(168,85,247,0.35)",
                background: "rgba(160,50,255,0.08)",
                color: "#c084fc",
              }}
            >
              {t("common.choose")}
            </button>
          </div>

          <div
            style={{
              marginTop: 8,
              borderTop: "1px solid rgba(160,50,255,0.15)",
              paddingTop: 14,
            }}
          >
            <Switch
              on={soundEnabled}
              onChange={(v) => {
                onSoundToggle(v);
                onSound("switch");
              }}
              label={t("settings.sound")}
            />
            <Switch
              on={sysVoice}
              onChange={(v) => {
                setSysVoice(v);
                onSound("switch");
              }}
              label={t("settings.voice")}
            />
          </div>

          {/* Usage indicators */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[
              ["RAM", "6.2 GB", "#a855f7"],
              ["VRAM", "2.1 GB", "#9333ea"],
              ["CPU", "34%", "#8b5cf6"],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: `${color}0a`,
                  border: `1px solid ${color}30`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.1em",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color,
                    fontWeight: "bold",
                    fontFamily: "'Courier New', monospace",
                    marginTop: 2,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
