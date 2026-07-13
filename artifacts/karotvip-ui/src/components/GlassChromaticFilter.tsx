import { useMemo } from "react";

/**
 * GlassChromaticFilter — full chromatic-aberration "liquid glass" SVG
 * filter, ported directly from the reference "glass displacement" codepen:
 * one feImage displacement map, sampled three times with slightly
 * different `scale` per RGB channel (feDisplacementMap x3), each channel
 * isolated with feColorMatrix and recombined with feBlend (screen), then
 * softened with a final feGaussianBlur.
 *
 * ⚠️ Known risk (see GlassDistortionFilter.tsx / GlassEdgeBlur.tsx in this
 * same folder): chaining feBlend/feGaussianBlur inside a filter that's
 * used for `backdrop-filter` on a *large* element can make Chromium tile
 * the backdrop-filter render internally, showing up as a visible seam
 * splitting the panel. The simpler single-feDisplacementMap filter
 * (`GlassDistortionFilter`) was written specifically to dodge that bug on
 * the big console/side-panel surfaces. This component intentionally
 * trades that safety margin for the real chromatic-fringe look the
 * reference has — if the console frame shows a seam/split, that's this
 * known Chromium behavior, not a typo, and the fix is to fall back to
 * GlassDistortionFilter + GlassEdgeBlur for that particular surface.
 */
interface GlassChromaticFilterProps {
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
  /** Per-channel scale offset added to `scale` — this is what creates the fringe. */
  chromaticR?: number;
  chromaticG?: number;
  chromaticB?: number;
  /** Final softening pass. */
  outputBlur?: number;
}

export function GlassChromaticFilter({
  id,
  width,
  height,
  radius = 16,
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
}: GlassChromaticFilterProps) {
  const dispUri = useMemo(() => {
    if (!width || !height) return "";

    const b = Math.min(width, height) * (border * 0.5);

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

          {/* RED — strongest displacement */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale + chromaticR}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="red"
          />

          {/* GREEN — reference / least displaced */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale + chromaticG}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="green"
          />

          {/* BLUE — medium displacement */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale + chromaticB}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispBlue"
          />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="blue"
          />

          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur in="output" stdDeviation={outputBlur} />
        </filter>
      </defs>
    </svg>
  );
}
