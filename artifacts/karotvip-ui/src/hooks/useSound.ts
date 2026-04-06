import { useRef, useCallback } from "react";

type SoundType = "hover" | "click" | "open" | "close" | "toggle" | "switch";

function createTone(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur * 0.5);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

const soundConfigs: Record<SoundType, { freq: number; dur: number; type: OscillatorType; vol: number }> = {
  hover:  { freq: 800,  dur: 0.08, type: "sine",     vol: 0.06 },
  click:  { freq: 1200, dur: 0.12, type: "square",   vol: 0.10 },
  open:   { freq: 600,  dur: 0.25, type: "sine",     vol: 0.12 },
  close:  { freq: 400,  dur: 0.20, type: "sine",     vol: 0.10 },
  toggle: { freq: 900,  dur: 0.15, type: "triangle", vol: 0.09 },
  switch: { freq: 1100, dur: 0.18, type: "sawtooth", vol: 0.08 },
};

export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    const cfg = soundConfigs[type];
    createTone(ctx, cfg.freq, cfg.dur, cfg.type, cfg.vol);
  }, [enabled]);

  return { play };
}
