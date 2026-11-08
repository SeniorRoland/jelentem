/**
 * Balance simulation: plays many games with a few bot strategies and prints
 * the distribution of endings. Run after every change to balance.json or card values.
 *   npm run sim            (2000 games per strategy)
 *   npm run sim -- 10000
 */
import { balance, content } from '../src/content';
import { mulberry32 } from '../src/engine/rng';
import { endingKey, scoreSentence } from '../src/engine/rules';
import { dispatch, newGame, type Action } from '../src/engine/state';
import type { EndingKey, GameState, Rng } from '../src/engine/types';

type Plan = { o: string; i: string | null }[];
type Strategy = (s: GameState, rng: Rng) => Plan;

const N = Number(process.argv[2] ?? 2000);
const obsOf = (s: GameState) => content.weeks[s.week].obs;
const intOf = (id: string) => content.ints.find(x => x.id === id)!;

/** Every legal report: up to two sentences, each with an optional interpretation. */
function allPlans(s: GameState): Plan[] {
  const obs = obsOf(s).map(o => o.id);
  const ints: (string | null)[] = [null, ...s.dealt];
  const plans: Plan[] = [[]];
  for (const o1 of obs) for (const i1 of ints) {
    plans.push([{ o: o1, i: i1 }]);
    for (const o2 of obs) if (o2 > o1) for (const i2 of ints)
      if (i2 === null || i2 !== i1) plans.push([{ o: o1, i: i1 }, { o: o2, i: i2 }]);
  }
  return plans;
}

function evalPlan(s: GameState, p: Plan) {
  let izg = 0, hih = 0, harm = 0;
  for (const x of p) {
    const r = scoreSentence(obsOf(s).find(o => o.id === x.o)!, x.i ? intOf(x.i) : null, balance);
    izg += r.izg; hih += r.hih; harm += r.harm;
  }
  return { izg, hih, harm };
}

const strategies: Record<string, Strategy> = {
  'üres jelentés': () => [],
  'véletlen': (s, rng) => { const ps = allPlans(s); return ps[Math.floor(rng() * ps.length)]; },
  'mohó (max izgalom)': s => allPlans(s).sort((a, b) => evalPlan(s, b).izg - evalPlan(s, a).izg)[0],
  'óvatos (0 ártalom)': s => {
    const exp = balance.expect[s.week];
    const ok = allPlans(s).map(p => ({ p, e: evalPlan(s, p) })).filter(x => x.e.harm === 0);
    ok.sort((a, b) => (Number(b.e.izg >= exp) - Number(a.e.izg >= exp)) || (b.e.hih - a.e.hih) || (b.e.izg - a.e.izg));
    return ok[0]?.p ?? [];
  },
};

function play(strat: Strategy, seed: number): EndingKey {
  const rng = mulberry32(seed);
  const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, rng);
  let s = d(newGame(content, balance, rng), { type: 'start' });
  while (s.screen !== 'ending') {
    for (const x of strat(s, rng)) {
      s = d(s, { type: 'toggleObs', id: x.o });
      if (x.i) s = d(s, { type: 'toggleInt', id: x.i });
    }
    s = d(s, { type: 'submit' });
    s = d(s, { type: 'next' });
  }
  return endingKey(s, balance);
}

const keys: EndingKey[] = ['best', 'kivalo', 'megfigyelt', 'behivatas'];
console.log(`Szimuláció: ${N} játék stratégiánként\n`);
console.log(['stratégia'.padEnd(24), ...keys.map(k => k.padStart(12))].join(''));
for (const [name, strat] of Object.entries(strategies)) {
  const count: Record<EndingKey, number> = { best: 0, kivalo: 0, megfigyelt: 0, behivatas: 0 };
  for (let i = 0; i < N; i++) count[play(strat, i + 1)]++;
  console.log([name.padEnd(24), ...keys.map(k => `${((count[k] / N) * 100).toFixed(1)}%`.padStart(12))].join(''));
}
