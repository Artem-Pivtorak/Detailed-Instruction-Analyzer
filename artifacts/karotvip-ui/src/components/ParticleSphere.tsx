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

// A single ripple traveling outward from an origin point on the sphere
interface Ripple {
  ox: number; oy: number; oz: number; // origin unit vector
  t0: number;        // birth time (in frame time units)
  amplitude: number; // max displacement as fraction of R
  speed: number;     // wavefront speed in rad/frame-time
  freq: number;      // spatial oscillations per radian
  sigma: number;     // wavefront width (gaussian)
}

function randomOnSphere(): [number, number, number] {
  const u = Math.random() * 2 - 1;
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(t), u, r * Math.sin(t)];
}

function dot3(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
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

    const pts: { nx: number; ny: number; nz: number }[] = [];

    for (let i = 0; i < COUNT; i++) {
      const yN = 1 - (i / (COUNT - 1)) * 2;
      const sinPhi = Math.sqrt(Math.max(0, 1 - yN * yN));
      const theta = goldenAngle * i;
      pts.push({
        nx: Math.cos(theta) * sinPhi,
        ny: yN,
        nz: Math.sin(theta) * sinPhi,
      });
    }

    // ── Ripple pool ─────────────────────────────────────────────────────────
    const MAX_RIPPLES = 9;
    const ripples: Ripple[] = [];

    function spawnRipple(t: number) {
      const [ox, oy, oz] = randomOnSphere();
      ripples.push({
        ox, oy, oz,
        t0: t,
        amplitude: 0.45 + Math.random() * 0.50,   // 0.45..0.95 — large deformations
        speed: 0.012 + Math.random() * 0.016,      // slower = more majestic
        freq: 3.0 + Math.random() * 5.0,           // fewer ripples = wider undulations
        sigma: 0.42 + Math.random() * 0.38,        // wider rings = bigger surface deformation
      });
    }

    // Seed initial ripples staggered in time
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const fakeT = -(Math.random() * 3.0); // stagger births into the past
      spawnRipple(fakeT);
    }

    // Global rotation — very slow drift
    let rxA = 0, ryA = 0, rzA = 0;
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      const t = frame * 0.007;

      // Very slow drift — shape deformation dominates over rotation
      rxA += 0.00018 + Math.sin(t * 0.04) * 0.00008;
      ryA += 0.00025 + Math.sin(t * 0.03) * 0.00010;
      rzA += 0.00008 + Math.sin(t * 0.05) * 0.00005;

      // Cull dead ripples (wavefront > π + 1.5 so they fully fade before removal)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const elapsed = t - ripples[i].t0;
        const wavefront = elapsed * ripples[i].speed;
        if (wavefront > Math.PI + 1.8) ripples.splice(i, 1);
      }

      // Keep the pool full
      while (ripples.length < MAX_RIPPLES) spawnRipple(t);

      // Global breathing — slow inhale/exhale of the whole mass
      const breathe = 0.14 * Math.sin(t * 0.32) + 0.07 * Math.sin(t * 0.55);

      // Project all points
      const projected: {
        sx: number; sy: number; sz: number;
        cr: number; cg: number; cb: number; ca: number;
        dr: number;
      }[] = [];

      for (let i = 0; i < COUNT; i++) {
        const p = pts[i];

        // ── Sum ripple displacements at this point ───────────────────────
        let totalDisp = breathe;

        for (const rip of ripples) {
          const d = dot3(p.nx, p.ny, p.nz, rip.ox, rip.oy, rip.oz);
          const angDist = Math.acos(Math.max(-1, Math.min(1, d))); // 0..PI
          const elapsed = t - rip.t0;
          const wavefront = elapsed * rip.speed;              // current ring radius (rad)

          // Distance from this particle to the current wavefront ring
          const distToWave = angDist - wavefront;

          // Gaussian envelope — only particles near the ring are displaced
          const env = Math.exp(-(distToWave * distToWave) / (2 * rip.sigma * rip.sigma));

          // Oscillation: sin creates the compress/expand ripple pattern
          const rippleOsc = Math.sin(rip.freq * distToWave);

          // Global fade: the ripple grows and fades as it crosses the sphere
          const fade = Math.pow(Math.sin(Math.min(Math.max(wavefront, 0), Math.PI)), 0.6);

          totalDisp += rip.amplitude * rippleOsc * env * fade;
        }

        // Allow large inward compression (0.28) and outward bulge — no inversion
        const disp = Math.max(0.28, 1.0 + totalDisp);

        let px = p.nx * disp * R;
        let py = p.ny * disp * R;
        let pz = p.nz * disp * R;

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

        // Color: tinted by depth and displacement
        // Compressed areas (inward) → cooler blues; protruding (outward) → warm pinks
        const dispMod = Math.max(0, Math.min(1, (totalDisp + 0.7) / 1.4));
        const colorV = (p.ny + 1) / 2;
        const blend = colorV * 0.50 + dispMod * 0.30 + (p.nx + 1) / 2 * 0.20;

        let cr, cg, cb;
        if (blend < 0.28) {
          const f = blend / 0.28;
          cr = Math.round(15 + f * 90);
          cg = Math.round(8 + f * 5);
          cb = Math.round(210 + f * 25);
        } else if (blend < 0.52) {
          const f = (blend - 0.28) / 0.24;
          cr = Math.round(105 + f * 120);
          cg = Math.round(13 - f * 8);
          cb = Math.round(235 - f * 60);
        } else if (blend < 0.76) {
          const f = (blend - 0.52) / 0.24;
          cr = Math.round(225 + f * 25);
          cg = Math.round(5 + f * 58);
          cb = Math.round(175 - f * 95);
        } else {
          const f = (blend - 0.76) / 0.24;
          cr = Math.round(250 + f * 5);
          cg = Math.round(63 + f * 140);
          cb = Math.round(80 - f * 30);
        }

        const shade = 0.15 + df * 0.85;
        const alpha = 0.20 + df * 0.80;
        const dotR = (0.55 + df * 1.38) * (size / 270);

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
