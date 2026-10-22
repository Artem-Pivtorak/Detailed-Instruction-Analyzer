import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import peopleIcon from "../../../../images-icons/people.png";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  age: number;
  gender: string;
  info: string;
  role: string;
  voiceSamples: number;
  lastTraining: string;
}

interface PeopleSectionProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
}

const REQUIRED_SAMPLES = 3;
const SAMPLE_SECONDS = 5;

// ФІКС (People-секція раніше була повністю фейковою: локальний INITIAL_PEOPLE,
// видалення лише в React-стані): тепер все читається/пишеться напряму в
// users.json через window.pywebview.api (get_people/update_person/
// regenerate_person_id/delete_person/add_person, див. test.py). Головний
// ADMIN-користувач завжди тримається зверху списку (sortPeople нижче), решта —
// у порядку з бази.
function sortPeople(list: Person[]): Person[] {
  return [...list].sort((a, b) => {
    const aAdmin = a.role === "ADMIN" ? 0 : 1;
    const bAdmin = b.role === "ADMIN" ? 0 : 1;
    return aAdmin - bAdmin;
  });
}

function RegenerateIdButton({ onClick, spinning, title }: { onClick: () => void; spinning: boolean; title: string }) {
  return (
    <button
      onClick={onClick}
      disabled={spinning}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#22c55e14",
        border: "1px solid #22c55e40",
        color: "#22c55e",
        cursor: spinning ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: spinning ? "people-id-spin 0.7s linear infinite" : "none",
        }}
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
      <style>{`@keyframes people-id-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </button>
  );
}

function PersonCard({
  person,
  expanded,
  onToggleExpand,
  onSave,
  onDelete,
  onRegenerateId,
  onSound,
}: {
  person: Person;
  expanded: boolean;
  onToggleExpand: () => void;
  onSave: (id: string, fields: Partial<Person>) => Promise<string | void>;
  onDelete: (id: string) => void;
  onRegenerateId: (id: string) => Promise<void>;
  onSound: (t: string) => void;
}) {
  const { t } = useI18n();
  const isMain = person.role === "ADMIN";
  const color = isMain ? "#22c55e" : "#16a34a";
  const [draft, setDraft] = useState<Person>(person);
  const [regenerating, setRegenerating] = useState(false);
  // ФІКС ("не можна перевизначити шлях до аудіо, і спроби перенавчити за потреби"): нове
  // поле з текою аудіо + кнопка перенавчання, відокремлені від gui_retrain_person/gui_get_person_audio_path
  // в test.py. Навантажуються лише коли картка розгорнута (не потрібно тягати бекенд для всіх
  // закритих карток одразу).
  const [audioPath, setAudioPath] = useState("");
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setDraft(person);
  }, [person]);

  useEffect(() => {
    if (!expanded) return;
    const api = (window as any).pywebview?.api;
    if (!api?.get_person_audio_path) return;
    api.get_person_audio_path(person.id).then((p: string) => setAudioPath(p || "")).catch(() => {});
  }, [expanded, person.id]);

  async function handleRetrain() {
    setRetraining(true);
    setRetrainMsg(null);
    onSound("click");
    const api = (window as any).pywebview?.api;
    if (!api?.retrain_person) {
      setRetrainMsg({ ok: false, text: t("people.apiUnavailable") });
      setRetraining(false);
      return;
    }
    try {
      const res = await api.retrain_person(person.id, audioPath);
      if (res?.ok) {
        setRetrainMsg({ ok: true, text: t("people.retrained") });
      } else {
        setRetrainMsg({ ok: false, text: res?.error || t("people.createFailed") });
      }
    } catch (e: any) {
      setRetrainMsg({ ok: false, text: String(e?.message || e) });
    } finally {
      setRetraining(false);
    }
  }

  // ФІКС ("Обрати з папки"-кнопка для поля "Шлях аудіо" теж): натомість поле можна
  // заповнити і вручну (текстом), і через той самий нативний діалог, що й у формі
  // додавання нижче.
  async function pickFolder() {
    const api = (window as any).pywebview?.api;
    if (!api?.pick_folder) return;
    const folder = await api.pick_folder().catch(() => "");
    if (folder) setAudioPath(folder);
  }

  function toggleExpand() {
    onSound("open");
    onToggleExpand();
  }

  async function handleRegenerate() {
    setRegenerating(true);
    onSound("click");
    await onRegenerateId(person.id);
    setRegenerating(false);
  }

  function field(key: keyof Person, label: string, editable = true) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", width: 90, flexShrink: 0, fontFamily: "'RexBold', sans-serif" }}>
          {label}
        </span>
        {key === "id" ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", wordBreak: "break-all" }}>
              {draft.id}
            </span>
            <RegenerateIdButton onClick={handleRegenerate} spinning={regenerating} title={t("people.retrain")} />
          </div>
        ) : editable ? (
          <input
            value={String(draft[key] ?? "")}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: key === "age" ? (Number(e.target.value) || 0) as any : e.target.value }))}
            style={{
              flex: 1, background: "#22c55e0a",
              border: "1px solid #22c55e28",
              borderRadius: 6, padding: "8px 12px",
              color: "rgba(255,255,255,0.8)", fontSize: 16,
              fontFamily: "'RexBold', sans-serif",
            }}
          />
        ) : (
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "'RexBold', sans-serif" }}>
            {String(draft[key] ?? "")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: isMain ? "#22c55e0a" : "#16a34a0a",
      border: `1px solid ${isMain ? "#22c55e28" : "#16a34a28"}`,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      marginLeft: isMain ? 0 : 12,
      transition: "all 0.3s",
      boxShadow: isMain ? "0 0 20px rgba(34,197,94,0.15)" : "none",
      // ФІКС (та сама причина, що й в Memory/Reminder): список нижче — flex-колонка,
      // без flexShrink:0 картки стискаються замість того, щоб вмикати скрол.
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: `${color}22`,
          border: `2px solid ${color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
          boxShadow: `0 0 12px ${color}44`,
          overflow: "hidden",
        }}>
          <img src={peopleIcon} alt="avatar" style={{ width: "60%", height: "60%", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'RexBold', sans-serif", fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {person.firstName} {person.lastName}
          </div>
          <div style={{ fontSize: 14, color, fontFamily: "'RexBold', sans-serif" }}>
            {person.role}
          </div>
        </div>

        {!isMain && (
          <button
            onClick={() => onDelete(person.id)}
            style={{
              background: "none", border: "none", color: "rgba(255,80,80,0.5)",
              cursor: "pointer", fontSize: 20, transition: "color 0.2s",
              padding: "6px", display: "flex", alignItems: "center", justifyContent: "center"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
            title={t("common.delete")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}

        <button
          onClick={toggleExpand}
          style={{
            background: "none", border: "none", color,
            cursor: "pointer", transition: "transform 0.3s",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(34,197,94,0.1)" }}>
          {field("id", t("people.id"))}
          {field("firstName", t("people.name"))}
          {field("lastName", t("people.lastName"))}
          {field("role", t("people.status"), false)}
          {field("info", t("people.info"))}
          {field("country", t("people.country"))}
          {field("city", t("people.city"))}
          {field("gender", t("people.gender"))}
          {field("age", t("people.age"))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", width: 90, flexShrink: 0, fontFamily: "'RexBold', sans-serif" }}>
              {t("people.voice")}
            </span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'RexBold', sans-serif" }}>
              {person.voiceSamples ? t("people.voiceSamplesCount").replace("{N}", String(person.voiceSamples)) : t("people.voiceNotTrained")}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", width: 90, flexShrink: 0, fontFamily: "'RexBold', sans-serif" }}>
              {t("people.audioPath")}
            </span>
            <input
              value={audioPath}
              onChange={(e) => setAudioPath(e.target.value)}
              placeholder="D:\\..."
              style={{
                flex: 1, background: "#22c55e0a",
                border: "1px solid #22c55e28",
                borderRadius: 6, padding: "8px 12px",
                color: "rgba(255,255,255,0.8)", fontSize: 14,
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={pickFolder}
              style={{
                flexShrink: 0,
                background: "#22c55e0a",
                border: "1px solid #22c55e40",
                borderRadius: 6, padding: "8px 10px",
                color: "#22c55e", fontSize: 13,
                fontFamily: "'RexBold', sans-serif",
                cursor: "pointer",
              }}
            >
              {t("common.choose")}
            </button>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              style={{
                flexShrink: 0,
                background: "#22c55e0a",
                border: "1px solid #22c55e40",
                borderRadius: 6, padding: "8px 14px",
                color: "#22c55e", fontSize: 13,
                fontFamily: "'RexBold', sans-serif",
                cursor: retraining ? "default" : "pointer",
              }}
            >
              {retraining ? t("people.retraining") : t("people.retrain")}
            </button>
          </div>
          {retrainMsg && (
            <div style={{ marginTop: 6, marginLeft: 102, fontSize: 13, color: retrainMsg.ok ? "#22c55e" : "#f87171", fontFamily: "'RexBold', sans-serif" }}>
              {retrainMsg.text}
            </div>
          )}

          {saveError && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#f87171", fontFamily: "'RexBold', sans-serif" }}>
              {saveError}
            </div>
          )}
          <button style={{
            marginTop: 16,
            background: "#22c55e0a",
            border: "1px solid #22c55e28",
            borderRadius: 8, padding: "10px 24px",
            color: "#22c55e",
            fontSize: 16, fontFamily: "'RexBold', sans-serif",
            fontWeight: "bold", cursor: "pointer",
          }}
          onClick={async () => {
            onSound("click");
            setSaveError("");
            const { id, voiceSamples, lastTraining, ...rest } = draft;
            const err = await onSave(person.id, rest);
            if (err) setSaveError(err);
          }}
          >{t("common.save")}</button>
        </div>
      )}
    </div>
  );
}

// ФІКС (натискання "додати користувача" мало відкривати повну форму + справжнє
// тренування голосу, та мати ДВІ кнопки для аудіо): тепер є 2 незалежних способи додати
// голосові зразки — "Записати" (getUserMedia/MediaRecorder прямо в браузері, base64) і
// "Обрати з папки" (нативний діалог pick_audio_files у martin_gui.py, шляхи на диску).
// КУДИ ЗБЕРІГАЄТЬСЯ АУДІО: обидва джерела на бекенді (gui_add_person у test.py) завжди
// копіюються/конвертуються в ОДНЕ місце — власну теку нового користувача. Якщо пізніше
// знадобиться інша тека — для цього є окреме поле "Шлях аудіо" + кнопка "Перенавчити"
// в самій картці користувача (після створення).
function AddPersonModal({ onClose, onCreated, onSound }: { onClose: () => void; onCreated: () => void; onSound: (t: string) => void }) {
  const { t } = useI18n();
  const [fields, setFields] = useState({
    firstName: "", lastName: "", city: "", country: "", age: "", gender: "", info: "", role: "USER",
  });
  const [samples, setSamples] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allFieldsFilled = Object.entries(fields).every(([k, v]) => k === "role" || String(v).trim() !== "");
  const totalCount = samples.length + existingFiles.length;
  const canSubmit = allFieldsFilled && totalCount >= REQUIRED_SAMPLES && !submitting;

  async function recordSample() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = String(reader.result || "");
          setSamples((prev) => [...prev, b64]);
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setRecording(true);
      onSound("click");
      let remain = SAMPLE_SECONDS;
      setCountdown(remain);
      const tick = setInterval(() => {
        remain -= 1;
        setCountdown(remain);
        if (remain <= 0) {
          clearInterval(tick);
          recorder.stop();
          setRecording(false);
        }
      }, 1000);
    } catch (e) {
      setError(t("people.micUnavailable"));
    }
  }

  async function chooseFromFolder() {
    setError("");
    onSound("click");
    const api = (window as any).pywebview?.api;
    if (!api?.pick_audio_files) {
      setError(t("people.apiUnavailable"));
      return;
    }
    try {
      const paths: string[] = await api.pick_audio_files();
      if (Array.isArray(paths) && paths.length) {
        setExistingFiles((prev) => [...prev, ...paths]);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    onSound("click");
    const api = (window as any).pywebview?.api;
    if (!api?.add_person) {
      setError(t("people.apiUnavailable"));
      setSubmitting(false);
      return;
    }
    try {
      const payload = { ...fields, age: Number(fields.age) || 0 };
      const res = await api.add_person(payload, samples, existingFiles);
      if (res?.ok) {
        onCreated();
        onClose();
      } else {
        setError(res?.error || t("people.createFailed"));
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#22c55e0a", border: "1px solid #22c55e28",
    borderRadius: 6, padding: "8px 12px", color: "rgba(255,255,255,0.85)",
    fontSize: 15, fontFamily: "'RexBold', sans-serif", marginTop: 4,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.8)",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, maxHeight: "85vh", overflowY: "auto",
          background: "#050505", border: "2px solid rgba(34,197,94,0.4)",
          borderRadius: 20, padding: 28,
          boxShadow: "0 0 60px rgba(34,197,94,0.25)",
        }}
      >
        <h3 style={{ color: "#22c55e", fontFamily: "'RexBold', sans-serif", fontSize: 20, marginBottom: 16 }}>
          {t("people.addTitle")}
        </h3>

        {[
          ["firstName", t("people.name")], ["lastName", t("people.lastName")], ["city", t("people.city")],
          ["country", t("people.country")], ["age", t("people.age")], ["gender", t("people.gender")],
        ].map(([key, label]) => (
          <label key={key} style={{ display: "block", marginTop: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{label}</span>
            <input
              value={(fields as any)[key]}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              type={key === "age" ? "number" : "text"}
              style={inputStyle}
            />
          </label>
        ))}
        <label style={{ display: "block", marginTop: 10 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{t("people.description")}</span>
          <textarea
            value={fields.info}
            onChange={(e) => setFields((f) => ({ ...f, info: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </label>

        <div style={{ marginTop: 20 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            {t("people.audioSamples")} ({totalCount}/{REQUIRED_SAMPLES})
          </span>
          {/* ФІКС: дві незалежні кнопки — записати голосом і обрати готові файли з диска. */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={recordSample}
              disabled={recording}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 8,
                border: `1px solid ${samples.length ? "#22c55e60" : "rgba(255,255,255,0.15)"}`,
                background: samples.length ? "#22c55e1a" : "transparent",
                color: samples.length ? "#22c55e" : "rgba(255,255,255,0.6)",
                fontFamily: "'RexBold', sans-serif", fontSize: 13, cursor: recording ? "default" : "pointer",
              }}
            >
              {recording ? `${t("people.recording")} ${countdown}s` : `${t("people.record")}${samples.length ? ` (${samples.length})` : ""}`}
            </button>
            <button
              onClick={chooseFromFolder}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 8,
                border: `1px solid ${existingFiles.length ? "#22c55e60" : "rgba(255,255,255,0.15)"}`,
                background: existingFiles.length ? "#22c55e1a" : "transparent",
                color: existingFiles.length ? "#22c55e" : "rgba(255,255,255,0.6)",
                fontFamily: "'RexBold', sans-serif", fontSize: 13, cursor: "pointer",
              }}
            >
              {t("people.chooseFromFolder")}{existingFiles.length ? ` (${existingFiles.length})` : ""}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent", color: "rgba(255,255,255,0.6)", fontFamily: "'RexBold', sans-serif", cursor: "pointer",
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 8, border: "1px solid #22c55e60",
              background: canSubmit ? "#22c55e22" : "rgba(255,255,255,0.05)",
              color: canSubmit ? "#22c55e" : "rgba(255,255,255,0.3)",
              fontFamily: "'RexBold', sans-serif", fontWeight: "bold",
              cursor: canSubmit ? "pointer" : "default",
            }}
          >
            {submitting ? t("people.training") : t("people.createAndTrain")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PeopleSection({ open, onClose, onSound }: PeopleSectionProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement | null>(null);

  const fetchPeople = useCallback(() => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_people) return;
    api.get_people().then((list: Person[]) => setPeople(sortPeople(Array.isArray(list) ? list : []))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchPeople();
    const id = setInterval(fetchPeople, 6000);
    return () => clearInterval(id);
  }, [open, fetchPeople]);

  // Та сама надійна wheel-прокрутка, що й у Memory/Reminder (backdrop-filter + WebView2).
  const handleWheel = useCallback((e: { deltaY: number }) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop += e.deltaY;
  }, []);

  async function savePerson(id: string, fields: Partial<Person>): Promise<string | void> {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
    const api = (window as any).pywebview?.api;
    if (!api?.update_person) return;
    // ФІКС ("при збереженні помилка"): раніше тут був лише .catch(() => {}), будь-яка реальна
    // помилка бекенду тихо проковтувалася. Тепер реальна помилка повертається нагору і
    // показується в картці (saveError).
    try {
      const res = await api.update_person(id, fields);
      if (res && res.ok === false) {
        return res.error || t("people.notFound");
      }
    } catch (e: any) {
      return String(e?.message || e);
    }
  }

  async function regenerateId(id: string) {
    const api = (window as any).pywebview?.api;
    if (!api?.regenerate_person_id) return;
    try {
      const res = await api.regenerate_person_id(id);
      if (res?.ok && res.id) {
        setPeople((prev) => sortPeople(prev.map((p) => (p.id === id ? { ...p, id: res.id } : p))));
        setExpandedId((cur) => (cur === id ? res.id : cur));
      }
    } catch {}
  }

  function removePerson(id: string) {
    onSound("click");
    const api = (window as any).pywebview?.api;
    if (!api?.delete_person) return;
    api.delete_person(id).then((res: any) => {
      if (res?.ok) {
        setPeople((prev) => prev.filter((p) => p.id !== id));
      }
    }).catch(() => {});
  }

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(48px) saturate(150%)",
      WebkitBackdropFilter: "blur(48px) saturate(150%)",
    }}>
      <motion.div
        initial={{ width: 0, height: 0 }}
        animate={{ width: 580, height: "auto" }}
        exit={{ width: 0, height: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut", times: [0, 0.5, 1] }}
        style={{
        background: "#000000",
        border: "2px solid rgba(34,197,94,0.4)",
        borderRadius: 24,
        position: "relative",
        boxShadow: "0 0 80px rgba(34,197,94,0.3), 0 0 160px rgba(34,197,94,0.15)",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 12,
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          cursor: "pointer", fontSize: 28, zIndex: 10, lineHeight: 1,
        }}>✕</button>

        <div style={{ padding: "40px 40px 28px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <h2 style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32,
            color: "#22c55e", textShadow: "0 0 20px rgba(34,197,94,0.8)",
            letterSpacing: "0.2em",
          }}>{t("module.people")}</h2>
          <button
            onClick={() => { onSound("click"); setShowAdd(true); }}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#22c55e0a",
              border: "1px solid #22c55e28",
              color: "#22c55e", fontSize: 24, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}
          >+</button>
        </div>

        <div
          ref={listRef}
          onWheel={handleWheel}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            padding: "0 40px 40px",
          }}
        >
          {people.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              expanded={expandedId === p.id}
              onToggleExpand={() => setExpandedId((cur) => (cur === p.id ? null : p.id))}
              onSave={savePerson}
              onDelete={removePerson}
              onRegenerateId={regenerateId}
              onSound={onSound}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
      )}
      {showAdd && (
        <AddPersonModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchPeople}
          onSound={onSound}
        />
      )}
    </AnimatePresence>
  );
}
