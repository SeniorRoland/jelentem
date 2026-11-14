import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { cuesFor } from '../ui/cues';
import { weekObs } from './observations';
import { mulberry32 } from './rng';
import { dispatch, latestOpen, newGame, type Action } from './state';
import type { GameState } from './types';

const r = mulberry32(21);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
const week = (): GameState => d(newGame(content, balance, mulberry32(21)), { type: 'start' });
const parts = (s: GameState) => s.slots.map(x => [x.o, x.i]);

describe('putting a report together', () => {
  it('gives a tapped interpretation to the observation put in last that has none', () => {
    let s = week();
    const [o1, o2] = weekObs(s, content);
    const [i1, i2] = s.dealt;
    // observation, observation, interpretation: the second sentence gets it, the first stays a bare fact.
    s = d(d(d(s, { type: 'toggleObs', id: o1.id }), { type: 'toggleObs', id: o2.id }), { type: 'toggleInt', id: i1 });
    expect(parts(s)).toEqual([[o1.id, null], [o2.id, i1]]);
    // The next one goes to the only open one left.
    s = d(s, { type: 'toggleInt', id: i2 });
    expect(parts(s)).toEqual([[o1.id, i2], [o2.id, i1]]);
    // observation, interpretation, observation: the first sentence gets it, as before.
    let t = week();
    t = d(d(d(t, { type: 'toggleObs', id: o1.id }), { type: 'toggleInt', id: i1 }), { type: 'toggleObs', id: o2.id });
    expect(parts(t)).toEqual([[o1.id, i1], [o2.id, null]]);
  });

  it('finds the latest open sentence, and none when all have their interpretation', () => {
    expect(latestOpen([{ o: 'a', i: null, t: 1 }, { o: 'b', i: null, t: 2 }])).toBe(1);
    expect(latestOpen([{ o: 'a', i: null, t: 3 }, { o: 'b', i: null, t: 2 }])).toBe(0);
    expect(latestOpen([{ o: 'a', i: 'x', t: 3 }, { o: null, i: null }])).toBe(-1);
    // Saves from before the order was kept: the first open one.
    expect(latestOpen([{ o: 'a', i: null }, { o: 'b', i: null }])).toBe(0);
  });

  it('puts a dragged part on the chosen sentence, moving it if it was elsewhere', () => {
    let s = week();
    const [o1, o2, o3] = weekObs(s, content);
    const [i1] = s.dealt;
    s = d(s, { type: 'placeObs', id: o1.id, slot: 1 });
    expect(parts(s)).toEqual([[null, null], [o1.id, null]]);
    // An interpretation needs an observation in that sentence.
    const refused = d(s, { type: 'placeInt', id: i1, slot: 0 });
    expect(parts(refused)).toEqual(parts(s));
    expect(refused.hint).toBe('needObs');
    s = d(s, { type: 'placeInt', id: i1, slot: 1 });
    expect(parts(s)).toEqual([[null, null], [o1.id, i1]]);
    s = d(s, { type: 'placeObs', id: o2.id, slot: 0 });
    s = d(s, { type: 'placeInt', id: i1, slot: 0 });
    expect(parts(s)).toEqual([[o2.id, i1], [o1.id, null]]);
    // Moving an observation empties the sentence it left; replacing keeps the interpretation there.
    s = d(s, { type: 'placeObs', id: o1.id, slot: 0 });
    expect(parts(s)).toEqual([[o1.id, i1], [null, null]]);
    s = d(s, { type: 'placeObs', id: o3.id, slot: 0 });
    expect(parts(s)).toEqual([[o3.id, i1], [null, null]]);
    // Nothing that is not on the table this week, and no sentence that is not there.
    expect(d(s, { type: 'placeObs', id: 'nincs-ilyen', slot: 1 })).toEqual(s);
    expect(d(s, { type: 'placeInt', id: 'nincs-ilyen', slot: 0 })).toEqual(s);
    expect(d(s, { type: 'placeObs', id: o2.id, slot: 9 })).toEqual(s);
  });

  it('sounds like tapping: typing for a part, the bell for a finished sentence', () => {
    const s = week();
    const [o1] = weekObs(s, content);
    const a: Action = { type: 'placeObs', id: o1.id, slot: 0 };
    const t = d(s, a);
    expect(cuesFor(a, s, t)).toEqual([{ cue: 'type', at: 0 }]);
    const b: Action = { type: 'placeInt', id: t.dealt[0], slot: 0 };
    expect(cuesFor(b, t, d(t, b))).toEqual([{ cue: 'line', at: 0 }]);
  });
});
