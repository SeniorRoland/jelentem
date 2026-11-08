import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { classesFor, formatDate, makeRecruit, surnameFits } from './recruit';
import { mulberry32 } from './rng';

const many = Array.from({ length: 500 }, (_, i) => makeRecruit(content, mulberry32(i + 1)));
const cat = (id: string) => content.recruit.categories.find(k => k.id === id)!;

describe('makeRecruit', () => {
  it('is deterministic for a seed', () => {
    expect(makeRecruit(content, mulberry32(42))).toEqual(makeRecruit(content, mulberry32(42)));
  });

  it('fills every field', () => {
    for (const r of many) for (const [k, v] of Object.entries(r)) expect(v, k).not.toBe('');
  });

  it('gives a six-digit serial number', () => {
    for (const r of many) expect(r.serial).toMatch(/^[1-9]\d{5}$/);
  });

  it('recruits in 1971 or 1972 on a real calendar day', () => {
    for (const r of many) {
      expect(r.recruitedOn).toMatch(/^197[12]-\d\d-\d\d$/);
      expect(new Date(r.recruitedOn + 'T00:00:00Z').toISOString().slice(0, 10)).toBe(r.recruitedOn);
    }
    expect(new Set(many.map(r => r.recruitedOn.slice(0, 4)))).toEqual(new Set(['1971', '1972']));
  });

  it('uses the classification scheme of the recruitment year, matching the category', () => {
    for (const r of many) {
      const k = classesFor(content, r.recruitedOn).find(x => x.id === r.classId);
      expect(k, `${r.classId} @ ${r.recruitedOn}`).toBeDefined();
      expect(k!.loyal).toBe(cat(r.categoryId).loyal);
    }
  });

  it('keeps the birth year, sex and occupation within the category', () => {
    for (const r of many) {
      const k = cat(r.categoryId);
      expect(r.birthYear).toBeGreaterThanOrEqual(k.born[0]);
      expect(r.birthYear).toBeLessThanOrEqual(k.born[1]);
      if (k.sex) expect(r.sex).toBe(k.sex);
      if (k.jobs) expect(k.jobs.map(j => content.recruit.occupations.find(o => o.id === j)!.job)).toContain(r.job);
    }
  });

  it('takes the family name from a trait that is true of the recruit', () => {
    for (const r of many) {
      const family = r.name.split(' ')[0];
      const s = content.recruit.surnames.find(x => x.name === family)!;
      expect(s, family).toBeDefined();
      expect(r.nameWhy).toBe(s.why);
      expect(surnameFits(s, { job: r.jobId, category: r.categoryId, school: r.school, birthYear: r.birthYear }), `${family} / ${r.job}`).toBe(true);
    }
  });

  it('uses many different family names', () => {
    expect(new Set(many.map(r => r.name.split(' ')[0])).size).toBeGreaterThanOrEqual(30);
  });

  it('takes the maiden name of the mother from the birthplace', () => {
    for (const r of many) {
      const place = content.recruit.places.find(x => x.name === r.birthPlace)!;
      expect(r.mother.startsWith(place.from + ' ')).toBe(true);
    }
  });

  it('only loyal recruits are recruited on a patriotic or loyal basis', () => {
    for (const r of many) {
      const patriotic = /hazafias|lojális/.test(r.basis);
      expect(patriotic).toBe(cat(r.categoryId).loyal);
    }
  });
});

describe('formatDate', () => {
  it('writes Hungarian dates', () => {
    expect(formatDate('1971-10-04', content)).toBe('1971. október 4.');
  });
});
