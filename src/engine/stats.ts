import type { Grade, Meters, StatRow } from './types';

/**
 * The year in numbers, for the ending's statement: every week's report and every quarter's
 * review, with where the three meters stood before and after. Pure helpers over
 * `state.history`, which `resolveWeek`, `endQuarter` and the last week's task settle fill.
 */

export const METER_KEYS: (keyof Meters)[] = ['E', 'H', 'L'];

/** One row of the history. */
export const statRow = (kind: StatRow['kind'], week: number, quarter: number, before: Meters, after: Meters, grade: Grade | null = null): StatRow =>
  ({ kind, week, quarter, before: { ...before }, after: { ...after }, grade });

export const delta = (r: StatRow, k: keyof Meters): number => r.after[k] - r.before[k];

/**
 * The week a meter rose the most and the week it fell the most, from the weekly reports only
 * (the quarter's drift and rewards are not the player's doing). Null when it never moved that way;
 * the earlier week wins a tie.
 */
export function extremes(history: StatRow[], k: keyof Meters): { best: StatRow | null; worst: StatRow | null } {
  let best: StatRow | null = null, worst: StatRow | null = null;
  for (const r of history) {
    if (r.kind !== 'week') continue;
    const d = delta(r, k);
    if (d > 0 && (!best || d > delta(best, k))) best = r;
    if (d < 0 && (!worst || d < delta(worst, k))) worst = r;
  }
  return { best, worst };
}

/** The year's total change of a meter over the weekly reports, and over everything. */
export function totals(history: StatRow[], k: keyof Meters): { weeks: number; all: number } {
  let weeks = 0;
  for (const r of history) if (r.kind === 'week') weeks += delta(r, k);
  const all = history.length ? history[history.length - 1].after[k] - history[0].before[k] : 0;
  return { weeks, all };
}
