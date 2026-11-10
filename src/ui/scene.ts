import type { Cue } from './cues';
import { play } from './sound';

/**
 * A short scene between two screens: markup whose parts surface on their own `--at` delay
 * (`.sc-in`), held until `out`, then faded over `fade`. Sounds are timed with it.
 */
export interface Scene {
  /** Extra class on the overlay: `sc-week`, `sc-quarter`, `sc-intro`. */
  cls: string;
  /** What a screen reader hears instead of the animation. */
  label: string;
  html: string;
  out: number;
  fade: number;
  sounds: { cue: Cue; at: number }[];
}

/** How fast a scene fades when the player does not want to wait. */
const SKIP_FADE = 300;

export const reducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Plays a scene over everything; any click or key skips it. Calls `onDone` once it is gone,
 * and returns a function that removes it at once (without calling `onDone`).
 */
export function runScene(scene: Scene, skipLabel: string, onDone: () => void): () => void {
  const el = document.createElement('section');
  el.className = `scene ${scene.cls}`;
  el.setAttribute('aria-label', scene.label);
  el.setAttribute('role', 'status');
  el.tabIndex = -1;
  el.innerHTML = `<div class="sc-body" aria-hidden="true">${scene.html}</div><button type="button" class="tc-skip sc-skip">${skipLabel}</button>`;
  document.body.appendChild(el);
  document.body.classList.add('title-showing');

  let timers: number[] = [];
  let gone = false;
  const clear = () => { timers.forEach(id => window.clearTimeout(id)); timers = []; };
  const remove = () => {
    if (gone) return;
    gone = true;
    clear();
    document.removeEventListener('keydown', onKey);
    el.remove();
    document.body.classList.remove('title-showing');
  };
  const fadeOut = (after: number) => {
    clear();
    el.style.setProperty('--fade', `${after}ms`);
    el.classList.add('tc-out');
    timers = [window.setTimeout(() => { remove(); onDone(); }, after)];
  };
  const skip = () => { if (!gone && !el.classList.contains('tc-out')) fadeOut(SKIP_FADE); };
  const onKey = (e: KeyboardEvent) => { if (!e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); skip(); } };

  el.addEventListener('click', skip);
  document.addEventListener('keydown', onKey);
  el.focus({ preventScroll: true });
  // Sounds on timers, so a skipped scene does not keep on making noise.
  for (const s of scene.sounds) timers.push(window.setTimeout(() => play(s.cue), s.at));
  timers.push(window.setTimeout(() => fadeOut(scene.fade), scene.out));
  return remove;
}
