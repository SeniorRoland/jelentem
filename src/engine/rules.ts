import { obsById, weekObs } from './observations';
import { shuffle } from './rng';
import type {
  Balance, Content, EndingKey, GameState, Interpretation, Meters, Observation,
  ResidentId, Rng, SentenceResult, Tier, WeekResult,
} from './types';

export const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function randCode(c: Content, rng: Rng): string {
  const { adj, noun } = c.codenames;
  return `${adj[Math.floor(rng() * adj.length)]} ${noun[Math.floor(rng() * noun.length)]}`;
}

/** Score one sentence: observation + optional interpretation. Pure. */
export function scoreSentence(o: Observation, it: Interpretation | null, b: Balance) {
  const izg = o.izg + (it ? it.izg : 0);
  let hih = it ? it.hih : b.plainFact.hih;
  if (it && it.izg >= b.absurd.minIntIzg && o.izg <= b.absurd.maxObsIzg) hih -= b.absurd.penalty;
  const harm = Math.round(o.art * (it ? it.mult : b.plainFact.mult));
  return { izg, hih, harm };
}

/** Margin note next to a sentence. Repeat notes win, then interpretation, then observation. */
export function pickNote(o: Observation, it: Interpretation | null, reported: string[], c: Content): string | null {
  const again = o.tag && reported.some(id => id !== o.id && obsById(c, id)?.tag === o.tag);
  const rep = again ? c.notes.repeat.find(r => r.tag === o.tag) : undefined;
  if (rep) return rep.note;
  return it?.note ?? o.note ?? null;
}

export function overallNote(izgSum: number, expect: number, c: Content, b: Balance): string {
  const d = izgSum - expect;
  if (izgSum === 0) return c.notes.empty;
  if (d < b.overall.lowBelow) return c.notes.low;
  if (d > b.overall.greatAbove) return c.notes.great;
  if (d > b.overall.goodAbove) return c.notes.good;
  return c.notes.ok;
}

/** Deal this week's interpretation cards, preferring ones not used yet. */
export function deal(s: GameState, c: Content, b: Balance, rng: Rng): string[] {
  const pick = (tier: Tier, n: number) => {
    const all = c.ints.filter(x => x.tier === tier);
    const fresh = shuffle(all.filter(x => !s.usedInts.includes(x.id)), rng);
    const old = shuffle(all.filter(x => s.usedInts.includes(x.id)), rng);
    return fresh.concat(old).slice(0, n);
  };
  const tiers: Tier[] = ['safe', 'mid', 'wild'];
  return shuffle(tiers.flatMap(t => pick(t, b.deal[t])), rng).map(x => x.id);
}

/** Apply the current report to the state. Mutates `s` (callers pass a clone). */
export function resolveWeek(s: GameState, c: Content, b: Balance): WeekResult {
  const week = weekObs(s, c);
  const before: Meters = { ...s.meters };
  let izgSum = 0, hihSum = 0, harmSum = 0;
  const sents: SentenceResult[] = [];

  for (const sl of s.slots) {
    if (!sl.o) continue;
    const o = week.find(x => x.id === sl.o)!;
    const it = sl.i ? c.ints.find(x => x.id === sl.i)! : null;
    const sc = scoreSentence(o, it, b);
    sents.push({
      text: `${o.text}${it ? ', ' + it.text : ''}.`,
      note: pickNote(o, it, s.reported, c),
      ...sc,
      who: o.who,
    });
    izgSum += sc.izg; hihSum += sc.hih; harmSum += sc.harm;
    if (o.who && sc.harm) s.harmBy[o.who] += sc.harm;
    if (it && !s.usedInts.includes(it.id)) s.usedInts.push(it.id);
  }
  for (const sl of s.slots) if (sl.o && !s.reported.includes(sl.o)) s.reported.push(sl.o);

  const expect = b.expect[s.week];
  s.meters = {
    E: clamp(s.meters.E + (izgSum - expect) * b.weight.E),
    H: clamp(s.meters.H + hihSum * b.weight.H),
    L: clamp(s.meters.L - harmSum * b.weight.L),
  };

  const newCons: ResidentId[] = [];
  for (const k of Object.keys(s.harmBy) as ResidentId[]) {
    if (c.residents[k].cons && s.harmBy[k] >= b.consThreshold && !s.cons.includes(k)) {
      s.cons.push(k);
      newCons.push(k);
    }
  }

  return {
    sents,
    before,
    after: { ...s.meters },
    overall: overallNote(izgSum, expect, c, b),
    extra: hihSum <= b.overall.fantasyHihAtMost ? c.notes.fantasy : '',
    newCons,
    stamp: s.meters.E >= before.E ? 'Átvéve' : 'Hiányos',
  };
}

export const anyMeterZero = (m: Meters): boolean => m.E <= 0 || m.H <= 0 || m.L <= 0;

export function endingKey(s: GameState, b: Balance): EndingKey {
  const { E, H, L } = s.meters;
  if (H <= 0) return 'megfigyelt';
  if (E <= 0) return 'behivatas';
  if (L <= 0) return 'kivalo';
  if (H < b.endings.hMin) return 'megfigyelt';
  if (E < b.endings.eMin) return 'behivatas';
  if (L < b.endings.lMin || s.cons.length > 0) return 'kivalo';
  return 'best';
}
