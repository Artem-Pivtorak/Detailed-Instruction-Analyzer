import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import { DataPrivacyPanel } from "../components/DataPrivacyPanel";

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

function ApiKeyPlaque({
  name,
  category,
  value,
  onSave,
  t,
}: {
  name: string;
  category: string;
  value: string;
  onSave: (category: string, value: string) => void;
  t: (k: string) => string;
}) {
  // ФІКС (API-ключі були чисто декоративними через локальний useState("") і нікуди не зберігалися):
  // тепер це керований компонент — батьківське джерело правди (SettingsSection нижче, через
  // get_settings_values/set_settings_value → martin_config.txt). Локальний draft тримаємо лише на час
  // активного друкування, щоб курсор не стрибав при кожному зовнішньому оновленні (поллінг
  // інших ключів/city/storage), а зберігаємо при втраті фокусу (onBlur) — не на кожну натиснуту клавішу.
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
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
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (draft !== value) onSave(category, draft);
        }}
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
  flashText = null,
  flashColor,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  // Локалізований статус остандньої зміни САМЕ цього двигуна/моделі - показується прямо під
  // цим селектом, а не один спільний рядок під усією групою - текст вже перекладений
  // викликаючим компонентом через t(...).
  flashText?: string | null;
  flashColor?: string;
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
      {flashText && (
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            color: flashColor || "rgba(255,255,255,0.4)",
            fontFamily: "'RexBold', sans-serif",
            letterSpacing: "0.03em",
          }}
        >
          {flashText}
        </div>
      )}
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
  const [city, setCity] = useState("");
  const [storage, setStorage] = useState("");
  // useRef (не useState) — ці прапорці лише гардують поллінг всередині setInterval-замикання
  // з депами [open] (див. нижче) — з useState той замикання заморозив би значення на момент
  // відкриття Settings і ніколи не бачив б оновлений стан focus після цього.
  const cityFocusedRef = useRef(false);
  const storageFocusedRef = useRef(false);
  // ФІКС (перемикачі дозволів були чистою бутафорією): раніше це були 5 окремих
  // useState (permOpenApps/permAnalyzeSystem/permSeeFolders/permControlSystem/permControlVideo),
  // які ніде не читались і не зберігались. Тепер реальні дані з permissions.py через
  // window.pywebview.api.get_permissions()/set_permission() — той самий патерн, що й у
  // settingsValues нижче. По-програмні дозволи (program.*) винесені в окремий
  // попап (showProgramPerms), щоб не роздувати головну панель ~26 перемикачами.
  const [permissions, setPermissions] = useState<Record<string, { label: string; enabled: boolean; category: string }>>({});
  const [showProgramPerms, setShowProgramPerms] = useState(false);
  const fetchPermissions = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_permissions) return;
    api
      .get_permissions()
      .then((perms: any) => setPermissions(perms || {}))
      .catch(() => {});
  };
  function savePermission(key: string, enabled: boolean) {
    setPermissions((prev) => ({ ...prev, [key]: { ...prev[key], enabled } }));
    const api = (window as any).pywebview?.api;
    if (!api?.set_permission) return;
    api.set_permission(key, enabled).catch(() => {});
  }
  const generalPermOrder = ["user_analysis", "system_analysis", "file_view", "file_control", "video_control"];
  const programPermKeys = Object.keys(permissions).filter((k) => k.startsWith("program.")).sort();
  const [showReturnList, setShowReturnList] = useState(false);
  // ФІКС (список відкочувань був чистою бутафорія): раніше це був жорстко закодований
  // мокап з 3 прикладами, а кнопка "↩" лише видаляла рядок з локального стану, нічого не
  // відкочуючи. Тепер реальні дані з window.pywebview.api.get_undo_list() (undo_handler.py на
  // бекенді), і "↩" реально скасовує дію через undo_action(id).
  const [returnItems, setReturnItems] = useState<{ id: string; label: string }[]>([]);
  const fetchUndoList = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_undo_list) return;
    api
      .get_undo_list()
      .then((items: { id: string; label: string }[]) => setReturnItems(items || []))
      .catch(() => {});
  };
  // Оновлюємо при відкритті списку та легким поллінгом поки він відкритий — така ж дія, що
  // й для settingsValues/systemStats вище (напр. голосове "верни" могло додати новий
  // запис, поки цей попап відкритий).
  useEffect(() => {
    if (!showReturnList) return;
    fetchUndoList();
    const id = setInterval(fetchUndoList, 4000);
    return () => clearInterval(id);
  }, [showReturnList]);
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

  // Модель Vosk: якщо STT або wake-слово = vosk, а моделі на ПК немає — показуємо картку з вибором
  // теки з моделлю (pick_folder -> set_vosk_model_path) або кнопкою "Завантажити" (open_vosk_models_page
  // відкриває сторінку з моделями в браузері). Тексти — локальний словник за мовою інтерфейсу.
  const [voskStatus, setVoskStatus] = useState<{ found: boolean; path: string } | null>(null);
  const [voskMsg, setVoskMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const VOSK_TXT = ({
    UK: {
      missing: "Модель Vosk не знайдена на цьому ПК.",
      found: "Модель Vosk",
      pick: "ОБРАТИ ПАПКУ",
      download: "ЗАВАНТАЖИТИ",
      invalid: "Це не папка моделі Vosk (потрібні підпапки am і conf).",
      saved: "Збережено. Для слова-активації перезапустіть M.A.R.T.I.N.",
    },
    RU: {
      missing: "Модель Vosk не найдена на этом ПК.",
      found: "Модель Vosk",
      pick: "ВЫБРАТЬ ПАПКУ",
      download: "СКАЧАТЬ",
      invalid: "Это не папка модели Vosk (нужны подпапки am и conf).",
      saved: "Сохранено. Для слова-активации перезапустите M.A.R.T.I.N.",
    },
    EN: {
      missing: "Vosk model not found on this PC.",
      found: "Vosk model",
      pick: "CHOOSE FOLDER",
      download: "DOWNLOAD",
      invalid: "Not a Vosk model folder (needs am and conf subfolders).",
      saved: "Saved. Restart M.A.R.T.I.N. for the wake word to use it.",
    },
  } as const)[(propLanguage || "UK") as "UK" | "RU" | "EN"];

  // Мова СИСТЕМИ (UK/RU/EN): застосовується лише після перезапуску; двигуни, що не підтримують обрану
  // мову, показуються ЧЕРВОНИМ (бекенд сам підміняє їх на найкращий підтримуваний).
  const [langSupport, setLangSupport] = useState<{
    running: string; selected: string; restart_needed: boolean;
    warnings: { category: string; requested: string; effective: string; reason: string }[];
  } | null>(null);
  const LANG_TXT = ({
    UK: {
      restart: "Мова системи зміниться після перезапуску M.A.R.T.I.N.",
      engines: { tts_engine: "Озвучення", stt_engine: "Розпізнавання", wake_backend: "Слово-активація" },
      noModel: (e: string, l: string, to: string) => `Модель Vosk для мови ${l} не знайдена (${e}) — використовується ${to}.`,
      unsupported: (e: string, l: string, to: string) => `${e} не підтримує мову ${l} — використовується ${to}.`,
    },
    RU: {
      restart: "Язык системы изменится после перезапуска M.A.R.T.I.N.",
      engines: { tts_engine: "Озвучка", stt_engine: "Распознавание", wake_backend: "Слово-активация" },
      noModel: (e: string, l: string, to: string) => `Модель Vosk для языка ${l} не найдена (${e}) — используется ${to}.`,
      unsupported: (e: string, l: string, to: string) => `${e} не поддерживает язык ${l} — используется ${to}.`,
    },
    EN: {
      restart: "The system language will change after restarting M.A.R.T.I.N.",
      engines: { tts_engine: "Speech output", stt_engine: "Recognition", wake_backend: "Wake word" },
      noModel: (e: string, l: string, to: string) => `No Vosk model for ${l} found (${e}) — using ${to}.`,
      unsupported: (e: string, l: string, to: string) => `${e} does not support ${l} — using ${to}.`,
    },
  } as const)[(propLanguage || "UK") as "UK" | "RU" | "EN"];
  const WRONG_LANG_TXT = ({
    UK: "Ця модель Vosk для іншої мови.",
    RU: "Эта модель Vosk для другого языка.",
    EN: "This Vosk model is for a different language.",
  } as const)[(propLanguage || "UK") as "UK" | "RU" | "EN"];

  const fetchLangSupport = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_language_support) return;
    api
      .get_language_support()
      .then((s: any) => { if (s?.ok) setLangSupport(s); })
      .catch(() => {});
  };

  const fetchVoskStatus = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_vosk_model_status) return;
    api
      .get_vosk_model_status()
      .then((s: any) => setVoskStatus({ found: !!s?.found, path: s?.path || "" }))
      .catch(() => {});
  };

  function pickVoskFolder() {
    const api = (window as any).pywebview?.api;
    if (!api?.pick_folder || !api?.set_vosk_model_path) return;
    onSound("click");
    api
      .pick_folder()
      .then((folder: string) => {
        if (!folder) return;
        return api.set_vosk_model_path(folder).then((res: any) => {
          if (res?.ok) {
            setVoskMsg({ text: VOSK_TXT.saved, ok: true });
            fetchVoskStatus();
            fetchLangSupport();
          } else {
            setVoskMsg({ text: res?.error === "wrong_language" ? WRONG_LANG_TXT : VOSK_TXT.invalid, ok: false });
          }
        });
      })
      .catch(() => setVoskMsg({ text: VOSK_TXT.invalid, ok: false }));
  }

  function openVoskDownload() {
    const api = (window as any).pywebview?.api;
    onSound("click");
    api?.open_vosk_models_page?.().catch(() => {});
  }
  // ФІКС (статичні списки моделей без можливості оновити): бекенд тепер віддає
  // window.pywebview.api.get_engine_config().models_update_available, коли тиха перевірка
  // при старті знайшла нові/інші безкоштовні моделі в groq/cerebras/gemini/openrouter/g4f -
  // показуємо кнопку "Оновити", яка викликає window.pywebview.api.refresh_models() (див.
  // gui_refresh_models в test.py) — там же пінгуються g4f-моделі, тому це може зайняти декілька
  // секунд.
  const [modelsUpdateAvailable, setModelsUpdateAvailable] = useState(false);
  const [modelsRefreshing, setModelsRefreshing] = useState(false);
  const [modelsRefreshDone, setModelsRefreshDone] = useState(false);

  // Інфо-картка ("Info Window") — вертикальне скляне віконце з картинкою+текстом під час
  // відповідей асистента (info_card_popup.py + native/info_overlay). Джерело правди —
  // martin_config.txt (INFO_WINDOW_ENABLED/TIMEOUT_SEC/NEVER_HIDE) через окремий pywebview API
  // get_info_window_config()/set_info_window_config() (НЕ той самий, що get_engine_config —
  // це інша група налаштувань і читається живо, без перезапуску).
  const [infoWindow, setInfoWindow] = useState<{ enabled: boolean; timeout_sec: number; never_hide: boolean } | null>(null);
  const [timeoutDraft, setTimeoutDraft] = useState("");
  const timeoutFocusedRef = useRef(false);

  const fetchInfoWindow = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_info_window_config) return;
    api
      .get_info_window_config()
      .then((cfg: any) => {
        if (!cfg) return;
        setInfoWindow(cfg);
        if (!timeoutFocusedRef.current && typeof cfg.timeout_sec === "number") {
          setTimeoutDraft(String(cfg.timeout_sec));
        }
      })
      .catch(() => {});
  };

  function saveInfoWindow(field: "enabled" | "timeout_sec" | "never_hide", value: any) {
    setInfoWindow((prev) => (prev ? { ...prev, [field]: value } : prev));
    const api = (window as any).pywebview?.api;
    if (!api?.set_info_window_config) return;
    api
      .set_info_window_config(field, value)
      .then(() => fetchInfoWindow())
      .catch(() => {});
  }

  function refreshModels() {
    const api = (window as any).pywebview?.api;
    if (!api?.refresh_models || modelsRefreshing) return;
    setModelsRefreshing(true);
    api
      .refresh_models()
      .then((res: { ok: boolean; engine_config?: any }) => {
        if (res?.ok) {
          onSound("click-4");
          setModelsUpdateAvailable(false);
          setModelsRefreshDone(true);
          if (res.engine_config) setEngineConfig(res.engine_config);
          setTimeout(() => setModelsRefreshDone(false), 2500);
        }
      })
      .finally(() => setModelsRefreshing(false));
  }

  const fetchEngineConfig = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_engine_config) return;
    api
      .get_engine_config()
      .then((cfg: any) => {
        setEngineConfig(cfg);
        setModelsUpdateAvailable(!!cfg?.models_update_available);
      })
      .catch(() => {});
  };

  // ФІКС (API-ключі/city/storage були чисто декоративними): тепер точка зора правди —
  // window.pywebview.api.get_settings_values()/set_settings_value() (див. gui_get_settings_values/
  // gui_set_settings_value в test.py) — читають/пишуть ті самі ключі martin_config.txt, що
      // й backend. При відкритті Settings — одразу fetch, далі легкий поллінг кожні 5с
  // (щоб зміна, зроблена вручну в файлі або з іншого клієнта — теж підтягнулась реал-тайм).
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({});
  const fetchSettingsValues = () => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_settings_values) return;
    api
      .get_settings_values()
      .then((vals: Record<string, string>) => {
        setSettingsValues(vals || {});
        if (typeof vals?.city === "string" && !cityFocusedRef.current) setCity(vals.city);
        if (typeof vals?.storage_path === "string" && !storageFocusedRef.current) setStorage(vals.storage_path);
      })
      .catch(() => {});
  };
  function saveSettingsValue(category: string, value: string) {
    setSettingsValues((prev) => ({ ...prev, [category]: value }));
    const api = (window as any).pywebview?.api;
    if (!api?.set_settings_value) return;
    api.set_settings_value(category, value).catch(() => {});
  }

  // ФІКС (RAM/VRAM/CPU були вигаданими статичними числами "6.2 GB"/"2.1 GB"/"34%"): тепер
  // живі дані з window.pywebview.api.get_system_stats() (див. gui_get_system_stats в test.py —
  // psutil для RAM/CPU, pynvml для VRAM якщо є NVIDIA GPU). Поллінг кожні 2с поки Settings відкриті.
  const [systemStats, setSystemStats] = useState<{
    ram_used_gb: number | null; ram_total_gb: number | null; cpu_percent: number | null;
    vram_used_gb: number | null; vram_total_gb: number | null;
  } | null>(null);
  useEffect(() => {
    if (!open) return;
    const api = (window as any).pywebview?.api;
    if (!api?.get_system_stats) return;
    let cancelled = false;
    const poll = () => {
      api.get_system_stats().then((s: any) => { if (!cancelled) setSystemStats(s); }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchEngineConfig();
      fetchSettingsValues();
      fetchInfoWindow();
      fetchPermissions();
      fetchVoskStatus();
      fetchLangSupport();
    }
  }, [open]);

  // Легкий поллінг settingsValues кожні 5с поки відкрито — не перетирає поле, яке зараз активно
  // редагується (див. focused-гард в ApiKeyPlaque вище).
  useEffect(() => {
    if (!open) return;
    const id = setInterval(fetchSettingsValues, 5000);
    return () => clearInterval(id);
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

  // Локалізований текст/колір для статусу конкретного двигуна/моделі - показується прямо під
  // відповідним EngineSelect'ом (див. flashText/flashColor нижче), а НЕ один спільний
  // рядок під усією групою, як було раніше. Мова береться з t(...) — автоматично
  // підлаштовується під поточну мову інтерфейсу (uk/ru/en).
  function flashFor(category: string): { text: string | null; color?: string } {
    if (engineErrorFlash === category) return { text: `\u2715 ${t("settings.saveError")}`, color: "#f87171" };
    if (engineSavedFlash === category) {
      return engineLiveFlash
        ? { text: `\u2713 ${t("settings.appliedLive")}`, color: "#4ade80" }
        : { text: `\u2713 ${t("settings.restartRequired")}`, color: "rgba(192,132,252,0.75)" };
    }
    return { text: null };
  }
  const apiList: { name: string; category: string }[] = [
    { name: "Cerebras", category: "cerebras_api_key" },
    { name: "OpenRouter", category: "openrouter_api_key" },
    { name: "Groq", category: "groq_api_key" },
    { name: "Picovoice", category: "picovoice_api_key" },
    { name: "Weather", category: "weather_api_key" },
    { name: "ElevenLabs", category: "elevenlabs_api_key" },
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
              // мова ВСІЄЇ системи (STT/Vosk/TTS/голос) — зберігається, діє після перезапуску
              const apiLang = (window as any).pywebview?.api;
              apiLang?.set_app_language?.(LANGUAGES[next])
                .then((s: any) => { if (s?.ok) { setLangSupport(s); fetchVoskStatus(); } })
                .catch(() => {});
            }}
          />
          {langSupport?.restart_needed && (
            <div style={{ fontSize: 11, marginTop: 4, marginBottom: 8, color: "rgba(192,132,252,0.8)", fontFamily: "'RexBold', sans-serif" }}>
              {LANG_TXT.restart}
            </div>
          )}
          {langSupport?.warnings?.map((w) => (
            <div key={w.category} style={{ fontSize: 11, marginTop: 4, marginBottom: 8, color: "#f87171", fontFamily: "'RexBold', sans-serif" }}>
              {(LANG_TXT.engines as any)[w.category] || w.category}: {(w.reason === "vosk_model_missing" ? LANG_TXT.noModel : LANG_TXT.unsupported)(w.requested, langSupport.selected, w.effective)}
            </div>
          ))}

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
                flashText={flashFor("tts_engine").text}
                flashColor={flashFor("tts_engine").color}
              />
              <EngineSelect
                label={t("settings.sttEngine")}
                value={engineConfig.stt_engine.current}
                options={engineConfig.stt_engine.options}
                onChange={(v) => applyEngineChoice("stt_engine", v)}
                flashText={flashFor("stt_engine").text}
                flashColor={flashFor("stt_engine").color}
              />
              <EngineSelect
                label={t("settings.wakeBackend")}
                value={engineConfig.wake_backend.current}
                options={engineConfig.wake_backend.options}
                onChange={(v) => applyEngineChoice("wake_backend", v)}
                flashText={flashFor("wake_backend").text}
                flashColor={flashFor("wake_backend").color}
              />
              {(engineConfig.stt_engine.current === "vosk" || engineConfig.wake_backend.current === "vosk") && voskStatus && (
                voskStatus.found ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(74, 222, 128, 0.8)",
                      fontFamily: "'RexBold', sans-serif",
                      marginTop: -6,
                      marginBottom: 12,
                      wordBreak: "break-all",
                    }}
                  >
                    {`✓ ${VOSK_TXT.found}: ${voskStatus.path}`}
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: "14px 16px",
                      borderRadius: 16,
                      border: "2px solid rgba(248, 113, 113, 0.7)",
                      background: "rgba(248, 113, 113, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#fca5a5",
                        fontFamily: "'RexBold', sans-serif",
                        marginBottom: 10,
                      }}
                    >
                      {VOSK_TXT.missing}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        [VOSK_TXT.pick, pickVoskFolder],
                        [VOSK_TXT.download, openVoskDownload],
                      ].map(([label, handler]) => (
                        <button
                          key={label as string}
                          onClick={handler as () => void}
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "2px solid rgba(168, 85, 247, 0.9)",
                            background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                            boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
                            color: "#c084fc",
                            fontFamily: "'RexBold', sans-serif",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {label as string}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
              {voskMsg && (engineConfig.stt_engine.current === "vosk" || engineConfig.wake_backend.current === "vosk") && (
                <div
                  style={{
                    fontSize: 11,
                    marginTop: -6,
                    marginBottom: 12,
                    color: voskMsg.ok ? "rgba(192,132,252,0.8)" : "#f87171",
                    fontFamily: "'RexBold', sans-serif",
                  }}
                >
                  {voskMsg.text}
                </div>
              )}
              <EngineSelect
                label={t("settings.llmEngine")}
                value={engineConfig.llm_engine.current}
                options={engineConfig.llm_engine.options}
                onChange={(v) => applyEngineChoice("llm_engine", v)}
                flashText={flashFor("llm_engine").text}
                flashColor={flashFor("llm_engine").color}
              />
              {/* Авто-перемикання LLM-двигуна при збої/вичерпанні токенів (LLM_AUTO_FAILOVER в
                  martin_config.txt). Сам фолбек-ланцюг у llm_chat() існував завжди — цей перемикач
                  дозволяє його вимкнути, щоб користувач перемикав двигуни сам. Іде через той самий
                  set_engine_config, що й решта двигунів (категорія "llm_auto_failover"). */}
              {engineConfig.llm_auto_failover && (
                <div style={{ marginTop: -2, marginBottom: 12 }}>
                  <Switch
                    on={engineConfig.llm_auto_failover.current !== "0"}
                    onChange={(v) => {
                      onSound("switch");
                      applyEngineChoice("llm_auto_failover", v ? "1" : "0");
                    }}
                    label={t("settings.llmAutoFailover")}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'RexBold', sans-serif",
                      lineHeight: 1.4,
                      marginTop: -8,
                      marginBottom: 4,
                    }}
                  >
                    {t("settings.llmAutoFailoverHint")}
                  </div>
                  {flashFor("llm_auto_failover").text && (
                    <div
                      style={{
                        fontSize: 10,
                        color: flashFor("llm_auto_failover").color,
                        fontFamily: "'RexBold', sans-serif",
                      }}
                    >
                      {flashFor("llm_auto_failover").text}
                    </div>
                  )}
                </div>
              )}
              {activeModelKey && engineConfig[activeModelKey] && (
                <EngineSelect
                  label={`${t("settings.modelLabel")} (${currentLlmEngine})`}
                  value={engineConfig[activeModelKey].current}
                  options={engineConfig[activeModelKey].options}
                  onChange={(v) => applyEngineChoice(activeModelKey, v)}
                  flashText={flashFor(activeModelKey).text}
                  flashColor={flashFor(activeModelKey).color}
                />
              )}
              {(modelsUpdateAvailable || modelsRefreshing || modelsRefreshDone) && (
                <div
                  onClick={refreshModels}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 4,
                    marginBottom: 4,
                    padding: "10px 16px",
                    borderRadius: 14,
                    border: "2px solid rgba(74, 222, 128, 0.7)",
                    background: "rgba(74, 222, 128, 0.08)",
                    color: modelsRefreshDone ? "#4ade80" : "#86efac",
                    fontFamily: "'RexBold', sans-serif",
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    cursor: modelsRefreshing ? "default" : "pointer",
                    opacity: modelsRefreshing ? 0.6 : 1,
                    userSelect: "none",
                  }}
                >
                  {modelsRefreshing
                    ? t("settings.modelsRefreshing")
                    : modelsRefreshDone
                    ? `\u2713 ${t("settings.modelsRefreshed")}`
                    : t("settings.modelsUpdateAvailable")}
                </div>
              )}
              {cppKilledInfo !== null && (engineSavedFlash === "tts_engine" || engineSavedFlash === "stt_engine" || engineSavedFlash === "wake_backend") && (
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
          {apiList.map(({ name, category }) => (
            <ApiKeyPlaque
              key={category}
              name={name}
              category={category}
              value={settingsValues[category] || ""}
              onSave={saveSettingsValue}
              t={t}
            />
          ))}

          {/* City input + save (replaces cycler) */}
          <div
            style={{ display: "flex", gap: 8, marginTop: 30, marginBottom: 6, justifyContent: "center" }}
          >
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => { cityFocusedRef.current = true; }}
              onBlur={() => { cityFocusedRef.current = false; }}
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
                onSound("click");
                saveSettingsValue("city", city);
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
              onFocus={() => { storageFocusedRef.current = true; }}
              onBlur={() => { storageFocusedRef.current = false; }}
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
                onSound("click");
                saveSettingsValue("storage_path", storage);
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

            <div
              style={{
                marginTop: 20,
                marginBottom: 14,
                borderTop: "1px solid rgba(160,50,255,0.15)",
                paddingTop: 14,
              }}
            >
              <Switch
                on={!!permissions.user_analysis?.enabled}
                onChange={(v) => {
                  savePermission("user_analysis", v);
                  onSound("switch");
                }}
                label={t("settings.permUserAnalysis")}
              />
              <Switch
                on={!!permissions.system_analysis?.enabled}
                onChange={(v) => {
                  savePermission("system_analysis", v);
                  onSound("switch");
                }}
                label={t("settings.permAnalyzeSystem")}
              />
              <Switch
                on={!!permissions.file_view?.enabled}
                onChange={(v) => {
                  savePermission("file_view", v);
                  onSound("switch");
                }}
                label={t("settings.permSeeFolders")}
              />
              <Switch
                on={!!permissions.file_control?.enabled}
                onChange={(v) => {
                  savePermission("file_control", v);
                  onSound("switch");
                }}
                label={t("settings.permControlSystem")}
              />
              <Switch
                on={!!permissions.video_control?.enabled}
                onChange={(v) => {
                  savePermission("video_control", v);
                  onSound("switch");
                }}
                label={t("settings.permControlVideo")}
              />

              <div
                onClick={() => {
                  onSound("click-4");
                  setShowProgramPerms(true);
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
                  marginTop: 6,
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "'RexBold', sans-serif",
                  }}
                >
                  {t("settings.permOpenApps")}
                </span>
                <span style={{ fontSize: 18, color: "#c084fc" }}>›</span>
              </div>
            </div>

            {/* ── Info Window ────────────────────────────────────────────────────
                Перемикач увімк/вимк скляної інфо-картки + поле таймауту в секундах +
                кругла кнопка "ніколи не ховати" (тоді картка відразу з хрестиком).
                Бекенд: info_card_popup.py -> martin_config.txt (INFO_WINDOW_*). */}
            <div
              style={{
                marginTop: 4,
                marginBottom: 14,
                borderTop: "1px solid rgba(160,50,255,0.15)",
                paddingTop: 14,
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  color: "#a855f7",
                  letterSpacing: "0.15em",
                  fontFamily: "'RexBold', sans-serif",
                  marginTop: 0,
                  marginBottom: 6,
                }}
              >
                {t("settings.infoWindowTitle")}
              </p>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'RexBold', sans-serif",
                  lineHeight: 1.4,
                  marginBottom: 12,
                }}
              >
                {t("settings.infoWindowHint")}
              </div>

              <Switch
                on={!!infoWindow?.enabled}
                onChange={(v) => {
                  onSound("switch");
                  saveInfoWindow("enabled", v);
                }}
                label={t("settings.infoWindowTitle")}
              />

              {/* Поле таймауту + кругла кнопка "ніколи не зникати" поруч.
                  Коли "ніколи не ховати" активне — поле таймауту не має сенсу, тому гасне. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: infoWindow?.enabled ? 1 : 0.4,
                  pointerEvents: infoWindow?.enabled ? "auto" : "none",
                  transition: "opacity 0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'RexBold', sans-serif",
                    flex: 1,
                    opacity: infoWindow?.never_hide ? 0.35 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {t("settings.infoWindowTimeout")}
                </span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={timeoutDraft}
                  disabled={!!infoWindow?.never_hide}
                  onChange={(e) => setTimeoutDraft(e.target.value)}
                  onFocus={() => {
                    timeoutFocusedRef.current = true;
                  }}
                  onBlur={() => {
                    timeoutFocusedRef.current = false;
                    const parsed = parseFloat(timeoutDraft);
                    if (!isNaN(parsed) && parsed !== infoWindow?.timeout_sec) {
                      onSound("click");
                      saveInfoWindow("timeout_sec", parsed);
                    } else if (isNaN(parsed)) {
                      setTimeoutDraft(String(infoWindow?.timeout_sec ?? 2));
                    }
                  }}
                  style={{
                    width: 80,
                    background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                    border: "2px solid rgba(168, 85, 247, 0.9)",
                    boxShadow: "0 0 10px rgba(168, 85, 247, 0.7), inset 0 0 5px rgba(168, 85, 247, 0.4)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    color: "#c084fc",
                    fontFamily: "'RexBold', sans-serif",
                    fontSize: 15,
                    outline: "none",
                    textAlign: "center",
                    opacity: infoWindow?.never_hide ? 0.35 : 1,
                    transition: "opacity 0.2s",
                  }}
                />
                <button
                  onClick={() => {
                    onSound("click-4");
                    saveInfoWindow("never_hide", !infoWindow?.never_hide);
                  }}
                  title={t("settings.infoWindowNeverHide")}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.94)";
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    flexShrink: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontFamily: "'RexBold', sans-serif",
                    transition: "transform 0.1s, all 0.25s",
                    background: infoWindow?.never_hide
                      ? "linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(120,40,200,0.2) 100%)"
                      : "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                    border: `2px solid ${infoWindow?.never_hide ? "rgba(168, 85, 247, 1)" : "rgba(255,255,255,0.3)"}`,
                    boxShadow: infoWindow?.never_hide
                      ? "0 0 14px rgba(168, 85, 247, 0.9), inset 0 0 6px rgba(168, 85, 247, 0.5)"
                      : "0 0 8px rgba(255,255,255,0.2), inset 0 0 4px rgba(255,255,255,0.15)",
                    color: infoWindow?.never_hide ? "#e9d5ff" : "rgba(255,255,255,0.45)",
                  }}
                >
                  ∞
                </button>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: infoWindow?.never_hide ? "rgba(192,132,252,0.75)" : "rgba(255,255,255,0.3)",
                  fontFamily: "'RexBold', sans-serif",
                  marginTop: 6,
                  textAlign: "right",
                }}
              >
                {t("settings.infoWindowNeverHide")}
              </div>
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

          <DataPrivacyPanel onSound={onSound} />

          {/* Usage indicators — ЖИВІ дані з window.pywebview.api.get_system_stats() (див. systemStats вище,
              поллінг кожні 2с), а не вигадані статичні числа. Якщо значення ще не прийшло (null,
              напр. немає NVIDIA GPU для VRAM) — показуємо "—" замість вигаданого числа. */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[
              [
                "RAM",
                systemStats?.ram_used_gb != null && systemStats?.ram_total_gb != null
                  ? `${systemStats.ram_used_gb} / ${systemStats.ram_total_gb} GB`
                  : "—",
                "#a855f7",
              ],
              [
                "VRAM",
                systemStats?.vram_used_gb != null && systemStats?.vram_total_gb != null
                  ? `${systemStats.vram_used_gb} / ${systemStats.vram_total_gb} GB`
                  : "н/д",
                "#9333ea",
              ],
              [
                "CPU",
                systemStats?.cpu_percent != null ? `${systemStats.cpu_percent}%` : "—",
                "#8b5cf6",
              ],
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
      {showProgramPerms && (
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
                setShowProgramPerms(false);
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
                {t("settings.permOpenApps")}
              </h3>
            </div>

            <Switch
              on={!!permissions.program_other?.enabled}
              onChange={(v) => {
                savePermission("program_other", v);
                onSound("switch");
              }}
              label={permissions.program_other?.label || "Other programs"}
            />
            <div
              style={{
                borderTop: "1px solid rgba(160,50,255,0.15)",
                margin: "10px 0 14px 0",
              }}
            />
            {programPermKeys.map((key) => (
              <Switch
                key={key}
                on={!!permissions[key]?.enabled}
                onChange={(v) => {
                  savePermission(key, v);
                  onSound("switch");
                }}
                label={permissions[key]?.label || key}
              />
            ))}
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
                      const api = (window as any).pywebview?.api;
                      // Оптимістично прибираємо з списку одразу — але справжнє скасування
                      // робить undo_action на бекенді (undo_handler.py), не локальний filter сам по собі.
                      setReturnItems((prev) => prev.filter((i) => i.id !== item.id));
                      api?.undo_action?.(item.id).then(() => fetchUndoList()).catch(() => fetchUndoList());
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
