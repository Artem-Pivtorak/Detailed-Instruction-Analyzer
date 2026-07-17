import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";

interface SettingsSectionProps {
  open: boolean;
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
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'RexBold', sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <div
        onClick={() => onChange(!on)}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        }}
        style={{
          width: 56,
          height: 30,
          borderRadius: 15,
          background: on ? "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)" : "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
          border: `2px solid ${on ? "rgba(168, 85, 247, 0.9)" : "rgba(255, 255, 255, 0.3)"}`,
          cursor: "pointer",
          position: "relative",
          transition: "transform 0.1s, all 0.3s",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: on ? "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)" : "0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 5px rgba(255, 255, 255, 0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: on ? 28 : 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: on ? "#c084fc" : "#ffffff40",
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
        background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
        border: "2px solid rgba(168, 85, 247, 0.9)",
        borderRadius: 20,
        padding: "14px 20px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
        cursor: "pointer",
        transition: "transform 0.1s, background 0.2s",
        marginBottom: 16,
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        ((e.currentTarget as HTMLDivElement).style.background =
          "#a855f718");
      }}
      onMouseLeave={(e) => {
        ((e.currentTarget as HTMLDivElement).style.background =
          "#a855f70a");
      }}
      onMouseDown={(e) => {
        ((e.currentTarget as HTMLDivElement).style.transform =
          "scale(0.98)");
      }}
      onMouseUp={(e) => {
        ((e.currentTarget as HTMLDivElement).style.transform =
          "scale(1)");
      }}
    >
      <span
        style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "'RexBold', sans-serif"
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ApiKeyPlaque({ name, t }: { name: string, t: (k:string)=>string }) {
  const [val, setVal] = useState("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 10,
        background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
        border: "2px solid rgba(168, 85, 247, 0.9)",
        borderRadius: 20,
        padding: "12px 16px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
      }}
    >
      <span
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'RexBold', sans-serif",
          flex: 1,
        }}
      >
        {name}
      </span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="enter key..."
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#c084fc",
          fontSize: 16,
          fontFamily: "'RexBold', sans-serif",
          width: 290,
          marginRight: 50,
        }}
      />
    </div>
  );
}

export function SettingsSection({
  open,
  onClose,
  onSound,
  soundEnabled,
  onSoundToggle,
  language: propLanguage,
  onLanguageChange,
}: SettingsSectionProps) {
  const [langIdx, setLangIdx] = useState(0);
  const [sysVoice, setSysVoice] = useState(false);
  const [city, setCity] = useState("");
  const [storage, setStorage] = useState("");
  const [permOpenApps, setPermOpenApps] = useState(false);
  const [permAnalyzeSystem, setPermAnalyzeSystem] = useState(false);
  const [permSeeFolders, setPermSeeFolders] = useState(false);
  const [permControlSystem, setPermControlSystem] = useState(false);
  const [permControlVideo, setPermControlVideo] = useState(false);
  const [showReturnList, setShowReturnList] = useState(false);
  const [returnItems, setReturnItems] = useState([
    { id: "r1", label: "Видалена команда: «Увімкни світло»" },
    { id: "r2", label: "Видалений контакт: «Марина»" },
    { id: "r3", label: "Видалене нагадування: «Зустріч о 15:00»" },
  ]);
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
    if (propLanguage) {
      const idx = LANGUAGES.indexOf(propLanguage as string);
      if (idx >= 0) setLangIdx(idx);
    }
  }, [propLanguage]);

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(48px) saturate(150%)",
            WebkitBackdropFilter: "blur(48px) saturate(150%)",
          }}
        >
      <motion.div
        initial={{ width: 0, height: 0 }}
        animate={{ width: 580, height: "auto" }}
        exit={{ width: 0, height: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut", times: [0, 0.5, 1] }}
        style={{
          background: "#000000",
          border: "2px solid rgba(160,50,255,0.4)",
          borderRadius: 24,
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 0 80px rgba(160,50,255,0.3), 0 0 160px rgba(160,50,255,0.15)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 12,
            zIndex: 10,
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
        <div style={{ padding: "40px 40px 20px 40px", background: "#000000", zIndex: 5, position: "relative", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <h2
            style={{
              fontFamily: "'pdark', sans-serif",
              fontSize: 32,
              fontWeight: "bold",
              color: "#a855f7",
              textShadow: "0 0 20px rgba(168,85,247,0.8)",
              letterSpacing: "0.2em",
              margin: 0,
              textAlign: "center",
            }}
          >
            {t("module.settings")}
          </h2>
        </div>
        <div
          style={{
            maxHeight: "calc(90vh - 100px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="settings-scroll-container"
        >
        <style>{`
          .settings-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
          <div style={{ position: "relative", zIndex: 1, padding: "0 40px 40px 40px", marginTop: 10 }}>

          <p
            style={{
              fontSize: 16,
              color: "#a855f7",
              letterSpacing: "0.15em",
              fontFamily: "'RexBold', sans-serif",
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
              onSound("click-4");
              if (onLanguageChange) onLanguageChange(LANGUAGES[next] as any);
              if (typeof (window as any).setAppLanguage === "function")
                (window as any).setAppLanguage(LANGUAGES[next]);
            }}
          />

          <p
            style={{
              fontSize: 16,
              color: "#a855f7",
              letterSpacing: "0.15em",
              fontFamily: "'RexBold', sans-serif",
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
            style={{ display: "flex", gap: 8, marginTop: 30, marginBottom: 6, justifyContent: "center" }}
          >
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("settings.city")}
              style={{
                width: 150,
                background: "transparent",
                border: "2px solid rgba(168, 85, 247, 0.9)",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
                padding: "12px 16px",
                borderRadius: 20,
                color: "white",
              }}
            />
            <button
              onClick={() => {
                onSound("click"); /* pretend save */
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 20,
                border: "2px solid rgba(168, 85, 247, 0.9)",
                background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
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
                border: "2px solid rgba(168, 85, 247, 0.9)",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
                padding: "12px 16px",
                borderRadius: 20,
                color: "white",
              }}
            />
            <button
              onClick={() => {
                onSound("click"); /* pretend select */
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 20,
                border: "2px solid rgba(168, 85, 247, 0.9)",
                background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                color: "#c084fc",
                cursor: "pointer",
                transition: "transform 0.1s, background 0.2s",
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
                onSound("click-4");
              }}
              label="PEOPLE RECOGNITION"
            />
            <Switch
              on={sysVoice}
              onChange={(v) => {
                setSysVoice(v);
                onSound("switch");
              }}
              label={t("settings.voice")}
            />

            <div
              style={{
                marginTop: 20,
                marginBottom: 14,
                borderTop: "1px solid rgba(160,50,255,0.15)",
                paddingTop: 14,
              }}
            >
              <Switch
                on={permOpenApps}
                onChange={(v) => {
                  setPermOpenApps(v);
                  onSound("switch");
                }}
                label={t("settings.permOpenApps")}
              />
              <Switch
                on={permAnalyzeSystem}
                onChange={(v) => {
                  setPermAnalyzeSystem(v);
                  onSound("switch");
                }}
                label={t("settings.permAnalyzeSystem")}
              />
              <Switch
                on={permSeeFolders}
                onChange={(v) => {
                  setPermSeeFolders(v);
                  onSound("switch");
                }}
                label={t("settings.permSeeFolders")}
              />
              <Switch
                on={permControlSystem}
                onChange={(v) => {
                  setPermControlSystem(v);
                  onSound("switch");
                }}
                label={t("settings.permControlSystem")}
              />
              <Switch
                on={permControlVideo}
                onChange={(v) => {
                  setPermControlVideo(v);
                  onSound("switch");
                }}
                label={t("settings.permControlVideo")}
              />
            </div>

            <div
              onClick={() => {
                onSound("click-4");
                setShowReturnList(true);
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
              }}
              style={{
                background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                border: "2px solid rgba(168, 85, 247, 0.9)",
                borderRadius: 20,
                padding: "14px 20px",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
                cursor: "pointer",
                transition: "transform 0.1s, background 0.2s",
                marginTop: 4,
                marginBottom: 16,
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "'RexBold', sans-serif",
                }}
              >
                {t("settings.returnList")}
              </span>
              <span style={{ fontSize: 18, color: "#c084fc" }}>›</span>
            </div>
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
                    fontSize: 14,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.1em",
                    fontFamily: "'RexBold', sans-serif",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color,
                    fontWeight: "bold",
                    fontFamily: "'RexBold', sans-serif",
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
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showReturnList && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              background: "#000000",
              border: "2px solid rgba(160,50,255,0.4)",
              borderRadius: 24,
              padding: 32,
              width: 460,
              maxHeight: "70vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 0 80px rgba(160,50,255,0.3), 0 0 160px rgba(160,50,255,0.15)",
            }}
          >
            <button
              onClick={() => {
                onSound("click-3-clowse");
                setShowReturnList(false);
              }}
              style={{
                position: "absolute",
                top: 20,
                right: 12,
                zIndex: 10,
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: "'pdark', sans-serif",
                  fontSize: 20,
                  color: "#a855f7",
                  textShadow: "0 0 12px rgba(168,85,247,0.6)",
                  letterSpacing: "0.1em",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {t("settings.returnList")}
              </h3>
            </div>

            {returnItems.length === 0 ? (
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'RexBold', sans-serif",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {t("settings.returnListEmpty")}
              </p>
            ) : (
              returnItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "'RexBold', sans-serif",
                    }}
                  >
                    {item.label}
                  </span>
                  <button
                    onClick={() => {
                      onSound("click");
                      setReturnItems((prev) => prev.filter((i) => i.id !== item.id));
                    }}
                    onMouseEnter={() => onSound("hover")}
                    title={t("settings.returnListRestore")}
                    style={{
                      background: "rgba(168, 85, 247, 0.15)",
                      border: "1px solid rgba(168, 85, 247, 0.6)",
                      borderRadius: "50%",
                      width: 34,
                      height: 34,
                      color: "#c084fc",
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    ↩
                  </button>
                </div>
              ))
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
