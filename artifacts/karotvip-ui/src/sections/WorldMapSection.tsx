// ═══════════════════════════════════════════════════════════════
//  WORLD MAP SECTION — 3D Globe + Population Dashboard
//  Replaces the old flat 2-D canvas map entirely.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { EarthGlobe } from "../components/EarthGlobe";

// ── Real-time world population ──────────────────────────────────
// Base: ~8 093 400 000 on 2026-01-01T00:00:00Z
// Net growth: ~75 M / year  ≈  2.378 people / second
const POP_BASE   = 8_093_400_000;
const POP_REF_MS = new Date("2026-01-01T00:00:00Z").getTime();
const POP_RATE   = 2.378; // people per second

function getWorldPop(): number {
  const elapsed = (Date.now() - POP_REF_MS) / 1000;
  return Math.round(POP_BASE + elapsed * POP_RATE);
}

function formatPop(n: number): string {
  return n.toLocaleString("uk-UA");
}

// ── Regional breakdown ──────────────────────────────────────────
const REGIONS = [
  { name: "АЗІЯ",         pct: 59.5, color: "#00D4FF", pop: "4.82B" },
  { name: "АФРИКА",       pct: 17.8, color: "#FF3B8F", pop: "1.44B" },
  { name: "ЄВРОПА",       pct:  9.2, color: "#7C4DFF", pop: "0.75B" },
  { name: "ПН. АМЕРИКА",  pct:  7.4, color: "#00FF88", pop: "0.60B" },
  { name: "ПД. АМЕРИКА",  pct:  5.5, color: "#FFB300", pop: "0.44B" },
  { name: "ОКЕАНІЯ",      pct:  0.6, color: "#00E5FF", pop: "0.05B" },
];

const BIRTHS_PER_DAY = 385_000;
const DEATHS_PER_DAY = 163_000;

// ── Mini sparkline ──────────────────────────────────────────────
function Spark({ color, w = 78, h = 20 }: { color: string; w?: number; h?: number }) {
  const pts = Array.from({ length: 20 }, (_, i) =>
    0.35 + 0.45 * Math.abs(Math.sin(i * 0.7 + color.length))
  );
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={pts.map((v, i) => `${(i / 19) * w},${h - v * h}`).join(" ")}
        fill="none" stroke={color} strokeWidth={1.3} opacity={0.75}
      />
      <polygon
        points={`0,${h} ${pts.map((v, i) => `${(i / 19) * w},${h - v * h}`).join(" ")} ${w},${h}`}
        fill={color} opacity={0.07}
      />
    </svg>
  );
}

// ── Donut chart ─────────────────────────────────────────────────
function Donut() {
  const cx = 44, cy = 44, R = 34, r = 22;
  let angle = -Math.PI / 2;
  const slices = REGIONS.map(reg => {
    const start = angle;
    angle += (reg.pct / 100) * 2 * Math.PI;
    return { ...reg, start, end: angle };
  });
  function arc(startA: number, endA: number): string {
    const x1 = cx + R * Math.cos(startA), y1 = cy + R * Math.sin(startA);
    const x2 = cx + R * Math.cos(endA),   y2 = cy + R * Math.sin(endA);
    const ix1 = cx + r * Math.cos(endA),  iy1 = cy + r * Math.sin(endA);
    const ix2 = cx + r * Math.cos(startA),iy2 = cy + r * Math.sin(startA);
    const lg = endA - startA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2}
            L ${ix1} ${iy1} A ${r} ${r} 0 ${lg} 0 ${ix2} ${iy2} Z`;
  }
  return (
    <svg width={88} height={88}>
      {slices.map(s => (
        <path key={s.name} d={arc(s.start, s.end)} fill={s.color} opacity={0.85}
          style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }} />
      ))}
      <circle cx={cx} cy={cy} r={r - 1} fill="#030B17" />
    </svg>
  );
}

// ── Section props ───────────────────────────────────────────────
interface WorldMapSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function WorldMapSection({ onClose, onSound }: WorldMapSectionProps) {
  const [visible,      setVisible]      = useState(false);
  const [blink,        setBlink]        = useState(true);
  const [worldPop,     setWorldPop]     = useState(getWorldPop());
  const [todayBirths,  setTodayBirths]  = useState(0);
  const [todayDeaths,  setTodayDeaths]  = useState(0);
  // tracks globe zoom state for adaptive UI
  const [globeFlat,    setGlobeFlat]    = useState(0);   // 0=sphere, 1=flat
  const [globeZoom,    setGlobeZoom]    = useState(1.0);

  // mount animation
  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  // blink dot
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 700);
    return () => clearInterval(id);
  }, []);

  // real-time population counter (every second)
  useEffect(() => {
    const id = setInterval(() => {
      setWorldPop(getWorldPop());
      const n   = new Date();
      const sec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
      setTodayBirths(Math.round(BIRTHS_PER_DAY * sec / 86400));
      setTodayDeaths(Math.round(DEATHS_PER_DAY * sec / 86400));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("uk-UA", { hour12: false });
  const dateStr = now.toLocaleDateString("uk-UA");
  const mono    = "'Courier New', monospace";

  // shared box style
  const box: CSSProperties = {
    background: "rgba(0,20,55,0.40)",
    border:     "1px solid rgba(0,60,170,0.18)",
    borderRadius: 5,
    padding:    "9px 10px",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110 }}>
      <div style={{
        width: "100vw", height: "100vh",
        background: "#030B17",
        transform:  visible ? "scale(1)"   : "scale(0.97)",
        opacity:    visible ? 1            : 0,
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        display:    "flex", flexDirection: "column",
        overflow:   "hidden", position: "relative",
        fontFamily: mono,
      }}>

        {/* ── dot-grid background ── */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,100,200,0.18) 1px, transparent 1px)",
          backgroundSize:  "28px 28px",
        }} />

        {/* ── corner brackets ── */}
        {([
          { top:12,    left:12,    borderTop:"1.5px solid rgba(0,185,255,0.55)",    borderLeft:"1.5px solid rgba(0,185,255,0.55)"  },
          { top:12,    right:12,   borderTop:"1.5px solid rgba(0,185,255,0.55)",    borderRight:"1.5px solid rgba(0,185,255,0.55)" },
          { bottom:12, left:12,    borderBottom:"1.5px solid rgba(0,185,255,0.55)", borderLeft:"1.5px solid rgba(0,185,255,0.55)"  },
          { bottom:12, right:12,   borderBottom:"1.5px solid rgba(0,185,255,0.55)", borderRight:"1.5px solid rgba(0,185,255,0.55)" },
        ] as CSSProperties[]).map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 30, height: 30, zIndex: 20, ...s }} />
        ))}

        {/* ── close ── */}
        <button onClick={handleClose} style={{
          position:"absolute", top:14, right:16, zIndex:30,
          background:"rgba(255,30,30,0.08)", border:"1px solid rgba(255,60,60,0.28)",
          borderRadius:4, color:"rgba(255,80,80,0.70)", cursor:"pointer",
          fontSize:12, width:28, height:28, fontFamily:mono,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,30,30,0.22)"; e.currentTarget.style.color = "#ff5555"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,30,30,0.08)"; e.currentTarget.style.color = "rgba(255,80,80,0.70)"; }}
        >✕</button>

        {/* ══════════════════════════════════════════════════════
            TOP BAR  —  Population Counter
        ══════════════════════════════════════════════════════ */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 52px 7px", flexShrink:0, zIndex:10,
          borderBottom:"1px solid rgba(0,100,220,0.14)",
          background:"rgba(0,4,14,0.92)",
        }}>

          {/* left: branding */}
          <div>
            <div style={{ fontSize:9, color:"rgba(0,205,255,0.75)", letterSpacing:"0.22em" }}>
              M.A.R.T.I.N. · EARTH MONITOR
            </div>
            <div style={{ fontSize:7.5, color:"rgba(0,130,255,0.36)", letterSpacing:"0.12em", marginTop:2 }}>
              GEO-INTELLIGENCE SYSTEM · ONLINE
            </div>
          </div>

          {/* center: LIVE POPULATION */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:7.5, color:"rgba(0,160,255,0.45)", letterSpacing:"0.26em", marginBottom:4 }}>
              НАСЕЛЕННЯ ПЛАНЕТИ ЗЕМЛЯ · РЕАЛЬНИЙ ЧАС
            </div>
            <div style={{
              fontSize:38, fontWeight:"bold", color:"#00E5FF",
              letterSpacing:"0.07em", lineHeight:1,
              textShadow:"0 0 24px rgba(0,220,255,0.95), 0 0 60px rgba(0,160,255,0.50)",
            }}>
              {formatPop(worldPop)}
            </div>
            <div style={{
              display:"flex", gap:18, justifyContent:"center",
              marginTop:5, fontSize:8, letterSpacing:"0.10em",
            }}>
              <span style={{ color:"#00FF88" }}>▲ {todayBirths.toLocaleString("uk-UA")} народилось сьогодні</span>
              <span style={{ color:"#FF3B8F" }}>▼ {todayDeaths.toLocaleString("uk-UA")} померло сьогодні</span>
            </div>
          </div>

          {/* right: clock + live dot */}
          <div style={{ textAlign:"right", fontSize:9, lineHeight:2, color:"rgba(0,160,255,0.45)", letterSpacing:"0.08em" }}>
            <div style={{ color:"rgba(0,210,255,0.78)", fontSize:20, fontWeight:"bold" }}>{timeStr}</div>
            <div style={{ fontSize:8.5 }}>{dateStr}</div>
            <div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"flex-end", marginTop:2 }}>
              <div style={{
                width:5, height:5, borderRadius:"50%",
                background: blink ? "#00FF88" : "rgba(0,255,136,0.06)",
                boxShadow:  blink ? "0 0 7px #00FF88" : "none",
                border: "1px solid rgba(0,255,136,0.70)",
                transition: "all 0.3s",
              }} />
              <span style={{ fontSize:7.5, color: blink ? "rgba(0,210,255,0.55)" : "rgba(0,210,255,0.25)", transition:"color 0.3s" }}>
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            MAIN 3-COLUMN LAYOUT
        ══════════════════════════════════════════════════════ */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", zIndex:5 }}>

          {/* ─── LEFT PANEL ─── */}
          <div style={{
            width:225, flexShrink:0,
            background:"rgba(0,5,18,0.75)",
            borderRight:"1px solid rgba(0,80,180,0.18)",
            display:"flex", flexDirection:"column",
            padding:"14px 11px", gap:10, overflowY:"auto",
          }}>
            <div style={{ fontSize:7.5, color:"rgba(0,200,255,0.48)", letterSpacing:"0.22em", marginBottom:2 }}>
              SIGNAL DATA
            </div>

            {/* donut + legend */}
            <div style={box}>
              <div style={{ fontSize:7, color:"rgba(0,180,255,0.48)", letterSpacing:"0.14em", marginBottom:7 }}>
                РОЗПОДІЛ НАСЕЛЕННЯ
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <Donut />
                <div style={{ display:"flex", flexDirection:"column", gap:3.5 }}>
                  {REGIONS.map(r => (
                    <div key={r.name} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{
                        width:5, height:5, borderRadius:1, flexShrink:0,
                        background:r.color, boxShadow:`0 0 3px ${r.color}88`,
                      }} />
                      <span style={{ fontSize:7, color:"rgba(200,220,255,0.60)" }}>{r.name}</span>
                      <span style={{ fontSize:7, color:r.color, marginLeft:"auto" }}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* per-region bars */}
            {REGIONS.map(r => (
              <div key={r.name} style={box}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:7, color:"rgba(180,210,255,0.58)", letterSpacing:"0.08em" }}>{r.name}</span>
                  <span style={{ fontSize:7.5, color:r.color, fontWeight:"bold" }}>{r.pop}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <Spark color={r.color} w={78} h={20} />
                  <span style={{ fontSize:7, color:r.color, opacity:0.70 }}>{r.pct}%</span>
                </div>
                <div style={{ marginTop:4, height:2, background:"rgba(0,60,140,0.35)", borderRadius:1 }}>
                  <div style={{
                    height:"100%", width:`${Math.min(100, r.pct * 1.68)}%`,
                    background:`linear-gradient(90deg, ${r.color}44, ${r.color})`,
                    borderRadius:1, boxShadow:`0 0 5px ${r.color}88`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* ─── CENTER: 3-D GLOBE ─── */}
          <div style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            position:"relative",
          }}>

            {/* tab bar (purely decorative, like in the reference image) */}
            <div style={{
              position:"absolute", top:0, left:0, right:0,
              display:"flex",
              borderBottom:"1px solid rgba(0,80,200,0.18)",
              background:"rgba(0,4,14,0.72)", zIndex:5,
            }}>
              {["DATABASE","SYSTEM","KERNAL","HUB"].map((tab, i) => (
                <div key={tab} style={{
                  padding:"7px 20px", fontSize:8, letterSpacing:"0.17em",
                  color:      i === 1 ? "#00D4FF" : "rgba(0,140,255,0.35)",
                  borderBottom: i === 1 ? "2px solid #00D4FF" : "2px solid transparent",
                  borderRight:  "1px solid rgba(0,80,200,0.14)",
                  background:   i === 1 ? "rgba(0,60,140,0.12)" : "transparent",
                  cursor: "pointer",
                }}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Globe with halo rings — rings fade when flat */}
            <div style={{
              position:"relative",
              display:"flex", alignItems:"center", justifyContent:"center",
              marginTop: 36,
            }}>
              {/* outer ambient glow — fades as flatness increases */}
              <div style={{
                position:"absolute",
                width:500, height:500, borderRadius:"50%",
                boxShadow:"0 0 90px rgba(0,155,255,0.16), 0 0 180px rgba(0,80,200,0.09)",
                opacity: 1 - globeFlat,
                transition:"opacity 0.3s",
                pointerEvents:"none",
              }} />
              {/* animated pulse ring 1 */}
              <div style={{
                position:"absolute", width:484, height:484, borderRadius:"50%",
                border:"1px solid rgba(0,180,255,0.10)",
                animation:"wm-pulse 3.5s ease-in-out infinite",
                opacity: 1 - globeFlat,
                transition:"opacity 0.4s",
                pointerEvents:"none",
              }} />
              {/* animated pulse ring 2 */}
              <div style={{
                position:"absolute", width:524, height:524, borderRadius:"50%",
                border:"0.5px solid rgba(0,150,255,0.06)",
                animation:"wm-pulse 5s ease-in-out infinite 1.2s",
                opacity: 1 - globeFlat,
                transition:"opacity 0.4s",
                pointerEvents:"none",
              }} />

              {/* THE GLOBE — zoom-to-flat morph + progressive labels */}
              <EarthGlobe
                size={460}
                autoRotate={true}
                borderGlow={true}
                onZoom={(z, f) => { setGlobeZoom(z); setGlobeFlat(f); }}
              />

              {/* crosshair — visible only in sphere mode */}
              {globeFlat < 0.8 && (
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity: 1 - globeFlat * 1.25,
                }}>
                  <div style={{ position:"relative", width:460, height:460 }}>
                    <div style={{
                      position:"absolute", top:"50%", left:"6%", right:"6%",
                      height:1, background:"rgba(0,180,255,0.06)",
                      transform:"translateY(-50%)",
                    }} />
                    <div style={{
                      position:"absolute", left:"50%", top:"6%", bottom:"6%",
                      width:1, background:"rgba(0,180,255,0.06)",
                      transform:"translateX(-50%)",
                    }} />
                  </div>
                </div>
              )}

              {/* zoom mode badge — appears during transition */}
              {globeFlat > 0.05 && (
                <div style={{
                  position:"absolute", top:-28, left:"50%", transform:"translateX(-50%)",
                  fontSize:7.5, letterSpacing:"0.16em", pointerEvents:"none",
                  color: globeFlat > 0.95 ? "rgba(0,255,136,0.55)" : "rgba(0,200,255,0.45)",
                  transition:"color 0.5s",
                  fontFamily:"'Courier New',monospace",
                }}>
                  {globeFlat > 0.95
                    ? `● FLAT MAP · ${globeZoom.toFixed(1)}×`
                    : `◐ MORPHING → FLAT · ${globeZoom.toFixed(1)}×`}
                </div>
              )}
            </div>

            {/* coordinates bar */}
            <div style={{
              position:"absolute", bottom:12, left:0, right:0,
              display:"flex", justifyContent:"center", gap:26,
              fontSize:8, color:"rgba(0,160,255,0.38)", letterSpacing:"0.10em",
            }}>
              <span>LAT <span style={{ color:"#00C8FF" }}>48.4521°N</span></span>
              <span>LON <span style={{ color:"#00C8FF" }}>28.6187°E</span></span>
              <span style={{ color:"rgba(0,255,136,0.45)" }}>● LIVE TRACKING</span>
              <span>ALT <span style={{ color:"#00C8FF" }}>408 km</span></span>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div style={{
            width:225, flexShrink:0,
            background:"rgba(0,5,18,0.75)",
            borderLeft:"1px solid rgba(0,80,180,0.18)",
            display:"flex", flexDirection:"column",
            padding:"14px 11px", gap:10, overflowY:"auto",
          }}>
            <div style={{ fontSize:7.5, color:"rgba(0,200,255,0.48)", letterSpacing:"0.22em", marginBottom:2 }}>
              LIVE DATA
            </div>

            {/* key metrics */}
            {[
              { label:"НАРОДЖУЄТЬСЯ / СЕК", value:"4.5", color:"#00FF88", icon:"▲" },
              { label:"ПОМИРАЄ / СЕК",       value:"1.9", color:"#FF3B8F", icon:"▼" },
              { label:"ЧИСТИЙ ПРИРІСТ / СЕК",value:"2.4", color:"#00D4FF", icon:"+" },
            ].map(item => (
              <div key={item.label} style={box}>
                <div style={{ fontSize:6.5, color:"rgba(160,190,255,0.42)", letterSpacing:"0.10em", marginBottom:5 }}>
                  {item.label}
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:9, color:item.color }}>{item.icon}</span>
                  <span style={{
                    fontSize:24, color:item.color, fontWeight:"bold", lineHeight:1,
                    textShadow:`0 0 14px ${item.color}88`,
                  }}>{item.value}</span>
                </div>
              </div>
            ))}

            {/* top countries */}
            <div style={box}>
              <div style={{ fontSize:7, color:"rgba(0,180,255,0.48)", letterSpacing:"0.14em", marginBottom:7 }}>
                ТОП КРАЇНИ
              </div>
              {[
                { name:"ІНДІЯ",     val:"1.44B", pct:100 },
                { name:"КИТАЙ",     val:"1.42B", pct:99  },
                { name:"США",       val:"0.34B", pct:24  },
                { name:"ІНДОНЕЗІЯ", val:"0.28B", pct:19  },
                { name:"ПАКИСТАН",  val:"0.24B", pct:17  },
                { name:"БРАЗИЛІЯ",  val:"0.22B", pct:15  },
              ].map(c => (
                <div key={c.name} style={{ marginBottom:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                    <span style={{ fontSize:7, color:"rgba(180,210,255,0.58)" }}>{c.name}</span>
                    <span style={{ fontSize:7, color:"#00D4FF" }}>{c.val}</span>
                  </div>
                  <div style={{ height:2, background:"rgba(0,50,120,0.40)", borderRadius:1 }}>
                    <div style={{
                      height:"100%", width:`${c.pct}%`, borderRadius:1,
                      background:"linear-gradient(90deg, rgba(0,160,255,0.40), rgba(0,220,255,0.85))",
                      boxShadow:"0 0 5px rgba(0,200,255,0.55)",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* telemetry */}
            <div style={box}>
              <div style={{ fontSize:7, color:"rgba(0,180,255,0.48)", letterSpacing:"0.14em", marginBottom:7 }}>
                ТЕЛЕМЕТРІЯ
              </div>
              {[
                { k:"КРАЇН У БАЗІ", v:"195"    },
                { k:"МОВА СИСТЕМ",  v:"UKR"    },
                { k:"ЧАС ВІДНОСН.", v:"UTC+3"  },
                { k:"ORBIT ALT",    v:"408 km" },
                { k:"SIGNAL",       v:"99.7%"  },
              ].map(r => (
                <div key={r.k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:7, color:"rgba(140,180,255,0.40)" }}>{r.k}</span>
                  <span style={{ fontSize:7, color:"rgba(0,200,255,0.70)" }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* location search (decorative) */}
            <div style={{ ...box, fontSize:7, letterSpacing:"0.10em", color:"rgba(0,160,255,0.30)" }}>
              LOCATION SEARCH
              <div style={{
                marginTop:6, height:18,
                background:"rgba(0,40,100,0.30)",
                borderRadius:3, border:"1px solid rgba(0,80,180,0.18)",
                display:"flex", alignItems:"center", paddingLeft:6,
                fontSize:6.5, color:"rgba(0,150,255,0.22)",
              }}>
                ↵ введіть координати...
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            BOTTOM STATUS BAR
        ══════════════════════════════════════════════════════ */}
        <div style={{
          flexShrink:0, zIndex:10,
          borderTop:"1px solid rgba(0,80,200,0.14)",
          background:"rgba(0,4,14,0.92)",
          padding:"5px 52px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ fontSize:7.5, color:"rgba(0,150,255,0.35)", letterSpacing:"0.09em" }}>
            ● M.A.R.T.I.N. GEO CORE · ВІННИЦЯ · UA · 48.4521°N 28.6187°E
          </div>

          <div style={{
            fontSize:7.5, color:"rgba(0,180,255,0.35)", letterSpacing:"0.09em",
            display:"flex", alignItems:"center", gap:6,
          }}>
            <div style={{
              width:5, height:5, borderRadius:"50%",
              background: blink ? "#00FF88" : "rgba(0,255,136,0.05)",
              border:"1px solid rgba(0,255,136,0.55)",
              boxShadow: blink ? "0 0 6px #00FF88" : "none",
              transition:"all 0.3s",
            }} />
            TRACKING · 195 COUNTRIES · +{Math.max(0, worldPop - POP_BASE).toLocaleString("uk-UA")} GROWTH SINCE 2026
          </div>

          <div style={{ fontSize:7, color:"rgba(0,130,255,0.24)", letterSpacing:"0.06em" }}>
            {globeFlat > 0.9
              ? "🖱 PAN MAP · SCROLL ZOOM"
              : globeFlat > 0.1
              ? "🖱 SCROLL ↓ TO FLATTEN"
              : "🖱 DRAG GLOBE · SCROLL TO ZOOM"}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wm-pulse {
          0%,100% { transform: scale(1);    opacity: 0.60; }
          50%      { transform: scale(1.03); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
