import { useEffect, useRef } from "react";

interface ParticleSphereProps {
  size?: number;
}

function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}
function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}
function rotateZ(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
}

export function ParticleSphere({ size = 270 }: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.34;

    // ── Fibonacci lattice — dense uniform distribution ──────────────────────
    const COUNT = 2200;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const pts: {
      theta: number;
      phi: number;
      nx: number; ny: number; nz: number;
    }[] = [];

    for (let i = 0; i < COUNT; i++) {
      const yN = 1 - (i / (COUNT - 1)) * 2;
      const sinPhi = Math.sqrt(Math.max(0, 1 - yN * yN));
      const theta = goldenAngle * i;
      pts.push({
        theta,
        phi: Math.asin(yN),
        nx: Math.cos(theta) * sinPhi,
        ny: yN,
        nz: Math.sin(theta) * sinPhi,
      });
    }

    // Slow global tumble
    let rxA = 0, ryA = 0, rzA = 0;
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      const t = frame * 0.007;

      // Slowly drift tumble speed — organic feel
      rxA += 0.0013 + Math.sin(t * 0.09) * 0.0005;
      ryA += 0.0020 + Math.sin(t * 0.07) * 0.0006;
      rzA += 0.0007 + Math.sin(t * 0.13) * 0.0003;

      // ── Turbulent current waves ────────────────────────────────────────────
      // Instead of simple swells, we compose several waves that interfere
      // non-linearly, creating current-like streams across the sphere surface.
      const AMP = 0.60;   // total max displacement (fraction of R)

      function turbulence(theta: number, phi: number): number {
        // ---- Primary currents (slow large flow bands) ----
        const c1 = Math.sin(phi * 1.6 + theta * 0.4 + t * 0.55) * 0.38;
        const c2 = Math.sin(phi * 0.8 - theta * 1.2 + t * 0.42) * 0.32;

        // ---- Secondary ripples (mid-speed crossing streams) ----
        const r1 = Math.sin(phi * 3.5 + theta * 1.8 - t * 0.95) * 0.22;
        const r2 = Math.sin(phi * 2.8 - theta * 2.4 + t * 1.10) * 0.18;

        // ---- Interference (multiply two waves → pinch/bulge nodes) ----
        const i1 = Math.sin(phi * 2.1 + t * 0.72) * Math.cos(theta * 1.5 - t * 0.68) * 0.28;
        const i2 = Math.cos(phi * 1.3 - t * 0.50) * Math.sin(theta * 2.8 + t * 0.82) * 0.22;

        // ---- Fast surface chop (high frequency tremors) ----
        const ch1 = Math.sin(phi * 6.0 - theta * 3.5 + t * 1.80) * 0.10;
        const ch2 = Math.sin(phi * 5.2 + theta * 4.1 - t * 2.10) * 0.08;

        // ---- Deep mega-swell (slow global breathing) ----
        const ms = Math.sin(phi * 0.6 + theta * 0.3 - t * 0.28) * 0.40;

        const raw = c1 + c2 + r1 + r2 + i1 + i2 + ch1 + ch2 + ms;
        // Normalise to -1..1 (sum of weights = 1.78)
        return raw / 1.78;
      }

      // Project all points
      const projected: {
        sx: number; sy: number; sz: number;
        cr: number; cg: number; cb: number; ca: number;
        dr: number;
      }[] = [];

      for (let i = 0; i < COUNT; i++) {
        const p = pts[i];

        // Displacement along the surface normal
        const wave = turbulence(p.theta, p.phi);
        const disp = 1.0 + wave * AMP;

        let px = p.nx * disp * R;
        let py = p.ny * disp * R;
        let pz = p.nz * disp * R;

        // Global rotation
        [px, py, pz] = rotateX(px, py, pz, rxA);
        [px, py, pz] = rotateY(px, py, pz, ryA);
        [px, py, pz] = rotateZ(px, py, pz, rzA);

        // Perspective projection
        const fov = size * 2.0;
        const scale = fov / (fov + pz + R * 0.4);
        const sx = cx + px * scale;
        const sy = cy + py * scale;

        // Depth factor 0=back 1=front
        const df = Math.max(0, Math.min(1, (pz + R * 1.4) / (R * 2.8)));

        // Color: blue/indigo → purple → magenta → warm pink, modulated by wave
        const colorV = (p.ny + 1) / 2;
        const colorU = (p.nx + 1) / 2;
        const waveMod = (wave + 1) / 2;
        const blend = colorV * 0.52 + colorU * 0.24 + waveMod * 0.24;

        let cr, cg, cb;
        if (blend < 0.28) {
          const f = blend / 0.28;
          cr = Math.round(18 + f * 90);
          cg = Math.round(8 + f * 5);
          cb = Math.round(195 + f * 35);
        } else if (blend < 0.54) {
          const f = (blend - 0.28) / 0.26;
          cr = Math.round(108 + f * 115);
          cg = Math.round(13 - f * 8);
          cb = Math.round(230 - f * 55);
        } else if (blend < 0.78) {
          const f = (blend - 0.54) / 0.24;
          cr = Math.round(223 + f * 28);
          cg = Math.round(5 + f * 55);
          cb = Math.round(175 - f * 95);
        } else {
          const f = (blend - 0.78) / 0.22;
          cr = Math.round(251 + f * 4);
          cg = Math.round(60 + f * 130);
          cb = Math.round(80 - f * 30);
        }

        // Depth shading
        const shade = 0.15 + df * 0.85;
        const alpha = 0.22 + df * 0.78;
        // Tighten dot size slightly for denser look
        const dotR = (0.55 + df * 1.40) * (size / 270);

        projected.push({
          sx, sy, sz: pz,
          cr: Math.round(cr * shade),
          cg: Math.round(cg * shade),
          cb: Math.round(cb * shade),
          ca: alpha,
          dr: dotR,
        });
      }

      // Back-to-front
      projected.sort((a, b) => a.sz - b.sz);

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.dr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.ca.toFixed(2)})`;
        ctx.fill();
      }

      // Ambient outer glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.45);
      g.addColorStop(0, "rgba(150,0,210,0.00)");
      g.addColorStop(0.5, "rgba(110,0,190,0.05)");
      g.addColorStop(1, "rgba(60,0,150,0.00)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

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
