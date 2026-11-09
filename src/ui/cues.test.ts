import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { mulberry32 } from '../engine/rng';
import { dispatch, newGame, type Action } from '../engine/state';
import type { GameState } from '../engine/types';
import { cuesFor, STAMP_LANDS } from './cues';

const r = mulberry32(3);
const step = (s: GameState, a: Action) => { const after = dispatch(s, a, content, balance, r); return { after, cues: cuesFor(a, s, after).map(x => x.cue) }; };

describe('sound cues', () => {
  const week = dispatch(newGame(content, balance, mulberry32(3)), { type: 'start' }, content, balance, r);
  const o = week.weekObs[0][0];

  it('type when a card goes in, ring the bell and start a new line when a sentence is complete, and tap one key when a card comes out', () => {
    const put = step(week, { type: 'toggleObs', id: o });
    expect(put.cues).toEqual(['type']);
    const int = step(put.after, { type: 'toggleInt', id: put.after.dealt[0] });
    expect(int.cues).toEqual(['line']);
    expect(step(int.after, { type: 'toggleObs', id: o }).cues).toEqual(['key']);
    expect(step(int.after, { type: 'unplace', slot: 0, part: 'i' }).cues).toEqual(['key']);
  });

  it('stay silent when nothing changes, such as a full report or an action from another screen', () => {
    let s = week;
    for (const id of week.weekObs[0]) s = dispatch(s, { type: 'toggleObs', id }, content, balance, r);
    const extra = week.weekObs[0].find(id => !s.slots.some(sl => sl.o === id))!;
    expect(step(s, { type: 'toggleObs', id: extra }).cues).toEqual([]);
    expect(step(week, { type: 'next' }).cues).toEqual([]);
  });

  it('pull the sheet out on submitting, and stamp when the reply lands', () => {
    const sent = dispatch(week, { type: 'submit' }, content, balance, r);
    const timed = cuesFor({ type: 'submit' }, week, sent);
    expect(timed).toEqual([{ cue: 'page', at: 0 }, { cue: 'stamp', at: STAMP_LANDS }]);
  });

  it('turn a page between sheets, and stamp the quarterly review too', () => {
    let s = week;
    const heard: string[][] = [];
    // Write real reports (empty ones would end the game before the review).
    for (let guard = 0; s.screen !== 'quarter' && guard < 50; guard++) {
      if (s.screen === 'ending') throw new Error('a játék a negyedév előtt véget ért');
      if (s.screen === 'week') {
        for (const id of s.weekObs[s.week].slice(0, s.slots.length)) s = dispatch(s, { type: 'toggleObs', id }, content, balance, r);
        for (const id of s.dealt) s = dispatch(s, { type: 'toggleInt', id }, content, balance, r);
      }
      const x = step(s, s.screen === 'week' ? { type: 'submit' } : { type: 'next' });
      heard.push(x.cues);
      s = x.after;
    }
    expect(s.screen).toBe('quarter');
    expect(heard[1]).toEqual(['page']);
    expect(heard[heard.length - 1]).toEqual(['page', 'stamp']);
  });
});
