import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { validateContent } from '../content/validate';
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
  const paprika = content.weeks[0].obs[0];
  const cia = content.ints.find(x => x.id === 'x1')!;
  it('punishes an absurd spin on a boring observation', () => {
    expect(scoreSentence(paprika, cia, balance).hih).toBe(cia.hih - balance.absurd.penalty);
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
    s = run(s, [{ type: 'toggleObs', id: 'w1c' }, { type: 'toggleInt', id: 'x2' }, { type: 'submit' }], r);
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
    s = run(s, [{ type: 'toggleObs', id: 'w1b' }, { type: 'submit' }, { type: 'next' }], r);
    s = run(s, [{ type: 'toggleObs', id: 'w2b' }, { type: 'submit' }], r);
    expect(s.last?.sents[0].note).toMatch(/Trabantot szereli/);
  });

  it('dispatch never mutates the previous state', () => {
    const r = mulberry32(5);
    const s0 = started(r);
    const snapshot = JSON.stringify(s0);
    dispatch(s0, { type: 'toggleObs', id: 'w1a' }, content, balance, r);
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});
