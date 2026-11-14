import { isQuarterStart, residentStatus, weekInQuarter } from '../engine/career';
import { fillNames, nameVars } from '../engine/names';
import type { Content, GameState, ResidentId } from '../engine/types';
import type { Action } from '../engine/state';
import { faceImg } from './faces';
import CAPTAIN_URL from '../assets/captain.png';
import CAPTAIN2_URL from '../assets/captain2.jpg';
import { STATUS_LABEL } from './render';
import type { Scene } from './scene';

const at = (n: number) => `style="--at:${n}ms"`;
const STORY: ResidentId[] = ['mari', 'jozsi', 'pityu'];

/** „1979. március 12–18.” → year, month and days, for a tear-off calendar page. */
export function splitLabel(label: string): { year: string; month: string; days: string } {
  const m = label.match(/^(\d{4})\.\s+(\S+)\s+(.+)$/);
  return m ? { year: m[1], month: m[2], days: m[3] } : { year: '', month: label, days: '' };
}

/** One calendar page: the year on the binding, the month, the days, the week of the quarter. */
function page(s: GameState, c: Content, cls: string): string {
  const w = c.weeks[s.week];
  const l = splitLabel(w.label);
  // The first page of a quarter names it; after a SZOT stay, the first page played does.
  const first = isQuarterStart(s, c) || (s.holiday !== null && s.week === s.holiday + 1);
  const quarter = first ? `<span class="cal-q">${c.career.quarters[w.quarter]}</span>` : '';
  return `<div class="cal ${cls}"><div class="cal-top">${l.year}</div><div class="cal-month">${l.month}</div>
  <div class="cal-days">${l.days}</div><div class="cal-week">${c.transitions.week.weekNo.replace('{n}', String(weekInQuarter(s, c)))}${quarter}</div></div>`;
}

/**
 * Between two weeks: last week's calendar page is torn off, the new one shows the dates, and a
 * line about the house. Short, so twelve of them never slow the game. None with reduced motion.
 */
export function weekScene(before: GameState, after: GameState, c: Content, reduced = false): Scene | null {
  if (after.screen !== 'week' || after.week <= before.week) return null;
  // A skipped week is the SZOT stay: a postcard from the lake instead of a line about the house.
  // It is shown even with reduced motion, as the player has to know a week went by.
  const holiday = after.week - before.week > 1;
  if (reduced && !holiday) return null;
  const lines = c.transitions.week.lines;
  const line = lines[(after.week - 1) % lines.length];
  const prev = { ...after, week: before.week };
  const h = c.transitions.holiday;
  const html = holiday
    ? `<div class="cal-stack">${page(after, c, 'cal-new')}${page(prev, c, 'cal-old')}</div>
  <div class="sc-in" ${at(reduced ? 0 : 900)}><div class="postcard"><p class="postcard-title">${h.title}</p><p>${h.text}</p></div></div>`
    : `<div class="cal-stack">${page(after, c, 'cal-new')}${page(prev, c, 'cal-old')}</div>
  <p class="cal-line sc-in" ${at(1000)}>${line}</p>`;
  return {
    cls: 'sc-week', label: c.weeks[after.week].label, html: fillNames(html, nameVars(after)),
    out: holiday ? (reduced ? 3500 : 5200) : 3200, fade: reduced ? 0 : 500, sounds: reduced ? [] : [{ cue: 'page', at: 450 }],
  };
}

/**
 * Towards the quarterly review: the quarter's results one by one – the grade stamped, the
 * rank before and after, the task, and how the house stands – before the captain's letter.
 */
export function quarterScene(before: GameState, after: GameState, c: Content, reduced = false): Scene | null {
  const q = after.lastQuarter;
  if (after.screen !== 'quarter' || before.screen === 'quarter' || !q) return null;
  const t = c.transitions.quarter;
  const T = reduced ? [0, 0, 0, 0, 0] : [200, 900, 1900, 2700, 3500];
  const ranks = c.career.ranks;
  const rank = q.excluded
    ? `${ranks[q.rankBefore].label} <span class="sc-arrow">→</span> <strong>${c.career.excluded.label}</strong>`
    : q.rankAfter === q.rankBefore
    ? `${ranks[q.rankAfter].label} <span class="sc-soft">(${t.unchanged})</span>`
    : `${ranks[q.rankBefore].label} <span class="sc-arrow">→</span> <strong>${ranks[q.rankAfter].label}</strong>`;
  const task = q.task && c.tasks.find(x => x.id === q.task!.id);
  const house = STORY.map(k => `<li>${faceImg(after.people[k].face, '', 'face')}<span>{${k}.b}<br><span class="sc-soft">${STATUS_LABEL[residentStatus(after, k)]}</span></span></li>`).join('');
  const html = `<h2 class="sc-in" ${at(T[0])}>${c.career.quarters[q.quarter]}<br><span class="sc-soft">${t.title}</span></h2>
  <dl class="sc-results">
    <div class="sc-in" ${at(T[1])}><dt>${t.grade}</dt><dd><span class="sc-stamp sc-in" ${at(T[1] + 200)}>${c.career.grades[q.grade].title}</span></dd></div>
    <div class="sc-in" ${at(T[2])}><dt>${t.rank}</dt><dd>${rank}</dd></div>
    ${task ? `<div class="sc-in" ${at(T[3])}><dt>${t.task}</dt><dd>${task.title} <span class="sc-soft">– ${q.task!.done ? t.taskDone : t.taskFail}</span></dd></div>` : ''}
    <div class="sc-in" ${at(T[4])}><dt>${t.house}</dt><dd><ul class="sc-house">${house}</ul></dd></div>
  </dl>`;
  return {
    cls: 'sc-quarter', label: `${c.career.quarters[q.quarter]}: ${c.career.grades[q.grade].title}`,
    html: fillNames(html, nameVars(after)),
    out: reduced ? 3000 : 5800, fade: reduced ? 0 : 700,
    sounds: reduced ? [] : [{ cue: 'stamp', at: T[1] + 420 }],
  };
}

/**
 * Before the opening letter: the captain takes the dusty file off the shelf, types the code
 * name on it and stamps it. Shown for a new game only, never when a saved game goes on.
 */
export function introScene(s: GameState, c: Content, reduced = false): Scene {
  const t = c.transitions.intro;
  const T = reduced ? [0, 0, 0, 0, 0, 0] : [400, 1900, 3500, 5100, 5700, 6500];
  const fill = (x: string) => x.replace('{ev}', s.recruit.recruitedOn.slice(0, 4));
  const html = `<img class="sc-cpt sc-in" ${at(T[0])} src="${CAPTAIN_URL}" alt="" width="240" height="312" decoding="async">
  <div class="sc-lines">${t.lines.map((l, i) => `<p class="sc-in" ${at(T[i])}>${fill(l)}</p>`).join('')}</div>
  <div class="sc-folder sc-in" ${at(T[3])}><div class="sc-folder-tab">${t.folder}</div>
    <p><span class="sc-soft">${t.code}:</span> <span class="sc-code sc-in" ${at(T[4])}>${s.code}</span></p>
    <span class="sc-stamp sc-in" ${at(T[5])}>${t.stamp}</span></div>`;
  return {
    cls: 'sc-intro', label: t.lines.map(fill).join(' '), html: fillNames(html, nameVars(s)),
    out: reduced ? 3200 : 7900, fade: reduced ? 0 : 900,
    sounds: reduced ? [] : [
      ...T.slice(0, 3).map(n => ({ cue: 'type' as const, at: n })),
      { cue: 'type', at: T[4] }, { cue: 'stamp', at: T[5] + 220 },
    ],
  };
}

/**
 * The handler is replaced: on black, the new captain's photo surfaces, the old one is gone
 * („áthelyezték”), and the house's gossip on what the new one likes. Shown once, the week it happens.
 */
export function handoverScene(before: GameState, after: GameState, c: Content, reduced = false): Scene | null {
  const h = after.handover;
  if (!h || h.week !== after.week || before.handover?.week === h.week || !after.prevCaptain) return null;
  const t = c.captain.handover;
  const T = reduced ? [0, 0, 0, 0, 0] : [300, 1200, 2700, 4300, 5900];
  const fill = (x: string) => x.replace('{elozo}', after.prevCaptain!.name);
  const lines = [...t.lines.map(fill), t.tastes[h.taste]];
  const html = `<p class="sc-title sc-in" ${at(T[0])}>${t.title}</p>
  <img class="sc-cpt sc-cpt2 sc-in" ${at(T[1])} src="${CAPTAIN2_URL}" alt="${t.photo}" width="300" height="400" decoding="async">
  <div class="sc-lines">${lines.map((l, i) => `<p class="sc-in" ${at(T[i + 2])}>${l}</p>`).join('')}</div>`;
  return {
    cls: 'sc-intro', label: fillNames([t.title, ...lines].join(' '), nameVars(after)), html: fillNames(html, nameVars(after)),
    out: reduced ? 3600 : 8200, fade: reduced ? 0 : 900,
    sounds: reduced ? [] : [{ cue: 'stamp', at: T[0] + 200 }, ...T.slice(2).map(n => ({ cue: 'type' as const, at: n }))],
  };
}

/** The scene an action leads into, if any. Pure. */
export const sceneFor = (a: Action, before: GameState, after: GameState, c: Content, reduced = false): Scene | null =>
  a.type === 'next'
    ? handoverScene(before, after, c, reduced) ?? weekScene(before, after, c, reduced) ?? quarterScene(before, after, c, reduced)
    : null;

