import { useEffect, useRef } from "react";

interface ParticleSphereProps {
  size?: number;
}

function rotateX(
  x: number,
  y: number,
  z: number,
  a: number,
): [number, number, number] {
  return [
    x,
    y * Math.cos(a) - z * Math.sin(a),
    y * Math.sin(a) + z * Math.cos(a),
  ];
}
function rotateY(
  x: number,
  y: number,
  z: number,
  a: number,
): [number, number, number] {
  return [
    x * Math.cos(a) + z * Math.sin(a),
    y,
    -x * Math.sin(a) + z * Math.cos(a),
  ];
}
function rotateZ(
  x: number,
  y: number,
  z: number,
  a: number,
): [number, number, number] {
  return [
    x * Math.cos(a) - y * Math.sin(a),
    x * Math.sin(a) + y * Math.cos(a),
    z,
  ];
}

interface Ripple {
  ox: number;
  oy: number;
  oz: number;
  t0: number;
  amplitude: number;
  speed: number;
  freq: number;
  sigma: number;
}

function randomOnSphere(): [number, number, number] {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(th), u, r * Math.sin(th)];
}

function dot3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): number {
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

    // Fibonacci lattice — dense, even distribution
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

    // Ripple pool — moderate amplitude to keep sphere shape intact
    const MAX_RIPPLES = 8;
    const ripples: Ripple[] = [];

    function spawnRipple(t: number, opts?: Partial<Ripple>) {
      const [ox, oy, oz] = randomOnSphere();
      ripples.push({
        ox,
        oy,
        oz,
        t0: t,
        amplitude: opts?.amplitude ?? 0.1 + Math.random() * 0.14,
        speed: opts?.speed ?? 0.008 + Math.random() * 0.01,
        freq: opts?.freq ?? 3.0 + Math.random() * 3.0,
        sigma: opts?.sigma ?? 0.28 + Math.random() * 0.32,
      });
    }

    // Seed staggered
    for (let i = 0; i < MAX_RIPPLES; i++) spawnRipple(-(Math.random() * 3.5));

    let rxA = 0,
      ryA = 0,
      rzA = 0;

    // ── Time accumulator with random speed drift ────────────────────────────
    // t accumulates with a livelier speed modulator for a more dynamic feel.
    let t = 0;
    let speedPhase = Math.random() * Math.PI * 2; // random start point

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // Speed modulator: layered sines create a gentle, slower tempo
      speedPhase += 0.004;
      const rawSpeed =
        1.0 +
        0.45 * Math.sin(speedPhase * 0.32) +
        0.22 * Math.sin(speedPhase * 0.68 + 1.0) +
        0.08 * Math.sin(speedPhase * 1.28 - 0.5);
      const speedMod = Math.max(0.4, Math.min(1.5, rawSpeed));

      // Accumulate time with variable speed (slower base)
      t += 0.004 * speedMod;

      // Subtle axis drift for a calmer rotation
      rxA += 0.00012 * speedMod;
      ryA += 0.00018 * speedMod;
      rzA += 0.00005 * speedMod;

      // Occasionally spawn an energetic burst for more dynamic movement
      // Rare gentle energetic bursts to keep things interesting
      if (Math.random() < 0.006) {
        spawnRipple(t, {
          amplitude: 0.22 + Math.random() * 0.18,
          speed: 0.016 + Math.random() * 0.012,
          freq: 4.5 + Math.random() * 3.5,
          sigma: 0.18 + Math.random() * 0.18,
        });
      }

      // Cull dead ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        if ((t - ripples[i].t0) * ripples[i].speed > Math.PI + 1.6)
          ripples.splice(i, 1);
      }
      while (ripples.length < MAX_RIPPLES) spawnRipple(t);

      // Very subtle global breathing — keeps sphere shape, just a light pulse
      const breathe = 0.05 * Math.sin(t * 0.38) + 0.025 * Math.sin(t * 0.62);

      const projected: {
        sx: number;
        sy: number;
        sz: number;
        cr: number;
        cg: number;
        cb: number;
        ca: number;
        dr: number;
      }[] = [];

      for (let i = 0; i < COUNT; i++) {
        const p = pts[i];

        // Sum surface ripple displacements
        let totalDisp = breathe;

        for (const rip of ripples) {
          const d = dot3(p.nx, p.ny, p.nz, rip.ox, rip.oy, rip.oz);
          const angDist = Math.acos(Math.max(-1, Math.min(1, d)));
          const elapsed = t - rip.t0;
          const wavefront = elapsed * rip.speed;
          const distToWave = angDist - wavefront;
          const env = Math.exp(
            -(distToWave * distToWave) / (2 * rip.sigma * rip.sigma),
          );
          const rippleOsc = Math.sin(rip.freq * distToWave);
          const fade = Math.pow(
            Math.sin(Math.min(Math.max(wavefront, 0), Math.PI)),
            0.55,
          );
          totalDisp += rip.amplitude * rippleOsc * env * fade;
        }

        // Clamp: sphere stays recognisably round — max ±30% deformation
        const disp = Math.max(0.7, Math.min(1.3, 1.0 + totalDisp));

        let px = p.nx * disp * R;
        let py = p.ny * disp * R;
        let pz = p.nz * disp * R;

        [px, py, pz] = rotateX(px, py, pz, rxA);
        [px, py, pz] = rotateY(px, py, pz, ryA);
        [px, py, pz] = rotateZ(px, py, pz, rzA);

        // Wavy bending: milder, slower undulations for a calmer organic look
        const waveAmpBase = 0.03; // base amplitude (fraction of R)
        const waveSpeed = 1.0 + 0.8 * Math.sin(t * 0.6 + p.nx * 0.9);
        const waveX =
          waveAmpBase * Math.sin(p.ny * 4.0 + t * waveSpeed + p.nz * 1.2);
        const waveY =
          waveAmpBase *
          Math.cos(p.nx * 3.5 + t * (waveSpeed * 0.9) - p.nz * 1.0);
        px += waveX * R;
        py += waveY * R;

        const fov = size * 2.0;
        const scale = fov / (fov + pz + R * 0.4);
        const sx = cx + px * scale;
        const sy = cy + py * scale;

        const df = Math.max(0, Math.min(1, (pz + R * 1.4) / (R * 2.8)));

        // Color: displacement-modulated tint on top of positional gradient
        const dispMod = Math.max(0, Math.min(1, (totalDisp + 0.35) / 0.7));
        const colorV = (p.ny + 1) / 2;
        const blend = colorV * 0.5 + dispMod * 0.28 + ((p.nx + 1) / 2) * 0.22;

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
        const alpha = 0.2 + df * 0.8;
        const dotPulse = 1 + 0.03 * Math.sin(t * 4.0 + i);
        const dotR = (0.6 + df * 1.28) * (size / 270) * dotPulse;

        projected.push({
          sx,
          sy,
          sz: pz,
          cr: Math.round(cr * shade),
          cg: Math.round(cg * shade),
          cb: Math.round(cb * shade),
          ca: alpha,
          dr: dotR,
        });
      }

      projected.sort((a, b) => a.sz - b.sz);

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.dr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.ca.toFixed(2)})`;
        ctx.fill();
      }

      // Ambient glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.45);
      g.addColorStop(0, "rgba(150,0,210,0.00)");
      g.addColorStop(0.5, "rgba(110,0,190,0.05)");
      g.addColorStop(1, "rgba(60,0,150,0.00)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

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
