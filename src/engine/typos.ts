import type { Rng, Typo } from './types';

/**
 * Typing errors: a hurried, nervous informant hits two keys in the wrong order now and then, and
 * the captain corrects it in the margin. Pure, all randomness from `rng`.
 */

/** Words long enough to misspell visibly; placeholders (`{mari.b}`) are never touched. */
const WORD = /\{[^}]*\}|[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]{5,}/g;

/** The chance that one sentence of this week's report has a typo: more with a troubled conscience. */
export const typoChance = (L: number, base: number, nervous: number): number =>
  Math.min(1, Math.max(0, base + nervous * (1 - L / 100)));

/**
 * A typo in `text`: one word with two neighbouring letters swapped (never the first or the last
 * letter, never two equal ones), or null if the sentence has no such word.
 */
export function makeTypo(text: string, rng: Rng): Typo | null {
  const words: { at: number; w: string }[] = [];
  for (const m of text.matchAll(WORD)) if (!m[0].startsWith('{')) words.push({ at: m.index!, w: m[0] });
  while (words.length) {
    const { at, w } = words.splice(Math.floor(rng() * words.length), 1)[0];
    const spots = [...Array(w.length - 3).keys()].map(i => i + 1).filter(i => w[i].toLowerCase() !== w[i + 1].toLowerCase());
    if (!spots.length) continue;
    const i = spots[Math.floor(rng() * spots.length)];
    return { at, from: w, to: w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) };
  }
  return null;
}
