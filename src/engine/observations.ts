import { residentStatus } from './career';
import type { Content, GameState, Observation, ResidentId, ResidentStatus, Rng, Week } from './types';

export const obsById = (c: Content, id: string): Observation | undefined => c.obs.find(o => o.id === id);

/** Resident states an observation is drawn under; `null` status means „any”. */
export type Statuses = Partial<Record<ResidentId, ResidentStatus>>;

/** True when the observation's conditions hold for the given resident states. */
export function fits(o: Observation, st: Statuses): boolean {
  if (!o.requires) return true;
  return (Object.entries(o.requires) as [ResidentId, ResidentStatus[]][])
    .every(([id, ok]) => st[id] === undefined || ok.includes(st[id]!));
}

/** The observations that fit a slot of a week, for the given resident states. */
export const candidates = (c: Content, w: Week, slot: readonly (string | null)[], st: Statuses = {}): Observation[] =>
  c.obs.filter(o => !o.self && o.level === w.level && slot.includes(o.who)
    && (!o.quarters || o.quarters.includes(w.quarter)) && fits(o, st));

export function statusesOf(s: GameState, c: Content): Statuses {
  const st: Statuses = {};
  for (const id of Object.keys(c.residents) as ResidentId[]) st[id] = residentStatus(s, id);
  return st;
}

/**
 * Draws this week's observations: one per slot, at the week's level and quarter, fitting
 * how the residents stand now, never one already drawn in this game. While the caretaker
 * is reporting on the player, one observation about the player comes on top. Pure.
 */
export function pickWeek(s: GameState, c: Content, rng: Rng): string[] {
  const w = c.weeks[s.week];
  const used = new Set(s.weekObs.flat());
  const st = statusesOf(s, c);
  const ids = w.slots.map(slot => {
    const free = candidates(c, w, slot, st).filter(o => !used.has(o.id));
    if (!free.length) throw new Error(`Nincs szabad megfigyelés: ${w.label}, ${slot.join('/')}`);
    const o = free[Math.floor(rng() * free.length)];
    used.add(o.id);
    return o.id;
  });
  if (s.watched) {
    const self = c.obs.filter(o => o.self && !used.has(o.id));
    if (self.length) ids.push(self[Math.floor(rng() * self.length)].id);
  }
  return ids;
}

/** This week's observations, in slot order. */
export const weekObs = (s: GameState, c: Content): Observation[] =>
  s.weekObs[s.week].map(id => obsById(c, id)!);
