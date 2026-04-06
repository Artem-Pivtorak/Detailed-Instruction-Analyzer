import { useRef, useCallback } from "react";

export type SoundType = "hover" | "click" | "open" | "close" | "toggle" | "switch";

// ── Helpers ─────────────────────────────────────────────────────────────────

function osc(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  startTime: number,
  endTime: number,
  freqEnd?: number,
): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    o.frequency.exponentialRampToValueAtTime(freqEnd, endTime);
  }
  o.connect(dest);
  o.start(startTime);
  o.stop(endTime + 0.01);
  return o;
}

function gainEnv(
  ctx: AudioContext,
  dest: AudioNode,
  vol: number,
  attack: number,
  decay: number,
  startTime: number,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(vol, startTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
  g.connect(dest);
  return g;
}

function noise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufLen = Math.ceil(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function bpf(ctx: AudioContext, dest: AudioNode, freq: number, Q = 12): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = Q;
  f.connect(dest);
  return f;
}

function lpf(ctx: AudioContext, dest: AudioNode, freq: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  f.connect(dest);
  return f;
}

// ── Individual sound builders ────────────────────────────────────────────────

/** hover: whisper-thin high-freq shimmer — almost inaudible, just presence */
function playHover(ctx: AudioContext) {
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.linearRampToValueAtTime(0.055, t + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  master.connect(ctx.destination);

  // Thin sine shimmer at 3200 Hz
  osc(ctx, master, 3200, "sine", t, t + 0.09, 3600);
  // Very subtle triangle undertone
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.025, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  g2.connect(master);
  osc(ctx, g2, 1600, "triangle", t, t + 0.06);
}

/** click: sharp digital "snap" — layered noise burst + mid tone */
function playClick(ctx: AudioContext) {
  const t = ctx.currentTime;

  // 1. Noise transient (the "snap")
  const noiseSrc = noise(ctx, 0.05);
  const nf = bpf(ctx, ctx.destination, 2400, 8);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.18, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  noiseSrc.connect(nf);
  ng.connect(ctx.destination);
  noiseSrc.connect(ng);
  noiseSrc.start(t);
  noiseSrc.stop(t + 0.06);

  // 2. Punchy sine body
  const body = gainEnv(ctx, ctx.destination, 0.13, 0.003, 0.09, t);
  osc(ctx, body, 900, "sine", t, t + 0.12, 600);

  // 3. Quick upper harmonic ring
  const ring = gainEnv(ctx, ctx.destination, 0.055, 0.002, 0.07, t);
  osc(ctx, ring, 1800, "triangle", t, t + 0.09, 1600);
}

/** open: futuristic portal whoosh — ascending chord + filtered noise sweep */
function playOpen(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Noise whoosh through rising LPF
  const ns = noise(ctx, 0.38);
  const filt = ctx.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.setValueAtTime(300, t);
  filt.frequency.exponentialRampToValueAtTime(4000, t + 0.35);
  filt.Q.value = 3;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.linearRampToValueAtTime(0.12, t + 0.08);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  ns.connect(filt);
  filt.connect(ng);
  ng.connect(ctx.destination);
  ns.start(t);
  ns.stop(t + 0.40);

  // Arpeggio: three notes ascending quickly
  const notes = [330, 495, 660];
  notes.forEach((freq, i) => {
    const start = t + i * 0.07;
    const g = gainEnv(ctx, ctx.destination, 0.10, 0.012, 0.18, start);
    osc(ctx, g, freq, "sine", start, start + 0.20, freq * 1.05);
  });

  // Sustaining shimmer chord
  const shimG = gainEnv(ctx, ctx.destination, 0.06, 0.05, 0.30, t + 0.10);
  osc(ctx, shimG, 1320, "sine", t + 0.10, t + 0.45);
  osc(ctx, shimG, 1760, "sine", t + 0.12, t + 0.45);
}

/** close: smooth descending sweep — portal closing */
function playClose(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Descending tone sweep
  const g1 = gainEnv(ctx, ctx.destination, 0.11, 0.008, 0.28, t);
  osc(ctx, g1, 660, "sine", t, t + 0.30, 280);

  // Filtered noise hiss out
  const ns = noise(ctx, 0.28);
  const filt = ctx.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.setValueAtTime(3500, t);
  filt.frequency.exponentialRampToValueAtTime(400, t + 0.28);
  filt.Q.value = 4;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.09, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  ns.connect(filt);
  filt.connect(ng);
  ng.connect(ctx.destination);
  ns.start(t);
  ns.stop(t + 0.30);

  // Quick low thud
  const thud = gainEnv(ctx, ctx.destination, 0.09, 0.004, 0.14, t);
  osc(ctx, thud, 120, "sine", t, t + 0.18, 55);
}

/** toggle: precision digital "tock" — mechanical + electronic */
function playToggle(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Metallic click body
  const g1 = gainEnv(ctx, ctx.destination, 0.14, 0.003, 0.10, t);
  osc(ctx, g1, 1100, "square", t, t + 0.13, 900);

  // Resonant ring-out
  const g2 = gainEnv(ctx, ctx.destination, 0.07, 0.005, 0.22, t + 0.01);
  osc(ctx, g2, 2200, "sine", t + 0.01, t + 0.25, 2100);

  // Sub tick
  const g3 = gainEnv(ctx, ctx.destination, 0.08, 0.002, 0.06, t);
  osc(ctx, g3, 300, "triangle", t, t + 0.08, 200);
}

/** switch: satisfying hi-tech confirmation chord */
function playSwitch(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Two-tone major chord sweep
  const pairs: [number, number][] = [[440, 550], [660, 825]];
  pairs.forEach(([f1, f2], i) => {
    const start = t + i * 0.04;
    const g = gainEnv(ctx, ctx.destination, 0.09, 0.01, 0.22, start);
    osc(ctx, g, f1, "sine", start, start + 0.25, f1 * 1.03);
    osc(ctx, g, f2, "sine", start, start + 0.25, f2 * 1.02);
  });

  // Crisp noise accent
  const ns = noise(ctx, 0.06);
  const filt = lpf(ctx, ctx.destination, 5000);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.08, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  ns.connect(ng);
  ng.connect(filt);
  ns.start(t);
  ns.stop(t + 0.07);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      switch (type) {
        case "hover":  playHover(ctx);  break;
        case "click":  playClick(ctx);  break;
        case "open":   playOpen(ctx);   break;
        case "close":  playClose(ctx);  break;
        case "toggle": playToggle(ctx); break;
        case "switch": playSwitch(ctx); break;
      }
    } catch (_) { /* audio blocked */ }
  }, [enabled]);

  return { play };
}
