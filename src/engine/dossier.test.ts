import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { fileName } from '../ui/dossier';
import { dossierText, makeDossier, memorable } from './dossier';
import { endingKey } from './rules';
import { gentle, playGame, ruthless } from './test-utils';

const finalOf = (seed: number, strat = ruthless) => { const g = playGame(seed, strat); return g[g.length - 1]; };

describe('the end-of-game file', () => {
  it('keeps every reported sentence of the game in the log', () => {
    const g = playGame(4, ruthless);
    const end = g[g.length - 1];
    const fromResponses = g.filter(s => s.screen === 'response').reduce((n, s) => n + s.last!.sents.length, 0);
    expect(end.log.length).toBe(fromResponses);
  });

  it('picks the most memorable sentence, filled with this game’s names', () => {
    const s = finalOf(5);
    const d = makeDossier(s, content, balance);
    const top = Math.max(...s.log.map(memorable));
    expect(d.best).not.toBeNull();
    expect(memorable(s.log.find(x => x.week + 1 === d.best!.week && memorable(x) === top)!)).toBe(top);
    expect(JSON.stringify(d)).not.toMatch(/\{[a-z.]+\}/);
  });

  it('names the residents the reports harmed, and nobody after a gentle game', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const harsh = finalOf(seed);
      expect(makeDossier(harsh, content, balance).harmed).toHaveLength(harsh.cons.length);
      const kind = finalOf(seed, gentle);
      if (!kind.cons.length) expect(makeDossier(kind, content, balance).harmed).toEqual([]);
    }
  });

  it('says the verdict, the rank and the counts', () => {
    const s = finalOf(6);
    const d = makeDossier(s, content, balance);
    expect(d.ending).toBe(content.endings[endingKey(s, balance)].title.replace('{szazados}', s.captain.name));
    expect(d.rank).toBe(content.career.ranks[s.rank].label);
    expect(d.sentences).toBe(s.log.length);
    expect(d.reportsOnYou).toBe(s.reportsOnYou);
  });

  it('reads as plain text for sharing, with the link only when there is one', () => {
    const d = makeDossier(finalOf(7), content, balance);
    const text = dossierText(d, content);
    expect(text).toContain(d.code);
    expect(text).toContain(d.ending);
    expect(text).not.toContain('http');
    expect(dossierText(d, content, 'https://example.org/jelentem/')).toMatch(/https:\/\/example\.org\/jelentem\/$/);
  });

  it('gets a safe file name from the code name', () => {
    expect(fileName('akta', 'Kockás Abrosz')).toBe('akta-kockas-abrosz.png');
    expect(fileName('akta', 'Ősz Tűzoltó!')).toBe('akta-osz-tuzolto.png');
  });
});
