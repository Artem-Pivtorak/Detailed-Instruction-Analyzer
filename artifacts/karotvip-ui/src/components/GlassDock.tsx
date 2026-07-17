import type { CSSProperties } from "react";

/**
 * GlassDock — liquid glass panel, exact copy of the reference "Liquid Glass
 * Menu" codepen's filter mechanism (`feTurbulence` + `feDisplacementMap` via
 * the shared `#glass-blur` filter mounted once by `<GlassBlurDefs />` at the
 * app root) plus its --bend / --face / --edge layer structure.
 *
 * Replaces the previous feImage-based displacement approach
 * (GlassDistortionFilter.tsx / GlassEdgeBlur.tsx), which existed
 * specifically to route around a Chromium backdrop-filter tiling bug that
 * this feTurbulence technique is known to trigger on wide/large elements.
 * Swapped back in per explicit request — if a seam/tiling artifact shows up
 * on the console frame or side panel, that's the known failure mode to
 * check first (see git history / GlassDistortionFilter.tsx comments for
 * the previous fix).
 */
interface GlassDockProps {
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
  disableEdge?: boolean;
  overlayStyle?: CSSProperties;
}

export function GlassDock({
  borderRadius = 16,
  className,
  style,
  disableEdge = false,
  overlayStyle,
}: GlassDockProps) {
  const r = borderRadius;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: r,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    >
      <div className="liquid-glass--bend" style={{ borderRadius: r }} />
      <div className="liquid-glass--face" style={{ borderRadius: r, ...overlayStyle }} />
      {!disableEdge && <div className="liquid-glass--edge" style={{ borderRadius: r }} />}
    </div>
  );
}
