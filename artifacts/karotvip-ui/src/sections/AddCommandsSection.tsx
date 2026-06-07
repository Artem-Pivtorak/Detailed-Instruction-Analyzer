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
    { label: "Виконання AHK", value: "ahk" as Mode },
    { label: "Виконання Python коду", value: "python" as Mode },
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
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "#10b981",
          fontSize: 13,
          fontFamily: "'Courier New', monospace",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{selectedOption?.label}</span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: 10,
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "rgba(5,20,15,0.98)",
            border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
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
                padding: "10px 14px",
                background: value === opt.value ? "rgba(16,185,129,0.15)" : "transparent",
                border: "none",
                color: value === opt.value ? "#10b981" : "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontFamily: "'Courier New', monospace",
                textAlign: "left",
                cursor: "pointer",
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
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "white",
    fontSize: 12,
    fontFamily: "'Courier New', monospace",
    outline: "none",
    marginBottom: 12,
    transition: "border-color 0.2s",
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
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: 420,
          background: "rgba(5,12,20,0.96)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 16,
          position: "relative",
          boxShadow: "0 0 60px rgba(16,185,129,0.25)",
          backdropFilter: "blur(24px)",
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
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: 18,
            zIndex: 2,
          }}
        >
          ✕
        </button>

        <div style={{ padding: "28px 28px 12px", flexShrink: 0 }}>
          <h2
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 22,
              fontWeight: "bold",
              color: "#10b981",
              textShadow: "0 0 20px rgba(16,185,129,0.8)",
              letterSpacing: "0.1em",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {t("module.addcommands")}
          </h2>

          <CustomDropdown value={mode} onChange={setMode} onSound={onSound} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 28px" }}>
          <div style={{ marginBottom: 4, fontSize: 11, color: "rgba(16,185,129,0.7)", fontFamily: "'Courier New', monospace" }}>
            ТРИГЕРНЕ СЛОВО:
          </div>
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Наприклад: відкрити браузер..."
            style={{ ...inputStyle, borderColor: "rgba(16,185,129,0.4)" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: "rgba(16,185,129,0.7)", fontFamily: "'Courier New', monospace" }}>
              КОД КОМАНДИ:
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#10b981",
                fontSize: 10,
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
              }}
            >
              Завантажити файл
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
            placeholder={`Вставте ${mode === "ahk" ? "AHK" : "Python"} код сюди...`}
            style={{
              ...inputStyle,
              height: 120,
              resize: "none",
              marginBottom: 16,
              background: "rgba(16,185,129,0.03)",
            }}
          />

          <button
            onClick={addCommand}
            disabled={!trigger || !code}
            style={{
              width: "100%",
              background: trigger && code ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${trigger && code ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8,
              padding: "12px",
              color: trigger && code ? "#10b981" : "rgba(255,255,255,0.2)",
              fontSize: 13,
              fontFamily: "'Courier New', monospace",
              fontWeight: "bold",
              cursor: trigger && code ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            ДОДАТИ КОМАНДУ
          </button>

          {commands.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  marginBottom: 12,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                СПИСОК ДОДАНИХ КОМАНД:
              </p>
              {commands.map((cmd) => (
                <div
                  key={cmd.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(16,185,129,0.04)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: "rgba(16,185,129,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: "bold",
                      color: "#10b981",
                      flexShrink: 0,
                    }}
                  >
                    {cmd.type.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "rgba(255,255,255,0.9)",
                        fontFamily: "'Courier New', monospace",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {cmd.trigger}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'Courier New', monospace",
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
                      fontSize: 16,
                      padding: "4px",
                    }}
                  >
                    ✕
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
