import { useLayoutEffect, useRef, type RefObject, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { GlassDock } from "./GlassDock";

interface GlassDockFollowerProps {
  /** Ref to the (possibly transform-animating) element to visually track. */
  targetRef: RefObject<HTMLElement | null>;
  borderRadius?: number;
  overlayStyle?: CSSProperties;
  zIndex?: number;
  /**
   * Optional ref to the element that actually carries an opacity/filter
   * *exit* (or entrance) animation - usually an ANCESTOR of targetRef, e.g.
   * the outer wrapper that fades+blurs out via Framer Motion's `exit` prop.
   * A portaled element doesn't inherit a real ancestor's opacity/filter the
   * way a normal DOM child would, so without this the glass layer either
   * snaps instantly or stays static while everything else fades/blurs
   * around it. When provided, this element's LIVE computed opacity and
   * filter are copied onto the glass layer every frame, so it can never
   * drift out of sync with however the real animation is timed/eased.
   */
  effectsRef?: RefObject<HTMLElement | null>;
}

/**
 * Renders a GlassDock glass layer as a React portal at document.body,
 * continuously syncing its `top/left/width/height` (and optionally
 * opacity/filter, see `effectsRef`) to a live source element via
 * requestAnimationFrame - instead of living inside that element's subtree
 * as a normal child.
 *
 * Why: Chromium (the WebView2-bundled version this app runs under) fails to
 * keep compositing `backdrop-filter` + the `#glass-blur` SVG `filter`
 * together on an element while it - or an ANCESTOR of it - has an actively
 * changing `transform` (CSS `animation`, or Framer Motion's spring, which
 * also drives `transform` every frame). The glass effect silently renders
 * as nothing until the transform settles, then snaps in correctly.
 *
 * This sidesteps that by never using `transform` for the glass layer's own
 * positioning - it's a portal, not a descendant, and its position/size are
 * written directly to the DOM node via a ref inside the rAF loop (not via
 * React state -> re-render -> commit, which lags behind the tracked
 * element's own compositor-driven transform by however long that render
 * cycle takes).
 */
export function GlassDockFollower({
  targetRef,
  borderRadius = 20,
  overlayStyle,
  zIndex = 10,
  effectsRef,
}: GlassDockFollowerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;

    const applyFrame = () => {
      const el = targetRef.current;
      const wrapper = wrapperRef.current;
      if (!el || !wrapper) return;

      const r = el.getBoundingClientRect();
      wrapper.style.top = `${r.top}px`;
      wrapper.style.left = `${r.left}px`;
      wrapper.style.width = `${r.width}px`;
      wrapper.style.height = `${r.height}px`;

      if (effectsRef?.current) {
        const cs = getComputedStyle(effectsRef.current);
        wrapper.style.opacity = cs.opacity;
        wrapper.style.filter = cs.filter;
      }
    };

    const wrapper = wrapperRef.current;
    // Two rAFs before the first reveal: adding a CSS-animation-triggering
    // class and reading getBoundingClientRect() in the SAME synchronous
    // pass can race the browser's own style engine (it may not have
    // "started" the animation internally yet), occasionally reading the
    // element's rest position instead of its true first-frame position -
    // visible as a one-frame jump/flash. Waiting two frames guarantees the
    // animation is genuinely running before we ever show the glass layer.
    if (wrapper) wrapper.style.visibility = "hidden";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        if (wrapper) wrapper.style.visibility = "visible";
        const tick = () => {
          applyFrame();
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      });
    });

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [targetRef, effectsRef]);

  return createPortal(
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        borderRadius,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex,
      }}
    >
      <GlassDock
        borderRadius={borderRadius}
        disableEdge={true}
        overlayStyle={overlayStyle}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>,
    document.body,
  );
}
