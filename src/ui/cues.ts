import type { Action } from '../engine/state';
import type { GameState } from '../engine/types';

/**
 * The sounds of the office: `type` a few typewriter keys, `key` one key, `line` a sentence typed
 * to its end (keys, the bell at the margin, the carriage thrown back to a new line), `stamp` the
 * rubber stamp landing, `page` a sheet pulled out or turned over.
 */
export type Cue = 'type' | 'key' | 'line' | 'stamp' | 'page';

/** A sound and how long after the click it starts (ms), so it can land with an animation. */
export interface Timed { cue: Cue; at: number }

/** When the stamp animation (styles.css `.stamp`) hits the paper. */
export const STAMP_LANDS = 220;

/** Sentences that have both an observation and an interpretation. */
const complete = (s: GameState) => s.slots.filter(sl => sl.o && sl.i).length;

/**
 * Which sounds an action makes, judged from the state before and after it. Pure: the UI
 * plays what this returns, the tests check it without any audio.
 */
export function cuesFor(a: Action, before: GameState, after: GameState): Timed[] {
  if (after === before) return [];
  const stamped = (s: GameState) => s.screen === 'response' || s.screen === 'quarter';
  // Every new sheet that carries a stamp (the reply, the quarterly review) gets the thud.
  const stamp = stamped(after) && after.screen !== before.screen ? [{ cue: 'stamp' as const, at: STAMP_LANDS }] : [];
  switch (a.type) {
    case 'toggleObs': case 'toggleInt': case 'placeObs': case 'placeInt': {
      const placed = (s: GameState) => s.slots.some(sl => sl.o === a.id || sl.i === a.id);
      // A sentence with both its parts is typed to the end of the line: bell, new line.
      if (complete(after) > complete(before)) return [{ cue: 'line', at: 0 }];
      if (placed(after) && !placed(before)) return [{ cue: 'type', at: 0 }];
      if (!placed(after) && placed(before)) return [{ cue: 'key', at: 0 }];
      return [];
    }
    case 'unplace': case 'strike': case 'answer':
      return [{ cue: 'key', at: 0 }];
    case 'reroll':
      return [{ cue: 'type', at: 0 }];
    // The finished report is pulled out of the typewriter, and comes back stamped.
    case 'submit':
    case 'start': case 'next': case 'restart':
      return [{ cue: 'page', at: 0 }, ...stamp];
  }
}
