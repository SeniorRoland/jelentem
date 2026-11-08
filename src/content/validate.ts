import { placeholders } from '../engine/names';
import type { Balance, Content, ResidentId, Surname, Tier } from '../engine/types';

/** Returns a list of human-readable problems. Empty list = content is consistent. */
export function validateContent(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const dup = (id: string) => { if (ids.has(id)) errs.push(`Duplikált azonosító: ${id}`); ids.add(id); };

  if (c.weeks.length !== b.expect.length)
    errs.push(`A hetek száma (${c.weeks.length}) nem egyezik a balance.expect hosszával (${b.expect.length}).`);

  c.weeks.forEach((w, wi) => {
    if (w.obs.length < b.slotsPerWeek) errs.push(`${wi + 1}. hét: kevesebb megfigyelés, mint mondathely.`);
    for (const o of w.obs) {
      dup(o.id);
      if (o.who && !(o.who in c.residents)) errs.push(`${o.id}: ismeretlen lakó: ${o.who}`);
      if (/["']/.test(o.text)) errs.push(`${o.id}: egyenes idézőjel a szövegben, használj „ ” jeleket.`);
      if (o.text.endsWith('.')) errs.push(`${o.id}: a megfigyelés ne végződjön ponttal, a motor teszi hozzá.`);
    }
  });

  for (const it of c.ints) {
    dup(it.id);
    if (/["']/.test(it.text)) errs.push(`${it.id}: egyenes idézőjel a szövegben.`);
    if (it.text.endsWith('.')) errs.push(`${it.id}: az értelmezés ne végződjön ponttal.`);
  }
  (Object.keys(b.deal) as Tier[]).forEach(t => {
    const n = c.ints.filter(x => x.tier === t).length;
    if (n < b.deal[t]) errs.push(`Kevés „${t}” értelmezés: ${n} < ${b.deal[t]}`);
  });

  for (const r of c.notes.repeat) {
    if (!ids.has(r.obs) || !ids.has(r.ifReported)) errs.push(`Ismétlés-jegyzet ismeretlen megfigyelésre hivatkozik: ${r.obs}/${r.ifReported}`);
  }
  errs.push(...validateRecruit(c), ...validateNames(c));
  return errs;
}

/** The recruitment card generator must always find a coherent combination. */
function validateRecruit(c: Content): string[] {
  const errs: string[] = [];
  const r = c.recruit;
  const texts: string[] = [
    ...r.surnames.flatMap(s => [s.name, s.why]), ...r.givenNames.m, ...r.givenNames.f,
    ...r.places.flatMap(x => [x.name, x.from]), ...r.months, r.combo, ...r.methods,
    ...r.occupations.flatMap(o => [o.job, ...o.workplace, ...o.school]),
    ...r.categories.map(k => k.label),
    ...Object.values(r.bases).flatMap(x => [x.text, x.short]),
  ];
  for (const t of texts) if (/["']/.test(t)) errs.push(`Karton: egyenes idézőjel: ${t}`);
  if (r.months.length !== 12) errs.push('Karton: 12 hónapnév kell.');

  const occIds = new Set(r.occupations.map(o => o.id));
  const catIds = new Set(r.categories.map(k => k.id));
  const schools = new Set(r.occupations.flatMap(o => o.school));

  // Surnames: each must come from a real trait, and every recruit must get one.
  if (r.surnames.length < 30) errs.push(`Karton: legalább 30 vezetéknév kell, most ${r.surnames.length} van.`);
  const seen = new Set<string>();
  for (const s of r.surnames) {
    if (seen.has(s.name)) errs.push(`Karton: duplikált vezetéknév: ${s.name}`);
    seen.add(s.name);
    if (!s.jobs && !s.categories && !s.schools && s.bornMin === undefined && s.bornMax === undefined)
      errs.push(`Karton: a(z) „${s.name}” vezetéknév nem kötődik tulajdonsághoz.`);
    for (const j of s.jobs ?? []) if (!occIds.has(j)) errs.push(`Karton: „${s.name}”: ismeretlen foglalkozás: ${j}`);
    for (const k of s.categories ?? []) if (!catIds.has(k)) errs.push(`Karton: „${s.name}”: ismeretlen kategória: ${k}`);
    for (const x of s.schools ?? []) if (!schools.has(x)) errs.push(`Karton: „${s.name}”: ismeretlen végzettség: ${x}`);
  }
  const only = (s: Surname) => [s.jobs, s.categories, s.schools, s.bornMin, s.bornMax].filter(x => x !== undefined).length === 1;
  for (const o of r.occupations)
    if (!r.surnames.some(s => only(s) && s.jobs?.includes(o.id))) errs.push(`Karton: a(z) ${o.id} foglalkozáshoz nincs vezetéknév.`);
  for (const k of r.categories)
    if (!r.surnames.some(s => only(s) && s.categories?.includes(k.id))) errs.push(`Karton: a(z) ${k.id} kategóriához nincs vezetéknév.`);
  for (const x of r.places)
    if (!x.from.startsWith(x.name.slice(0, 3))) errs.push(`Karton: a(z) „${x.from}” név nem a(z) „${x.name}” helységből képződik.`);

  for (const o of r.occupations) {
    if (!o.workplace.length || !o.school.length) errs.push(`Karton: a(z) ${o.id} foglalkozásnál hiányzik munkahely vagy végzettség.`);
  }
  const schemes = [r.classes.before1972, r.classes.from1972];
  for (const k of r.categories) {
    for (const j of k.jobs ?? []) if (!occIds.has(j)) errs.push(`Karton: a(z) ${k.id} kategória ismeretlen foglalkozásra hivatkozik: ${j}`);
    if (k.jobs && !k.jobs.length) errs.push(`Karton: a(z) ${k.id} kategória foglalkozáslistája üres.`);
    if (k.born.length !== 2) errs.push(`Karton: a(z) ${k.id} kategória születési éve két számból álljon.`);
    if (k.born[0] > k.born[1]) errs.push(`Karton: a(z) ${k.id} kategória születési évei fordítva vannak.`);
    if (k.born[1] > 1953) errs.push(`Karton: a(z) ${k.id} kategóriában 1971-ben kiskorú is lehetne.`);
    for (const s of schemes) if (!s.some(x => x.loyal === k.loyal)) errs.push(`Karton: a(z) ${k.id} kategóriához nincs illő osztályozás valamelyik időszakban.`);
  }
  for (const s of schemes) for (const x of s) {
    if (!x.bases.length) errs.push(`Karton: a(z) ${x.id} osztályozásnak nincs beszervezési alapja.`);
    for (const b of x.bases) if (!(b in r.bases)) errs.push(`Karton: a(z) ${x.id} ismeretlen alapra hivatkozik: ${b}`);
  }
  return errs;
}

/** Residents' family names are generated; texts refer to them with `{id}` placeholders. */
function validateNames(c: Content): string[] {
  const errs: string[] = [];
  const ids = Object.keys(c.residents) as ResidentId[];
  // Every resident must find a free name even if all others and the recruit took one of its own.
  for (const id of ids) {
    const list = c.residents[id].surnames;
    if (list.length < ids.length + 1) errs.push(`Lakó: ${id}: legalább ${ids.length + 1} vezetéknév-jelölt kell, most ${list.length} van.`);
    if (new Set(list.map(n => n.name)).size !== list.length) errs.push(`Lakó: ${id}: ismétlődő vezetéknév-jelölt.`);
    for (const n of list) if (/["']/.test(n.name + n.why)) errs.push(`Lakó: ${id}: egyenes idézőjel: ${n.name}`);
    if (!placeholders(c.residents[id].name).includes(id)) errs.push(`Lakó: ${id}: a névben nincs {${id}} helyettesítő.`);
  }
  const texts: [string, string][] = [
    ...c.weeks.flatMap(w => [[w.label, w.intro], ...w.obs.flatMap(o => [[o.id, o.text], [o.id, o.note ?? '']])] as [string, string][]),
    ...c.ints.flatMap(i => [[i.id, i.text], [i.id, i.note ?? '']] as [string, string][]),
    ...ids.flatMap(id => [[id, c.residents[id].name], [id, c.residents[id].cons ?? ''], [id, c.residents[id].truth ?? '']] as [string, string][]),
    ...Object.entries(c.endings).flatMap(([k, e]) => [[k, e.title], [k, e.text]] as [string, string][]),
    ...Object.entries(c.notes).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string] as [string, string]),
    ...c.notes.repeat.map(r => [r.obs, r.note] as [string, string]),
  ];
  for (const [where, text] of texts)
    for (const p of placeholders(text)) if (!ids.includes(p as ResidentId)) errs.push(`${where}: ismeretlen helyettesítő: {${p}}`);
  return errs;
}
