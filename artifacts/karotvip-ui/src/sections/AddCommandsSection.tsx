import { useState, useEffect } from "react";

type Mode = "open_program" | "add_protocol";

interface AddedCommand {
  id: number;
  type: "program" | "protocol";
  name: string;
  detail: string;
}

interface AddCommandsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

export function AddCommandsSection({ onClose, onSound }: AddCommandsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("open_program");
  const [programName, setProgramName] = useState("");
  const [programPath, setProgramPath] = useState("");
  const [protocolName, setProtocolName] = useState("");
  const [youtubeVideo, setYoutubeVideo] = useState(false);
  const [selectedApp, setSelectedApp] = useState("Chrome");
  const [commands, setCommands] = useState<AddedCommand[]>([]);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function addCommand() {
    onSound("click");
    if (mode === "open_program") {
      if (!programName && !programPath) return;
      setCommands(prev => [...prev, {
        id: Date.now(),
        type: "program",
        name: programName || "Unnamed",
        detail: programPath || "(no path)",
      }]);
      setProgramName(""); setProgramPath("");
    } else {
      setCommands(prev => [...prev, {
        id: Date.now(),
        type: "protocol",
        name: protocolName || "Unnamed Protocol",
        detail: `${selectedApp}${youtubeVideo ? " + YouTube" : ""}`,
      }]);
      setProtocolName(""); setYoutubeVideo(false);
    }
  }

  function removeCommand(id: number) {
    onSound("click");
    setCommands(prev => prev.filter(c => c.id !== id));
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "'Courier New', monospace",
    outline: "none",
    marginBottom: 10,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: 380,
        background: "rgba(5,12,20,0.94)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: 16,
        position: "relative",
        boxShadow: "0 0 60px rgba(16,185,129,0.2), 0 0 120px rgba(16,185,129,0.08)",
        backdropFilter: "blur(24px)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 18, zIndex: 2,
        }}>✕</button>

        <div style={{ padding: "24px 28px 16px", textAlign: "center", flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: "bold",
            color: "#10b981", textShadow: "0 0 20px rgba(16,185,129,0.8)",
            letterSpacing: "0.15em", marginBottom: 16,
          }}>ADD COMMANDS</h2>

          {/* Mode selector */}
          <select
            value={mode}
            onChange={e => { setMode(e.target.value as Mode); onSound("toggle"); }}
            style={{
              width: "100%",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#10b981",
              fontSize: 12,
              fontFamily: "'Courier New', monospace",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="open_program">Відкрити програму</option>
            <option value="add_protocol">Додати протокол</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px" }}>
          {mode === "open_program" ? (
            <>
              <input
                value={programName}
                onChange={e => setProgramName(e.target.value)}
                placeholder="Ім'я програми..."
                style={inputStyle}
              />
              <input
                value={programPath}
                onChange={e => setProgramPath(e.target.value)}
                placeholder="Шлях до програми..."
                style={inputStyle}
              />
            </>
          ) : (
            <>
              <select
                value={selectedApp}
                onChange={e => setSelectedApp(e.target.value)}
                style={{ ...inputStyle, color: "#10b981" }}
              >
                {["Chrome", "Firefox", "VLC", "Spotify", "VSCode"].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={youtubeVideo}
                  onChange={e => setYoutubeVideo(e.target.checked)}
                  style={{ accentColor: "#10b981" }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'Courier New', monospace" }}>
                  Відкрити відео на YouTube
                </span>
              </div>
              <input
                value={protocolName}
                onChange={e => setProtocolName(e.target.value)}
                placeholder="Назва протоколу..."
                style={inputStyle}
              />
            </>
          )}

          <button
            onClick={addCommand}
            style={{
              width: "100%",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 8, padding: "10px",
              color: "#10b981",
              fontSize: 13, fontFamily: "'Courier New', monospace",
              fontWeight: "bold", cursor: "pointer",
              marginBottom: 16,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(16,185,129,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(16,185,129,0.15)")}
          >
            Додати
          </button>

          {commands.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>
                ADDED COMMANDS
              </p>
              {commands.map(cmd => (
                <div key={cmd.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: "bold", color: "#10b981", fontFamily: "'Courier New', monospace" }}>{cmd.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{cmd.detail}</div>
                  </div>
                  <button
                    onClick={() => removeCommand(cmd.id)}
                    style={{ background: "none", border: "none", color: "rgba(255,80,80,0.5)", cursor: "pointer", fontSize: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
