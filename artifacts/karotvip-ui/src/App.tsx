import { useState, useEffect, useCallback } from "react";
import { ParticleSphere } from "./components/ParticleSphere";
import { SidePanel } from "./components/SidePanel";
import { MemorySection } from "./sections/MemorySection";
import { SettingsSection } from "./sections/SettingsSection";
import { ReminderSection } from "./sections/ReminderSection";
import { PluginsSection } from "./sections/PluginsSection";
import { CommandsSection } from "./sections/CommandsSection";
import { AddCommandsSection } from "./sections/AddCommandsSection";
import { PeopleSection } from "./sections/PeopleSection";
import { KrakenSection } from "./sections/KrakenSection";
import { WorldMapSection } from "./sections/WorldMapSection";
import { useSound } from "./hooks/useSound";

type Section =
  | "memory"
  | "settings"
  | "reminder"
  | "plugins"
  | "commands"
  | "addcommands"
  | "people"
  | "kraken"
  | "worldmap"
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
        fontFamily: "Arial, 'Segoe UI', sans-serif",
        letterSpacing: "0.02em",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      {t("footer")}
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
        setConsoleLines((prev) => {
          const next = [...prev, line];
          // Keep max 8 lines visible
          return next.length > 8 ? next.slice(next.length - 8) : next;
        });
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
          fontFamily: "'Segoe UI', Arial, sans-serif",
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
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 50 }}>
          <button
            className={`neon-btn ${micActive ? "neon-pink" : "neon-gray"}`}
            onClick={() => {
              setMicActive(!micActive);
              playSound("toggle");
            }}
            style={{
              borderRadius: "50%",
              width: 38,
              height: 38,
              fontSize: 17,
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Microphone"
          >
            🎙
          </button>
        </div>

        {/* Top-left: neon menu */}
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 50 }}>
          <button
            className="neon-btn neon-cyan"
            onClick={() => {
              setSidePanel(true);
              playSound("open");
            }}
            style={{
              borderRadius: 9,
              padding: "8px 12px",
              fontSize: 17,
              backdropFilter: "blur(12px)",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={() => playSound("hover")}
            title="Menu"
          >
            ☰
          </button>
        </div>

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
          <div style={{ marginBottom: 22 }}>
            <ParticleSphere size={270} />
          </div>

          {/* Glass frame — static shape, contains the live typewriter text */}
          <div
            className="glass-blue"
            style={{
              width: 340,
              height: 178,
              borderRadius: 16,
              padding: "14px 18px",
              boxShadow:
                "0 0 40px rgba(120,0,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Subtle inner glow at top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "10%",
                right: "10%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(180,80,255,0.4), transparent)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.8,
              }}
            >
              {/* Committed lines */}
              {consoleLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: line.startsWith("SYSTEM:")
                      ? "#c084fc"
                      : "rgba(255,255,255,0.55)",
                    opacity: 0.6 + (i / consoleLines.length) * 0.4,
                  }}
                >
                  {line}
                </div>
              ))}
              {/* Currently typing line */}
              <div style={{ color: "#e2c0ff" }}>
                {currentLine}
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 12,
                    background: "#c084fc",
                    marginLeft: 1,
                    verticalAlign: "middle",
                    opacity: 1,
                    animation: "blink-cursor 0.9s step-end infinite",
                  }}
                />
              </div>
            </div>
          </div>
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

        {/* Sections */}
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
            onOpenWorldMap={() => setSection("worldmap")}
          />
        )}
        {section === "worldmap" && (
          <WorldMapSection onClose={closeSection} onSound={playSound} />
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
        {section === "kraken" && (
          <KrakenSection onClose={closeSection} onSound={playSound} />
        )}
      </div>
    </I18nProvider>
  );
}
