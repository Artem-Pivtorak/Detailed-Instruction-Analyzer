// ═══════════════════════════════════════════════════════════════
//  EarthGlobe — 3-D interactive globe with zoom-to-flat morph
//  + progressive label system: continents → countries → cities
//
//  FIXED vs previous version:
//  • sphereR = baseR (fixed) — 3-D positions no longer leave canvas
//  • cLon = atan2(cos(ry), -sin(ry)) — correct centre longitude
//  • cLat = rx * 180/PI            — correct centre latitude
//  • drawThreshold = lerp(0.5, 0.05, flat) — no back-face bleed
//  • clip active until flat > 0.8          — sphere boundary enforced
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from "react";

// ── TopoJSON decoder ─────────────────────────────────────────────
interface TopoTransform { scale: [number, number]; translate: [number, number] }
interface TopoGeometry  { type: "Polygon"|"MultiPolygon"; arcs?: number[][]|number[][][] }
interface Topology {
  type: "Topology"; transform?: TopoTransform; arcs: number[][][];
  objects: Record<string, { type: string; geometries: TopoGeometry[] }>;
}
function _decArcs(t: Topology): number[][][] {
  const tr = t.transform; if (!tr) return t.arcs;
  const [sx, sy] = tr.scale, [tx, ty] = tr.translate;
  return t.arcs.map(arc => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x*sx+tx, y*sy+ty]; }); });
}
function _arcRing(dec: number[][][], idx: number[]): [number, number][] {
  const pts: [number, number][] = [];
  for (const i of idx) { const a = i >= 0 ? dec[i] : [...dec[~i]].reverse(); for (let j = 0; j < a.length - 1; j++) pts.push([a[j][0], a[j][1]]); }
  return pts;
}
function extractRings(t: Topology): [number, number][][] {
  const dec = _decArcs(t), obj = t.objects["countries"]; if (!obj) return [];
  const out: [number, number][][] = [];
  for (const g of obj.geometries) {
    if (g.type === "Polygon"      && g.arcs) for (const r of g.arcs as number[][])    out.push(_arcRing(dec, r));
    if (g.type === "MultiPolygon" && g.arcs) for (const p of g.arcs as number[][][]) for (const r of p) out.push(_arcRing(dec, r));
  }
  return out;
}

// ── 3-D math ─────────────────────────────────────────────────────
const geo3d = (lon: number, lat: number): [number,number,number] => {
  const ph = lat*Math.PI/180, lm = lon*Math.PI/180;
  return [Math.cos(ph)*Math.cos(lm), Math.sin(ph), Math.cos(ph)*Math.sin(lm)];
};
// Rotate around world-Y then world-X
const rot3d = (x: number, y: number, z: number, rx: number, ry: number): [number,number,number] => {
  const x1 = x*Math.cos(ry) + z*Math.sin(ry);
  const z1 = -x*Math.sin(ry) + z*Math.cos(ry);
  return [x1, y*Math.cos(rx) - z1*Math.sin(rx), y*Math.sin(rx) + z1*Math.cos(rx)];
};
const lerp   = (a: number, b: number, t: number) => a + (b-a)*t;
const clamp1 = (v: number) => Math.max(0, Math.min(1, v));

// Normalize lon difference to [-180, 180]
const normDL = (lon: number, c: number) => {
  let d = lon - c;
  while (d >  180) d -= 360;
  while (d < -180) d += 360;
  return d;
};

// ── Geographic label data ─────────────────────────────────────────
const CONTINENTS = [
  { n:"АЗІЯ",       lo: 90,  la: 35  },
  { n:"АФРИКА",     lo: 22,  la:  4  },
  { n:"ЄВРОПА",     lo: 15,  la: 52  },
  { n:"ПН.АМЕРИКА", lo:-100, la: 48  },
  { n:"ПД.АМЕРИКА", lo: -58, la:-15  },
  { n:"АВСТРАЛІЯ",  lo: 134, la:-25  },
  { n:"АНТАРКТИКА", lo:   0, la:-78  },
];
const COUNTRIES = [
  { n:"UKRAINE",     lo: 31, la: 49 }, { n:"RUSSIA",      lo: 98, la: 61 },
  { n:"USA",         lo:-99, la: 38 }, { n:"CANADA",       lo:-96, la: 60 },
  { n:"CHINA",       lo:104, la: 35 }, { n:"INDIA",        lo: 79, la: 22 },
  { n:"BRAZIL",      lo:-52, la:-14 }, { n:"AUSTRALIA",    lo:134, la:-26 },
  { n:"ARGENTINA",   lo:-64, la:-34 }, { n:"GERMANY",      lo: 10, la: 51 },
  { n:"FRANCE",      lo:  2, la: 46 }, { n:"UK",           lo: -2, la: 54 },
  { n:"JAPAN",       lo:138, la: 36 }, { n:"INDONESIA",    lo:118, la: -2 },
  { n:"NIGERIA",     lo:  9, la:  9 }, { n:"PAKISTAN",     lo: 70, la: 30 },
  { n:"MEXICO",      lo:-102,la: 24 }, { n:"EGYPT",        lo: 30, la: 27 },
  { n:"TURKEY",      lo: 35, la: 39 }, { n:"IRAN",         lo: 53, la: 32 },
  { n:"POLAND",      lo: 20, la: 52 }, { n:"SPAIN",        lo: -4, la: 40 },
  { n:"S.AFRICA",    lo: 25, la:-29 }, { n:"KENYA",        lo: 38, la: -1 },
  { n:"ETHIOPIA",    lo: 40, la:  9 }, { n:"VIETNAM",      lo:108, la: 16 },
  { n:"THAILAND",    lo:101, la: 15 }, { n:"S.KOREA",      lo:128, la: 37 },
  { n:"COLOMBIA",    lo:-74, la:  4 }, { n:"KAZAKHSTAN",   lo: 67, la: 48 },
  { n:"SAUDI ARABIA",lo: 45, la: 24 }, { n:"ITALY",        lo: 12, la: 43 },
  { n:"SWEDEN",      lo: 17, la: 62 }, { n:"NORWAY",       lo:  9, la: 64 },
  { n:"BELARUS",     lo: 28, la: 53 }, { n:"ROMANIA",      lo: 25, la: 46 },
];
const CITIES = [
  { n:"Kyiv",          lo: 30.5, la: 50.5 }, { n:"Moscow",      lo: 37.6,  la: 55.8  },
  { n:"London",        lo: -0.1, la: 51.5 }, { n:"Paris",       lo:  2.4,  la: 48.9  },
  { n:"Berlin",        lo: 13.4, la: 52.5 }, { n:"Warsaw",      lo: 21.0,  la: 52.2  },
  { n:"Budapest",      lo: 19.1, la: 47.5 }, { n:"Vienna",      lo: 16.4,  la: 48.2  },
  { n:"Rome",          lo: 12.5, la: 41.9 }, { n:"Madrid",      lo: -3.7,  la: 40.4  },
  { n:"Istanbul",      lo: 29.0, la: 41.0 }, { n:"Amsterdam",   lo:  4.9,  la: 52.4  },
  { n:"Prague",        lo: 14.4, la: 50.1 }, { n:"Bucharest",   lo: 26.1,  la: 44.4  },
  { n:"New York",      lo:-74.0, la: 40.7 }, { n:"Los Angeles", lo:-118.2, la: 34.1  },
  { n:"Chicago",       lo:-87.6, la: 41.9 }, { n:"Toronto",     lo:-79.4,  la: 43.7  },
  { n:"Mexico City",   lo:-99.1, la: 19.4 }, { n:"São Paulo",   lo:-46.6,  la:-23.5  },
  { n:"Buenos Aires",  lo:-58.4, la:-34.6 }, { n:"Rio",         lo:-43.2,  la:-22.9  },
  { n:"Beijing",       lo:116.4, la: 39.9 }, { n:"Shanghai",    lo:121.5,  la: 31.2  },
  { n:"Tokyo",         lo:139.7, la: 35.7 }, { n:"Seoul",       lo:127.0,  la: 37.6  },
  { n:"Bangkok",       lo:100.5, la: 13.8 }, { n:"Jakarta",     lo:106.8,  la: -6.2  },
  { n:"Singapore",     lo:103.8, la:  1.4 }, { n:"Mumbai",      lo: 72.8,  la: 19.1  },
  { n:"Delhi",         lo: 77.2, la: 28.6 }, { n:"Dhaka",       lo: 90.4,  la: 23.7  },
  { n:"Tehran",        lo: 51.4, la: 35.7 }, { n:"Dubai",       lo: 55.3,  la: 25.2  },
  { n:"Cairo",         lo: 31.2, la: 30.1 }, { n:"Lagos",       lo:  3.4,  la:  6.5  },
  { n:"Nairobi",       lo: 36.8, la: -1.3 }, { n:"Johannesburg",lo: 28.0,  la:-26.2  },
  { n:"Sydney",        lo:151.2, la:-33.9 }, { n:"Melbourne",   lo:145.0,  la:-37.8  },
  { n:"Kharkiv",       lo: 36.2, la: 50.0 }, { n:"Lviv",        lo: 24.0,  la: 49.8  },
  { n:"Odesa",         lo: 30.7, la: 46.5 }, { n:"Dnipro",      lo: 35.0,  la: 48.5  },
  { n:"Riyadh",        lo: 46.7, la: 24.7 }, { n:"Karachi",     lo: 67.0,  la: 24.9  },
  { n:"Hanoi",         lo:105.8, la: 21.0 }, { n:"Manila",      lo:121.0,  la: 14.6  },
  { n:"Kuala Lumpur",  lo:101.7, la:  3.1 }, { n:"Casablanca",  lo: -7.6,  la: 33.6  },
  { n:"Minsk",         lo: 27.6, la: 53.9 }, { n:"Vilnius",     lo: 25.3,  la: 54.7  },
];

// ── Props ─────────────────────────────────────────────────────────
export interface EarthGlobeProps {
  size?:       number;
  autoRotate?: boolean;
  borderGlow?: boolean;
  onRotate?:   (rx: number, ry: number) => void;
  /** Called when zoom/flatness changes (throttled, 1% steps) */
  onZoom?:     (zoom: number, flat: number) => void;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════
export function EarthGlobe({
  size = 420, autoRotate = true, borderGlow = true, onRotate, onZoom,
}: EarthGlobeProps) {
  const cvs       = useRef<HTMLCanvasElement>(null);
  const animId    = useRef<number>(0);
  const rxRef     = useRef(-0.32);
  const ryRef     = useRef(0.0);
  const autoRun   = useRef(autoRotate);
  const dragging  = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });
  const zoomRef   = useRef(1.0);
  const prevFlat  = useRef(-1);
  // Stable callback refs (avoid restarting the rAF loop on prop change)
  const onRotRef  = useRef(onRotate);
  const onZoomRef = useRef(onZoom);
  useEffect(() => { onRotRef.current  = onRotate; }, [onRotate]);
  useEffect(() => { onZoomRef.current = onZoom;   }, [onZoom]);
  const ringsRef  = useRef<[number, number][][]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { autoRun.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then((t: Topology) => { ringsRef.current = extractRings(t); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  // ── Event handlers ──────────────────────────────────────────
  const onDown = useCallback((e: MouseEvent) => {
    dragging.current = true; autoRun.current = false;
    lastPos.current  = { x: e.clientX, y: e.clientY };
    if (cvs.current) cvs.current.style.cursor = "grabbing";
  }, []);

  const onMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const rect  = cvs.current?.getBoundingClientRect();
    const scl   = rect ? size / rect.width : 1;
    const z     = zoomRef.current;
    const flat  = clamp1((z - 1.5) / 2.5);
    const baseR = size * 0.42;
    // In sphere mode: angular drag. In flat mode: pixel-perfect pan.
    const sensS = 0.007 * scl;
    const sensF = Math.PI / 2 / (baseR * Math.max(z, 1));
    const sens  = lerp(sensS, sensF, flat);
    ryRef.current += (e.clientX - lastPos.current.x) * sens;
    rxRef.current  = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05,
      rxRef.current + (e.clientY - lastPos.current.y) * sens));
    lastPos.current = { x: e.clientX, y: e.clientY };
    onRotRef.current?.(rxRef.current, ryRef.current);
  }, [size]);

  const onUp = useCallback(() => {
    dragging.current = false;
    if (cvs.current) cvs.current.style.cursor = "grab";
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    zoomRef.current = Math.max(0.4, Math.min(20, zoomRef.current * (e.deltaY < 0 ? 1.11 : 0.90)));
  }, []);

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    c.style.cursor = "grab";
    c.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      c.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      c.removeEventListener("wheel", onWheel);
    };
  }, [onDown, onMove, onUp, onWheel]);

  // ── Render loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = cvs.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d"); if (!ctx) return;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random()*size, y: Math.random()*size,
      r: 0.35 + Math.random()*1.1,
      a: 0.12 + Math.random()*0.6,
      ph: Math.random()*Math.PI*2,
      sp: 0.4 + Math.random()*1.2,
    }));
    let tick = 0;

    function draw() {
      tick += 0.016;
      const z     = zoomRef.current;
      const flat  = clamp1((z - 1.5) / 2.5);   // 0 = sphere, 1 = flat
      const baseR = size * 0.42;

      // ─── KEY FIX 1: sphere projection uses FIXED radius ──────
      // This prevents sphere positions from going off-canvas at high zoom,
      // which was causing the deformation/distortion.
      const sphereR = baseR;

      // Visual sphere radius (can grow slightly before transition)
      const visR = baseR * Math.min(z, 1.4);

      // Flat map scale (scales with zoom so you zoom into the flat map)
      const fscl = baseR * z / 90;   // px per degree

      const cx = size / 2, cy = size / 2;
      const rx = rxRef.current, ry = ryRef.current;

      // ─── KEY FIX 2: correct centre lon/lat ───────────────────
      // Derived analytically: the screen centre (camera dir = [0,0,1])
      // unrotated back to world space gives:
      //   x_world = -cos(rx)*sin(ry)
      //   y_world = sin(rx)
      //   z_world = cos(rx)*cos(ry)
      // → lat = asin(y_world) ≈ rx,  lon = atan2(z_world, x_world)
      const cLon = Math.atan2(Math.cos(ry), -Math.sin(ry)) * 180 / Math.PI;
      const cLat = rx * 180 / Math.PI;

      // Notify parent (throttled to 1% flat steps)
      const fr = Math.round(flat * 100);
      if (fr !== prevFlat.current) { prevFlat.current = fr; onZoomRef.current?.(z, flat); }

      // Auto-rotate only in sphere mode
      if (autoRun.current && flat < 0.15) {
        ryRef.current += 0.0025 * (1 - flat * 6);
        onRotRef.current?.(rxRef.current, ryRef.current);
      }

      // ─── UNIFIED PROJECTION ───────────────────────────────────
      // Returns [screenX, screenY, visibility 0-1]
      function proj(lon: number, lat: number): [number, number, number] {
        const [x3, y3, z3] = rot3d(...geo3d(lon, lat), rx, ry);

        // Sphere screen position (fixed radius = always on-canvas)
        const sX = cx + x3 * sphereR;
        const sY = cy - y3 * sphereR;

        // Flat map position (scales with zoom)
        const dLon = normDL(lon, cLon);
        const fX   = cx + dLon * fscl;
        const fY   = cy - (lat - cLat) * fscl;

        // ─── KEY FIX 3: proper visibility ────────────────────────
        // In sphere mode only draw clearly front-facing points.
        // Ramp from 0 at z3=0 to 1 at z3=0.12.
        const vis3d = clamp1(z3 / 0.12);
        // In flat mode all points visible (vis→1)
        const vis = lerp(vis3d, 1, flat);

        return [lerp(sX, fX, flat), lerp(sY, fY, flat), vis];
      }

      // Minimum visibility to draw a segment
      // Strict in sphere mode (prevent back-face bleed), relaxed in flat
      const minVis = lerp(0.55, 0.04, flat);

      // ── CLEAR ────────────────────────────────────────────────
      ctx.clearRect(0, 0, size, size);

      // ── STARS ────────────────────────────────────────────────
      if (flat < 0.95) {
        for (const s of stars) {
          const b = s.a * (0.55 + 0.45 * Math.sin(tick * s.sp + s.ph)) * (1 - flat);
          if (b < 0.02) continue;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
          ctx.fillStyle = `rgba(200,225,255,${b.toFixed(2)})`; ctx.fill();
        }
      }

      // ── FLAT MAP BACKGROUND ──────────────────────────────────
      if (flat > 0.02) {
        ctx.save(); ctx.globalAlpha = flat;
        ctx.fillStyle = "#030E28"; ctx.fillRect(0, 0, size, size);
        const ga = flat * 0.12;
        for (let lat2 = -80; lat2 <= 80; lat2 += 10) {
          const fy = cy - (lat2 - cLat) * fscl;
          if (fy < -4 || fy > size + 4) continue;
          ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(size, fy);
          ctx.strokeStyle = lat2 === 0 ? `rgba(0,180,255,${(ga*2.2).toFixed(2)})` : `rgba(0,70,200,${ga.toFixed(2)})`;
          ctx.lineWidth = lat2 === 0 ? 0.8 : 0.35; ctx.stroke();
        }
        for (let lo2 = -180; lo2 <= 180; lo2 += 10) {
          const fx = cx + normDL(lo2, cLon) * fscl;
          if (fx < -8 || fx > size + 8) continue;
          ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, size);
          ctx.strokeStyle = lo2 === 0 ? `rgba(0,180,255,${(ga*2.2).toFixed(2)})` : `rgba(0,70,200,${ga.toFixed(2)})`;
          ctx.lineWidth = lo2 === 0 ? 0.8 : 0.35; ctx.stroke();
        }
        ctx.restore();
      }

      // ── ATMOSPHERE + OCEAN (sphere, uses visR) ───────────────
      if (flat < 0.99) {
        ctx.save(); ctx.globalAlpha = 1 - flat;
        const ag = ctx.createRadialGradient(cx, cy, visR*0.85, cx, cy, visR*1.35);
        ag.addColorStop(0, "rgba(15,110,240,0.42)"); ag.addColorStop(0.3, "rgba(8,60,180,0.25)");
        ag.addColorStop(0.65, "rgba(2,25,95,0.12)"); ag.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(cx, cy, visR*1.35, 0, Math.PI*2);
        ctx.fillStyle = ag; ctx.fill();

        const og = ctx.createRadialGradient(cx - visR*0.22, cy - visR*0.22, 0, cx, cy, visR);
        og.addColorStop(0, "#0D3575"); og.addColorStop(0.45, "#071E48"); og.addColorStop(1, "#030E28");
        ctx.beginPath(); ctx.arc(cx, cy, visR, 0, Math.PI*2);
        ctx.fillStyle = og; ctx.fill();
        ctx.restore();
      }

      // ── SPHERE CLIP ──────────────────────────────────────────
      // KEY FIX 4: keep clip active until nearly flat (prevents
      // back-face countries leaking outside sphere boundary)
      const useClip = flat < 0.80;
      if (useClip) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, sphereR + 1, 0, Math.PI*2); ctx.clip();
      }

      // ── SPHERE GRID ──────────────────────────────────────────
      if (flat < 0.95) {
        ctx.save(); ctx.globalAlpha = (1 - flat) * 0.85;
        for (let lat2 = -80; lat2 <= 80; lat2 += 20) {
          ctx.beginPath(); let pv = false;
          for (let lo2 = -180; lo2 <= 180; lo2 += 2) {
            const [px, py, v] = proj(lo2, lat2);
            if (v < minVis) { pv = false; continue; }
            if (!pv) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            pv = true;
          }
          ctx.strokeStyle = lat2 === 0 ? "rgba(0,180,255,0.22)" : "rgba(0,85,185,0.08)";
          ctx.lineWidth = lat2 === 0 ? 0.8 : 0.4; ctx.stroke();
        }
        for (let lo2 = -180; lo2 < 180; lo2 += 20) {
          ctx.beginPath(); let pv = false;
          for (let lat2 = -85; lat2 <= 85; lat2 += 2) {
            const [px, py, v] = proj(lo2, lat2);
            if (v < minVis) { pv = false; continue; }
            if (!pv) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            pv = true;
          }
          ctx.strokeStyle = lo2 === 0 ? "rgba(0,180,255,0.22)" : "rgba(0,85,185,0.08)";
          ctx.lineWidth = lo2 === 0 ? 0.8 : 0.4; ctx.stroke();
        }
        ctx.restore();
      }

      // ── COUNTRY FILLS ────────────────────────────────────────
      ctx.fillStyle = "rgba(14,72,162,0.32)";
      for (const ring of ringsRef.current) {
        if (ring.length < 3) continue;
        ctx.beginPath();
        let prevX = 0, pv = false, started = false;
        for (let i = 0; i <= ring.length; i++) {
          const [lo, la] = ring[i % ring.length];
          const [px, py, v] = proj(lo, la);
          const ok = v > minVis;
          // Dateline jump (flat mode): if x jumps > half canvas width, break path
          const jump = pv && Math.abs(px - prevX) > size * 0.7;
          if (i === 0) {
            if (ok) { ctx.moveTo(px, py); started = true; }
          } else if (jump) {
            if (ok) ctx.moveTo(px, py);
          } else if (ok && pv)  { ctx.lineTo(px, py); }
            else if (ok && !pv) { ctx.moveTo(px, py); started = true; }
          pv = ok && !jump; prevX = px;
        }
        if (started) ctx.fill();
      }

      // ── COUNTRY BORDERS ──────────────────────────────────────
      ctx.strokeStyle = "rgba(0,215,255,0.72)"; ctx.lineWidth = 0.55;
      ctx.shadowColor  = "rgba(0,195,255,0.45)";
      ctx.shadowBlur   = flat < 0.5 ? 2.5 : 1.0;
      for (const ring of ringsRef.current) {
        if (ring.length < 2) continue;
        ctx.beginPath();
        let prevX = 0, pv = false;
        for (let i = 0; i < ring.length; i++) {
          const [lo, la] = ring[i];
          const [px, py, v] = proj(lo, la);
          const ok = v > minVis;
          const jump = pv && Math.abs(px - prevX) > size * 0.7;
          if (!pv || jump) { if (ok) ctx.moveTo(px, py); }
          else if (ok)     ctx.lineTo(px, py);
          pv = ok && !jump; prevX = px;
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // ── SPECULAR + NIGHT (sphere) ────────────────────────────
      if (flat < 0.99) {
        ctx.save(); ctx.globalAlpha = 1 - flat;
        const spec = ctx.createRadialGradient(cx - visR*0.30, cy - visR*0.30, 0, cx, cy, visR);
        spec.addColorStop(0, "rgba(150,235,255,0.10)"); spec.addColorStop(0.22, "rgba(70,150,255,0.05)"); spec.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = spec; ctx.fillRect(0, 0, size, size);
        const night = ctx.createRadialGradient(cx + visR*0.38, cy + visR*0.10, 0, cx, cy, visR);
        night.addColorStop(0, "rgba(0,0,0,0)"); night.addColorStop(0.38, "rgba(0,0,0,0)");
        night.addColorStop(0.65, "rgba(0,0,22,0.18)"); night.addColorStop(1, "rgba(0,0,16,0.42)");
        ctx.fillStyle = night; ctx.fillRect(0, 0, size, size);
        ctx.restore();
      }

      if (useClip) ctx.restore();   // end sphere clip

      // ── SPHERE BORDER GLOW ───────────────────────────────────
      if (borderGlow && flat < 0.99) {
        ctx.save(); ctx.globalAlpha = 1 - flat;
        ctx.beginPath(); ctx.arc(cx, cy, visR, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(0,195,255,0.52)"; ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(0,170,255,0.72)"; ctx.shadowBlur = 14;
        ctx.stroke(); ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── LOADING TEXT ─────────────────────────────────────────
      if (!ready) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, sphereR, 0, Math.PI*2); ctx.clip();
        ctx.font = `${Math.round(size*0.037)}px 'Courier New',monospace`;
        ctx.fillStyle = "rgba(0,210,255,0.70)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("LOADING MAP DATA...", cx, cy);
        ctx.restore();
      }

      // ════════════════════════════════════════════════════════
      //  PROGRESSIVE LABELS
      //  T0 Continents : zoom 0.6 – 2.6   (sphere, large text)
      //  T1 Countries  : zoom 1.8 – 7.0   (transition + flat)
      //  T2 Cities     : zoom 4.0+         (flat)
      // ════════════════════════════════════════════════════════
      function drawLabel(name: string, lon: number, lat: number,
                          fs: number, color: string, dotR: number, alpha: number) {
        const [px, py, v] = proj(lon, lat);
        if (v < 0.05) return;
        const a = alpha * Math.min(v * 1.5, 1);
        if (a < 0.04) return;
        if (px < -50 || px > size + 50 || py < -25 || py > size + 25) return;
        ctx.save(); ctx.globalAlpha = a;
        if (dotR > 0) {
          ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI*2);
          ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = dotR * 3;
          ctx.fill(); ctx.shadowBlur = 0;
        }
        ctx.font = `${fs}px 'Courier New',monospace`;
        ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.shadowColor = "rgba(0,5,20,0.98)"; ctx.shadowBlur = 6;
        ctx.fillText(name, px, py - dotR - 2);
        ctx.shadowBlur = 0; ctx.restore();
      }

      // Tier 0: Continent names (appear early, fade before country labels)
      const contA = clamp1(Math.min((z - 0.6) / 0.5, (2.6 - z) / 0.9));
      if (contA > 0.03)
        for (const c of CONTINENTS) drawLabel(c.n, c.lo, c.la, 12, "rgba(0,210,255,1)", 0, contA);

      // Tier 1: Country names
      const ctryA = clamp1(Math.min((z - 1.8) / 1.1, (7.0 - z) / 1.5));
      if (ctryA > 0.03)
        for (const c of COUNTRIES) drawLabel(c.n, c.lo, c.la, 9, "rgba(160,225,255,1)", 1.5, ctryA);

      // Tier 2: City names (flat map only)
      const cityA = clamp1((z - 4.0) / 1.6);
      if (cityA > 0.03)
        for (const c of CITIES) drawLabel(c.n, c.lo, c.la, 8, "rgba(130,210,255,1)", 1.2, cityA);

      // ── Zoom / mode HUD ─────────────────────────────────────
      if (flat > 0.04 || z > 1.3) {
        const modeLabel = flat > 0.95 ? `FLAT MAP  ${z.toFixed(1)}×`
          : flat > 0.04 ? `◐  ${z.toFixed(1)}×`
          : `${z.toFixed(1)}×`;
        ctx.save();
        ctx.font = "8px 'Courier New',monospace";
        ctx.fillStyle = `rgba(0,190,255,${Math.min(0.55, flat * 0.8 + 0.22).toFixed(2)})`;
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(modeLabel, size - 7, size - 7);
        ctx.restore();
      }

      animId.current = requestAnimationFrame(draw);
    }

    animId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId.current);
  }, [size, ready, borderGlow]); // callbacks via stable refs — no loop restart on prop change

  return (
    <canvas
      ref={cvs}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
