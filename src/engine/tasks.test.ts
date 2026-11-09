import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { doubtFor, endQuarter, expectFor } from './career';
import { obsById, weekObs } from './observations';
import { mulberry32 } from './rng';
import { scoreSentence } from './rules';
import { dispatch, newGame, type Action } from './state';
import { gentle, playGame, randomPlay } from './test-utils';
import type { GameState } from './types';

const fresh = (seed = 1): GameState => newGame(content, balance, mulberry32(seed));
const taskOf = (s: GameState) => content.tasks.find(t => t.id === s.task!.id)!;
const games = Array.from({ length: 150 }, (_, i) => playGame(i + 1, i % 2 ? gentle : randomPlay));

describe('quarterly tasks', () => {
  it('come from the given quarter on, one per quarter, never the same twice', () => {
    for (const g of games) {
      for (const s of g) {
        if (s.screen !== 'week') continue;
        const q = content.weeks[s.week].quarter;
        if (q < balance.task.fromQuarter) expect(s.task).toBeNull();
      }
      const end = g[g.length - 1];
      expect(new Set(end.pastTasks).size).toBe(end.pastTasks.length);
      if (end.week === content.weeks.length - 1)
        expect(end.pastTasks).toHaveLength(new Set(content.weeks.map(w => w.quarter)).size - balance.task.fromQuarter);
    }
  });

  it('deal one diversion card on the topic while the task is open, none otherwise', () => {
    for (const g of games) for (const s of g) {
      if (s.screen !== 'week') continue;
      const diverts = s.dealt.map(id => content.ints.find(x => x.id === id)!).filter(x => x.tier === 'divert');
      // On the weekly sheet the task can only be done by this week's report, which is not in yet.
      const open = s.task && !s.task.done;
      if (!s.task) expect(diverts).toHaveLength(0);
      if (open) {
        expect(diverts).toHaveLength(1);
        expect(diverts[0].topics).toContain(taskOf(s).topic);
      }
    }
  });

  it('is done by reporting on the topic, even through a harmless common-area observation', () => {
    const r = mulberry32(5);
    const d = (s: GameState, a: Action) => dispatch(s, a, content, balance, r);
    let s = d(fresh(5), { type: 'start' });
    s.week = content.weeks.findIndex(w => w.quarter === balance.task.fromQuarter);
    s.task = { id: content.tasks[0].id, done: false };
    s.weekObs[s.week] = s.weekObs[0];
    const divert = content.ints.find(x => x.tier === 'divert' && x.topics!.includes(content.tasks[0].topic))!;
    const harmless = weekObs(s, content).find(o => o.art === 0)!;
    s.dealt = [divert.id];
    s = d(d(d(s, { type: 'toggleObs', id: harmless.id }), { type: 'toggleInt', id: divert.id }), { type: 'submit' });
    expect(s.task!.done).toBe(true);
    expect(s.last!.taskDone).toBe(true);
    expect(s.last!.sents[0].harm).toBe(0);
  });

  it('pays off at the review: reward when done, penalty when not', () => {
    for (const done of [true, false]) {
      const s = fresh();
      s.week = 2;
      s.meters = { E: 50, H: 60, L: 90 };
      s.task = { id: content.tasks[0].id, done };
      const r = endQuarter(s, content, balance);
      expect(r.task).toEqual({ id: content.tasks[0].id, done });
      expect(r.before.E).toBe(50 + (done ? balance.task.reward : -balance.task.penalty));
      expect(s.task).toBeNull();
      expect(s.doneTasks).toEqual(done ? [content.tasks[0].id] : []);
    }
  });

  it('settles the last quarter’s task before the ending', () => {
    for (const g of games) {
      const end = g[g.length - 1];
      if (end.week !== content.weeks.length - 1) continue;
      expect(end.task).toBeNull();
      expect(end.doneTasks.every(id => end.pastTasks.includes(id))).toBe(true);
    }
  });

  it('counts a task done in a quarter that ends early, without paying the reward', () => {
    const r = mulberry32(8);
    let s = fresh(8);
    s = dispatch(s, { type: 'start' }, content, balance, r);
    s.week = 4;
    s.weekObs[4] = s.weekObs[0];
    s.screen = 'response';
    s.task = { id: content.tasks[0].id, done: true };
    s.meters = { E: 0, H: 50, L: 50 };
    s = dispatch(s, { type: 'next' }, content, balance, r);
    expect(s.screen).toBe('ending');
    expect(s.doneTasks).toEqual([content.tasks[0].id]);
    expect(s.meters.E).toBe(0);
  });

  it('some topic observations exist for every task, so it can also be done the hard way', () => {
    for (const t of content.tasks) expect(content.obs.some(o => o.topics?.includes(t.topic))).toBe(true);
  });
});

describe('recruit category', () => {
  const withCat = (id: string) => { const s = fresh(); s.recruit = { ...s.recruit, categoryId: id }; return s; };

  it('changes what the captain expects', () => {
    for (const [id, p] of Object.entries(balance.categories))
      expect(expectFor(withCat(id), balance, content)).toBe(balance.expect[0] + balance.ranks[balance.startRank].expectBonus + p.expectBonus);
  });

  it('makes exaggeration cost more for loyal recruits, and never touches gained credibility', () => {
    const o = obsById(content, 'mari1a')!;
    const wild = content.ints.find(x => x.id === 'x1')!;
    const safe = content.ints.find(x => x.id === 's2')!;
    const hu = doubtFor(withCat('hu'), balance), csendor = doubtFor(withCat('csendor'), balance);
    expect(scoreSentence(o, wild, balance, hu).hih).toBeLessThan(scoreSentence(o, wild, balance, csendor).hih);
    expect(scoreSentence(o, safe, balance, hu).hih).toBe(scoreSentence(o, safe, balance, csendor).hih);
  });
});
