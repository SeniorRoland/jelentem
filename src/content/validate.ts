import { CAPTAIN, placeholders } from '../engine/names';
import { candidates } from '../engine/observations';
import type { Balance, Content, DealTier, ResidentId, ResidentStatus, Surname } from '../engine/types';

const STATUSES: ResidentStatus[] = ['nyugodt', 'gyanus', 'bajban'];

/** Returns a list of human-readable problems. Empty list = content is consistent. */
export function validateContent(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const dup = (id: string) => { if (ids.has(id)) errs.push(`Duplikált azonosító: ${id}`); ids.add(id); };

  if (c.weeks.length !== b.expect.length)
    errs.push(`A hetek száma (${c.weeks.length}) nem egyezik a balance.expect hosszával (${b.expect.length}).`);

  for (const o of c.obs) {
    dup(o.id);
    if (o.who && !(o.who in c.residents)) errs.push(`${o.id}: ismeretlen lakó: ${o.who}`);
    if (o.who && !o.text.includes(`{${o.who}}`)) errs.push(`${o.id}: a szövegben nincs {${o.who}} helyettesítő.`);
    if (/["']/.test(o.text + (o.note ?? ''))) errs.push(`${o.id}: egyenes idézőjel a szövegben, használj „ ” jeleket.`);
    if (/\.”?$/.test(o.text)) errs.push(`${o.id}: a megfigyelés ne végződjön ponttal, a motor tesz utána pontot.`);
    const quarters = new Set(c.weeks.map(w => w.quarter));
    for (const q of o.quarters ?? []) if (!quarters.has(q)) errs.push(`${o.id}: nincs ${q}. negyedév (0-tól számozva).`);
    if (!c.weeks.some(w => w.level === o.level && (!o.quarters || o.quarters.includes(w.quarter))))
      errs.push(`${o.id}: egyik hét sem illik hozzá (szint, negyedév), a megfigyelés sosem kerül elő.`);
    for (const [who, sts] of Object.entries(o.requires ?? {})) {
      if (who !== o.who) errs.push(`${o.id}: feltétel csak a saját lakójára vonatkozhat (${who}).`);
      for (const st of sts ?? []) if (!STATUSES.includes(st)) errs.push(`${o.id}: ismeretlen állapot: ${st}`);
      if (!c.residents[who as ResidentId]?.fate) errs.push(`${o.id}: a(z) ${who} lakónak elágazó története van, de nincs „fate” szövege.`);
    }
  }

  // Weeks and quarters.
  c.weeks.forEach((w, wi) => {
    const prev = wi ? c.weeks[wi - 1].quarter : 0;
    if (w.quarter !== prev && w.quarter !== prev + 1) errs.push(`${wi + 1}. hét: a negyedévek sorban kövessék egymást.`);
    if (w.slots.length < Math.max(...b.ranks.map(r => r.slots))) errs.push(`${wi + 1}. hét: kevesebb megfigyelés-hely, mint a legtöbb mondathely.`);
    for (const slot of w.slots) for (const who of slot) if (who && !(who in c.residents)) errs.push(`${wi + 1}. hét: ismeretlen lakó a helyen: ${who}`);
  });
  const lastQ = c.weeks[c.weeks.length - 1].quarter;
  if (c.weeks[0].quarter !== 0) errs.push('Az első hét a 0. negyedévben legyen.');
  if (c.career.quarters.length < lastQ + 1) errs.push(`Kevés negyedévnév a career.json-ban (${c.career.quarters.length} < ${lastQ + 1}).`);

  // Every slot must always find a fresh observation, whatever state the reports left the residents in:
  // each candidate set needs one more variant than the weeks that draw from it.
  c.weeks.forEach((w, wi) => w.slots.forEach(slot => {
    const anyState = (x: typeof w) => new Set(candidates(c, x, slot).map(o => o.id));
    for (const st of STATUSES) {
      const statuses = Object.fromEntries(slot.filter(Boolean).map(id => [id, st]));
      const mine = candidates(c, w, slot, statuses);
      const sharing = c.weeks.filter(x => x.slots.some(sl => sl.join() === slot.join()) && mine.some(o => anyState(x).has(o.id))).length;
      if (mine.length < sharing + 1)
        errs.push(`${wi + 1}. hét, ${slot.map(String).join('/')}, „${st}” állapot: ${mine.length} megfigyelés, legalább ${sharing + 1} kell.`);
    }
  }));

  // Ranks and quarterly grading.
  if (b.ranks.length !== c.career.ranks.length) errs.push(`A rangok száma eltér: balance ${b.ranks.length}, career ${c.career.ranks.length}.`);
  if (b.startRank < 0 || b.startRank >= b.ranks.length) errs.push('A balance.startRank nem létező rang.');
  c.career.ranks.forEach((r, i) => {
    if (i > 0 && !r.promo) errs.push(`A(z) ${i}. rangnak nincs előléptetési szövege.`);
    if (i < c.career.ranks.length - 1 && !r.demo) errs.push(`A(z) ${i}. rangnak nincs lefokozási szövege.`);
  });
  for (const t of [c.career.stay, ...c.career.quarters, ...c.career.ranks.flatMap(r => [r.label, r.promo, r.demo]),
    ...Object.values(c.career.grades).flatMap(g => [g.title, g.note])])
    if (/["']/.test(t)) errs.push(`Karrier: egyenes idézőjel: ${t}`);

  for (const it of c.ints) {
    dup(it.id);
    if (/["']/.test(it.text)) errs.push(`${it.id}: egyenes idézőjel a szövegben.`);
    if (it.text.endsWith('.')) errs.push(`${it.id}: az értelmezés ne végződjön ponttal.`);
    if (!/^(ami|amel|mely|és )/.test(it.text)) errs.push(`${it.id}: az értelmezés „ami…”, „amely…” vagy „és…” kezdetű legyen.`);
  }
  (Object.keys(b.deal) as DealTier[]).forEach(t => {
    const n = c.ints.filter(x => x.tier === t).length;
    if (n < b.deal[t]) errs.push(`Kevés „${t}” értelmezés: ${n} < ${b.deal[t]}`);
  });

  for (const r of c.notes.repeat) {
    const tagged = c.obs.filter(o => o.tag === r.tag);
    if (new Set(tagged.map(o => o.level)).size < 2) errs.push(`Ismétlés-jegyzet („${r.tag}”): legalább két különböző szintű megfigyelés kell ezzel a címkével.`);
  }
  for (const o of c.obs) if (o.tag && !c.notes.repeat.some(r => r.tag === o.tag)) errs.push(`${o.id}: a(z) „${o.tag}” címkéhez nincs ismétlés-jegyzet.`);
  errs.push(...validateRecruit(c), ...validateNames(c), ...validateLoading(c), ...validateTasks(c, b));
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
    ...c.weeks.map(w => [w.label, w.intro] as [string, string]),
    ...c.obs.flatMap(o => [[o.id, o.text], [o.id, o.note ?? '']] as [string, string][]),
    ...c.ints.flatMap(i => [[i.id, i.text], [i.id, i.note ?? '']] as [string, string][]),
    ...ids.flatMap(id => [[id, c.residents[id].name], [id, c.residents[id].cons ?? ''], [id, c.residents[id].truth ?? '']] as [string, string][]),
    ...Object.entries(c.endings).flatMap(([k, e]) => [[k, e.title], [k, e.text]] as [string, string][]),
    ...Object.entries(c.notes).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string] as [string, string]),
    ...c.notes.repeat.map(r => [r.tag, r.note] as [string, string]),
  ];
  for (const [where, text] of texts)
    for (const p of placeholders(text)) if (p !== CAPTAIN && !ids.includes(p as ResidentId)) errs.push(`${where}: ismeretlen helyettesítő: {${p}}`);

  // The handler takes his name last, after the recruit and every resident took theirs.
  const cap = c.captain.surnames;
  if (cap.length < ids.length + 2) errs.push(`Százados: legalább ${ids.length + 2} vezetéknév-jelölt kell, most ${cap.length} van.`);
  if (new Set(cap.map(n => n.name)).size !== cap.length) errs.push('Százados: ismétlődő vezetéknév-jelölt.');
  for (const n of cap) if (/["']/.test(n.name + n.why) || !n.why) errs.push(`Százados: hiányos vagy egyenes idézőjeles jelölt: ${n.name}`);
  return errs;
}

/** The loading screen draws LOADING_STEPS steps and one setback per load. */
export const LOADING_STEPS = 6;
function validateLoading(c: Content): string[] {
  const errs: string[] = [];
  const l = c.loading;
  if (l.steps.length < LOADING_STEPS) errs.push(`Betöltés: legalább ${LOADING_STEPS} lépés kell, most ${l.steps.length} van.`);
  if (!l.setbacks.length) errs.push('Betöltés: legalább egy visszaesés kell.');
  for (const t of [...Object.values(l).filter(v => typeof v === 'string'), ...l.steps, ...l.setbacks] as string[])
    if (/["']/.test(t)) errs.push(`Betöltés: egyenes idézőjel: ${t}`);
  for (const t of [...l.steps, ...l.setbacks])
    if (/[.…]$/.test(t)) errs.push(`Betöltés: a lépés ne végződjön ponttal vagy három ponttal (a felület teszi hozzá): ${t}`);
  return errs;
}

/** Category profiles and quarterly tasks with their diversion cards. */
function validateTasks(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const cats = c.recruit.categories.map(k => k.id);
  for (const id of cats) if (!b.categories[id]) errs.push(`Kategória: a(z) ${id} kategóriának nincs profilja a balance.json-ban.`);
  for (const id of Object.keys(b.categories)) if (!cats.includes(id)) errs.push(`Kategória: ismeretlen kategória a balance.json-ban: ${id}`);
  for (const k of c.recruit.categories) {
    if (!k.letter) errs.push(`Kategória: a(z) ${k.id} kategóriának nincs levélmondata.`);
    if (/["']/.test(k.letter ?? '')) errs.push(`Kategória: egyenes idézőjel: ${k.letter}`);
  }

  const topics = new Set(c.tasks.map(t => t.topic));
  const ids = new Set<string>();
  for (const t of c.tasks) {
    if (ids.has(t.id)) errs.push(`Feladat: duplikált azonosító: ${t.id}`);
    ids.add(t.id);
    for (const s of [t.title, t.done, t.fail]) if (/["']/.test(s)) errs.push(`Feladat: egyenes idézőjel: ${s}`);
    const diverts = c.ints.filter(x => x.tier === 'divert' && x.topics?.includes(t.topic)).length;
    if (diverts < 2) errs.push(`Feladat: a(z) „${t.topic}” témához legalább két terelő kártya kell, most ${diverts} van.`);
  }
  for (const it of c.ints) {
    if (it.tier === 'divert' && it.topics?.length !== 1) errs.push(`${it.id}: a terelő kártyának pontosan egy témája legyen.`);
    for (const tp of it.topics ?? []) if (!topics.has(tp)) errs.push(`${it.id}: ismeretlen feladat-téma: ${tp}`);
  }
  for (const o of c.obs) for (const tp of o.topics ?? []) if (!topics.has(tp)) errs.push(`${o.id}: ismeretlen feladat-téma: ${tp}`);

  const quarters = new Set(c.weeks.map(w => w.quarter));
  const withTask = [...quarters].filter(q => q >= b.task.fromQuarter).length;
  if (c.tasks.length < withTask) errs.push(`Feladat: ${withTask} negyedévhez kell feladat, de csak ${c.tasks.length} van.`);
  return errs;
}
