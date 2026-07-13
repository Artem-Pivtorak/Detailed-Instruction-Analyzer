import { useEffect, useId, useRef, useState } from "react";
import { GlassChromaticFilter } from "./GlassChromaticFilter";

/**
 * GlassLiquidPanel — the `.effect` element from the "glass displacement"
 * reference, ported 1:1: a frosted, saturated backdrop-filter surface using
 * the full chromatic-aberration SVG filter, plus the same layered
 * box-shadow rim-light (bright inset top-left, dark inset bottom-right,
 * soft ambient drop shadows).
 *
 * This is a from-scratch replacement, not a variant of GlassDock — no
 * sheen sweep, no separate edge-blur mask, no specular dome. Exactly what
 * the reference does and nothing else.
 */
interface GlassLiquidPanelProps {
  borderRadius?: number;
  frost?: number;
  saturation?: number;
  scale?: number;
  border?: number;
  lightness?: number;
  blend?: string;
  alpha?: number;
  blur?: number;
  chromaticR?: number;
  chromaticG?: number;
  chromaticB?: number;
  outputBlur?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassLiquidPanel({
  borderRadius = 16,
  frost = 0.05,
  saturation = 1.5,
  scale = -180,
  border = 0.07,
  lightness = 50,
  blend = "difference",
  alpha = 0.93,
  blur = 11,
  chromaticR = 0,
  chromaticG = 10,
  chromaticB = 20,
  outputBlur = 0.7,
  className,
  style,
}: GlassLiquidPanelProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `glass-liquid-${uid}`;
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
          : `blur(18px) saturate(${saturation})`,
        WebkitBackdropFilter: ready
          ? `url(#${filterId}) saturate(${saturation})`
          : `blur(18px) saturate(${saturation})`,
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
        <GlassChromaticFilter
          id={filterId}
          width={width}
          height={height}
          radius={r}
          scale={scale}
          border={border}
          lightness={lightness}
          blend={blend}
          alpha={alpha}
          blur={blur}
          chromaticR={chromaticR}
          chromaticG={chromaticG}
          chromaticB={chromaticB}
          outputBlur={outputBlur}
        />
      )}
    </div>
  );
}
