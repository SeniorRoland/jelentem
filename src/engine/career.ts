import { clamp } from './rules';
import type { Balance, Content, GameState, Grade, Meters, QuarterResult, ResidentId, ResidentStatus } from './types';

export const quarterOf = (s: GameState, c: Content): number => c.weeks[s.week].quarter;

/** 1-based position of the current week inside its quarter. */
export const weekInQuarter = (s: GameState, c: Content): number =>
  c.weeks.slice(0, s.week + 1).filter(w => w.quarter === quarterOf(s, c)).length;

export const isLastWeek = (s: GameState, c: Content): boolean => s.week >= c.weeks.length - 1;

export const isQuarterEnd = (s: GameState, c: Content): boolean =>
  isLastWeek(s, c) || c.weeks[s.week + 1].quarter !== quarterOf(s, c);

/** The captain expects more each week, and more again from a higher rank. */
export const expectFor = (s: GameState, b: Balance): number => b.expect[s.week] + b.ranks[s.rank].expectBonus;

/** Sentences in the report: a higher rank has to write more. */
export const slotsFor = (s: GameState, b: Balance): number => b.ranks[s.rank].slots;

export function gradeQuarter(m: Meters, b: Balance): Grade {
  if (m.E >= b.quarter.promoteE && m.H >= b.quarter.promoteH) return 'kivalo';
  if (m.E < b.quarter.demoteE) return 'hianyos';
  return 'megfelelo';
}

/**
 * Closes the current quarter: grades it, promotes or demotes, then lets the captain's
 * mood drift back towards the start and the conscience recover a little.
 * Mutates `s` (callers pass a clone).
 */
export function endQuarter(s: GameState, c: Content, b: Balance): QuarterResult {
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
  return { quarter: quarterOf(s, c), grade, rankBefore, rankAfter: s.rank, before, after: { ...s.meters } };
}

/** Where the reports have left a resident: in trouble, under suspicion, or untouched. */
export function residentStatus(s: GameState, id: ResidentId): ResidentStatus {
  if (s.cons.includes(id)) return 'bajban';
  return s.harmBy[id] > 0 ? 'gyanus' : 'nyugodt';
}
