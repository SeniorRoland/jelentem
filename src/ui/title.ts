import type { TitleCard } from '../engine/types';

/** When each part of the title card appears, and when it fades out and is gone (ms from the start). */
export interface TitlePlan {
  open: number;
  words: { text: string; at: number }[];
  close: number;
  source: number;
  out: number;
  done: number;
}

/**
 * The timeline of the title card: the opening quote mark, then the words one by one, with a
 * long breath after a comma and before the last word, the closing mark, the source, a silence,
 * and the fade to the loading screen. With reduced motion everything is there at once and only
 * held for a moment. Pure.
 */
export function planTitle(quote: string, reduced = false): TitlePlan {
  const parts = quote.split(/\s+/).filter(Boolean);
  if (reduced) {
    return { open: 0, words: parts.map(text => ({ text, at: 0 })), close: 0, source: 0, out: 2600, done: 2600 };
  }
  const open = 700;
  let at = open + 900;
  const words = parts.map((text, i) => {
    if (i === parts.length - 1 && i > 0) at += 600;   // the last word waits
    const w = { text, at };
    at += /[,;:–]$/.test(text) ? 1700 : 750;            // a comma is a breath
    return w;
  });
  const close = at + 200;
  const source = close + 1200;
  const out = source + 2200;
  return { open, words, close, source, out, done: out + 1400 };
}

/** How fast the card fades when the player does not want to wait. */
const SKIP_FADE = 450;

/**
 * Shows the title card over everything: a black screen on which the title appears slowly,
 * in quotation marks, as a quote, with its source under it. Any click or key skips it.
 * Calls `onDone` once the card is gone; returns a function that removes it at once.
 */
export function showTitle(t: TitleCard, onDone: () => void): () => void {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const p = planTitle(t.quote, reduced);
  const card = document.createElement('section');
  card.className = 'title-card';
  card.setAttribute('aria-label', `„${t.quote}” (${t.source})`);
  card.tabIndex = -1;
  const ms = (n: number) => `style="--at:${n}ms"`;
  card.innerHTML = `<figure class="tc-figure" aria-hidden="true">
  <blockquote class="tc-quote"><span class="tc-mark tc-in" ${ms(p.open)}>„</span>${p.words
    // The breath after a comma is also a line break: „Jelentem, / nem történt semmi”.
    .map((w, i) => `<span class="tc-word tc-in" ${ms(w.at)}>${w.text}</span>${i === p.words.length - 1 ? '' : /,$/.test(w.text) ? '<br>' : ' '}`)
    .join('')}<span class="tc-mark tc-in" ${ms(p.close)}>”</span></blockquote>
  <figcaption class="tc-source tc-in" ${ms(p.source)}>(${t.source})</figcaption>
  </figure>
  <button type="button" class="tc-skip">${t.skip}</button>`;
  document.body.appendChild(card);
  document.body.classList.add('title-showing');

  let timers: number[] = [];
  let gone = false;
  const remove = () => {
    if (gone) return;
    gone = true;
    timers.forEach(id => window.clearTimeout(id));
    timers = [];
    document.removeEventListener('keydown', onKey);
    card.remove();
    document.body.classList.remove('title-showing');
  };
  const fadeOut = (after: number) => {
    timers.forEach(id => window.clearTimeout(id));
    card.style.setProperty('--fade', `${after}ms`);
    card.classList.add('tc-out');
    timers = [window.setTimeout(() => { remove(); onDone(); }, after)];
  };
  const skip = () => { if (!gone && !card.classList.contains('tc-out')) fadeOut(SKIP_FADE); };
  const onKey = (e: KeyboardEvent) => { if (!e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); skip(); } };

  card.addEventListener('click', skip);
  document.addEventListener('keydown', onKey);
  card.focus({ preventScroll: true });
  timers.push(window.setTimeout(() => fadeOut(p.done - p.out), p.out));
  return remove;
}
