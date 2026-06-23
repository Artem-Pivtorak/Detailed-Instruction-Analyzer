import { useEffect, useRef } from "react";

export function BulgeLensFilter() {
  const lensMapRef = useRef<SVGFEImageElement>(null);

  useEffect(() => {
    // Generate radial vector displacement map for bulge lens effect
    function buildLensMap(size: number, exponent: number): string {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      const img = ctx.createImageData(size, size);
      const cx = size / 2;
      const cy = size / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          const t = Math.min(len / maxR, 1);
          const mag = Math.pow(t, exponent);
          const ux = (dx / len) * mag;
          const uy = (dy / len) * mag;
          const idx = (y * size + x) * 4;
          img.data[idx] = 128 + ux * 127;
          img.data[idx + 1] = 128 + uy * 127;
          img.data[idx + 2] = 128;
          img.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL();
    }

    const dataUrl = buildLensMap(160, 2.4);
    if (lensMapRef.current) {
      lensMapRef.current.setAttribute("href", dataUrl);
      lensMapRef.current.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        dataUrl
      );
    }
  }, []);

  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter
          id="bulgeLens"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            id="lensMap"
            ref={lensMapRef}
            result="map"
            preserveAspectRatio="none"
            x="0"
            y="0"
            width="100%"
            height="100%"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="90"
            xChannelSelector="R"
            yChannelSelector="G"
            result="bulged"
          />
          <feGaussianBlur in="bulged" stdDeviation="0.6" />
        </filter>
      </defs>
    </svg>
  );
}
