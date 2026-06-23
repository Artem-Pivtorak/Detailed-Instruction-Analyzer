import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleSphere } from "./components/ParticleSphere";
import { SidePanel } from "./components/SidePanel";
import { LiquidGlass } from "./components/LiquidGlass";
import { MemorySection } from "./sections/MemorySection";
import { SettingsSection } from "./sections/SettingsSection";
import { ReminderSection } from "./sections/ReminderSection";
import { PluginsSection } from "./sections/PluginsSection";
import { CommandsSection } from "./sections/CommandsSection";
import { AddCommandsSection } from "./sections/AddCommandsSection";
import { PeopleSection } from "./sections/PeopleSection";
import { useSound } from "./hooks/useSound";

type Section =
  | "memory"
  | "settings"
  | "reminder"
  | "plugins"
  | "commands"
  | "addcommands"
  | "people"
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
        minHeight: 14 // To prevent jumping layout during typing
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const { play } = useSound(soundEnabled);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  
  // Tilt animation refs (disabled - frame is static)
  const frameRef = useRef<HTMLDivElement>(null);

  const playSound = useCallback(
    (type: string) => {
      play(type as "hover" | "click" | "open" | "close" | "toggle" | "switch");
    },
    [play],
  );

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
          style={{ position: "absolute", top: 20, right: 20, zIndex: 50 }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <motion.button
            className={`neon-btn motion-gpu ${micActive ? "neon-pink" : "neon-gray"}`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            onClick={() => {
              setMicActive(!micActive);
              playSound("toggle");
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

        {/* Top-left: neon menu */}
        <motion.div 
          style={{ position: "absolute", top: 20, left: 20, zIndex: 50 }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <motion.button
            className="neon-btn neon-cyan motion-gpu"
            whileHover={{ scale: 1.15, rotate: -5 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setSidePanel(true);
              playSound("open");
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
            gap: 0,
            marginTop: -40,
          }}
        >
          {/* Particle sphere */}
          <div style={{ marginBottom: 30 }}>
            <ParticleSphere size={350} />
          </div>

          {/* Glass frame — liquid glass CSS style */}
          <motion.div
            ref={frameRef}
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0.001, opacity: 1, scale: 1 }} // 0.001 forces GPU transform to stay active
            transition={{ type: "spring", stiffness: 90, damping: 14, mass: 1.2, delay: 2.2 }}
            style={{
              width: 480,
              height: 240,
              borderRadius: 20,
              padding: 0, // Expanded to edges
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              willChange: "transform, opacity", // Hint for stacking context
            }}
          >
            <LiquidGlass
              width={480}
              height={240}
              borderRadius={20}
              style={{ zIndex: 0 }}
            />
            <div
              className="glass-content hologram-container"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                // Threshold of 10px to consider "at bottom"
                isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 10;
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
                      opacity: 0.6 + (i / Math.max(1, consoleLines.length)) * 0.4,
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
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
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
                <PluginsSection
                  onClose={closeSection}
                  onSound={playSound}
                />
              )}
              {section === "commands" && (
                <CommandsSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "addcommands" && (
                <AddCommandsSection onClose={closeSection} onSound={playSound} />
              )}
              {section === "people" && (
                <PeopleSection onClose={closeSection} onSound={playSound} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </I18nProvider>
  );
}
