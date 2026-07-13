import { useMemo } from "react";

/**
 * WaterBulgeFilter — a real convex "water droplet" lens, not an edge
 * bevel. Builds a radial *vector* displacement map (canvas-generated):
 * every pixel gets a 2D vector pointing outward from the panel's center,
 * with magnitude growing from 0 at the center to `scale` at the edge
 * (raised to `exponent`, so the curve stays flat in the middle and steepens
 * near the rim — a real lens profile, not a linear ramp). Fed into a
 * single feDisplacementMap, this bends the backdrop the way a drop of
 * water or a convex lens actually does: magnified/warped everywhere, most
 * strongly toward the edges.
 *
 * Why canvas instead of an SVG radial-gradient map: a gradient map only
 * encodes a scalar (brightness), which after xChannelSelector/
 * yChannelSelector split gives you a *radially symmetric-in-one-axis*
 * warp at best — it can't represent "push right here, push up-and-right
 * there" the way a real per-pixel outward vector field can. The canvas
 * map bakes R = x-direction, G = y-direction directly, pixel by pixel.
 *
 * Reliability notes (see GlassDistortionFilter.tsx / GlassEdgeBlur.tsx in
 * this folder for the full history):
 * - The map is built **synchronously inside useMemo during render** and
 *   baked straight into the `href` JSX attribute — never mutated via
 *   `ref.current.setAttribute(...)` after mount. Chrome's backdrop-filter
 *   compositing path does not reliably repaint when an SVG resource
 *   referenced by `backdrop-filter: url(#id)` changes after first paint;
 *   this sidesteps that class of bug entirely (this project's old
 *   `BulgeLensFilter.tsx` used the post-mount-mutation pattern — don't
 *   copy that one).
 * - Filter graph is just feImage → feDisplacementMap → a very light
 *   feGaussianBlur — the same primitive weight as the already-proven-safe
 *   `GlassDistortionFilter`, so it should not trigger the Chromium
 *   backdrop-filter tiling/seam bug on large elements the way the heavier
 *   chromatic-aberration filter risked.
 */
interface WaterBulgeFilterProps {
  id: string;
  width: number;
  height: number;
  /** Map resolution — doesn't need to match element px 1:1, just its aspect ratio. Higher = smoother curve, more expensive to build. */
  resolution?: number;
  /** Max displacement in px at the very edge of the panel. */
  scale?: number;
  /** Lens falloff curve. 1 = linear ramp (cone), pushes deformation toward the center. >1 = flat center, steep near the rim (classic lens). */
  exponent?: number;
  /** Softens the backdrop itself before it's warped — reads as "melted glass" instead of a sharp geometric bend. */
  preBlur?: number;
  /** Final softening pass so the warped edge doesn't look pixel-jagged. */
  outputBlur?: number;
}

export function WaterBulgeFilter({
  id,
  width,
  height,
  resolution = 128,
  scale = 46,
  exponent = 2.6,
  preBlur = 0,
  outputBlur = 0.5,
}: WaterBulgeFilterProps) {
  const dataUrl = useMemo(() => {
    if (!width || !height || typeof document === "undefined") return "";

    // Keep the map's aspect ratio matched to the panel so the vector field
    // radiates correctly for non-square frames (our text frame is 480×~200).
    const aspect = width / height;
    const mapW = aspect >= 1 ? resolution : Math.round(resolution * aspect);
    const mapH = aspect >= 1 ? Math.round(resolution / aspect) : resolution;

    const canvas = document.createElement("canvas");
    canvas.width = mapW;
    canvas.height = mapH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const img = ctx.createImageData(mapW, mapH);
    const cx = mapW / 2;
    const cy = mapH / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const t = Math.min(len / maxR, 1);
        const mag = Math.pow(t, exponent);
        const ux = (dx / len) * mag;
        const uy = (dy / len) * mag;
        const idx = (y * mapW + x) * 4;
        img.data[idx] = 128 + ux * 127; // R = x displacement
        img.data[idx + 1] = 128 + uy * 127; // G = y displacement
        img.data[idx + 2] = 128;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }, [width, height, resolution, exponent]);

  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <filter
          id={id}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={dataUrl}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          {preBlur > 0 ? (
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={preBlur}
              result="softened"
            />
          ) : null}
          <feDisplacementMap
            in={preBlur > 0 ? "softened" : "SourceGraphic"}
            in2="map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="bulged"
          />
          <feGaussianBlur in="bulged" stdDeviation={outputBlur} />
        </filter>
      </defs>
    </svg>
  );
}
