import React, { useEffect, useRef } from "react";

interface ParticleSphereProps {
  size?: number;
  canvasSize?: number;
  isSpeaking?: boolean;
  analyserNodeRef?: React.RefObject<AnalyserNode | null>;
  // СПРАВЖНІЙ, ідеально синхронізований з бекендом частотний спектр (0-255, оновлюється
  // покадрово під час відтворення через window.__martinAudioBins / _gui_push_audio_bins() у test.py,
  // рахований НАПРЯМУ з тих самих байтів, які саме зараз йдуть у динамік). Це
  // ФАКТИЧНИЙ спектр того, що грає в динаміках ПРЯМО ЗАРАЗ, без жодного дрейфу в часі -
  // на відміну від analyserNodeRef нижче, який читає дані з ОКРЕМОГО прихованого
  // <audio> елемента, який ЩЕ РАЗ перепрограє копію файлу - окреме декодування і можливого
  // збою autoplay-політики браузера.
  audioBinsRef?: React.RefObject<Uint8Array | null>;
}

function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}
function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}
function rotateZ(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
}

interface Ripple { ox: number; oy: number; oz: number; t0: number; amplitude: number; speed: number; freq: number; sigma: number; }

function randomOnSphere(): [number, number, number] {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(th), u, r * Math.sin(th)];
}

function dot3(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
}

export function ParticleSphere({ size = 270, canvasSize = 1000, isSpeaking = false, analyserNodeRef, audioBinsRef }: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    const R = size * 0.34;

    const COUNT = 2200;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const pts: { 
      nx: number; ny: number; nz: number; 
      sx0: number; sy0: number; sz0: number; 
      smDisp: number;
    }[] = [];
    
    for (let i = 0; i < COUNT; i++) {
      const yN = 1 - (i / (COUNT - 1)) * 2;
      const sinPhi = Math.sqrt(Math.max(0, 1 - yN * yN));
      const theta = goldenAngle * i;
      pts.push({ 
        nx: Math.cos(theta) * sinPhi, 
        ny: yN, 
        nz: Math.sin(theta) * sinPhi,
        sx0: (Math.random() - 0.5) * 3000,
        sy0: (Math.random() - 0.5) * 3000,
        sz0: (Math.random() - 0.5) * 3000, 
        smDisp: 1.0,
      });
    }

    const MAX_RIPPLES = 8;
    const ripples: Ripple[] = [];

    function spawnRipple(t: number, opts?: Partial<Ripple>) {
      const [ox, oy, oz] = randomOnSphere();
      ripples.push({
        ox, oy, oz, t0: t,
        amplitude: opts?.amplitude ?? 0.1 + Math.random() * 0.14,
        speed: opts?.speed ?? 0.008 + Math.random() * 0.01,
        freq: opts?.freq ?? 3.0 + Math.random() * 3.0,
        sigma: opts?.sigma ?? 0.28 + Math.random() * 0.32,
      });
    }

    for (let i = 0; i < MAX_RIPPLES; i++) spawnRipple(-(Math.random() * 3.5));

    let rxA = 0, ryA = 0, rzA = 0;
    let t = 0;
    let speedPhase = Math.random() * Math.PI * 2;
    let speechEnv = 0;
    let dataArray: Uint8Array | null = null;
    const startTime = performance.now();

    // Pre-allocate projected array
    const projected: { sx: number; sy: number; sz: number; cr: number; cg: number; cb: number; ca: number; dr: number }[] = 
      Array.from({ length: COUNT }, () => ({ sx: 0, sy: 0, sz: 0, cr: 0, cg: 0, cb: 0, ca: 0, dr: 0 }));

    function draw() {
      ctx!.clearRect(0, 0, canvasSize, canvasSize);

      // ФІКС (2026-08-09): тут раніше був СПРАВЖНІЙ баг: targetEnv йшов до 1.0 НА ВЕСЬ ЧАС Репліки
      // (isSpeaking=true), і activeEnv/speechEnv ЛИШЕ ПІДІЙМАВСЯ, ніколи не занижаючись всередині
      // однієї репліки (`if (activeEnv > speechEnv) speechEnv = activeEnv`). За лерп-фактором 0.1 це
      // означає, що speechEnv досягає ~1.0 вже через півсекунди від початку репліки і
      // залишається там до самого кінця - після цього activeEnv = max(rawEnv, speechEnv≈1.0)
      // ЗАВЖДИ впирається в цю стелю незалежно від реальної гучності в цей конкретний момент -
      // куля виглядала як "просто грає анімацію на максимумі", а не реагувала на
      // тихі/гучні ділянки голосу - а саме на це скаржився користувач. Тепер speechEnv -
      // лише невеликий "живий" фон (ціль всього 0.22, не 1.0), а реальна динаміка повністю
      // йде від rawEnv/bins ЩОКАДРУ без будь-якого накопичення/ратчет-ефекту.
      const targetEnv = isSpeakingRef.current ? 0.22 : 0.0;
      speechEnv += (targetEnv - speechEnv) * 0.12;

      let vol = 0;
      let activeEnv = speechEnv;
      let extraBass = 0;
      // Джерело частотних байтів для цього кадру: СПЕРШУ чергу СПРАВЖНІЙ бекенд-спектр
      // (audioBinsRef - рахований напряму з тих самих байтів, які зараз йдуть у динамік - без
      // жодного дрейфу/повторного декодування), і лише якщо його ще ніколи не прийшло
      // (напр. бекенд ще не зв'язаний або це перша взаємодія) - відкатуємося до старого шляху
      // через браузерний AnalyserNode (прихований <audio>, що перепрограє копію файлу).
      let bins: ArrayLike<number> | null = null;
      const realBins = audioBinsRef?.current;
      if (isSpeakingRef.current && realBins && realBins.length > 0) {
        bins = realBins;
      } else if (analyserNodeRef?.current) {
        if (!dataArray || dataArray.length !== analyserNodeRef.current.frequencyBinCount) {
          dataArray = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
        }
        analyserNodeRef.current.getByteFrequencyData(dataArray as any);
        bins = dataArray;
      }

      if (bins && bins.length > 0) {
        let sum = 0;
        let bassSum = 0;
        const len = bins.length;
        // ~6% нижніх бінів як бас - той самий пропорційний зріз, що й раніше (15 з 256 у AnalyserNode).
        const bassBins = Math.max(1, Math.round(len * 0.06));
        for (let k = 0; k < len; k++) {
          sum += bins[k];
          if (k < bassBins) bassSum += bins[k];
        }
        vol = sum / len / 255.0;
        let bassVol = bassSum / bassBins / 255.0;

        if (isSpeakingRef.current) {
          // Стартове аудіо (і будь-яке інше, яке грає до першої взаємодії користувача з
          // сторінкою) грається через прихований <audio> - браузер може заблокувати
          // autoplay без попереднього користувацького жесту - тоді vol залишається
          // стабільно ~0 незважаючи на isSpeaking=true, і куля виглядає мертвою саме
          // в цей момент (всі інші відтворення працюють нормально, бо до них користувач вже клацнув
          // чи щось натискав в інтерфейсі, тому autoplay там вже дозволений). Це стосується лише
          // фолбек-гілки analyserNodeRef вище - realBins від бекенду не залежать від autoplay взагалі.
          // ФІКС (2026-08-09): раніше тут був рядок `if (activeEnv > speechEnv) speechEnv = activeEnv;`,
          // який НАЗАВЖДИ підіймав speechEnv до будь-якого піку гучності і НІКОЛИ не давав йому
          // опуститися всередині однієї репліки - ось той самий "ратчет", що забивав реальну
          // динаміку голосу. Видалено разом із targetEnv=1.0 вище — тепер activeEnv щокадру
          // повноцінно слідує за реальним rawEnv, лише не падаючи нижче м'якого speechEnv-фону.
          const rawEnv = Math.min(1.2, vol * 2.5);
          activeEnv = Math.max(rawEnv, speechEnv);
          extraBass = Math.min(1.5, bassVol * 2.0);
        }
      }

      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      // Assembly intro duration: 2.5s
      const assemblyProgress = Math.min(1, elapsed / 2.5);
      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - assemblyProgress, 3);
      const invEase = 1 - easeOut;

      speedPhase += 0.004;
      const rawSpeed = 1.0 + 0.45 * Math.sin(speedPhase * 0.32) + 0.22 * Math.sin(speedPhase * 0.68 + 1.0) + 0.08 * Math.sin(speedPhase * 1.28 - 0.5);
      const speedMod = Math.max(0.4, Math.min(1.5, rawSpeed)) + activeEnv * 0.5 + extraBass * 0.2; // faster when speaking
      t += 0.004 * speedMod;
      rxA += 0.00012 * speedMod;
      ryA += 0.00018 * speedMod;
      rzA += (0.00005 * speedMod) + (activeEnv * 0.0003 * Math.sin(t * 10)); // wiggle

      if (Math.random() < 0.006 + activeEnv * 0.02 + extraBass * 0.04) { // more ripples when speaking
        spawnRipple(t, { amplitude: 0.22 + Math.random() * 0.18 + activeEnv * 0.1 + extraBass * 0.15, speed: 0.016 + Math.random() * 0.012 + activeEnv * 0.02, freq: 4.5 + Math.random() * 3.5, sigma: 0.18 + Math.random() * 0.18 });
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if ((t - ripples[i].t0) * ripples[i].speed > Math.PI + 1.6) ripples.splice(i, 1);
      }
      while (ripples.length < MAX_RIPPLES) spawnRipple(t);

      const breathe = 0.05 * Math.sin(t * 0.38) + 0.025 * Math.sin(t * 0.62) + activeEnv * 0.1 * Math.sin(t * 8.0) + extraBass * 0.15 * Math.sin(t * 12.0); // vibrate

      for (let i = 0; i < COUNT; i++) {
        const p = pts[i];
        let totalDisp = breathe;
        for (const rip of ripples) {
          const d = dot3(p.nx, p.ny, p.nz, rip.ox, rip.oy, rip.oz);
          const angDist = Math.acos(Math.max(-1, Math.min(1, d)));
          const elapsedRip = t - rip.t0;
          const wavefront = elapsedRip * rip.speed;
          const distToWave = angDist - wavefront;
          const env = Math.exp(-(distToWave * distToWave) / (2 * rip.sigma * rip.sigma));
          const rippleOsc = Math.sin(rip.freq * distToWave);
          const fade = Math.pow(Math.sin(Math.min(Math.max(wavefront, 0), Math.PI)), 0.55);
          totalDisp += rip.amplitude * rippleOsc * env * fade;
        }
        
        let disp = Math.max(0.7, Math.min(1.3, 1.0 + totalDisp));
        
        // Give each particle a unique "signature" based on its normal coordinates
        const signature = p.nx * 21.34 + p.ny * 34.12 + p.nz * 13.45;

        // Strict rhythmic snapping instead of smooth waves
        let voicePush = 0;
        
        if (isSpeakingRef.current && bins && bins.length > 0 && vol > 0.002) { 
            // Real audio rhythm! Map particle into frequency bins (lower 60% for most action)
            const idx = Math.abs(Math.floor(signature * 7123)) % Math.floor(bins.length * 0.6);
            let val = bins[idx] / 255.0;
            // Square/Cube it to make it sharp and completely remove the "smooth fly/fall wave"
            val = val * val * val; 
            voicePush = activeEnv * 0.85 * val;
        } else if (isSpeakingRef.current) {
            // Dummy fallback rhythmic snap (sharp pop, no smooth wave)
            const wave = Math.sin(t * 22.0 + signature * 15.0);
            const sharpWave = wave > 0.85 ? Math.pow((wave - 0.85) * 6.66, 2.0) : 0;
            voicePush = activeEnv * 0.4 * sharpWave;
        }
        
        disp += voicePush;

        // Smoothly interpolate displacement per-particle - АЛЕ НЕ НАДТО, щоб повністю згладжувати справжні
        // скачки з audioBins - з 0.15 куля відчувалася більш як "плавне дихання", ніж як
        // "вібрація в такт голосу" - особливо тепер, коли activeEnv вже чесно слідує за
        // реальним rawEnv (див. фікс вище від 2026-08-09) — завелике згладжування тут залишалося б
        // затирати цю щойно відновлену динаміку. 0.32 — все ще без різкого "смикання", але вже
        // чітко відчувається кожен бін.
        p.smDisp += (disp - p.smDisp) * 0.32;
        let finalDisp = p.smDisp;

        let px = p.nx * finalDisp * R;
        let py = p.ny * finalDisp * R;
        let pz = p.nz * finalDisp * R;
        
        [px, py, pz] = rotateX(px, py, pz, rxA);
        [px, py, pz] = rotateY(px, py, pz, ryA);
        [px, py, pz] = rotateZ(px, py, pz, rzA);
        const waveAmpBase = 0.03 + activeEnv * 0.02 + extraBass * 0.02;
        const waveSpeed = 1.0 + 0.8 * Math.sin(t * 0.6 + p.nx * 0.9) * (1 + activeEnv * 0.5);
        px += waveAmpBase * Math.sin(p.ny * 4.0 + t * waveSpeed + p.nz * 1.2) * R;
        py += waveAmpBase * Math.cos(p.nx * 3.5 + t * (waveSpeed * 0.9) - p.nz * 1.0) * R;

        // Apply intro scatter assembly
        px += p.sx0 * invEase;
        py += p.sy0 * invEase;
        pz += p.sz0 * invEase;

        const fov = size * 2.0;
        const scale = fov / (fov + pz + R * 0.4);
        const sx = cx + px * scale;
        const sy = cy + py * scale;
        const df = Math.max(0, Math.min(1, (pz + R * 1.4) / (R * 2.8)));
        const dispMod = Math.max(0, Math.min(1, (totalDisp + 0.35) / 0.7));
        const colorV = (p.ny + 1) / 2;
        const blend = colorV * 0.5 + dispMod * 0.28 + ((p.nx + 1) / 2) * 0.22;
        let cr, cg, cb;
        if (blend < 0.28) { const f = blend / 0.28; cr = 15 + f * 90; cg = 8 + f * 5; cb = 210 + f * 25; }
        else if (blend < 0.52) { const f = (blend - 0.28) / 0.24; cr = 105 + f * 120; cg = 13 - f * 8; cb = 235 - f * 60; }
        else if (blend < 0.76) { const f = (blend - 0.52) / 0.24; cr = 225 + f * 25; cg = 5 + f * 58; cb = 175 - f * 95; }
        else { const f = (blend - 0.76) / 0.24; cr = 250 + f * 5; cg = 63 + f * 140; cb = 80 - f * 30; }
        
        // Neon bump when speaking
        cr = Math.min(255, cr + cr * activeEnv * 0.15 + extraBass * 15);
        cg = Math.min(255, cg + cg * activeEnv * 0.15 + extraBass * 5);
        cb = Math.min(255, cb + cb * activeEnv * 0.15 + extraBass * 25);

        const shade = 0.15 + df * 0.85 + activeEnv * 0.1; // Less aggressive global brightness
        const alpha = (0.2 + df * 0.8) * easeOut; // Don't boost global static alpha, it floods the background
        
        // Pulses affect the size of the dots cleanly
        const dotPulse = 1 + 0.03 * Math.sin(t * 4.0 + i) + activeEnv * 0.4 * Math.max(0, Math.sin(t * 8.0 + (p.ny * 10)));
        const dotR = (0.6 + df * 1.28) * (size / 270) * dotPulse * (1 + extraBass * 0.15);
        const proj = projected[i];
        proj.sx = sx; proj.sy = sy; proj.sz = pz;
        proj.cr = (cr * shade) | 0; proj.cg = (cg * shade) | 0; proj.cb = (cb * shade) | 0;
        proj.ca = alpha; proj.dr = dotR;
      }

      projected.sort((a, b) => a.sz - b.sz);

      const c = ctx!;
      for (let i = 0; i < COUNT; i++) {
        const p = projected[i];
        // Smaller glow expansion to retain dot clarity
        const glowRadius = p.dr * (4.0 + activeEnv * 0.5); 
        const gradient = c.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowRadius);
        
        // Shrink the background glow presence during speeches so dots stand out
        const glowOpacityMult = 1.0 - activeEnv * 0.3; 

        gradient.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},${Math.min(1, p.ca * 1.5 * glowOpacityMult).toFixed(2)})`);
        gradient.addColorStop(0.2, `rgba(${p.cr},${p.cg},${p.cb},${(p.ca * 0.8 * glowOpacityMult).toFixed(2)})`);
        gradient.addColorStop(0.5, `rgba(${p.cr},${p.cg},${p.cb},${(p.ca * 0.3 * glowOpacityMult).toFixed(2)})`);
        gradient.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0)`);
        c.beginPath();
        c.arc(p.sx, p.sy, glowRadius, 0, 6.2832);
        c.fillStyle = gradient;
        c.fill();
        
        c.beginPath();
        c.arc(p.sx, p.sy, p.dr * 1.2, 0, 6.2832);
        // Make the core explicitly brighter and intensely opaque when speaking
        const coreR = Math.min(255, p.cr + 50 + activeEnv * 120);
        const coreG = Math.min(255, p.cg + 50 + activeEnv * 120);
        const coreB = Math.min(255, p.cb + 50 + activeEnv * 120);
        c.fillStyle = `rgba(${coreR},${coreG},${coreB},${Math.min(1, p.ca * 1.3 + activeEnv * 0.6).toFixed(2)})`;
        c.fill();
      }

      const g = c.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.45);
      g.addColorStop(0, `rgba(150,0,210,${0.00 + activeEnv * 0.05 + extraBass * 0.05})`);
      g.addColorStop(0.5, `rgba(110,0,190,${0.05 + activeEnv * 0.1 + extraBass * 0.1})`);
      g.addColorStop(1, `rgba(60,0,150,0.00)`);
      c.beginPath();
      c.arc(cx, cy, R * 1.45, 0, 6.2832);
      c.fillStyle = g;
      c.fill();

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, canvasSize]);

  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas 
        ref={canvasRef} 
        width={canvasSize} 
        height={canvasSize} 
        style={{ position: "absolute", pointerEvents: "none" }} 
      />
    </div>
  );
}
