// Small astronomy helpers. Accurate to well under a degree, which is plenty
// for drawing a sky. Angles in degrees unless the name says otherwise.

const RAD = Math.PI / 180;
const SYNODIC_MONTH = 29.530588853;

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function norm360(x: number) {
  return ((x % 360) + 360) % 360;
}

function horizontal(raDeg: number, decDeg: number, d: number, lat: number, lon: number) {
  const gmst = norm360(280.46061837 + 360.98564736629 * d);
  const ha = norm360(gmst + lon - raDeg);
  const haSigned = ha > 180 ? ha - 360 : ha;
  const sinEl =
    Math.sin(lat * RAD) * Math.sin(decDeg * RAD) +
    Math.cos(lat * RAD) * Math.cos(decDeg * RAD) * Math.cos(haSigned * RAD);
  return { elevation: Math.asin(sinEl) / RAD, hourAngle: haSigned };
}

/** Sun position for an observer. Hour angle is negative in the morning. */
export function sunPosition(date: Date, lat: number, lon: number) {
  const d = julianDay(date) - 2451545.0;
  const g = norm360(357.529 + 0.98560028 * d) * RAD;
  const q = norm360(280.459 + 0.98564736 * d);
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const ra = norm360(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD);
  const dec = Math.asin(Math.sin(e) * Math.sin(L)) / RAD;
  return { ...horizontal(ra, dec, d, lat, lon), ra, dec };
}

/** Moon phase. `illumination` is 0 (new) to 1 (full). */
export function moonPhase(date: Date) {
  const age = norm360(((julianDay(date) - 2451550.1) / SYNODIC_MONTH) * 360) / 360 * SYNODIC_MONTH;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const waxing = age < SYNODIC_MONTH / 2;
  const names = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent'];
  const name = names[Math.round((age / SYNODIC_MONTH) * 8) % 8];
  return { age, illumination, waxing, name };
}

/**
 * Approximate Moon position: the Sun's position shifted east by the phase
 * angle. It ignores the Moon's orbital tilt (about 5 degrees), which is fine
 * for a picture.
 */
export function moonPosition(date: Date, lat: number, lon: number) {
  const sun = sunPosition(date, lat, lon);
  const { age } = moonPhase(date);
  const ra = norm360(sun.ra + (age / SYNODIC_MONTH) * 360);
  const L = ra * RAD;
  const dec = Math.asin(Math.sin(23.44 * RAD) * Math.sin(L)) / RAD;
  const d = julianDay(date) - 2451545.0;
  return horizontal(ra, dec, d, lat, lon);
}

export type LightMode = 'auto' | 'day' | 'night';

export type SkyState = {
  night: number;      // 0 day, 1 night
  golden: number;     // 0 none, 1 full sunrise or sunset colours
  sun: [number, number];  // screen position, x and height above horizon
  moon: [number, number];
  moonIllum: number;
  moonWaxing: boolean;
  lamp: number;       // lighthouse brightness, 0 to 1
  phase: string;      // a word for the HUD: day, golden hour, dusk, night
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Real elevations reach 90 degrees, but the screen shows about 30 degrees of
// sky. Compress so a high sun still sits on screen.
function toScreen(hourAngle: number, elevation: number): [number, number] {
  const x = Math.max(-0.95, Math.min(0.95, (hourAngle / 110) * 0.85));
  const y = Math.tan(elevation * 0.42 * RAD);
  return [x, y];
}

export function computeSky(date: Date, lat: number, lon: number, mode: LightMode): SkyState {
  const sun = sunPosition(date, lat, lon);
  const moon = moonPosition(date, lat, lon);
  const phase = moonPhase(date);

  const base = {
    moonIllum: phase.illumination,
    moonWaxing: phase.waxing,
  };

  if (mode === 'day') {
    return { ...base, night: 0, golden: 0.12, sun: [0.34, 0.1], moon: [0, -1], lamp: 0, phase: 'day' };
  }
  if (mode === 'night') {
    return { ...base, night: 1, golden: 0, sun: [0, -1], moon: [0.3, 0.15], moonIllum: Math.max(phase.illumination, 0.35), lamp: 1, phase: 'night' };
  }

  const s = sun.elevation;
  const night = 1 - smooth(-9, -1, s);
  const golden = smooth(-7, -1, s) * (1 - smooth(5, 16, s));
  const lamp = 1 - smooth(-2, 4, s);
  const word = s > 8 ? 'day' : s > -1 ? 'golden hour' : s > -9 ? 'dusk' : 'night';
  return {
    ...base,
    night,
    golden,
    sun: toScreen(sun.hourAngle, s),
    moon: toScreen(moon.hourAngle, moon.elevation),
    lamp,
    phase: word,
  };
}
