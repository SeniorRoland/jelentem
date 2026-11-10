import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { weekScene } from '../ui/transitions';
import { endQuarter, expectFor } from './career';
import { endingKey } from './rules';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import type { GameState } from './types';

const r = mulberry32(6);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
const q = balance.quarter;
/** A game at the last week of the first quarter, with the given rank and meters. */
function atReview(rank: number, E: number, H = 80, L = 90): GameState {
  const s = d(newGame(content, balance, mulberry32(6)), { type: 'start' });
  s.week = 2;
  s.weekObs[2] = s.weekObs[0];
  s.rank = rank;
  s.meters = { E, H, L };
  return s;
}
const review = (s: GameState) => endQuarter(s, content, balance);

describe('exclusion from the network', () => {
  it('comes after hiányos quarters in a row on the passive rank, not after one', () => {
    const s = atReview(0, q.demoteE - 10);
    expect(review(s).excluded).toBe(balance.exclusion.streak <= 1);
    s.meters.E = q.demoteE - 10;
    const second = review(s);
    expect(second.excluded).toBe(true);
    expect(s.excluded).toBe(true);
    expect(endingKey(s, balance)).toBe('kizarva');
  });

  it('starts counting again after a quarter that was not hiányos, or not on the passive rank', () => {
    const s = atReview(0, q.demoteE - 10);
    review(s);
    s.meters.E = (q.demoteE + q.promoteE) / 2;
    review(s);
    s.meters.E = q.demoteE - 10;
    expect(review(s).excluded).toBe(false);
    const t = atReview(1, q.demoteE - 10);
    expect(review(t).excluded).toBe(false); // demoted into the passive rank: that does not count yet
  });

  it('closes the file at the review: the button says so, and the next step is the ending', () => {
    const s = atReview(0, q.demoteE - 10);
    s.passiveStreak = balance.exclusion.streak - 1;
    s.lastQuarter = review(s);
    s.screen = 'quarter';
    const html = renderScreen(s, content, balance, { dev: false });
    expect(html).toContain(content.career.excluded.label);
    expect(html).toContain(content.career.excluded.button);
    const end = d(s, { type: 'next' });
    expect(end.screen).toBe('ending');
    expect(renderScreen(end, content, balance, { dev: false })).toContain(content.endings.kizarva.title);
  });
});

describe('rewards on promotion', () => {
  /** The meters after a kiváló review from `rank`, with and without the rewards. */
  const promote = (rank: number) => {
    const s = atReview(rank, 90);
    const res = review(s);
    const plain = atReview(rank, 90);
    endQuarter(plain, content, { ...balance, rewards: {} });
    return { s, res, plain };
  };

  it('pay the reliable informant in forints and cigarettes, and the conscience pays for it', () => {
    const { s, res, plain } = promote(1);
    expect(res.reward).toBe(2);
    const rw = balance.rewards['2'];
    expect(s.meters.E).toBe(Math.min(100, plain.meters.E + (rw.E ?? 0)));
    expect(s.meters.L).toBe(Math.max(0, plain.meters.L + (rw.L ?? 0)));
    expect(renderScreen({ ...s, lastQuarter: res, screen: 'quarter' }, content, balance, { dev: false })).toContain(content.career.ranks[2].reward!);
  });

  it('give the candidate resident trust, at the conscience’s expense', () => {
    const { s, res, plain } = promote(3);
    expect(res.reward).toBe(4);
    expect(s.meters.H).toBe(Math.min(100, plain.meters.H + (balance.rewards['4'].H ?? 0)));
    expect(s.meters.L).toBe(Math.max(0, plain.meters.L + (balance.rewards['4'].L ?? 0)));
  });

  it('bring nothing when the rank does not rise', () => {
    const s = atReview(2, (q.demoteE + q.promoteE) / 2);
    expect(review(s).reward).toBeNull();
  });
});

describe('the SZOT stay', () => {
  /** Promoted to the featured rank at the first review, then on to the next quarter. */
  function afterHoliday() {
    const s = atReview(2, 90);
    s.lastQuarter = review(s);
    s.screen = 'quarter';
    return { before: s, after: d(s, { type: 'next' }) };
  }

  it('skips the next quarter’s first week: no report, no event, nothing in the house', () => {
    const { before, after } = afterHoliday();
    expect(before.holiday).toBe(3);
    expect(after.week).toBe(4);
    expect(after.weekObs[3]).toEqual([]);
    expect(after.events[3]).toBeNull();
    expect(after.screen).toBe('week');
  });

  it('still hands out the quarter’s task, on the first week played', () => {
    const { after } = afterHoliday();
    expect(after.task).not.toBeNull();
  });

  it('makes the rest of that quarter expect more, and only that quarter', () => {
    const { after } = afterHoliday();
    const rested = expectFor(after, balance, content);
    const plain = expectFor({ ...after, holidayQuarter: null }, balance, content);
    expect(rested - plain).toBe(balance.holiday.expect);
    const later = { ...after, week: 6 };
    expect(expectFor(later, balance, content)).toBe(expectFor({ ...later, holidayQuarter: null }, balance, content));
  });

  it('sends a postcard instead of the calendar line, even with reduced motion', () => {
    const { before, after } = afterHoliday();
    for (const reduced of [false, true]) {
      const sc = weekScene(before, after, content, reduced)!;
      expect(sc.html).toContain(content.transitions.holiday.title);
      expect(sc.html).toContain(content.career.quarters[1]);
    }
  });
});
