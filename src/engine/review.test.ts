import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { weekObs } from './observations';
import { excuseOf, scoreReview } from './review';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import type { GameState } from './types';

const TOP = balance.ranks.length - 1;
const r = mulberry32(12);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);

/** A game in the last quarter's first week, on the given rank, the week freshly started. */
function lastQuarter(rank: number, seed = 12): GameState {
  let s = d(newGame(content, balance, mulberry32(seed)), { type: 'start' });
  s.week = 8;
  s.rank = rank;
  s.screen = 'quarter';
  s.lastQuarter = { quarter: 2, grade: 'kivalo', task: null, calmed: null, reward: null, excluded: false, rankBefore: rank, rankAfter: rank, before: s.meters, after: s.meters };
  s = d(s, { type: 'next' });
  return s;
}

describe('the candidate resident’s review', () => {
  it('brings another informant’s report on the top rank only, with sentences the player never sees', () => {
    expect(lastQuarter(TOP - 1).review).toBeNull();
    const s = lastQuarter(TOP);
    expect(s.peer).toBeTruthy();
    expect(s.peer).not.toBe(s.code);
    const rv = s.review!;
    expect(rv.items).toHaveLength(balance.review.sentences);
    expect(rv.excuses).toHaveLength(balance.review.excuses);
    const own = weekObs(s, content).map(o => o.id);
    for (const x of rv.items) {
      expect(own).not.toContain(x.o);
      expect(s.dealt).not.toContain(x.i);
      expect(['mid', 'wild']).toContain(content.ints.find(i => i.id === x.i)!.tier);
    }
    expect(new Set(rv.items.map(x => content.obs.find(o => o.id === x.o)!.who)).size).toBe(rv.items.length);
  });

  it('never deals the same observation again, to the informant or to the player', () => {
    let s = lastQuarter(TOP);
    const first = s.review!.items.map(x => x.o);
    s = d(d(s, { type: 'submit' }), { type: 'next' });
    expect(s.week).toBe(10);
    for (const id of first) {
      expect(weekObs(s, content).map(o => o.id)).not.toContain(id);
      expect(s.review!.items.map(x => x.o)).not.toContain(id);
    }
  });

  it('gives the week’s justifications to the struck sentences in order, and none to the rest', () => {
    let s = lastQuarter(TOP);
    s = d(d(d(s, { type: 'strike', idx: 2 }), { type: 'strike', idx: 0 }), { type: 'strike', idx: 1 });
    const rv = s.review!;
    expect(excuseOf(rv, 0)).toBe(rv.excuses[0]);
    expect(excuseOf(rv, 1)).toBe(rv.excuses[1]);
    expect(excuseOf(rv, 2)).toBeNull();
    s = d(s, { type: 'strike', idx: 0 });
    expect(s.review!.struck).toEqual([false, true, true]);
    expect(excuseOf(s.review!, 2)).toBe(rv.excuses[1]);
  });

  it('lets kept sentences harm the residents and the conscience, struck ones only the credibility', () => {
    const s = lastQuarter(TOP);
    const kept = scoreReview(s.review!, content, balance);
    const harm = kept.sents.reduce((n, x) => n + x.harm, 0);
    expect(kept.guilt).toBeCloseTo(harm * balance.review.keptHarm);
    expect(kept.hih).toBe(0);
    const all = { ...s.review!, struck: s.review!.items.map(() => true) };
    const struck = scoreReview(all, content, balance);
    expect(struck.guilt).toBe(0);
    expect(struck.harmBy).toEqual({});
    const n = all.items.length, ex = Math.min(n, all.excuses.length);
    expect(struck.hih).toBe(-(ex * balance.review.excused + (n - ex) * balance.review.unexcused));
  });

  it('counts in the week: a kept harmful report weighs on the residents, a struck one does not', () => {
    const s = lastQuarter(TOP);
    const harmBefore = { ...s.harmBy };
    const kept = d(s, { type: 'submit' });
    const struck = d([0, 1, 2].reduce((x, idx) => d(x, { type: 'strike', idx }), s), { type: 'submit' });
    const total = (x: GameState) => Object.values(x.harmBy).reduce((a, b) => a + b, 0);
    expect(total(struck)).toBe(Object.values(harmBefore).reduce((a, b) => a + b, 0));
    expect(total(kept)).toBeGreaterThanOrEqual(total(struck));
    expect(struck.meters.H).toBeLessThan(kept.meters.H);
    expect(kept.last!.review!.sents.every(x => !x.struck)).toBe(true);
  });

  it('shows on the sheet, and on the reply with the captain’s question for an unjustified strike', () => {
    let s = lastQuarter(TOP);
    const html = renderScreen(s, content, balance, { dev: false });
    expect(html).toContain(content.review.title);
    expect(html).toContain(s.peer!);
    expect(html).not.toMatch(/\{[a-z.]+\}/);
    s = [0, 1, 2].reduce((x, idx) => d(x, { type: 'strike', idx }), s);
    const reply = renderScreen(d(s, { type: 'submit' }), content, balance, { dev: false });
    expect(reply).toContain(content.review.noExcuse);
    expect(reply).toContain(s.review!.excuses[0]);
  });
});
