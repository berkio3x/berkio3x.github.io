// Decides the light: auto (the real sky over SITE.coords), day or night.
// Sets `theme-night` on <html>, drives the sea, and tells the HUD.

import { computeSky, type LightMode, type SkyState } from '../lib/sky';

const MODES: LightMode[] = ['auto', 'day', 'night'];

export function readMode(): LightMode {
  try {
    const m = localStorage.getItem('light-mode') as LightMode | null;
    if (m && MODES.includes(m)) return m;
  } catch {}
  return 'auto';
}

export function createLight(lat: number, lon: number, onSky: (s: SkyState) => void) {
  let mode = readMode();
  let state = computeSky(new Date(), lat, lon, mode);

  const apply = () => {
    state = computeSky(new Date(), lat, lon, mode);
    const root = document.documentElement;
    root.classList.toggle('theme-night', state.night > 0.5);
    root.dataset.light = mode;
    onSky(state);
    document.dispatchEvent(new CustomEvent('sky', { detail: { state, mode } }));
  };

  setInterval(apply, 60000);

  return {
    get state() { return state; },
    get mode() { return mode; },
    apply,
    cycle() {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      try { localStorage.setItem('light-mode', mode); } catch {}
      apply();
    },
    set(m: LightMode) {
      mode = m;
      try { localStorage.setItem('light-mode', mode); } catch {}
      apply();
    },
  };
}
