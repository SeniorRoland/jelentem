import { shuffle } from './rng';
import type { Content, ResidentId, ResidentName, Rng } from './types';

/**
 * Draws a family name for every resident from its own candidates, each based on a trait
 * that is true of that resident. No two people share a name, and none takes `taken`
 * (the recruit's family name). Pure, all randomness comes from `rng`.
 */
export function makeNames(c: Content, rng: Rng, taken: string[] = []): Record<ResidentId, ResidentName> {
  const used = new Set(taken);
  const out = {} as Record<ResidentId, ResidentName>;
  for (const id of Object.keys(c.residents) as ResidentId[]) {
    const pick = shuffle(c.residents[id].surnames, rng).find(n => !used.has(n.name));
    if (!pick) throw new Error(`Nincs szabad vezetéknév: ${id}`);
    used.add(pick.name);
    out[id] = pick;
  }
  return out;
}

const PLACEHOLDER = /\{([a-z]+)\}/g;

/** Every `{id}` placeholder in a content text. */
export const placeholders = (text: string): string[] => [...text.matchAll(PLACEHOLDER)].map(m => m[1]);

/** Replaces `{mari}` etc. with the generated family names; unknown placeholders stay. */
export function fillNames(text: string, names: Record<ResidentId, ResidentName>): string {
  return text.replace(PLACEHOLDER, (m, id: string) => (id in names ? names[id as ResidentId].name : m));
}
