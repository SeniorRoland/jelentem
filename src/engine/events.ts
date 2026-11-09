import { statusesOf } from './observations';
import type { Balance, Content, GameState, HouseEvent, ResidentId, Rng } from './types';

/** This week's house event, or null. */
export const eventOf = (s: GameState, c: Content): HouseEvent | null => {
  const id = s.events[s.week];
  return id ? c.events.list.find(e => e.id === id) ?? null : null;
};

/** Event ids already drawn in this game. */
const usedEvents = (s: GameState) => new Set(s.events.filter((x): x is string => !!x));

/**
 * True when the event can happen now: its quarter and resident conditions hold, and for a
 * kindness the resident still trusts the player (untouched, not already close, never betrayed).
 */
export function eventFits(e: HouseEvent, s: GameState, c: Content): boolean {
  const st = statusesOf(s, c);
  if (e.quarters && !e.quarters.includes(c.weeks[s.week].quarter)) return false;
  for (const [id, ok] of Object.entries(e.requires ?? {}) as [ResidentId, string[]][])
    if (!ok.includes(st[id]!)) return false;
  if (e.kind === 'kind') {
    const who = e.who!;
    if (st[who] !== 'nyugodt' || s.bonds.includes(who) || s.betrayed.includes(who)) return false;
  }
  return true;
}

/** Draws this week's event: from `events.fromWeek`, with `events.chance`, never one twice. Pure. */
export function pickEvent(s: GameState, c: Content, b: Balance, rng: Rng): string | null {
  if (s.week < b.events.fromWeek || rng() >= b.events.chance) return null;
  const used = usedEvents(s);
  const free = c.events.list.filter(e => !used.has(e.id) && eventFits(e, s, c));
  return free.length ? free[Math.floor(rng() * free.length)].id : null;
}

/** A kindness makes the resident close to the player. Mutates `s`. */
export function applyEvent(s: GameState, c: Content): void {
  const e = eventOf(s, c);
  if (e?.kind === 'kind' && e.who && !s.bonds.includes(e.who)) s.bonds.push(e.who);
}

/** True when the resident is close to the player: harming them hurts more, and an alibi card comes each week. */
export const isBonded = (s: GameState, who: ResidentId | null): boolean => !!who && s.bonds.includes(who);
