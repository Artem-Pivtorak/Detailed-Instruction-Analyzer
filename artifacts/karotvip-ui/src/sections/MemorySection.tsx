import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface MemoryBlock {
  speaker: string;
  time: string;
  text: string;
  color: string;
  rawText: string;
}

interface MemorySectionProps {
  open: boolean;
  onClose: () => void;
  onSound: (type: string) => void;
  language?: "EN" | "RU" | "UK";
}

function MemoryBlockItem({
  block,
  idx,
  hoveredIdx,
  selectedForDelete,
  setHoveredIdx,
  setSelectedForDelete,
  handleDeleteSingleFrame,
  onSound
}: any) {
  const [expanded, setExpanded] = useState(false);
  const isLong = block.text.split('\n').length > 2 || block.text.length > 80;
  const itemRef = useRef<HTMLDivElement | null>(null);

  // ФІКС ("розгорнув, а згорнути вже не можна, бо фрейм перекритий"): коли блок
  // розгортається, його висота раптом збільшується і кнопка згортання (внизу блока)
  // може опинитися за межами видимої області списку — а без надійного гортання (див.
  // onWheel у MemorySection нижче) користувач не міг до неї догортатися. Після розгортання
  // автоматично прокручуємо блок у видиму область, щоб кнопка згортання завжди була досяжна
  // без ручного гортання.
  useEffect(() => {
    if (expanded && itemRef.current) {
      const t = setTimeout(() => {
        itemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  return (
    <div
      ref={itemRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedForDelete(selectedForDelete === idx ? null : idx);
      }}
      onMouseEnter={() => {
        setHoveredIdx(idx);
        if (selectedForDelete === null) onSound("hover");
      }}
      onMouseLeave={() => setHoveredIdx(null)}
      style={{
        background: hoveredIdx === idx ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.08)",
        border: `1px solid ${hoveredIdx === idx ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.2)"}`,
        borderRadius: 8,
        padding: 12,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: hoveredIdx === idx ? `0 0 12px rgba(249,115,22,0.25)` : "none",
        transform: hoveredIdx === idx ? "translateX(4px)" : "translateX(0)",
        position: "relative",
        overflow: "hidden",
        marginBottom: 10,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'RexBold', sans-serif",
            fontSize: 16,
            fontWeight: "bold",
            color: block.color,
            textShadow: `0 0 12px ${block.color}80`,
            letterSpacing: "0.08em",
          }}
        >
          {block.speaker}
        </div>
        {block.time && (
          <div
            style={{
              fontFamily: "'RexBold', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            {block.time}
          </div>
        )}
      </div>

      <div
        // ФІКС ("текст взагалі не видно, лише заголовки"): раніше обрізання тексту до 2 рядків
        // трималося на Tailwind-клас "line-clamp-2". Замінюю на ті ж самі CSS-властивості
        // але прямо через inline style, без будь-якої залежності від того, чи потрібний
        // utility-клас гарантовано потрапив у фінальний білд цього конкретного проєкту.
        style={{
          fontFamily: "'RexBold', sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.6,
          // Всі картки мають однакову форму завжди: зарезервовано рівно 2 рядки висоти (3.2em = 2 * 1.6 lineHeight)
          // у згорнутому стані незалежно від того, чи текст короткий (1 рядок) чи довгий (2+ рядки) - без
          // цього короткі записи робили б картки нижчими за довгі, і "однакова форма завжди" б не виконувалася.
          // У розгорнутому стані висота вільна (auto), щоб весь текст вмістився.
          height: expanded ? "auto" : "3.2em",
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? ("unset" as any) : 2,
          WebkitBoxOrient: expanded ? undefined : ("vertical" as any),
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {block.text && block.text.trim()
          ? block.text.split('\n').map((line: string, i: number) => (
             <span key={i}>
               {line}
               {i !== block.text.split('\n').length - 1 && <br />}
             </span>
            ))
          : <span style={{ color: "rgba(255,255,255,0.3)" }}>(порожній запис)</span>}
      </div>

      {/* ФІКС ("усі картки мають мати однакову форму завжди"): рядок з кнопкою
          розгортання рендериться ЗАВЖДИ (навіть для коротких записів без потреби
          розгортати), просто невидимий і неклікабельний (opacity:0, pointerEvents:none),
          коли isLong===false. Це резервує однакову висоту під усіма картками - без цього
          короткі записи були б нижчими за довгі й "однакова форма" не виконувалась би. */}
      <div
        onClick={(e) => {
          if (!isLong) return;
          e.stopPropagation();
          setExpanded(!expanded);
          onSound("click");
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 4,
          // ФІКС: раніше клікабельною була лише сама іконка (24x24) - тепер уся смуга
          // на всю ширину блока з відступами, набагато простіше влучити мишею/пальцем,
          // особливо коли треба швидко згорнути щойно розгорнутий довгий блок.
          padding: "10px 0",
          margin: "4px -12px -12px -12px",
          color: "rgba(249,115,22,0.7)",
          cursor: isLong ? "pointer" : "default",
          opacity: isLong ? 1 : 0,
          pointerEvents: isLong ? "auto" : "none",
          position: "relative",
          zIndex: 20,
        }}
      >
        {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      <AnimatePresence>
        {selectedForDelete === idx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSingleFrame(idx);
              }}
              onMouseEnter={() => onSound("hover")}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "2px solid rgba(239, 68, 68, 0.5)",
                borderRadius: "50%",
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.3)";
              }}
            >
              <Trash2 size={26} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MemorySection({
  open,
  onClose,
  onSound,
  language: _language = "EN",
}: MemorySectionProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<number | null>(null);
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement | null>(null);

  // ФІКС ("гортання фреймів немає"): у цій модалці список сидить в блоці з важким
  // backdropFilter (blur(48px)) і вкладеними AnimatePresence-анімаціями — точно та комбінація,
  // яка в цьому exe (WebView2/EdgeChromium) уже неодноразовано ламала композитинг/передачу
  // wheel-подій у інших місцях проекту (див. коментарі про backdrop-filter/Chromium в
  // App.tsx та GlassDockFollower). Звичайний native overflow-y:auto міг не отримувати wheel-події
  // в таких умовах у пакетованому exe, хоча в звичайному браузері працює. Тому вручну
  // просуваємо scrollTop за e.deltaY як надійний fallback, незалежно від того, чи спрацював браузерний native-скрол.
  const handleWheel = useCallback((e: { deltaY: number }) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop += e.deltaY;
  }, []);

  const fetchMemory = useCallback(() => {
    const api = (window as any).pywebview?.api;
    if (api?.get_memory) {
      api.get_memory().then((text: string) => {
        const blocks: MemoryBlock[] = [];
        const lines = text.split('\n');
        let currentSpeaker = '';
        let currentText = '';
        let currentRawText = '';

        const pushBlock = () => {
             if (currentSpeaker && currentText) {
                 const lowerSpeaker = currentSpeaker.toLowerCase();
                 const isMartin = lowerSpeaker.includes('мартін') || lowerSpeaker.includes('martin') || lowerSpeaker.includes('м.а.р.т.і.н.');
                 blocks.push({
                     speaker: currentSpeaker,
                     time: pendingTime,
                     text: currentText.trim(),
                     color: isMartin ? '#00cfff' : '#f97316',
                     rawText: currentRawText
                 });
             } else if (blocks.length > 0 && currentRawText) {
                 // Append leftover unowned raw text (like trailing newlines) to the last block
                 blocks[blocks.length - 1].rawText += currentRawText;
             }
             currentSpeaker = '';
             currentText = '';
             currentRawText = '';
        };

        // ФІКС ("у заголовку лише ім'я, а часу немає, текст губиться між заголовками"): рядок
        // з датою/часом ("YYYY-MM-DD HH:MM:SS") раніше повністю пропускався при рендері й ніде не
        // прикріплювався до блоку — тому картки "Користувач"/"М.А.Р.Т.І.Н." показували тільки ім'я
        // без часу. Тепер запам'ятовуємо час з останнього побаченого timestamp-рядка (pendingTime)
        // і проставляємо його в КОЖЕН наступний блок розмови (Користувач і М.А.Р.Т.І.Н. йдуть одразу
        // після одного спільного timestamp-рядка у файлі).
        let pendingTime = '';

        // ФІКС ("в інтерфейсі лише 2 записи, інші зникають"): memory.txt пишуть ДВІ незалежні
        // системи на бекенді: save_to_memory() у test.py (формат "YYYY-MM-DD HH:MM:SS\nКористувач:...\nМ.А.Р.Т.І.Н.:...")
        // та memory_logger.py (формат "[HH:MM] команда → результат" — лог виконаних дій: музика/програми/
        // нагадування тощо, див. log_action() у memory_logger.py). Раніше парсер розумів ЛИШЕ перший
        // формат — рядки другого не матчились жодним патерном і тихо губилися/прилиплювалися
        // до сусіднього блоку як "непризначений" rawText — тому багато реальних записів файлу ніколи не з'являлися
        // як окремі блоки. Тепер розпізнаємо і рендеримо ОБИДВА формати.
        const ACTION_LOG_RE = /^\[(\d{2}:\d{2})\]\s+(.+?)\s+\u2192\s+(.*)$/;
        const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} (\d{2}:\d{2}):\d{2}$/;
        // ФІКС ("користувач: запит: ... Дія: ви: ..., MARTIN: ... - і це в одному фреймі"):
        // save_to_memory() у test.py записує репліку користувача з технічним префіксом
        // "ЗАПИТ:" (напр. "Користувач: ЗАПИТ: привіт як справи") - цей префікс не несе
        // жодного сенсу для читача картки, тому прибираємо його при відображенні.
        const REQUEST_PREFIX_RE = /^ЗАПИТ\s*:\s*/i;
        const stripRequestPrefix = (s: string) => s.replace(REQUEST_PREFIX_RE, '').trim();

        for (const line of lines) {
            const actionMatch = line.match(ACTION_LOG_RE);
            if (actionMatch) {
                // ФІКС ("не потрібно писати Дія і в ньому по декілька діалогів, а розділяти
                // кожен на свій фрейм"): раніше команда й відповідь у форматі
                // "[HH:MM] команда → результат" пакувались в ОДИН блок з написом "Дія" та
                // двома репліками всередині ("Ви: ...\nМ.А.Р.Т.І.Н.: ..."). Тепер, так само
                // як і для timestamp-формату вище, кожна репліка - окремий, самостійний фрейм зі
                // своєю шапкою (ім'я + час), без жодного зайвого лейбла "Дія"/"ЗАПИТ".
                pushBlock();
                blocks.push({
                    speaker: 'Користувач',
                    time: actionMatch[1],
                    text: stripRequestPrefix(actionMatch[2].trim()),
                    color: '#f97316',
                    rawText: line + '\n',
                });
                blocks.push({
                    speaker: 'М.А.Р.Т.І.Н.',
                    time: actionMatch[1],
                    text: actionMatch[3].trim(),
                    color: '#00cfff',
                    rawText: '',
                });
                continue;
            }
            const speakerMatch = line.match(/^([^:]+):\s*(.*)$/);
            const timestampMatch = line.match(TIMESTAMP_RE);
            if (timestampMatch) {
                 if (currentSpeaker) {
                     pushBlock();
                 }
                 pendingTime = timestampMatch[1];
                 currentRawText += line + '\n';
                 continue; // skip rendering the raw timestamp line itself in UI - час іде в шапку блоку
            }
            if (speakerMatch && ['користувач', 'мартін', 'martin', 'м.а.р.т.і.н.', 'user'].some(k => speakerMatch[1].toLowerCase().includes(k))) {
                 pushBlock();
                 currentSpeaker = speakerMatch[1].trim();
                 currentText = stripRequestPrefix(speakerMatch[2]);
                 currentRawText = line + '\n';
            } else if (line.trim() !== '') {
                 if (currentSpeaker) {
                      currentText += '\n' + line;
                      currentRawText += line + '\n';
                 } else {
                      currentRawText += line + '\n';
                 }
            } else {
                 currentRawText += line + '\n';
            }
        }
        pushBlock();
        setMemoryBlocks(blocks);
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMemory();
    } else {
      setSelectedForDelete(null);
    }
  }, [open, fetchMemory]);

  useEffect(() => {
    (window as any).__martinMemoryChanged = () => {
      if (open) setTimeout(fetchMemory, 150);
    };
    return () => {
      delete (window as any).__martinMemoryChanged;
    };
  }, [open, fetchMemory]);

  function handleDelete() {
    onSound("click");
    const api = (window as any).pywebview?.api;
    if (api?.clear_memory) {
      api.clear_memory().then(() => {
        setMemoryBlocks([]);
      });
    }
  }

  function handleUnload() {
    onSound("switch");
    const api = (window as any).pywebview?.api;
    if (api?.export_memory) {
      api.export_memory();
    }
  }

  function handleDeleteSingleFrame(idx: number) {
    onSound("click");
    const newBlocks = memoryBlocks.filter((_, i) => i !== idx);
    const newRawText = newBlocks.map(b => b.rawText).join("");
    const api = (window as any).pywebview?.api;
    if (api?.update_memory) {
      api.update_memory(newRawText).then(() => {
        setMemoryBlocks(newBlocks);
        setSelectedForDelete(null);
      });
    } else {
        setMemoryBlocks(newBlocks);
        setSelectedForDelete(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSelectedForDelete(null)}
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
      <motion.div
        initial={{ width: 0, height: 0 }}
        animate={{ width: 580, height: "70vh" }}
        exit={{ width: 0, height: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut", times: [0, 0.5, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#000000",
          border: "none",
          borderRadius: 24,
          padding: 40,
          position: "relative",
          boxShadow: "0 0 80px rgba(249,115,22,0.3), 0 0 160px rgba(249,115,22,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 12,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <h2
          style={{
            fontFamily: "'pdark', sans-serif",
            fontSize: 32,
            fontWeight: "bold",
            color: "#f97316",
            textShadow: "0 0 20px rgba(249,115,22,0.8)",
            letterSpacing: "0.2em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          {t("module.memory")}
        </h2>

        <div
          ref={listRef}
          onClick={() => setSelectedForDelete(null)}
          onWheel={handleWheel}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            marginBottom: 20,
            paddingRight: 8,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {memoryBlocks.map((block, idx) => (
            <MemoryBlockItem 
                key={idx} 
                block={block} 
                idx={idx} 
                hoveredIdx={hoveredIdx} 
                selectedForDelete={selectedForDelete}
                setHoveredIdx={setHoveredIdx}
                setSelectedForDelete={setSelectedForDelete}
                handleDeleteSingleFrame={handleDeleteSingleFrame}
                onSound={onSound}
            />
          ))}
          {memoryBlocks.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
              {t("memory.empty")}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto" }}>
          <button
            onClick={handleDelete}
            onMouseEnter={() => onSound("hover")}
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              borderRadius: 10,
              color: "#ef4444",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("common.delete")}
          </button>

          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(249,115,22,0.12)",
              border: "2px solid rgba(249,115,22,0.4)",
              borderRadius: 10,
              textAlign: "center",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16,
              fontWeight: "bold",
              color: "#f97316",
              textShadow: "0 0 12px rgba(249,115,22,0.6)",
              letterSpacing: "0.08em",
            }}
          >
            {memoryBlocks.length} pcs FULL
          </div>

          <button
            onClick={handleUnload}
            onMouseEnter={() => onSound("hover")}
            style={{
              flex: 1,
              padding: "16px 20px",
              background: "rgba(249,115,22,0.2)",
              border: "2px solid rgba(249,115,22,0.5)",
              borderRadius: 10,
              color: "#f97316",
              fontFamily: "'RexBold', sans-serif",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(249,115,22,0.3)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(249,115,22,0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(249,115,22,0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("memory.unload")}
          </button>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
