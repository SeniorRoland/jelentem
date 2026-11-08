/** Shared helpers for the tests: play whole games with simple strategies. */
import { balance, content } from '../content';
import { weekObs } from './observations';
import { mulberry32 } from './rng';
import { dispatch, newGame, type Action } from './state';
import type { GameState, Rng } from './types';

/** Picks the report for the current week: observation ids, each with an interpretation or none. */
export type Strategy = (s: GameState, rng: Rng) => { o: string; i: string | null }[];

/** Fills every sentence slot with a random observation and a random (or no) interpretation. */
export const randomPlay: Strategy = (s, rng) => {
  const obs = weekObs(s, content).map(o => o.id).sort(() => rng() - 0.5).slice(0, s.slots.length);
  const ints = [...s.dealt].sort(() => rng() - 0.5);
  return obs.map((o, k) => ({ o, i: rng() < 0.6 ? ints[k] : null }));
};

/** Reports the most damaging observations with the wildest spin, to get everyone in trouble. */
export const ruthless: Strategy = s => {
  const obs = [...weekObs(s, content)].sort((a, b) => b.art - a.art).slice(0, s.slots.length);
  const wild = s.dealt.map(id => content.ints.find(x => x.id === id)!).sort((a, b) => b.mult - a.mult);
  return obs.map((o, k) => ({ o: o.id, i: wild[k]?.id ?? null }));
};

/** Plays one game to the end and returns every state passed through. */
export function playGame(seed: number, strat: Strategy = randomPlay): GameState[] {
  const rng = mulberry32(seed);
  const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, rng);
  const seen: GameState[] = [];
  let s = d(newGame(content, balance, rng), { type: 'start' });
  for (let guard = 0; s.screen !== 'ending' && guard < 200; guard++) {
    seen.push(s);
    if (s.screen === 'week') {
      for (const x of strat(s, rng)) {
        s = d(s, { type: 'toggleObs', id: x.o });
        if (x.i) s = d(s, { type: 'toggleInt', id: x.i });
      }
      s = d(s, { type: 'submit' });
    } else s = d(s, { type: 'next' });
  }
  seen.push(s);
  return seen;
}
