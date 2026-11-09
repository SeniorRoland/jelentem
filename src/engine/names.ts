import { shuffle } from './rng';
import type { Content, Face, GameState, Person, ResidentId, ResidentName, Rng, Sex } from './types';

/**
 * Draws a family name for every resident from its own candidates, each based on a trait
 * that is true of that resident. No two people share a name, and none takes `taken`
 * (the recruit's family name). Pure, all randomness comes from `rng`.
 */
export function makeNames(c: Content, rng: Rng, taken: string[] = []): Record<ResidentId, ResidentName> {
  const used = new Set(taken);
  const out = {} as Record<ResidentId, ResidentName>;
  for (const id of Object.keys(c.residents) as ResidentId[]) {
    const pick = shuffle(c.residents[id].surnames, rng).find(n => !used.has(n.name));
    if (!pick) throw new Error(`Nincs szabad vezetéknév: ${id}`);
    used.add(pick.name);
    out[id] = pick;
  }
  return out;
}

/** The handler's name, from candidates that hint at his job; never one of `taken`. Pure. */
export function makeCaptain(c: Content, rng: Rng, taken: string[]): ResidentName {
  const pick = shuffle(c.captain.surnames, rng).find(n => !taken.includes(n.name));
  if (!pick) throw new Error('Nincs szabad vezetéknév a századosnak');
  return pick;
}

/** The girl the young resident loves („a {lany} lány”); never one of `taken`. Pure. */
export function makeGirl(c: Content, rng: Rng, taken: string[]): ResidentName {
  const pick = shuffle(c.house.girl, rng).find(n => !taken.includes(n.name));
  if (!pick) throw new Error('Nincs szabad vezetéknév a lánynak');
  return pick;
}

/** The house's address, e.g. „Béke utca 17.” Pure. */
export function makeAddress(c: Content, rng: Rng): string {
  const { streets, numbers: [lo, hi] } = c.house;
  return `${streets[Math.floor(rng() * streets.length)]} ${lo + Math.floor(rng() * (hi - lo + 1))}.`;
}

/** Faces of the given sex whose age falls in the range, not in `taken`. */
export const facesFor = (c: Content, sex: Sex, [lo, hi]: [number, number], taken: Set<string> = new Set()): Face[] =>
  c.faces.filter(f => f.sex === sex && f.age >= lo && f.age <= hi && !taken.has(f.id));

/**
 * Gives every resident a given name and a portrait of the right sex and age (the age comes
 * from the portrait). Given names never repeat in the house. Pure.
 */
export function makePeople(c: Content, rng: Rng): Record<ResidentId, Person> {
  const usedNames = new Set<string>();
  const usedFaces = new Set<string>();
  const out = {} as Record<ResidentId, Person>;
  for (const id of Object.keys(c.residents) as ResidentId[]) {
    const r = c.residents[id];
    const given = shuffle(r.given, rng).find(g => !usedNames.has(g.n));
    const faces = facesFor(c, r.sex, r.age, usedFaces);
    if (!given || !faces.length) throw new Error(`Nincs szabad keresztnév vagy arckép: ${id}`);
    const face = faces[Math.floor(rng() * faces.length)];
    usedNames.add(given.n);
    usedFaces.add(face.id);
    out[id] = { given, age: face.age, face: face.id };
  }
  return out;
}

/** The recruit's photo: the right sex, as close to the age as the faces allow, none a resident has. Pure. */
export function makeOwnFace(c: Content, rng: Rng, sex: Sex, age: number, taken: string[]): string {
  const free = c.faces.filter(f => f.sex === sex && !taken.includes(f.id));
  const best = Math.min(...free.map(f => Math.abs(f.age - age)));
  const near = free.filter(f => Math.abs(f.age - age) <= Math.max(best, 4));
  return near[Math.floor(rng() * near.length)].id;
}

/** The placeholder of the handler's name in content texts. */
export const CAPTAIN = 'szazados';
/** Placeholders of the house address and of the young resident's girl. */
export const ADDRESS = 'cim';
export const GIRL = 'lany';

const PLACEHOLDER = /\{([a-z]+(?:\.[a-z]+)?)\}/g;

/**
 * Every placeholder in a content text: `{mari}` (family name), `{mari.n}` / `{mari.b}` /
 * `{mari.nal}` (given name, nickname, an inflected form), `{szazados}`, `{cim}`, `{lany}`.
 */
export const placeholders = (text: string): string[] => [...text.matchAll(PLACEHOLDER)].map(m => m[1]);

/** Replaces each known placeholder with its value; unknown placeholders stay. */
export function fillNames(text: string, vars: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (m, key: string) => vars[key] ?? m);
}

/** What every placeholder stands for in this game. */
export function nameVars(s: GameState): Record<string, string> {
  const vars: Record<string, string> = { [CAPTAIN]: s.captain.name, [ADDRESS]: s.address, [GIRL]: s.girl.name };
  for (const [id, n] of Object.entries(s.names)) vars[id] = n.name;
  for (const [id, p] of Object.entries(s.people)) for (const [k, v] of Object.entries(p.given)) vars[`${id}.${k}`] = v;
  return vars;
}
