import { ADDRESS, CAPTAIN, GIRL, facesFor, placeholders } from '../engine/names';
import { candidates } from '../engine/observations';
import { CONS_LEVELS, type Balance, type Content, type DealTier, type ResidentId, type ResidentStatus, type Surname } from '../engine/types';

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
    if (!o.self && !o.event && !c.weeks.some(w => w.level === o.level && (!o.quarters || o.quarters.includes(w.quarter))))
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
  errs.push(...validateRecruit(c), ...validateNames(c), ...validateLoading(c), ...validateTasks(c, b), ...validateWatch(c, b), ...validateEvents(c), ...validateCons(c, b), ...validateDossier(c), ...validateHelp(c));
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
    // Given names: every candidate has the same forms, so any of them fits every text.
    const g = c.residents[id].given ?? [];
    if (g.length < 4) errs.push(`Lakó: ${id}: legalább 4 keresztnév-jelölt kell, most ${g.length} van.`);
    const keys = Object.keys(g[0] ?? {}).sort().join();
    for (const x of g) {
      if (Object.keys(x).sort().join() !== keys) errs.push(`Lakó: ${id}: a(z) „${x.n}” keresztnévnek más alakjai vannak, mint a többinek.`);
      if (!x.n || !x.b) errs.push(`Lakó: ${id}: hiányzó keresztnév vagy becenév.`);
      for (const v of Object.values(x)) if (/["'{}]/.test(v)) errs.push(`Lakó: ${id}: hibás keresztnév-alak: ${v}`);
    }
    const r = c.residents[id];
    if (!r.role || /["']/.test(r.role)) errs.push(`Lakó: ${id}: hiányzó vagy hibás szerep.`);
    if (r.age?.length !== 2 || r.age[0] > r.age[1]) errs.push(`Lakó: ${id}: hibás korhatár.`);
    else if (facesFor(c, r.sex, r.age).length < 3) errs.push(`Lakó: ${id}: legalább 3 illő arckép kell (${r.sex}, ${r.age.join('–')} év).`);
  }
  const givens = ids.flatMap(id => (c.residents[id].given ?? []).map(x => x.n));
  if (new Set(givens).size !== givens.length) errs.push('Lakó: egy keresztnév több szerepnél is szerepel.');
  // Faces: unique ids; the recruit also needs one of each sex once the residents took theirs.
  if (new Set(c.faces.map(f => f.id)).size !== c.faces.length) errs.push('Arckép: duplikált azonosító.');
  for (const sex of ['m', 'f'] as const) {
    const need = ids.filter(id => c.residents[id].sex === sex).length + 1;
    if (c.faces.filter(f => f.sex === sex).length < need) errs.push(`Arckép: kevés ${sex} arckép.`);
  }
  // The address takes „a”, never „az”, and the girl's name follows „a” too.
  const h = c.house;
  if (h.streets.length < 8) errs.push(`Cím: legalább 8 utcanév kell, most ${h.streets.length} van.`);
  for (const st of h.streets) if (/^[AÁEÉIÍOÓÖŐUÚÜŰ0-9]/i.test(st) || /["']/.test(st)) errs.push(`Cím: „${st}” mássalhangzóval kezdődjön (a „a {cim}” miatt).`);
  if (h.numbers[0] < 1 || h.numbers[0] > h.numbers[1]) errs.push('Cím: hibás házszám-tartomány.');
  if (h.girl.length < ids.length + 3) errs.push(`Lány: legalább ${ids.length + 3} vezetéknév-jelölt kell.`);
  for (const n of h.girl) if (/^[AÁEÉIÍOÓÖŐUÚÜŰ]/.test(n.name) || !n.why || /["']/.test(n.name + n.why)) errs.push(`Lány: hibás jelölt: ${n.name}`);
  const known = new Set<string>([CAPTAIN, ADDRESS, GIRL, ...ids,
    ...ids.flatMap(id => Object.keys(c.residents[id].given?.[0] ?? {}).map(k => `${id}.${k}`))]);
  const texts: [string, string][] = [
    ...c.weeks.map(w => [w.label, w.intro] as [string, string]),
    ...c.obs.flatMap(o => [[o.id, o.text], [o.id, o.note ?? '']] as [string, string][]),
    ...c.ints.flatMap(i => [[i.id, i.text], [i.id, i.note ?? '']] as [string, string][]),
    ...ids.flatMap(id => [[id, c.residents[id].name], [id, c.residents[id].truth ?? ''], [id, c.residents[id].role ?? ''],
      [id, c.residents[id].fate?.ok ?? ''], [id, c.residents[id].fate?.bajban ?? ''], [id, c.residents[id].fate?.ruin ?? ''],
      ...Object.values(c.residents[id].cons ?? {}).map(t => [id, t])] as [string, string][]),
    ...Object.entries(c.notes.cons).map(([k, v]) => [`cons.${k}`, v] as [string, string]),
    ...c.tasks.flatMap(t => [[t.id, t.title], [t.id, t.done], [t.id, t.fail]] as [string, string][]),
    ...c.recruit.categories.map(k => [k.id, k.letter] as [string, string]),
    ...Object.entries(c.endings).flatMap(([k, e]) => [[k, e.title], [k, e.text]] as [string, string][]),
    ...Object.entries(c.notes).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string] as [string, string]),
    ...Object.entries(c.notes.watch).map(([k, v]) => [`watch.${k}`, v] as [string, string]),
    ...c.notes.repeat.map(r => [r.tag, r.note] as [string, string]),
    ...c.events.list.flatMap(e => [[e.id, e.title], [e.id, e.text]] as [string, string][]),
    ...Object.entries({ ...c.events.labels }).map(([k, v]) => [`events.${k}`, v] as [string, string]),
    ...Object.entries(c.events.betrayed).map(([k, v]) => [`betrayed.${k}`, v ?? ''] as [string, string]),
    ...Object.entries(c.events.kept).map(([k, v]) => [`kept.${k}`, v ?? ''] as [string, string]),
  ];
  for (const [where, text] of texts)
    for (const p of placeholders(text)) {
      // {obs} and {n} are filled by the UI in the caretaker's texts only.
      const local = where.startsWith('watch.') && (p === 'obs' || p === 'n');
      if (!local && !known.has(p)) errs.push(`${where}: ismeretlen helyettesítő: {${p}}`);
    }

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
  // The title card puts the quote marks and the brackets around the texts itself.
  const card = l.card;
  if (!card?.quote || !card.source || !card.skip) errs.push('Címkép: hiányzó idézet, forrás vagy gombfelirat.');
  else for (const t of [card.quote, card.source, card.skip])
    if (/["'„”()]/.test(t)) errs.push(`Címkép: a szövegben ne legyen idézőjel vagy zárójel, a felület teszi hozzá: ${t}`);
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

/** Observations about the player, drawn one per week while the caretaker reports on them. */
function validateWatch(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const self = c.obs.filter(o => o.self);
  // Enough for a whole year of being watched, so a week never goes without one.
  if (self.length < c.weeks.length) errs.push(`Ellenjelentés: legalább ${c.weeks.length} „Alulírott” megfigyelés kell, most ${self.length} van.`);
  for (const o of self) {
    if (o.who !== null || o.art !== 0) errs.push(`${o.id}: a rólad szóló megfigyelés lakó és ártalom nélküli legyen.`);
    if (o.quarters || o.requires || o.topics || o.tag) errs.push(`${o.id}: a rólad szóló megfigyelésnek nem lehet feltétele, témája vagy címkéje.`);
    if (!o.text.startsWith('Alulírott')) errs.push(`${o.id}: a rólad szóló megfigyelés „Alulírott” szóval kezdődjön.`);
  }
  for (const [k, v] of Object.entries(c.notes.watch)) {
    if (!v) errs.push(`Ellenjelentés: hiányzó szöveg: ${k}`);
    if (/["']/.test(v)) errs.push(`Ellenjelentés: egyenes idézőjel: ${v}`);
  }
  if (!c.notes.watch.hidden.includes('{obs}')) errs.push('Ellenjelentés: a „hidden” szövegből hiányzik az {obs} helyettesítő.');
  if (!c.notes.watch.epilogueSome.includes('{n}')) errs.push('Ellenjelentés: az „epilogueSome” szövegből hiányzik az {n} helyettesítő.');
  if (b.watch.calmAt <= b.watch.hBelow) errs.push('Ellenjelentés: a calmAt legyen nagyobb, mint a hBelow.');
  return errs;
}

/** House events, the observations they bring, and the alibi cards of close residents. */
function validateEvents(c: Content): string[] {
  const errs: string[] = [];
  const ev = c.events;
  const quote = (t: string) => /["']/.test(t);
  for (const [k, v] of Object.entries(ev.labels)) {
    if (!v) errs.push(`Esemény: hiányzó felirat: ${k}`);
    if (quote(v)) errs.push(`Esemény: egyenes idézőjel: ${v}`);
  }
  const quarters = new Set(c.weeks.map(w => w.quarter));
  const ids = new Set<string>();
  for (const e of ev.list) {
    if (ids.has(e.id)) errs.push(`Esemény: duplikált azonosító: ${e.id}`);
    ids.add(e.id);
    if (quote(e.title + e.text)) errs.push(`${e.id}: egyenes idézőjel az esemény szövegében.`);
    if (e.expect !== undefined && !Number.isInteger(e.expect)) errs.push(`${e.id}: az elvárás-módosítás egész szám legyen.`);
    for (const q of e.quarters ?? []) if (!quarters.has(q)) errs.push(`${e.id}: nincs ${q}. negyedév.`);
    for (const [who, sts] of Object.entries(e.requires ?? {})) {
      if (!(who in c.residents)) errs.push(`${e.id}: ismeretlen lakó a feltételben: ${who}`);
      for (const st of sts ?? []) if (!STATUSES.includes(st)) errs.push(`${e.id}: ismeretlen állapot: ${st}`);
    }
    const mine = (e.obs ?? []).map(id => c.obs.find(o => o.id === id));
    mine.forEach((o, k) => {
      if (!o) errs.push(`${e.id}: ismeretlen megfigyelés: ${e.obs![k]}`);
      else if (o.event !== e.id) errs.push(`${o.id}: az „event” mezője nem ${e.id}.`);
    });
    if (e.kind === 'kind') {
      const who = e.who;
      if (!who || !c.residents[who]?.fate) { errs.push(`${e.id}: a kedvesség csak történettel bíró lakótól jöhet.`); continue; }
      if (!mine.some(o => o?.who === who)) errs.push(`${e.id}: a kedvességhez kell egy bizalmas megfigyelés a lakóról.`);
      if (!ev.betrayed[who] || !ev.kept[who]) errs.push(`${e.id}: a(z) ${who} lakónak nincs „betrayed” vagy „kept” szövege.`);
    } else if (e.kind === 'house') {
      if (e.who) errs.push(`${e.id}: házi eseménynek nincs „who” mezője.`);
    } else errs.push(`${e.id}: ismeretlen eseményfajta: ${String(e.kind)}`);
  }
  for (const o of c.obs.filter(x => x.event)) {
    const e = ev.list.find(x => x.id === o.event);
    if (!e?.obs?.includes(o.id)) errs.push(`${o.id}: egyik esemény sem hozza (${o.event}).`);
    if (o.self || o.quarters || o.requires || o.tag) errs.push(`${o.id}: eseményhez tartozó megfigyelésnek nem lehet saját feltétele vagy címkéje.`);
  }
  // Every resident who can become close needs alibi cards, and every alibi card someone to cover.
  const close = new Set(ev.list.filter(e => e.kind === 'kind').map(e => e.who!));
  for (const who of close) {
    const n = c.ints.filter(x => x.tier === 'alibi' && x.who === who).length;
    if (n < 2) errs.push(`Alibi: a(z) ${who} lakóhoz legalább két alibi kártya kell, most ${n} van.`);
  }
  for (const it of c.ints) {
    if (it.tier === 'alibi' && (!it.who || !close.has(it.who))) errs.push(`${it.id}: az alibi kártya olyan lakóé legyen, aki megkedvelheti a játékost.`);
    if (it.tier !== 'alibi' && it.who) errs.push(`${it.id}: csak alibi kártyának lehet „who” mezője.`);
    if (it.tier === 'alibi' && it.who && placeholders(it.text).some(p => p.split('.')[0] in c.residents && p.split('.')[0] !== it.who)) errs.push(`${it.id}: az alibi más lakó nevét említi.`);
  }
  return errs;
}

/** Consequences come in three rising steps; every resident who can face them has all three texts. */
function validateCons(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const at = CONS_LEVELS.map(l => b.consequences[l]);
  if (at.some(x => !Number.isFinite(x) || x <= 0) || at.some((x, i) => i && x <= at[i - 1]))
    errs.push(`Következmény: a küszöbök pozitívak és szigorúan növekvők legyenek (${at.join(', ')}).`);
  for (const l of CONS_LEVELS) if (!c.notes.cons?.[l] || /["']/.test(c.notes.cons[l])) errs.push(`Következmény: hiányzó vagy hibás felirat: ${l}`);
  for (const [id, r] of Object.entries(c.residents)) {
    if (!r.cons) continue;
    for (const l of CONS_LEVELS) {
      const t = r.cons[l];
      if (!t) errs.push(`Lakó: ${id}: hiányzik a(z) „${l}” következmény.`);
      else if (/["']/.test(t)) errs.push(`Lakó: ${id}: egyenes idézőjel a(z) „${l}” következményben.`);
    }
    if (r.fate && !r.fate.ruin) errs.push(`Lakó: ${id}: hiányzik a „fate.ruin” szöveg.`);
  }
  return errs;
}

/** The end-of-game file: every label present, no straight quotes, the one counter placeholder. */
function validateDossier(c: Content): string[] {
  const errs: string[] = [];
  for (const [k, v] of Object.entries(c.dossier)) {
    if (!v) errs.push(`Akta: hiányzó szöveg: ${k}`);
    if (/["']/.test(v)) errs.push(`Akta: egyenes idézőjel: ${v}`);
    if (k !== 'onYou' && /\{/.test(v)) errs.push(`Akta: helyettesítő csak az „onYou” szövegben lehet: ${k}`);
  }
  if (!c.dossier.onYou.includes('{n}')) errs.push('Akta: az „onYou” szövegből hiányzik az {n}.');
  if (!/^[a-z0-9-]+$/.test(c.dossier.file)) errs.push('Akta: a fájlnév-előtag csak kisbetű, szám és kötőjel lehet.');
  return errs;
}

/**
 * The help explains the rules but gives nothing away: no numbers, no resident's secret,
 * no ending's name. Each check guards one kind of spoiler.
 */
function validateHelp(c: Content): string[] {
  const errs: string[] = [];
  const h = c.help;
  const texts = [h.button, h.title, h.lede, h.close, ...h.sections.flatMap(s => [s.title, ...s.text])];
  if (!h.sections.length) errs.push('Súgó: nincs egy szakasz sem.');
  for (const t of texts) {
    if (!t) errs.push('Súgó: üres szöveg.');
    if (/["']/.test(t)) errs.push(`Súgó: egyenes idézőjel: ${t}`);
    if (/[{}]/.test(t)) errs.push(`Súgó: a súgóban nincs helyettesítő: ${t}`);
    if (/\d/.test(t)) errs.push(`Súgó: számot ne áruljon el: ${t}`);
  }
  const all = texts.join(' ').toLowerCase();
  for (const e of Object.values(c.endings))
    if (all.includes(e.title.toLowerCase()) && e.title !== c.loading.card.quote) errs.push(`Súgó: elárulja a(z) „${e.title}” befejezést.`);
  // The secrets behind the residents' stories: the words their truths turn on.
  for (const word of ['kávé', 'hintá', 'petőfi', 'versei', 'sógornő', 'trabant'])
    if (all.includes(word)) errs.push(`Súgó: elárul egy titkot (${word}).`);
  return errs;
}
