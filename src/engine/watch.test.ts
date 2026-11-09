import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { endQuarter } from './career';
import { weekObs } from './observations';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import { gentle, playGame, randomPlay, ruthless } from './test-utils';
import type { GameState } from './types';

const r = mulberry32(11);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
const started = (): GameState => d(newGame(content, balance, mulberry32(11)), { type: 'start' });
const selfOf = (s: GameState) => weekObs(s, content).find(o => o.self);

/** A week-1 state with the caretaker watching and this week's self-observation in hand. */
function watchedWeek(): GameState {
  const s = started();
  s.watched = true;
  s.weekObs[0] = [...s.weekObs[0], content.obs.find(o => o.self)!.id];
  return s;
}

describe('the caretaker’s counter-reports', () => {
  it('start when credibility falls below the threshold after a report', () => {
    let s = started();
    s.meters.H = balance.watch.hBelow;
    const wild = content.ints.find(x => x.tier === 'wild')!;
    const o = weekObs(s, content)[0];
    s.dealt = [wild.id];
    s = d(d(d(s, { type: 'toggleObs', id: o.id }), { type: 'toggleInt', id: wild.id }), { type: 'submit' });
    expect(s.watched).toBe(true);
    expect(s.last!.watch.started).toBe(true);
    expect(s.reportsOnYou).toBe(1);
  });

  it('bring one observation about the player each week while watching, and none otherwise', () => {
    const games = Array.from({ length: 120 }, (_, i) => playGame(i + 1, [randomPlay, ruthless, gentle][i % 3]));
    let seen = 0;
    for (const g of games) for (const s of g) {
      if (s.screen !== 'week') continue;
      const self = weekObs(s, content).filter(o => o.self);
      expect(self.length).toBe(s.watched ? 1 : 0);
      seen += self.length;
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('reward writing about yourself and punish leaving it to the caretaker', () => {
    const honest = d(d(watchedWeek(), { type: 'toggleObs', id: selfOf(watchedWeek())!.id }), { type: 'submit' });
    const hidden = d(watchedWeek(), { type: 'submit' });
    expect(honest.last!.watch).toMatchObject({ honest: true, hidden: null });
    expect(hidden.last!.watch.hidden).toBe(selfOf(watchedWeek())!.text);
    expect(hidden.reportsOnYou).toBe(1);
    // Honest: plain-fact credibility plus the honesty bonus; hidden: an empty report minus the penalty.
    expect(honest.meters.H).toBe(Math.min(100, balance.start.H + (balance.plainFact.hih + balance.watch.honest) * balance.weight.H));
    expect(hidden.meters.H).toBe(balance.start.H - balance.watch.hidden * balance.weight.H);
  });

  it('stop at a review once the player is credible again', () => {
    for (const [H, calmed] of [[balance.watch.calmAt, true], [balance.watch.hBelow - 20, false]] as const) {
      const s = started();
      s.week = 2;
      s.watched = true;
      s.meters = { E: 50, H: H - balance.quarter.healH, L: 80 };
      const q = endQuarter(s, content, balance);
      expect(q.calmed).toBe(calmed);
      expect(s.watched).toBe(!calmed);
    }
  });

  it('show up on the screens and in the epilogue', () => {
    const hidden = d(watchedWeek(), { type: 'submit' });
    const html = renderScreen(hidden, content, balance, { dev: false });
    expect(html).toContain(content.notes.watch.hidden.split('{obs}')[0]);
    expect(html).not.toMatch(/\{(obs|n)\}/);
    const end = { ...hidden, screen: 'ending' as const };
    expect(renderScreen(end, content, balance, { dev: false })).toContain('1 találat');
  });
});
