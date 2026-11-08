import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { fitsContent } from '../ui/save';
import { endQuarter, expectFor, gradeQuarter, residentStatus, slotsFor } from './career';
import { mulberry32 } from './rng';
import { dispatch, newGame } from './state';
import { playGame, randomPlay, type Strategy } from './test-utils';
import type { GameState } from './types';

const q = balance.quarter;
const fresh = (): GameState => newGame(content, balance, mulberry32(1));

describe('quarterly grade', () => {
  it('is „kiváló” only with a satisfied captain and good credibility', () => {
    expect(gradeQuarter({ E: q.promoteE, H: q.promoteH, L: 50 }, balance)).toBe('kivalo');
    expect(gradeQuarter({ E: q.promoteE, H: q.promoteH - 1, L: 50 }, balance)).toBe('megfelelo');
    expect(gradeQuarter({ E: q.demoteE - 1, H: 90, L: 90 }, balance)).toBe('hianyos');
  });
});

describe('endQuarter', () => {
  it('promotes, demotes and stays within the ranks', () => {
    const s = fresh();
    s.meters = { E: 90, H: 90, L: 90 };
    for (let i = 0; i < balance.ranks.length + 2; i++) { s.meters.E = 90; endQuarter(s, content, balance); }
    expect(s.rank).toBe(balance.ranks.length - 1);
    for (let i = 0; i < balance.ranks.length + 2; i++) { s.meters.E = 0; endQuarter(s, content, balance); }
    expect(s.rank).toBe(0);
  });

  it('pulls the captain back towards neutral and lets the conscience recover', () => {
    const s = fresh();
    s.meters = { E: 90, H: 40, L: 50 };
    const r = endQuarter(s, content, balance);
    expect(r.after.E).toBe(Math.round(90 + (balance.start.E - 90) * q.resetE));
    expect(r.after.H).toBe(40 + q.healH);
    expect(r.after.L).toBe(50 + q.healL);
  });

  it('a higher rank writes more and is expected to deliver more', () => {
    const s = fresh();
    const low = { slots: slotsFor(s, balance), exp: expectFor(s, balance) };
    s.rank = balance.ranks.length - 1;
    expect(slotsFor(s, balance)).toBeGreaterThan(low.slots);
    expect(expectFor(s, balance)).toBeGreaterThan(low.exp);
  });
});

describe('a year of reports', () => {
  const quarters = Math.max(...content.weeks.map(w => w.quarter)) + 1;
  const keepUp: Strategy = randomPlay;
  const games = Array.from({ length: 200 }, (_, i) => playGame(i + 1, keepUp));

  it('reviews every quarter except the last, which ends the game', () => {
    for (const g of games) {
      const end = g[g.length - 1];
      const reviews = g.filter(s => s.screen === 'quarter').length;
      if (end.week === content.weeks.length - 1) expect(reviews).toBe(quarters - 1);
      else expect(reviews).toBeLessThan(quarters);
    }
  });

  it('gives each report as many sentence slots as the rank allows', () => {
    for (const g of games) for (const s of g) if (s.screen === 'week') expect(s.slots).toHaveLength(slotsFor(s, balance));
  });

  it('starts the new quarter with the rank from the review', () => {
    for (const g of games) g.forEach((s, i) => {
      if (s.screen !== 'quarter') return;
      expect(s.rank).toBe(s.lastQuarter!.rankAfter);
      expect(g[i + 1].rank).toBe(s.rank);
    });
  });

  it('ignores actions that belong to another screen', () => {
    const s = fresh();
    expect(dispatch(s, { type: 'submit' }, content, balance, mulberry32(2))).toBe(s);
    expect(dispatch(s, { type: 'next' }, content, balance, mulberry32(2))).toBe(s);
  });
});

describe('resident status', () => {
  it('goes from calm to mentioned to in trouble', () => {
    const s = fresh();
    expect(residentStatus(s, 'pityu')).toBe('nyugodt');
    s.harmBy.pityu = 1;
    expect(residentStatus(s, 'pityu')).toBe('gyanus');
    s.cons.push('pityu');
    expect(residentStatus(s, 'pityu')).toBe('bajban');
  });
});

describe('saved games', () => {
  it('accepts a game in progress, after a JSON round trip', () => {
    const g = playGame(3);
    const mid = g.find(s => s.screen === 'week' && s.week > 3) ?? g[0];
    expect(fitsContent(JSON.parse(JSON.stringify(mid)), content, balance)).toBe(true);
  });

  it('rejects finished, broken or foreign data', () => {
    const g = playGame(4);
    expect(fitsContent(g[g.length - 1], content, balance)).toBe(false);
    expect(fitsContent({ ...g[1], weekObs: [['nincs-ilyen']] }, content, balance)).toBe(false);
    expect(fitsContent({ ...g[1], week: 99 }, content, balance)).toBe(false);
    expect(fitsContent(null, content, balance)).toBe(false);
    expect(fitsContent('szöveg', content, balance)).toBe(false);
  });
});
