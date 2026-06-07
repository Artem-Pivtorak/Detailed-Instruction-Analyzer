import { useEffect, useRef } from "react";

interface HoneycombBackgroundProps {
  color?: string;
  glowColor?: string;
}

export function HoneycombBackground({ 
  color = "rgba(160, 50, 255, 0.15)", 
  glowColor = "rgba(168, 85, 247, 0.8)" 
}: HoneycombBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const hexSize = 30;
    const hexWidth = hexSize * Math.sqrt(3);
    const hexHeight = hexSize * 2;
    const columns = 0;
    const rows = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Use scrollHeight to cover the entire scrollable area
        width = parent.clientWidth;
        height = Math.max(parent.clientHeight, parent.scrollHeight);
        canvas.width = width;
        canvas.height = height;
        canvas.style.height = `${height}px`;
      }
    };

    window.addEventListener("resize", resize);
    // Initial resize after a small delay to ensure parent is rendered
    setTimeout(resize, 50);

    const hexSeed = Math.random();
    const shouldDraw = (r: number, c: number) => {
      // Simple pseudo-random check based on coordinates
      const val = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      return (val - Math.floor(val)) > 0.75; // Only ~25% of hexes
    };

    const drawHex = (x: number, y: number, size: number, pulseAttr: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + (size + pulseAttr * 1.5) * Math.cos(angle);
        const py = y + (size + pulseAttr * 1.5) * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const colGap = hexWidth;
      const rowGap = hexHeight * 0.75;
      const cols = Math.ceil(width / colGap) + 1;
      const rows = Math.ceil(height / rowGap) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!shouldDraw(r, c)) continue;

          let x = c * colGap;
          if (r % 2 === 1) x += colGap / 2;
          const y = r * rowGap;

          // Pulse effect based on Y position and time (moving top to bottom)
          const pulseY = (y / height - time * 0.3) % 1; 
          const normalizedPulseY = pulseY < 0 ? pulseY + 1 : pulseY;
          const pulseIntensity = Math.max(0, 1 - Math.abs(normalizedPulseY - 0.5) * 10); 
          
          // No vibration/wave as requested

          // Drawing the hex
          ctx.lineWidth = 0.8 + pulseIntensity * 1.5;
          ctx.strokeStyle = pulseIntensity > 0.1 
            ? `rgba(168, 85, 247, ${0.05 + pulseIntensity * 0.5})` 
            : `rgba(160, 50, 255, 0.1)`;
          
          if (pulseIntensity > 0.3) {
            ctx.shadowBlur = 8 * pulseIntensity;
            ctx.shadowColor = glowColor;
          } else {
            ctx.shadowBlur = 0;
          }

          drawHex(x, y, hexSize - 4, pulseIntensity);
          ctx.stroke();

          if (pulseIntensity > 0.8) {
            ctx.fillStyle = `rgba(168, 85, 247, ${pulseIntensity * 0.15})`;
            ctx.fill();
          }
        }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [color, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}
