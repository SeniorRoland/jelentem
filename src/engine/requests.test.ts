import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { requestOf } from './requests';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import { gentle, playGame } from './test-utils';
import type { GameState } from './types';

const r = mulberry32(5);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);

/** A weekly sheet with a favour asked, from some game. */
function asked(): GameState {
  for (let seed = 1; seed < 80; seed++)
    for (const s of playGame(seed, gentle)) if (s.screen === 'week' && s.request) return s;
  throw new Error('no request');
}

describe('residents’ favours', () => {
  it('come from the given week, at most a few a year, each once, never from a betrayed resident', () => {
    for (let seed = 1; seed < 40; seed++) {
      const g = playGame(seed, gentle);
      const end = g[g.length - 1];
      expect(end.asked.length).toBeLessThanOrEqual(balance.requests.max);
      expect(new Set(end.asked.map(a => a.id)).size).toBe(end.asked.length);
      for (const s of g) if (s.screen === 'week' && s.request) {
        expect(s.week).toBeGreaterThanOrEqual(balance.requests.fromWeek);
        expect(s.betrayed).not.toContain(requestOf(s, content)!.who);
      }
    }
    expect(newGame(content, balance, mulberry32(1)).request).toBeNull();
  });

  it('take an answer that can be changed or taken back before the report goes in', () => {
    let s = asked();
    s = d(s, { type: 'answer', yes: true });
    expect(s.request!.answer).toBe(true);
    s = d(s, { type: 'answer', yes: false });
    expect(s.request!.answer).toBe(false);
    s = d(s, { type: 'answer', yes: false });
    expect(s.request!.answer).toBeNull();
  });

  it('make the resident close on a yes (the captain may hear of it), push them away on a no', () => {
    const s = asked();
    const who = requestOf(s, content)!.who;
    let found = false, quiet = false;
    for (let seed = 1; seed < 60 && !(found && quiet); seed++) {
      const g = mulberry32(seed);
      const y = dispatch(dispatch(s, { type: 'answer', yes: true }, content, balance, g), { type: 'submit' }, content, balance, g);
      expect(y.favored.includes(who) || y.betrayed.includes(who)).toBe(true);
      // A favour brings trust, not an alibi card: that comes only with a kindness.
      expect(y.bonds).toEqual(s.bonds);
      expect(y.last!.request!.yes).toBe(true);
      if (y.last!.request!.found) found = true; else quiet = true;
    }
    expect(found && quiet).toBe(true);
    const n = d({ ...s, bonds: [...s.bonds, who], favored: [...s.favored, who] }, { type: 'submit' });
    expect(n.bonds).not.toContain(who);
    expect(n.favored).not.toContain(who);
    expect(n.last!.request).toEqual({ id: s.request!.id, yes: false, found: false });
    expect(n.asked.at(-1)!.id).toBe(s.request!.id);
  });

  it('shows on the weekly sheet, and its outcome on the reply, names filled in', () => {
    const s = d(asked(), { type: 'answer', yes: true });
    const html = renderScreen(s, content, balance, { dev: false });
    expect(html).toContain(content.requests.title);
    expect(html).toContain(content.requests.chosenYes);
    expect(html).not.toMatch(/\{[a-z.]+\}/);
    const reply = d(s, { type: 'submit' });
    const rh = renderScreen(reply, content, balance, { dev: false });
    expect(rh).not.toMatch(/\{[a-z.]+\}/);
    expect(rh.includes(content.requests.found)).toBe(reply.last!.request!.found);
  });
});
