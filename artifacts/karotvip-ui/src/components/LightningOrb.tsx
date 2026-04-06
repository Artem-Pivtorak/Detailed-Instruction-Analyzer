import { useEffect, useRef } from "react";

interface LightningOrbProps {
  size?: number;
}

interface ArcSegment {
  startAngle: number;
  endAngle: number;
  points: { r: number; a: number }[];
  life: number;
  maxLife: number;
  width: number;
  color: string;
  branch?: ArcSegment;
}

function midpointDisplace(
  a1: number, r1: number,
  a2: number, r2: number,
  roughness: number,
  depth: number,
  ringR: number
): { r: number; a: number }[] {
  if (depth === 0) return [{ r: r1, a: a1 }, { r: r2, a: a2 }];
  const am = (a1 + a2) / 2;
  const rm = (r1 + r2) / 2 + (Math.random() - 0.5) * roughness;
  const left = midpointDisplace(a1, r1, am, rm, roughness * 0.6, depth - 1, ringR);
  const right = midpointDisplace(am, rm, a2, r2, roughness * 0.6, depth - 1, ringR);
  return [...left, ...right];
}

export function LightningOrb({ size = 240 }: LightningOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcsRef = useRef<ArcSegment[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const ringR = size * 0.38;
    const innerGlowR = size * 0.18;

    function rnd(a: number, b: number) {
      return a + Math.random() * (b - a);
    }

    function spawnArc() {
      const spanFrac = rnd(0.08, 0.45);
      const span = spanFrac * Math.PI * 2;
      const startAngle = Math.random() * Math.PI * 2;
      const endAngle = startAngle + span;
      const roughness = ringR * rnd(0.04, 0.14);
      const depth = Math.floor(rnd(3, 6));
      const r1 = ringR;
      const r2 = ringR;

      const pts = midpointDisplace(startAngle, r1, endAngle, r2, roughness, depth, ringR);

      const colors = [
        "#ffffff",
        "#aaeeff",
        "#66ddff",
        "#88aaff",
        "#ccf0ff",
        "#ddeeff",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = Math.floor(rnd(6, 22));

      const arc: ArcSegment = {
        startAngle,
        endAngle,
        points: pts,
        life: 0,
        maxLife,
        width: rnd(0.4, 2.2),
        color,
      };

      // random branch off mid-arc
      if (Math.random() > 0.45) {
        const bIdx = Math.floor(pts.length * rnd(0.2, 0.8));
        const bPt = pts[bIdx];
        const bSpan = span * rnd(0.1, 0.35);
        const bDir = Math.random() > 0.5 ? 1 : -1;
        const bRough = roughness * 0.6;
        const bPts = midpointDisplace(
          bPt.a, bPt.r,
          bPt.a + bDir * bSpan, bPt.r + rnd(-ringR * 0.12, ringR * 0.12),
          bRough, 3, ringR
        );
        arc.branch = {
          startAngle: bPt.a,
          endAngle: bPt.a + bDir * bSpan,
          points: bPts,
          life: 0,
          maxLife,
          width: arc.width * 0.45,
          color,
        };
      }

      arcsRef.current.push(arc);
    }

    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // === Outer ambient halo ===
      const halo = ctx.createRadialGradient(cx, cy, ringR * 0.6, cx, cy, ringR * 1.7);
      halo.addColorStop(0, "rgba(30, 140, 255, 0.10)");
      halo.addColorStop(0.5, "rgba(0, 100, 220, 0.06)");
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, ringR * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // === Ring glow band ===
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, ringR + 8, 0, Math.PI * 2);
      ctx.arc(cx, cy, ringR - 8, 0, Math.PI * 2, true);
      const ringGrad = ctx.createRadialGradient(cx, cy, ringR - 10, cx, cy, ringR + 10);
      ringGrad.addColorStop(0, "rgba(0, 180, 255, 0.0)");
      ringGrad.addColorStop(0.4, "rgba(80, 200, 255, 0.18)");
      ringGrad.addColorStop(0.6, "rgba(120, 220, 255, 0.22)");
      ringGrad.addColorStop(1, "rgba(0, 100, 200, 0.0)");
      ctx.fillStyle = ringGrad;
      ctx.fill("evenodd");
      ctx.restore();

      // === Base ring circle ===
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100, 200, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#00aaff";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // inner faint ring
      ctx.beginPath();
      ctx.arc(cx, cy, ringR * 0.82, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(80, 160, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // === Inner core glow ===
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerGlowR * 1.4);
      coreGrad.addColorStop(0, "rgba(200, 240, 255, 0.82)");
      coreGrad.addColorStop(0.25, "rgba(100, 210, 255, 0.55)");
      coreGrad.addColorStop(0.6, "rgba(30, 120, 255, 0.18)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, innerGlowR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // bright core center
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerGlowR * 0.5);
      centerGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      centerGrad.addColorStop(1, "rgba(180, 230, 255, 0.0)");
      ctx.beginPath();
      ctx.arc(cx, cy, innerGlowR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // === Spawn arcs ===
      if (frame % 3 === 0) {
        if (arcsRef.current.length < 18) spawnArc();
        if (Math.random() > 0.6 && arcsRef.current.length < 18) spawnArc();
      }

      // === Draw lightning arcs ===
      arcsRef.current = arcsRef.current.filter(a => a.life < a.maxLife);

      function drawArcPoints(pts: { r: number; a: number }[], width: number, color: string, alpha: number) {
        if (pts.length < 2) return;
        // glow pass
        ctx.beginPath();
        const first = pts[0];
        ctx.moveTo(cx + Math.cos(first.a) * first.r, cy + Math.sin(first.a) * first.r);
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i];
          ctx.lineTo(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width + 4;
        ctx.globalAlpha = alpha * 0.18;
        ctx.shadowBlur = 24;
        ctx.shadowColor = "#66ddff";
        ctx.stroke();
        ctx.shadowBlur = 0;

        // crisp pass
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(first.a) * first.r, cy + Math.sin(first.a) * first.r);
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i];
          ctx.lineTo(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#aaeeff";
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      for (const arc of arcsRef.current) {
        const t = arc.life / arc.maxLife;
        // fade in fast, hold, fade out
        const alpha = arc.width > 1.5
          ? (t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1.0) * 0.85
          : (t < 0.1 ? t / 0.1 : t > 0.65 ? (1 - t) / 0.35 : 1.0) * 0.7;

        drawArcPoints(arc.points, arc.width, arc.color, alpha);
        if (arc.branch) {
          drawArcPoints(arc.branch.points, arc.branch.width, arc.branch.color, alpha * 0.75);
        }
        arc.life++;
        if (arc.branch) arc.branch.life++;
      }

      // === Rotating energy sparks on ring ===
      const t = frame * 0.018;
      for (let i = 0; i < 6; i++) {
        const a = t + (i * Math.PI * 2) / 6;
        const pr = ringR + Math.sin(t * 3 + i) * 5;
        const px = cx + Math.cos(a) * pr;
        const py = cy + Math.sin(a) * pr;
        const sparkGrad = ctx.createRadialGradient(px, py, 0, px, py, 5);
        sparkGrad.addColorStop(0, "rgba(200, 240, 255, 0.8)");
        sparkGrad.addColorStop(1, "rgba(0, 150, 255, 0)");
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = sparkGrad;
        ctx.fill();
      }

      frame++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
