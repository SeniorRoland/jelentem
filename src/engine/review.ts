import { candidates, statusesOf } from './observations';
import { randCode, scoreSentence } from './rules';
import type { Balance, Content, GameState, Observation, ResidentId, Review, Rng } from './types';

/**
 * The candidate resident's extra duty: another informant's report to check before it goes to
 * the captain. Each sentence can be kept (its harm falls on the resident, and half of it on the
 * player's conscience) or struck out (no harm, but every strike needs a justification, and there
 * are only a few each week; one without costs much more credibility).
 */

/** True on the top rank, where the reviewing starts. */
export const reviews = (s: GameState, b: Balance): boolean => s.rank === b.ranks.length - 1;

/**
 * Builds this week's report from the other informant: observations of the week's level about the
 * residents, none the player has seen or will see, each with a spin the player does not hold.
 * Pure, all randomness from `rng`.
 */
export function makeReview(s: GameState, c: Content, b: Balance, rng: Rng): Review | null {
  const w = c.weeks[s.week];
  const used = new Set([...s.weekObs.flat(), ...s.peerUsed]);
  const st = statusesOf(s, c);
  const pool: Observation[] = [];
  for (const who of ['mari', 'jozsi', 'pityu'] as ResidentId[])
    for (const o of candidates(c, w, [who], st)) if (!used.has(o.id)) pool.push(o);
  const spins = c.ints.filter(x => (x.tier === 'mid' || x.tier === 'wild') && !s.dealt.includes(x.id));
  const items: Review['items'] = [];
  while (items.length < b.review.sentences && pool.length && spins.length) {
    const o = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    // One sentence per resident while there are enough, so the report reads like a report.
    if (items.some(x => c.obs.find(y => y.id === x.o)?.who === o.who) && pool.some(p => !items.some(x => c.obs.find(y => y.id === x.o)?.who === p.who))) continue;
    const i = spins.splice(Math.floor(rng() * spins.length), 1)[0];
    items.push({ o: o.id, i: i.id });
  }
  if (!items.length) return null;
  const excuses = [...c.review.excuses.keys()].sort(() => rng() - 0.5).slice(0, b.review.excuses).map(k => c.review.excuses[k]);
  return { items, struck: items.map(() => false), excuses };
}

/** The justification a struck sentence gets: the week's excuses go to the struck sentences in order. */
export function excuseOf(r: Review, idx: number): string | null {
  if (!r.struck[idx]) return null;
  const order = r.struck.slice(0, idx + 1).filter(Boolean).length - 1;
  return r.excuses[order] ?? null;
}

/** What the reviewed report does to this week's report. Pure. */
export function scoreReview(r: Review, c: Content, b: Balance) {
  let izg = 0, hih = 0, guilt = 0;
  const harmBy: Partial<Record<ResidentId, number>> = {};
  const sents = r.items.map((x, idx) => {
    const o = c.obs.find(y => y.id === x.o)!;
    const it = c.ints.find(y => y.id === x.i)!;
    const sc = scoreSentence(o, it, b);
    const excuse = excuseOf(r, idx);
    if (r.struck[idx]) hih -= excuse ? b.review.excused : b.review.unexcused;
    else {
      izg += sc.izg * b.review.keptIzg;
      guilt += sc.harm * b.review.keptHarm;
      if (o.who && sc.harm) harmBy[o.who] = (harmBy[o.who] ?? 0) + sc.harm;
    }
    return { text: `${o.text}, ${it.text}.`, struck: r.struck[idx], excuse, harm: sc.harm };
  });
  return { izg: Math.round(izg), hih, guilt, harmBy, sents };
}

/** The other informant's code name, drawn when the player first reviews; never the player's own. */
export function peerCode(s: GameState, c: Content, rng: Rng): string {
  for (let i = 0; i < 20; i++) { const code = randCode(c, rng); if (code !== s.code) return code; }
  return randCode(c, rng);
}
