import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { FACE_URL } from '../ui/faces';
import { facesFor, fillNames, makeNames, nameVars } from './names';
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

  it('never repeat among the residents, nor match the recruit or the captain', () => {
    for (const g of games) {
      const family = ids.map(id => g.names[id].name);
      expect(new Set(family).size).toBe(ids.length);
      expect(family).not.toContain(g.recruit.name.split(' ')[0]);
      expect(family).not.toContain(g.captain.name);
    }
  });

  it('give the captain a generated name that hints at his job', () => {
    for (const g of games) expect(content.captain.surnames).toContainEqual(g.captain);
    expect(new Set(games.map(g => g.captain.name)).size).toBeGreaterThan(1);
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
    const g = games[0];
    const p = g.people.mari.given;
    expect(fillNames('{mari} {mari.n} ({mari.b}), {mari.nal}, {cim}, {lany} lány, {ismeretlen}, {mari.x}', nameVars(g)))
      .toBe(`${g.names.mari.name} ${p.n} (${p.b}), ${p.nal}, ${g.address}, ${g.girl.name} lány, {ismeretlen}, {mari.x}`);
  });
});

describe('residents as people', () => {
  it('get a given name of their own role, never repeated in the house, and it varies', () => {
    for (const g of games) {
      for (const id of ids) expect(content.residents[id].given).toContainEqual(g.people[id].given);
      expect(new Set(ids.map(id => g.people[id].given.n)).size).toBe(ids.length);
    }
    for (const id of ids) expect(new Set(games.map(g => g.people[id].given.n)).size).toBeGreaterThan(3);
  });

  it('get a portrait of the right sex and age, never shared, and the age comes from it', () => {
    for (const g of games) {
      const faces = [...ids.map(id => g.people[id].face), g.face];
      expect(new Set(faces).size).toBe(faces.length);
      for (const id of ids) {
        const f = content.faces.find(x => x.id === g.people[id].face)!;
        const r = content.residents[id];
        expect(f.sex).toBe(r.sex);
        expect(g.people[id].age).toBe(f.age);
        expect(f.age).toBeGreaterThanOrEqual(r.age[0]);
        expect(f.age).toBeLessThanOrEqual(r.age[1]);
      }
      // The recruit's photo: right sex, near the age the card gives.
      const own = content.faces.find(x => x.id === g.face)!;
      expect(own.sex).toBe(g.recruit.sex);
      expect(Math.abs(own.age - (1979 - g.recruit.birthYear))).toBeLessThanOrEqual(15);
    }
    for (const id of ids) expect(new Set(games.map(g => g.people[id].face)).size).toBe(facesFor(content, content.residents[id].sex, content.residents[id].age).length);
  });

  it('have every portrait on disk', () => {
    for (const f of content.faces) expect(FACE_URL[f.id], f.id).toBeTruthy();
  });

  it('live at a varied address, and the girl gets a name nobody else has', () => {
    expect(new Set(games.map(g => g.address)).size).toBeGreaterThan(20);
    for (const g of games) {
      expect(g.address).toMatch(/^[A-ZÁÉÍÓÖŐÚÜŰ].* \d+\.$/);
      expect([...ids.map(id => g.names[id].name), g.captain.name, g.recruit.name.split(' ')[0]]).not.toContain(g.girl.name);
    }
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
    for (const html of seen) expect(html).not.toMatch(/\{[a-z.]+\}/);
    expect(seen.join('')).toContain(`${s.names.mari.name} ${s.people.mari.given.n}`);
    expect(seen.join('')).toContain(s.address);
    expect(seen.join('')).toContain(`${s.captain.name[0]}. szds.`);
    expect(seen.join('')).not.toContain('Vágási');
  });
});
