import { trusting } from './events';
import { anyMeterZero, endingKey } from './rules';
import type { Balance, Content, GameState } from './types';

/**
 * Medals: earned over many games and kept in the browser (`src/ui/medals.ts`). Each rule judges
 * a finished game from its final state; `rajtakapva` is not here, the UI awards it when the
 * player catches the captain peeking. Pure.
 */

/** The whole year was played, not cut short by a meter at zero or an exclusion. */
const fullYear = (s: GameState, c: Content) => s.week === c.weeks.length - 1 && !anyMeterZero(s.meters) && !s.excluded;

export const MEDAL_RULES: Record<string, (s: GameState, c: Content, b: Balance) => boolean> = {
  legjobb: (s, _c, b) => endingKey(s, b) === 'best',
  kivalo: (s, _c, b) => endingKey(s, b) === 'kivalo',
  behivatas: (s, _c, b) => endingKey(s, b) === 'behivatas',
  kizarva: (s, _c, b) => endingKey(s, b) === 'kizarva',
  megfigyelt: (s, _c, b) => endingKey(s, b) === 'megfigyelt',
  tiszta: (s, c) => fullYear(s, c) && Object.values(s.harmBy).every(h => h === 0),
  rezidens: (s, _c, b) => s.rank === b.ranks.length - 1,
  feladat: s => s.pastTasks.length >= 3 && s.doneTasks.length >= s.pastTasks.length,
  barat: s => trusting(s).length >= 2,
  szomszed: s => s.asked.length >= 2 && s.asked.every(a => a.yes && !a.found),
  balaton: s => s.holiday !== null,
  ketgazda: (s, c) => s.prevCaptain !== null && fullYear(s, c),
};

/** Medals the UI gives for something done on screen rather than in the game state. */
export const UI_MEDALS = ['rajtakapva'];

/** The medals a finished game earns, in the order of `medals.json`. */
export function medalsFor(s: GameState, c: Content, b: Balance): string[] {
  if (s.screen !== 'ending') return [];
  return c.medals.list.map(m => m.id).filter(id => MEDAL_RULES[id]?.(s, c, b));
}
