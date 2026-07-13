/**
 * LiquidGlassAccent — ports the "liquid glass" toggle look (goo-filter SVG
 * blob fusion + specular glass shine) onto rectangular UI surfaces.
 *
 * Reference: the liquid toggle's `.indicator__liquid .shadow` (specular rim
 * light) and its `.liquids` container (`.liquid__shadow` + `.liquid__track`
 * fused through the `#goo` SVG filter so two separate shapes read as one
 * continuous blob of liquid).
 *
 * `LiquidGooDefs` renders the shared `#liquid-goo` SVG filter once — mount it
 * a single time near the root (App.tsx already does this). `LiquidGlassAccent`
 * is the per-surface overlay: drop it inside any `position: relative`
 * container (after the glass backdrop, before the readable content) and it
 * paints the specular shine + a pair of slow-drifting goo-fused highlight
 * blobs along the top edge.
 */

interface LiquidGooDefsProps {
  id?: string;
}

export function LiquidGooDefs({ id = "liquid-goo" }: LiquidGooDefsProps) {
  return (
    <svg
      className="sr-only"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 24 -12
            "
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

interface LiquidGlassAccentProps {
  /** Match the host element's border-radius so the shine hugs the same edge. */
  borderRadius?: number;
  /** Tint for the drifting goo blobs — pick a color from the existing neon palette. */
  color?: string;
  /** Set false to skip the drifting blobs and keep only the specular shine. */
  animated?: boolean;
}

export function LiquidGlassAccent({
  borderRadius = 20,
  color = "rgba(0, 207, 255, 0.5)",
  animated = true,
}: LiquidGlassAccentProps) {
  return (
    <>
      {/* Specular glass shine — mirrors .indicator__liquid .shadow */}
      <div className="liquid-shine" style={{ borderRadius }} />

      {/* Gooey drifting highlights — mirrors .liquids (goo-fused shadow + track) */}
      {animated && (
        <div className="liquid-goo-layer" style={{ borderRadius }}>
          <div
            className="liquid-goo-blob liquid-goo-blob--a"
            style={{ background: color }}
          />
          <div
            className="liquid-goo-blob liquid-goo-blob--b"
            style={{ background: color }}
          />
        </div>
      )}
    </>
  );
}
