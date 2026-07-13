import { useMemo } from "react";

/**
 * GlassDistortionFilter — reusable "liquid glass" SVG filter.
 *
 * Builds a displacement map (red/blue gradients blended + blurred border,
 * same technique as the reference codepen "Glass Dock" example) and wires
 * it into a <filter> with a single feDisplacementMap. That's it — this
 * filter only does the glass *warp*.
 *
 * The graduated "sharp center → blurred edge" look is intentionally NOT
 * part of this SVG filter anymore. Chaining feGaussianBlur + feComposite
 * onto the same filter used for backdrop-filter on a large/wide element
 * (console frame, side panel) makes Chromium tile the backdrop-filter
 * render internally — the tile seams show up as the frame visually
 * "splitting into parts" with a bright seam down the middle. Keeping this
 * filter to just the displacement avoids that entirely; pair it with
 * <GlassEdgeBlur /> (plain CSS blur + mask-image, no SVG) for the edge
 * fade instead.
 *
 * NOTE: href/scale are computed at render time via useMemo and passed
 * directly as JSX attributes — NOT set post-mount through a ref +
 * useEffect. Chrome's backdrop-filter compositing path does not reliably
 * repaint when an SVG resource referenced by `backdrop-filter: url(#id)`
 * is mutated via setAttribute after first paint; the filter can end up
 * silently inert (no console error, no visible warp at all) even though
 * the markup looks correct. Baking the values into the initial render
 * output avoids that class of bug entirely.
 *
 * Usage: render once per target element with a unique `id`, then apply
 *   backdrop-filter: url(#id) ...;
 * on the element (or a layer inside it) that should get the glass warp.
 */
interface GlassDistortionFilterProps {
  id: string;
  width: number;
  height: number;
  radius?: number;
  scale?: number;
  border?: number;
  lightness?: number;
  blend?: string;
  alpha?: number;
  blur?: number;
}

export function GlassDistortionFilter({
  id,
  width,
  height,
  radius = 20,
  scale = -140,
  border = 0.07,
  lightness = 50,
  blend = "difference",
  alpha = 0.9,
  blur = 9,
}: GlassDistortionFilterProps) {
  const dispUri = useMemo(() => {
    if (!width || !height) return "";

    const b = Math.min(width, height) * (border * 0.5);

    // Displacement map: red(x)/blue(y) gradient-blend + blurred inner rect.
    const dispSvg = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="red-${id}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="blue-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="black"/>
        <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red-${id})"/>
        <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue-${id})" style="mix-blend-mode:${blend}"/>
        <rect x="${b}" y="${b}" width="${width - b * 2}" height="${height - b * 2}" rx="${radius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)"/>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(dispSvg)}`;
  }, [id, width, height, radius, border, lightness, blend, alpha, blur]);

  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        {/* Small, tight filter region (was -20%/140%) — a large region
            increases the chance Chromium splits the backdrop-filter
            render into tiles on a big element, which is what produced
            the visible seams. The displacement itself never needs to
            sample outside the element's own box, so 0%/100% is enough. */}
        <filter
          id={id}
          colorInterpolationFilters="sRGB"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          <feImage
            href={dispUri}
            x="0"
            y="0"
            width="100%"
            height="100%"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    </svg>
  );
}
