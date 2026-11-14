import { track } from './track';
import { awardMedals } from './medals';
import type { Content, GameState, Rng } from '../engine/types';
import CAPTAIN_URL from '../assets/captain.png';

/**
 * An easter egg: now and then the captain's face peeks in from an edge of the screen, watches
 * for a moment, and is gone. A click on it gets a remark. Never with reduced motion.
 */

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface PeekPlan {
  edge: Edge;
  /** Where along the edge, in percent of the screen (kept clear of the corners). */
  at: number;
  /** When it comes, after the screen appeared, and how long it stays (ms). */
  delay: number;
  stay: number;
}

/** How often a screen gets a visit, and when. `eager` (the hidden ?kukucs parameter) comes at once. */
export const PEEK = { chance: 0.25, minDelay: 9000, maxDelay: 45000, stay: 1500 };

/** Whether this screen gets a visit, and how. Pure, all randomness from `rng`. */
export function planPeek(rng: Rng, eager = false): PeekPlan | null {
  if (!eager && rng() >= PEEK.chance) return null;
  const edges: Edge[] = ['left', 'right', 'top', 'bottom'];
  return {
    edge: edges[Math.floor(rng() * edges.length)],
    at: 18 + Math.round(rng() * 64),
    delay: eager ? 1500 : PEEK.minDelay + Math.round(rng() * (PEEK.maxDelay - PEEK.minDelay)),
    stay: PEEK.stay,
  };
}

let timer = 0;
let current: HTMLElement | null = null;

/** Removes a visit in progress or one still to come. */
export function cancelPeek(): void {
  window.clearTimeout(timer);
  current?.remove();
  current = null;
}

/**
 * Maybe sends the captain to peek at this screen. Call it after every render: it cancels the
 * previous visit. Nothing happens while something covers the game (a scene, a dialog).
 */
export function schedulePeek(s: GameState, c: Content, rng: Rng, eager = false): void {
  cancelPeek();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (s.screen !== 'week' && s.screen !== 'response') return;
  const plan = planPeek(rng, eager);
  if (!plan) return;
  // Load him now: he slides in from off screen, where a lazy image would not load in time.
  const pre = new Image();
  pre.src = CAPTAIN_URL;
  timer = window.setTimeout(() => {
    if (document.querySelector('.scene, .title-card, dialog[open]')) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.tabIndex = -1;
    el.className = `peek peek-${plan.edge}`;
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty(plan.edge === 'left' || plan.edge === 'right' ? 'top' : 'left', `${plan.at}%`);
    el.style.setProperty('--stay', `${plan.stay}ms`);
    // The captain himself: hat, moustache, trench coat, cigarette, cut out (src/assets/captain.png).
    el.innerHTML = `<img class="peek-face" src="${CAPTAIN_URL}" alt="" width="240" height="312" decoding="async">`;
    // Caught in the act: a remark, and he is gone faster.
    el.addEventListener('click', () => {
      track('kukucs-elkapva');
      if (awardMedals(['rajtakapva']).length) track('erdemrend-rajtakapva');
      const lines = c.transitions.peek.lines;
      const note = document.createElement('div');
      note.className = `peek-note peek-note-${plan.edge}`;
      note.textContent = lines[Math.floor(rng() * lines.length)];
      note.style.cssText = el.style.cssText;
      document.body.appendChild(note);
      el.classList.add('peek-caught');
      window.setTimeout(() => note.remove(), 2600);
    }, { once: true });
    el.addEventListener('animationend', () => { el.remove(); if (current === el) current = null; });
    document.body.appendChild(el);
    current = el;
  }, plan.delay);
}
