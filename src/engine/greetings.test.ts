import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { greetingFor, moodOf } from './greetings';
import { mulberry32 } from './rng';
import { dispatch, newGame } from './state';
import { gentle, playGame } from './test-utils';
import type { GameState } from './types';

const started = (): GameState => {
  const r = mulberry32(4);
  return dispatch(newGame(content, balance, r), { type: 'start' }, content, balance, r);
};

describe('greetings on the stairs', () => {
  it('stay silent in the first week, then meet each resident in turn', () => {
    const s = started();
    expect(greetingFor(s, content)).toBeNull();
    const who = [1, 2, 3, 4].map(w => greetingFor({ ...s, week: w }, content)!.who);
    expect(new Set(who.slice(0, 3)).size).toBe(3);
    expect(who[3]).toBe(who[0]);
  });

  it('follow what happened to the resident: betrayal first, then trouble, trust, suspicion', () => {
    const s = started();
    expect(moodOf(s, 'mari')).toBe('nyugodt');
    expect(moodOf({ ...s, harmBy: { ...s.harmBy, mari: 1 } }, 'mari')).toBe('gyanus');
    expect(moodOf({ ...s, bonds: ['mari'] }, 'mari')).toBe('bonded');
    expect(moodOf({ ...s, bonds: ['mari'], cons: ['mari'], harmBy: { ...s.harmBy, mari: 5 } }, 'mari')).toBe('bajban');
    expect(moodOf({ ...s, betrayed: ['mari'], cons: ['mari'] }, 'mari')).toBe('betrayed');
  });

  it('show on every weekly sheet after the first, names filled in', () => {
    for (const s of playGame(2, gentle)) {
      if (s.screen !== 'week') continue;
      const html = renderScreen(s, content, balance, { dev: false });
      expect(html.includes(content.greetings.label)).toBe(s.week >= 1);
      expect(html).not.toMatch(/\{[a-z.]+\}/);
    }
  });
});
