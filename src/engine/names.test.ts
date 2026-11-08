import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { fillNames, makeNames } from './names';
import { weekObs } from './observations';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import type { GameState, ResidentId } from './types';

const ids = Object.keys(content.residents) as ResidentId[];
const games = Array.from({ length: 300 }, (_, i) => newGame(content, balance, mulberry32(i + 1)));

describe('resident names', () => {
  it('are drawn from each resident’s own, trait-based candidates', () => {
    for (const g of games) for (const id of ids)
      expect(content.residents[id].surnames).toContainEqual(g.names[id]);
  });

  it('never repeat among the residents, nor match the recruit', () => {
    for (const g of games) {
      const family = ids.map(id => g.names[id].name);
      expect(new Set(family).size).toBe(ids.length);
      expect(family).not.toContain(g.recruit.name.split(' ')[0]);
    }
  });

  it('vary from game to game', () => {
    for (const id of ids) expect(new Set(games.map(g => g.names[id].name)).size).toBeGreaterThan(1);
  });

  it('skip a name that is already taken', () => {
    const all = content.residents.mari.surnames.map(n => n.name);
    const keep = all[all.length - 1];
    const names = makeNames(content, mulberry32(9), all.filter(n => n !== keep));
    expect(names.mari.name).toBe(keep);
  });

  it('fill the placeholders of a text', () => {
    const names = games[0].names;
    expect(fillNames('{mari} Mária és {porgoly} néni, {ismeretlen}', names))
      .toBe(`${names.mari.name} Mária és ${names.porgoly.name} néni, {ismeretlen}`);
  });
});

describe('rendered screens', () => {
  it('contain no unfilled name placeholder', () => {
    const r = mulberry32(7);
    const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
    let s = newGame(content, balance, r);
    const seen: string[] = [renderScreen(s, content, balance, { dev: true })];
    s = d(s, { type: 'start' });
    while (s.screen !== 'ending') {
      const w = weekObs(s, content);
      s = d(s, { type: 'toggleObs', id: w[0].id });
      s = d(s, { type: 'toggleInt', id: s.dealt[0] });
      s = d(s, { type: 'toggleObs', id: w[2].id });
      seen.push(renderScreen(s, content, balance, { dev: true }));
      s = d(s, { type: 'submit' });
      seen.push(renderScreen(s, content, balance, { dev: true }));
      s = d(s, { type: 'next' });
    }
    seen.push(renderScreen(s, content, balance, { dev: true }));
    for (const html of seen) expect(html).not.toMatch(/\{[a-z]+\}/);
    expect(seen.join('')).toContain(`${s.names.mari.name} Mária`);
  });
});
