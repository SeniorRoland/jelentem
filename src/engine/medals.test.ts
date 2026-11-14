import { beforeEach, describe, expect, it, vi } from 'vitest';
import { balance, content } from '../content';
import { awardMedals, drawerHtml, endingMedalsHtml, loadMedals } from '../ui/medals';
import { MEDAL_RULES, medalsFor, UI_MEDALS } from './medals';
import { endingKey } from './rules';
import { gentle, playGame } from './test-utils';
import type { EndingKey } from './types';

/** A localStorage stand-in for the tests. */
function stubStorage(): void {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } });
}

const FOR_ENDING: Record<EndingKey, string> = { best: 'legjobb', kivalo: 'kivalo', behivatas: 'behivatas', kizarva: 'kizarva', megfigyelt: 'megfigyelt' };

describe('medals', () => {
  beforeEach(() => { vi.unstubAllGlobals(); stubStorage(); });

  it('have a rule or a UI source for every one, and the ending’s medal for every finished game', () => {
    for (const m of content.medals.list) expect(!!MEDAL_RULES[m.id] || UI_MEDALS.includes(m.id)).toBe(true);
    for (let seed = 1; seed < 12; seed++) {
      const g = playGame(seed, gentle);
      const end = g[g.length - 1];
      expect(medalsFor(end, content, balance)).toContain(FOR_ENDING[endingKey(end, balance)]);
      // Only once the game is over.
      expect(medalsFor(g[1], content, balance)).toEqual([]);
    }
  });

  it('are kept across games: awarded once, new only the first time', () => {
    expect(loadMedals()).toEqual({});
    expect(awardMedals(['kivalo', 'balaton'], '1979-12-31')).toEqual(['kivalo', 'balaton']);
    expect(awardMedals(['kivalo', 'rajtakapva'], '1980-01-01')).toEqual(['rajtakapva']);
    expect(loadMedals()).toEqual({ kivalo: '1979-12-31', balaton: '1979-12-31', rajtakapva: '1980-01-01' });
  });

  it('survive storage that throws, and draw the drawer and the ending without placeholders', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } });
    expect(loadMedals()).toEqual({});
    expect(awardMedals(['kivalo'])).toEqual(['kivalo']);
    const have = { kivalo: '1979-12-31' };
    const drawer = drawerHtml(content, have);
    expect((drawer.match(/class="medal medal-locked"/g) ?? []).length).toBe(content.medals.list.length - 1);
    expect(drawer).toContain(content.medals.list.find(m => m.id === 'kivalo')!.title);
    expect(drawer).not.toMatch(/\{[a-z]+\}/);
    // A locked medal keeps its secret: only its hint shows.
    expect(drawer).not.toContain(content.medals.list.find(m => m.id === 'legjobb')!.title);
    expect(endingMedalsHtml(content, have, ['kivalo'], ['kivalo'])).toContain('medal-new');
    expect(endingMedalsHtml(content, have, [], [])).toContain(`1 / ${content.medals.list.length}`);
  });
});
