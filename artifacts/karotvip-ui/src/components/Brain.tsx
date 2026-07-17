import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../i18n";
import { GlassDock } from "./GlassDock";

interface BrainProps {
  open: boolean;
  onClose?: () => void;
  onSound?: (type: string) => void;
}

export function Brain({ open, onClose, onSound }: BrainProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<number | null>(0);
  const [closingGroup, setClosingGroup] = useState<number | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [groupNeurons, setGroupNeurons] = useState<{
    [key: number]: {
      id: number;
      title: string;
      info: string;
      colorHex: string;
      colorRgb: string;
    }[];
  }>({});

  const [modalNode, setModalNode] = useState<{
    title: string;
    info: string;
    colorHex: string;
    colorRgb: string;
  } | null>(null);
  const [typedTitle, setTypedTitle] = useState("");
  const [typedBody, setTypedBody] = useState("");
  const [sepFull, setSepFull] = useState(false);
  const typingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
  }) {
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current = [];
    setTypedTitle("");
    setTypedBody("");
    setSepFull(false);
    setModalNode(node);

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
  }

  useEffect(() => {
    if (!open) closeNodeModal();
  }, [open]);

  useEffect(() => {
    return () => typingTimeoutsRef.current.forEach(clearTimeout);
  }, []);

  const NAMES = [
    [t("brain.name1"), t("brain.name2"), t("brain.name3")],
    [t("brain.name1"), t("brain.name2"), t("brain.name3")],
    [t("brain.name1"), t("brain.name2"), t("brain.name3")],
  ];
  const INFOS = [
    t("brain.info1"),
    t("brain.info2"),
    t("brain.info3"),
  ];

  const GROUPS = [
    {
      id: 0,
      title: t("brain.groupUsers"),
      rgb: "124, 58, 237",
      hexColors: ["#7c3aed", "#8b5cf6", "#a78bfa"],
    },
    {
      id: 1,
      title: t("brain.groupMartin"),
      rgb: "6, 182, 212",
      hexColors: ["#06b6d4", "#22d3ee", "#67e8f9"],
    },
    {
      id: 2,
      title: t("brain.groupSystem"),
      rgb: "244, 63, 94",
      hexColors: ["#f43f5e", "#fb7185", "#fda4af"],
    },
  ];

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    const CLUSTER_CENTERS = [
      { x: -180, y: 20, z: 120 },
      { x: 150, y: -150, z: -100 },
      { x: 150, y: 150, z: 20 },
    ];

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
    const MIN_NODES = 35,
      MAX_NODES = 85;

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

      constructor(id: number, groupId: number) {
        this.id = id;
        this.groupId = groupId;

        const group = GROUPS[this.groupId];
        this.colorHex =
          group.hexColors[Math.floor(Math.random() * group.hexColors.length)];
        this.colorRgb = group.rgb;

        this.title =
          NAMES[this.groupId][Math.floor(Math.random() * 3)] +
          Math.floor(Math.random() * 9999);
        this.info = INFOS[this.groupId].replace(
          /\{T\}/g,
          String(Math.floor(Math.random() * 100) + 10)
        );

        const center = CLUSTER_CENTERS[this.groupId];
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

        const center = CLUSTER_CENTERS[this.groupId];
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
      let nodeCount = Math.floor((width * height) / 12000);
      nodeCount = Math.max(MIN_NODES, Math.min(nodeCount, MAX_NODES));

      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node(i, i % 3));
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

      // Update counters and group neurons
      setNodeCount(nodes.length);
      setLinkCount(links.length);

      // Group neurons by groupId for submenu display (id + real title + info)
      const grouped: {
        [key: number]: {
          id: number;
          title: string;
          info: string;
          colorHex: string;
          colorRgb: string;
        }[];
      } = { 0: [], 1: [], 2: [] };
      nodes.forEach((node) => {
        if (grouped[node.groupId]) {
          grouped[node.groupId].push({
            id: node.id,
            title: node.title,
            info: node.info,
            colorHex: node.colorHex,
            colorRgb: node.colorRgb,
          });
        }
      });
      setGroupNeurons(grouped);
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
      const groupPos = [
        { x: 0, y: 0, z: 0, c: 0 },
        { x: 0, y: 0, z: 0, c: 0 },
        { x: 0, y: 0, z: 0, c: 0 },
      ];
      for (const node of nodes) {
        groupPos[node.groupId].x += node.x;
        groupPos[node.groupId].y += node.y;
        groupPos[node.groupId].z += node.z;
        groupPos[node.groupId].c++;
      }

      let fogs: { id: number; x: number; y: number; z: number; scale: number }[] =
        [];
      for (let i = 0; i < 3; i++) {
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
  }, []);

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
        background: "radial-gradient(circle at 50% 50%, #111 0%, #050505 100%)",
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
          background: "rgba(20, 20, 20, 0.7)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: 0, title: t("brain.groupUsers"), rgb: "124, 58, 237" },
            { id: 1, title: t("brain.groupMartin"), rgb: "6, 182, 212" },
            { id: 2, title: t("brain.groupSystem"), rgb: "244, 63, 94" },
          ].map((group) => (
            <div key={group.id} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div
                onClick={() => {
                  onSound?.("click-4");
                  if (activeGroup === group.id) {
                    setClosingGroup(group.id);
                    setTimeout(() => {
                      setActiveGroup(null);
                      setClosingGroup(null);
                    }, 300);
                  } else {
                    setActiveGroup(group.id);
                  }
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: 14,
                  color: activeGroup === group.id ? "#fff" : "#a3a3a3",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid transparent",
                  background: activeGroup === group.id ? "rgba(255, 255, 255, 0.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e5e5e5";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  if (activeGroup !== group.id) {
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
                    background: `rgb(${group.rgb})`,
                    boxShadow: `0 0 8px rgb(${group.rgb})`,
                    flexShrink: 0,
                  }}
                />
                {group.title}
              </div>
              {(activeGroup === group.id || closingGroup === group.id) && (
                <div
                  style={{
                    paddingLeft: 28,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    marginTop: 6,
                    marginBottom: 8,
                    maxHeight: 280,
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  {(groupNeurons[group.id] || [])
                    .filter((neuron) =>
                      searchQuery.trim()
                        ? neuron.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
                        : true,
                    )
                    .map((neuron) => (
                    <div
                      key={neuron.id}
                      onClick={() => {
                        onSound?.("click-6-mode");
                        openNodeModal(neuron);
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
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#a3a3a3",
                        cursor: "pointer",
                        transition: "background 0.2s, color 0.2s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: "monospace",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        flexShrink: 0,
                        minHeight: 34,
                        boxSizing: "border-box",
                      }}
                    >
                      {neuron.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
