import type { Content, GameState, Observation, Rng } from './types';

export const obsById = (c: Content, id: string): Observation | undefined => c.obs.find(o => o.id === id);

/** The observations that fit a slot of a week. */
export const candidates = (c: Content, level: number, slot: readonly (string | null)[]): Observation[] =>
  c.obs.filter(o => o.level === level && slot.includes(o.who));

/**
 * Draws the observations of every week from the pool: one per slot, at the week's level,
 * never the same observation twice in a game. Pure, all randomness comes from `rng`.
 */
export function pickWeeks(c: Content, rng: Rng): string[][] {
  const used = new Set<string>();
  return c.weeks.map(w => w.slots.map(slot => {
    const free = candidates(c, w.level, slot).filter(o => !used.has(o.id));
    if (!free.length) throw new Error(`Nincs szabad megfigyelés: ${w.label}, ${slot.join('/')}`);
    const o = free[Math.floor(rng() * free.length)];
    used.add(o.id);
    return o.id;
  }));
}

/** This week's observations, in slot order. */
export const weekObs = (s: GameState, c: Content): Observation[] =>
  s.weekObs[s.week].map(id => obsById(c, id)!);
