import { useRef, useCallback, useEffect } from "react";

export type SoundType = 
  | "hover" | "click" | "open" | "close" | "toggle" | "switch"
  | "sircle" | "download" | "end-download" | "frame-start" | "frame-end"
  | "click-1" | "click-2-clowse" | "click-3-clowse" | "click-4" | "click-5-clowse" | "click-6-mode" | "click-7";

const SOUND_MAP: Record<string, string> = {
  hover: "/sounds/click-7.wav",
  click: "/sounds/click-1.wav",
  open: "/sounds/frame-start.wav",
  close: "/sounds/frame-end.wav",
  toggle: "/sounds/click-6-mode.wav",
  switch: "/sounds/click-4.wav",
  sircle: "/sounds/sircle.wav",
  download: "/sounds/download.wav",
  "end-download": "/sounds/end-download.wav",
  "frame-start": "/sounds/frame-start.wav",
  "frame-end": "/sounds/frame-end.wav",
  "click-1": "/sounds/click-1.wav",
  "click-2-clowse": "/sounds/click-2-clowse.wav",
  "click-3-clowse": "/sounds/click-3-clowse.wav",
  "click-4": "/sounds/click-4.wav",
  "click-5-clowse": "/sounds/click-5-clowse.wav",
  "click-6-mode": "/sounds/click-6-mode.wav",
  "click-7": "/sounds/click-7.wav",
};

export function useSound(enabled: boolean) {
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

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
      
      if (type === "download" || type === "sircle") {
        playback.volume = 0.25;
      } else if (type === "end-download") {
        playback.volume = 0.45;
      } else {
        playback.volume = 0.35;
      }

      const p = playback.play();
      if (p !== undefined) {
        p.catch(e => {
          // If blocked, it's usually due to lack of user gesture
          // We don't log to avoid console spam in dev
        });
      }
    } catch (_) {}
  }, [enabled]);

  return { play };
}
