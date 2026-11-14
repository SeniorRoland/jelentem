import { residentStatus } from './career';
import type { Balance, Content, GameState, ResidentRequest, Rng } from './types';

/**
 * Residents' favours: now and then a resident asks the player for one (post a letter, keep a
 * key, sign something). Saying yes makes them close (as a kindness does) but the captain may hear
 * of it; saying no, or not answering, pushes them away and weighs a little on the conscience.
 */

/** This week's request, or null. */
export const requestOf = (s: GameState, c: Content): ResidentRequest | null =>
  s.request ? c.requests.items.find(r => r.id === s.request!.id) ?? null : null;

/** Who may still ask: never one the player betrayed, nor one the reports got into trouble. */
export const mayAsk = (s: GameState, r: ResidentRequest): boolean =>
  !s.betrayed.includes(r.who) && residentStatus(s, r.who) !== 'bajban';

/** Draws this week's request: from `fromWeek`, with `chance`, at most `max` a year, each once. Pure. */
export function pickRequest(s: GameState, c: Content, b: Balance, rng: Rng): GameState['request'] {
  const q = b.requests;
  if (s.week < q.fromWeek || s.asked.length >= q.max || rng() >= q.chance) return null;
  const asked = new Set(s.asked.map(a => a.id));
  const free = c.requests.items.filter(r => !asked.has(r.id) && mayAsk(s, r));
  if (!free.length) return null;
  return { id: free[Math.floor(rng() * free.length)].id, answer: null };
}

/**
 * Settles the week's request when the report goes in. Mutates `s` (callers pass a clone);
 * returns the outcome for the reply, and the changes to the meters.
 */
export function settleRequest(s: GameState, c: Content, b: Balance, rng: Rng):
  { result: { id: string; yes: boolean; found: boolean } | null; E: number; H: number; L: number } {
  const r = requestOf(s, c);
  if (!r || !s.request) return { result: null, E: 0, H: 0, L: 0 };
  const yes = s.request.answer === true;
  const q = b.requests;
  let E = 0, H = 0, L = 0, found = false;
  if (yes) {
    if (!s.favored.includes(r.who) && !s.betrayed.includes(r.who)) s.favored.push(r.who);
    found = rng() < q.risk;
    if (found) { E -= q.found.E; H -= q.found.H; }
  } else {
    s.bonds = s.bonds.filter(k => k !== r.who);
    s.favored = s.favored.filter(k => k !== r.who);
    L -= q.refuse;
  }
  s.asked.push({ id: r.id, yes, found });
  return { result: { id: r.id, yes, found }, E, H, L };
}
