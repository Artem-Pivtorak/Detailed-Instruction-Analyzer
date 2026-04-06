import { useState, useEffect, useCallback } from "react";
import { LightningOrb } from "./components/LightningOrb";
import { GlassButton } from "./components/GlassButton";
import { SidePanel } from "./components/SidePanel";
import { MemorySection } from "./sections/MemorySection";
import { SettingsSection } from "./sections/SettingsSection";
import { ReminderSection } from "./sections/ReminderSection";
import { PluginsSection } from "./sections/PluginsSection";
import { CommandsSection } from "./sections/CommandsSection";
import { AddCommandsSection } from "./sections/AddCommandsSection";
import { PeopleSection } from "./sections/PeopleSection";
import { useSound } from "./hooks/useSound";

type Section = "memory" | "settings" | "reminder" | "plugins" | "commands" | "addcommands" | "people" | null;

const CONSOLE_LINES = [
  "SYSTEM: Initializing Karotvip AI Core v2.4.1...",
  "Neural network loaded. 847 active nodes.",
  "Voice recognition module: STANDBY",
  "Memory cache allocated: 6.2 GB",
  "All subsystems nominal. Ready for commands.",
  "SYSTEM: Lorem ipsum dolor sit amet, consectetur adipiscing.",
  "Module integrity check: PASS. Uptime: 14h 22m",
];

export default function App() {
  const [section, setSection] = useState<Section>(null);
  const [sidePanel, setSidePanel] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [consoleText, setConsoleText] = useState("");
  const [consoleLineIdx, setConsoleLineIdx] = useState(0);
  const [consoleCharIdx, setConsoleCharIdx] = useState(0);
  const { play } = useSound(soundEnabled);

  const playSound = useCallback((type: string) => {
    play(type as "hover" | "click" | "open" | "close" | "toggle" | "switch");
  }, [play]);

  // Typewriter console text
  useEffect(() => {
    const line = CONSOLE_LINES[consoleLineIdx];
    if (consoleCharIdx < line.length) {
      const t = setTimeout(() => {
        setConsoleText(prev => prev + line[consoleCharIdx]);
        setConsoleCharIdx(i => i + 1);
      }, 38);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setConsoleText(prev => prev + "\n");
        setConsoleLineIdx(i => (i + 1) % CONSOLE_LINES.length);
        setConsoleCharIdx(0);
        if ((consoleLineIdx + 1) % CONSOLE_LINES.length === 0) {
          setConsoleText("");
        }
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [consoleCharIdx, consoleLineIdx]);

  function openSection(key: NonNullable<Section>) {
    playSound("open");
    setSection(key);
  }

  function closeSection() {
    setSection(null);
  }

  return (
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
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500,
        height: 400,
        background: "radial-gradient(ellipse, rgba(0,80,200,0.10) 0%, transparent 70%)",
        filter: "blur(50px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Top-right: close + glass buttons */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        display: "flex", flexDirection: "column", gap: 12,
        zIndex: 50, alignItems: "flex-end",
      }}>
        <button
          onClick={() => { playSound("close"); window.close(); }}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,60,60,0.12)",
            border: "1px solid rgba(255,60,60,0.35)",
            color: "rgba(255,255,255,0.6)", cursor: "pointer",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = "rgba(255,60,60,0.32)"); playSound("hover"); }}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,60,60,0.12)")}
        >✕</button>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GlassButton icon={<span>🔊</span>} label="Sound"
            onClick={() => playSound("click")} onHover={() => playSound("hover")} />
          <GlassButton icon={<span>🎤</span>} label="Mic"
            onClick={() => playSound("click")} onHover={() => playSound("hover")} />
          <GlassButton icon={<span>❕</span>} label="Info"
            onClick={() => playSound("click")} onHover={() => playSound("hover")} />
        </div>
      </div>

      {/* Top-left: menu + mic */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        display: "flex", gap: 12, alignItems: "center", zIndex: 50,
      }}>
        <button
          onClick={() => { setSidePanel(true); playSound("open"); }}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, padding: "8px 10px",
            cursor: "pointer", color: "rgba(255,255,255,0.7)",
            fontSize: 16, backdropFilter: "blur(10px)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = "rgba(0,180,255,0.12)"); playSound("hover"); }}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          title="Menu"
        >☰</button>
        <button
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%", width: 36, height: 36,
            cursor: "pointer", color: "rgba(255,255,255,0.45)",
            fontSize: 16, backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={() => playSound("hover")}
          title="Microphone"
        >🎙</button>
      </div>

      {/* Main layout */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}>
        {/* Electric ring orb */}
        <div style={{ marginBottom: -8 }}>
          <LightningOrb size={240} />
        </div>

        {/* Typewriter console line */}
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          color: "#00cfff",
          textShadow: "0 0 8px rgba(0,200,255,0.6)",
          letterSpacing: "0.04em",
          marginBottom: 8,
          textAlign: "left",
          maxWidth: 340,
          minHeight: 18,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}>
          {consoleText}
          <span style={{ animation: "blink-cursor 1s step-end infinite", opacity: 1 }}>█</span>
        </div>

        {/* Glass frame */}
        <div
          className="glass-blue"
          style={{
            width: 340,
            borderRadius: 16,
            padding: "18px 22px",
            boxShadow: "0 0 40px rgba(0,150,255,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.58)",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
          }}>
            {`Quis suspiendisse ultrices gravida.\nRisus commodo viverra maecenas accumsan.\n\nLorem ipsum dolor sit amet, consectetur\nadipiscing elit, sed do eiusmod tempor\nincididunt ut labore et dolore magna.`}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 12, left: 0, right: 0,
        textAlign: "center", fontSize: 11,
        color: "rgba(170,170,170,0.38)",
        fontFamily: "Arial, 'Segoe UI', sans-serif",
        letterSpacing: "0.02em", userSelect: "none", zIndex: 5,
      }}>
        Copyright © 2019-2026 Karotvip Industries Inc. All rights reserved.
      </div>

      {/* Side panel */}
      <SidePanel
        open={sidePanel}
        onClose={() => setSidePanel(false)}
        onSound={playSound}
        onOpenSection={openSection}
      />

      {/* Sections */}
      {section === "memory" && <MemorySection onClose={closeSection} onSound={playSound} />}
      {section === "settings" && (
        <SettingsSection
          onClose={closeSection}
          onSound={playSound}
          soundEnabled={soundEnabled}
          onSoundToggle={setSoundEnabled}
        />
      )}
      {section === "reminder" && <ReminderSection onClose={closeSection} onSound={playSound} />}
      {section === "plugins" && <PluginsSection onClose={closeSection} onSound={playSound} />}
      {section === "commands" && <CommandsSection onClose={closeSection} onSound={playSound} />}
      {section === "addcommands" && <AddCommandsSection onClose={closeSection} onSound={playSound} />}
      {section === "people" && <PeopleSection onClose={closeSection} onSound={playSound} />}
    </div>
  );
}
