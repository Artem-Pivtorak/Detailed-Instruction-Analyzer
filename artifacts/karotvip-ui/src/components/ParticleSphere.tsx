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

export function ParticleSphere({ size = 240 }: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.37;

    // Fibonacci lattice for uniform distribution on sphere
    const COUNT = 1400;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Store base spherical coordinates and normals
    const pts: {
      theta: number;   // azimuthal (longitude-like)
      phi: number;     // elevation (latitude-like)
      nx: number; ny: number; nz: number;  // unit normal
    }[] = [];

    for (let i = 0; i < COUNT; i++) {
      const yN = 1 - (i / (COUNT - 1)) * 2;        // -1..1
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

    // Rotation state — very slow tumble
    let rxA = 0, ryA = 0, rzA = 0;

    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      const t = frame * 0.007;   // master time — slow

      // Slowly tumble on all axes
      rxA += 0.0015 + Math.sin(t * 0.11) * 0.0004;
      ryA += 0.0022 + Math.sin(t * 0.07) * 0.0005;
      rzA += 0.0008 + Math.sin(t * 0.15) * 0.0002;

      // ----- Ocean-wave displacement -----
      // Several sine waves propagate across the sphere surface using
      // the point's angular position (theta = longitude, phi = latitude).
      // Waves travel in different directions and speeds for organic look.
      const waveAmp = 0.18;   // max displacement fraction of R

      function oceanWave(theta: number, phi: number): number {
        // wave 1: slow rolling band from south-to-north
        const w1 = Math.sin(phi * 3.0 + t * 0.9) * 0.45;
        // wave 2: faster horizontal (east-west) ripple
        const w2 = Math.sin(theta * 2.5 - t * 1.3) * 0.30;
        // wave 3: diagonal swell
        const w3 = Math.sin(phi * 2.0 + theta * 1.5 + t * 0.7) * 0.20;
        // wave 4: small high-freq chop
        const w4 = Math.sin(phi * 5.0 - theta * 3.0 + t * 1.8) * 0.10;
        // wave 5: very slow deep swell
        const w5 = Math.sin(phi * 1.2 + theta * 0.8 - t * 0.4) * 0.25;
        // combine — result is -1..1
        return (w1 + w2 + w3 + w4 + w5) / (0.45 + 0.30 + 0.20 + 0.10 + 0.25);
      }

      // Project all points
      const projected: {
        sx: number; sy: number; sz: number;
        cr: number; cg: number; cb: number; ca: number;
        dr: number;
      }[] = [];

      for (let i = 0; i < COUNT; i++) {
        const p = pts[i];

        // Displacement along surface normal (in/out like ocean surface)
        const wave = oceanWave(p.theta, p.phi);
        const disp = 1.0 + wave * waveAmp;

        // 3D position before global rotation
        let px = p.nx * disp * R;
        let py = p.ny * disp * R;
        let pz = p.nz * disp * R;

        // Apply global slow rotation
        [px, py, pz] = rotateX(px, py, pz, rxA);
        [px, py, pz] = rotateY(px, py, pz, ryA);
        [px, py, pz] = rotateZ(px, py, pz, rzA);

        // Perspective projection (mild FOV)
        const fov = size * 2.2;
        const scale = fov / (fov + pz + R * 0.5);
        const sx = cx + px * scale;
        const sy = cy + py * scale;

        // Depth factor 0=back 1=front
        const df = Math.max(0, Math.min(1, (pz + R * 1.3) / (R * 2.6)));

        // Color: blend depends on spherical position + wave phase
        // Inspired by reference: deep blue/indigo bottom-left → purple mid → hot-pink/magenta top-right
        const colorU = (p.nx + 1) / 2;   // 0=left(blue) → 1=right(magenta)
        const colorV = (p.ny + 1) / 2;   // 0=bottom(blue) → 1=top(pink-yellow)
        // modulate with slow wave for shimmering colour shift
        const waveMod = (wave + 1) / 2;  // 0..1
        const blend = colorV * 0.55 + colorU * 0.25 + waveMod * 0.20;

        let cr, cg, cb;
        if (blend < 0.3) {
          const f = blend / 0.3;
          cr = Math.round(15 + f * 95);
          cg = Math.round(10 + f * 5);
          cb = Math.round(190 + f * 40);
        } else if (blend < 0.58) {
          const f = (blend - 0.3) / 0.28;
          cr = Math.round(110 + f * 110);
          cg = Math.round(15 - f * 10);
          cb = Math.round(230 - f * 50);
        } else if (blend < 0.82) {
          const f = (blend - 0.58) / 0.24;
          cr = Math.round(220 + f * 30);
          cg = Math.round(5 + f * 60);
          cb = Math.round(180 - f * 90);
        } else {
          const f = (blend - 0.82) / 0.18;
          cr = Math.round(250 + f * 5);
          cg = Math.round(65 + f * 120);
          cb = Math.round(90 - f * 40);
        }

        // Depth shading: back dots darker & smaller
        const shade = 0.18 + df * 0.82;
        const alpha = 0.25 + df * 0.75;
        const dotR = (0.6 + df * 1.7) * (size / 240);

        projected.push({
          sx, sy, sz: pz,
          cr: Math.round(cr * shade),
          cg: Math.round(cg * shade),
          cb: Math.round(cb * shade),
          ca: alpha,
          dr: dotR,
        });
      }

      // Back-to-front sort
      projected.sort((a, b) => a.sz - b.sz);

      // Draw
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.dr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.ca.toFixed(2)})`;
        ctx.fill();
      }

      // Soft outer glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.4);
      g.addColorStop(0, "rgba(160,0,220,0.00)");
      g.addColorStop(0.5, "rgba(120,0,200,0.055)");
      g.addColorStop(1, "rgba(60,0,160,0.00)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
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
