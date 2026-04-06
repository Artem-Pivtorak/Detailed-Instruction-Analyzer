import { useEffect, useRef } from "react";

interface LightningOrbProps {
  size?: number;
}

interface LightningBolt {
  points: { x: number; y: number }[];
  opacity: number;
  width: number;
  color: string;
  life: number;
  maxLife: number;
}

export function LightningOrb({ size = 220 }: LightningOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltsRef = useRef<LightningBolt[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    function randomBetween(a: number, b: number) {
      return a + Math.random() * (b - a);
    }

    function generateLightning(ox: number, oy: number, tx: number, ty: number, roughness: number, depth: number): { x: number; y: number }[] {
      if (depth === 0) return [{ x: ox, y: oy }, { x: tx, y: ty }];
      const mx = (ox + tx) / 2 + randomBetween(-roughness, roughness);
      const my = (oy + ty) / 2 + randomBetween(-roughness, roughness);
      const left = generateLightning(ox, oy, mx, my, roughness * 0.6, depth - 1);
      const right = generateLightning(mx, my, tx, ty, roughness * 0.6, depth - 1);
      return [...left, ...right];
    }

    function spawnBolt() {
      const angle = Math.random() * Math.PI * 2;
      const px = cx + Math.cos(angle) * r * 0.1;
      const py = cy + Math.sin(angle) * r * 0.1;
      const endAngle = angle + randomBetween(-Math.PI * 0.8, Math.PI * 0.8);
      const endR = r * randomBetween(1.0, 1.6);
      const ex = cx + Math.cos(endAngle) * endR;
      const ey = cy + Math.sin(endAngle) * endR;
      const roughness = size * randomBetween(0.08, 0.18);
      const points = generateLightning(px, py, ex, ey, roughness, 4);
      const colors = ["#00cfff", "#60eaff", "#a8f5ff", "#ffffff", "#80d0ff"];
      boltsRef.current.push({
        points,
        opacity: randomBetween(0.7, 1.0),
        width: randomBetween(0.5, 1.8),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: randomBetween(8, 20),
      });
    }

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, size, size);

      // outer glow ring
      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.5);
      grad.addColorStop(0, "rgba(0, 200, 255, 0.55)");
      grad.addColorStop(0.4, "rgba(0, 150, 255, 0.18)");
      grad.addColorStop(0.7, "rgba(0, 100, 200, 0.06)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // core orb
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      coreGrad.addColorStop(0, "rgba(220, 245, 255, 0.95)");
      coreGrad.addColorStop(0.3, "rgba(100, 210, 255, 0.7)");
      coreGrad.addColorStop(0.6, "rgba(0, 160, 255, 0.4)");
      coreGrad.addColorStop(1, "rgba(0, 80, 200, 0.1)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // ring border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100, 230, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 180, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // spawn bolts
      if (frame % 4 === 0 && boltsRef.current.length < 15) {
        spawnBolt();
        if (Math.random() > 0.5) spawnBolt();
      }

      // draw bolts
      boltsRef.current = boltsRef.current.filter(b => b.life < b.maxLife);
      for (const bolt of boltsRef.current) {
        const alpha = bolt.opacity * (1 - bolt.life / bolt.maxLife);
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
          ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
        }
        ctx.strokeStyle = bolt.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = bolt.width;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00cfff";
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        bolt.life++;
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
