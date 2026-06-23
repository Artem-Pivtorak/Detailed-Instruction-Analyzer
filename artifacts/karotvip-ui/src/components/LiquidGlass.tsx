import { useId, memo } from "react";

interface LiquidGlassProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: number | string;
}

/**
 * Liquid Glass — Performance-Optimized Version.
 */
export const LiquidGlass = memo(function LiquidGlass({
  width = "100%",
  height = "100%",
  className,
  style,
  borderRadius = 32,
}: LiquidGlassProps) {
  const r = typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        borderRadius: r,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
        ...style,
      }}
    >
      {/* ── Layer 1: Frosted Glass Backdrop (GPU-accelerated) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          zIndex: 0,
        }}
      />

      {/* ── Layer 2: Light Glass Tint ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background:
            "linear-gradient(145deg, rgba(20,80,180,0.10) 0%, rgba(0,20,60,0.18) 100%)",
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Specular Top Highlight ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background:
            "radial-gradient(120% 70% at 50% -5%, rgba(255,255,255,0.20) 0%, transparent 50%)",
          zIndex: 2,
        }}
      />

      {/* ── Layer 4: Inner Soft Glow ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          boxShadow:
            "inset 0 0 40px rgba(0,180,255,0.12), inset 0 3px 16px rgba(80,160,255,0.18)",
          zIndex: 3,
        }}
      />

      {/* ── Layer 5: Crisp Refractive Edges ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          border: "1px solid rgba(100,220,255,0.30)",
          boxShadow:
            "inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(0,0,0,0.30)",
          zIndex: 4,
        }}
      />
    </div>
  );
});
