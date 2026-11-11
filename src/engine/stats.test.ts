import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { delta, extremes, statRow, totals } from './stats';
import { gentle, playGame } from './test-utils';
import type { Meters } from './types';

const m = (E: number, H: number, L: number): Meters => ({ E, H, L });

describe('the year’s statement', () => {
  const game = playGame(3, gentle);
  const end = game[game.length - 1];

  it('records every report and every quarter, in order, each starting where the last ended', () => {
    expect(end.screen).toBe('ending');
    const h = end.history;
    const weeks = h.filter(r => r.kind === 'week');
    const quarters = h.filter(r => r.kind === 'quarter');
    // This game is closed early (excluded after the third review): one row per week actually played.
    expect(weeks.map(r => r.week)).toEqual([...Array(end.week + 1).keys()].filter(w => w !== end.holiday));
    expect(quarters.map(r => r.quarter)).toEqual([0, 1, 2]);
    expect(quarters.every(r => r.grade)).toBe(true);
    expect(h[0].before).toEqual(balance.start);
    for (let i = 1; i < h.length; i++) expect(h[i].before).toEqual(h[i - 1].after);
    expect(h[h.length - 1].after).toEqual(end.meters);
  });

  it('finds the best and worst week of a meter from the reports only, the earlier one on a tie', () => {
    const h = [
      statRow('week', 0, 0, m(50, 50, 50), m(55, 48, 50)),
      statRow('week', 1, 0, m(55, 48, 50), m(52, 50, 50)),
      statRow('quarter', 2, 0, m(52, 50, 50), m(80, 70, 70), 'kivalo'),
      statRow('week', 3, 1, m(80, 70, 70), m(85, 66, 70)),
    ];
    expect(extremes(h, 'E').best!.week).toBe(0);
    expect(extremes(h, 'E').worst!.week).toBe(1);
    expect(extremes(h, 'H').worst!.week).toBe(3);
    expect(extremes(h, 'L')).toEqual({ best: null, worst: null });
    expect(totals(h, 'E')).toEqual({ weeks: 7, all: 35 });
    expect(delta(h[2], 'L')).toBe(20);
  });

  it('shows on the ending: a row per report and review, signed changes, the summary, no placeholders', () => {
    const html = renderScreen(end, content, balance, { dev: false });
    expect(html).toContain(content.stats.title);
    expect((html.match(/<tr class="st-(week|quarter|task)"/g) ?? []).length).toBe(end.history.length);
    expect(html).toContain(content.stats.week.replace('{n}', '1'));
    expect(html).toContain(content.stats.quarter.replace('{q}', content.stats.quarters[0]));
    expect(html).not.toMatch(/\{[a-z.]+\}/);
    expect(html).not.toMatch(/>-\d/);
    expect((html.match(/<li>/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('tells an old save’s missing pages honestly', () => {
    const html = renderScreen({ ...end, history: [] }, content, balance, { dev: false });
    expect(html).toContain(content.stats.empty);
    expect(html).not.toContain('st-table');
  });
});
