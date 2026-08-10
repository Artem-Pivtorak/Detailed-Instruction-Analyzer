import { useEffect, useState, type CSSProperties } from "react";

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
  /**
   * If set, the glass layer starts invisible and fades in (via CSS
   * animation) after this many ms. Use this when GlassDock sits inside an
   * element that plays a droplet-* entrance transform - see the comment on
   * `glass-dock-reveal` in index.css for why this is necessary.
   */
  revealDelayMs?: number;
}

export function GlassDock({
  borderRadius = 16,
  className,
  style,
  disableEdge = false,
  overlayStyle,
  revealDelayMs,
}: GlassDockProps) {
  const r = borderRadius;

  // Plain JS-timed opacity transition instead of a CSS @keyframes animation:
  // an *animated* reveal on this wrapper turned out to trigger the exact
  // same Chromium backdrop-filter-during-animation failure we're routing
  // around in the first place. A one-shot state flip + CSS `transition`
  // (not `animation`) after the ancestor has been still for a bit doesn't
  // have that problem.
  const [revealed, setRevealed] = useState(revealDelayMs == null);
  useEffect(() => {
    if (revealDelayMs == null) return;
    const t = setTimeout(() => setRevealed(true), revealDelayMs);
    return () => clearTimeout(t);
  }, [revealDelayMs]);

  const revealStyle: CSSProperties =
    revealDelayMs != null
      ? { opacity: revealed ? 1 : 0, transition: "opacity 150ms ease-out" }
      : {};

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
        ...revealStyle,
        ...style,
      }}
    >
      <div
        className="liquid-glass--bend"
        style={{
          borderRadius: r,
          filter: "url(#glass-blur)",
          // backdrop-filter set inline (not via the .liquid-glass--bend CSS
          // class) because the production CSS minifier (Lightning CSS, via
          // Tailwind v4's Vite plugin) was silently dropping the unprefixed
          // `backdrop-filter: blur(3px)` declaration from that class in the
          // built stylesheet - only `-webkit-backdrop-filter` survived, and
          // current Chromium no longer treats that prefix as an alias for
          // the standard property, so the glass warp rendered as nothing in
          // every production build (packaged exe AND plain browser), while
          // still working from the unminified Vite dev server. Inline
          // styles bypass the stylesheet minifier entirely, so this can't
          // regress the same way again.
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          // Force this element onto its own GPU-composited layer up front
          // (rather than relying on `will-change` as just a hint), and give
          // it its own stacking/backdrop-root context. Attempting to get
          // Chromium to keep compositing backdrop-filter+filter correctly
          // while an ANCESTOR is mid CSS-transform animation - this is the
          // actual fix attempt for that, as opposed to the revealDelayMs
          // workaround below (which hides the seam instead of fixing it).
          transform: "translateZ(0)",
          isolation: "isolate",
          willChange: "backdrop-filter, filter",
        }}
      />
      <div className="liquid-glass--face" style={{ borderRadius: r, ...overlayStyle }} />
      {!disableEdge && <div className="liquid-glass--edge" style={{ borderRadius: r }} />}
    </div>
  );
}
