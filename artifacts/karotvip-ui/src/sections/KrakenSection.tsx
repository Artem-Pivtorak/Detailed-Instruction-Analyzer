import { useState, useEffect, useMemo } from "react";
import { useI18n } from "../i18n";

interface KrakenSectionProps {
  onClose: () => void;
  onSound: (type: string) => void;
}

const REGIONS = [
  { id: "asia", name: "АСІЯ", color: "#ff0080", population: 4750000000 },
  { id: "europe", name: "ЄВРОПА", color: "#00cfff", population: 745000000 },
  { id: "africa", name: "АФРИКА", color: "#ffff00", population: 1460000000 },
  { id: "americas", name: "АМЕРИКА", color: "#ff0000", population: 1040000000 },
  { id: "oceania", name: "АВСТРАЛІЯ ТА ОКЕАНІЯ", color: "#32ff32", population: 45000000 },
  { id: "antarctica", name: "АНТАРКТИДА", color: "#a855f7", population: 5000 },
];

export function KrakenSection({ onClose, onSound }: KrakenSectionProps) {
  const [visible, setVisible] = useState(false);
  const [totalPop, setTotalPop] = useState(8100000000);
  const [regionPops, setRegionPops] = useState(REGIONS.map(r => r.population));
  const { t } = useI18n();

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    
    // Real-time population simulation
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 3) + 1;
      setTotalPop(prev => prev + increment);
      
      setRegionPops(prev => {
        const next = [...prev];
        // Randomly add to one region
        const idx = Math.floor(Math.random() * 5); // Exclude Antarctica mostly
        next[idx] += increment;
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  function handleClose() {
    setVisible(false);
    onSound("close");
    setTimeout(onClose, 300);
  }

  const formatPop = (num: number) => num.toLocaleString();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", flexDirection: "column",
      background: "#040c1a",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s ease",
      overflow: "hidden",
      color: "white",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Background Grid Decoration */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 180, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 180, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Header with Indicators */}
      <div style={{
        height: 80,
        background: "rgba(5, 15, 30, 0.8)",
        borderBottom: "1px solid rgba(0, 207, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        zIndex: 10,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: "#ff0080",
              boxShadow: "0 0 10px #ff0080",
              animation: "blink-red 1s infinite alternate"
            }} />
            <h1 style={{ fontSize: 24, fontWeight: "bold", letterSpacing: "0.3em", color: "#00cfff" }}>K.R.A.K.E.N.</h1>
          </div>
          
          <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 5 }}>
            {REGIONS.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: r.color,
                  boxShadow: `0 0 8px ${r.color}`,
                  animation: `blink-lamp 0.8s infinite ${i * 0.2}s alternate`
                }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleClose} style={{
          background: "rgba(255, 40, 40, 0.1)", border: "1px solid rgba(255, 40, 40, 0.3)",
          borderRadius: "50%", width: 40, height: 40, color: "#ff4040", cursor: "pointer",
          fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
      </div>

      <style>{`
        @keyframes blink-lamp { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.1); } }
        @keyframes blink-red { from { opacity: 0.5; box-shadow: 0 0 5px #ff0080; } to { opacity: 1; box-shadow: 0 0 20px #ff0080; } }
      `}</style>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", padding: 20, gap: 20, zIndex: 5, position: "relative" }}>
        
        {/* Map Side */}
        <div style={{ flex: 2, position: "relative", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(0,200,255,0.1)", overflow: "hidden" }}>
          {/* Detailed SVG Map would go here, using a placeholder colored rectangle map for logic */}
          <div style={{ position: "absolute", inset: 0, padding: 40 }}>
             {/* World Map SVG with Region Coloring */}
             <svg viewBox="0 0 1000 500" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 10px rgba(0,180,255,0.2))" }}>
                {/* Simplified continents for the prototype */}
                {/* Americas */}
                <path d="M150,50 L250,50 L300,200 L250,450 L100,450 L50,200 Z" fill="none" stroke="#ff0000" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #ff0000)" }} />
                <text x="150" y="250" fill="#ff0000" fontSize="14" style={{ textShadow: "0 0 5px #ff0000" }}>AMERICAS</text>
                
                {/* Europe */}
                <path d="M450,50 L550,50 L580,150 L420,150 Z" fill="none" stroke="#00cfff" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #00cfff)" }} />
                <text x="470" y="100" fill="#00cfff" fontSize="14" style={{ textShadow: "0 0 5px #00cfff" }}>EUROPE</text>

                {/* Africa */}
                <path d="M450,160 L580,160 L550,400 L420,350 Z" fill="none" stroke="#ffff00" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #ffff00)" }} />
                <text x="470" y="280" fill="#ffff00" fontSize="14" style={{ textShadow: "0 0 5px #ffff00" }}>AFRICA</text>

                {/* Asia */}
                <path d="M600,50 L950,50 L900,350 L600,350 Z" fill="none" stroke="#ff0080" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #ff0080)" }} />
                <text x="730" y="200" fill="#ff0080" fontSize="14" style={{ textShadow: "0 0 5px #ff0080" }}>ASIA</text>

                {/* Oceania */}
                <path d="M800,370 L950,370 L950,480 L800,480 Z" fill="none" stroke="#32ff32" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #32ff32)" }} />
                <text x="820" y="430" fill="#32ff32" fontSize="14" style={{ textShadow: "0 0 5px #32ff32" }}>OCEANIA</text>

                {/* Antarctica */}
                <path d="M300,470 L700,470 L700,495 L300,495 Z" fill="none" stroke="#a855f7" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px #a855f7)" }} />
                <text x="450" y="490" fill="#a855f7" fontSize="10" style={{ textShadow: "0 0 5px #a855f7" }}>ANTARCTICA</text>

                {/* Map Grid Lines */}
                <g opacity="0.1">
                  {[100, 200, 300, 400].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#00cfff" />)}
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#00cfff" />)}
                </g>
             </svg>
          </div>
          
          {/* Stats Overlay on Map */}
          <div style={{ position: "absolute", bottom: 20, left: 20, background: "rgba(0,0,0,0.6)", padding: "10px 15px", borderRadius: 8, border: "1px solid rgba(0,200,255,0.3)" }}>
            <div style={{ fontSize: 9, color: "rgba(0,207,255,0.7)" }}>GLOBAL STATUS</div>
            <div style={{ fontSize: 18, color: "#00ff00" }}>ONLINE / ACTIVE</div>
          </div>
        </div>

        {/* Dashboard Side */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Total Population Card */}
          <div style={{
            background: "rgba(0, 15, 30, 0.7)",
            border: "1px solid rgba(0, 207, 255, 0.3)",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 0 30px rgba(0, 207, 255, 0.1)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, letterSpacing: "0.1em" }}>НАСЕЛЕННЯ ЗЕМЛІ (TOTAL)</h3>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#00cfff", textShadow: "0 0 15px rgba(0,207,255,0.5)" }}>
              {formatPop(totalPop)}
            </div>
            <div style={{ fontSize: 9, color: "#32ff32", marginTop: 5 }}>● ОФІЦІЙНО ТА ПРАВДИВО</div>
          </div>

          {/* Regional Statistics List */}
          <div style={{
            flex: 1,
            background: "rgba(0, 15, 30, 0.7)",
            border: "1px solid rgba(0, 207, 255, 0.2)",
            borderRadius: 16,
            padding: 20,
            overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 15 }}>РЕГІОНАЛЬНИЙ РОЗПОДІЛ</h3>
            
            {REGIONS.map((r, i) => (
              <div key={r.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: r.color }}>{r.name}</span>
                  <span style={{ fontSize: 12, color: "white" }}>{formatPop(regionPops[i])}</span>
                </div>
                {/* Bar chart item */}
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${(regionPops[i] / totalPop) * 200}%`, // Multiplier for visual impact
                    height: "100%",
                    background: `linear-gradient(90deg, ${r.color}44, ${r.color})`,
                    boxShadow: `0 0 10px ${r.color}55`,
                    transition: "width 0.5s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Technical Data Frame */}
          <div style={{
             padding: 15, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "rgba(255,255,255,0.02)"
          }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginBottom: 5 }}>CORE LOG</div>
            <div style={{ fontSize: 9, color: "rgba(0,207,255,0.4)" }}>{`> Syncing with UN-STATS...`}</div>
            <div style={{ fontSize: 9, color: "rgba(0,207,255,0.4)" }}>{`> Real-time data feed: ACTIVE`}</div>
          </div>
        </div>
      </div>
      
      {/* Grid Overlay Lines (Thin Decorative) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
          <div style={{ position: "absolute", top: "33%", left: 0, right: 0, height: 1, background: "rgba(0,207,255,0.08)" }} />
          <div style={{ position: "absolute", top: "66%", left: 0, right: 0, height: 1, background: "rgba(0,207,255,0.08)" }} />
          <div style={{ position: "absolute", left: "33%", top: 0, bottom: 0, width: 1, background: "rgba(0,207,255,0.08)" }} />
          <div style={{ position: "absolute", left: "66%", top: 0, bottom: 0, width: 1, background: "rgba(0,207,255,0.08)" }} />
      </div>
    </div>
  );
}
