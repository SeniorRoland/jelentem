import { doubtFor, expectFor } from './career';
import { isBonded } from './events';
import { obsById, weekObs } from './observations';
import { shuffle } from './rng';
import { CONS_LEVELS } from './types';
import type {
  Balance, Content, EndingKey, GameState, Interpretation, Meters, Observation,
  DealTier, ResidentId, Rng, SentenceResult, Tier, WeekResult,
} from './types';

export const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function randCode(c: Content, rng: Rng): string {
  const { adj, noun } = c.codenames;
  return `${adj[Math.floor(rng() * adj.length)]} ${noun[Math.floor(rng() * noun.length)]}`;
}

/**
 * True when an alibi card is put on someone it was not meant for, or on something the resident
 * told in confidence or that the whole house saw: an alibi only covers everyday comings and goings.
 */
export const misused = (o: Observation, it: Interpretation | null): boolean => !!it?.who && (it.who !== o.who || !!o.event);

/** Score one sentence: observation + optional interpretation. `doubt` scales lost credibility. Pure. */
export function scoreSentence(o: Observation, it: Interpretation | null, b: Balance, doubt = 1) {
  const izg = o.izg + (it ? it.izg : 0);
  let hih = it ? it.hih : b.plainFact.hih;
  if (it && it.izg >= b.absurd.minIntIzg && o.izg <= b.absurd.maxObsIzg) hih -= b.absurd.penalty;
  // A misused alibi covers nothing: full harm, and the captain doubts the whole sentence.
  const bad = misused(o, it);
  if (bad) hih = -b.events.misuse;
  if (hih < 0) hih = Math.round(hih * doubt);
  const harm = Math.round(o.art * (bad ? 1 : it ? it.mult : b.plainFact.mult));
  return { izg, hih, harm };
}

/** Margin note next to a sentence. Repeat notes win, then interpretation, then observation. */
export function pickNote(o: Observation, it: Interpretation | null, reported: string[], c: Content): string | null {
  if (misused(o, it)) return c.events.labels.misuse;
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

/** True when the sentence is about the task's topic (through the observation or the interpretation). */
export const answersTask = (topic: string, o: Observation, it: Interpretation | null): boolean =>
  !!(o.topics?.includes(topic) || it?.topics?.includes(topic));

/**
 * Deal this week's interpretation cards, preferring ones not used yet. While a task is open,
 * one extra diversion card on its topic comes too, and while anyone is close to the player, one alibi card.
 */
export function deal(s: GameState, c: Content, b: Balance, rng: Rng): string[] {
  const pick = (tier: Tier, n: number) => {
    const all = c.ints.filter(x => x.tier === tier);
    const fresh = shuffle(all.filter(x => !s.usedInts.includes(x.id)), rng);
    const old = shuffle(all.filter(x => s.usedInts.includes(x.id)), rng);
    return fresh.concat(old).slice(0, n);
  };
  const tiers: DealTier[] = ['safe', 'mid', 'wild'];
  const cards = tiers.flatMap(t => pick(t, b.deal[t]));
  const task = s.task && !s.task.done ? c.tasks.find(t => t.id === s.task!.id) : undefined;
  if (task) {
    const diverts = c.ints.filter(x => x.tier === 'divert' && x.topics?.includes(task.topic));
    const fresh = diverts.filter(x => !s.usedInts.includes(x.id));
    const from = fresh.length ? fresh : diverts;
    if (from.length) cards.push(from[Math.floor(rng() * from.length)]);
  }
  const alibis = c.ints.filter(x => x.tier === 'alibi' && x.who && s.bonds.includes(x.who));
  if (alibis.length) {
    const fresh = alibis.filter(x => !s.usedInts.includes(x.id));
    const from = fresh.length ? fresh : alibis;
    cards.push(from[Math.floor(rng() * from.length)]);
  }
  return shuffle(cards, rng).map(x => x.id);
}

/** Apply the current report to the state. Mutates `s` (callers pass a clone). */
export function resolveWeek(s: GameState, c: Content, b: Balance): WeekResult {
  const week = weekObs(s, c);
  const before: Meters = { ...s.meters };
  let izgSum = 0, hihSum = 0, harmSum = 0, guiltSum = 0;
  const betrayed: ResidentId[] = [];
  const sents: SentenceResult[] = [];

  for (const sl of s.slots) {
    if (!sl.o) continue;
    const o = week.find(x => x.id === sl.o)!;
    const it = sl.i ? c.ints.find(x => x.id === sl.i)! : null;
    const sc = scoreSentence(o, it, b, doubtFor(s, b));
    sents.push({
      text: `${o.text}${it ? ', ' + it.text : ''}.`,
      note: pickNote(o, it, s.reported, c),
      ...sc,
      who: o.who,
      ...(o.self ? { self: true } : {}),
    });
    izgSum += sc.izg; hihSum += sc.hih; harmSum += sc.harm;
    // Harm to someone who trusted the player weighs more on the conscience, and ends the trust.
    const close = isBonded(s, o.who) && sc.harm > 0;
    guiltSum += sc.harm * (close ? b.events.guilt : 1);
    if (close && !betrayed.includes(o.who!)) betrayed.push(o.who!);
    if (o.who && sc.harm) s.harmBy[o.who] += sc.harm;
    if (it && !s.usedInts.includes(it.id)) s.usedInts.push(it.id);
  }
  for (const x of sents) s.log.push({ week: s.week, text: x.text, note: x.note, izg: x.izg, hih: x.hih, harm: x.harm });
  for (const sl of s.slots) if (sl.o && !s.reported.includes(sl.o)) s.reported.push(sl.o);
  s.bonds = s.bonds.filter(k => !betrayed.includes(k));
  s.betrayed.push(...betrayed);

  // The caretaker's counter-report: what the player wrote about themself, or left out.
  const self = week.find(o => o.self);
  const honest = !!self && s.slots.some(sl => sl.o === self.id);
  const hidden = self && !honest ? self.text : null;
  if (honest) hihSum += b.watch.honest;
  if (hidden) { hihSum -= b.watch.hidden; s.reportsOnYou++; }

  let taskDone = false;
  const task = s.task && !s.task.done ? c.tasks.find(t => t.id === s.task!.id) : undefined;
  if (task && s.slots.some(sl => sl.o && answersTask(task.topic, week.find(x => x.id === sl.o)!, sl.i ? c.ints.find(x => x.id === sl.i)! : null))) {
    s.task!.done = true;
    taskDone = true;
  }

  const expect = expectFor(s, b, c);
  s.meters = {
    E: clamp(s.meters.E + (izgSum - expect) * b.weight.E),
    H: clamp(s.meters.H + hihSum * b.weight.H),
    L: clamp(s.meters.L - guiltSum * b.weight.L),
  };

  const started = !s.watched && s.meters.H < b.watch.hBelow;
  if (started) { s.watched = true; s.reportsOnYou++; }

  const steps: WeekResult['steps'] = [];
  for (const k of Object.keys(s.harmBy) as ResidentId[]) {
    if (!c.residents[k].cons) continue;
    const reached = consLevelFor(s.harmBy[k], b);
    if (reached <= (s.consLevel[k] ?? 0)) continue;
    s.consLevel[k] = reached;
    steps.push({ who: k, level: CONS_LEVELS[reached - 1] });
    if (reached >= TROUBLE && !s.cons.includes(k)) s.cons.push(k);
  }

  return {
    sents,
    before,
    after: { ...s.meters },
    overall: overallNote(izgSum, expect, c, b),
    extra: hihSum <= b.overall.fantasyHihAtMost ? c.notes.fantasy : '',
    steps,
    stamp: s.meters.E >= before.E ? 'Átvéve' : 'Hiányos',
    taskDone,
    watch: { started, hidden, honest },
    betrayed,
  };
}

/** The step a resident's gathered harm has reached: 0 = none, 1–3 = `CONS_LEVELS`. */
export const consLevelFor = (harm: number, b: Balance): number =>
  CONS_LEVELS.filter(l => harm >= b.consequences[l]).length;
/** From this step on the resident is in trouble (`bajban`, `state.cons`). */
export const TROUBLE = CONS_LEVELS.indexOf('trouble') + 1;

export const anyMeterZero = (m: Meters): boolean => m.E <= 0 || m.H <= 0 || m.L <= 0;

export function endingKey(s: GameState, b: Balance): EndingKey {
  if (s.excluded) return 'kizarva';
  const { E, H, L } = s.meters;
  if (H <= 0) return 'megfigyelt';
  if (E <= 0) return 'behivatas';
  if (L <= 0) return 'kivalo';
  if (H < b.endings.hMin) return 'megfigyelt';
  if (E < b.endings.eMin) return 'behivatas';
  if (L < b.endings.lMin || s.cons.length > 0) return 'kivalo';
  return 'best';
}
