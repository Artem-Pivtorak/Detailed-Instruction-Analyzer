import { useState, useEffect, useLayoutEffect, useCallback, useRef, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleSphere } from "./components/ParticleSphere";
import { SidePanel } from "./components/SidePanel";
import { GlassDock } from "./components/GlassDock";
import { GlassDockFollower } from "./components/GlassDockFollower";
import { GlassBlurDefs } from "./components/GlassBlurDefs";
import { LiquidGooDefs } from "./components/LiquidGlassAccent";
import { MemorySection } from "./sections/MemorySection";
import { SettingsSection } from "./sections/SettingsSection";
import { ReminderSection } from "./sections/ReminderSection";
import { PluginsSection } from "./sections/PluginsSection";
import { CommandsSection } from "./sections/CommandsSection";
import { AddCommandsSection } from "./sections/AddCommandsSection";
import { PeopleSection } from "./sections/PeopleSection";
import { Brain } from "./components/Brain";
import { useSound } from "./hooks/useSound";

type Section =
  | "memory"
  | "settings"
  | "reminder"
  | "plugins"
  | "commands"
  | "addcommands"
  | "people"
  | "brain"
  | null;

// Реальний користувач M.A.R.T.I.N. (з users.json на бекенді) — не плутати
// зі старою декоративною "персоною" (AI CORE/JARVIS/...). ADMIN завжди
// зверху й жовтий, далі UNKNOWN, далі USER — див. сортування у sortedUsers.
type MartinUser = {
  id: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "USER" | "UNKNOWN" | string;
};

// РЕАЛЬНА консоль M.A.R.T.I.N. (замість фейкового Lorem ipsum) наповнюється
// через window.__martinAppendConsole(line), який викликає Python-бекенд
// (gui_bridge.py) через window.pywebview.api для кожного нового рядка,
// що друкується в консоль test.py (весь stdout процесу).
const BOOT_CONSOLE_LINES = ["M.A.R.T.I.N. 2.0 — інтерфейс завантажено. Очікую підключення бекенду..."];

// Тип рядка консолі кодується бекендом (console_format.py) невидимим маркером на початку рядка:
// U+2063 + 4 біти (U+200B = 0, U+200C = 1) + U+2063. Нижче — розбір і м'які кольори за типом.
const CONSOLE_KIND_COLORS: Record<number, string> = {
  1: "#a9bfe0", // користувач
  2: "#dcc4f4", // асистент
  3: "#b4d6c2", // системні
  4: "#e0a0a8", // помилки
  5: "#e0cfa0", // попередження
  6: "#e0bfa8", // YouTube / медіа
  7: "#a8d0d6", // керування інтерфейсом
  8: "#c4b8e8", // LLM
  9: "#d6d0a0", // команди
  10: "#a8c8bf", // мова / голос
  11: "#c0c0c0", // інше
};

function parseConsoleLine(raw: string): { kind: number; text: string } {
  // Розбір за кодами символів: U+2063, 4 біти (U+200B/U+200C), U+2063.
  if (raw && raw.charCodeAt(0) === 0x2063) {
    let end2 = -1;
    for (let j = 1; j < Math.min(raw.length, 8); j++) {
      if (raw.charCodeAt(j) === 0x2063) { end2 = j; break; }
    }
    if (end2 > 0) {
      let k = 0;
      for (let j = 1; j < end2; j++) k = (k << 1) | (raw.charCodeAt(j) === 0x200c ? 1 : 0);
      return { kind: k, text: raw.slice(end2 + 1) };
    }
  }
  return { kind: 0, text: raw };
}

export function _parseConsoleLineLegacy(raw: string): { kind: number; text: string } {
  if (raw && raw.charCodeAt(0) === 0x2063) {
    const end = raw.indexOf("⁣", 1);
    if (end > 0) {
      let kind = 0;
      for (const ch of raw.slice(1, end)) kind = (kind << 1) | (ch === "‌" ? 1 : 0);
      return { kind, text: raw.slice(end + 1) };
    }
  }
  return { kind: 0, text: raw };
}

import { I18nProvider, useI18n } from "./i18n";

// ФІКС ("сірий екран смерті"): раніше БУДЬ-ЯКА необроблена помилка рендеру
// (напр. клік по кнопці під час завантаження, коли window.pywebview.api ще
// не повністю готовий) валила ВЕСЬ React-дерево без жодного ErrorBoundary —
// pywebview-вікно прозоре (transparent=True), тому щойно React перестає щось
// малювати, лишається порожній/сірий бекбафер нативного WinForms-вікна, який
// виглядає як "завис" і не реагує на нічого (кнопки більше нема кому обробляти
// клік). Єдиний спосіб був — перезапускати програму повністю. ErrorBoundary
// нижче ловить помилку рендеру ДО того, як вона знищить усе дерево, і показує
// видиму, непрозору панель з описом помилки та кнопкою "Перезавантажити
// інтерфейс" (просте location.reload() — це знову підвантажує вже готовий
// index.html, без потреби перезапускати сам процес M.A.R.T.I.N.).
class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Друкуємо в консоль (і, якщо GUI-міст живий, це також потрапить у
    // видиму консоль M.A.R.T.I.N. через window.__martinAppendConsole,
    // якщо ми встигнемо підписатися — інакше принаймні залишиться в DevTools).
    console.error("[AppErrorBoundary] Необроблена помилка рендеру:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0a0a0a",
            color: "#eee",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 40,
            fontFamily: "'RexBold', sans-serif",
            textAlign: "center",
            zIndex: 999999,
          }}
        >
          <div style={{ fontSize: 20, color: "#f97316" }}>Інтерфейс зіткнувся з помилкою</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", maxWidth: 480, whiteSpace: "pre-wrap" }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: "12px 24px",
              background: "rgba(249,115,22,0.2)",
              border: "2px solid rgba(249,115,22,0.5)",
              borderRadius: 10,
              color: "#f97316",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Перезавантажити інтерфейс
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Footer() {
  const { t } = useI18n();
  const [typedText, setTypedText] = useState("");
  // Рік у копірайті береться з поточної дати (див. t() в i18n.tsx, плейсхолдер {YEAR}).
  // Цей стан + таймер лише перерендерять Footer, якщо рік змінився, поки
  // програма працювала безперервно (напр. через Новий рік о 00:00).
  const [, setCurrentYear] = useState(new Date().getFullYear());
  useEffect(() => {
    const id = setInterval(() => setCurrentYear(new Date().getFullYear()), 60_000);
    return () => clearInterval(id);
  }, []);
  const fullText = t("footer");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        width: "100%",
        flexShrink: 0,
        textAlign: "center",
        fontSize: 11,
        color: "rgba(160,160,160,0.35)",
        fontFamily: "pdark",
        letterSpacing: "0.02em",
        userSelect: "none",
        zIndex: 5,
        minHeight: 14,
      }}
    >
      {typedText}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}

function AppInner() {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>(null);
  const [language, setLanguage] = useState<"EN" | "RU" | "UK">("EN");
  const [sidePanel, setSidePanel] = useState(false);
  const [micActive, setMicActive] = useState(true);
  // 0: Activation Word, 1: Instant Command, 2: Text
  const [inputMode, setInputMode] = useState(0);
  const [showPersonDrop, setShowPersonDrop] = useState(false);
  const [users, setUsers] = useState<MartinUser[]>([]);
  const [activeUser, setActiveUser] = useState<MartinUser | null>(null);
  const [pendingAdminId, setPendingAdminId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [userSelectError, setUserSelectError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Стан "асистент говорить" — НЕ від декоративної кнопки грати аудіо,
  // а від реального відтворення звуку на бекенді (TTS АБО будь-який wav-файл, див.
  // window.__martinSpeakingStateChanged та gui_bridge.push_speaking_state на Python-стороні).
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Саме сюди приходить реальний частотний спектр від __martinAudioBins (див. ефект нижче).
  // Ref, а не state — щоб не ре-рендерити весь компонент на кожен аудіо-фрейм (10-15/с).
  const audioBinsRef = useRef<Uint8Array | null>(null);
  // СПРАВЖНІЙ Web Audio AnalyserNode (той самий механізм, як був у колишньому
  // "Play Voice") — тепер безшумно грає той самий файл, який зараз відтворює бекенд
  // (див. __martinAudioClipReady) — це дає ТОЧНО таку саму анімацію, яка була раніше.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const hiddenAudioRef = useRef<HTMLAudioElement | null>(null);

  const { play, stop } = useSound(soundEnabled);

  // ФІКС ("сірий фон видно під час стартової маски"): Python-сторона
  // (_run_startup_animation у martin_gui.py) тепер чекає НА цей прапорець ПЕРЕД тим, як
  // почати розкривати вікно через SetWindowRgn — раніше вона орієнтувалася
  // на фіксовану паузу (40мс), якої не завжди вистачало WebView2/React, щоб встигнути
  // застосувати CSS/фон (особливо на холодному старті WebView2) — у той короткий
  // момент під маскою був видно непрофарбований дефолтний фон (сірий), а не чорний
  // фон інтерфейсу. Два requestAnimationFrame підряд гарантують, що браузер уже реально
  // виконав компонування+малювання з приміненим CSS (не чекаємо весь 3-секундний
  // інтро зі звуковими ефектами, лише перший старт рендеру).
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        (window as any).__martinAppReady = true;
      });
    });
  }, []);

  const playSound = useCallback(
    (type: string) => {
      play(type as any);
    },
    [play],
  );

  const stopSound = useCallback(
    (type: string, fadeMs?: number) => {
      stop(type as any, fadeMs);
    },
    [stop],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let s1: NodeJS.Timeout;
    let s2: NodeJS.Timeout;
    let s3: NodeJS.Timeout;

    // We use a small delay for everything to ensure the sound hook has
    // initialized its internals and paths are resolved.
    const startIntro = () => {
      s1 = setTimeout(() => {
        playSound("sircle");
      }, 150);

      s2 = setTimeout(() => {
        playSound("download");
      }, 600);

      // Start the "end-download" cue a little before the frame appears,
      // so it overlaps and crossfades with the tail of "download".
      s3 = setTimeout(() => {
        playSound("end-download");
      }, 2700);

      timer = setTimeout(() => {
        setMounted(true);
        // Stop "download" (text.wav) right as the text frame appears,
        // instead of letting it play out its full length.
        stopSound("download", 250);
      }, 3000);
    };

    startIntro();

    return () => {
      clearTimeout(timer);
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      stopSound("download", 0);
    };
  }, []); // Empty dependency array ensures intro plays ONLY ONCE on mount

  // Стартова анімація OS-вікна (hidden → show → розгортання по ширині → по висоті)
  // тепер повністю на Python-стороні (_run_startup_animation у martin_gui.py).
  // JS-версія видалена бо requestAnimationFrame у прихованому WebView2-вікні
  // дросселюється до ~1fps — всі IPC-виклики вилітали одночасно після show() → вікно стрибало.

  // Listen for inputMode changes to play mode sound
  const prevModeRef = useRef(inputMode);
  useEffect(() => {
    if (mounted && soundEnabled) {
      if (inputMode === 2 && prevModeRef.current !== 2) {
        playSound("frame-start");
      } else if (prevModeRef.current === 2 && inputMode !== 2) {
        playSound("frame-end");
      } else if (inputMode !== prevModeRef.current) {
        playSound("click-6-mode");
      }
    }
    prevModeRef.current = inputMode;
  }, [inputMode, mounted, soundEnabled, playSound]);
  const [consoleLines, setConsoleLines] = useState<string[]>(BOOT_CONSOLE_LINES);
  const [textInputValue, setTextInputValue] = useState("");
  const [backendReady, setBackendReady] = useState(false);
  // ФІКС ("сіріє і не реагує при кліку під час завантаження"): у вікні між
  // відкриттям вікна і першим звуком готовності (mor/day/evn, див.
  // _play_gui_ready_sound у test.py) кутові кнопки (мікрофон/режим/звук/меню)
  // раніше були клікабельні одразу, хоча бекенд (window.pywebview.api) та важкі
  // анімації інтро (ParticleSphere/GlassDock/фрейм) ще не встигли стабілізуватися.
  // Клік у цей момент запускав одночасно кілька важких CSS-переходів/GPU-композицій
  // (backdrop-filter + SVG-фільтр + framer-motion transform) поверх ще незавершеної
  // інтро-анімації — саме комбінація, яка за задокументованою в проєкті історією вже
  // ламала композитинг backdrop-filter у WebView2 під час активних transform. Тепер
  // кнопки просто неактивні (pointer-events:none + приглушені), поки не настане
  // interactionsReady — момент, коли бекенд підтвердив готовність (backendReady) АБО,
  // як запобіжник на випадок, якщо бекенд взагалі не піднявся (напр. Python впав),
  // спливло READY_FALLBACK_TIMEOUT_MS — щоб кнопки не лишались заблокованими назавжди.
  const [readyTimeoutElapsed, setReadyTimeoutElapsed] = useState(false);
  const READY_FALLBACK_TIMEOUT_MS = 20000;
  useEffect(() => {
    const timer = setTimeout(() => setReadyTimeoutElapsed(true), READY_FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Tilt animation refs (disabled - frame is static)
  const frameRef = useRef<HTMLDivElement>(null);
  const inputFrameRef = useRef<HTMLDivElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);

  // expose a simple global hook so settings component can switch language
  useEffect(() => {
    (window as any).setAppLanguage = (code: string) => {
      if (code === "EN" || code === "RU" || code === "UK") setLanguage(code);
    };
    (window as any).__onLanguageChange = (code: string) => {
      if (code === "EN" || code === "RU" || code === "UK") setLanguage(code);
    };
    return () => {
      delete (window as any).setAppLanguage;
      delete (window as any).__onLanguageChange;
    };
  }, []);

  // ── Персистентність стану інтерфейсу ────────────────────────────────
  // Раніше мова/мікрофон/режим/звук завжди скидались на дефолт (EN/увімкнено/
  // Activation Word/увімкнено) при кожному запуску програми, бо жили лише в useState.
  // Тепер при монтуванні читаємо збережений стан з диска
  // (window.pywebview.api.get_ui_state(), напряму з ui_state.json — не
  // потребує готового бекенда test.py) і застосовуємо його один раз, а
  // кожна подальша зміна цих значень користувачем одразу пишеться назад тим самим
  // способом (set_ui_state). persistedLoadedRef захищає від зворотного
  // ефекту: щоб збереження дефолтних значень ДО того, як встиг підвантажитись
  // збережений стан, не перезаписало його дефолтом.
  const persistedLoadedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tryLoad = () => {
      const api = (window as any).pywebview?.api;
      if (!api?.get_ui_state) {
        if (!cancelled && attempts < 100) {
          attempts++;
          setTimeout(tryLoad, 100);
        }
        return;
      }
      api
        .get_ui_state()
        .then((saved: Record<string, any>) => {
          if (cancelled || !saved) return;
          if (saved.language === "EN" || saved.language === "RU" || saved.language === "UK") {
            setLanguage(saved.language);
          }
          if (typeof saved.mic_enabled === "boolean") {
            setMicActive(saved.mic_enabled);
          }
          if (saved.input_mode !== undefined && saved.input_mode !== null) {
            const modeNames = ["wakeword", "quick", "text"];
            const idx = modeNames.indexOf(String(saved.input_mode));
            if (idx !== -1) {
              setInputMode(idx);
            } else {
              // Захисний варіант (число 0/1/2 зі старого багу, коли фронтенд жив число без узгодження з бекендом)
              const m = Number(saved.input_mode);
              if (!Number.isNaN(m)) setInputMode(m);
            }
          }
          if (typeof saved.sound_enabled === "boolean") {
            setSoundEnabled(saved.sound_enabled);
          }
        })
        .catch(() => {})
        .finally(() => {
          persistedLoadedRef.current = true;
        });
    };
    tryLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  // Кожна зміна мови користувачем — одразу на диск, щоб пережити перезапуск.
  useEffect(() => {
    if (!persistedLoadedRef.current) return;
    (window as any).pywebview?.api?.set_ui_state?.("language", language);
  }, [language]);

  // Стан кнопки мікрофона — незалежно від set_mic_enabled (яке керує самим
  // бекендом): тут лише дублюємо збереження напряму на диск, щоб мова/звук/режим
  // відновлювались навіть якщо користувач перемкнув їх ще до того, як бекенд став готовий
  // (Python-сторона теж пише цей самий ключ через gui_set_mic_enabled_persisted —
  // це просто додаткова страховка, щоб зміна не губилась, якщо бекенд ще не піднявся).
  useEffect(() => {
    if (!persistedLoadedRef.current) return;
    (window as any).pywebview?.api?.set_ui_state?.("mic_enabled", micActive);
  }, [micActive]);

  // Бекенд (самокерування голосом) керує іконками так само, як клік мишею.
  useEffect(() => {
    (window as any).__martinSetUiState = (key: string, value: any) => {
      if (key === "mic_enabled") setMicActive(!!value);
      else if (key === "sound_enabled") setSoundEnabled(!!value);
      else if (key === "input_mode") {
        const idx = ["wakeword", "quick", "text"].indexOf(String(value));
        if (idx >= 0) setInputMode(idx);
      }
    };
    return () => {
      delete (window as any).__martinSetUiState;
    };
  }, []);

  useEffect(() => {
    if (!persistedLoadedRef.current) return;
    // ФІКС: зберігаємо ТОЙ Ж ФОРМАТ, що й бекенд (_gui_set_mode_persisted в test.py) -
    // рядок назви режиму, а НЕ числовий індекс. Раніше тут писався сирий inputMode
    // (0/1/2) - два різні формати в один й той самий ключ в ui_state.json з двох різних
    // джерел - хто останній записав той і перемагав, а відновлення (яке чекає число)
    // тихо ломалося, коли перемагав бекенд (рядок "text" через Number() -> NaN).
    const modeNames = ["wakeword", "quick", "text"];
    (window as any).pywebview?.api?.set_ui_state?.("input_mode", modeNames[inputMode] ?? "wakeword");
  }, [inputMode]);

  useEffect(() => {
    if (!persistedLoadedRef.current) return;
    (window as any).pywebview?.api?.set_ui_state?.("sound_enabled", soundEnabled);
  }, [soundEnabled]);

  
  // Робоча область екрана (без taskbar), на якому саме вікно зараз - береться
  // безпосередньо з window.screen (Chromium/WebView2 вертає це коректно в тих самих
  // логічних пікселях, що й pywebview api.resize_window), а НЕ через api.get_screen_work_area() на
  // Python-стороні. Саме той Python-шлях (ctypes -> Win32 GetMonitorInfo) був джерелом багу
  // "розгортання як F11-фулскрин": ctypes-виклик тихо падав (відсутність
  // argtypes/restype ламала маршалінг POINT) і код відкотувався на webview.screens, яке віддає
  // ПОВНИЙ розмір екрана - тобто вікно лягало поверх taskbar і виглядало як
  // справжнє fullscreen. window.screen.avail* не має цих проблем - браузер сам
  // вже знає реальну робочу область монітора, без будь-яких Win32 викликів через ctypes.
  function getWorkAreaFromScreen() {
    const scr = window.screen as any;
    return {
      x: typeof scr.availLeft === "number" ? scr.availLeft : 0,
      y: typeof scr.availTop === "number" ? scr.availTop : 0,
      width: scr.availWidth || scr.width,
      height: scr.availHeight || scr.height,
    };
  }

  useEffect(() => {
    const handleResize = () => {
      const isMax = window.outerWidth >= window.screen.availWidth - 5;
      setIsNativeMaximized(isMax);
      // Якщо вікно щойно стало на весь екран НЕ через нашу кнопку Maximize
      // (toggleMaximize), а через нативний шлях Windows (Win+↑, drag-to-top
      // snap, подвійний клік по draggable-зоні тощо) - воно ляже на весь
      // монітор, включно з місцем під панеллю задач (frameless-вікно не має
      // рамки, за яку Windows зазвичай "поважає" taskbar). Підганяємо його
      // геометрію під реальну робочу область (без taskbar) - те саме, що
      // робить toggleMaximize() для кнопки в інтерфейсі - щоб панель задач
      // залишалась видимою і без потреби компенсувати щось відступами.
      if (isMax) {
        const api = (window as any).pywebview?.api;
        if (api?.resize_window) {
          const area = getWorkAreaFromScreen();
          // ФІКС (2026-08-11): п'ятий аргумент `false` = enforce_min на Python-стороні. Без цього
          // resize_window безумовно форсував вікно бути не менше 900x760, ЩО НА БАГАТЬОХ екранах
          // більше за реальну робочу область (напр. 1366x768) - тому вікно лягало вище taskbar саме
          // тоді, коли ми намагалися його підігнати.
          api.resize_window(area.x, area.y, area.width, area.height, false);
        }
        setIsMaximized(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
// Автоскрол до низу консолі - тільки якщо користувач вже був біля низу
// (isAtBottomRef). Ставить scrollTop = scrollHeight напряму (без "smooth") -
// саме це був причиною багу, коли текст виглядав "залишався на місці", а нові рядки
// йдуть самі вниз (безногості): scrollIntoView({behavior:"smooth"}) не встигає за швидкими
// послідовними оновленнями і постійно переривається наступним рядком, через що фрейм
// візуально ніколи так і не доганяє справжнього низу при активному потоці тексту.
  useLayoutEffect(() => {
    if (isAtBottomRef.current && consoleScrollRef.current) {
      const el = consoleScrollRef.current;
      el.scrollTop = el.scrollHeight;
      // Не покладаємось виключно на те, що це викликає асинхронну native "scroll" подію,
      // яка б через onScroll знову підтвердила isAtBottomRef.current = true. Саме це
      // було причиною багу "відклеюється сам по собі": якщо scroll-подія з будь-якої
      // причини не дійде вчасно (або взагалі не дійде в WebView2 для програмного
      // scrollTop без реального користувацького вводу), isAtBottomRef.current так і
      // лишається з старим значенням, і всі наступні рядки більше не автоскроляться,
      // хоча візуально ми щойно були внизу. Ставимо прямо тут - детерміновано, без
      // очікування на round-trip через DOM-подію.
      isAtBottomRef.current = true;
      setShowScrollDown(false);
      // Додаткова перевірка в rAF (2026-08-09): захищає від випадків, коли висота вмісту ще
      // змінюється ПІСЛЯ цього ефекту (напр. шрифт ще довантажився, чи багаторядкове
      // React-оновлення прийшли пізніше, але ще до наступного пейнту).
      const raf = requestAnimationFrame(() => {
        if (isAtBottomRef.current && consoleScrollRef.current) {
          consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [consoleLines]);

  // Реальний міст до консолі M.A.R.T.I.N.: test.py (весь його stdout, через
  // gui_bridge.py) штовхає сюди кожен новий рядок. Максимум 400 рядків у
  // пам'яті UI, щоб DOM не розпухав за довгу сесію.
  const MAX_CONSOLE_LINES = 400;
  useEffect(() => {
    (window as any).__martinAppendConsole = (line: string) => {
      setConsoleLines((prev) => {
        const next = prev.length === 1 && prev[0] === BOOT_CONSOLE_LINES[0] ? [line] : [...prev, line];
        return next.length > MAX_CONSOLE_LINES ? next.slice(next.length - MAX_CONSOLE_LINES) : next;
      });
    };
    (window as any).__martinBackendReady = () => {
      setBackendReady(true);
    };

    const api = (window as any).pywebview?.api;
    if (api?.get_console_backlog) {
      api
        .get_console_backlog()
        .then((lines: string[]) => {
          if (Array.isArray(lines) && lines.length) {
            setConsoleLines(lines.slice(-MAX_CONSOLE_LINES));
          }
        })
        .catch(() => {});
    }

    return () => {
      delete (window as any).__martinAppendConsole;
      delete (window as any).__martinBackendReady;
    };
  }, []);

  // Куля-частиноки: бекенд (gui_bridge.push_speaking_state) штовхає сюди true/false на
  // кожне відтворення звуку (TTS АБО будь-який wav) — анімація кулі тепер
  // реагує на реальне мовлення, а не на окрему кнопку.
  useEffect(() => {
    (window as any).__martinSpeakingStateChanged = (speaking: boolean) => {
      setIsSpeaking(!!speaking);
    };
    (window as any).__martinAudioBins = (bins: number[]) => {
      if (!Array.isArray(bins) || bins.length === 0) return;
      audioBinsRef.current = Uint8Array.from(bins);
    };

    // Сигнал "кліп готовий" (gui_bridge.push_audio_clip_ready): бекенд щойно скопіював
    // файл, який ЗАРАЗ грає, в gui\current_tts.wav — граємо його тут, безшумно, лише
    // заради аналізу через analyserRef — точно так, як робив колишній toggleVoice.
    (window as any).__martinAudioClipReady = () => {
      try {
        let audio = hiddenAudioRef.current;
        if (!audio) {
          audio = new Audio();
          audio.crossOrigin = "anonymous";
          // volume = 0 тут не ставимо, інакше сигнал обнуляється до входу в AnalyserNode
          hiddenAudioRef.current = audio;
        }
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;
          // ПОВЕРНЕНО до оригінального 0.8 (2026-07-27, на прохання користувача — зниження
          // до 0.35 помітно змінило відчуття/вигляд анімації кулі, а не тільки її чутливість до
          // голосності).
          analyserRef.current.smoothingTimeConstant = 0.8;
          
          // Підключаємо GainNode з gain=0 до destination.
          // Це гарантує, що аудіограф активний і процеситься, але звук не дублюється 
          // (бо бекенд його вже грає через winsound).
          const gainNode = audioCtxRef.current.createGain();
          gainNode.gain.value = 0;
          analyserRef.current.connect(gainNode);
          gainNode.connect(audioCtxRef.current.destination);
        }
        if (!(audio as any).__wired) {
          const source = audioCtxRef.current.createMediaElementSource(audio);
          source.connect(analyserRef.current!);
          (audio as any).__wired = true;
        }
        // Відносний шлях працює через HTTP-сервер pywebview (без CORS)
        audio.src = `./current_tts.wav?t=${Date.now()}`;
        audio.currentTime = 0;
        // ФІКС: раніше play() викликався одразу, НЕ чекаючи асинхронного
        // ctx.resume() — якщо AudioContext ще був "suspended" саме в момент
        // виклику (типовий випадок для найпершого відтворення за сесію,
        // поки немає жодного попереднього user-gesture unlock'у), перші кадри
        // йшли повз AnalyserNode "мовчки" (getByteFrequencyData вертає нулі,
        // поки контекст не resumed) — тому перше аудіо програвалося без
        // анімації кулі. Тепер play() чекає на реальне завершення resume().
        const ctxForPlay = audioCtxRef.current;
        const startPlayback = () => audio!.play().catch(() => {});
        if (ctxForPlay.state === "suspended") {
          ctxForPlay.resume().then(startPlayback).catch(startPlayback);
        } else {
          startPlayback();
        }
      } catch {
        /* тихо ігноруємо — анімація просто відвалиться на isSpeaking-фолбек */
      }
    };

    return () => {
      delete (window as any).__martinSpeakingStateChanged;
      delete (window as any).__martinAudioBins;
      delete (window as any).__martinAudioClipReady;
    };
  }, []);

  function sendTextCommand() {
    const text = textInputValue.trim();
    if (!text) return;
    // Те саме, що й ввід в терміналі test.py (start_terminal_input_loop):
    // текст йде напряму в handle_user_text, відповідь друкується в консоль.
    (window as any).pywebview?.api?.send_text?.(text);
    setTextInputValue("");
    playSound("click");
  }

  // Список користувачів для текстового режиму — тягнеться з users.json на бекенді,
  // тому реально "реал-тайм" (включаючи нових, яких щойно навчив auto_train_profiles.py).
  const fetchUsers = useCallback(() => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_users) return;
    api
      .get_users()
      .then((list: MartinUser[]) => {
        if (Array.isArray(list)) setUsers(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (inputMode !== 2) return;
    fetchUsers();
    const interval = setInterval(fetchUsers, 8000);
    return () => clearInterval(interval);
  }, [inputMode, fetchUsers]);

  // ADMIN завжди зверху, далі UNKNOWN, далі всі USER (алфавітно всередині групи).
  const roleOrder: Record<string, number> = { ADMIN: 0, UNKNOWN: 1, USER: 2 };
  const sortedUsers = [...users].sort((a, b) => {
    const ra = roleOrder[a.role] ?? 3;
    const rb = roleOrder[b.role] ?? 3;
    if (ra !== rb) return ra - rb;
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });

  function selectUser(u: MartinUser) {
    setUserSelectError("");
    if (u.role === "ADMIN") {
      // ADMIN вимагає пароль — не вибираємо відразу, відкриваємо поле пароля.
      setPendingAdminId(u.id);
      setAdminPassword("");
      return;
    }
    const api = (window as any).pywebview?.api;
    api
      ?.select_user?.(u.id, "")
      .then((res: { ok: boolean; error?: string }) => {
        if (res?.ok) {
          setActiveUser(u);
          setPendingAdminId(null);
          setShowPersonDrop(false);
          playSound("hover");
        } else {
          setUserSelectError(res?.error || t("persona.errorSelect"));
        }
      })
      .catch(() => setUserSelectError(t("persona.errorConnection")));
  }

  function submitAdminPassword() {
    const api = (window as any).pywebview?.api;
    if (!pendingAdminId || !api?.select_user) return;
    api
      .select_user(pendingAdminId, adminPassword)
      .then((res: { ok: boolean; error?: string }) => {
        if (res?.ok) {
          const u = users.find((x) => x.id === pendingAdminId) || null;
          setActiveUser(u);
          setPendingAdminId(null);
          setAdminPassword("");
          setUserSelectError("");
          setShowPersonDrop(false);
          playSound("hover");
        } else {
          setUserSelectError(res?.error || t("persona.errorWrongPassword"));
        }
      })
      .catch(() => setUserSelectError(t("persona.errorConnection")));
  }

  function openSection(key: NonNullable<Section>) {
    playSound("open");
    setSection(key);
  }

  function closeSection() {
    playSound("click-3-clowse");
    setSection(null);
  }

  // Fixed pywebview title bar is 32px tall and sits ON TOP of the app (it's
  // position:fixed, not part of normal flow) - so corner elements need their
  // own top offset nudged down by that much or the bar visually overlaps
  // them. Only applies when actually running inside pywebview.
  const titleBarOffset =
    typeof (window as any).pywebview !== "undefined" ? 32 : 0;

  // Кнопки активні лише після mounted (інтро-анімація) і коли бекенд готовий
  // (backendReady) або спрацював запобіжний таймаут (readyTimeoutElapsed).
  const interactionsReady = mounted && (backendReady || readyTimeoutElapsed);

  // pywebview gives frameless windows NO native OS edge/corner resize
  // handles at all (confirmed limitation, not something a create_window
  // flag turns on: https://github.com/r0x0r/pywebview/discussions/1591) -
  // so we track the drag ourselves and ask Python to resize+reposition the
  // real OS window. Only w/e/s/sw/se are handled (no north-edge resize) -
  // a north/top handle would have to sit right on top of the 32px title
  // bar's drag region, and stealing those mousedown events broke window
  // dragging entirely. Losing top-edge resize is a fair trade for that.
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const MIN_WINDOW_WIDTH = 900;
  // ФІКС (2026-08-11): 760 -> 700, узгоджено з min_size в martin_gui.py - нижче на багатьох
  // екранах цей флор міг би заважати реальній робочій області екрана при ручному ресайзі
  // куточок. Цей констант стосується ТІЛЬКИ ручного ресайзу мишкою в startResize() нижче -
  // розгортання (toggleMaximize/handleResize) вже НЕ використовує його взагалі -
  // вони передають enforce_min=false в api.resize_window() і завжди точно відповідають реальній
  // робочій області екрана, незалежно від цього числа.
  const MIN_WINDOW_HEIGHT = 700;

  function startResize(e: React.PointerEvent, direction: string) {
    e.preventDefault();
    e.stopPropagation();
    const api = (window as any).pywebview?.api;
    if (!api) return;

    // Pointer capture ties pointermove/pointerup delivery directly to this
    // element for the rest of the gesture, regardless of where the cursor
    // physically ends up - critical here because the window itself moves
    // under the cursor during a drag. Plain `window.addEventListener("mouseup", ...)`
    // never fired if the cursor ended up outside the (now-relocated) window
    // when the button was released, leaving the listeners attached forever -
    // every mouse move anywhere afterwards (including trying to drag the
    // title bar) kept re-triggering resize_window with stale data, which is
    // what the jitter and "dragging stopped working" were.
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    api.get_window_geometry().then((geo: { x: number; y: number; width: number; height: number }) => {
      const start = {
        mouseX: e.screenX,
        mouseY: e.screenY,
        x: geo.x,
        y: geo.y,
        w: geo.width,
        h: geo.height,
      };
      resizeStartRef.current = start;

      const target = { x: start.x, y: start.y, w: start.w, h: start.h };
      const lastSent = { x: NaN, y: NaN, w: NaN, h: NaN };
      let rafId: number | null = null;

      // Also throttle to at most one resize_window call per animation frame
      // (raw pointermove can fire much faster than 60Hz on some mice) -
      // fewer, evenly-paced native resize calls is smoother than one per
      // pointermove event.
      const applyTarget = () => {
        rafId = null;
        if (
          target.x === lastSent.x &&
          target.y === lastSent.y &&
          target.w === lastSent.w &&
          target.h === lastSent.h
        ) {
          return;
        }
        lastSent.x = target.x;
        lastSent.y = target.y;
        lastSent.w = target.w;
        lastSent.h = target.h;
        api.resize_window(target.x, target.y, target.w, target.h);
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.screenX - start.mouseX;
        const dy = ev.screenY - start.mouseY;

        let newX = start.x;
        const newY = start.y; // never changes - no north-edge resize
        let newW = start.w;
        let newH = start.h;

        if (direction.includes("e")) newW = start.w + dx;
        if (direction.includes("w")) {
          newW = start.w - dx;
          newX = start.x + dx;
        }
        if (direction.includes("s")) newH = start.h + dy;

        if (newW < MIN_WINDOW_WIDTH) {
          if (direction.includes("w")) newX = start.x + start.w - MIN_WINDOW_WIDTH;
          newW = MIN_WINDOW_WIDTH;
        }
        if (newH < MIN_WINDOW_HEIGHT) newH = MIN_WINDOW_HEIGHT;

        target.x = newX;
        target.y = newY;
        target.w = newW;
        target.h = newH;

        if (rafId == null) rafId = requestAnimationFrame(applyTarget);
      };

      const cleanup = (ev: PointerEvent) => {
        if (rafId != null) cancelAnimationFrame(rafId);
        resizeStartRef.current = null;
        try {
          handle.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", cleanup);
        handle.removeEventListener("pointercancel", cleanup);
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", cleanup);
      handle.addEventListener("pointercancel", cleanup);
    });
  }

  const [isMaximized, setIsMaximized] = useState(false);
  const preMaximizeGeoRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  // "none" | "minimizing" | "closing" - drives a quick opacity fade on the
  // whole app before the actual OS-level minimize()/close() call, since
  // those are otherwise instant/abrupt for a frameless window (no DWM
  // genie/fade animation the way a normal titled window gets).
    const [isNativeMaximized, setIsNativeMaximized] = useState(false);
const [windowTransition, setWindowTransition] = useState<"none" | "minimizing" | "closing">("none");

  // Maximize/restore as a SINGLE instant resize_window() call to the
  // current screen's work area (screen minus taskbar) - not the native
  // self._win.maximize(). Two reasons: (1) native maximize() on a frameless
  // WinForms window covers the ENTIRE screen including the taskbar, since
  // without a border Windows has no "respect the taskbar" logic to apply
  // (that's normally tied to window chrome); the work-area rect explicitly
  // excludes it. (2) doing this as one instant call (not an animation loop
  // like an earlier version tried) avoids the "trail" artifact that comes
  // from repeatedly resizing this transparent window every frame.
  async function toggleMaximize() {
    const api = (window as any).pywebview?.api;
    if (!api) return;
    if (!isMaximized) {
      const geo = await api.get_window_geometry();
      preMaximizeGeoRef.current = { x: geo.x, y: geo.y, w: geo.width, h: geo.height };
      const area = getWorkAreaFromScreen();
      // ФІКС (2026-08-11): той самий `false` що й в handleResize вище - без нього min_size=900x760
      // на Python-стороні форсував вікно бути вищим за реальну робочу область на багатьох екранах
      // (напр. 1366x768) - саме це й було справжньою причиною, чому кнопка "розгорнути" в інтерфейсі
      // покривала панель задач.
      await api.resize_window(area.x, area.y, area.width, area.height, false);
      setIsMaximized(true);
    } else {
      const prev = preMaximizeGeoRef.current;
      if (prev) await api.resize_window(prev.x, prev.y, prev.w, prev.h);
      setIsMaximized(false);
    }
  }

  function handleMinimize() {
    setWindowTransition("minimizing");
    setTimeout(() => {
      (window as any).pywebview.api.minimize();
      setWindowTransition("none");
    }, 150);
  }

  function handleClose() {
    setWindowTransition("closing");
    setTimeout(() => {
      (window as any).pywebview.api.close();
    }, 180);
  }

  return (
    <I18nProvider lang={language}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden" }}>
        {typeof (window as any).pywebview !== "undefined" && (
          <div
            style={{
              flexShrink: 0,
                            height: 32,
              zIndex: 9999,
              display: "flex",
              alignItems: "stretch", // Stretch to fill the 32px height
              userSelect: "none",
              background: "rgba(0,0,0,0.4)", // Slight tint for the title bar
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* App Icon and Title - pywebview's OWN drag mechanism (not
                Electron's -webkit-app-region!) is opt-in per element via
                this exact class name; pywebview's injected JS (loaded
                automatically, see "webview/js" in the console log) handles
                the actual native window move from here - no extra JS
                needed on our side. */}
            <div
              className="pywebview-drag-region"
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                gap: 10,
                cursor: "move",
              }}
            >
              <img
                src="./martin.png"
                alt="Icon"
                style={{
                  width: 28,
                  height: 28,
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "1px",
                }}
              >
                M.A.R.T.I.N.
              </div>
            </div>

            {/* Drag area — fills most of the bar */}
            <div className="pywebview-drag-region" style={{ flex: 1, height: "100%", cursor: "move" }} />

            {/* Window control buttons — no pywebview-drag-region class here,
                so they're non-draggable/clickable by default (dragging is
                opt-in per element, not opt-out). */}
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {/* Minimise */}
              <button
                onClick={handleMinimize}
                title="Minimize"
                style={{
                  width: 46,
                  background: "transparent",
                  border: "none",
                  cursor: "default",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path
                    fill="currentColor"
                    d="M0,4.5 L10,4.5 L10,5.5 L0,5.5 Z"
                  />
                </svg>
              </button>

              {/* Maximise / Restore */}
              <button
                onClick={toggleMaximize}
                title="Maximize"
                style={{
                  width: 46,
                  background: "transparent",
                  border: "none",
                  cursor: "default",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M1,1 L9,1 L9,9 L1,9 Z M2,2 L8,2 L8,8 L2,8 Z"
                  />
                </svg>
              </button>

              {/* Close */}
              <button
                onClick={handleClose}
                title="Close"
                style={{
                  width: 46,
                  background: "transparent",
                  border: "none",
                  cursor: "default",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e81123"; // Windows red close color
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path
                    fill="currentColor"
                    d="M1.4,0.7 L5,4.3 L8.6,0.7 L9.3,1.4 L5.7,5 L9.3,8.6 L8.6,9.3 L5,5.7 L1.4,9.3 L0.7,8.6 L4.3,5 L0.7,1.4 Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      <div
        className="asphalt-bg"
        style={{
          flex: 1,
          width: "100%", height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // ФІКС (2026-07-27): було "center" - головний блок (куля+консоль+ввід)
          // вертикально центрувався відносно ВСІЄЇ висоти вікна - чим вище вікно
          // (розгортання), тим нижче відносно footer-тексту/нижнього краю опинявся
          // фрейм консолі/вводу (баг, який раніше намагалися компенсувати магічним
          // від'ємним marginTop залежно від isMaximized). "flex-start" замість цього тримає
          // кулю/фрейми на ОДНАКОВІЙ відстані від верху НЕЗАЛЕЖНО від висоти вікна — вони
          // ніколи не дрейфують вниз, навіть коли вікно розгорнуте.
          justifyContent: "flex-start",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'RexBold', sans-serif",
          // Opacity ONLY - no transform/scale here. A transform value (even
          // an inert scale(1) at rest) turns this element into a new
          // stacking context AND the containing block for every
          // position:fixed descendant in the whole app, permanently - that
          // trapped every section's z-index inside this one box, and let
          // the document.body-portaled GlassDockFollower (which lives
          // OUTSIDE this box entirely) render above literally everything.
          // Scaling window content also seemed to leave visible "trail"
          // artifacts on this transparent WinForms window - opacity alone
          // doesn't have either problem.
          transition: "opacity 180ms ease",
          opacity: windowTransition !== "none" ? 0 : 1,
        }}
      >
        {/* Shared goo filter for the liquid-glass shine/blob accents */}
        <LiquidGooDefs />
        {/* Shared feTurbulence displacement filter for GlassDock's liquid-glass warp */}
        <GlassBlurDefs />

        {/* ── PyWebView Desktop Window Controls ──────────────────────────────
            Rendered ONLY when running inside pywebview (window.pywebview exists).
            Provides a drag region + close / maximise / minimise buttons.
            Hidden completely when opened in a normal browser.
        ────────────────────────────────────────────────────────────────────── */}
        

        {/* ── Custom resize handles ────────────────────────────────────────────
            Frameless pywebview windows have no native edge/corner resize, so
            these invisible strips track the drag and call resize_window().
            No top/north handle on purpose - it would have to overlap the
            title bar's drag region and broke window dragging entirely.
        ────────────────────────────────────────────────────────────────────── */}
        {typeof (window as any).pywebview !== "undefined" && (
          <>
            <div onPointerDown={(e) => startResize(e, "s")} style={{ position: "fixed", bottom: 0, left: 8, right: 8, height: 10, cursor: "ns-resize", zIndex: 10000, touchAction: "none" }} />
            <div onPointerDown={(e) => startResize(e, "w")} style={{ position: "fixed", left: 0, top: 40, bottom: 8, width: 5, cursor: "ew-resize", zIndex: 10000, touchAction: "none" }} />
            <div onPointerDown={(e) => startResize(e, "e")} style={{ position: "fixed", right: 0, top: 40, bottom: 8, width: 5, cursor: "ew-resize", zIndex: 10000, touchAction: "none" }} />
            <div onPointerDown={(e) => startResize(e, "sw")} style={{ position: "fixed", bottom: 0, left: 0, width: 8, height: 8, cursor: "nesw-resize", zIndex: 10001, touchAction: "none" }} />
            <div onPointerDown={(e) => startResize(e, "se")} style={{ position: "fixed", bottom: 0, right: 0, width: 8, height: 8, cursor: "nwse-resize", zIndex: 10001, touchAction: "none" }} />
          </>
        )}

        {/* Ambient gradient blob */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(120,0,200,0.09) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Top-right: neon microphone */}
        <motion.div
          className="droplet-right"
          style={{
            position: "absolute",
            top: 20 + titleBarOffset,
            right: 20,
            zIndex: 50,
            display: inputMode === 2 ? "none" : undefined,
            animationDelay: "0.4s",
            pointerEvents: interactionsReady ? "auto" : "none",
            opacity: interactionsReady ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${micActive ? "neon-pink" : "neon-gray"}`}
            whileHover={interactionsReady ? { scale: 1.15, rotate: 5 } : undefined}
            whileTap={interactionsReady ? { scale: 0.9 } : undefined}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            onClick={() => {
              if (!interactionsReady) return;
              const next = !micActive;
              setMicActive(next);
              playSound(micActive ? "click-3-clowse" : "click-4");
              // Вимкнено/увімкнено -> бекенд реально м'ютить мікрофон
              // (_set_mic_mute, який також повідомляє C++ про це через сокет 12350)
              (window as any).pywebview?.api?.set_mic_enabled?.(next);
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              background: "transparent",
              border: "none",
              color: micActive ? "#ff32b4" : "rgba(220, 220, 220, 0.9)",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Microphone"
          >
            <GlassDock
              borderRadius={26}
              disableEdge={true}
              overlayStyle={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
              style={{ position: "absolute", inset: 0, zIndex: 0 }}
            />
            <span style={{ position: "relative", zIndex: 2 }}>🎙</span>
          </motion.button>
        </motion.div>

        {/* Input Mode Toggle */}
        <motion.div
          className="droplet-right"
          style={{
            position: "absolute",
            top: 88 + titleBarOffset,
            right: 20,
            zIndex: 50,
            animationDelay: "0.5s",
            pointerEvents: interactionsReady ? "auto" : "none",
            opacity: interactionsReady ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${inputMode === 0 ? "neon-cyan" : inputMode === 1 ? "neon-green" : "neon-yellow"}`}
            whileHover={interactionsReady ? { scale: 1.15, rotate: 5 } : undefined}
            whileTap={interactionsReady ? { scale: 0.9 } : undefined}
            onClick={() => {
              if (!interactionsReady) return;
              setInputMode((m) => {
                const next = (m + 1) % 3;
                // 0 = активаційне слово (звичайний голосовий режим, сесія 40с),
                // 1 = швидкий (тригер перед кожною командою), 2 = текстовий
                const modeNames = ["wakeword", "quick", "text"];
                (window as any).pywebview?.api?.set_mode?.(modeNames[next]);
                return next;
              });
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              background: "transparent",
              border: "none",
              color:
                inputMode === 0
                  ? "#00dcff"
                  : inputMode === 1
                    ? "#00ff78"
                    : "#ffdc00",
            }}
            onMouseEnter={() => playSound("hover")}
          >
            <GlassDock
              borderRadius={26}
              disableEdge={true}
              overlayStyle={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
              style={{ position: "absolute", inset: 0, zIndex: 0 }}
            />
            <span style={{ position: "relative", zIndex: 2 }}>
              {inputMode === 0 ? "A" : inputMode === 1 ? "I" : "⌨"}
            </span>
          </motion.button>
        </motion.div>

        {/* Sound Toggle */}
        <motion.div
          className="droplet-right"
          style={{
            position: "absolute",
            top: 156 + titleBarOffset,
            right: 20,
            zIndex: 50,
            animationDelay: "0.6s",
            pointerEvents: interactionsReady ? "auto" : "none",
            opacity: interactionsReady ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${soundEnabled ? "neon-orange" : "neon-gray"}`}
            whileHover={interactionsReady ? { scale: 1.15, rotate: 5 } : undefined}
            whileTap={interactionsReady ? { scale: 0.9 } : undefined}
            onClick={() => {
              if (!interactionsReady) return;
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                playSound("click-6-mode");
              }
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              position: "relative",
              overflow: "hidden",
              background: "transparent",
              border: "none",
              color: soundEnabled ? "#ff9600" : "rgba(160, 160, 160, 0.7)",
            }}
            onMouseEnter={() => {
              if (soundEnabled) playSound("hover");
            }}
          >
            <GlassDock
              borderRadius={26}
              disableEdge={true}
              overlayStyle={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
              style={{ position: "absolute", inset: 0, zIndex: 0 }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {soundEnabled ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </div>
          </motion.button>
        </motion.div>

        {/* Persona Selector (Text Mode Only) */}
        <AnimatePresence>
          {inputMode === 2 && (
            <motion.div
              className="droplet-right"
              style={{
                position: "absolute",
                top: 20 + titleBarOffset,
                right: 88,
                zIndex: 49,
              }}
            >
              <motion.button
                className="neon-btn neon-gray motion-gpu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const next = !showPersonDrop;
                  setShowPersonDrop(next);
                  if (next) fetchUsers();
                }}
                onMouseEnter={() => playSound("hover")}
                style={{
                  height: 52,
                  borderRadius: 26,
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "transparent",
                  border: "none",
                  color: "rgba(220, 220, 220, 0.90)",
                  fontFamily: "'RexBold', sans-serif",
                  fontSize: 16,
                  letterSpacing: "0.08em",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <GlassDock
                  borderRadius={26}
                  disableEdge={true}
                  overlayStyle={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
                  }}
                  style={{ position: "absolute", inset: 0, zIndex: 0 }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>ID:</span>{" "}
                  {activeUser ? activeUser.first_name || activeUser.id : t("persona.guest")}
                </div>
              </motion.button>

              <AnimatePresence>
                {showPersonDrop && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: "absolute",
                      top: 60,
                      right: 0,
                      width: 260,
                      maxHeight: 340,
                      background: "transparent",
                      border: "none",
                      borderRadius: 12,
                      padding: 8,
                      overflowY: "auto",
                      overflowX: "hidden",
                    }}
                  >
                    <GlassDock
                      borderRadius={12}
                      disableEdge={true}
                      overlayStyle={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
                      }}
                      style={{ position: "absolute", inset: 0, zIndex: 0 }}
                    />
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {sortedUsers.length === 0 && (
                        <div
                          style={{
                            padding: "10px 12px",
                            color: "rgba(160,160,160,0.7)",
                            fontSize: 12,
                            fontFamily: "'RexBold', sans-serif",
                          }}
                        >
                          {t("persona.loadingUsers")}
                        </div>
                      )}
                      {sortedUsers.map((u) => {
                        const isAdmin = u.role === "ADMIN";
                        const isUnknown = u.role === "UNKNOWN";
                        const isActive = activeUser?.id === u.id;
                        const name = `${u.first_name} ${u.last_name}`.trim() || u.id;
                        return (
                          <div key={u.id}>
                            <button
                              onClick={() => selectUser(u)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                background: isActive
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent",
                                border: isAdmin
                                  ? "1px solid rgba(255,220,0,0.25)"
                                  : "1px solid transparent",
                                color: isAdmin
                                  ? "#ffdc00"
                                  : isActive
                                    ? "#ffffff"
                                    : isUnknown
                                      ? "rgba(180,180,180,0.75)"
                                      : "rgba(210,210,210,0.9)",
                                textAlign: "left",
                                fontFamily: "'RexBold', sans-serif",
                                fontSize: 13,
                                cursor: "pointer",
                                borderRadius: 6,
                                letterSpacing: "0.05em",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(160, 160, 160, 0.15)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = isActive
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent")
                              }
                            >
                              <span>{name}</span>
                              <span style={{ fontSize: 9, opacity: 0.5, letterSpacing: "0.1em" }}>
                                {u.role}
                              </span>
                            </button>
                            {pendingAdminId === u.id && (
                              <div
                                style={{
                                  padding: "6px 4px 10px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <input
                                  type="password"
                                  autoFocus
                                  placeholder={t("persona.adminPassword")}
                                  value={adminPassword}
                                  onChange={(e) => setAdminPassword(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") submitAdminPassword();
                                  }}
                                  style={{
                                    background: "rgba(0,0,0,0.35)",
                                    border: "1px solid rgba(255,220,0,0.35)",
                                    borderRadius: 6,
                                    padding: "6px 8px",
                                    color: "#fff",
                                    fontSize: 12,
                                    outline: "none",
                                    fontFamily: "'RexBold', sans-serif",
                                  }}
                                />
                                <button
                                  onClick={submitAdminPassword}
                                  style={{
                                    background: "rgba(255,220,0,0.15)",
                                    border: "1px solid rgba(255,220,0,0.4)",
                                    borderRadius: 6,
                                    padding: "5px 0",
                                    color: "#ffdc00",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontFamily: "'RexBold', sans-serif",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {t("persona.login")}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {userSelectError && (
                        <div
                          style={{
                            padding: "6px 12px",
                            color: "#ff5f5f",
                            fontSize: 11,
                            fontFamily: "'RexBold', sans-serif",
                          }}
                        >
                          {userSelectError}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-left: neon menu */}
        <motion.div
          className="droplet-left"
          style={{
            position: "absolute",
            top: 20 + titleBarOffset,
            left: 20,
            zIndex: 50,
            animationDelay: "0.2s",
            pointerEvents: interactionsReady ? "auto" : "none",
            opacity: interactionsReady ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        >
          <motion.button
            className="neon-btn neon-cyan motion-gpu"
            whileHover={interactionsReady ? { scale: 1.15, rotate: -5 } : undefined}
            whileTap={interactionsReady ? { scale: 0.94 } : undefined}
            onClick={() => {
              if (!interactionsReady) return;
              setSidePanel(true);
              playSound("click-4");
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "rgba(0, 220, 255, 0.90)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Menu"
          >
            <GlassDock
              borderRadius={26}
              disableEdge={true}
              overlayStyle={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
              style={{ position: "absolute", inset: 0, zIndex: 0 }}
            />
            <span style={{ position: "relative", zIndex: 2 }}>☰</span>
          </motion.button>
        </motion.div>

        {/* Main layout */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 0,
            flexShrink: 0,
            // ФІКС (2026-07-27): тепер фіксований відступ від верху (не залежить від
            // висоти вікна) замість старого підходу з від'ємним marginTop залежно від
            // isMaximized - той підхід компенсував центрування батька asphalt-bg (див. вище:
            // тепер він flex-start), але від висоти вікна залежав і легко недораховував -
            // точно та сама причина, через яку фрейми консолі/вводу могли опинятися на текст
            // при розгорнутому вікні. Тепер блок просто сидить на фіксованій відстані 40px
            // від верху (трохи нижче верхніх кнопок) ЗАВЖДИ, незалежно від висоти/стану
            // вікна - найнадійніший спосіб гарантувати, що фрейми ніколи не з'їдуть ближче до
            // footer.
            //
            // ФІКС #2 (цей коміт, 2026-08-08): фіксована `height: 620` тут була другим багом -
            // вона НЕ давала жодного захисту від перекриття footer'а: куля (350) + відступ (30) +
            // фрейм (240) = рівно 620, але в текстовому режимі (фрейм 180 + рядок вводу 16+52) блок вже
            // перевищував ці 620px і просто ВИЛІЗАВ за межі цього div'а вниз - точно в ту зону, де
            // раніше сидів (абсолютно позиціонований) footer, і вищий z-індекс фрейма/вводу малював
            // його зверху. Тепер висота цього блоку просто визначається його власним вмістом (без
            // фіксованого height), а Footer нижче тепер звичайний flex-дитина тогож колонки
            // (див. коментар в самому Footer вище) - CSS гарантує, що він завжди нижче цього блоку,
            // а не перекривається ним.
            // ФІКС (копірайт-текст обрізається): було 10, але разом з іншими
            // фіксованими відступами нижче весь блок (куля + фрейм + Footer) не вміщався
            // на мінімальній висоті вікна (MIN_WINDOW_HEIGHT=700) і напис про копірайт у
            // Footer'і вилітав за межі (overflow:hidden у asphalt-bg). Підняли весь блок вище,
            // прибравши цей відступ (див. також marginBottom під кулею та marginTop/paddingBottom в
            // Footer нижче).
            marginTop: 0,
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Particle sphere */}
          <div
            // ФІКС ("фрейми консолі/вводу підняти трохи вгору, ближче до сфери"): було 12 — зменшено,
            // щоб фрейм консолі сидів щільніше до кулі (див. також marginTop поля вводу нижче).
            style={{ marginBottom: 4, cursor: interactionsReady ? "pointer" : "default", pointerEvents: interactionsReady ? "auto" : "none" }}
            onClick={() => { if (interactionsReady) openSection("brain"); }}
          >
            <ParticleSphere
              size={350}
              canvasSize={1000}
              isSpeaking={isSpeaking}
              analyserNodeRef={analyserRef}
              audioBinsRef={audioBinsRef}
            />
          </div>

          {/* Glass frame — Glass Dock liquid glass style */}
          <motion.div
            ref={frameRef}
            className={`glass-frame${mounted ? " droplet-up" : ""}`}
            initial={{ height: inputMode === 2 ? 180 : 240 }}
            animate={{
              height: inputMode === 2 ? 180 : 240,
            }}
            transition={{
              height: { type: "spring", stiffness: 400, damping: 30, delay: 0 },
            }}
            style={{
              width: 480,
              borderRadius: 20,
              padding: 0,
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              opacity: mounted ? undefined : 0,
              zIndex: 10,
              willChange: "transform",
            }}
          >
            {mounted && (
              <GlassDockFollower
                targetRef={frameRef}
                borderRadius={20}
                zIndex={8}
                overlayStyle={{
                  background: `
                    linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%),
                    radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)
                  `,
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
                }}
              />
            )}
            <div
              ref={consoleScrollRef}
              className="glass-content hologram-container martin-console-scroll"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } =
                  e.currentTarget;
                // Threshold of 10px to consider "at bottom"
                const atBottom = scrollHeight - scrollTop - clientHeight < 10;
                isAtBottomRef.current = atBottom;
                setShowScrollDown(!atBottom);
              }}
              style={{
                position: "relative",
                zIndex: 3,
                fontFamily: "'Cascadia Mono', 'Consolas', 'Segoe UI', monospace",
                fontSize: 14,
                lineHeight: 1.9,
                height: "100%",
                padding: 0,
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(192,132,252,0.45) transparent",
              }}
            >
              <div
                className="hologram-text"
                style={{
                  position: "relative",
                  minHeight: "100%",
                  padding: "12px 16px",
                }}
              >
                {/* Committed lines */}
                {consoleLines.map((rawLine, i) => {
                  const { kind, text: line } = parseConsoleLine(rawLine);
                  const kindColor = CONSOLE_KIND_COLORS[kind];
                  return (
                    <div
                      key={i}
                      className={
                        kindColor
                          ? "hologram-line-white"
                          : line.includes("M.A.R.T.I.N >") || line.startsWith("SYSTEM:")
                            ? "hologram-line-purple"
                            : "hologram-line-white"
                      }
                      style={{
                        opacity:
                          0.6 + (i / Math.max(1, consoleLines.length)) * 0.4,
                        position: "relative",
                        ...(kindColor ? { color: kindColor } : {}),
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
                {/* Живий курсор після останнього реального рядка консолі */}
                <div className="hologram-text" style={{ color: "#e2c0ff" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 12,
                      background: "#c084fc",
                      marginLeft: 1,
                      verticalAlign: "middle",
                      boxShadow: "0 0 8px #c084fc",
                      animation: "blink-cursor 0.9s step-end infinite",
                    }}
                  />
                </div>
                {/* Scroll anchor */}
                <div ref={consoleEndRef} style={{ height: 1 }} />
              </div>
            </div>
            {/* Кнопка "вниз" - з'являється, коли користувач відскролив консоль вгору
                (не біля низу) - клік миттєво прискролює до останнього рядка і повертає автоскрол. */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.85 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    const el = consoleScrollRef.current;
                    if (el) el.scrollTop = el.scrollHeight;
                    isAtBottomRef.current = true;
                    setShowScrollDown(false);
                  }}
                  title={t("persona.scrollToBottom")}
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    border: "1px solid rgba(192,132,252,0.35)",
                    background: "rgba(20,10,30,0.55)",
                    color: "#e2c0ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 6,
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(160,50,255,0.25)",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {inputMode === 2 && (
              <motion.div
                ref={inputRowRef}
                layout
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  y: -60,
                  scaleY: 1.5,
                  filter: "blur(6px)",
                  transition: { duration: 0.3 },
                }}
                style={{
                  marginTop: 8,  // ФІКС (ближче до сфери/консолі): було 16
                  width: 480,
                  display: "flex",
                  gap: 16,
                  height: 52,
                  zIndex: 5,
                  position: "relative",
                  transformOrigin: "top center",
                }}
              >
                <motion.div
                  ref={inputFrameRef}
                  initial={{ opacity: 0, y: -80, scaleY: 1.8, scaleX: 0.9 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1, scaleX: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 22,
                    mass: 1.2,
                  }}
                  style={{
                    flex: 1,
                    position: "relative",
                    borderRadius: 16,
                    overflow: "hidden",
                    height: 52,
                    zIndex: 6,
                    transformOrigin: "top center",
                    willChange: "transform",
                  }}
                >
                  <GlassDockFollower
                    targetRef={inputFrameRef}
                    effectsRef={inputRowRef}
                    borderRadius={16}
                    zIndex={8}
                    overlayStyle={{
                      background: `
                        linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%),
                        radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)
                      `,
                      boxShadow:
                        "inset 0 1px 1px rgba(255,255,255,0.25), inset 0 10px 20px rgba(160,50,255,0.02)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="ENTER QUERY..."
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendTextCommand();
                      }
                    }}
                    style={{
                      width: "100%",
                      height: 52,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "0 20px",
                      color: "rgba(255, 255, 255, 0.95)",
                      fontFamily: "'Cascadia Mono', 'Consolas', 'Segoe UI', monospace",
                      fontSize: 14,
                      letterSpacing: "0.02em",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                </motion.div>
                <motion.button
                  className="neon-btn neon-gray motion-gpu"
                  initial={{ opacity: 0, x: -80, scaleX: 1.8, scaleY: 0.9 }}
                  animate={{ opacity: 1, x: 0, scaleX: 1, scaleY: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => playSound("hover")}
                  onClick={() => sendTextCommand()}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 22,
                    mass: 1.2,
                    delay: 0.15,
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "transparent",
                    border: "none",
                    color: "rgba(220, 220, 220, 0.9)",
                    zIndex: 5,
                    transformOrigin: "center left",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <GlassDock
                    borderRadius={26}
                    disableEdge={true}
                    overlayStyle={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(100% 80% at 50% -20%, rgba(160,50,255,0.12) 0%, transparent 60%)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
                    }}
                    style={{ position: "absolute", inset: 0, zIndex: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 18,
                      transform: "translateX(2px)",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    ➤
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <Footer />

        {/* Side panel */}
        <SidePanel
          open={sidePanel}
          onClose={() => setSidePanel(false)}
          onSound={playSound}
          onOpenSection={openSection}
        />

        {/* Sections Overlay */}
        <MemorySection
          open={section === "memory"}
          onClose={closeSection}
          onSound={playSound}
          language={language}
        />
        <SettingsSection
          open={section === "settings"}
          onClose={closeSection}
          onSound={playSound}
          soundEnabled={soundEnabled}
          onSoundToggle={setSoundEnabled}
          language={language}
          onLanguageChange={(l: "EN" | "RU" | "UK") => setLanguage(l)}
        />
        <ReminderSection
          open={section === "reminder"}
          onClose={closeSection}
          onSound={playSound}
        />
        <PluginsSection
          open={section === "plugins"}
          onClose={closeSection}
          onSound={playSound}
        />
        <CommandsSection
          open={section === "commands"}
          onClose={closeSection}
          onSound={playSound}
        />
        <AddCommandsSection
          open={section === "addcommands"}
          onClose={closeSection}
          onSound={playSound}
        />
        <PeopleSection
          open={section === "people"}
          onClose={closeSection}
          onSound={playSound}
        />
        <Brain
          open={section === "brain"}
          onClose={closeSection}
          onSound={playSound}
        />
      </div>

      </div>
    </I18nProvider>
  );
}
