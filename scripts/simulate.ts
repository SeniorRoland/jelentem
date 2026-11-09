/**
 * Balance simulation: plays many games with a few bot strategies and prints
 * the distribution of endings. Run after every change to balance.json or card values.
 *   npm run sim            (2000 games per strategy)
 *   npm run sim -- 10000
 * Try balance changes without editing the file (deep-merged into balance.json):
 *   SIM_BALANCE='{"quarter":{"resetE":0.3}}' npm run sim
 */
import { balance, content } from '../src/content';
import { doubtFor, expectFor } from '../src/engine/career';
import { weekObs } from '../src/engine/observations';
import { mulberry32 } from '../src/engine/rng';
import { answersTask, endingKey, scoreSentence } from '../src/engine/rules';
import { dispatch, newGame, type Action } from '../src/engine/state';
import type { EndingKey, GameState, Rng } from '../src/engine/types';

type Plan = { o: string; i: string | null }[];
type Score = { izg: number; hih: number; harm: number; task: boolean };
type Strategy = (s: GameState, rng: Rng) => Plan;

const N = Number(process.argv[2] ?? 2000);

type Obj = Record<string, unknown>;
/** Objects merge key by key, arrays element by element (so one rank can be changed alone). */
const merge = (to: Obj, from: Obj): void => {
  for (const [k, v] of Object.entries(from)) {
    if (v && typeof v === 'object' && to[k] && typeof to[k] === 'object') merge(to[k] as Obj, v as Obj);
    else if (v !== null) to[k] = v;
  }
};
if (process.env.SIM_BALANCE) {
  merge(balance as unknown as Obj, JSON.parse(process.env.SIM_BALANCE));
  console.log(`Felülírt értékek: ${process.env.SIM_BALANCE}`);
}
const intOf = new Map(content.ints.map(x => [x.id, x]));

/** Every legal report: up to as many sentences as the rank allows, each with an optional interpretation. */
function allPlans(s: GameState): { p: Plan; e: Score }[] {
  const obs = weekObs(s, content);
  const ints: (string | null)[] = [null, ...s.dealt];
  const topic = s.task && !s.task.done ? content.tasks.find(t => t.id === s.task!.id)!.topic : null;
  const score = new Map<string, Score>();
  for (const o of obs) for (const i of ints) {
    const it = i ? intOf.get(i)! : null;
    score.set(`${o.id}|${i}`, { ...scoreSentence(o, it, balance, doubtFor(s, balance)), task: !!topic && answersTask(topic, o, it) });
  }
  const out: { p: Plan; e: Score }[] = [];
  const grow = (p: Plan, e: Score, from: number) => {
    out.push({ p, e });
    if (p.length === s.slots.length) return;
    for (let k = from; k < obs.length; k++) for (const i of ints) {
      if (i !== null && p.some(x => x.i === i)) continue;
      const r = score.get(`${obs[k].id}|${i}`)!;
      grow([...p, { o: obs[k].id, i }], { izg: e.izg + r.izg, hih: e.hih + r.hih, harm: e.harm + r.harm, task: e.task || r.task }, k + 1);
    }
  };
  grow([], { izg: 0, hih: 0, harm: 0, task: false }, 0);
  return out;
}

const strategies: Record<string, Strategy> = {
  'üres jelentés': () => [],
  'véletlen': (s, rng) => { const ps = allPlans(s); return ps[Math.floor(rng() * ps.length)].p; },
  'mohó (max izgalom)': s => allPlans(s).sort((a, b) => b.e.izg - a.e.izg)[0].p,
  'óvatos (0 ártalom)': s => {
    const exp = expectFor(s, balance);
    const ok = allPlans(s).filter(x => x.e.harm === 0);
    ok.sort((a, b) => (Number(b.e.izg >= exp) - Number(a.e.izg >= exp)) || (b.e.hih - a.e.hih) || (b.e.izg - a.e.izg));
    return ok[0]?.p ?? [];
  },
  // Sees every value and picks the report that keeps E and H farthest from the
  // ending thresholds while avoiding harm. Shows that the best ending stays reachable.
  'előrelátó': s => {
    const exp = expectFor(s, balance);
    const { E: e0, H: h0, L: l0 } = s.meters;
    const { weight: w, endings: t } = balance;
    let best: Plan = [], bestV = -Infinity;
    for (const { p, e } of allPlans(s)) {
      const E = e0 + (e.izg - exp) * w.E;
      const H = Math.min(100, h0 + e.hih * w.H);
      const L = l0 - e.harm * w.L;
      const v = Math.min(E - t.eMin, H - t.hMin) - (L < t.lMin ? 1000 : 0) - e.harm * 8 + (e.task ? 6 : 0);
      if (v > bestV) { bestV = v; best = p; }
    }
    return best;
  },
};

function play(strat: Strategy, seed: number): GameState {
  const rng = mulberry32(seed);
  const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, rng);
  let s = d(newGame(content, balance, rng), { type: 'start' });
  while (s.screen !== 'ending') {
    if (s.screen === 'week') {
      for (const x of strat(s, rng)) {
        s = d(s, { type: 'toggleObs', id: x.o });
        if (x.i) s = d(s, { type: 'toggleInt', id: x.i });
      }
      s = d(s, { type: 'submit' });
    }
    s = d(s, { type: 'next' });
  }
  return s;
}

const keys: EndingKey[] = ['best', 'kivalo', 'megfigyelt', 'behivatas'];
const pct = (n: number) => `${((n / N) * 100).toFixed(1)}%`;
console.log(`Szimuláció: ${N} játék stratégiánként (${content.weeks.length} hét)`);
console.log();
console.log(['stratégia'.padEnd(22), ...keys.map(k => k.padStart(11)), 'végig'.padStart(8), 'rang'.padStart(6), 'baj'.padStart(6), 'feladat'.padStart(9), 'rólad'.padStart(7)].join(''));
const byCategory: Record<string, Record<string, [number, number]>> = {};
for (const [name, strat] of Object.entries(strategies)) {
  const count: Record<EndingKey, number> = { best: 0, kivalo: 0, megfigyelt: 0, behivatas: 0 };
  let full = 0, rank = 0, cons = 0, tasks = 0, given = 0, onYou = 0;
  for (let i = 0; i < N; i++) {
    const s = play(strat, i + 1);
    const key = endingKey(s, balance);
    count[key]++;
    const cat = ((byCategory[name] ??= {})[s.recruit.categoryId] ??= [0, 0]);
    cat[1]++;
    if (key === 'best') cat[0]++;
    if (s.week === content.weeks.length - 1) full++;
    rank += s.rank;
    cons += s.cons.length;
    given += s.pastTasks.length;
    onYou += s.reportsOnYou;
    tasks += s.doneTasks.length;
  }
  console.log([name.padEnd(22), ...keys.map(k => pct(count[k]).padStart(11)), pct(full).padStart(8),
    (rank / N).toFixed(2).padStart(6), (cons / N).toFixed(2).padStart(6), (given ? `${Math.round((tasks / given) * 100)}%` : '–').padStart(9), (onYou / N).toFixed(2).padStart(7)].join(''));
}
console.log();
console.log('Legjobb vég kategóriánként (óvatos / előrelátó):');
for (const k of content.recruit.categories) {
  const r = (n: string) => { const [b, all] = byCategory[n]?.[k.id] ?? [0, 0]; return all ? `${Math.round((b / all) * 100)}%` : '–'; };
  console.log(`  ${k.label.padEnd(30)}${r('óvatos (0 ártalom)').padStart(6)}${r('előrelátó').padStart(8)}`);
}
console.log();
console.log(`végig = mind a ${content.weeks.length} hetet végigjátszotta; rang = átlagos végső rang (0–${balance.ranks.length - 1}); baj = átlagosan hány lakó került bajba; feladat = a kiadott célfeladatok hány százalékát teljesítette; rólad = átlagosan hány jelentést írt rólad a házmester`);
