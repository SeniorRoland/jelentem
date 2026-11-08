import type { Balance, Content, GameState } from '../engine/types';

const KEY = 'jelentem.mentes.v1';

/**
 * A saved game is only used when it still fits the current content: same number of weeks,
 * existing observation ids and ranks. Anything else (old version, edited JSON) is dropped.
 */
export function fitsContent(s: unknown, c: Content, b: Balance): s is GameState {
  if (!s || typeof s !== 'object') return false;
  const g = s as Partial<GameState>;
  if (typeof g.week !== 'number' || g.week < 0 || g.week >= c.weeks.length) return false;
  if (typeof g.rank !== 'number' || g.rank < 0 || g.rank >= b.ranks.length) return false;
  if (!g.meters || !g.recruit || !g.names || !Array.isArray(g.weekObs) || !Array.isArray(g.slots)) return false;
  if (g.weekObs.length > c.weeks.length) return false;
  const ids = new Set(c.obs.map(o => o.id));
  if (!g.weekObs.every(w => Array.isArray(w) && w.every(id => ids.has(id)))) return false;
  if (g.screen !== 'intro' && !g.weekObs[g.week]) return false;
  return g.screen === 'intro' || g.screen === 'week' || g.screen === 'response' || g.screen === 'quarter';
}

/** The saved game, or null when there is none, it is finished, or storage is unavailable. */
export function loadGame(c: Content, b: Balance): GameState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s: unknown = JSON.parse(raw);
    return fitsContent(s, c, b) ? s : null;
  } catch {
    return null;
  }
}

/** Saves after every step; a finished game is removed, so the next visit starts fresh. */
export function saveGame(s: GameState): void {
  try {
    if (s.screen === 'ending') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: the game still works, it just does not persist.
  }
}
