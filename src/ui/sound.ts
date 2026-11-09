import type { Cue } from './cues';

/**
 * Office sounds. Recordings in `src/assets/sounds/` (CC0, BigSoundBank, a Hermes Precisa 305) are used when present, grouped by the file
 * name before any dash or digit (`key.mp3`, `key-2.mp3` → `key`): `key`, `space`, `bell`,
 * `return`, `stamp`, `page`. Anything missing is synthesised with the Web Audio API.
 * Everything fails silently: no audio support, a blocked context or a muted player just means no sound.
 */

const files = import.meta.glob('../assets/sounds/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Sample = 'key' | 'space' | 'bell' | 'return' | 'stamp' | 'page';
const URLS: Partial<Record<Sample, string[]>> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.replace(/^.*\/([a-z]+)[-\d]*\.mp3$/, '$1') as Sample;
  (URLS[name] ??= []).push(url);
}

const KEY = 'jelentem.hang';
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
/** A decoded recording and the part of it that is not silence (seconds). */
interface Clip { buf: AudioBuffer; from: number; to: number }
const buffers: Partial<Record<Sample, Clip[]>> = {};

/** How loud each recording plays: the space bar was recorded much quieter than the keys. */
const LEVEL: Record<Sample, number> = { key: 0.7, space: 2, bell: 0.55, return: 0.8, stamp: 1, page: 0.8 };

/** Finds where the sound starts and fades out, so the silence at the ends never delays a key. */
function trim(buf: AudioBuffer): Clip {
  const d = buf.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  let a = 0, b = d.length - 1;
  while (a < b && Math.abs(d[a]) < peak * 0.1) a++;
  while (b > a && Math.abs(d[b]) < peak * 0.01) b--;
  const lead = 0.004 * buf.sampleRate, tail = 0.05 * buf.sampleRate;
  return { buf, from: Math.max(0, a - lead) / buf.sampleRate, to: Math.min(d.length, b + tail) / buf.sampleRate };
}
let enabled = readSetting();

function readSetting(): boolean {
  try { return window.localStorage.getItem(KEY) !== 'ki'; } catch { return true; }
}

export const soundOn = (): boolean => enabled;

export function setSound(on: boolean): void {
  enabled = on;
  try { window.localStorage.setItem(KEY, on ? 'be' : 'ki'); } catch { /* the setting just does not persist */ }
}

/** Fetches and decodes the recordings once; until they arrive, the synthesised sounds play. */
function loadSamples(c: AudioContext): void {
  for (const [name, urls] of Object.entries(URLS) as [Sample, string[]][])
    for (const url of urls)
      fetch(url).then(r => r.arrayBuffer()).then(b => c.decodeAudioData(b))
        .then(buf => { (buffers[name] ??= []).push(trim(buf)); }).catch(() => { /* keep the synthesised one */ });
}

/** The audio context, created on the first sound (browsers only allow it after a click). */
function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    loadSamples(ctx);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Master volume of everything. */
const VOLUME = 0.5;

/** Plays a recording, slightly varied in pitch and loudness so repeats do not sound mechanical. Returns its length. */
function sample(c: AudioContext, name: Sample, t: number, vary = 0.06, gain = 1): number | null {
  const list = buffers[name];
  if (!list?.length) return null;
  const clip = list[Math.floor(Math.random() * list.length)];
  const src = c.createBufferSource();
  src.buffer = clip.buf;
  src.playbackRate.value = 1 + (Math.random() * 2 - 1) * vary;
  const g = c.createGain();
  g.gain.value = gain * LEVEL[name] * VOLUME * (0.85 + Math.random() * 0.15);
  src.connect(g).connect(c.destination);
  const length = clip.to - clip.from;
  src.start(t, clip.from, length);
  return length / src.playbackRate.value;
}

/** A burst of filtered noise. */
function burst(c: AudioContext, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number): void {
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain * VOLUME, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.5, dur + 0.02);
}

/** A tone gliding from `from` to `to` Hz, fading out over `dur`. */
function tone(c: AudioContext, t: number, dur: number, from: number, to: number, gain: number, type: OscillatorType = 'sine'): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * VOLUME, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** One typewriter key: the recording, or the type bar hitting the platen and the key's thud. */
function key(c: AudioContext, t: number): void {
  if (sample(c, 'key', t) !== null) return;
  burst(c, t, 0.025, 'bandpass', 2200 + Math.random() * 1400, 1.2, 0.9);
  tone(c, t, 0.04, 180 + Math.random() * 40, 90, 0.25, 'triangle');
}

/** A few words typed at an uneven, human pace, with a space between them. Returns when the last key falls. */
function typeWords(c: AudioContext, t: number, keys: number): number {
  let at = t;
  for (let i = 0, word = 0; i < keys; i++) {
    if (word >= 3 + Math.floor(Math.random() * 4)) {
      if (sample(c, 'space', at, 0.03) === null) key(c, at);
      word = 0;
    } else { key(c, at); word++; }
    at += 0.07 + Math.random() * 0.08;
  }
  return at;
}

/** The bell at the margin, then the carriage thrown back with the line-feed ratchet. */
function newLine(c: AudioContext, t: number): void {
  const bell = sample(c, 'bell', t, 0.01) ?? (tone(c, t, 0.9, 2093, 2080, 0.22), tone(c, t, 0.6, 5230, 5200, 0.06), 0.25);
  const at = t + Math.min(bell, 0.35);
  if (sample(c, 'return', at, 0.03) !== null) return;
  burst(c, at, 0.32, 'bandpass', 900, 0.8, 0.35);
  for (let i = 0; i < 6; i++) burst(c, at + 0.04 * i, 0.015, 'highpass', 3000, 0.7, 0.3);
}

const SOUNDS: Record<Cue, (c: AudioContext, t: number) => void> = {
  key,
  type: (c, t) => { typeWords(c, t, 6 + Math.floor(Math.random() * 5)); },
  line: (c, t) => newLine(c, typeWords(c, t, 8 + Math.floor(Math.random() * 5)) + 0.05),
  // A rubber stamp: a dull low thud with a short slap of paper.
  stamp: (c, t) => {
    if (sample(c, 'stamp', t, 0.04) !== null) return;
    tone(c, t, 0.18, 120, 45, 0.9);
    burst(c, t, 0.06, 'lowpass', 900, 0.7, 0.8);
  },
  // A sheet pulled out of the typewriter or turned over.
  page: (c, t) => {
    if (sample(c, 'page', t, 0.05) !== null) return;
    burst(c, t, 0.22, 'bandpass', 1800, 0.6, 0.25);
    burst(c, t + 0.08, 0.16, 'highpass', 4000, 0.5, 0.12);
  },
};

/** Plays a sound `delay` ms from now, if sound is on and the browser lets us. */
export function play(cue: Cue, delay = 0): void {
  if (!enabled) return;
  try {
    const c = audio();
    if (!c || !noise) return;
    SOUNDS[cue](c, c.currentTime + delay / 1000);
  } catch {
    // No audio: the game works the same without it.
  }
}
