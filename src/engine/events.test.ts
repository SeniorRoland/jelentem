import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { expectFor } from './career';
import { applyEvent, eventFits } from './events';
import { fillNames, nameVars } from './names';
import { obsById, weekObs } from './observations';
import { mulberry32 } from './rng';
import { deal, pickNote, scoreSentence } from './rules';
import { dispatch, newGame, type Action } from './state';
import { gentle, playGame, randomPlay, ruthless } from './test-utils';
import type { GameState } from './types';

const r = mulberry32(5);
const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
const started = (): GameState => d(newGame(content, balance, mulberry32(5)), { type: 'start' });
const ev = (id: string) => content.events.list.find(e => e.id === id)!;

/** A week-1 state where the given event happened, with its observations and cards in hand. */
function withEvent(id: string): GameState {
  const s = started();
  s.events[0] = id;
  applyEvent(s, content);
  s.weekObs[0] = [...s.weekObs[0], ...(ev(id).obs ?? [])];
  s.dealt = deal(s, content, balance, r);
  return s;
}
const report = (s: GameState, ...parts: [string, string | null][]) => {
  for (const [o, i] of parts) { s = d(s, { type: 'toggleObs', id: o }); if (i) s = d(s, { type: 'toggleInt', id: i }); }
  return d(s, { type: 'submit' });
};

describe('house events', () => {
  const games = Array.from({ length: 150 }, (_, i) => playGame(i + 1, [randomPlay, ruthless, gentle][i % 3]));
  const finals = games.map(g => g[g.length - 1]);

  it('start from the second week, happen in many games, and never twice in one game', () => {
    let happened = 0;
    for (const s of finals) {
      expect(s.events[0] ?? null).toBeNull();
      const ids = s.events.filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
      happened += ids.length;
    }
    const weeks = finals.reduce((n, s) => n + s.events.length - 1, 0);
    expect(happened / weeks).toBeGreaterThan(balance.events.chance - 0.15);
    expect(happened / weeks).toBeLessThan(balance.events.chance + 0.15);
  });

  it('only bring a kindness from a resident the reports never touched', () => {
    for (const g of games) for (const s of g) {
      if (s.screen !== 'week') continue;
      const e = s.events[s.week] ? ev(s.events[s.week]!) : null;
      if (e?.kind !== 'kind') continue;
      // The kindness happened at the start of this week, before this week's report.
      expect(s.harmBy[e.who!]).toBe(0);
      expect(s.bonds).toContain(e.who);
    }
  });

  it('change what the captain expects that week', () => {
    const s = started();
    const base = expectFor(s, balance, content);
    s.events[0] = 'h_tanacs';
    expect(expectFor(s, balance, content)).toBe(base + ev('h_tanacs').expect!);
  });
});

describe('a resident’s trust', () => {
  it('comes with a confidential observation and an alibi card each week', () => {
    const s = withEvent('k_mari_pogacsa');
    expect(s.bonds).toEqual(['mari']);
    expect(weekObs(s, content).map(o => o.id)).toContain('o_k_mari_pogacsa');
    const alibi = s.dealt.map(id => content.ints.find(x => x.id === id)!).filter(x => x.tier === 'alibi');
    expect(alibi.map(x => x.who)).toEqual(['mari']);
  });

  it('makes harm to that resident hurt twice as much, and ends there', () => {
    const conf = 'o_k_mari_pogacsa';
    const plain = report(withEvent('k_mari_pogacsa'), [conf, null]);
    const harm = scoreSentence(obsById(content, conf)!, null, balance).harm;
    expect(plain.meters.L).toBe(balance.start.L - harm * balance.weight.L * balance.events.guilt);
    expect(plain.bonds).toEqual([]);
    expect(plain.betrayed).toEqual(['mari']);
    expect(plain.last!.betrayed).toEqual(['mari']);
    // No kindness from her again.
    const again = structuredClone(plain);
    again.week = 1;
    expect(eventFits(ev('k_mari_befott'), again, content)).toBe(false);
  });

  it('lets the alibi card cover the resident’s everyday doings, but not secrets or someone else', () => {
    const s = withEvent('k_mari_pogacsa');
    const alibi = content.ints.find(x => x.id === s.dealt.find(id => id.startsWith('a_mari'))!)!;
    // Covers the moderately harmful fully; the worst still leaves a little.
    const harmful = content.obs.find(o => o.who === 'mari' && !o.event && o.art === 2)!;
    expect(scoreSentence(harmful, alibi, balance).harm).toBe(0);
    const worst = content.obs.find(o => o.who === 'mari' && !o.event && o.art >= 3)!;
    expect(scoreSentence(worst, alibi, balance).harm).toBeLessThan(worst.art);
    const kept = report(s, [weekObs(s, content).find(o => o.who === 'mari' && !o.event)!.id, alibi.id]);
    expect(kept.meters.L).toBe(balance.start.L);
    expect(kept.bonds).toEqual(['mari']);

    const other = weekObs(s, content).find(o => o.who === 'jozsi')!;
    const secret = obsById(content, 'o_k_mari_pogacsa')!;
    for (const o of [other, secret]) {
      expect(scoreSentence(o, alibi, balance).hih).toBe(-balance.events.misuse);
      expect(scoreSentence(o, alibi, balance).harm).toBe(o.art);
      expect(pickNote(o, alibi, [], content)).toBe(content.events.labels.misuse);
    }
  });

  it('shows on the screens: the event, the broken trust, and a kept one in the epilogue', () => {
    const s = withEvent('k_jozsi_szek');
    const view = { dev: false };
    expect(renderScreen(s, content, balance, view)).toContain(ev('k_jozsi_szek').title);
    const broken = report(s, ['o_k_jozsi_szek', null]);
    const said = (t: string) => fillNames(t, nameVars(s)).slice(0, 40);
    expect(renderScreen(broken, content, balance, view)).toContain(said(content.events.betrayed.jozsi!));
    const end = { ...s, screen: 'ending' as const };
    expect(renderScreen(end, content, balance, view)).toContain(said(content.events.kept.jozsi!));
    expect(renderScreen(end, content, balance, view)).not.toMatch(/\{\w+\}/);
  });
});
