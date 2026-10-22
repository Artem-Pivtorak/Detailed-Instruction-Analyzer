import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";

// Розділ «Дані та приватність» в налаштуваннях: чотири кнопки безповоротного видалення.
// Кожна відкриває модальне вікно з паролем адміністратора і викликає
// window.pywebview.api.wipe_data(kind, password) → gui_wipe_data() у test.py → data_wipe.py.

type WipeKind = "users" | "databases" | "local" | "secrets";

type WipeResult = { ok: boolean; done: string[]; errors: string[] };

const FONT = "'RexBold', sans-serif";
const DANGER = "#f87171";

export function DataPrivacyPanel({ onSound }: { onSound: (name: string) => void }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<WipeKind | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WipeResult | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const items: { kind: WipeKind; label: string; hint: string }[] = [
    { kind: "users", label: t("wipe.users"), hint: t("wipe.usersHint") },
    { kind: "databases", label: t("wipe.databases"), hint: t("wipe.databasesHint") },
    { kind: "local", label: t("wipe.local"), hint: t("wipe.localHint") },
    { kind: "secrets", label: t("wipe.secrets"), hint: t("wipe.secretsHint") },
  ];
  const current = items.find((i) => i.kind === kind) || null;

  function close() {
    if (busy) return;
    setKind(null);
    setPassword("");
    setError("");
    setResult(null);
  }

  async function run() {
    if (!kind || !password || busy) return;
    const api = (window as any).pywebview?.api;
    if (!api?.wipe_data) {
      setError(t("settings.saveError"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.wipe_data(kind, password);
      if (Array.isArray(res?.done)) {
        // видалення виконано (повністю або з помилками) — показуємо звіт
        setResult({ ok: !!res.ok, done: res.done, errors: res.errors || [] });
        setPassword("");
      } else {
        // не виконано: неправильний пароль, бекенд не готовий тощо
        setError(res?.error || t("persona.errorWrongPassword"));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function closePw() {
    if (pwBusy) return;
    setPwOpen(false);
    setOldPw("");
    setNewPw("");
    setNewPw2("");
    setPwError("");
    setPwDone(false);
  }

  async function savePassword() {
    if (pwBusy || !oldPw || !newPw) return;
    if (newPw !== newPw2) {
      setPwError(t("pw.mismatch"));
      return;
    }
    const api = (window as any).pywebview?.api;
    if (!api?.change_admin_password) {
      setPwError(t("settings.saveError"));
      return;
    }
    setPwBusy(true);
    setPwError("");
    try {
      const res = await api.change_admin_password(oldPw, newPw);
      if (res?.ok) {
        setPwDone(true);
        setOldPw("");
        setNewPw("");
        setNewPw2("");
      } else {
        setPwError(res?.error || t("persona.errorWrongPassword"));
      }
    } catch (e) {
      setPwError(String(e));
    } finally {
      setPwBusy(false);
    }
  }

  const pwInputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(168, 85, 247, 0.6)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT,
    outline: "none",
    marginBottom: 10,
  } as const;

  const headerStyle = {
    fontSize: 16,
    color: DANGER,
    letterSpacing: "0.15em",
    fontFamily: FONT,
    marginBottom: 8,
    marginTop: 4,
  } as const;

  return (
    <>
      <p style={headerStyle}>{t("wipe.title")}</p>
      {items.map((it) => (
        <div
          key={it.kind}
          onClick={() => {
            onSound("click-4");
            setKind(it.kind);
          }}
          onMouseEnter={() => onSound("hover")}
          style={{
            background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
            border: "2px solid rgba(248, 113, 113, 0.75)",
            borderRadius: 20,
            padding: "12px 20px",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 0 10px rgba(248, 113, 113, 0.45), inset 0 0 5px rgba(248, 113, 113, 0.25)",
            cursor: "pointer",
            marginBottom: 10,
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", fontFamily: FONT }}>{it.label}</div>
          <div style={{ fontSize: 11, marginTop: 3, color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>{it.hint}</div>
        </div>
      ))}

      <div
        onClick={() => {
          onSound("click-4");
          setPwOpen(true);
        }}
        onMouseEnter={() => onSound("hover")}
        style={{
          background: "linear-gradient(135deg, rgba(10, 10, 20, 0.4) 0%, rgba(30, 30, 50, 0.1) 100%)",
          border: "2px solid rgba(168, 85, 247, 0.75)",
          borderRadius: 20,
          padding: "12px 20px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 0 10px rgba(168, 85, 247, 0.45), inset 0 0 5px rgba(168, 85, 247, 0.25)",
          cursor: "pointer",
          marginBottom: 10,
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", fontFamily: FONT }}>{t("pw.title")}</div>
        <div style={{ fontSize: 11, marginTop: 3, color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>{t("pw.hint")}</div>
      </div>

      {pwOpen && (
        <div
          onClick={closePw}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "rgba(14, 10, 24, 0.96)",
              border: "2px solid rgba(168, 85, 247, 0.85)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 0 24px rgba(168, 85, 247, 0.5)",
              fontFamily: FONT,
            }}
          >
            <div style={{ fontSize: 18, color: "#c084fc", marginBottom: 14 }}>{t("pw.title")}</div>
            {!pwDone ? (
              <>
                <input
                  type="password"
                  autoFocus
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  placeholder={t("pw.old")}
                  style={pwInputStyle}
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder={t("pw.new")}
                  style={pwInputStyle}
                />
                <input
                  type="password"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePassword();
                    if (e.key === "Escape") closePw();
                  }}
                  placeholder={t("pw.repeat")}
                  style={pwInputStyle}
                />
                {pwError && <div style={{ fontSize: 12, color: DANGER, marginBottom: 8 }}>{pwError}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button
                    onClick={closePw}
                    disabled={pwBusy}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 12,
                      padding: "10px 0",
                      color: "rgba(255,255,255,0.8)",
                      fontFamily: FONT,
                      fontSize: 14,
                      cursor: pwBusy ? "default" : "pointer",
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={savePassword}
                    disabled={pwBusy || !oldPw || !newPw}
                    style={{
                      flex: 1,
                      background: "rgba(168, 85, 247, 0.18)",
                      border: "1px solid rgba(168, 85, 247, 0.85)",
                      borderRadius: 12,
                      padding: "10px 0",
                      color: "#c084fc",
                      fontFamily: FONT,
                      fontSize: 14,
                      cursor: pwBusy || !oldPw || !newPw ? "default" : "pointer",
                      opacity: pwBusy || !oldPw || !newPw ? 0.5 : 1,
                    }}
                  >
                    {t("pw.save")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, color: "#4ade80", marginBottom: 14 }}>{`\u2713 ${t("pw.saved")}`}</div>
                <button
                  onClick={closePw}
                  style={{
                    width: "100%",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.6)",
                    borderRadius: 12,
                    padding: "10px 0",
                    color: "#c084fc",
                    fontFamily: FONT,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {t("wipe.close")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {kind && (
          <motion.div
            key="wipe-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 380,
                maxWidth: "90vw",
                maxHeight: "85vh",
                overflowY: "auto",
                background: "rgba(14, 10, 24, 0.96)",
                border: "2px solid rgba(248, 113, 113, 0.85)",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 0 24px rgba(248, 113, 113, 0.5)",
                fontFamily: FONT,
              }}
            >
              <div style={{ fontSize: 18, color: DANGER, marginBottom: 8 }}>{current?.label}</div>

              {!result && (
                <>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12, lineHeight: 1.4 }}>
                    {current?.hint}
                    <br />
                    {t("wipe.warning")}
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") run();
                      if (e.key === "Escape") close();
                    }}
                    placeholder={t("persona.adminPassword")}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(248, 113, 113, 0.6)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      color: "#fff",
                      fontSize: 14,
                      fontFamily: FONT,
                      outline: "none",
                    }}
                  />
                  {error && <div style={{ fontSize: 12, color: DANGER, marginTop: 8 }}>{error}</div>}
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button
                      onClick={close}
                      disabled={busy}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 12,
                        padding: "10px 0",
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: FONT,
                        fontSize: 14,
                        cursor: busy ? "default" : "pointer",
                      }}
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={run}
                      disabled={busy || !password}
                      style={{
                        flex: 1,
                        background: "rgba(248, 113, 113, 0.18)",
                        border: "1px solid rgba(248, 113, 113, 0.85)",
                        borderRadius: 12,
                        padding: "10px 0",
                        color: DANGER,
                        fontFamily: FONT,
                        fontSize: 14,
                        cursor: busy || !password ? "default" : "pointer",
                        opacity: busy || !password ? 0.5 : 1,
                      }}
                    >
                      {busy ? t("wipe.working") : t("wipe.confirm")}
                    </button>
                  </div>
                </>
              )}

              {result && (
                <>
                  <div style={{ fontSize: 14, color: result.ok ? "#4ade80" : "#fbbf24", marginBottom: 8 }}>
                    {result.ok ? `\u2713 ${t("wipe.success")}` : `\u26A0 ${t("wipe.partial")}`}
                  </div>
                  {result.done.map((line, i) => (
                    <div key={`d${i}`} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>
                      {line}
                    </div>
                  ))}
                  {result.errors.map((line, i) => (
                    <div key={`e${i}`} style={{ fontSize: 11, color: DANGER, marginBottom: 3 }}>
                      {line}
                    </div>
                  ))}
                  {(kind === "secrets" || kind === "databases") && (
                    <div style={{ fontSize: 11, marginTop: 8, color: "rgba(192,132,252,0.8)" }}>
                      {t("settings.restartRequired")}
                    </div>
                  )}
                  <button
                    onClick={close}
                    style={{
                      width: "100%",
                      marginTop: 16,
                      background: "rgba(168, 85, 247, 0.15)",
                      border: "1px solid rgba(168, 85, 247, 0.6)",
                      borderRadius: 12,
                      padding: "10px 0",
                      color: "#c084fc",
                      fontFamily: FONT,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {t("wipe.close")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
