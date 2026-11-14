import { endQuarter, isLastWeek, isQuarterEnd, isQuarterStart, quarterOf, settleTask, slotsFor } from './career';
import { applyEvent, pickEvent } from './events';
import { makeReview, peerCode, reviews } from './review';
import { makeAddress, makeCaptain, makeGirl, makeNames, makeOwnFace, makePeople } from './names';
import { pickWeek, weekObs } from './observations';
import { makeRecruit } from './recruit';
import { anyMeterZero, deal, randCode, resolveWeek } from './rules';
import { statRow } from './stats';
import type { Balance, Content, GameState, Rng, Slot, Taste } from './types';

export type Action =
  | { type: 'reroll' }
  | { type: 'start' }
  | { type: 'toggleObs'; id: string }
  | { type: 'toggleInt'; id: string }
  | { type: 'unplace'; slot: number; part: 'o' | 'i' }
  /** Dragged onto a chosen sentence: an observation (replacing the one there) or an interpretation. */
  | { type: 'placeObs'; id: string; slot: number }
  | { type: 'placeInt'; id: string; slot: number }
  | { type: 'strike'; idx: number }
  | { type: 'submit' }
  | { type: 'next' }
  | { type: 'restart' };

const emptySlots = (n: number): Slot[] => Array.from({ length: n }, () => ({ o: null, i: null }));
/** The next placement turn, later than every observation in the report. */
const nextTurn = (slots: Slot[]): number => Math.max(0, ...slots.map(x => x.t ?? 0)) + 1;
/** The sentence whose observation was put in last and still has no interpretation, or −1. */
export function latestOpen(slots: Slot[]): number {
  let best = -1;
  slots.forEach((x, k) => { if (x.o && !x.i && (best < 0 || (x.t ?? 0) > (slots[best].t ?? 0))) best = k; });
  return best;
}

export function newGame(c: Content, b: Balance, rng: Rng): GameState {
  const recruit = makeRecruit(c, rng);
  const names = makeNames(c, rng, [recruit.name.split(' ')[0]]);
  const taken = [recruit.name.split(' ')[0], ...Object.values(names).map(n => n.name)];
  const captain = makeCaptain(c, rng, taken);
  const people = makePeople(c, rng);
  const face = makeOwnFace(c, rng, recruit.sex, 1979 - recruit.birthYear, Object.values(people).map(p => p.face));
  const address = makeAddress(c, rng);
  const girl = makeGirl(c, rng, [...taken, captain.name]);
  // Some years the handler is replaced halfway: drawn now, it happens when the quarter comes.
  const handover = rng() < b.handover.chance
    ? { quarter: b.handover.quarter, taste: (rng() < 0.5 ? 'wild' : 'dry') as Taste, captain: makeCaptain(c, rng, [...taken, captain.name, girl.name]), week: null }
    : null;
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
    peer: null,
    review: null,
    peerUsed: [],
    passiveStreak: 0,
    excluded: false,
    holiday: null,
    holidayQuarter: null,
    events: [],
    bonds: [],
    betrayed: [],
    meters: { ...b.start },
    code: randCode(c, rng),
    recruit,
    names,
    captain,
    handover,
    prevCaptain: null,
    people,
    address,
    girl,
    face,
    weekObs: [],
    harmBy: { mari: 0, jozsi: 0, pityu: 0, porgoly: 0 },
    cons: [],
    consLevel: {},
    reported: [],
    log: [],
    history: [],
    usedInts: [],
    slots: emptySlots(b.ranks[b.startRank].slots),
    dealt: [],
    last: null,
    hint: '',
  };
}

/** At the start of a quarter (from `task.fromQuarter`) the captain gives a task not given before. */
function assignTask(s: GameState, c: Content, b: Balance, rng: Rng): void {
  // After a SZOT stay skipped the quarter's first week, the first week played gets the task.
  const backFromHoliday = s.holiday !== null && s.week === s.holiday + 1 && c.weeks[s.holiday].quarter === quarterOf(s, c);
  if (!(isQuarterStart(s, c) || backFromHoliday) || quarterOf(s, c) < b.task.fromQuarter) return;
  const fresh = c.tasks.filter(t => !s.pastTasks.includes(t.id));
  if (!fresh.length) return;
  const t = fresh[Math.floor(rng() * fresh.length)];
  s.task = { id: t.id, done: false };
  s.pastTasks.push(t.id);
}

function startWeek(s: GameState, c: Content, b: Balance, rng: Rng): void {
  // The new handler takes over on the first played week of his quarter.
  if (s.handover && s.handover.week === null && c.weeks[s.week].quarter >= s.handover.quarter) {
    s.prevCaptain = s.captain;
    s.captain = s.handover.captain;
    s.handover.week = s.week;
  }
  assignTask(s, c, b, rng);
  s.events[s.week] = pickEvent(s, c, b, rng);
  applyEvent(s, c);
  s.weekObs[s.week] = pickWeek(s, c, rng);
  s.slots = emptySlots(slotsFor(s, b));
  s.dealt = deal(s, c, b, rng);
  // On the top rank, another informant's report waits to be checked.
  s.review = null;
  if (reviews(s, b)) {
    if (!s.peer) s.peer = peerCode(s, c, rng);
    s.review = makeReview(s, c, b, rng);
    if (s.review) s.peerUsed.push(...s.review.items.map(x => x.o));
  }
  s.hint = '';
  s.screen = 'week';
}

/** Which screen each action belongs to; actions from another screen are ignored. */
const SCREEN_OF: Record<Exclude<Action['type'], 'restart'>, GameState['screen'][]> = {
  reroll: ['intro'], start: ['intro'],
  toggleObs: ['week'], toggleInt: ['week'], unplace: ['week'], submit: ['week'], strike: ['week'],
  placeObs: ['week'], placeInt: ['week'],
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
      if (free >= 0) { s.slots[free].o = a.id; s.slots[free].t = nextTurn(s.slots); s.hint = ''; } else s.hint = 'slotsFull';
      break;
    }
    case 'toggleInt': {
      const at = s.slots.findIndex(x => x.i === a.id);
      if (at >= 0) { s.slots[at].i = null; s.hint = ''; break; }
      // It goes with the observation put in last that has none yet: observation, interpretation,
      // observation fills the first sentence; observation, observation, interpretation the second.
      const free = latestOpen(s.slots);
      if (free >= 0) { s.slots[free].i = a.id; s.hint = ''; }
      else s.hint = s.slots.some(x => !x.o) ? 'needObs' : 'intsFull';
      break;
    }
    case 'placeObs': {
      const sl = s.slots[a.slot];
      if (!sl || !weekObs(s, c).some(o => o.id === a.id)) break;
      if (sl.o === a.id) break;
      // Moved from another sentence: that one is emptied.
      const from = s.slots.findIndex(x => x.o === a.id);
      if (from >= 0) s.slots[from] = { o: null, i: null };
      sl.o = a.id;
      sl.t = nextTurn(s.slots);
      s.hint = '';
      break;
    }
    case 'placeInt': {
      const sl = s.slots[a.slot];
      if (!sl || !s.dealt.includes(a.id)) break;
      if (!sl.o) { s.hint = 'needObs'; break; }
      const from = s.slots.findIndex(x => x.i === a.id);
      if (from >= 0) s.slots[from].i = null;
      sl.i = a.id;
      s.hint = '';
      break;
    }
    case 'strike': {
      // Strike a sentence of the other report out, or put it back.
      if (!s.review || a.idx < 0 || a.idx >= s.review.items.length) break;
      s.review.struck[a.idx] = !s.review.struck[a.idx];
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
      s.last = resolveWeek(s, c, b, rng);
      s.screen = 'response';
      break;
    case 'next': {
      // An excluded player's file is closed at the review.
      const step = s.screen === 'quarter' ? (s.excluded ? 'ending' : 'week') : nextStep(s, c);
      // The last quarter has no review: its task is settled right before the ending.
      // An early ending settles nothing, but a task already done still counts as done.
      if (step === 'ending') {
        if (isLastWeek(s, c)) {
          const start = { ...s.meters };
          if (settleTask(s, b)) s.history.push(statRow('task', s.week, quarterOf(s, c), start, s.meters));
        }
        else if (s.task?.done) { s.doneTasks.push(s.task.id); s.task = null; }
        s.screen = 'ending';
      }
      else if (step === 'quarter') { s.lastQuarter = endQuarter(s, c, b); s.screen = 'quarter'; }
      else {
        s.week++;
        // The SZOT stay: that week passes without a report, and nothing happens in the house.
        if (s.week === s.holiday && !isLastWeek(s, c)) { s.weekObs[s.week] = []; s.events[s.week] = null; s.week++; }
        startWeek(s, c, b, rng);
      }
      break;
    }
  }
  return s;
}
