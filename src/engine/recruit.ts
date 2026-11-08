import { shuffle } from './rng';
import type { Content, Recruit, RecruitClass, Rng, Surname } from './types';

const pick = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];
const between = (lo: number, hi: number, rng: Rng): number => lo + Math.floor(rng() * (hi - lo + 1));

/** A random day of 1971 or 1972 as an ISO date (UTC, so no time-zone drift). */
export function randRecruitDate(rng: Rng): string {
  const year = rng() < 0.5 ? 1971 : 1972;
  const days = year === 1972 ? 366 : 365;
  const d = new Date(Date.UTC(year, 0, 1 + Math.floor(rng() * days)));
  return d.toISOString().slice(0, 10);
}

/** The 1972 reform introduced a new classification scheme. */
export const classesFor = (c: Content, isoDate: string): RecruitClass[] =>
  isoDate < '1972-01-01' ? c.recruit.classes.before1972 : c.recruit.classes.from1972;

/** „1971. október 14.” */
export function formatDate(isoDate: string, c: Content): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${y}. ${c.recruit.months[m - 1]} ${d}.`;
}

/** What a family name may be based on. */
export interface Traits {
  job: string;
  category: string;
  school: string;
  birthYear: number;
}

/** True when every condition of the surname holds for the person. */
export function surnameFits(s: Surname, t: Traits): boolean {
  return (!s.jobs || s.jobs.includes(t.job))
    && (!s.categories || s.categories.includes(t.category))
    && (!s.schools || s.schools.includes(t.school))
    && (s.bornMin === undefined || t.birthYear >= s.bornMin)
    && (s.bornMax === undefined || t.birthYear <= s.bornMax);
}

/**
 * Generates a coherent recruitment card: the category limits birth year, sex and
 * occupation; the family name comes from one of these traits; the mother's maiden name
 * from the birthplace; the recruitment date picks the classification scheme; the
 * classification limits the basis. Pure, all randomness comes from `rng`.
 */
export function makeRecruit(c: Content, rng: Rng): Recruit {
  const r = c.recruit;
  const cat = pick(r.categories, rng);
  const sex = cat.sex ?? (rng() < 0.5 ? 'm' : 'f');
  const jobs = cat.jobs ? r.occupations.filter(o => cat.jobs!.includes(o.id)) : r.occupations;
  const occ = pick(jobs, rng);
  const school = pick(occ.school, rng);
  const birthYear = between(cat.born[0], cat.born[1], rng);
  const family = pick(r.surnames.filter(s => surnameFits(s, { job: occ.id, category: cat.id, school, birthYear })), rng);
  const place = pick(r.places, rng);

  const recruitedOn = randRecruitDate(rng);
  const fitting = classesFor(c, recruitedOn).filter(k => k.loyal === cat.loyal);
  const cls = pick(fitting, rng);

  let basis: string;
  if (!cat.loyal && cls.bases.length > 1 && rng() < r.comboChance) {
    const [a, b] = shuffle(cls.bases, rng);
    basis = `${r.combo} (${r.bases[a].short} és ${r.bases[b].short})`;
  } else {
    basis = r.bases[pick(cls.bases, rng)].text;
  }
  basis = `${basis}, ${pick(r.methods, rng)}`;

  return {
    serial: String(between(100000, 999999, rng)),
    name: `${family.name} ${pick(r.givenNames[sex], rng)}`,
    nameWhy: family.why,
    sex,
    birthYear,
    birthPlace: place.name,
    mother: `${place.from} ${pick(r.givenNames.f, rng)}`,
    jobId: occ.id,
    job: occ.job,
    workplace: pick(occ.workplace, rng),
    school,
    categoryId: cat.id,
    category: cat.label,
    recruitedOn,
    classId: cls.id,
    classLabel: cls.label,
    basis,
  };
}
