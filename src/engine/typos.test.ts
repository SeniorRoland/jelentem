import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { mulberry32 } from './rng';
import { gentle, playGame } from './test-utils';
import { makeTypo, typoChance } from './typos';

describe('typing errors', () => {
  it('swap two different neighbouring letters inside one long word, never in a placeholder', () => {
    const r = mulberry32(7);
    const text = '{mari.b} a postaládáknál hosszan nézelődött, ami gyanús.';
    for (let i = 0; i < 200; i++) {
      const t = makeTypo(text, r)!;
      expect(text.slice(t.at, t.at + t.from.length)).toBe(t.from);
      expect(t.from.length).toBeGreaterThanOrEqual(5);
      expect(t.to).not.toBe(t.from);
      expect([...t.to].sort().join('')).toBe([...t.from].sort().join(''));
      expect(t.to[0]).toBe(t.from[0]);
      expect(t.to.at(-1)).toBe(t.from.at(-1));
      expect(text.slice(0, t.at).match(/\{[^}]*$/)).toBeNull();
    }
    expect(makeTypo('{mari.b} ült.', r)).toBeNull();
    expect(makeTypo('Aaaaa ott.', r)).toBeNull();
  });

  it('come more often with a troubled conscience, and never all the time', () => {
    const { base, nervous } = balance.typos;
    expect(typoChance(100, base, nervous)).toBeCloseTo(base);
    expect(typoChance(0, base, nervous)).toBeCloseTo(base + nervous);
    expect(typoChance(40, base, nervous)).toBeGreaterThan(typoChance(80, base, nervous));
    expect(base + nervous).toBeLessThanOrEqual(0.5);
  });

  it('cost a little satisfaction each, and show corrected on the returned report', () => {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      for (const s of playGame(seed, gentle)) {
        if (s.screen !== 'response' || !s.last?.typos) continue;
        const r = s.last;
        expect(r.typos).toBe(r.sents.filter(x => x.typo).length);
        const html = renderScreen(s, content, balance, { dev: false });
        const t = r.sents.find(x => x.typo)!.typo!;
        expect(html).toContain(`<s>${t.to}</s>`);
        expect(html).toContain(`>${t.from}</span>`);
        expect(content.notes.typo.some(n => html.includes(n))).toBe(true);
        expect(html).not.toMatch(/\{[a-z.]+\}/);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
