import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { planTitle } from './title';

describe('the title card', () => {
  const p = planTitle(content.loading.card.quote);

  it('brings the words one by one, in order, between the quote marks, then the source, then fades', () => {
    expect(p.words.map(w => w.text).join(' ')).toBe(content.loading.card.quote);
    const times = [p.open, ...p.words.map(w => w.at), p.close, p.source, p.out, p.done];
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
  });

  it('takes a long breath after the comma and before the last word', () => {
    const gaps = p.words.slice(1).map((w, i) => w.at - p.words[i].at);
    const afterComma = p.words.findIndex(w => w.text.endsWith(','));
    expect(gaps[afterComma]).toBeGreaterThan(Math.max(...gaps.filter((_, i) => i !== afterComma && i !== gaps.length - 1)));
    expect(gaps[gaps.length - 1]).toBeGreaterThan(gaps[gaps.length - 2] ?? 0);
  });

  it('is dramatic but not endless', () => {
    expect(p.done).toBeGreaterThan(6000);
    expect(p.done).toBeLessThan(12000);
  });

  it('shows everything at once with reduced motion, held only briefly', () => {
    const r = planTitle(content.loading.card.quote, true);
    expect(r.words.every(w => w.at === 0)).toBe(true);
    expect(r.source).toBe(0);
    expect(r.done).toBeLessThan(4000);
  });
});
