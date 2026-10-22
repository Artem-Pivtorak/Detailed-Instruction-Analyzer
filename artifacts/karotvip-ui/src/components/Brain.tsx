import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import { GlassDock } from "./GlassDock";

interface BrainProps {
  open: boolean;
  onClose?: () => void;
  onSound?: (type: string) => void;
}

// ФІКС ("розібратись в системі мозку і повністю переробити зв'язок з обсидіаном на brain в
// інтерфейсі"): раніше ВЕСЬ граф (3 групи "Users/M.A.R.T.I.N./System", назви й тексти нейронів)
// генерувався ВИПАДКОВО (Math.random) при кожному відкритті — жодного зв'язку з реальними
// даними. Тепер групи/підгрупи/нейрони приходять з РЕАЛЬНОГО SQLite-"мозку" (martin_brain.py,
// той самий, що дає контекст LLM) і з тих самих джерел, що й секції People/Memory, через
// window.pywebview.api.get_brain_data() (див. gui_get_brain_data у test.py) — шість блоків:
// журнал дій / факти з розмов (memory_facts) / проєкти / музика / люди (те саме, що People) /
// пам'ять розмов (те саме, що Memory, memory.txt) — БЕЗ персоналізації самого асистента
// (user_profile — ім'я/вік/хобі — свідомо виключено на бекенді). Кожна ГРУПА має власний колір
// (як в старому декоративному варіанті), ПІДГРУПИ — за category/status/датою/роллю всередині
// таблиці, і рівно стільки НЕЙРОНІВ, скільки реальних записів — без жодного вигаданого
// доповнення.
interface BrainNeuron {
  title: string;
  info: string;
}
interface BrainSubgroup {
  key: string;
  label: string;
  neurons: BrainNeuron[];
}
interface BrainGroupData {
  key: string;
  label: string;
  color: string; // "R, G, B"
  subgroups: BrainSubgroup[];
}

function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(",").map((n) => parseInt(n.trim(), 10) || 0);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function Brain({ open, onClose, onSound }: BrainProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeSubgroup, setActiveSubgroup] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);

  // Реальні дані з бекенду — завантажуються при кожному відкритті секції (не поллінг,
  // мозок не змінюється настільки швидко, щоб це було потрібно постійно; свіжі дані
  // користувач отримує щоразу відкриваючи Brain заново).
  const [brainGroups, setBrainGroups] = useState<BrainGroupData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBrainData = useCallback(() => {
    const api = (window as any).pywebview?.api;
    if (!api?.get_brain_data) return;
    setLoading(true);
    api
      .get_brain_data()
      .then((data: any) => {
        setBrainGroups(Array.isArray(data?.groups) ? data.groups : []);
      })
      .catch(() => setBrainGroups([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchBrainData();
  }, [open, fetchBrainData]);

  // Кнопка "Очистити всю пам'ять" — модалка з паролем (той самий TEXT_MODE_PASSWORD, що й для
  // ADMIN у текстовому режимі), яка викликає window.pywebview.api.clear_brain(password). Бекенд
  // (gui_clear_brain у test.py) чистить SQLite-мозок, КРІМ memory_facts/memory.txt/users.json —
  // ці керуються тільки через власні секції Memory/People, ця кнопка їх не займає.
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  const [clearSubmitting, setClearSubmitting] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearDone, setClearDone] = useState(false);

  function closeClearModal() {
    setShowClearModal(false);
    setClearPassword("");
    setClearError("");
    setClearSubmitting(false);
    setClearDone(false);
  }

  async function handleClearBrain() {
    setClearSubmitting(true);
    setClearError("");
    const api = (window as any).pywebview?.api;
    if (!api?.clear_brain) {
      setClearError(t("people.apiUnavailable"));
      setClearSubmitting(false);
      return;
    }
    try {
      const res = await api.clear_brain(clearPassword);
      if (res?.ok) {
        setClearDone(true);
        setClearPassword("");
        fetchBrainData();
        setTimeout(closeClearModal, 900);
      } else {
        setClearError(res?.error || t("persona.errorWrongPassword"));
      }
    } catch (e: any) {
      setClearError(String(e?.message || e));
    } finally {
      setClearSubmitting(false);
    }
  }

  // ФІКС ("щоб я міг видалити або змінити якийсь з пунктів з Brain секції
  // самостійно"): для групи "facts" (memory_facts — LLM-факти з розмов)
  // модалка нейрона тепер несе ще й factKey (= node.title, ключ факту
  // напряму з бекенду) і userId (витягнений з тексту info, який бекенд сам
  // форматує як "...(користувач: {user_id}, оновлено: ...)" —
  // gui_get_brain_data() в test.py не віддає user_id окремим полем, тому
  // єдиний спосіб його отримати без зміни того ендпоинта — розпарсити з
  // уже наявного тексту). Кнопки Delete/Edit рендеряються лише коли
  // groupKey === "facts" — для journal/projects/music/people це історичні
  // записи без свого редактора тут.
  const [modalNode, setModalNode] = useState<{
    title: string;
    info: string;
    colorHex: string;
    colorRgb: string;
    groupKey?: string;
    factKey?: string;
    factUserId?: string;
  } | null>(null);
  const [typedTitle, setTypedTitle] = useState("");
  const [typedBody, setTypedBody] = useState("");
  const [sepFull, setSepFull] = useState(false);
  const typingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [factEditing, setFactEditing] = useState(false);
  const [factEditValue, setFactEditValue] = useState("");
  const [factSubmitting, setFactSubmitting] = useState(false);
  const [factError, setFactError] = useState("");
  const [factConfirmDelete, setFactConfirmDelete] = useState(false);
  const [factDone, setFactDone] = useState<"" | "saved" | "deleted">("");

  function resetFactEditState() {
    setFactEditing(false);
    setFactEditValue("");
    setFactSubmitting(false);
    setFactError("");
    setFactConfirmDelete(false);
    setFactDone("");
  }

  function typeText(
    text: string,
    speed: number,
    setter: (v: string) => void,
    onComplete?: () => void,
  ) {
    let i = 0;
    setter("");
    function step() {
      if (i < text.length) {
        i++;
        setter(text.slice(0, i));
        typingTimeoutsRef.current.push(setTimeout(step, speed + Math.random() * 30));
      } else {
        onComplete?.();
      }
    }
    step();
  }

  function openNodeModal(node: {
    title: string;
    info: string;
    colorHex: string;
    colorRgb: string;
    groupKey?: string;
  }) {
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current = [];
    setTypedTitle("");
    setTypedBody("");
    setSepFull(false);
    resetFactEditState();

    let factUserId: string | undefined;
    if (node.groupKey === "facts") {
      const m = node.info.match(/користувач:\s*([^,]+),/);
      factUserId = m ? m[1].trim() : undefined;
    }
    setModalNode({ ...node, factKey: node.title, factUserId });

    typingTimeoutsRef.current.push(
      setTimeout(() => {
        setSepFull(true);
        typeText(node.title, 30, setTypedTitle, () => {
          typeText(node.info, 15, setTypedBody);
        });
      }, 300),
    );
  }

  function closeNodeModal() {
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current = [];
    setModalNode(null);
    resetFactEditState();
  }

  async function handleDeleteFact() {
    if (!modalNode?.factKey || !modalNode?.factUserId) return;
    setFactSubmitting(true);
    setFactError("");
    const api = (window as any).pywebview?.api;
    if (!api?.delete_brain_fact) {
      setFactError(t("people.apiUnavailable"));
      setFactSubmitting(false);
      return;
    }
    try {
      const res = await api.delete_brain_fact(modalNode.factKey, modalNode.factUserId);
      if (res?.ok) {
        setFactDone("deleted");
        fetchBrainData();
        setTimeout(closeNodeModal, 900);
      } else {
        setFactError(res?.error || t("brain.factActionError"));
        setFactSubmitting(false);
      }
    } catch (e: any) {
      setFactError(String(e?.message || e));
      setFactSubmitting(false);
    }
  }

  async function handleSaveFactEdit() {
    if (!modalNode?.factKey || !modalNode?.factUserId) return;
    const newValue = factEditValue.trim();
    if (!newValue) return;
    setFactSubmitting(true);
    setFactError("");
    const api = (window as any).pywebview?.api;
    if (!api?.update_brain_fact) {
      setFactError(t("people.apiUnavailable"));
      setFactSubmitting(false);
      return;
    }
    try {
      const res = await api.update_brain_fact(modalNode.factKey, modalNode.factUserId, newValue);
      if (res?.ok) {
        setFactDone("saved");
        setFactEditing(false);
        fetchBrainData();
        setTimeout(closeNodeModal, 900);
      } else {
        setFactError(res?.error || t("brain.factActionError"));
        setFactSubmitting(false);
      }
    } catch (e: any) {
      setFactError(String(e?.message || e));
      setFactSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) closeNodeModal();
  }, [open]);

  useEffect(() => {
    return () => typingTimeoutsRef.current.forEach(clearTimeout);
  }, []);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const onSoundRef = useRef(onSound);
  useEffect(() => {
    onSoundRef.current = onSound;
  }, [onSound]);

  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Авто-розгортання при пошуку: обчислюємо які групи/підгрупи містять збіги.
  // вони показуються відкритими автоматично, без потреби клікати.
  const searchExpanded = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = new Set<string>();
    const subs = new Set<string>();
    if (q) {
      for (const group of brainGroups) {
        for (const sub of group.subgroups) {
          const hasMatch = sub.neurons.some(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.info.toLowerCase().includes(q),
          );
          if (hasMatch) {
            groups.add(group.key);
            subs.add(`${group.key}:${sub.key}`);
          }
        }
      }
    }
    return { groups, subs };
  }, [searchQuery, brainGroups]);

  // Ключ перерендеру 3D-графа: змінюється лише коли реально прийшли нові дані
  // (кількість груп + сумарна кількість нейронів) — щоб не перезапускати весь
  // canvas-ефект на кожен дрібний ре-рендер компонента.
  const dataSignature = brainGroups
    .map((g) => `${g.key}:${g.subgroups.reduce((n, s) => n + s.neurons.length, 0)}`)
    .join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ФІКС ("рівно стільки нейронів скільки реальних записів"): GROUPS/неурони тепер
    // будуються з РЕАЛЬНИХ brainGroups замість випадкової генерації. Якщо даних ще
    // немає (завантаження/порожній мозок) — граф просто порожній, без вигаданих вузлів.
    const GROUPS = brainGroups.map((g) => ({
      key: g.key,
      title: g.label,
      rgb: g.color,
      hex: rgbToHex(g.color),
    }));

    let width: number, height: number;
    let nodes: Node[] = [];
    let links: Link[] = [];

    let draggedNode: Node | null = null;
    let hoveredNode: Node | null = null;
    let hoverStartTime = 0;
    let rafId = 0;

    let mouse = { x: 0, y: 0 };

    let camera = { pitch: 0.2, yaw: -0.3, zoom: 1 };
    let isMiddleDown = false;
    let isLeftDown = false;
    let lastMouseX = 0,
      lastMouseY = 0;

    let clickStartX = 0,
      clickStartY = 0,
      clickStartTime = 0;

    // Центри кластерів розташовуються по колу — кількість груп тепер довільна
    // (не завжди рівно 3, як раніше), тому вираховуємо позиції динамічно.
    const CLUSTER_CENTERS = GROUPS.map((_, i) => {
      const n = Math.max(1, GROUPS.length);
      const angle = (i / n) * Math.PI * 2;
      const radius = n <= 1 ? 0 : 220;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle * 0.6) * 100,
        z: Math.sin(angle) * radius,
      };
    });

    const FOV = 800;
    const DRAG_FOLLOW = 0.08,
      MAX_SPEED = 5;
    const SPRING_LENGTH = 150,
      SPRING_STRENGTH = 0.002,
      REPULSION_STRENGTH = 40;
    const REPULSION_RADIUS = 130,
      DAMPING = 0.94,
      CLUSTER_PULL = 0.00003,
      NOISE = 0.005;
    // Максимум вузлів для продуктивності canvas-рендеру — не штучний мінімум/рандомний
    // діапазон, як раніше, а лише запобіжна стеля на випадок дуже великого журналу.
    const MAX_RENDER_NODES = 400;

    function resize() {
      width = canvas.width = container.clientWidth || 1920;
      height = canvas.height = container.clientHeight || 1080;
    }

    function project(x: number, y: number, z: number) {
      let cosY = Math.cos(camera.yaw),
        sinY = Math.sin(camera.yaw);
      let cosX = Math.cos(camera.pitch),
        sinX = Math.sin(camera.pitch);

      let x1 = x * cosY - z * sinY;
      let z1 = z * cosY + x * sinY;

      let y1 = y * cosX - z1 * sinX;
      let z2 = z1 * cosX + y * sinX;

      const baseScale = FOV / (FOV + z2);
      const scale = baseScale * camera.zoom;

      const centerX = (width - 1000) / 2 + 250;
      const centerY = height / 2;

      return {
        x: centerX + x1 * scale,
        y: centerY + y1 * scale,
        z: z2,
        scale: Math.max(0.01, scale),
      };
    }

    class Node {
      id: number;
      groupId: number;
      colorHex: string;
      colorRgb: string;
      title: string;
      info: string;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      pulse: number;
      pulseSpeed: number;
      mass: number;
      screenX: number;
      screenY: number;
      scale: number;
      depth: number | undefined;

      constructor(id: number, groupId: number, title: string, info: string) {
        this.id = id;
        this.groupId = groupId;

        const group = GROUPS[this.groupId];
        this.colorHex = group.hex;
        this.colorRgb = group.rgb;

        this.title = title;
        this.info = info;

        const center = CLUSTER_CENTERS[this.groupId] || { x: 0, y: 0, z: 0 };
        this.x = center.x + (Math.random() - 0.5) * 200;
        this.y = center.y + (Math.random() - 0.5) * 200;
        this.z = center.z + (Math.random() - 0.5) * 200;

        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.vz = (Math.random() - 0.5) * 0.5;

        this.size = Math.random() * 3 + 3;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.015 + Math.random() * 0.02;
        this.mass = 1 + Math.random() * 0.5;

        this.screenX = 0;
        this.screenY = 0;
        this.scale = 1;
        this.depth = 0;
      }

      update() {
        this.pulse += this.pulseSpeed;

        if (draggedNode === this) {
          let dx = mouse.x - this.screenX;
          let dy = mouse.y - this.screenY;

          let cosY = Math.cos(-camera.yaw),
            sinY = Math.sin(-camera.yaw);
          let cosX = Math.cos(-camera.pitch),
            sinX = Math.sin(-camera.pitch);

          let fx = dx * DRAG_FOLLOW * (1 / this.scale);
          let fy = dy * DRAG_FOLLOW * (1 / this.scale);
          let fz = 0;

          let fy1 = fy * cosX - fz * sinX;
          let fz1 = fz * cosX + fy * sinX;
          let fx1 = fx * cosY - fz1 * sinY;
          let fz2 = fz1 * cosY + fx * sinY;

          this.vx += fx1 * 0.15;
          this.vy += fy1 * 0.15;
          this.vz += fz2 * 0.15;

          this.vx *= 0.8;
          this.vy *= 0.8;
          this.vz *= 0.8;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        this.vx *= DAMPING;
        this.vy *= DAMPING;
        this.vz *= DAMPING;
        this.vx += (Math.random() - 0.5) * NOISE;
        this.vy += (Math.random() - 0.5) * NOISE;
        this.vz += (Math.random() - 0.5) * NOISE;

        const center = CLUSTER_CENTERS[this.groupId] || { x: 0, y: 0, z: 0 };
        this.vx += (center.x - this.x) * CLUSTER_PULL;
        this.vy += (center.y - this.y) * CLUSTER_PULL;
        this.vz += (center.z - this.z) * CLUSTER_PULL;

        const distFromCenter = Math.hypot(this.x, this.y, this.z);
        if (distFromCenter > 700) {
          this.vx -= (this.x / distFromCenter) * 0.005;
          this.vy -= (this.y / distFromCenter) * 0.005;
          this.vz -= (this.z / distFromCenter) * 0.005;
        }

        const speed = Math.hypot(this.vx, this.vy, this.vz);
        if (speed > MAX_SPEED) {
          this.vx = (this.vx / speed) * MAX_SPEED;
          this.vy = (this.vy / speed) * MAX_SPEED;
          this.vz = (this.vz / speed) * MAX_SPEED;
        }
      }

      draw() {
        if (this.depth < -FOV + 50) return;

        const query = searchQueryRef.current.trim().toLowerCase();
        const hasQuery = query.length > 0;
        const matchesSearch = !hasQuery || this.title.toLowerCase().includes(query);

        const baseSize = this.size + Math.sin(this.pulse) * 0.6;
        const isActive = this === draggedNode;
        const isHover = this === hoveredNode;

        let scaleMultiplier = 1;
        if (isActive) scaleMultiplier = 2.0;
        else if (isHover) scaleMultiplier = 1.5;
        else if (hasQuery && matchesSearch) scaleMultiplier = 1.3;

        const currentSize = baseSize * scaleMultiplier * this.scale;

        ctx!.save();
        ctx!.globalAlpha = hasQuery && !matchesSearch ? 0.12 : 1;

        if (isActive) {
          ctx!.beginPath();
          ctx!.arc(this.screenX, this.screenY, currentSize * 5, 0, Math.PI * 2);
          const glowGrad = ctx!.createRadialGradient(
            this.screenX,
            this.screenY,
            0,
            this.screenX,
            this.screenY,
            currentSize * 5
          );
          glowGrad.addColorStop(0, "rgba(255,255,255,0.6)");
          glowGrad.addColorStop(0.4, this.colorHex + "90");
          glowGrad.addColorStop(1, "transparent");
          ctx!.fillStyle = glowGrad;
          ctx!.fill();
        } else {
          ctx!.beginPath();
          ctx!.arc(this.screenX, this.screenY, currentSize * 4, 0, Math.PI * 2);
          const gradient = ctx!.createRadialGradient(
            this.screenX,
            this.screenY,
            0,
            this.screenX,
            this.screenY,
            currentSize * 4
          );
          gradient.addColorStop(0, this.colorHex + (isHover ? "60" : "15"));
          gradient.addColorStop(1, "transparent");
          ctx!.fillStyle = gradient;
          ctx!.fill();
        }

        if (hasQuery && matchesSearch && !isActive) {
          ctx!.beginPath();
          ctx!.arc(this.screenX, this.screenY, currentSize + 3, 0, Math.PI * 2);
          ctx!.strokeStyle = "#ffffff";
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }

        ctx!.beginPath();
        ctx!.arc(this.screenX, this.screenY, currentSize, 0, Math.PI * 2);
        ctx!.fillStyle = isActive ? "#ffffff" : this.colorHex;
        ctx!.fill();

        ctx!.restore();
      }
    }

    interface Link {
      source: number;
      target: number;
      depth?: number;
    }

    function drawHoverText(node: Node, durationMs: number) {
      if (durationMs < 800) return;

      const text = node.title;
      const fontSize = Math.max(8, 12 * node.scale);
      ctx!.font = `${fontSize}px "Inter", monospace`;
      const textWidth = ctx!.measureText(text).width;
      let startX = node.screenX - textWidth / 2;
      let yBase =
        node.screenY + node.size * 2 * node.scale + 20 * node.scale;

      const animTime = durationMs - 800;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const delay = i * 35;
        const timeForChar = animTime - delay;

        if (timeForChar > 0) {
          const progress = Math.min(1, timeForChar / 300);
          const ease = 1 - Math.pow(1 - progress, 3);

          const yOffset = -12 * node.scale * (1 - ease);

          ctx!.fillStyle = `rgba(163, 163, 163, ${ease})`;
          ctx!.fillText(char, startX, yBase + yOffset);
        }
        startX += ctx!.measureText(char).width;
      }
    }

    function createGraph() {
      nodes = [];
      links = [];

      // Один вузол на кожен РЕАЛЬНИЙ нейрон (запис у журналі/пам'яті/проєкті/музиці) —
      // не випадкова кількість, як було раніше.
      let id = 0;
      outer: for (let gi = 0; gi < GROUPS.length; gi++) {
        const group = brainGroups[gi];
        for (const sub of group.subgroups) {
          for (const neuron of sub.neurons) {
            nodes.push(new Node(id++, gi, neuron.title, neuron.info));
            if (id >= MAX_RENDER_NODES) break outer;
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const distances: { id: number; dist: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          let dist = Math.hypot(
            nodes[i].x - nodes[j].x,
            nodes[i].y - nodes[j].y,
            nodes[i].z - nodes[j].z
          );
          if (nodes[i].groupId !== nodes[j].groupId) dist *= 1.6;
          distances.push({ id: j, dist: dist });
        }
        distances.sort((a, b) => a.dist - b.dist);

        const linkCount = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < Math.min(linkCount, distances.length); k++) {
          const targetId = distances[k].id;
          const exists = links.some(
            (l) =>
              (l.source === i && l.target === targetId) ||
              (l.source === targetId && l.target === i)
          );
          if (!exists && distances[k].dist < 450)
            links.push({ source: i, target: targetId });
        }
      }

      setNodeCount(nodes.length);
      setLinkCount(links.length);
    }

    function applyForces() {
      for (const link of links) {
        const a = nodes[link.source],
          b = nodes[link.target];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          dz = b.z - a.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist === 0) continue;

        const isCross = a.groupId !== b.groupId;
        const force =
          (dist - (isCross ? SPRING_LENGTH * 1.3 : SPRING_LENGTH)) *
          (isCross ? SPRING_STRENGTH * 0.6 : SPRING_STRENGTH);
        const fx = (dx / dist) * force,
          fy = (dy / dist) * force,
          fz = (dz / dist) * force;

        if (draggedNode !== a) {
          a.vx += fx / a.mass;
          a.vy += fy / a.mass;
          a.vz += fz / a.mass;
        }
        if (draggedNode !== b) {
          b.vx -= fx / b.mass;
          b.vy -= fy / b.mass;
          b.vz -= fz / b.mass;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = b.x - a.x,
            dy = b.y - a.y,
            dz = b.z - a.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist === 0 || dist > REPULSION_RADIUS * 3) continue;

          const force = REPULSION_STRENGTH / (dist * dist + 10);
          const fx = (dx / dist) * force,
            fy = (dy / dist) * force,
            fz = (dz / dist) * force;

          if (draggedNode !== a) {
            a.vx -= fx / a.mass;
            a.vy -= fy / a.mass;
            a.vz -= fz / a.mass;
          }
          if (draggedNode !== b) {
            b.vx += fx / b.mass;
            b.vy += fy / b.mass;
            b.vz += fz / b.mass;
          }
        }
      }
    }

    function drawFogAndLinks(sortedNodes: Node[], sortedLinks: Link[]) {
      const groupPos = GROUPS.map(() => ({ x: 0, y: 0, z: 0, c: 0 }));
      for (const node of nodes) {
        if (!groupPos[node.groupId]) continue;
        groupPos[node.groupId].x += node.x;
        groupPos[node.groupId].y += node.y;
        groupPos[node.groupId].z += node.z;
        groupPos[node.groupId].c++;
      }

      let fogs: { id: number; x: number; y: number; z: number; scale: number }[] =
        [];
      for (let i = 0; i < GROUPS.length; i++) {
        if (groupPos[i].c === 0) continue;
        let cx = groupPos[i].x / groupPos[i].c;
        let cy = groupPos[i].y / groupPos[i].c;
        let cz = groupPos[i].z / groupPos[i].c;
        const proj = project(cx, cy, cz);
        fogs.push({ id: i, ...proj });
      }

      for (const fog of fogs) {
        if (fog.z < -FOV + 100) continue;
        const r = 450 * fog.scale;
        if (r < 10) continue;

        const grad = ctx!.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, r);
        grad.addColorStop(0, `rgba(${GROUPS[fog.id].rgb}, 0.12)`);
        grad.addColorStop(0.4, `rgba(${GROUPS[fog.id].rgb}, 0.04)`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(fog.x, fog.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (const link of sortedLinks) {
        const a = nodes[link.source],
          b = nodes[link.target];
        if (a.depth === undefined || b.depth === undefined) continue;
        if (a.depth < -FOV + 50 || b.depth < -FOV + 50) continue;

        const dist = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        const alpha = Math.max(0.05, 1 - dist / 450) * 0.45;
        const avgScale = (a.scale + b.scale) / 2;

        let strokeColor = `rgba(${
          a.groupId === b.groupId ? GROUPS[a.groupId].rgb : "150, 150, 150"
        }, ${alpha})`;
        let lineWidth = 1.0 * avgScale;

        if (draggedNode && (a === draggedNode || b === draggedNode)) {
          strokeColor = `rgba(255, 255, 255, ${Math.min(1, alpha * 3)})`;
          lineWidth = 2.0 * avgScale;
        }

        ctx!.beginPath();
        ctx!.strokeStyle = strokeColor;
        ctx!.lineWidth = lineWidth;
        ctx!.moveTo(a.screenX, a.screenY);
        ctx!.lineTo(b.screenX, b.screenY);
        ctx!.stroke();
      }
    }

    function animate() {
      if (!openRef.current) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      ctx!.clearRect(0, 0, width, height);

      applyForces();

      for (const node of nodes) {
        node.update();
        const proj = project(node.x, node.y, node.z);
        node.screenX = proj.x;
        node.screenY = proj.y;
        node.scale = proj.scale;
        node.depth = proj.z;
      }

      const sortedNodes = [...nodes].sort((a, b) => b.depth - a.depth);

      links.forEach((l) => {
        l.depth = (nodes[l.source].depth + nodes[l.target].depth) / 2;
      });
      const sortedLinks = [...links].sort((a, b) => b.depth! - a.depth!);

      drawFogAndLinks(sortedNodes, sortedLinks);

      for (const node of sortedNodes) {
        node.draw();
      }

      if (hoveredNode && !isLeftDown && !isMiddleDown) {
        drawHoverText(hoveredNode, performance.now() - hoverStartTime);
      }

      rafId = requestAnimationFrame(animate);
    }

    function getNodeAt(x: number, y: number): Node | null {
      const sortedNodes = [...nodes].sort((a, b) => b.depth - a.depth);
      for (let i = sortedNodes.length - 1; i >= 0; i--) {
        const node = sortedNodes[i];
        if (node.depth < -FOV + 50) continue;

        const hitRadius = (node.size * 2 + 15) * node.scale;
        if (Math.hypot(node.screenX - x, node.screenY - y) < hitRadius) {
          return node;
        }
      }
      return null;
    }

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      if (e.button === 1 || e.button === 2) {
        isMiddleDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = "all-scroll";
        e.preventDefault();
        return;
      }

      isLeftDown = true;
      clickStartX = mouse.x;
      clickStartY = mouse.y;
      clickStartTime = performance.now();

      const node = getNodeAt(mouse.x, mouse.y);
      if (node) {
        draggedNode = node;
        canvas.style.cursor = "grabbing";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      if (isMiddleDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;

        camera.yaw += dx * 0.005;
        camera.pitch -= dy * 0.005;

        camera.pitch = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, camera.pitch)
        );

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        return;
      }

      if (!isLeftDown) {
        const newNode = getNodeAt(mouse.x, mouse.y);
        if (newNode !== hoveredNode) {
          hoveredNode = newNode;
          if (newNode) {
            hoverStartTime = performance.now();
            onSoundRef.current?.("click-5-clowse");
          }
        }
        canvas.style.cursor = hoveredNode ? "grab" : "default";
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        isMiddleDown = false;
        canvas.style.cursor = hoveredNode ? "grab" : "default";
      }

      if (e.button === 0) {
        if (draggedNode) {
          const distMoved = Math.hypot(mouse.x - clickStartX, mouse.y - clickStartY);
          const timeElapsed = performance.now() - clickStartTime;
          if (distMoved < 10 && timeElapsed < 300) {
            onSoundRef.current?.("click-6-mode");
            openNodeModal({
              title: draggedNode.title,
              info: draggedNode.info,
              colorHex: draggedNode.colorHex,
              colorRgb: draggedNode.colorRgb,
              groupKey: GROUPS[draggedNode.groupId]?.key,
            });
          }
        }
        isLeftDown = false;
        draggedNode = null;
        canvas.style.cursor = hoveredNode ? "grab" : "default";
      }
    };

    const handleMouseLeave = () => {
      isLeftDown = false;
      isMiddleDown = false;
      draggedNode = null;
      hoveredNode = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.0015;
      camera.zoom -= e.deltaY * zoomSpeed;
      camera.zoom = Math.max(0.3, Math.min(camera.zoom, 4.0));
    };

    const handleResize = () => {
      resize();
      createGraph();
    };

    canvas.addEventListener("contextmenu", handleContextMenu);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", handleResize);

    resize();
    createGraph();
    rafId = requestAnimationFrame(animate);

    return () => {
      canvas.removeEventListener("contextmenu", handleContextMenu);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSignature]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000000",
        zIndex: 400,
        display: "flex",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "500px",
          minWidth: "500px",
          maxWidth: "500px",
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid #333",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          zIndex: 10,
          overflowY: "auto",
          overflowX: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              right: 16,
              zIndex: 20,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
            }}
          >
            ✕
          </button>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            fontWeight: 700,
            color: "#e5e5e5",
            marginBottom: 4,
            paddingBottom: 16,
            borderBottom: "1px solid #333",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #444, #777)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ◈
          </div>
          <span>{t("brain.title")}</span>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("brain.searchPlaceholder")}
            style={{
              background: "rgba(38, 38, 38, 0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "12px 36px 12px 14px",
              width: "100%",
              color: "#a3a3a3",
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease",
              fontFamily: "Arial, sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#666";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#e5e5e5";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#333";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.color = "#a3a3a3";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#a3a3a3",
                fontSize: 20,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e5e5e5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#a3a3a3";
              }}
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#f87171",
            fontSize: 13,
            fontFamily: "monospace",
            letterSpacing: "0.5px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
          }}
        >
          🗑 {t("brain.clearButton")}
        </button>

        {loading && (
          <div style={{ color: "#a3a3a3", fontSize: 13, fontFamily: "monospace" }}>
            {t("brain.loading")}
          </div>
        )}
        {!loading && brainGroups.length === 0 && (
          <div style={{ color: "#a3a3a3", fontSize: 13, fontFamily: "monospace" }}>
            {t("brain.empty")}
          </div>
        )}

        {/* Групи -> підгрупи -> нейрони. Кожна група має власний колір (як у Discord-ролях) —
            journal=червоний, facts=фіолетовий, projects=синій, music=жовтий, people=зелений
            (як і в People), memory=оранжевий (як і в Memory) — кольори задає бекенд. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {brainGroups.map((group) => {
            const totalNeurons = group.subgroups.reduce((n, s) => n + s.neurons.length, 0);
            const isGroupOpen =
              activeGroup === group.key ||
              searchExpanded.groups.has(group.key);
            // i18n: перекладаємо назву групи через t('brain.group.KEY'),
            // фалбек на значення з бекенда якщо ключ не знайдено.
            const i18nKey = `brain.group.${group.key}`;
            const translated = t(i18nKey);
            const groupLabel = translated !== i18nKey ? translated : group.label;
            return (
              <div key={group.key} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div
                  onClick={() => {
                    onSound?.("click-4");
                    setActiveGroup(isGroupOpen ? null : group.key);
                    setActiveSubgroup(null);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: 14,
                    color: isGroupOpen ? "#fff" : "#a3a3a3",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid transparent",
                    background: isGroupOpen ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e5e5e5";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isGroupOpen) {
                      e.currentTarget.style.color = "#a3a3a3";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: `rgb(${group.color})`,
                      boxShadow: `0 0 8px rgb(${group.color})`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{groupLabel}</span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{totalNeurons}</span>
                </div>

                {isGroupOpen && (
                  <div
                    style={{
                      paddingLeft: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      marginTop: 6,
                      marginBottom: 8,
                    }}
                  >
                    {group.subgroups.map((sub) => {
                      const subKey = `${group.key}:${sub.key}`;
                      const isSubOpen =
                        activeSubgroup === subKey ||
                        searchExpanded.subs.has(subKey);
                      const filteredNeurons = sub.neurons.filter((n) =>
                        searchQuery.trim()
                          ? n.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                            n.info.toLowerCase().includes(searchQuery.trim().toLowerCase())
                          : true,
                      );
                      return (
                        <div key={sub.key}>
                          <div
                            onClick={() => {
                              onSound?.("click-4");
                              setActiveSubgroup(isSubOpen ? null : subKey);
                            }}
                            style={{
                              padding: "8px 10px",
                              fontSize: 13,
                              color: isSubOpen ? "#e5e5e5" : "#8a8a8a",
                              cursor: "pointer",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontFamily: "monospace",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span>▸ {sub.label}</span>
                            <span style={{ fontSize: 10, opacity: 0.5 }}>{sub.neurons.length}</span>
                          </div>

                          {isSubOpen && (
                            <div
                              style={{
                                paddingLeft: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                marginTop: 2,
                                marginBottom: 6,
                                maxHeight: 240,
                                overflowY: "auto",
                              }}
                            >
                              {filteredNeurons.map((neuron, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    onSound?.("click-6-mode");
                                    openNodeModal({
                                      title: neuron.title,
                                      info: neuron.info,
                                      colorHex: rgbToHex(group.color),
                                      colorRgb: group.color,
                                      groupKey: group.key,
                                    });
                                  }}
                                  onMouseEnter={(e) => {
                                    onSound?.("click-5-clowse");
                                    e.currentTarget.style.color = "#e5e5e5";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                    e.currentTarget.style.borderRadius = "6px";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#a3a3a3";
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderRadius = "0";
                                  }}
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: 12,
                                    color: "#a3a3a3",
                                    cursor: "pointer",
                                    transition: "background 0.2s, color 0.2s",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontFamily: "monospace",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {neuron.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          flex: 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          gap: 24,
          background: "rgba(20, 20, 20, 0.5)",
          padding: "12px 24px",
          borderRadius: 12,
          backdropFilter: "blur(10px)",
          border: "1px solid #333",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            id="nodeCount"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {nodeCount}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#a3a3a3",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t("brain.neurons")}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            id="linkCount"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {linkCount}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#a3a3a3",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t("brain.links")}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNodeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 500,
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                padding: 40,
                width: 450,
                position: "relative",
              }}
            >
              <GlassDock
                borderRadius={16}
                disableEdge={true}
                overlayStyle={{
                  background: `
                    linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 35%),
                    radial-gradient(ellipse at 50% -20%, rgba(${modalNode.colorRgb}, 0.2) 0%, transparent 60%)
                  `,
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.25), inset 0 10px 30px rgba(${modalNode.colorRgb}, 0.05), 0 0 30px rgba(${modalNode.colorRgb}, 0.15)`
                }}
                style={{ position: "absolute", inset: 0, zIndex: 0 }}
              />
              <div style={{ position: "relative", zIndex: 2 }}>
                <button
                  onClick={closeNodeModal}
                  style={{
                    position: "absolute",
                    top: -24,
                    right: -20,
                    background: "none",
                    border: "none",
                    color: "rgba(163,163,163,0.8)",
                    fontSize: 28,
                    cursor: "pointer",
                    lineHeight: 1,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(163,163,163,0.8)")}
                >
                  ×
                </button>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: modalNode.colorHex,
                    textShadow: `0 0 12px rgba(${modalNode.colorRgb}, 0.6)`,
                    marginBottom: 16,
                    minHeight: 28,
                    fontFamily: "monospace",
                  }}
                >
                  {typedTitle}
                </div>
                <div
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, rgba(${modalNode.colorRgb}, 0.8), transparent)`,
                    boxShadow: `0 0 10px rgba(${modalNode.colorRgb}, 0.5)`,
                    marginBottom: 24,
                    width: sepFull ? "100%" : "0%",
                    transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 15,
                    color: "#a3a3a3",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    minHeight: 80,
                  }}
                >
                  {typedBody}
                </div>

                {modalNode.groupKey === "facts" && modalNode.factKey && modalNode.factUserId && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {factDone === "saved" && (
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#4ade80", textAlign: "center", padding: "6px 0" }}>
                        {t("brain.factSaved")}
                      </div>
                    )}
                    {factDone === "deleted" && (
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#4ade80", textAlign: "center", padding: "6px 0" }}>
                        {t("brain.factDeleted")}
                      </div>
                    )}

                    {!factDone && factEditing && (
                      <>
                        <input
                          type="text"
                          value={factEditValue}
                          onChange={(e) => setFactEditValue(e.target.value)}
                          placeholder={t("brain.newValuePlaceholder")}
                          disabled={factSubmitting}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && factEditValue.trim() && !factSubmitting) handleSaveFactEdit();
                          }}
                          style={{
                            background: "rgba(38, 38, 38, 0.6)",
                            border: "1px solid #333",
                            borderRadius: 10,
                            padding: "10px 12px",
                            width: "100%",
                            color: "#e5e5e5",
                            fontSize: 13,
                            outline: "none",
                            marginBottom: 10,
                            fontFamily: "monospace",
                            boxSizing: "border-box",
                          }}
                          autoFocus
                        />
                        {factError && (
                          <div style={{ color: "#f87171", fontSize: 12, fontFamily: "monospace", marginBottom: 10 }}>
                            {factError}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => { setFactEditing(false); setFactError(""); }}
                            disabled={factSubmitting}
                            style={{
                              flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: 10, padding: "9px 12px", color: "#e5e5e5", fontSize: 12,
                              fontFamily: "monospace", cursor: factSubmitting ? "default" : "pointer",
                              opacity: factSubmitting ? 0.5 : 1,
                            }}
                          >
                            {t("common.cancel")}
                          </button>
                          <button
                            onClick={handleSaveFactEdit}
                            disabled={factSubmitting || !factEditValue.trim()}
                            style={{
                              flex: 1, background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.5)",
                              borderRadius: 10, padding: "9px 12px", color: "#4ade80", fontSize: 12,
                              fontFamily: "monospace", cursor: factSubmitting || !factEditValue.trim() ? "default" : "pointer",
                              opacity: factSubmitting || !factEditValue.trim() ? 0.5 : 1,
                            }}
                          >
                            {t("common.save")}
                          </button>
                        </div>
                      </>
                    )}

                    {!factDone && !factEditing && factConfirmDelete && (
                      <>
                        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#a3a3a3", marginBottom: 10 }}>
                          {t("brain.deleteFactConfirm")}
                        </div>
                        {factError && (
                          <div style={{ color: "#f87171", fontSize: 12, fontFamily: "monospace", marginBottom: 10 }}>
                            {factError}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => { setFactConfirmDelete(false); setFactError(""); }}
                            disabled={factSubmitting}
                            style={{
                              flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: 10, padding: "9px 12px", color: "#e5e5e5", fontSize: 12,
                              fontFamily: "monospace", cursor: factSubmitting ? "default" : "pointer",
                              opacity: factSubmitting ? 0.5 : 1,
                            }}
                          >
                            {t("common.cancel")}
                          </button>
                          <button
                            onClick={handleDeleteFact}
                            disabled={factSubmitting}
                            style={{
                              flex: 1, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.5)",
                              borderRadius: 10, padding: "9px 12px", color: "#f87171", fontSize: 12,
                              fontFamily: "monospace", cursor: factSubmitting ? "default" : "pointer",
                              opacity: factSubmitting ? 0.5 : 1,
                            }}
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </>
                    )}

                    {!factDone && !factEditing && !factConfirmDelete && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => { setFactEditValue(""); setFactEditing(true); }}
                          style={{
                            flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 10, padding: "9px 12px", color: "#e5e5e5", fontSize: 12,
                            fontFamily: "monospace", cursor: "pointer",
                          }}
                        >
                          {t("brain.editValue")}
                        </button>
                        <button
                          onClick={() => setFactConfirmDelete(true)}
                          style={{
                            flex: 1, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
                            borderRadius: 10, padding: "9px 12px", color: "#f87171", fontSize: 12,
                            fontFamily: "monospace", cursor: "pointer",
                          }}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !clearSubmitting && closeClearModal()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 500,
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                padding: 36,
                width: 400,
                position: "relative",
              }}
            >
              <GlassDock
                borderRadius={16}
                disableEdge={true}
                overlayStyle={{
                  background: `
                    linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 35%),
                    radial-gradient(ellipse at 50% -20%, rgba(239, 68, 68, 0.2) 0%, transparent 60%)
                  `,
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.25), inset 0 10px 30px rgba(239, 68, 68, 0.05), 0 0 30px rgba(239, 68, 68, 0.15)`
                }}
                style={{ position: "absolute", inset: 0, zIndex: 0 }}
              />
              <div style={{ position: "relative", zIndex: 2 }}>
                {!clearSubmitting && (
                  <button
                    onClick={closeClearModal}
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -16,
                      background: "none",
                      border: "none",
                      color: "rgba(163,163,163,0.8)",
                      fontSize: 26,
                      cursor: "pointer",
                      lineHeight: 1,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(163,163,163,0.8)")}
                  >
                    ×
                  </button>
                )}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#f87171",
                    textShadow: "0 0 12px rgba(239, 68, 68, 0.6)",
                    marginBottom: 12,
                    fontFamily: "monospace",
                  }}
                >
                  {t("brain.clearButton")}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: "#a3a3a3",
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  {t("brain.clearWarning")}
                </div>
                {clearDone ? (
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 14,
                      color: "#4ade80",
                      textAlign: "center",
                      padding: "8px 0",
                    }}
                  >
                    {t("brain.clearSuccess")}
                  </div>
                ) : (
                  <>
                    <input
                      type="password"
                      value={clearPassword}
                      onChange={(e) => setClearPassword(e.target.value)}
                      placeholder={t("persona.adminPassword")}
                      disabled={clearSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && clearPassword && !clearSubmitting) handleClearBrain();
                      }}
                      style={{
                        background: "rgba(38, 38, 38, 0.6)",
                        border: "1px solid #333",
                        borderRadius: 10,
                        padding: "12px 14px",
                        width: "100%",
                        color: "#e5e5e5",
                        fontSize: 14,
                        outline: "none",
                        marginBottom: 12,
                        fontFamily: "Arial, sans-serif",
                        boxSizing: "border-box",
                      }}
                      autoFocus
                    />
                    {clearError && (
                      <div
                        style={{
                          color: "#f87171",
                          fontSize: 12,
                          fontFamily: "monospace",
                          marginBottom: 12,
                        }}
                      >
                        {clearError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={closeClearModal}
                        disabled={clearSubmitting}
                        style={{
                          flex: 1,
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: "#e5e5e5",
                          fontSize: 13,
                          fontFamily: "monospace",
                          cursor: clearSubmitting ? "default" : "pointer",
                          opacity: clearSubmitting ? 0.5 : 1,
                        }}
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={handleClearBrain}
                        disabled={clearSubmitting || !clearPassword}
                        style={{
                          flex: 1,
                          background: "rgba(239, 68, 68, 0.18)",
                          border: "1px solid rgba(239, 68, 68, 0.5)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: "#f87171",
                          fontSize: 13,
                          fontFamily: "monospace",
                          cursor: clearSubmitting || !clearPassword ? "default" : "pointer",
                          opacity: clearSubmitting || !clearPassword ? 0.5 : 1,
                        }}
                      >
                        {clearSubmitting ? t("brain.clearing") : t("brain.clearButton")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
