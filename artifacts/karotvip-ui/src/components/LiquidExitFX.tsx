import { motion } from "framer-motion";

const BLOB =
  "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95), rgba(205,215,230,0.55) 55%, rgba(180,195,215,0.28) 100%)";

interface LiquidExitFXProps {
  play: boolean;
  onSequenceEnd: () => void;
}

/**
 * LiquidExitFX — plays a real metaball "two droplets become one droplet"
 * merge when the text-input row disappears, using the same #liquid-goo SVG
 * filter (feGaussianBlur + thresholding feColorMatrix) already mounted by
 * <LiquidGooDefs/> at the app root and used by LiquidGlassAccent. Two soft
 * blobs are placed close enough that the blur bridges them into one shape
 * before the whole thing shrinks away — a real optical fusion, not a fade.
 *
 *   Stage 1 (0 - 0.34s): the send button travels toward the input frame's
 *     right edge and fuses with a bulge on that edge, then both shrink away.
 *   Stage 2 (0.26 - 0.72s, overlapping): the input frame itself rises and
 *     fuses into the bottom edge of the console frame above it, same way.
 *
 * Rendered as an absolutely-positioned sibling of the console frame and the
 * input row (inside the shared "Main layout" box in App.tsx) rather than
 * nested inside either, so its lifetime isn't tied to the row's own
 * AnimatePresence unmount. Only the plain blob divs (solid/gradient fill,
 * no backdrop-filter) ever get `filter: url(#liquid-goo)` — it never wraps
 * GlassDock's backdrop-filter layers, which is the combination that broke
 * the glass rendering in earlier attempts.
 *
 * Coordinates are hardcoded to match the fixed 480px-wide layout in
 * App.tsx's "Main layout" box: sphere (0-380) -> console frame (380-560,
 * 180px tall while in text mode) -> 16px gap -> input row (576-628, 52px
 * tall). If that layout changes, these numbers need to move with it.
 */
export function LiquidExitFX({ play, onSequenceEnd }: LiquidExitFXProps) {
  if (!play) return null;

  return (
    <>
      {/* Stage 1 — send button melts into the input frame's right edge.
          Box matches the input row's own box exactly. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 576,
          width: 480,
          height: 52,
          zIndex: 20,
          pointerEvents: "none",
          filter: "url(#liquid-goo)",
        }}
      >
        {/* traveling droplet — stands in for the send button */}
        <motion.div
          initial={{ x: 0, scale: 1, opacity: 1 }}
          animate={{
            x: [0, -20, -55],
            scale: [1, 1.1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.34,
            times: [0, 0.4, 1],
            ease: [0.45, 0, 0.2, 1],
          }}
          style={{
            position: "absolute",
            left: 428,
            top: 0,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: BLOB,
          }}
        />
        {/* receiving bulge on the frame's edge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1, 0.5] }}
          transition={{
            duration: 0.34,
            times: [0, 0.45, 1],
            ease: [0.45, 0, 0.2, 1],
          }}
          style={{
            position: "absolute",
            left: 397,
            top: 11,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: BLOB,
          }}
        />
      </div>

      {/* Stage 2 — the input frame rises and melts into the console frame's
          bottom edge. Box spans from just inside the console frame's
          bottom edge down through the row's position. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 536,
          width: 480,
          height: 100,
          zIndex: 20,
          pointerEvents: "none",
          filter: "url(#liquid-goo)",
        }}
      >
        {/* the whole input row, standing in as one wide droplet */}
        <motion.div
          initial={{ y: 0, scaleY: 1, scaleX: 1, opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 0, -50, -66],
            scaleY: [1, 1, 0.45, 0.12],
            scaleX: [1, 1, 0.85, 0.55],
          }}
          transition={{
            duration: 0.46,
            delay: 0.26,
            times: [0, 0.15, 0.7, 1],
            ease: [0.45, 0, 0.2, 1],
          }}
          onAnimationComplete={onSequenceEnd}
          style={{
            position: "absolute",
            left: 20,
            top: 40,
            width: 440,
            height: 40,
            borderRadius: 20,
            background: BLOB,
          }}
        />
        {/* receiving bulge just inside the console frame's bottom edge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0, 0.9, 0], scale: [0.4, 0.4, 1, 0.55] }}
          transition={{
            duration: 0.46,
            delay: 0.26,
            times: [0, 0.15, 0.65, 1],
            ease: [0.45, 0, 0.2, 1],
          }}
          style={{
            position: "absolute",
            left: 190,
            top: 14,
            width: 100,
            height: 26,
            borderRadius: 14,
            background: BLOB,
          }}
        />
      </div>
    </>
  );
}
