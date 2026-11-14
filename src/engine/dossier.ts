import { trusting } from './events';
import { quarterOf } from './career';
import { fillNames, nameVars } from './names';
import { endingKey } from './rules';
import { CONS_LEVELS, type Balance, type Content, type GameState, type LoggedSentence } from './types';

/** Everything the shareable file shows, with every placeholder already filled. */
export interface Dossier {
  code: string;
  serial: string;
  face: string;
  ending: string;
  rank: string;
  quarter: string;
  weeks: number;
  sentences: number;
  /** The most memorable sentence of the year and the captain's margin note on it. */
  best: { text: string; note: string | null; week: number } | null;
  /** Residents the reports got in trouble or worse, as „name: what happened”. */
  harmed: string[];
  trusted: number;
  reportsOnYou: number;
  address: string;
}

/**
 * How memorable a sentence is: the wilder the spin and the less believable, the funnier,
 * and a margin note from the captain makes it a story. Harmless lines win a tie.
 */
export const memorable = (x: LoggedSentence): number => x.izg - x.hih + (x.note ? 4 : 0) - x.harm * 0.1;

/** The player's file at the end of the game. Pure. */
export function makeDossier(s: GameState, c: Content, b: Balance): Dossier {
  const vars = nameVars(s);
  const fill = (t: string) => fillNames(t, vars);
  const best = [...s.log].sort((x, y) => memorable(y) - memorable(x) || x.week - y.week)[0] ?? null;
  const harmed = (Object.keys(c.residents) as (keyof typeof c.residents)[])
    .filter(k => (s.consLevel[k] ?? 0) > 1)
    // What the house calls them („Erzsi néni”), so each line fits the card.
    .map(k => `${fill(`{${k}.b}`)}: ${c.notes.cons[CONS_LEVELS[(s.consLevel[k] ?? 1) - 1]]}`);
  return {
    code: s.code,
    serial: s.recruit.serial,
    face: s.face,
    ending: fill(c.endings[endingKey(s, b)].title),
    rank: c.career.ranks[s.rank].label,
    quarter: c.career.quarters[quarterOf(s, c)],
    weeks: s.week + 1,
    sentences: s.log.length,
    best: best && { text: fill(best.text), note: best.note && fill(best.note), week: best.week + 1 },
    harmed,
    trusted: trusting(s).length,
    reportsOnYou: s.reportsOnYou,
    address: s.address,
  };
}

/** The file as plain text, for copying or sharing. `url` is added when the game has a public address. */
export function dossierText(d: Dossier, c: Content, url = ''): string {
  const t = c.dossier;
  const lines = [
    `„${c.loading.card.quote}”`,
    `${t.code}: ${d.code} · ${t.rank}: ${d.rank}`,
    `${t.ending}: ${d.ending}`,
  ];
  if (d.best) lines.push(`${t.best}: „${d.best.text}”${d.best.note ? ` – ${t.captain}: „${d.best.note}”` : ''}`);
  lines.push(d.harmed.length ? `${t.harmed}: ${d.harmed.length}` : t.noneHarmed);
  if (d.reportsOnYou) lines.push(t.onYou.replace('{n}', String(d.reportsOnYou)));
  if (url) lines.push(url);
  return lines.join('\n');
}
