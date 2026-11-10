import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { mulberry32 } from '../engine/rng';
import { dispatch, newGame, type Action } from '../engine/state';
import { gentle, playGame } from '../engine/test-utils';
import type { GameState } from '../engine/types';
import { introScene, quarterScene, sceneFor, splitLabel, weekScene } from './transitions';

const game = playGame(3, gentle);
/** Every step of a whole game: the action taken, and the states before and after it. */
const steps: { a: Action; before: GameState; after: GameState }[] = [];
{
  const r = mulberry32(3);
  for (const s of game) {
    if (s.screen !== 'response' && s.screen !== 'quarter') continue;
    steps.push({ a: { type: 'next' }, before: s, after: dispatch(s, { type: 'next' }, content, balance, r) });
  }
}
const noPlaceholders = (html: string) => expect(html).not.toMatch(/\{[a-z.]+\}/);

describe('the scenes between screens', () => {
  it('split every week title into a calendar page', () => {
    for (const w of content.weeks) {
      const l = splitLabel(w.label);
      expect(l.year).toBe('1979');
      expect(`${l.year}. ${l.month} ${l.days}`).toBe(w.label);
    }
  });

  it('tear a calendar page off before every new week, with a line about the house that never repeats', () => {
    const weeks = steps.filter(x => x.after.screen === 'week');
    expect(weeks.length).toBeGreaterThan(5);
    const lines = new Set<string>();
    for (const { a, before, after } of weeks) {
      const sc = sceneFor(a, before, after, content)!;
      expect(sc.cls).toBe('sc-week');
      expect(sc.html).toContain(splitLabel(content.weeks[after.week].label).days);
      expect(sc.html).toContain(splitLabel(content.weeks[after.week - 1].label).days);
      lines.add(sc.html.match(/cal-line[^>]*>([^<]+)</)![1]);
      noPlaceholders(sc.html);
      // Long enough to read the line, short enough for twelve weeks.
      expect(sc.out + sc.fade).toBeGreaterThan(3000);
      expect(sc.out + sc.fade).toBeLessThan(4500);
    }
    expect(lines.size).toBe(weeks.length);
  });

  it('name the new quarter on its first page', () => {
    const first = steps.find(x => x.after.screen === 'week' && x.before.screen === 'quarter')!;
    expect(weekScene(first.before, first.after, content)!.html).toContain(content.career.quarters[content.weeks[first.after.week].quarter]);
  });

  it('show the quarter’s results before the review: grade, rank, task and the house', () => {
    const into = steps.filter(x => x.after.screen === 'quarter');
    expect(into.length).toBe(3);
    for (const { a, before, after } of into) {
      const q = after.lastQuarter!;
      const sc = sceneFor(a, before, after, content)!;
      expect(sc.cls).toBe('sc-quarter');
      expect(sc.html).toContain(content.career.grades[q.grade].title);
      expect(sc.html).toContain(content.career.ranks[q.rankAfter].label);
      if (q.task) expect(sc.html).toContain(content.tasks.find(t => t.id === q.task!.id)!.title);
      for (const k of ['mari', 'jozsi', 'pityu'] as const) expect(sc.html).toContain(after.people[k].given.b);
      noPlaceholders(sc.html);
      expect(sc.sounds.map(x => x.cue)).toEqual(['stamp']);
    }
    // Leaving the review for the next quarter is a new week, not the results again.
    const out = steps.find(x => x.before.screen === 'quarter')!;
    expect(quarterScene(out.before, out.after, content)).toBeNull();
  });

  it('open a new game with the captain stamping the file with the code name', () => {
    const s = newGame(content, balance, mulberry32(8));
    const sc = introScene(s, content);
    expect(sc.html).toContain(s.code);
    expect(sc.html).toContain(s.recruit.recruitedOn.slice(0, 4));
    expect(sc.html).toContain(s.captain.name);
    noPlaceholders(sc.html);
    const times = sc.sounds.map(x => x.at);
    expect([...times].sort((x, y) => x - y)).toEqual(times);
    expect(sc.sounds[sc.sounds.length - 1].cue).toBe('stamp');
  });

  it('stay out of the way: nothing for other actions, no calendar with reduced motion, everything at once for the rest', () => {
    const { before, after } = steps.find(x => x.after.screen === 'week')!;
    expect(sceneFor({ type: 'submit' }, before, after, content)).toBeNull();
    expect(weekScene(before, after, content, true)).toBeNull();
    const q = steps.find(x => x.after.screen === 'quarter')!;
    const still = quarterScene(q.before, q.after, content, true)!;
    expect([...still.html.matchAll(/--at:(\d+)ms/g)].map(m => Number(m[1])).every(n => n <= 200)).toBe(true);
    expect(still.sounds).toEqual([]);
    expect(introScene(after, content, true).sounds).toEqual([]);
  });
});
