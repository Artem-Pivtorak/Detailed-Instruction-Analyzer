/**
 * GlassBlurDefs — exact copy of the reference "Liquid Glass Menu" SVG
 * filter (`feTurbulence` + `feDisplacementMap`). Mount once near the app
 * root; every `.liquid-glass--bend` layer references it via
 * `filter: url(#glass-blur)`.
 */
export function GlassBlurDefs() {
  return (
    <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
      <filter
        id="glass-blur"
        x="0"
        y="0"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.003 0.007"
          numOctaves={1}
          result="turbulence"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="turbulence"
          scale={200}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
