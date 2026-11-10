import { clamp } from './rules';
import type { Balance, Content, GameState, Grade, Meters, QuarterResult, ResidentId, ResidentStatus, TaskState } from './types';

export const quarterOf = (s: GameState, c: Content): number => c.weeks[s.week].quarter;

/** 1-based position of the current week inside its quarter. */
export const weekInQuarter = (s: GameState, c: Content): number =>
  c.weeks.slice(0, s.week + 1).filter(w => w.quarter === quarterOf(s, c)).length;

export const isLastWeek = (s: GameState, c: Content): boolean => s.week >= c.weeks.length - 1;

export const isQuarterEnd = (s: GameState, c: Content): boolean =>
  isLastWeek(s, c) || c.weeks[s.week + 1].quarter !== quarterOf(s, c);

const profile = (s: GameState, b: Balance) => b.categories[s.recruit.categoryId] ?? { expectBonus: 0, doubt: 1 };

/**
 * The captain expects more each week, more from a higher rank, more from a compromised agent,
 * and more or less when something happened in the house.
 */
export const expectFor = (s: GameState, b: Balance, c: Content): number => {
  const ev = s.events[s.week];
  const bonus = ev ? c.events.list.find(e => e.id === ev)?.expect ?? 0 : 0;
  return b.expect[s.week] + b.ranks[s.rank].expectBonus + profile(s, b).expectBonus + bonus + rested(s, b, c);
};

/** After a SZOT stay the captain expects more for the rest of that quarter. */
const rested = (s: GameState, b: Balance, c: Content): number =>
  s.holidayQuarter !== null && s.holidayQuarter === quarterOf(s, c) && s.week !== s.holiday ? b.holiday.expect : 0;

/** How much harder lost credibility hits, by the recruit's category. */
export const doubtFor = (s: GameState, b: Balance): number => profile(s, b).doubt;

export const isQuarterStart = (s: GameState, c: Content): boolean => s.week === 0 || c.weeks[s.week - 1].quarter !== quarterOf(s, c);

/** Sentences in the report: a higher rank has to write more. */
export const slotsFor = (s: GameState, b: Balance): number => b.ranks[s.rank].slots;

export function gradeQuarter(m: Meters, b: Balance): Grade {
  if (m.E >= b.quarter.promoteE && m.H >= b.quarter.promoteH) return 'kivalo';
  if (m.E < b.quarter.demoteE) return 'hianyos';
  return 'megfelelo';
}

/**
 * Closes the current quarter: settles the task (bonus or penalty), grades the quarter,
 * promotes or demotes, then lets the captain's mood drift back towards the start and the
 * conscience recover a little. Mutates `s` (callers pass a clone).
 */
export function endQuarter(s: GameState, c: Content, b: Balance): QuarterResult {
  const task = settleTask(s, b);
  const before = { ...s.meters };
  const grade = gradeQuarter(before, b);
  const rankBefore = s.rank;
  const top = b.ranks.length - 1;
  if (grade === 'kivalo') s.rank = Math.min(top, s.rank + 1);
  if (grade === 'hianyos') s.rank = Math.max(0, s.rank - 1);
  s.meters = {
    E: clamp(Math.round(before.E + (b.start.E - before.E) * b.quarter.resetE)),
    H: clamp(before.H + b.quarter.healH),
    L: clamp(before.L + b.quarter.healL),
  };
  // The caretaker calms down once the player is credible again.
  const calmed = s.watched ? s.meters.H >= b.watch.calmAt : null;
  if (calmed) s.watched = false;

  // On the passive rank, hiányos again and again: the network forgets the player.
  s.passiveStreak = rankBefore === 0 && grade === 'hianyos' ? s.passiveStreak + 1 : 0;
  const excluded = s.passiveStreak >= b.exclusion.streak;
  if (excluded) s.excluded = true;

  // A promotion comes with its reward, and every reward has its price.
  const reward = s.rank > rankBefore && b.rewards[String(s.rank)] ? s.rank : null;
  if (reward !== null) {
    const r = b.rewards[String(reward)];
    s.meters = { E: clamp(s.meters.E + (r.E ?? 0)), H: clamp(s.meters.H + (r.H ?? 0)), L: clamp(s.meters.L + (r.L ?? 0)) };
    if (r.holiday && !isLastWeek(s, c)) { s.holiday = s.week + 1; s.holidayQuarter = c.weeks[s.week + 1].quarter; }
  }
  return { quarter: quarterOf(s, c), grade, task, calmed, reward, excluded, rankBefore, rankAfter: s.rank, before, after: { ...s.meters } };
}

/** Closes the open task: the captain's mood goes up if done, down if not. Mutates `s`. */
export function settleTask(s: GameState, b: Balance): TaskState | null {
  const task = s.task;
  if (!task) return null;
  s.meters.E = clamp(s.meters.E + (task.done ? b.task.reward : -b.task.penalty));
  if (task.done) s.doneTasks.push(task.id);
  s.task = null;
  return task;
}

/** Where the reports have left a resident: in trouble, under suspicion, or untouched. */
export function residentStatus(s: GameState, id: ResidentId): ResidentStatus {
  if (s.cons.includes(id)) return 'bajban';
  return s.harmBy[id] > 0 ? 'gyanus' : 'nyugodt';
}
