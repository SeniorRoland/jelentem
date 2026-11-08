import { anyMeterZero, deal, randCode, resolveWeek } from './rules';
import type { Balance, Content, GameState, Rng, Slot } from './types';

export type Action =
  | { type: 'reroll' }
  | { type: 'start' }
  | { type: 'toggleObs'; id: string }
  | { type: 'toggleInt'; id: string }
  | { type: 'unplace'; slot: number; part: 'o' | 'i' }
  | { type: 'submit' }
  | { type: 'next' }
  | { type: 'restart' };

const emptySlots = (b: Balance): Slot[] => Array.from({ length: b.slotsPerWeek }, () => ({ o: null, i: null }));

export function newGame(c: Content, b: Balance, rng: Rng): GameState {
  return {
    screen: 'intro',
    week: 0,
    meters: { ...b.start },
    code: randCode(c, rng),
    harmBy: { mari: 0, jozsi: 0, pityu: 0, porgoly: 0 },
    cons: [],
    reported: [],
    usedInts: [],
    slots: emptySlots(b),
    dealt: [],
    last: null,
    hint: '',
  };
}

function startWeek(s: GameState, c: Content, b: Balance, rng: Rng): void {
  s.slots = emptySlots(b);
  s.dealt = deal(s, c, b, rng);
  s.hint = '';
  s.screen = 'week';
}

/** Pure reducer: returns a new state, never mutates the input. */
export function dispatch(state: GameState, a: Action, c: Content, b: Balance, rng: Rng): GameState {
  if (a.type === 'restart') return newGame(c, b, rng);
  const s: GameState = structuredClone(state);

  switch (a.type) {
    case 'reroll':
      s.code = randCode(c, rng);
      break;
    case 'start':
      startWeek(s, c, b, rng);
      break;
    case 'toggleObs': {
      const at = s.slots.findIndex(x => x.o === a.id);
      if (at >= 0) { s.slots[at] = { o: null, i: null }; s.hint = ''; break; }
      const free = s.slots.findIndex(x => !x.o);
      if (free >= 0) { s.slots[free].o = a.id; s.hint = ''; } else s.hint = 'slotsFull';
      break;
    }
    case 'toggleInt': {
      const at = s.slots.findIndex(x => x.i === a.id);
      if (at >= 0) { s.slots[at].i = null; s.hint = ''; break; }
      const free = s.slots.findIndex(x => x.o && !x.i);
      if (free >= 0) { s.slots[free].i = a.id; s.hint = ''; }
      else s.hint = s.slots.some(x => !x.o) ? 'needObs' : 'intsFull';
      break;
    }
    case 'unplace': {
      const sl = s.slots[a.slot];
      if (!sl) break;
      if (a.part === 'o') { sl.o = null; sl.i = null; } else sl.i = null;
      s.hint = '';
      break;
    }
    case 'submit':
      s.last = resolveWeek(s, c, b);
      s.screen = 'response';
      break;
    case 'next':
      if (s.week < c.weeks.length - 1 && !anyMeterZero(s.meters)) {
        s.week++;
        startWeek(s, c, b, rng);
      } else s.screen = 'ending';
      break;
  }
  return s;
}
