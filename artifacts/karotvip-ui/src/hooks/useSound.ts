import { useRef, useCallback, useEffect } from "react";

export type SoundType = 
  | "hover" | "click" | "open" | "close" | "toggle" | "switch"
  | "sircle" | "download" | "end-download" | "frame-start" | "frame-end"
  | "click-1" | "click-2-clowse" | "click-3-clowse" | "click-4" | "click-5-clowse" | "click-6-mode" | "click-7"
  | "text" | "end-download-2";

const SOUND_MAP: Record<string, string> = {
  hover: "/sounds/click-7.wav",
  click: "/sounds/click-1.wav",
  open: "/sounds/frame-start.wav",
  close: "/sounds/frame-end.wav",
  toggle: "/sounds/click-6-mode.wav",
  switch: "/sounds/click-4.wav",
  sircle: "/sounds/sircle.wav",
  download: "/sounds/text.wav",
  "end-download": "/sounds/end-download-2.wav",
  "frame-start": "/sounds/frame-start.wav",
  "frame-end": "/sounds/frame-end.wav",
  "click-1": "/sounds/click-1.wav",
  "click-2-clowse": "/sounds/click-2-clowse.wav",
  "click-3-clowse": "/sounds/click-3-clowse.wav",
  "click-4": "/sounds/click-4.wav",
  "click-5-clowse": "/sounds/click-5-clowse.wav",
  "click-6-mode": "/sounds/click-6-mode.wav",
  "click-7": "/sounds/click-7.wav",
  text: "/sounds/text.wav",
  "end-download-2": "/sounds/end-download-2.wav",
};

export function useSound(enabled: boolean) {
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const pendingRef = useRef<SoundType[]>([]);
  const unlockedRef = useRef(false);
  const activeRef = useRef<Record<string, HTMLAudioElement>>({});
  const fadeIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    // Preload critical interaction sounds
    Object.entries(SOUND_MAP).forEach(([key, path]) => {
      const a = new Audio(path);
      a.load();
      audioCache.current[key] = a;
    });
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try {
      const path = SOUND_MAP[type];
      if (!path) return;

      // Creating a fresh audio object for each play can be more robust 
      // for "one-shot" sounds in some browsers than cloning or resetting
      const playback = new Audio(path);
      
      if (type === "download") {
        playback.volume = 0.7;
      } else if (type === "sircle") {
        playback.volume = 0.25;
      } else if (type === "end-download") {
        playback.volume = 0.45;
      } else {
        playback.volume = 0.35;
      }

      activeRef.current[type] = playback;

      const p = playback.play();
      if (p !== undefined) {
        p.then(() => {
          unlockedRef.current = true;
        }).catch(e => {
          // Blocked by the browser's autoplay policy (no user gesture yet).
          // Queue it so it can be replayed on the first click/keypress.
          if (!unlockedRef.current) {
            pendingRef.current.push(type);
          }
        });
      }
    } catch (_) {}
  }, [enabled]);

  // Stops a currently-playing sound of the given type. If fadeMs is provided,
  // the volume ramps down smoothly instead of cutting off abruptly.
  const stop = useCallback((type: SoundType, fadeMs = 250) => {
    const audio = activeRef.current[type];
    if (!audio) return;

    const existingInterval = fadeIntervalsRef.current[type];
    if (existingInterval) {
      clearInterval(existingInterval);
      delete fadeIntervalsRef.current[type];
    }

    if (!fadeMs || audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    const steps = 10;
    const stepTime = fadeMs / steps;
    const startVolume = audio.volume;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step >= steps) {
        clearInterval(interval);
        delete fadeIntervalsRef.current[type];
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepTime);
    fadeIntervalsRef.current[type] = interval;
  }, []);

  useEffect(() => {
    function unlock() {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const queued = pendingRef.current;
      pendingRef.current = [];
      queued.forEach((type) => play(type));
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [play]);

  return { play, stop };
}
