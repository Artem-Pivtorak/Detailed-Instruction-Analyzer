import { memo } from "react";

interface GlassEdgeBlurProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  /** Blur strength at the very edge of the frame, in px. */
  edgeBlur?: number;
  /** % of the radial falloff that stays perfectly sharp before the blur starts fading in. */
  innerStop?: number;
  style?: React.CSSProperties;
}

/**
 * GlassEdgeBlur — graduated "sharp center → blurred edge" layer.
 *
 * This intentionally does NOT use an SVG feGaussianBlur/feComposite chain.
 * Combining a heavy multi-primitive SVG filter with backdrop-filter on a
 * large/wide element (like the console frame or side panel) makes Chromium
 * tile the backdrop-filter render internally, and the tile seams show up as
 * the frame visually "splitting into parts" with a bright seam down the
 * middle — exactly the artifact this replaces.
 *
 * Instead this is a plain CSS `backdrop-filter: blur()` on its own layer,
 * revealed only near the edges via a `mask-image` radial gradient (mask
 * alpha 0 in the center = layer invisible = sharp content shows through;
 * mask alpha 1 at the edge = blurred layer shows). Plain CSS blur+mask is
 * cheap, doesn't touch the SVG filter graph, and does not trigger the
 * tiling bug — it renders as one continuous layer at any width/height.
 */
export const GlassEdgeBlur = memo(function GlassEdgeBlur({
  width = "100%",
  height = "100%",
  radius = 20,
  edgeBlur = 8,
  innerStop = 15,
  style,
}: GlassEdgeBlurProps) {
  const r = typeof radius === "number" ? `${radius}px` : radius;
  const maskImage = `radial-gradient(ellipse at center, transparent 0%, transparent ${innerStop}%, #fff 100%)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        borderRadius: r,
        overflow: "hidden",
        backdropFilter: `blur(${edgeBlur}px)`,
        WebkitBackdropFilter: `blur(${edgeBlur}px)`,
        maskImage,
        WebkitMaskImage: maskImage,
        pointerEvents: "none",
        willChange: "backdrop-filter",
        ...style,
      }}
    />
  );
});
