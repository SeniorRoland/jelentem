import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { renderScreen } from '../ui/render';
import { handoverScene, sceneFor } from '../ui/transitions';
import { mulberry32 } from './rng';
import { scoreSentence, tasteOf } from './rules';
import { newGame } from './state';
import { gentle, playGame } from './test-utils';
import type { GameState } from './types';

/** A whole game whose year has a handover, and one that keeps its captain. */
function games(): { withIt: GameState[]; without: GameState[] } {
  let withIt: GameState[] | null = null, without: GameState[] | null = null;
  for (let seed = 1; seed < 60 && !(withIt && without); seed++) {
    const g = playGame(seed, gentle);
    if (g[g.length - 1].week < 9) continue;
    if (g[0].handover) withIt ??= g; else without ??= g;
  }
  return { withIt: withIt!, without: without! };
}

describe('the handler’s replacement', () => {
  const { withIt, without } = games();

  it('is drawn at the start for about half of the years, with a new name and a taste', () => {
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const s = newGame(content, balance, mulberry32(seed));
      if (!s.handover) continue;
      n++;
      expect(s.handover.captain.name).not.toBe(s.captain.name);
      expect(['wild', 'dry']).toContain(s.handover.taste);
      expect(s.handover.week).toBeNull();
    }
    expect(n / 400).toBeGreaterThan(balance.handover.chance - 0.1);
    expect(n / 400).toBeLessThan(balance.handover.chance + 0.1);
  });

  it('takes over on the first played week of its quarter, and the old captain is remembered', () => {
    const first = withIt[0].captain;
    const h = withIt[0].handover!;
    const at = withIt.find(s => s.handover!.week !== null)!;
    expect(content.weeks[at.handover!.week!].quarter).toBe(h.quarter);
    expect(at.captain).toEqual(h.captain);
    expect(at.prevCaptain).toEqual(first);
    for (const s of withIt) if (s.week < at.handover!.week!) expect(s.captain).toEqual(first);
    for (const s of without) expect(s.prevCaptain).toBeNull();
  });

  it('changes what a sentence is worth by the new captain’s taste, never before he arrives', () => {
    const before = withIt.find(s => s.handover!.week === null)!;
    const after = withIt.find(s => s.handover!.week !== null)!;
    expect(tasteOf(before, balance)).toBeNull();
    const t = tasteOf(after, balance)!;
    const o = content.obs[0];
    const wild = content.ints.find(i => i.tier === 'wild')!;
    expect(scoreSentence(o, wild, balance, 1, t).izg - scoreSentence(o, wild, balance).izg).toBe(t.wild ?? 0);
    expect(scoreSentence(o, null, balance, 1, t).izg - scoreSentence(o, null, balance).izg).toBe(t.plain ?? 0);
  });

  it('is told in a scene once, and the quarterly review afterwards carries the new photo', () => {
    let scenes = 0;
    for (let i = 1; i < withIt.length; i++) {
      const sc = handoverScene(withIt[i - 1], withIt[i], content);
      if (!sc) continue;
      scenes++;
      expect(sc.html).toContain(withIt[i].prevCaptain!.name);
      expect(sc.html).toContain(withIt[i].captain.name);
      expect(sc.html).toContain(content.captain.handover.tastes[withIt[i].handover!.taste]);
      expect(sc.html).not.toMatch(/\{[a-z.]+\}/);
      expect(sceneFor({ type: 'next' }, withIt[i - 1], withIt[i], content)).toEqual(sc);
    }
    expect(scenes).toBe(1);
    const reviews = withIt.filter(s => s.screen === 'quarter');
    for (const s of reviews) {
      const html = renderScreen(s, content, balance, { dev: false });
      expect(html.includes('cpt-photo2')).toBe(s.prevCaptain !== null);
    }
    expect(reviews.some(s => s.prevCaptain)).toBe(true);
  });
});
