import type { Content, Medal } from '../engine/types';

/**
 * The medal drawer: what the player has earned over all their games, kept in this browser
 * (localStorage, `jelentem.erdemrendek`: id → the date it was first earned). Storage may be
 * missing or full; then medals simply are not kept, and nothing breaks.
 */

const KEY = 'jelentem.erdemrendek';

export function loadMedals(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, string> : {};
  } catch { return {}; }
}

/** Adds medals to the drawer; returns those that were not in it yet. */
export function awardMedals(ids: string[], today = new Date().toISOString().slice(0, 10)): string[] {
  const have = loadMedals();
  const fresh = ids.filter(id => !have[id]);
  if (!fresh.length) return [];
  for (const id of fresh) have[id] = today;
  try { localStorage.setItem(KEY, JSON.stringify(have)); } catch { /* not kept, nothing breaks */ }
  return fresh;
}

/** „2026-11-14” → „2026. 11. 14.” */
const day = (iso: string) => iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1. $2. $3.');

/** One medal: a ribbon in its colours, the disc, and the title; a locked one shows only its hint. Pure. */
export function medalHtml(m: Medal, c: Content, earned: string | null, fresh = false): string {
  const n = m.ribbon.length;
  const stripes = m.ribbon.map((col, i) => `${col} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`).join(',');
  return earned !== null
    ? `<li class="medal${fresh ? ' medal-new' : ''}"><span class="medal-ribbon" style="background:linear-gradient(90deg,${stripes})" aria-hidden="true"></span><span class="medal-disc" aria-hidden="true">★</span><span class="medal-body"><strong>${m.title}</strong><span>${m.text}</span>${earned ? `<small>${day(earned)}</small>` : ''}</span></li>`
    : `<li class="medal medal-locked"><span class="medal-ribbon" aria-hidden="true"></span><span class="medal-disc" aria-hidden="true">?</span><span class="medal-body"><strong>${c.medals.locked}</strong><span>${m.hint}</span></span></li>`;
}

/** „Kiérdemelve: 3 / 13”. Pure. */
export const medalCount = (c: Content, have: Record<string, string>): string => c.medals.count
  .replace('{n}', String(c.medals.list.filter(m => have[m.id]).length)).replace('{all}', String(c.medals.list.length));

/** The drawer behind the corner's „★”: every medal, earned or not. Pure. */
export function drawerHtml(c: Content, have: Record<string, string>): string {
  const t = c.medals;
  return `<form method="dialog" class="help-sheet">
  <button class="help-x" value="close" aria-label="${t.close}">×</button>
  <h1 id="medals-t">${t.title}</h1>
  <p class="lede">${t.lede}</p>
  <p class="meta">${medalCount(c, have)}</p>
  <ul class="medals">${t.list.map(m => medalHtml(m, c, have[m.id] ?? null)).join('')}</ul>
  <div class="actions"><button class="btn" value="close">${t.close}</button></div>
  </form>`;
}

/** The ending's section: the medals this year earned (the new ones marked), or how the drawer stands. Pure. */
export function endingMedalsHtml(c: Content, have: Record<string, string>, earned: string[], fresh: string[]): string {
  const t = c.medals;
  const mine = t.list.filter(m => earned.includes(m.id));
  const n = String(t.list.filter(m => have[m.id]).length);
  const body = mine.length
    ? `<p>${t.endingNew}</p><ul class="medals">${mine.map(m => medalHtml(m, c, have[m.id] ?? '', fresh.includes(m.id))).join('')}</ul>`
    : `<p>${t.endingNone.replace('{n}', n).replace('{all}', String(t.list.length))}</p>`;
  return `<section class="ending-medals" aria-labelledby="medals-e"><h2 id="medals-e">${t.endingTitle}</h2>
  ${body}
  <p class="meta">${medalCount(c, have)}</p></section>`;
}
