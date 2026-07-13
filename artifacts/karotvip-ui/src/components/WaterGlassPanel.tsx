import { useEffect, useId, useRef, useState } from "react";
import { WaterBulgeFilter } from "./WaterBulgeFilter";

/**
 * WaterGlassPanel — a real convex lens ("water droplet") glass surface.
 * Sizes the bulge map to the panel's actual box (ResizeObserver, same
 * pattern as GlassDock) and applies it as backdrop-filter, plus the rim
 * light box-shadow that reads as a glass edge.
 *
 * Unlike GlassLiquidPanel/GlassDock, this does not add any decorative
 * background of its own — how visible the bend looks depends entirely on
 * what's actually behind the panel (that's how real glass/water works
 * too: no contrast behind it, nothing to see bending).
 */
interface WaterGlassPanelProps {
  borderRadius?: number;
  frost?: number;
  saturation?: number;
  scale?: number;
  exponent?: number;
  preBlur?: number;
  outputBlur?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WaterGlassPanel({
  borderRadius = 16,
  frost = 0.04,
  saturation = 1.4,
  scale = 46,
  exponent = 2.6,
  preBlur = 0,
  outputBlur = 0.5,
  className,
  style,
}: WaterGlassPanelProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `water-bulge-${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const r = borderRadius;
  const { width, height } = size;
  const ready = width > 0 && height > 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: r,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        background: `hsl(0 0% 0% / ${frost})`,
        backdropFilter: ready
          ? `url(#${filterId}) saturate(${saturation})`
          : `blur(6px) saturate(${saturation})`,
        WebkitBackdropFilter: ready
          ? `url(#${filterId}) saturate(${saturation})`
          : `blur(6px) saturate(${saturation})`,
        boxShadow: [
          "0 0 2px 1px rgba(255,255,255,0.10) inset",
          "0 0 10px 4px rgba(255,255,255,0.07) inset",
          "0 4px 16px rgba(0,0,0,0.35)",
          "0 8px 24px rgba(0,0,0,0.3)",
          "0 16px 56px rgba(0,0,0,0.25)",
          "0 4px 16px rgba(0,0,0,0.12) inset",
          "0 8px 24px rgba(0,0,0,0.12) inset",
          "0 16px 56px rgba(0,0,0,0.12) inset",
        ].join(", "),
        ...style,
      }}
    >
      {ready && (
        <WaterBulgeFilter
          id={filterId}
          width={width}
          height={height}
          scale={scale}
          exponent={exponent}
          preBlur={preBlur}
          outputBlur={outputBlur}
        />
      )}
    </div>
  );
}
