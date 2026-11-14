import { endingKey } from '../engine/rules';
import type { Action } from '../engine/state';
import type { Balance, Content, GameState } from '../engine/types';

/**
 * Anonymous counting with GoatCounter (no cookies, no personal data; the script tag is in
 * index.html). The page view counts itself; these are the game's own events, so the stats show
 * how far players get and how their year ends. Silent when the counter is not there (an ad
 * blocker, no network) or in developer mode; GoatCounter itself ignores localhost.
 */

interface GoatCounter { count: (v: { path: string; title?: string; event?: boolean }) => void }
declare global { interface Window { goatcounter?: GoatCounter } }

let enabled = true;

/** Switches the counting off, e.g. in developer mode. */
export const setTracking = (on: boolean): void => { enabled = on; };

/** Counts one event by its path, e.g. `vege-best`. Never throws. */
export function track(path: string): void {
  if (!enabled) return;
  try { window.goatcounter?.count?.({ path, event: true }); } catch { /* counting must never break the game */ }
}

/**
 * The events an action leads to, from the state before and after it. Pure.
 * - `jatek-indul`: the first week starts (after the opening letter).
 * - `negyedev-2` … `negyedev-4`: a new quarter starts, so the stats show where players stop.
 * - `vege-<key>`: the year ends, and how (`best`, `kizarva`, `kivalo`, `megfigyelt`, `behivatas`).
 */
export function eventsFor(a: Action, before: GameState, after: GameState, c: Content, b: Balance): string[] {
  const out: string[] = [];
  if (a.type === 'start' && before.screen === 'intro' && after.screen === 'week') out.push('jatek-indul');
  if (before.screen === 'quarter' && after.screen === 'week') out.push(`negyedev-${c.weeks[after.week].quarter + 1}`);
  if (before.screen !== 'ending' && after.screen === 'ending') out.push(`vege-${endingKey(after, b)}`);
  return out;
}
