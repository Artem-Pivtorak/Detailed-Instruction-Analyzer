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

function EngineSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          fontFamily: "'RexBold', sans-serif",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
          border: "2px solid rgba(168, 85, 247, 0.9)",
          boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
          borderRadius: 14,
          padding: "10px 14px",
          color: "#c084fc",
          fontFamily: "'RexBold', sans-serif",
          fontSize: 15,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ background: "#0a0a14", color: "#c084fc" }}>
            {opt}
          </option>
        ))}
      </select>
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
  // Реальна конфігурація двигунів/моделей з бекенду (window.pywebview.api.get_engine_config /
  // set_engine_config, див. gui_get_engine_config/gui_set_engine_config в test.py) - НЕ вигадані вручну
  // списки, а ті самі, що й в логіці test.py (llm_chat/TTS_ENGINE/STT_ENGINE ветки).
  const [engineConfig, setEngineConfig] = useState<Record<string, { current: string; options: string[] }> | null>(null);
  const [engineSavedFlash, setEngineSavedFlash] = useState<string | null>(null);
  const [engineErrorFlash, setEngineErrorFlash] = useState<string | null>(null);
  // Чи остання успішна зміна вже ЗаСТОСОВАНА ЖИВО (без перезапуску M.A.R.T.I.N.) чи
  // ще потрібує перезапуску - приходить з res.applied_live (див. gui_set_engine_config у test.py:
  // tts_engine тепер живий, решта категорій - ще ні).
  const [engineLiveFlash, setEngineLiveFlash] = useState<boolean>(false);
  const [cppKilledInfo, setCppKilledInfo] = useState<boolean | null>(null);

  const fetchEngineConfig = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_engine_config) return;
    api
      .get_engine_config()
      .then((cfg: any) => setEngineConfig(cfg))
      .catch(() => {});
  };

  useEffect(() => {
    if (open) fetchEngineConfig();
  }, [open]);

  function applyEngineChoice(category: string, value: string) {
    setEngineConfig((prev) => (prev ? { ...prev, [category]: { ...prev[category], current: value } } : prev));
    const api = (window as any).pywebview?.api;
    // ФІКС: `api?.set_engine_config?.(...)` саме по собі безпечне (опціонал-чейн),
    // але якщо воно повертає undefined (бекенд/метод ще не виголошений), виклик
    // `.then()` ОДРАЗУ НА НЬОМУ вже НЕ безпечний і кидає виняток (Cannot read properties
    // of undefined) - вибір виглядав оновленим оптимістично (setEngineConfig вище), але без
      // жодного видимого сліду в консолі це виглядалося б так, ніби нічого не сталося.
    if (!api?.set_engine_config) {
      setEngineErrorFlash(category);
      return;
    }
    api
      .set_engine_config(category, value)
      .then((res: { ok: boolean; error?: string; cpp_core_killed?: boolean; applied_live?: boolean }) => {
        if (res?.ok) {
          onSound("click-4");
          setEngineErrorFlash(null);
          setEngineSavedFlash(category);
          setEngineLiveFlash(!!res.applied_live);
          if (category === "tts_engine" || category === "stt_engine" || category === "wake_backend") {
            setCppKilledInfo(!!res.cpp_core_killed);
          }
          setTimeout(() => setEngineSavedFlash((c) => (c === category ? null : c)), 1800);
        } else {
          setEngineErrorFlash(category);
        }
      })
      .catch(() => setEngineErrorFlash(category));
  }

  // Який додатковий ключ моделі показати залежить від обраного LLM_ENGINE (дзеркалить llm_chat()
  // у test.py: cerebras→CEREBRAS_MODEL, groq→GROQ_MODEL, gemini→GEMINI_MODEL, requests(OpenRouter)→OPENROUTER_MODEL,
  // g4f→G4F_MODEL, llama-cpp — шлях до файлу моделі, не список варіантів — для нього керуємо).
  const llmModelKeyFor: Record<string, string | null> = {
    cerebras: "cerebras_model",
    groq: "groq_model",
    gemini: "gemini_model",
    requests: "openrouter_model",
    g4f: "g4f_model",
    "llama-cpp": null,
  };
  const currentLlmEngine = engineConfig?.llm_engine?.current;
  const activeModelKey = currentLlmEngine ? llmModelKeyFor[currentLlmEngine] : null;
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
              marginTop: 4,
            }}
          >
            {t("settings.enginesTitle")}
          </p>
          {!engineConfig ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'RexBold', sans-serif", marginBottom: 16 }}>
              {t("settings.loadingEngines")}
            </p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <EngineSelect
                label={t("settings.ttsEngine")}
                value={engineConfig.tts_engine.current}
                options={engineConfig.tts_engine.options}
                onChange={(v) => applyEngineChoice("tts_engine", v)}
              />
              <EngineSelect
                label={t("settings.sttEngine")}
                value={engineConfig.stt_engine.current}
                options={engineConfig.stt_engine.options}
                onChange={(v) => applyEngineChoice("stt_engine", v)}
              />
              <EngineSelect
                label={t("settings.wakeBackend")}
                value={engineConfig.wake_backend.current}
                options={engineConfig.wake_backend.options}
                onChange={(v) => applyEngineChoice("wake_backend", v)}
              />
              <EngineSelect
                label={t("settings.llmEngine")}
                value={engineConfig.llm_engine.current}
                options={engineConfig.llm_engine.options}
                onChange={(v) => applyEngineChoice("llm_engine", v)}
              />
              {activeModelKey && engineConfig[activeModelKey] && (
                <EngineSelect
                  label={`${t("settings.modelLabel")} (${currentLlmEngine})`}
                  value={engineConfig[activeModelKey].current}
                  options={engineConfig[activeModelKey].options}
                  onChange={(v) => applyEngineChoice(activeModelKey, v)}
                />
              )}
              <div
                style={{
                  fontSize: 11,
                  color: engineErrorFlash ? "#f87171" : engineSavedFlash ? "#4ade80" : "rgba(255,255,255,0.35)",
                  fontFamily: "'RexBold', sans-serif",
                  marginTop: 4,
                }}
              >
                {engineErrorFlash
                  ? "\u2715 Не вдалося зберегти (бекенд ще не готовий або помилка)"
                  : engineSavedFlash
                  ? engineLiveFlash
                    ? "\u2713 Застосовано живо — без перезапуску"
                    : `\u2713 ${t("settings.saved")}`
                  : t("settings.restartRequired")}
              </div>
              {cppKilledInfo !== null && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(192,132,252,0.6)",
                    fontFamily: "'RexBold', sans-serif",
                    marginTop: 2,
                  }}
                >
                  {cppKilledInfo
                    ? "\u2139\uFE0F C++ ядро було запущене зі старим конфігом і завершене — наступний запуск запустить нове."
                    : "\u2139\uFE0F C++ ядро і так не було запущене (або psutil недоступний) — див. консоль."}
                </div>
              )}
            </div>
          )}

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
