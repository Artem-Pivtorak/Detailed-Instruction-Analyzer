import { useState, useEffect, useRef } from "react";
import { useI18n } from "../i18n";

type Mode = "ahk" | "python";

interface AddedCommand {
  id: number;
  type: Mode;
  trigger: string;
  code: string;
}

interface AddCommandsSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

function CustomDropdown({
  value,
  onChange,
  onSound,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
  onSound: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const options = [
    { label: t("addCommands.ahkExecution"), value: "ahk" as Mode },
    { label: t("addCommands.pythonExecution"), value: "python" as Mode },
  ];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 16 }}>
      <button
        onClick={() => {
          setOpen(!open);
          onSound(open ? "close" : "click");
        }}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
          border: "2px solid rgba(16,185,129,0.9)",
          borderRadius: 20,
          padding: "12px 16px",
          color: "#10b981",
          fontSize: 16,
          fontFamily: "'RexBold', sans-serif",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)",
          transition: "all 0.2s",
        }}
      >
        <span>{selectedOption?.label}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.3s",
        }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
            border: "2px solid rgba(16,185,129,0.9)",
            borderRadius: 20,
            overflow: "hidden",
            zIndex: 10,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="dropdown-menu"
        >
        <style>{`
          .dropdown-menu::-webkit-scrollbar {
            display: none;
          }
        `}</style>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                onSound("switch");
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: value === opt.value ? "rgba(16,185,129,0.2)" : "transparent",
                border: "none",
                color: value === opt.value ? "#10b981" : "rgba(255,255,255,0.7)",
                fontSize: 16,
                fontFamily: "'RexBold', sans-serif",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "rgba(16,185,129,0.05)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddCommandsSection({ onClose, onSound }: AddCommandsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("ahk");
  const [trigger, setTrigger] = useState("");
  const [code, setCode] = useState("");
  const [commands, setCommands] = useState<AddedCommand[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
      onSound("click");
    };
    reader.readAsText(file);
  }

  function addCommand() {
    if (!trigger || !code) return;
    onSound("click");
    setCommands((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: mode,
        trigger: trigger,
        code: code,
      },
    ]);
    setTrigger("");
    setCode("");
  }

  function removeCommand(id: number) {
    onSound("click");
    setCommands((prev) => prev.filter((c) => c.id !== id));
  }

  const inputStyle = {
    width: "100%",
    background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
    border: "2px solid rgba(16,185,129,0.9)",
    borderRadius: 20,
    padding: "12px 16px",
    color: "white",
    fontSize: 16,
    fontFamily: "'RexBold', sans-serif",
    outline: "none",
    marginBottom: 16,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)",
    transition: "all 0.2s",
  };

  return (
    <div
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
      <div
        className="droplet-up"
        style={{
          width: 580,
          background: "#000000",
          border: "2px solid rgba(16,185,129,0.4)",
          borderRadius: 24,
          position: "relative",
          boxShadow: "0 0 80px rgba(16,185,129,0.3), 0 0 160px rgba(16,185,129,0.15)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: visible ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 20,
            right: 12,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 28,
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div style={{ padding: "40px 40px 28px", flexShrink: 0 }}>
          <h2
            style={{
              fontFamily: "'pdark', sans-serif",
              fontSize: 32,
              fontWeight: "bold",
              color: "#10b981",
              textShadow: "0 0 20px rgba(16,185,129,0.8)",
              letterSpacing: "0.2em",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {t("module.addcommands")}
          </h2>

          <CustomDropdown value={mode} onChange={setMode} onSound={onSound} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`
          .addcommands-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
          <div style={{ marginBottom: 8, fontSize: 14, color: "rgba(16,185,129,0.7)", fontFamily: "'RexBold', sans-serif" }}>
            {t("addCommands.triggerWord")}
          </div>
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder={t("addCommands.triggerPlaceholder")}
            style={{ ...inputStyle, borderColor: "rgba(16,185,129,0.4)" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 14, color: "rgba(16,185,129,0.7)", fontFamily: "'RexBold', sans-serif" }}>
              {t("addCommands.commandCode")}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#10b981",
                fontSize: 14,
                textDecoration: "none",
                cursor: "pointer",
                fontFamily: "'RexBold', sans-serif",
              }}
            >
              {t("addCommands.uploadFile")}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept={mode === "ahk" ? ".ahk" : ".py"}
              onChange={handleFileUpload}
            />
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={mode === "ahk" ? t("addCommands.insertAhkCode") : t("addCommands.insertPythonCode")}
            style={{
              ...inputStyle,
              height: 150,
              resize: "none",
              marginBottom: 20,
            }}
          />

          <button
            onClick={addCommand}
            disabled={!trigger || !code}
            onMouseDown={(e) => {
              if (trigger && code) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
            onMouseEnter={(e) => {
              if (trigger && code) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 15px rgba(16,185,129,0.9), inset 0 0 8px rgba(16,185,129,0.5)";
            }}
            onMouseLeave={(e) => {
              if (trigger && code) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)";
            }}
            style={{
              width: "100%",
              background: trigger && code ? "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)" : "rgba(255,255,255,0.05)",
              border: `2px solid ${trigger && code ? "rgba(16,185,129,0.9)" : "rgba(255,255,255,0.3)"}`,
              borderRadius: 20,
              padding: "14px 16px",
              color: trigger && code ? "#10b981" : "rgba(255,255,255,0.3)",
              fontSize: 16,
              fontFamily: "'RexBold', sans-serif",
              fontWeight: "bold",
              cursor: trigger && code ? "pointer" : "not-allowed",
              backdropFilter: trigger && code ? "blur(10px)" : "none",
              WebkitBackdropFilter: trigger && code ? "blur(10px)" : "none",
              boxShadow: trigger && code ? "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)" : "none",
              transition: "all 0.2s",
            }}
          >
            {t("addCommands.addCommand")}
          </button>

          {commands.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  marginBottom: 12,
                  fontFamily: "'RexBold', sans-serif",
                }}
              >
                {t("addCommands.addedCommandsList")}
              </p>
              {commands.map((cmd) => (
                <div
                  key={cmd.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                    border: "2px solid rgba(16,185,129,0.6)",
                    borderRadius: 20,
                    padding: "16px 20px",
                    marginBottom: 16,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 0 10px rgba(16,185,129,0.5), inset 0 0 5px rgba(16,185,129,0.3)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
                      border: "2px solid rgba(16,185,129,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "#10b981",
                      flexShrink: 0,
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      boxShadow: "0 0 10px rgba(16,185,129,0.7), inset 0 0 5px rgba(16,185,129,0.4)",
                    }}
                  >
                    {cmd.type.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "rgba(255,255,255,0.9)",
                        fontFamily: "'RexBold', sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {cmd.trigger}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'RexBold', sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {cmd.code.substring(0, 40)}...
                    </div>
                  </div>
                  <button
                    onClick={() => removeCommand(cmd.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,80,80,0.5)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
