import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { validateContent } from '../content/validate';
import { candidates, obsById, pickWeeks, weekObs } from './observations';
import { mulberry32 } from './rng';
import { endingKey, scoreSentence } from './rules';
import { dispatch, newGame, type Action } from './state';
import type { GameState, Rng } from './types';

const run = (s: GameState, actions: Action[], r: Rng) =>
  actions.reduce((acc, a) => dispatch(acc, a, content, balance, r), s);
const started = (r: Rng) => run(newGame(content, balance, r), [{ type: 'start' }], r);

describe('content', () => {
  it('is internally consistent', () => {
    expect(validateContent(content, balance)).toEqual([]);
  });
});

describe('scoreSentence', () => {
  const paprika = obsById(content, 'mari1a')!;
  const cia = content.ints.find(x => x.id === 'x1')!;
  it('punishes an absurd spin on a boring observation', () => {
    expect(scoreSentence(paprika, cia, balance).hih).toBe(cia.hih - balance.absurd.penalty);
  });
  it('a safe spin softens but never erases harm on a damaging observation', () => {
    const worst = content.obs.reduce((a, b) => (b.art > a.art ? b : a));
    for (const it of content.ints.filter(x => x.tier === 'safe')) {
      expect(scoreSentence(worst, it, balance).harm).toBeGreaterThan(0);
    }
  });
  it('treats a plain fact as credible', () => {
    expect(scoreSentence(paprika, null, balance).hih).toBe(balance.plainFact.hih);
  });
});

describe('game flow', () => {
  it('three empty reports end in behívatás', () => {
    const r = mulberry32(1);
    let s = started(r);
    for (let i = 0; i < 3 && s.screen !== 'ending'; i++) s = run(s, [{ type: 'submit' }, { type: 'next' }], r);
    expect(s.screen).toBe('ending');
    expect(endingKey(s, balance)).toBe('behivatas');
  });

  it('heavy harm on one resident triggers a consequence', () => {
    const r = mulberry32(2);
    let s = started(r);
    s.dealt = ['x2', 'x3', 's1', 's2', 'm1', 'm2'];
    const pityu = weekObs(s, content).find(o => o.who === 'pityu')!;
    s = run(s, [{ type: 'toggleObs', id: pityu.id }, { type: 'toggleInt', id: 'x2' }, { type: 'submit' }], r);
    expect(s.cons).toContain('pityu');
    expect(s.last?.newCons).toContain('pityu');
  });

  it('an interpretation cannot be placed before an observation', () => {
    const r = mulberry32(3);
    let s = started(r);
    s = run(s, [{ type: 'toggleInt', id: s.dealt[0] }], r);
    expect(s.hint).toBe('needObs');
    expect(s.slots.every(x => x.i === null)).toBe(true);
  });

  it('the repeat note fires when the Trabant is reported twice', () => {
    const r = mulberry32(4);
    let s = started(r);
    s.weekObs[0][1] = 'jozsi1a';
    s.weekObs[1][1] = 'jozsi2a';
    s = run(s, [{ type: 'toggleObs', id: 'jozsi1a' }, { type: 'submit' }, { type: 'next' }], r);
    s = run(s, [{ type: 'toggleObs', id: 'jozsi2a' }, { type: 'submit' }], r);
    expect(s.last?.sents[0].note).toMatch(/Már megint a Trabant/);
  });

  it('the repeat note does not fire for the first report of a tag', () => {
    const r = mulberry32(4);
    let s = started(r);
    s.weekObs[0][1] = 'jozsi1c';
    s.weekObs[1][1] = 'jozsi2a';
    s = run(s, [{ type: 'toggleObs', id: 'jozsi1c' }, { type: 'submit' }, { type: 'next' }], r);
    s = run(s, [{ type: 'toggleObs', id: 'jozsi2a' }, { type: 'submit' }], r);
    expect(s.last?.sents[0].note ?? '').not.toMatch(/Már megint/);
  });

  it('dispatch never mutates the previous state', () => {
    const r = mulberry32(5);
    const s0 = started(r);
    const snapshot = JSON.stringify(s0);
    dispatch(s0, { type: 'toggleObs', id: s0.weekObs[0][0] }, content, balance, r);
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});

describe('observation pool', () => {
  const picks = Array.from({ length: 300 }, (_, i) => pickWeeks(content, mulberry32(i + 1)));

  it('has at least 50 observations', () => {
    expect(content.obs.length).toBeGreaterThanOrEqual(50);
  });

  it('fills every slot of every week with a fitting observation of the week level', () => {
    for (const weeks of picks) content.weeks.forEach((w, wi) => {
      expect(weeks[wi]).toHaveLength(w.slots.length);
      w.slots.forEach((slot, si) => {
        const o = obsById(content, weeks[wi][si])!;
        expect(o.level).toBe(w.level);
        expect(slot).toContain(o.who);
      });
    });
  });

  it('never repeats an observation within a game', () => {
    for (const weeks of picks) expect(new Set(weeks.flat()).size).toBe(weeks.flat().length);
  });

  it('varies from game to game, and every observation can come up', () => {
    const seen = new Set(picks.flat(2));
    const reachable = content.obs.filter(o => content.weeks.some(w => w.slots.some(sl => candidates(content, w.level, sl).includes(o))));
    expect(seen.size).toBe(reachable.length);
    expect(reachable.length).toBe(content.obs.length);
  });
});

describe('interpretations', () => {
  it('has 30–50 cards', () => {
    expect(content.ints.length).toBeGreaterThanOrEqual(30);
    expect(content.ints.length).toBeLessThanOrEqual(50);
  });
});
