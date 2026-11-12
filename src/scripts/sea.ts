// A grainy WebGL sea under a live sky.
// The sky state (sun, moon, golden hour, night) comes from src/lib/sky.ts.
// A small island with a lighthouse sits on the horizon; its beam sweeps at dusk.
// Click the water to drop a ripple.

import type { SkyState } from '../lib/sky';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uNight;
uniform float uGolden;
uniform float uLamp;
uniform float uHorizon;
uniform vec2 uSun;
uniform vec2 uMoon;
uniform float uMoonIllum;
uniform float uMoonWaxing;
uniform vec2 uDrift;
uniform vec4 uRipples[8];
uniform int uRippleCount;

const float CAM_H = 1.0;
const vec2 LAMP = vec2(-0.62, 0.043);

vec3 gSkyTop;
vec3 gSkyHor;
vec3 gSunDir;
vec3 gSunCol;
vec3 gMoonDir;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float waves(vec2 p) {
  float t = uTime;
  float h = 0.0;
  h += 0.050 * sin(dot(p, vec2(0.80, 0.60)) * 1.3 + t * 0.70);
  h += 0.032 * sin(dot(p, vec2(-0.50, 0.87)) * 2.1 + t * 1.05);
  h += 0.018 * sin(dot(p, vec2(0.95, -0.31)) * 3.7 + t * 1.50);
  float a = 0.030;
  vec2 q = p * 1.7;
  for (int i = 0; i < 4; i++) {
    h += a * (noise(q + t * vec2(0.30, 0.22)) - 0.5);
    q = mat2(1.6, 1.2, -1.2, 1.6) * q;
    a *= 0.5;
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipples[i];
    float age = t - r.z;
    if (age < 0.0) continue;
    float d = length(p - r.xy);
    float front = age * 1.4;
    float env = exp(-pow((d - front) * 1.3, 2.0)) * exp(-age * 0.42) * r.w;
    h += 0.085 * env * sin(d * 8.0 - age * 11.0);
  }
  return h;
}

// Island outline as a height above the horizon, in screen units.
float island(float x) {
  float h = 0.020 * exp(-pow((x + 0.70) / 0.11, 2.0));
  h += 0.010 * exp(-pow((x + 0.53) / 0.07, 2.0));
  h += 0.0025 * (noise(vec2(x * 60.0, 1.0)) - 0.5);
  return h * smoothstep(-0.92, -0.85, x) * (1.0 - smoothstep(-0.46, -0.42, x));
}

float lampFlash() {
  return pow(max(cos(uTime * 0.75), 0.0), 30.0);
}

vec3 sky(vec3 d) {
  float y = clamp(d.y, 0.0, 1.0);
  vec2 s = d.xy / max(d.z, 0.0001);
  vec3 c = mix(gSkyHor, gSkyTop, pow(clamp(y * 2.2, 0.0, 1.0), 0.65));

  // Warm glow along the horizon on the sun's side at sunrise and sunset.
  float sideGlow = exp(-abs(s.x - uSun.x) * 1.4) * exp(-y * 9.0);
  c += uGolden * sideGlow * vec3(0.30, 0.13, 0.04);

  float cl = noise(vec2(d.x / (d.y + 0.25) * 1.2 + uTime * 0.008, d.y * 9.0));
  c *= 1.0 + (cl - 0.5) * mix(0.05, 0.08, uNight) * smoothstep(0.0, 0.25, y);

  // Sun.
  if (gSunDir.y > -0.05) {
    float sd = max(dot(d, gSunDir), 0.0);
    float disk = smoothstep(0.99935, 0.99965, sd) * step(0.0, gSunDir.y);
    float glow = pow(sd, 90.0) * 0.30 + pow(sd, 9.0) * 0.07;
    c += gSunCol * (disk * 0.6 + glow * (0.9 + uGolden * 0.6));
  }

  // Moon, with its phase. The lit side faces the sun: right when waxing.
  if (gMoonDir.y > 0.0) {
    vec2 m = s - gMoonDir.xy / gMoonDir.z;
    float R = 0.024;
    float disk = smoothstep(R, R * 0.86, length(m));
    float side = uMoonWaxing > 0.5 ? -1.0 : 1.0;
    float off = 2.0 * R * uMoonIllum;
    float shade = smoothstep(R, R * 0.86, length(m - vec2(side * off, 0.0)));
    float lit = disk * (1.0 - shade * (1.0 - smoothstep(0.98, 1.0, uMoonIllum)));
    float glow = exp(-length(m) / 0.09) * 0.10 * uMoonIllum;
    vec3 mc = vec3(0.93, 0.92, 0.88);
    float vis = smoothstep(0.0, 0.6, uNight);
    c = mix(c, c * 0.6, disk * 0.4 * vis);
    c += mc * (lit * 0.9 + disk * 0.03 + glow) * vis;
  }

  // Stars.
  if (uNight > 0.01) {
    vec2 g = s * 70.0;
    vec2 id = floor(g);
    float h = hash(id);
    float st = step(0.982, h) * smoothstep(0.09, 0.0, length(fract(g) - 0.5));
    st *= 0.55 + 0.45 * sin(uTime * 1.7 + h * 50.0);
    c += st * uNight * smoothstep(0.02, 0.2, y) * 0.9;
  }

  // Lighthouse beam: a soft wedge that sweeps around the lamp.
  if (uLamp > 0.01) {
    vec2 q = s - LAMP;
    float a = uTime * 0.75;
    float dir = sin(a);
    float along = q.x * sign(dir);
    float width = abs(q.x) * 0.07 + 0.003;
    float wedge = step(0.0, along) * exp(-pow(q.y / width, 2.0));
    float reach = exp(-abs(q.x) / (0.9 * abs(dir) + 0.03));
    float beam = wedge * reach * (0.25 + 0.75 * max(cos(a), 0.0));
    float halo = exp(-length(q) / 0.012) * (0.4 + 2.0 * lampFlash());
    c += uLamp * (beam * 0.22 + halo) * vec3(1.0, 0.86, 0.62);
  }

  // Island and lighthouse silhouette, softened by haze.
  float ih = island(s.x);
  float tower = step(abs(s.x - LAMP.x), 0.0022) * step(s.y, LAMP.y - 0.003);
  float solid = max(step(s.y, ih), tower) * step(-0.002, s.y);
  vec3 land = mix(gSkyHor * 0.62, gSkyHor * 0.86, 0.35);
  c = mix(c, land, solid * 0.85);
  c += uLamp * smoothstep(0.004, 0.0, length(s - LAMP)) * vec3(1.0, 0.9, 0.7) * (0.8 + lampFlash());

  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  vec3 dayTop = vec3(0.735, 0.748, 0.760);
  vec3 dayHor = vec3(0.958, 0.944, 0.912);
  vec3 goldTop = vec3(0.560, 0.560, 0.640);
  vec3 goldHor = vec3(0.990, 0.780, 0.600);
  vec3 nightTop = vec3(0.022, 0.028, 0.045);
  vec3 nightHor = vec3(0.125, 0.135, 0.165);

  gSkyTop = mix(mix(dayTop, goldTop, uGolden), nightTop, uNight);
  gSkyHor = mix(mix(dayHor, goldHor, uGolden), nightHor, uNight);
  gSunDir = normalize(vec3(uSun.x, uSun.y, 1.0));
  gMoonDir = normalize(vec3(uMoon.x, uMoon.y, 1.0));
  gSunCol = mix(vec3(1.0, 0.985, 0.950), vec3(1.0, 0.66, 0.38), uGolden);

  vec3 ro = vec3(uDrift.x * 0.25, CAM_H, uDrift.y);
  vec3 rd = normalize(vec3(uv.x, uv.y - uHorizon, 1.0));
  vec3 col;

  if (rd.y < 0.0) {
    float t = ro.y / -rd.y;
    vec3 p = ro + rd * t;
    float e = 0.01 + t * 0.003;
    float h0 = waves(p.xz);
    vec3 n = normalize(vec3(h0 - waves(p.xz + vec2(e, 0.0)), e, h0 - waves(p.xz + vec2(0.0, e))));
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(10.0, 70.0, t)));

    vec3 r = reflect(rd, n);
    r.y = abs(r.y);
    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
    vec3 deep = mix(mix(vec3(0.540, 0.556, 0.560), vec3(0.45, 0.36, 0.34), uGolden), vec3(0.026, 0.032, 0.045), uNight);
    col = mix(deep, sky(r), fres);

    if (gSunDir.y > 0.0) {
      float spec = pow(max(dot(r, gSunDir), 0.0), 260.0);
      col += spec * gSunCol * 1.1;
    }
    if (gMoonDir.y > 0.0) {
      float mspec = pow(max(dot(r, gMoonDir), 0.0), 420.0);
      col += mspec * vec3(0.93, 0.92, 0.88) * 1.4 * uMoonIllum * smoothstep(0.0, 0.6, uNight);
    }
    vec3 lampDir = normalize(vec3(LAMP, 1.0));
    float lspec = pow(max(dot(r, lampDir), 0.0), 900.0);
    col += uLamp * lspec * vec3(1.0, 0.85, 0.6) * (0.7 + 2.0 * lampFlash());

    col = mix(col, gSkyHor, 1.0 - exp(-t * 0.022));
  } else {
    col = sky(rd);
  }

  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.6 + 0.35 * uGolden);

  vec2 q = gl_FragCoord.xy / uRes;
  col *= mix(1.0, 0.86, pow(length(q - 0.5) * 1.25, 2.2));
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 311.0) - 0.5) * mix(0.055, 0.045, uNight);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

type Ripple = { x: number; z: number; t: number; s: number };

const MAX_RIPPLES = 8;
export const HORIZON = { home: -0.07, content: -0.1 };

type Numeric = { night: number; golden: number; lamp: number; sx: number; sy: number; mx: number; my: number; illum: number };

export function startSea(canvas: HTMLCanvasElement, initial: SkyState) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const loc = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: loc('uRes'), time: loc('uTime'), night: loc('uNight'), golden: loc('uGolden'), lamp: loc('uLamp'),
    horizon: loc('uHorizon'), sun: loc('uSun'), moon: loc('uMoon'), illum: loc('uMoonIllum'),
    waxing: loc('uMoonWaxing'), drift: loc('uDrift'), ripples: loc('uRipples'), count: loc('uRippleCount'),
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Render below native resolution: the grain hides it and it keeps laptops cool.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;

  const toNumeric = (s: SkyState): Numeric => ({
    night: s.night, golden: s.golden, lamp: s.lamp,
    sx: s.sun[0], sy: s.sun[1], mx: s.moon[0], my: s.moon[1], illum: s.moonIllum,
  });
  const cur = toNumeric(initial);
  let target = { ...cur };
  let waxing = initial.moonWaxing ? 1 : 0;

  let horizon = HORIZON.home;
  let horizonTarget = horizon;

  const ripples: Ripple[] = [];
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let drift = 0;
  let raf = 0;
  let last = 0;

  function resize() {
    const w = Math.round(window.innerWidth * scale);
    const h = Math.round(window.innerHeight * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
    }
  }

  function draw(settle = false) {
    const t = now();
    const dt = Math.min(0.05, last ? t - last : 0);
    last = t;

    // Ease every sky value toward its target. It settles in about 900 ms.
    const k = settle ? 1 : 1 - Math.exp(-dt * 4.5);
    for (const key of Object.keys(cur) as (keyof Numeric)[]) cur[key] += (target[key] - cur[key]) * k;
    horizon += (horizonTarget - horizon) * (settle ? 1 : 1 - Math.exp(-dt * 3.2));
    drift += dt * 0.12;

    while (ripples.length && t - ripples[0].t > 9) ripples.shift();
    const data = new Float32Array(MAX_RIPPLES * 4);
    ripples.forEach((r, i) => data.set([r.x, r.z, r.t, r.s], i * 4));

    resize();
    gl!.uniform2f(U.res, canvas.width, canvas.height);
    gl!.uniform1f(U.time, t);
    gl!.uniform1f(U.night, cur.night);
    gl!.uniform1f(U.golden, cur.golden);
    gl!.uniform1f(U.lamp, cur.lamp);
    gl!.uniform1f(U.horizon, horizon);
    gl!.uniform2f(U.sun, cur.sx, cur.sy);
    gl!.uniform2f(U.moon, cur.mx, cur.my);
    gl!.uniform1f(U.illum, cur.illum);
    gl!.uniform1f(U.waxing, waxing);
    gl!.uniform2f(U.drift, Math.sin(drift * 0.7) * 0.4, drift);
    gl!.uniform4fv(U.ripples, data);
    gl!.uniform1i(U.count, ripples.length);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  // Map a screen point to the water plane, using the same camera as the shader.
  function toWater(clientX: number, clientY: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ux = (clientX - 0.5 * w) / h;
    const uy = (h - clientY - 0.5 * h) / h;
    const dy = uy - horizon;
    if (dy >= -0.004) return null;
    const t = 1 / -dy;
    return { x: Math.sin(drift * 0.7) * 0.1 + ux * t, z: drift + t };
  }

  function ripple(clientX: number, clientY: number, strength = 1) {
    const p = toWater(clientX, clientY);
    if (!p) return;
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    ripples.push({ ...p, t: now(), s: strength });
    if (reduceMotion) draw(true);
  }

  window.addEventListener('pointerdown', (e) => {
    const el = e.target as HTMLElement;
    if (el.closest('a, button, input, textarea, dialog, pre, code, .sheet, .hud, [data-no-ripple]')) return;
    ripple(e.clientX, e.clientY);
  });

  // An occasional raindrop so the water never looks frozen.
  if (!reduceMotion) {
    const drop = () => {
      if (!document.hidden) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ripple(w * (0.15 + Math.random() * 0.7), h * (0.72 + Math.random() * 0.22), 0.55);
      }
      setTimeout(drop, 6000 + Math.random() * 7000);
    };
    setTimeout(drop, 2500);
  }

  window.addEventListener('resize', () => draw());
  document.addEventListener('visibilitychange', () => {
    if (reduceMotion) return;
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });

  if (reduceMotion) draw(true);
  else raf = requestAnimationFrame(loop);
  canvas.classList.add('is-ready');

  return {
    setSky(s: SkyState) {
      target = toNumeric(s);
      waxing = s.moonWaxing ? 1 : 0;
      if (reduceMotion) draw(true);
    },
    setHorizon(value: number, instant = false) {
      horizonTarget = value;
      if (instant || reduceMotion) {
        horizon = value;
        draw(true);
      }
    },
    ripple,
  };
}
