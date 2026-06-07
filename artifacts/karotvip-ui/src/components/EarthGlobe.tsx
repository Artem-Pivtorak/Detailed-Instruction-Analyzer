// ═══════════════════════════════════════════════════════════════
//  EarthGlobe  —  accurate 3-D globe with zoom-to-flat morph
//  Progressive labels: continents → countries → cities
//
//  Fixes applied in this version:
//  ① sphereR = baseR·min(z,1)   — sphere never exceeds canvas;
//                                  no off-canvas positions → no deformation
//  ② ocean drawn INSIDE clip    — sphere boundary is always clean
//  ③ atmosphere OUTSIDE clip    — outer glow allowed to bleed naturally
//  ④ visibility gate: z3+flat>0 — back-face only appears as flat unfolds;
//                                  no mid-transition bleed-through
//  ⑤ clip kept until flat≥0.99  — sphere silhouette enforced all transition
//  ⑥ no TypeScript spread issue — rot3d called with explicit args
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from "react";

// ── TopoJSON decoder ─────────────────────────────────────────────
interface TopoTransform { scale:[number,number]; translate:[number,number] }
interface TopoGeometry  { type:"Polygon"|"MultiPolygon"; arcs?:number[][]|number[][][] }
interface Topology {
  type:"Topology"; transform?:TopoTransform; arcs:number[][][];
  objects:Record<string,{ type:string; geometries:TopoGeometry[] }>;
}
function _decode(t: Topology): number[][][] {
  const tr = t.transform; if (!tr) return t.arcs;
  const [sx,sy]=tr.scale, [tx,ty]=tr.translate;
  return t.arcs.map(arc => { let x=0,y=0; return arc.map(([dx,dy])=>{ x+=dx; y+=dy; return [x*sx+tx, y*sy+ty]; }); });
}
function _ring(dec:number[][][], idx:number[]): [number,number][] {
  const pts:[number,number][] = [];
  for (const i of idx) { const a = i>=0?dec[i]:[...dec[~i]].reverse(); for (let j=0;j<a.length-1;j++) pts.push([a[j][0],a[j][1]]); }
  return pts;
}
function buildRings(t: Topology): [number,number][][] {
  const dec=_decode(t), obj=t.objects["countries"]; if (!obj) return [];
  const out:[number,number][][] = [];
  for (const g of obj.geometries) {
    if (g.type==="Polygon"      && g.arcs) for (const r of g.arcs as number[][])    out.push(_ring(dec,r));
    if (g.type==="MultiPolygon" && g.arcs) for (const p of g.arcs as number[][][]) for (const r of p) out.push(_ring(dec,r));
  }
  return out;
}

// ── 3-D math ─────────────────────────────────────────────────────
/** Unit-sphere point from geographic coordinates */
function geo3d(lon:number, lat:number): [number,number,number] {
  const ph=lat*Math.PI/180, lm=lon*Math.PI/180;
  return [Math.cos(ph)*Math.cos(lm), Math.sin(ph), Math.cos(ph)*Math.sin(lm)];
}
/** Rotate by ry (Y-axis / longitude) then rx (X-axis / tilt) */
function rot3d(x:number,y:number,z:number,rx:number,ry:number): [number,number,number] {
  const x1= x*Math.cos(ry)+z*Math.sin(ry);
  const z1=-x*Math.sin(ry)+z*Math.cos(ry);
  return [x1, y*Math.cos(rx)-z1*Math.sin(rx), y*Math.sin(rx)+z1*Math.cos(rx)];
}
/** Clamp to [0,1] */
const c01 = (v:number) => v<0?0:v>1?1:v;
/** Linear interpolate */
const lerp = (a:number,b:number,t:number) => a+(b-a)*t;
/** Longitude difference normalised to [-180,180] */
function dLon(lon:number, centre:number): number {
  let d=lon-centre; while(d>180)d-=360; while(d<-180)d+=360; return d;
}

// ── Label data ────────────────────────────────────────────────────
const CONTINENTS = [
  {n:"АЗІЯ",       lo:90,  la:35 }, {n:"АФРИКА",    lo:22,  la:4  },
  {n:"ЄВРОПА",     lo:15,  la:52 }, {n:"ПН.АМЕРИКА",lo:-100,la:48 },
  {n:"ПД.АМЕРИКА", lo:-58, la:-15}, {n:"АВСТРАЛІЯ", lo:134, la:-25},
  {n:"АНТАРКТИКА", lo:0,   la:-78},
];
const COUNTRIES = [
  {n:"UKRAINE",    lo:31,  la:49 }, {n:"RUSSIA",      lo:98,  la:61 },
  {n:"USA",        lo:-99, la:38 }, {n:"CANADA",       lo:-96, la:60 },
  {n:"CHINA",      lo:104, la:35 }, {n:"INDIA",        lo:79,  la:22 },
  {n:"BRAZIL",     lo:-52, la:-14}, {n:"AUSTRALIA",    lo:134, la:-26},
  {n:"ARGENTINA",  lo:-64, la:-34}, {n:"GERMANY",      lo:10,  la:51 },
  {n:"FRANCE",     lo:2,   la:46 }, {n:"UK",           lo:-2,  la:54 },
  {n:"JAPAN",      lo:138, la:36 }, {n:"INDONESIA",    lo:118, la:-2 },
  {n:"NIGERIA",    lo:9,   la:9  }, {n:"PAKISTAN",     lo:70,  la:30 },
  {n:"MEXICO",     lo:-102,la:24 }, {n:"EGYPT",        lo:30,  la:27 },
  {n:"TURKEY",     lo:35,  la:39 }, {n:"IRAN",         lo:53,  la:32 },
  {n:"POLAND",     lo:20,  la:52 }, {n:"SPAIN",        lo:-4,  la:40 },
  {n:"S.AFRICA",   lo:25,  la:-29}, {n:"KENYA",        lo:38,  la:-1 },
  {n:"ETHIOPIA",   lo:40,  la:9  }, {n:"VIETNAM",      lo:108, la:16 },
  {n:"THAILAND",   lo:101, la:15 }, {n:"S.KOREA",      lo:128, la:37 },
  {n:"COLOMBIA",   lo:-74, la:4  }, {n:"KAZAKHSTAN",   lo:67,  la:48 },
  {n:"SAUDI ARABIA",lo:45, la:24 }, {n:"ITALY",        lo:12,  la:43 },
  {n:"SWEDEN",     lo:17,  la:62 }, {n:"NORWAY",       lo:9,   la:64 },
  {n:"BELARUS",    lo:28,  la:53 }, {n:"ROMANIA",      lo:25,  la:46 },
];
const CITIES = [
  {n:"Kyiv",        lo:30.5, la:50.5}, {n:"Moscow",      lo:37.6,  la:55.8 },
  {n:"London",      lo:-0.1, la:51.5}, {n:"Paris",       lo:2.4,   la:48.9 },
  {n:"Berlin",      lo:13.4, la:52.5}, {n:"Warsaw",      lo:21.0,  la:52.2 },
  {n:"Budapest",    lo:19.1, la:47.5}, {n:"Vienna",      lo:16.4,  la:48.2 },
  {n:"Rome",        lo:12.5, la:41.9}, {n:"Madrid",      lo:-3.7,  la:40.4 },
  {n:"Istanbul",    lo:29.0, la:41.0}, {n:"Amsterdam",   lo:4.9,   la:52.4 },
  {n:"Prague",      lo:14.4, la:50.1}, {n:"Bucharest",   lo:26.1,  la:44.4 },
  {n:"New York",    lo:-74.0,la:40.7}, {n:"Los Angeles", lo:-118.2,la:34.1 },
  {n:"Chicago",     lo:-87.6,la:41.9}, {n:"Toronto",     lo:-79.4, la:43.7 },
  {n:"Mexico City", lo:-99.1,la:19.4}, {n:"São Paulo",   lo:-46.6, la:-23.5},
  {n:"Buenos Aires",lo:-58.4,la:-34.6},{n:"Rio",         lo:-43.2, la:-22.9},
  {n:"Beijing",     lo:116.4,la:39.9}, {n:"Shanghai",    lo:121.5, la:31.2 },
  {n:"Tokyo",       lo:139.7,la:35.7}, {n:"Seoul",       lo:127.0, la:37.6 },
  {n:"Bangkok",     lo:100.5,la:13.8}, {n:"Jakarta",     lo:106.8, la:-6.2 },
  {n:"Singapore",   lo:103.8,la:1.4 }, {n:"Mumbai",      lo:72.8,  la:19.1 },
  {n:"Delhi",       lo:77.2, la:28.6}, {n:"Dhaka",       lo:90.4,  la:23.7 },
  {n:"Tehran",      lo:51.4, la:35.7}, {n:"Dubai",       lo:55.3,  la:25.2 },
  {n:"Cairo",       lo:31.2, la:30.1}, {n:"Lagos",       lo:3.4,   la:6.5  },
  {n:"Nairobi",     lo:36.8, la:-1.3}, {n:"Johannesburg",lo:28.0,  la:-26.2},
  {n:"Sydney",      lo:151.2,la:-33.9},{n:"Melbourne",   lo:145.0, la:-37.8},
  {n:"Kharkiv",     lo:36.2, la:50.0}, {n:"Lviv",        lo:24.0,  la:49.8 },
  {n:"Odesa",       lo:30.7, la:46.5}, {n:"Dnipro",      lo:35.0,  la:48.5 },
  {n:"Riyadh",      lo:46.7, la:24.7}, {n:"Karachi",     lo:67.0,  la:24.9 },
  {n:"Hanoi",       lo:105.8,la:21.0}, {n:"Manila",      lo:121.0, la:14.6 },
  {n:"Kuala Lumpur",lo:101.7,la:3.1 }, {n:"Casablanca",  lo:-7.6,  la:33.6 },
  {n:"Minsk",       lo:27.6, la:53.9}, {n:"Vilnius",     lo:25.3,  la:54.7 },
];

// ── Props ─────────────────────────────────────────────────────────
export interface EarthGlobeProps {
  size?:       number;
  autoRotate?: boolean;
  borderGlow?: boolean;
  onRotate?:   (rx:number, ry:number) => void;
  onZoom?:     (zoom:number, flat:number) => void;
}

// ═══════════════════════════════════════════════════════════════
export function EarthGlobe({
  size=420, autoRotate=true, borderGlow=true, onRotate, onZoom,
}: EarthGlobeProps) {

  const cvs      = useRef<HTMLCanvasElement>(null);
  const raf      = useRef<number>(0);
  const rxRef    = useRef(-0.32);
  const ryRef    = useRef(0.0);
  const autoR    = useRef(autoRotate);
  const drag     = useRef(false);
  const lastXY   = useRef({x:0,y:0});
  const zoom     = useRef(1.0);
  const prevFlat = useRef(-1);
  // Stable callback refs — never trigger useEffect restarts
  const cbRot    = useRef(onRotate);
  const cbZoom   = useRef(onZoom);
  useEffect(()=>{ cbRot.current  = onRotate; },[onRotate]);
  useEffect(()=>{ cbZoom.current = onZoom;   },[onZoom]);
  const rings    = useRef<[number,number][][]>([]);
  const [ready,  setReady] = useState(false);

  useEffect(()=>{ autoR.current = autoRotate; },[autoRotate]);

  // Load world geometry
  useEffect(()=>{
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json())
      .then((t:Topology)=>{ rings.current=buildRings(t); setReady(true); })
      .catch(()=>setReady(true));
  },[]);

  // ── Pointer events ───────────────────────────────────────────
  const onDown = useCallback((e:MouseEvent)=>{
    drag.current=true; autoR.current=false;
    lastXY.current={x:e.clientX,y:e.clientY};
    if (cvs.current) cvs.current.style.cursor="grabbing";
  },[]);

  const onMove = useCallback((e:MouseEvent)=>{
    if (!drag.current) return;
    const rect = cvs.current?.getBoundingClientRect();
    const scl  = rect ? size/rect.width : 1;
    const z    = zoom.current;
    const flat = c01((z-1.5)/2.5);
    const base = size*0.42;
    // Sphere: angular sensitivity. Flat: 1 px mouse = 1 px map pan.
    const sS   = 0.007*scl;
    const fS   = Math.PI/2 / (base * Math.max(z,1));
    const sens = lerp(sS,fS,flat);
    ryRef.current += (e.clientX-lastXY.current.x)*sens;
    rxRef.current  = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05,
      rxRef.current+(e.clientY-lastXY.current.y)*sens));
    lastXY.current = {x:e.clientX,y:e.clientY};
    cbRot.current?.(rxRef.current,ryRef.current);
  },[size]);

  const onUp = useCallback(()=>{
    drag.current=false;
    if (cvs.current) cvs.current.style.cursor="grab";
  },[]);

  const onWheel = useCallback((e:WheelEvent)=>{
    e.preventDefault();
    zoom.current = Math.max(0.4, Math.min(20, zoom.current*(e.deltaY<0?1.11:0.90)));
  },[]);

  useEffect(()=>{
    const c=cvs.current; if (!c) return;
    c.style.cursor="grab";
    c.addEventListener("mousedown",onDown);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    c.addEventListener("wheel",onWheel,{passive:false});
    return ()=>{
      c.removeEventListener("mousedown",onDown);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      c.removeEventListener("wheel",onWheel);
    };
  },[onDown,onMove,onUp,onWheel]);

  // ── Render loop ──────────────────────────────────────────────
  useEffect(()=>{
    const canvas=cvs.current; if (!canvas) return;
    const ctx=canvas.getContext("2d"); if (!ctx) return;

    // Random stars (generated once)
    const stars = Array.from({length:200},()=>({
      x:Math.random()*size, y:Math.random()*size,
      r:0.4+Math.random()*1.0, a:0.12+Math.random()*0.6,
      ph:Math.random()*Math.PI*2, sp:0.4+Math.random()*1.2,
    }));
    let tick=0;

    function frame() {
      tick+=0.016;
      const z    = zoom.current;
      // flat=0 → pure sphere,  flat=1 → pure flat map
      const flat = c01((z-1.5)/2.5);
      const base = size*0.42;

      // ─────────────────────────────────────────────────────
      //  FIX ①  sphere radius capped at baseR
      //  At z≤1 the sphere can shrink; at z≥1 it stays fixed.
      //  This keeps all 3-D projected positions within the canvas.
      // ─────────────────────────────────────────────────────
      const sR   = base * Math.min(z, 1.0);   // sphere radius (projection + visuals)
      const fscl = base * z / 90;             // flat: px per degree

      const cx=size/2, cy=size/2;
      const rx=rxRef.current, ry=ryRef.current;

      // ─────────────────────────────────────────────────────
      //  FIX ②  correct view-centre lon / lat
      //  Derivation: camera direction [0,0,1] unrotated to world:
      //    x_w = -cos(rx)·sin(ry)
      //    y_w =  sin(rx)
      //    z_w =  cos(rx)·cos(ry)
      //  → lat = asin(y_w) ≈ rx
      //    lon = atan2(z_w, x_w) = atan2(cos(ry), -sin(ry))
      // ─────────────────────────────────────────────────────
      const cLon = Math.atan2(Math.cos(ry), -Math.sin(ry)) * 180/Math.PI;
      const cLat = rx * 180/Math.PI;

      // Throttled parent notification
      const fr = Math.round(flat*100);
      if (fr!==prevFlat.current) { prevFlat.current=fr; cbZoom.current?.(z,flat); }

      // Auto-rotate only when spherical
      if (autoR.current && flat<0.12) {
        ryRef.current += 0.0025*(1-flat*8);
        cbRot.current?.(rxRef.current,ryRef.current);
      }

      // ─────────────────────────────────────────────────────
      //  PROJECTION FUNCTION
      //  Returns [screenX, screenY, z3]
      //  z3 is the raw depth (-1=back, +1=front); used for
      //  the visibility gate — NOT averaged with flat here.
      // ─────────────────────────────────────────────────────
      function proj(lon:number, lat:number): [number,number,number] {
        const [gx,gy,gz] = geo3d(lon,lat);           // no spread issues
        const [x3,y3,z3] = rot3d(gx,gy,gz, rx,ry);

        // Sphere screen pos (always inside canvas — sR≤base)
        const sX = cx + x3*sR;
        const sY = cy - y3*sR;

        // Flat screen pos (scales with zoom)
        const fX = cx + dLon(lon,cLon)*fscl;
        const fY = cy - (lat-cLat)*fscl;

        return [lerp(sX,fX,flat), lerp(sY,fY,flat), z3];
      }

      // ─────────────────────────────────────────────────────
      //  FIX ③  visibility gate
      //  z3 + flat > 0
      //    flat=0  → only z3>0  (front hemisphere only)
      //    flat=0.5→ z3>-0.5   (half the back revealed)
      //    flat=1  → always true (full flat map)
      //  This is the ONLY check — no bleed-through mid-transition.
      //  Edge-fade alpha: smoothly dims points near the limb.
      // ─────────────────────────────────────────────────────
      const visible  = (z3:number) => (z3+flat) > 0.005;
      const edgeAlpha= (z3:number) => c01((z3+flat) / Math.max(flat,0.18));

      // ── CLEAR ────────────────────────────────────────────
      ctx.clearRect(0,0,size,size);

      // ── STARS ────────────────────────────────────────────
      if (flat<0.95) {
        const sf = 1-flat;
        for (const s of stars) {
          const b=s.a*(0.55+0.45*Math.sin(tick*s.sp+s.ph))*sf;
          if (b<0.02) continue;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,225,255,${b.toFixed(2)})`; ctx.fill();
        }
      }

      // ── FLAT MAP BACKGROUND ──────────────────────────────
      if (flat>0.02) {
        ctx.save(); ctx.globalAlpha=flat;
        ctx.fillStyle="#030E28"; ctx.fillRect(0,0,size,size);
        const ga=flat*0.12;
        for (let la=-80;la<=80;la+=10) {
          const fy=cy-(la-cLat)*fscl; if (fy<-4||fy>size+4) continue;
          ctx.beginPath(); ctx.moveTo(0,fy); ctx.lineTo(size,fy);
          ctx.strokeStyle=la===0?`rgba(0,180,255,${(ga*2.2).toFixed(2)})`:
                                  `rgba(0,70,200,${ga.toFixed(2)})`;
          ctx.lineWidth=la===0?0.8:0.35; ctx.stroke();
        }
        for (let lo=-180;lo<=180;lo+=10) {
          const fx=cx+dLon(lo,cLon)*fscl; if (fx<-8||fx>size+8) continue;
          ctx.beginPath(); ctx.moveTo(fx,0); ctx.lineTo(fx,size);
          ctx.strokeStyle=lo===0?`rgba(0,180,255,${(ga*2.2).toFixed(2)})`:
                                  `rgba(0,70,200,${ga.toFixed(2)})`;
          ctx.lineWidth=lo===0?0.8:0.35; ctx.stroke();
        }
        ctx.restore();
      }

      // ── ATMOSPHERE outer glow (OUTSIDE clip — intended overflow) ──
      if (flat<0.99) {
        ctx.save(); ctx.globalAlpha=1-flat;
        const ag=ctx.createRadialGradient(cx,cy,sR*0.82,cx,cy,sR*1.38);
        ag.addColorStop(0,   "rgba(15,110,240,0.38)");
        ag.addColorStop(0.35,"rgba(8,60,180,0.22)");
        ag.addColorStop(0.7, "rgba(2,25,95,0.10)");
        ag.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(cx,cy,sR*1.38,0,Math.PI*2);
        ctx.fillStyle=ag; ctx.fill();
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────
      //  FIX ④  CLIP applied — active for entire transition
      //  Removed only at flat≥0.99 (essentially flat map).
      //  Prevents any back-face country from escaping the
      //  sphere silhouette during the morph animation.
      // ─────────────────────────────────────────────────────
      const useClip = flat<0.99;
      if (useClip) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx,cy,sR+1,0,Math.PI*2); ctx.clip();
      }

      // ─────────────────────────────────────────────────────
      //  FIX ⑤  OCEAN drawn INSIDE clip
      //  Because ocean uses sR (same as clip radius), it
      //  never overflows the sphere silhouette.
      // ─────────────────────────────────────────────────────
      if (flat<0.99) {
        ctx.save(); ctx.globalAlpha=1-flat;
        const og=ctx.createRadialGradient(cx-sR*0.22,cy-sR*0.22,0,cx,cy,sR);
        og.addColorStop(0,"#0D3575"); og.addColorStop(0.45,"#071E48"); og.addColorStop(1,"#030E28");
        ctx.beginPath(); ctx.arc(cx,cy,sR,0,Math.PI*2);
        ctx.fillStyle=og; ctx.fill();
        ctx.restore();
      }

      // ── SPHERE GRID ──────────────────────────────────────
      if (flat<0.96) {
        ctx.save(); ctx.globalAlpha=(1-flat)*0.82;
        // Latitude lines
        for (let la=-80;la<=80;la+=20) {
          ctx.beginPath(); let pv=false;
          for (let lo=-180;lo<=180;lo+=2) {
            const [px,py,z3]=proj(lo,la);
            if (!visible(z3)){pv=false;continue;}
            if (!pv) ctx.moveTo(px,py); else ctx.lineTo(px,py);
            pv=true;
          }
          ctx.strokeStyle=la===0?"rgba(0,180,255,0.22)":"rgba(0,85,185,0.09)";
          ctx.lineWidth=la===0?0.8:0.4; ctx.stroke();
        }
        // Longitude lines
        for (let lo=-180;lo<180;lo+=20) {
          ctx.beginPath(); let pv=false;
          for (let la=-85;la<=85;la+=2) {
            const [px,py,z3]=proj(lo,la);
            if (!visible(z3)){pv=false;continue;}
            if (!pv) ctx.moveTo(px,py); else ctx.lineTo(px,py);
            pv=true;
          }
          ctx.strokeStyle=lo===0?"rgba(0,180,255,0.22)":"rgba(0,85,185,0.09)";
          ctx.lineWidth=lo===0?0.8:0.4; ctx.stroke();
        }
        ctx.restore();
      }

      // ── COUNTRY FILLS ─────────────────────────────────────
      ctx.fillStyle="rgba(14,72,162,0.30)";
      for (const ring of rings.current) {
        if (ring.length<3) continue;
        ctx.beginPath();
        let prevPx=0, pv=false, started=false;
        for (let i=0;i<=ring.length;i++) {
          const [lo,la]=ring[i%ring.length];
          const [px,py,z3]=proj(lo,la);
          const ok=visible(z3);
          // Dateline jump detection (flat mode only)
          const jump=pv && Math.abs(px-prevPx)>size*0.65;
          if      (i===0)      { if(ok){ctx.moveTo(px,py);started=true;} }
          else if (jump)       { if(ok) ctx.moveTo(px,py); }
          else if (ok&&pv)     ctx.lineTo(px,py);
          else if (ok&&!pv)    { ctx.moveTo(px,py); started=true; }
          pv=ok&&!jump; prevPx=px;
        }
        if (started) ctx.fill();
      }

      // ── COUNTRY BORDERS ───────────────────────────────────
      ctx.strokeStyle="rgba(0,215,255,0.72)";
      ctx.lineWidth=0.55;
      ctx.shadowColor="rgba(0,195,255,0.42)";
      ctx.shadowBlur=flat<0.5?2.5:1.0;
      for (const ring of rings.current) {
        if (ring.length<2) continue;
        ctx.beginPath();
        let prevPx=0, pv=false;
        for (let i=0;i<ring.length;i++) {
          const [lo,la]=ring[i];
          const [px,py,z3]=proj(lo,la);
          const ok=visible(z3);
          const jump=pv && Math.abs(px-prevPx)>size*0.65;
          if (!pv||jump) { if(ok) ctx.moveTo(px,py); }
          else if (ok)   ctx.lineTo(px,py);
          pv=ok&&!jump; prevPx=px;
        }
        ctx.stroke();
      }
      ctx.shadowBlur=0;

      // ── SPECULAR + NIGHT SHADOW ───────────────────────────
      if (flat<0.99) {
        ctx.save(); ctx.globalAlpha=1-flat;
        const sp=ctx.createRadialGradient(cx-sR*0.30,cy-sR*0.30,0,cx,cy,sR);
        sp.addColorStop(0,"rgba(150,235,255,0.09)"); sp.addColorStop(0.22,"rgba(70,150,255,0.04)"); sp.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=sp; ctx.fillRect(0,0,size,size);
        const nt=ctx.createRadialGradient(cx+sR*0.38,cy+sR*0.10,0,cx,cy,sR);
        nt.addColorStop(0,"rgba(0,0,0,0)"); nt.addColorStop(0.38,"rgba(0,0,0,0)");
        nt.addColorStop(0.65,"rgba(0,0,22,0.18)"); nt.addColorStop(1,"rgba(0,0,16,0.42)");
        ctx.fillStyle=nt; ctx.fillRect(0,0,size,size);
        ctx.restore();
      }

      // End clip
      if (useClip) ctx.restore();

      // ── SPHERE BORDER GLOW (outside clip) ─────────────────
      if (borderGlow && flat<0.99) {
        ctx.save(); ctx.globalAlpha=1-flat;
        ctx.beginPath(); ctx.arc(cx,cy,sR,0,Math.PI*2);
        ctx.strokeStyle="rgba(0,195,255,0.52)"; ctx.lineWidth=1.8;
        ctx.shadowColor="rgba(0,170,255,0.72)"; ctx.shadowBlur=14;
        ctx.stroke(); ctx.shadowBlur=0;
        ctx.restore();
      }

      // ── LOADING indicator ─────────────────────────────────
      if (!ready) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx,cy,sR,0,Math.PI*2); ctx.clip();
        ctx.font=`${Math.round(size*0.037)}px 'Courier New',monospace`;
        ctx.fillStyle="rgba(0,210,255,0.70)"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("LOADING MAP DATA...",cx,cy);
        ctx.restore();
      }

      // ════════════════════════════════════════════════════
      //  PROGRESSIVE LABELS
      //  T0 Continents  zoom 0.6 – 2.6
      //  T1 Countries   zoom 1.8 – 7.0
      //  T2 Cities      zoom 4.0+
      // ════════════════════════════════════════════════════
      function label(
        name:string,lon:number,lat:number,
        fs:number,col:string,dot:number,alpha:number
      ){
        const [px,py,z3]=proj(lon,lat);
        if (!visible(z3)) return;
        const a=alpha*edgeAlpha(z3);
        if (a<0.04) return;
        if (px<-55||px>size+55||py<-28||py>size+28) return;
        ctx.save(); ctx.globalAlpha=a;
        if (dot>0) {
          ctx.beginPath(); ctx.arc(px,py,dot,0,Math.PI*2);
          ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=dot*3.5;
          ctx.fill(); ctx.shadowBlur=0;
        }
        ctx.font=`${fs}px 'Courier New',monospace`;
        ctx.fillStyle=col; ctx.textAlign="center"; ctx.textBaseline="bottom";
        ctx.shadowColor="rgba(0,4,18,0.98)"; ctx.shadowBlur=6;
        ctx.fillText(name,px,py-dot-2);
        ctx.shadowBlur=0; ctx.restore();
      }

      const contA = c01(Math.min((z-0.6)/0.5, (2.6-z)/0.9));
      if (contA>0.03) CONTINENTS.forEach(c=>label(c.n,c.lo,c.la,12,"rgba(0,215,255,1)",0,contA));

      const ctryA = c01(Math.min((z-1.8)/1.1, (7.0-z)/1.5));
      if (ctryA>0.03) COUNTRIES.forEach(c=>label(c.n,c.lo,c.la,9,"rgba(160,225,255,1)",1.5,ctryA));

      const cityA = c01((z-4.0)/1.6);
      if (cityA>0.03) CITIES.forEach(c=>label(c.n,c.lo,c.la,8,"rgba(130,210,255,1)",1.2,cityA));

      // ── Mode HUD ─────────────────────────────────────────
      if (flat>0.04||z>1.25) {
        const hud = flat>0.95?`FLAT MAP  ${z.toFixed(1)}×`
                  : flat>0.04?`◐  ${z.toFixed(1)}×`
                  : `${z.toFixed(1)}×`;
        ctx.save();
        ctx.font="8px 'Courier New',monospace";
        ctx.fillStyle=`rgba(0,190,255,${Math.min(0.55,flat*0.8+0.22).toFixed(2)})`;
        ctx.textAlign="right"; ctx.textBaseline="bottom";
        ctx.fillText(hud,size-7,size-7);
        ctx.restore();
      }

      raf.current=requestAnimationFrame(frame);
    }

    raf.current=requestAnimationFrame(frame);
    return ()=>cancelAnimationFrame(raf.current);

  // Callbacks via stable refs — this effect never restarts on prop change
  },[size,ready,borderGlow]);

  return <canvas ref={cvs} width={size} height={size} style={{display:"block"}}/>;
}
