import { afterEach, describe, expect, it, vi } from 'vitest';
import { balance, content } from '../content';
import { endingKey } from '../engine/rules';
import { mulberry32 } from '../engine/rng';
import { dispatch, newGame, type Action } from '../engine/state';
import { gentle, playGame } from '../engine/test-utils';
import { eventsFor, setTracking, track } from './track';

describe('anonymous counting', () => {
  afterEach(() => { setTracking(true); vi.unstubAllGlobals(); });

  it('counts the start, every new quarter and the ending, once each, along a whole game', () => {
    const r = mulberry32(3);
    const intro = newGame(content, balance, r);
    expect(eventsFor({ type: 'start' }, intro, dispatch(intro, { type: 'start' }, content, balance, r), content, balance)).toEqual(['jatek-indul']);
    const game = playGame(3, gentle);
    const seen: string[] = [];
    for (let i = 1; i < game.length; i++) seen.push(...eventsFor({ type: 'next' } as Action, game[i - 1], game[i], content, balance));
    const end = game[game.length - 1];
    const quarters = seen.filter(x => x.startsWith('negyedev-'));
    expect(quarters).toEqual([...new Set(quarters)]);
    expect(quarters.every(x => /^negyedev-[234]$/.test(x))).toBe(true);
    expect(seen.filter(x => x.startsWith('vege-'))).toEqual([`vege-${endingKey(end, balance)}`]);
  });

  it('sends events to GoatCounter when it is there, and stays silent when it is not or is switched off', () => {
    const count = vi.fn();
    vi.stubGlobal('window', { goatcounter: { count } });
    track('sugo');
    expect(count).toHaveBeenCalledWith({ path: 'sugo', event: true });
    setTracking(false);
    track('sugo');
    expect(count).toHaveBeenCalledTimes(1);
    setTracking(true);
    vi.stubGlobal('window', {});
    expect(() => track('sugo')).not.toThrow();
    vi.stubGlobal('window', { goatcounter: { count: () => { throw new Error('blocked'); } } });
    expect(() => track('sugo')).not.toThrow();
  });
});
