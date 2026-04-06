import { useEffect, useRef } from "react";

interface ParticleSphereProps {
  size?: number;
}

// Simple smooth noise helper
function smoothNoise(x: number, y: number, z: number): number {
  const n = Math.sin(x * 1.7 + y * 3.1 + z * 2.3)
    + Math.sin(x * 4.2 - y * 1.9 + z * 3.7) * 0.5
    + Math.sin(x * 2.8 + y * 5.1 - z * 1.4) * 0.25
    + Math.sin(x * 6.3 - y * 2.7 + z * 4.9) * 0.125;
  return n / 1.875;
}

// Rotate a 3D point by Euler angles
function rotate(
  x: number, y: number, z: number,
  rx: number, ry: number, rz: number
): [number, number, number] {
  // Rotate around X
  let y1 = y * Math.cos(rx) - z * Math.sin(rx);
  let z1 = y * Math.sin(rx) + z * Math.cos(rx);
  // Rotate around Y
  let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  // Rotate around Z
  let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
  let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
  return [x3, y3, z2];
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
    const R = size * 0.36;

    // Generate base sphere points using Fibonacci lattice for even distribution
    const COUNT = 1200;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const basePoints: { theta: number; phi: number; nx: number; ny: number; nz: number }[] = [];

    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const nx = Math.cos(theta) * r;
      const ny = y;
      const nz = Math.sin(theta) * r;
      basePoints.push({ theta, phi: Math.asin(y), nx, ny, nz });
    }

    let frame = 0;
    // Rotation angles that drift over time
    let rx = 0, ry = 0, rz = 0;
    // Rotation velocities (slow tumbling)
    let vrx = 0.0028, vry = 0.0044, vrz = 0.0016;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      const t = frame * 0.012;

      // Slowly drift rotation speeds for organic feel
      vrx += (Math.sin(t * 0.13) * 0.0002);
      vry += (Math.sin(t * 0.09) * 0.0003);
      vrz += (Math.sin(t * 0.17) * 0.0001);
      rx += vrx;
      ry += vry;
      rz += vrz;

      // Build projected points with depth & noise displacement
      const projected: {
        sx: number; sy: number; sz: number;
        r: number; g: number; b: number; a: number;
        dotR: number;
      }[] = [];

      for (let i = 0; i < COUNT; i++) {
        const bp = basePoints[i];

        // Noise displacement — creates the bubbling/morphing surface
        const noiseVal = smoothNoise(
          bp.nx * 1.8 + Math.sin(t * 0.6) * 0.4,
          bp.ny * 1.8 + Math.cos(t * 0.5) * 0.4,
          bp.nz * 1.8 + Math.sin(t * 0.7 + 1.1) * 0.4
        );
        const displacement = 1.0 + noiseVal * 0.22;

        const px = bp.nx * displacement * R;
        const py = bp.ny * displacement * R;
        const pz = bp.nz * displacement * R;

        const [rx3, ry3, rz3] = rotate(px, py, pz, rx, ry, rz);

        // Perspective projection
        const fov = size * 1.8;
        const depth = fov / (fov + rz3 + R);
        const sx = cx + rx3 * depth;
        const sy = cy + ry3 * depth;

        // Depth factor: 0 = back, 1 = front
        const depthFactor = (rz3 + R) / (2 * R);
        const normalizedDepth = Math.max(0, Math.min(1, depthFactor));

        // Color based on position (like the reference: pink-magenta top-right, purple-blue lower-left)
        // Use rotated normal to determine color zone
        const colorT = (ry3 / R + 1) / 2; // 0=bottom(blue) to 1=top(pink)
        const colorS = (rx3 / R + 1) / 2; // 0=left(purple) to 1=right(magenta)

        // Gradient: blue(0,50,200) → purple(120,30,200) → magenta(220,0,180) → pink/yellow(255,180,50)
        let r, g, b;
        const blend = colorT * 0.65 + colorS * 0.35;
        if (blend < 0.33) {
          const t2 = blend / 0.33;
          r = Math.round(20 + t2 * 100);
          g = Math.round(30 + t2 * 10);
          b = Math.round(200 + t2 * 20);
        } else if (blend < 0.66) {
          const t2 = (blend - 0.33) / 0.33;
          r = Math.round(120 + t2 * 100);
          g = Math.round(40 - t2 * 30);
          b = Math.round(220 - t2 * 40);
        } else {
          const t2 = (blend - 0.66) / 0.34;
          r = Math.round(220 + t2 * 35);
          g = Math.round(10 + t2 * 170);
          b = Math.round(180 - t2 * 130);
        }

        // Back-face shading: dots on back hemisphere are darker/smaller
        const shade = 0.2 + normalizedDepth * 0.8;
        const alpha = 0.3 + normalizedDepth * 0.7;
        const dotR = (0.8 + normalizedDepth * 1.4) * (size / 240);

        projected.push({
          sx, sy, sz: rz3,
          r: Math.round(r * shade),
          g: Math.round(g * shade),
          b: Math.round(b * shade),
          a: alpha,
          dotR,
        });
      }

      // Sort back-to-front for correct depth rendering
      projected.sort((a, b) => a.sz - b.sz);

      // Draw all dots
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a.toFixed(2)})`;
        ctx.fill();
      }

      // Subtle outer ambient glow
      const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.35);
      glowGrad.addColorStop(0, "rgba(180, 0, 200, 0.00)");
      glowGrad.addColorStop(0.6, "rgba(140, 0, 220, 0.06)");
      glowGrad.addColorStop(1, "rgba(80, 0, 180, 0.00)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
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
