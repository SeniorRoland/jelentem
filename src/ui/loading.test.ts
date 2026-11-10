import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { LOADING_STEPS } from '../content/validate';
import { mulberry32 } from '../engine/rng';
import { planLoading } from './loading';

const plans = Array.from({ length: 300 }, (_, i) => planLoading(content.loading, mulberry32(i + 1)));

describe('planLoading', () => {
  it('has the steps, exactly one setback, and ends with overfulfilment', () => {
    for (const p of plans) {
      expect(p.filter(e => e.kind === 'step')).toHaveLength(LOADING_STEPS);
      expect(p.filter(e => e.kind === 'setback')).toHaveLength(1);
      expect(p[p.length - 1]).toMatchObject({ kind: 'over', pct: 112 });
    }
  });

  it('rises step by step, except that the setback loses ground', () => {
    for (const p of plans) {
      const steps = p.filter(e => e.kind === 'step').map(e => e.pct);
      for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThanOrEqual(steps[i - 1]);
      expect(steps[steps.length - 1]).toBe(100);
      const at = p.findIndex(e => e.kind === 'setback');
      expect(at).toBeGreaterThan(0);
      expect(p[at].pct).toBeLessThan(p[at - 1].pct);
      expect(p[at].pct).toBeGreaterThanOrEqual(0);
    }
  });

  it('comes with the notice on what the game is, and what it is not', () => {
    expect(content.loading.notice.title).toBeTruthy();
    const text = content.loading.notice.text.join(' ');
    expect(text).toContain('szatirikus');
    expect(text).toContain('relativizálja');
  });

  it('never shows the same step twice', () => {
    for (const p of plans) expect(new Set(p.map(e => e.text)).size).toBe(p.length);
  });
});
