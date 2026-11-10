import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { mulberry32 } from '../engine/rng';
import { PEEK, planPeek } from './peek';

describe('the captain peeking in', () => {
  it('comes rarely, from any edge, away from the corners, after a while', () => {
    const r = mulberry32(4);
    const plans = Array.from({ length: 4000 }, () => planPeek(r));
    const visits = plans.filter(p => p !== null);
    expect(visits.length / plans.length).toBeGreaterThan(PEEK.chance - 0.03);
    expect(visits.length / plans.length).toBeLessThan(PEEK.chance + 0.03);
    expect(new Set(visits.map(p => p!.edge))).toEqual(new Set(['left', 'right', 'top', 'bottom']));
    for (const p of visits) {
      expect(p!.at).toBeGreaterThanOrEqual(15);
      expect(p!.at).toBeLessThanOrEqual(85);
      expect(p!.delay).toBeGreaterThanOrEqual(PEEK.minDelay);
      expect(p!.delay).toBeLessThanOrEqual(PEEK.maxDelay);
    }
  });

  it('comes at once, every time, when asked for with ?kukucs', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(planPeek(r, true)!.delay).toBeLessThan(3000);
  });

  it('has something to say when caught', () => {
    expect(content.transitions.peek.lines.length).toBeGreaterThan(3);
  });
});
