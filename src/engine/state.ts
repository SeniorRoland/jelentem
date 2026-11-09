import { endQuarter, isLastWeek, isQuarterEnd, isQuarterStart, quarterOf, settleTask, slotsFor } from './career';
import { makeCaptain, makeNames } from './names';
import { pickWeek } from './observations';
import { makeRecruit } from './recruit';
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

const emptySlots = (n: number): Slot[] => Array.from({ length: n }, () => ({ o: null, i: null }));

export function newGame(c: Content, b: Balance, rng: Rng): GameState {
  const recruit = makeRecruit(c, rng);
  const names = makeNames(c, rng, [recruit.name.split(' ')[0]]);
  const captain = makeCaptain(c, rng, [recruit.name.split(' ')[0], ...Object.values(names).map(n => n.name)]);
  return {
    screen: 'intro',
    week: 0,
    rank: b.startRank,
    lastQuarter: null,
    task: null,
    pastTasks: [],
    doneTasks: [],
    watched: false,
    reportsOnYou: 0,
    meters: { ...b.start },
    code: randCode(c, rng),
    recruit,
    names,
    captain,
    weekObs: [],
    harmBy: { mari: 0, jozsi: 0, pityu: 0, porgoly: 0 },
    cons: [],
    reported: [],
    usedInts: [],
    slots: emptySlots(b.ranks[b.startRank].slots),
    dealt: [],
    last: null,
    hint: '',
  };
}

/** At the start of a quarter (from `task.fromQuarter`) the captain gives a task not given before. */
function assignTask(s: GameState, c: Content, b: Balance, rng: Rng): void {
  if (!isQuarterStart(s, c) || quarterOf(s, c) < b.task.fromQuarter) return;
  const fresh = c.tasks.filter(t => !s.pastTasks.includes(t.id));
  if (!fresh.length) return;
  const t = fresh[Math.floor(rng() * fresh.length)];
  s.task = { id: t.id, done: false };
  s.pastTasks.push(t.id);
}

function startWeek(s: GameState, c: Content, b: Balance, rng: Rng): void {
  assignTask(s, c, b, rng);
  s.weekObs[s.week] = pickWeek(s, c, rng);
  s.slots = emptySlots(slotsFor(s, b));
  s.dealt = deal(s, c, b, rng);
  s.hint = '';
  s.screen = 'week';
}

/** Which screen each action belongs to; actions from another screen are ignored. */
const SCREEN_OF: Record<Exclude<Action['type'], 'restart'>, GameState['screen'][]> = {
  reroll: ['intro'], start: ['intro'],
  toggleObs: ['week'], toggleInt: ['week'], unplace: ['week'], submit: ['week'],
  next: ['response', 'quarter'],
};

/** What follows the captain's response: another week, a quarterly review, or the end. */
export function nextStep(s: GameState, c: Content): 'week' | 'quarter' | 'ending' {
  if (isLastWeek(s, c) || anyMeterZero(s.meters)) return 'ending';
  return isQuarterEnd(s, c) ? 'quarter' : 'week';
}

/** Pure reducer: returns a new state, never mutates the input. */
export function dispatch(state: GameState, a: Action, c: Content, b: Balance, rng: Rng): GameState {
  if (a.type === 'restart') return newGame(c, b, rng);
  if (!SCREEN_OF[a.type].includes(state.screen)) return state;
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
    case 'next': {
      const step = s.screen === 'quarter' ? 'week' : nextStep(s, c);
      // The last quarter has no review: its task is settled right before the ending.
      // An early ending settles nothing, but a task already done still counts as done.
      if (step === 'ending') {
        if (isLastWeek(s, c)) settleTask(s, b);
        else if (s.task?.done) { s.doneTasks.push(s.task.id); s.task = null; }
        s.screen = 'ending';
      }
      else if (step === 'quarter') { s.lastQuarter = endQuarter(s, c, b); s.screen = 'quarter'; }
      else { s.week++; startWeek(s, c, b, rng); }
      break;
    }
  }
  return s;
}
