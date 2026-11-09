import { facesFor, makeCaptain, makeOwnFace } from '../engine/names';
import type { Balance, Content, GameState, Person, ResidentId } from '../engine/types';

const KEY = 'jelentem.mentes.v1';

/**
 * A saved game is only used when it still fits the current content: same number of weeks,
 * existing observation ids and ranks. Anything else (old version, edited JSON) is dropped.
 */
export function fitsContent(s: unknown, c: Content, b: Balance): s is GameState {
  if (!s || typeof s !== 'object') return false;
  const g = s as Partial<GameState>;
  if (typeof g.week !== 'number' || g.week < 0 || g.week >= c.weeks.length) return false;
  if (typeof g.rank !== 'number' || g.rank < 0 || g.rank >= b.ranks.length) return false;
  if (!g.meters || !g.recruit || !g.names || !g.captain || !Array.isArray(g.weekObs) || !Array.isArray(g.slots)) return false;
  if (g.weekObs.length > c.weeks.length) return false;
  const ids = new Set(c.obs.map(o => o.id));
  if (!g.weekObs.every(w => Array.isArray(w) && w.every(id => ids.has(id)))) return false;
  if (g.screen !== 'intro' && !g.weekObs[g.week]) return false;
  if (typeof g.watched !== 'boolean' || typeof g.reportsOnYou !== 'number') return false;
  if (!Array.isArray(g.events) || !Array.isArray(g.bonds) || !Array.isArray(g.betrayed)) return false;
  if (typeof g.address !== 'string' || !g.girl || typeof g.face !== 'string' || !g.people) return false;
  if (!(Object.keys(c.residents) as ResidentId[]).every(id => g.people![id]?.given?.n && c.faces.some(f => f.id === g.people![id].face))) return false;
  if (!g.events.every(id => id === null || c.events.list.some(e => e.id === id))) return false;
  if (!Array.isArray(g.pastTasks) || !Array.isArray(g.doneTasks) || (g.task && !c.tasks.some(t => t.id === g.task!.id))) return false;
  return g.screen === 'intro' || g.screen === 'week' || g.screen === 'response' || g.screen === 'quarter';
}

/** Saves from before the handler had a generated name get one, so the game can go on. */
function upgrade(s: unknown, c: Content): void {
  if (!s || typeof s !== 'object') return;
  const g = s as Partial<GameState>;
  if (g.watched === undefined) g.watched = false;
  if (g.reportsOnYou === undefined) g.reportsOnYou = 0;
  if (g.last && !g.last.watch) g.last.watch = { started: false, hidden: null, honest: false };
  if (g.lastQuarter && g.lastQuarter.calmed === undefined) g.lastQuarter.calmed = null;
  // Saves from before the house events: nothing has happened in the house yet.
  if (g.events === undefined) g.events = [];
  if (g.bonds === undefined) g.bonds = [];
  if (g.betrayed === undefined) g.betrayed = [];
  if (g.last && !g.last.betrayed) g.last.betrayed = [];
  if (!g.recruit || !g.names) return;
  if (!g.captain) g.captain = makeCaptain(c, Math.random, [g.recruit.name.split(' ')[0], ...Object.values(g.names).map(n => n.name)]);
  // Saves from before the generated given names and portraits: the original names and address
  // (the texts the player has read so far used them), and a fitting portrait for everyone.
  if (!g.people) {
    const used = new Set<string>();
    g.people = {} as Record<ResidentId, Person>;
    for (const id of Object.keys(c.residents) as ResidentId[]) {
      const r = c.residents[id];
      const face = facesFor(c, r.sex, r.age, used)[0];
      used.add(face.id);
      g.people[id] = { given: r.given[0], age: face.age, face: face.id };
    }
  }
  if (!g.address) g.address = `${c.house.streets[0]} 12.`;
  if (!g.girl) g.girl = c.house.girl[0];
  if (!g.face) g.face = makeOwnFace(c, Math.random, g.recruit.sex, 1979 - g.recruit.birthYear, Object.values(g.people).map(p => p.face));
}

/** The saved game, or null when there is none, it is finished, or storage is unavailable. */
export function loadGame(c: Content, b: Balance): GameState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s: unknown = JSON.parse(raw);
    upgrade(s, c);
    return fitsContent(s, c, b) ? s : null;
  } catch {
    return null;
  }
}

/** Saves after every step; a finished game is removed, so the next visit starts fresh. */
export function saveGame(s: GameState): void {
  try {
    if (s.screen === 'ending') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: the game still works, it just does not persist.
  }
}
