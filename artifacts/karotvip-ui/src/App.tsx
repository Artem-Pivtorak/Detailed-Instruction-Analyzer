import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleSphere } from "./components/ParticleSphere";
import { SidePanel } from "./components/SidePanel";
import { GlassDock } from "./components/GlassDock";
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

const CONSOLE_LINES = [
  "SYSTEM: Initializing Karotvip AI Core v2.4.1...",
  "Neural network loaded. 847 active nodes.",
  "Voice recognition module: STANDBY",
  "Memory cache allocated: 6.2 GB",
  "All subsystems nominal. Ready for commands.",
  "Processing request queue... 0 pending tasks.",
  "Module integrity check: PASS. Uptime: 14h 22m",
  "SYSTEM: Lorem ipsum dolor sit amet, consectetur adipiscing.",
  "Scanning environment... No anomalies detected.",
  "Karotvip Core ready. Awaiting input.",
];

import { I18nProvider, useI18n } from "./i18n";

function Footer() {
  const { t } = useI18n();
  const [typedText, setTypedText] = useState("");
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
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 11,
        color: "rgba(160,160,160,0.35)",
        fontFamily: "pdark",
        letterSpacing: "0.02em",
        userSelect: "none",
        zIndex: 5,
        minHeight: 14, // To prevent jumping layout during typing
      }}
    >
      {typedText}
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>(null);
  const [language, setLanguage] = useState<"EN" | "RU" | "UK">("EN");
  const [sidePanel, setSidePanel] = useState(false);
  const [micActive, setMicActive] = useState(true);
  // 0: Activation Word, 1: Instant Command, 2: Text
  const [inputMode, setInputMode] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState("AI CORE");
  const [showPersonDrop, setShowPersonDrop] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { play } = useSound(soundEnabled);

  const playSound = useCallback(
    (type: string) => {
      play(type as any);
    },
    [play],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let s1: NodeJS.Timeout;
    let s2: NodeJS.Timeout;

    // We use a small delay for everything to ensure the sound hook has
    // initialized its internals and paths are resolved.
    const startIntro = () => {
      s1 = setTimeout(() => {
        playSound("sircle");
      }, 150);

      s2 = setTimeout(() => {
        playSound("download");
      }, 600);

      timer = setTimeout(() => {
        setMounted(true);
        playSound("end-download");
      }, 3000);
    };

    startIntro();

    return () => {
      clearTimeout(timer);
      clearTimeout(s1);
      clearTimeout(s2);
    };
  }, []); // Empty dependency array ensures intro plays ONLY ONCE on mount

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
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Tilt animation refs (disabled - frame is static)
  const frameRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom of console (only if already near bottom)
  useEffect(() => {
    if (isAtBottomRef.current) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLines, currentLine]);

  // Typewriter effect — fills lines inside the frame
  useEffect(() => {
    const line = CONSOLE_LINES[lineIdx];
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setCurrentLine((prev) => prev + line[charIdx]);
        setCharIdx((i) => i + 1);
      }, 36);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        // Commit this line, start the next
        setConsoleLines((prev) => [...prev, line]);
        setCurrentLine("");
        setLineIdx((i) => (i + 1) % CONSOLE_LINES.length);
        setCharIdx(0);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [charIdx, lineIdx]);

  function openSection(key: NonNullable<Section>) {
    playSound("open");
    setSection(key);
  }

  function closeSection() {
    setSection(null);
  }

  return (
    <I18nProvider lang={language}>
      <div
        className="asphalt-bg"
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'RexBold', sans-serif",
        }}
      >
        {/* Shared goo filter for the liquid-glass shine/blob accents */}
        <LiquidGooDefs />
        {/* Shared feTurbulence displacement filter for GlassDock's liquid-glass warp */}
        <GlassBlurDefs />

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
          style={{ position: "absolute", top: 20, right: 20, zIndex: 50, animationDelay: "0.4s" }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${micActive ? "neon-pink" : "neon-gray"}`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            onClick={() => {
              setMicActive(!micActive);
              playSound(micActive ? "click-3-clowse" : "click-4");
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Microphone"
          >
            🎙
          </motion.button>
        </motion.div>

        {/* Input Mode Toggle */}
        <motion.div
          className="droplet-right"
          style={{ position: "absolute", top: 88, right: 20, zIndex: 50, animationDelay: "0.5s" }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${inputMode === 0 ? "neon-cyan" : inputMode === 1 ? "neon-green" : "neon-yellow"}`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setInputMode((m) => (m + 1) % 3);
            }}
            style={{
              borderRadius: "50%",
              width: 52,
              height: 52,
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={() => playSound("hover")}
          >
            {inputMode === 0 ? "A" : inputMode === 1 ? "I" : "⌨"}
          </motion.button>
        </motion.div>

        {/* Sound Toggle */}
        <motion.div
          className="droplet-right"
          style={{ position: "absolute", top: 156, right: 20, zIndex: 50, animationDelay: "0.6s" }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${soundEnabled ? "neon-orange" : "neon-gray"}`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
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
            }}
            onMouseEnter={() => {
              if (soundEnabled) playSound("hover");
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
          </motion.button>
        </motion.div>

        {/* Persona Selector (Text Mode Only) */}
        <AnimatePresence>
          {inputMode === 2 && (
            <motion.div
              className="droplet-right"
              style={{ position: "absolute", top: 20, right: 88, zIndex: 49 }}
            >
              <motion.button
                className="neon-btn neon-gray motion-gpu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPersonDrop(!showPersonDrop)}
                onMouseEnter={() => playSound("hover")}
                style={{
                  height: 52,
                  borderRadius: 26,
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(160, 160, 160, 0.08)",
                  border: "1px solid rgba(160, 160, 160, 0.40)",
                  color: "rgba(220, 220, 220, 0.90)",
                  fontFamily: "'RexBold', sans-serif",
                  fontSize: 16,
                  letterSpacing: "0.08em",
                }}
              >
                <span style={{ opacity: 0.5 }}>ID:</span> {selectedPerson}
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
                      width: 220,
                      background: "rgba(5,10,20,0.95)",
                      border: "1px solid rgba(160, 160, 160, 0.3)",
                      borderRadius: 12,
                      padding: 8,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {["AI CORE", "JARVIS", "FRIDAY", "DIRECTOR"].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedPerson(p);
                          setShowPersonDrop(false);
                          playSound("hover");
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "transparent",
                          border: "none",
                          color:
                            p === selectedPerson
                              ? "#ffffff"
                              : "rgba(160,160,160,0.7)",
                          textAlign: "left",
                          fontFamily: "'RexBold', sans-serif",
                          fontSize: 13,
                          cursor: "pointer",
                          borderRadius: 6,
                          letterSpacing: "0.05em",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(160, 160, 160, 0.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-left: neon menu */}
        <motion.div
          className="droplet-left"
          style={{ position: "absolute", top: 20, left: 20, zIndex: 50, animationDelay: "0.2s" }}
        >
          <motion.button
            className="neon-btn neon-cyan motion-gpu"
            whileHover={{ scale: 1.15, rotate: -5 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
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
              background: "rgba(0, 220, 255, 0.08)",
              border: "1px solid rgba(0, 220, 255, 0.55)",
              color: "rgba(0, 220, 255, 0.90)",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Menu"
          >
            ☰
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
            marginTop: -40,
            height: 620,
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Particle sphere */}
          <div style={{ marginBottom: 30, cursor: 'pointer' }} onClick={() => openSection("brain")}>
            <ParticleSphere size={350} />
          </div>

          {/* Glass frame — Glass Dock liquid glass style */}
          <motion.div
            ref={frameRef}
            className={`glass-frame${mounted ? ' droplet-up' : ''}`}
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
            }}
          >
            <GlassDock
              borderRadius={20}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
            <div
              className="glass-content hologram-container"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } =
                  e.currentTarget;
                // Threshold of 10px to consider "at bottom"
                isAtBottomRef.current =
                  scrollHeight - scrollTop - clientHeight < 10;
              }}
              style={{
                position: "relative",
                zIndex: 3,
                fontFamily: "'RexBold', monospace",
                fontSize: 14,
                lineHeight: 1.9,
                height: "100%",
                padding: 0,
                overflowY: "auto",
                scrollbarWidth: "none",
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
                {consoleLines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith("SYSTEM:")
                        ? "hologram-line-purple"
                        : "hologram-line-white"
                    }
                    style={{
                      opacity:
                        0.6 + (i / Math.max(1, consoleLines.length)) * 0.4,
                      position: "relative",
                    }}
                  >
                    {line}
                  </div>
                ))}
                {/* Currently typing line */}
                <div className="hologram-text" style={{ color: "#e2c0ff" }}>
                  {currentLine}
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
          </motion.div>

          <AnimatePresence mode="popLayout">
            {inputMode === 2 && (
              <motion.div
                layout
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -60, scaleY: 1.5, filter: "blur(6px)", transition: { duration: 0.3 } }}
                style={{
                  marginTop: 16,
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
                  initial={{ opacity: 0, y: -80, scaleY: 1.8, scaleX: 0.9 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1, scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22, mass: 1.2 }}
                  style={{
                    flex: 1,
                    position: "relative",
                    borderRadius: 16,
                    overflow: "hidden",
                    height: 52,
                    zIndex: 6,
                    transformOrigin: "top center",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <GlassDock
                      borderRadius={16}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ENTER QUERY..."
                    style={{
                      width: "100%",
                      height: 52,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "0 20px",
                      color: "rgba(255, 255, 255, 0.95)",
                      fontFamily: "'RexBold', sans-serif",
                      fontSize: 13,
                      letterSpacing: "0.1em",
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
                  onClick={() => playSound("click")}
                  transition={{ type: "spring", stiffness: 350, damping: 22, mass: 1.2, delay: 0.15 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "rgba(160, 160, 160, 0.08)",
                    border: "1px solid rgba(160, 160, 160, 0.4)",
                    color: "rgba(220, 220, 220, 0.9)",
                    zIndex: 5,
                    transformOrigin: "center left",
                  }}
                >
                  <span style={{ fontSize: 18, transform: "translateX(2px)" }}>
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
        <AnimatePresence mode="wait">
          {section && (
            <motion.div
              key={section}
              className="motion-gpu"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 0.5,
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              {section === "memory" && (
                <MemorySection
                  onClose={closeSection}
                  onSound={playSound}
                  language={language}
                />
              )}
              {section === "settings" && (
                <SettingsSection
                  onClose={closeSection}
                  onSound={playSound}
                  soundEnabled={soundEnabled}
                  onSoundToggle={setSoundEnabled}
                  language={language}
                  onLanguageChange={(l: "EN" | "RU" | "UK") => setLanguage(l)}
                />
              )}
              {section === "reminder" && (
                <ReminderSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "plugins" && (
                <PluginsSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "commands" && (
                <CommandsSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "addcommands" && (
                <AddCommandsSection
                  onClose={closeSection}
                  onSound={playSound}
                />
              )}
              {section === "people" && (
                <PeopleSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "brain" && (
                <Brain onClose={closeSection} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </I18nProvider>
  );
}
