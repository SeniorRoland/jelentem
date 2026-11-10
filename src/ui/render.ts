import { expectFor, quarterOf, residentStatus, weekInQuarter } from '../engine/career';
import { eventOf } from '../engine/events';
import { fillNames, nameVars } from '../engine/names';
import { excuseOf } from '../engine/review';
import { scoreSentence } from '../engine/rules';
import { faceImg } from './faces';
import { weekObs } from '../engine/observations';
import { formatDate } from '../engine/recruit';
import { endingKey, TROUBLE } from '../engine/rules';
import { CONS_LEVELS } from '../engine/types';
import { nextStep } from '../engine/state';
import type { Balance, Content, GameState, Hint, HouseEvent, Meters, ResidentId, ResidentStatus } from '../engine/types';

export interface View {
  dev: boolean;
}

const HINTS: Record<Hint, string> = {
  '': 'Koppints egy cetlire, és bekerül a jelentésbe. A jelentésben lévő szövegre koppintva kiveheted.',
  slotsFull: 'Minden mondathely betelt. Vegyél ki egy megfigyelést, ha cserélnél.',
  needObs: 'Előbb válassz egy megfigyelést, amihez az értelmezés tartozik.',
  intsFull: 'Minden mondatnak van már értelmezése. Vegyél ki egyet, ha cserélnél.',
};

export const STATUS_LABEL: Record<ResidentStatus, string> = { nyugodt: 'nyugodt', gyanus: 'szóba került', bajban: 'bajban' };
const STORY: ResidentId[] = ['mari', 'jozsi', 'pityu'];

/** The handler's initial under his margin notes: „V. szds.” */
const sig = (s: GameState) => `${s.captain.name[0]}. szds.`;

export const bar = (v: number) => { const n = Math.round(v / 10); return '█'.repeat(n) + '░'.repeat(10 - n); };
const level = (v: number) => (v >= 70 ? 'magas' : v >= 40 ? 'közepes' : v >= 20 ? 'alacsony' : 'kritikus');

function meters(m: Meters, prev: Meters | null, v: View): string {
  const rows: [string, keyof Meters][] = [['A százados elégedettsége', 'E'], ['Hihetőséged', 'H'], ['Lelkiismereted', 'L']];
  return `<dl class="meters">${rows.map(([label, k]) => {
    const val = m[k];
    let d = '';
    if (prev) {
      const diff = val - prev[k];
      if (diff > 0) d = `<span class="delta-up" aria-label="nőtt">▲${v.dev ? ' +' + diff : ''}</span>`;
      else if (diff < 0) d = `<span class="delta-down" aria-label="csökkent">▼${v.dev ? ' ' + diff : ''}</span>`;
    }
    return `<dt>${label}</dt><dd><span class="bar" aria-hidden="true">${bar(val)}</span><span class="level">${level(val)}${v.dev ? ` (${val})` : ''}</span>${d}</dd>`;
  }).join('')}</dl>`;
}

const head = (s: GameState) =>
  `<div class="letterhead"><div>Belügyminisztérium III/III. Csoportfőnökség<br>Alsóbürokráci Osztály<br>Ügyiratszám: 34-${(s.week + 1) * 17}/1979</div><div class="secret">SZIGORÚAN TITKOS!</div></div>`;

/** The recruitment card, after the 1970s „Beszervezési karton” forms: printed labels, typed data on dotted lines. */
function karton(s: GameState, c: Content, v: View): string {
  const r = s.recruit;
  const rows: [string, string][] = [
    ['Családi és utóneve', r.name],
    ['Születési éve', String(r.birthYear)],
    ['Születési helye', r.birthPlace],
    ['Anyja neve', r.mother],
    ['Foglalkozása', r.job],
    ['Munkahelye', r.workplace],
    ['Iskolai végzettsége', r.school],
    ['Milyen kategóriába tartozik', r.category],
    ['Beszervezés ideje', formatDate(r.recruitedOn, c)],
    ['Osztályozása', r.classLabel],
    ['Beszervezés alapja', r.basis],
    ['Fedőneve', s.code],
  ];
  return `<section class="karton" aria-labelledby="karton-t">
  <div class="k-head"><p class="k-secret">Szigorúan titkos!<br>Különösen fontos!</p><h2 id="karton-t" class="k-title">Beszervezési karton</h2>${faceImg(s.face, 'A beszervezett fényképe', 'k-photo')}</div>
  <dl class="k-fields">${rows.map(([k, val], i) => `<div class="k-row"><dt>${k}:</dt><dd><span class="k-val">${val}</span>${v.dev && i === 0 ? `<span class="dev">a név oka: ${r.nameWhy}</span>` : ''}</dd></div>`).join('')}</dl>
  <div class="k-foot"><span class="k-serial"><span class="sr-only">Sorszám: </span>${r.serial}</span><button class="btn quiet" data-action="reroll" data-id="code">Másik fedőnév</button></div>
  </section>`;
}

/** The residents to watch, as on a file sheet: portrait, name, age, what they do. */
function people(s: GameState, c: Content, v: View): string {
  const ids = Object.keys(c.residents) as ResidentId[];
  return `<ul class="people">${ids.map(k => {
    const r = c.residents[k], p = s.people[k];
    const dev = v.dev ? `<span class="dev">a név oka: ${s.names[k].why}</span>` : '';
    return `<li>${faceImg(p.face, '', 'face big')}<div><strong>${r.name}</strong><br><span class="meta">${p.age} éves, ${r.role}</span>${dev}</div></li>`;
  }).join('')}</ul>`;
}

/** A portrait next to a sentence: the resident's, the player's own, or an empty frame for the common areas. */
function faceOf(s: GameState, c: Content, who: ResidentId | 'self' | null): string {
  if (who === 'self') return faceImg(s.face, 'Alulírott', 'face');
  if (!who) return '<span class="face none" aria-hidden="true"></span>';
  return faceImg(s.people[who].face, c.residents[who].name, 'face');
}
const sentenceFace = (s: GameState, c: Content, o: { who: ResidentId | null; self?: boolean } | null) =>
  o ? faceOf(s, c, o.self ? 'self' : o.who) : '<span class="face none" aria-hidden="true"></span>';

function intro(s: GameState, c: Content, v: View): string {
  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">Jelentem, nem történt semmi</h1>
  <p class="lede">Alsóbürokrác, 1979 tavasza.</p>
  <p>Elvtárs!</p>
  <p>Önt ${s.recruit.recruitedOn.slice(0, 4)}-ben társadalmi kapcsolatként beszervezték. Azóta érdemi jelentést nem adott, dossziéja a polcon porosodott. Ügyét a mai nappal átvettem. Feladata, hogy hetente jelentést írjon a {cim} lakóiról. A megfigyelendő személyek adatait mellékelem.</p>
  <p>${c.recruit.categories.find(k => k.id === s.recruit.categoryId)?.letter ?? ''}</p>
  <p>Az elvtárs munkáját bizalommal várjuk.</p>
  <span class="sig">{szazados} százados</span>${v.dev ? `<span class="dev">a százados nevének oka: ${s.captain.why}</span>` : ''}
  <h2>Megfigyelendő személyek</h2>
  ${people(s, c, v)}
  ${karton(s, c, v)}
  <h2>Hogyan működik</h2>
  <p>Minden héten megfigyeléseket kapsz a házból. A jelentésed két mondatból áll: válassz egy megfigyelést, majd tegyél mellé egy értelmezést.</p>
  <p>A százados izgalmas jelentést vár, és hétről hétre többet. Ha viszont túlzol, elveszíted a hihetőségedet, és ha valakire terhelő dolgot írsz, annak baja lesz. A legjobb besúgó sokat ír, és semmit sem mond.</p>
  <p>Az év négy negyedévből áll, mindegyik három hétből. A negyedév végén a százados értékel: a kiváló munkáért előléptetés jár, ami több mondatot és nagyobb elvárást jelent, a hiányosért lefokozás. A lakók élete közben megy tovább, és hogy merre, az a jelentéseiden múlik.</p>
  <p class="fine">A játék minden lépés után mentődik ebben a böngészőben.</p>
  <div class="actions"><button class="btn" data-action="start">Munkába állok</button></div>
  <p class="fine">Ez egy szatirikus játék. A szereplők, a ház, a város és a százados kitaláltak.</p>
  </article>`;
}

/** The captain's open order for the quarter, on the weekly sheet. */
function taskBox(s: GameState, c: Content): string {
  const t = s.task && c.tasks.find(x => x.id === s.task!.id);
  if (!t) return '';
  const st = s.task!.done ? c.career.task.done : c.career.task.open;
  return `<aside class="task" aria-label="${c.career.task.title}"><h2>${c.career.task.title}</h2><p class="task-order">${t.title}</p><p class="meta">Állapot: ${st}</p></aside>`;
}

/**
 * The candidate resident's duty: the other informant's report, sentence by sentence. A tap strikes a
 * sentence out (or puts it back); the week's justifications go to the struck ones in order.
 */
function reviewBox(s: GameState, c: Content, b: Balance, v: View): string {
  const r = s.review;
  if (!r) return '';
  const t = c.review;
  const used = r.struck.filter(Boolean).length;
  const items = r.items.map((x, idx) => {
    const o = c.obs.find(y => y.id === x.o)!;
    const it = c.ints.find(y => y.id === x.i)!;
    const excuse = excuseOf(r, idx);
    const tag = r.struck[idx] ? `<small class="rv-why">${t.struck}. ${excuse ? `${t.excuse}: ${excuse}` : `<span class="rv-none">${t.noExcuse}</span>`}</small>` : '';
    const dev = v.dev ? `<span class="dev">ártalom ${scoreSentence(o, it, b).harm}</span>` : '';
    return `<li><button class="rv-item${r.struck[idx] ? ' struck' : ''}" data-action="strike" data-idx="${idx}" aria-pressed="${r.struck[idx]}"><span class="rv-text">${o.text}, ${it.text}.</span>${tag}${dev}</button></li>`;
  }).join('');
  return `<section class="review" aria-labelledby="rv-t"><h2 id="rv-t">${t.title}</h2>
  <p class="meta">${t.lede.replace('{peer}', s.peer ?? '')}</p>
  <ol class="rv-list">${items}</ol>
  <p class="meta">${t.left}: ${Math.max(0, r.excuses.length - used)} / ${r.excuses.length}</p></section>`;
}

/** What happened in the house this week; a kindness also explains the trust it brings. */
function eventBox(e: HouseEvent, c: Content, v: View): string {
  const dev = v.dev && e.expect ? ` <span class="dev">(elvárás ${e.expect > 0 ? '+' : ''}${e.expect})</span>` : '';
  return `<aside class="event${e.kind === 'kind' ? ' kind' : ''}" aria-label="${c.events.labels.title}"><h2>${c.events.labels.title}: ${e.title}</h2><p>${e.text}${dev}</p>${e.kind === 'kind' ? `<p class="meta">${c.events.labels.bond}</p>` : ''}</aside>`;
}

function week(s: GameState, c: Content, b: Balance, v: View): string {
  const w = c.weeks[s.week];
  const pool = weekObs(s, c);
  const obs = (id: string) => pool.find(x => x.id === id)!;
  const int = (id: string) => c.ints.find(x => x.id === id)!;
  const placedO = new Set(s.slots.map(x => x.o).filter(Boolean));
  const placedI = new Set(s.slots.map(x => x.i).filter(Boolean));

  const ev = eventOf(s, c);
  const L = c.events.labels;
  const who = (o: typeof pool[number]) => o.who ? c.residents[o.who].name : 'Közös terület';
  const obsLabel = (o: typeof pool[number]) => o.self ? c.notes.watch.label
    : o.event && ev?.kind === 'kind' ? `${L.confidential} · ${who(o)}` : who(o);
  const obsClass = (o: typeof pool[number]) => o.self ? ' self' : o.event ? (ev?.kind === 'kind' ? ' confidential' : ' event') : '';
  const obsSlips = pool.map(o => `<button class="slip${obsClass(o)}" data-action="toggleObs" data-id="${o.id}" aria-pressed="${placedO.has(o.id)}">${o.text}.<small>${obsLabel(o)}</small>${v.dev ? `<span class="dev">izgalom ${o.izg}, ártalom ${o.art}</span>` : ''}</button>`).join('');
  const intSlips = s.dealt.map(id => {
    const it = int(id);
    const tag = it.tier === 'divert' ? `<small>${c.career.task.divert}</small>`
      : it.tier === 'alibi' && it.who ? `<small>${L.alibi} · ${c.residents[it.who].name}</small>` : '';
    const cls = it.tier === 'divert' || it.tier === 'alibi' ? ` ${it.tier}` : '';
    return `<button class="slip${cls}" data-action="toggleInt" data-id="${id}" aria-pressed="${placedI.has(id)}">…, ${it.text}.${tag}${v.dev ? `<span class="dev">izgalom ${it.izg}, hihetőség ${it.hih}, ártalom ×${it.mult}</span>` : ''}</button>`;
  }).join('');

  const sentences = s.slots.map((sl, idx) => {
    const o = sl.o
      ? `<button class="part" data-action="unplace" data-slot="${idx}" data-part="o" aria-label="Megfigyelés kivétele">${obs(sl.o).text}</button>`
      : `<span class="blank">………………… (megfigyelés)</span>`;
    const i = sl.i
      ? `, <button class="part" data-action="unplace" data-slot="${idx}" data-part="i" aria-label="Értelmezés kivétele">${int(sl.i).text}</button>.`
      : sl.o ? `<span class="blank">, ………………… (értelmezés, ha akarod)</span>.` : `<span class="blank">, ………………… (értelmezés)</span>`;
    return `<li class="with-face">${sentenceFace(s, c, sl.o ? obs(sl.o) : null)}<span>${o}${i}</span></li>`;
  }).join('');

  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">Jelentés, ${weekInQuarter(s, c)}. hét</h1>
  <p class="meta">Fedőnév: ${s.code}</p>
  <p class="meta">Időszak: ${w.label} (${c.career.quarters[w.quarter]})</p>
  <p class="meta">Besorolás: ${c.career.ranks[s.rank].label}</p>
  <p class="meta">Tárgy: a {cim} lakói</p>
  ${v.dev ? `<p class="dev">elvárás ezen a héten: ${expectFor(s, b, c)}</p>` : ''}
  ${meters(s.meters, null, v)}
  <p class="lede" style="margin-top:1.25rem">${w.intro}</p>
  ${ev ? eventBox(ev, c, v) : ''}
  ${taskBox(s, c)}
  <h2>Megfigyelések a héten</h2>
  ${s.watched ? `<p class="hint watch">${c.notes.watch.weekHint}</p>` : ''}
  <div class="slips">${obsSlips}</div>
  <h2>Kéznél lévő értelmezések</h2>
  <div class="slips">${intSlips}</div>
  <h2>A jelentés szövege</h2>
  <div class="report"><ol>${sentences}</ol></div>
  ${reviewBox(s, c, b, v)}
  <p class="hint" aria-live="polite">${HINTS[s.hint]}</p>
  <div class="actions"><button class="btn" data-action="submit">Jelentés leadása</button></div>
  </article>`;
}

/** On the reply: the other report as it went on, struck sentences crossed out with their justification. */
function reviewResult(s: GameState, c: Content): string {
  const r = s.last?.review;
  if (!r) return '';
  const t = c.review;
  return `<h2>${t.title}</h2><p class="meta">${t.lede.split('.')[0].replace('{peer}', r.peer)}.</p>
  <ol class="rv-list rv-done">${r.sents.map(x => `<li class="${x.struck ? 'struck' : ''}"><span class="rv-text">${x.text}</span>${x.struck
    ? `<small class="rv-why">${t.struck}. ${x.excuse ? `${t.excuse}: ${x.excuse}` : ''}</small>${x.excuse ? '' : `<span class="note">${t.noExcuse}</span>`}`
    : `<small class="rv-why">${t.kept}</small>`}</li>`).join('')}</ol>`;
}

function response(s: GameState, c: Content, v: View): string {
  const r = s.last!;
  const body = r.sents.length
    ? `<ol>${r.sents.map(x => `<li class="with-face">${faceOf(s, c, x.self ? 'self' : x.who)}<span>${x.text}${x.note ? `<span class="note">${x.note}</span>` : ''}</span></li>`).join('')}</ol>`
    : `<p>Jelentem, a megfigyelt időszakban nem történt semmi.</p>`;
  const items = [...r.betrayed.map(k => c.events.betrayed[k] ?? ''), ...r.steps.map(x => c.residents[x.who].cons?.[x.level] ?? '')].filter(Boolean);
  const news = items.length
    ? `<h2>Hírek a házból</h2><div class="news">${items.map(t => `<p>${t}</p>`).join('')}</div>`
    : '';
  const step = nextStep(s, c);
  const label = step === 'week' ? 'Következő hét' : step === 'quarter' ? 'Negyedéves értékelés'
    : s.week >= c.weeks.length - 1 ? 'Éves értékelés' : 'Az ügy lezárása';
  return `<article class="sheet">${head(s)}
  <div class="stamp" aria-hidden="true">${r.stamp}</div>
  <h1 id="t" tabindex="-1">Visszaküldve, ${weekInQuarter(s, c)}. hét</h1>
  <p class="lede">{szazados} százados megjegyzéseivel. Pecsét: ${r.stamp.toLowerCase()}.</p>
  <div class="report">${body}</div>
  <span class="note big">${r.overall}</span>
  ${r.extra ? `<span class="note">${r.extra}</span>` : ''}
  ${r.taskDone ? `<span class="note">${c.career.task.now}</span>` : ''}
  ${r.watch.honest ? `<span class="note">${c.notes.watch.honest}</span>` : ''}
  ${r.watch.hidden ? `<span class="note">${c.notes.watch.hidden.replace('{obs}', r.watch.hidden)}</span>` : ''}
  <span class="sig">${sig(s)}</span>
  ${reviewResult(s, c)}
  ${news}
  ${r.watch.started ? `<h2>Önről</h2><div class="news"><p>${c.notes.watch.started}</p></div>` : ''}
  <h2>Állásod</h2>
  ${meters(s.meters, r.before, v)}
  <div class="actions"><button class="btn" data-action="next">${label}</button></div>
  </article>`;
}

function taskResult(task: { id: string; done: boolean }, c: Content, b: Balance, v: View): string {
  const t = c.tasks.find(x => x.id === task.id)!;
  const dev = v.dev ? ` <span class="dev">(elégedettség ${task.done ? '+' + b.task.reward : '−' + b.task.penalty})</span>` : '';
  return `<h2>${c.career.task.title}</h2><p class="task-order">${t.title}</p><p>${task.done ? t.done : t.fail}${dev}</p>`;
}

/** The captain's quarterly review: grade, promotion or demotion, and how the house stands. */
function quarter(s: GameState, c: Content, b: Balance, v: View): string {
  const q = s.lastQuarter!;
  const g = c.career.grades[q.grade];
  const ranks = c.career.ranks;
  const change = q.rankAfter > q.rankBefore ? ranks[q.rankAfter].promo
    : q.rankAfter < q.rankBefore ? ranks[q.rankAfter].demo : c.career.stay;
  const trust = (k: ResidentId) => s.bonds.includes(k) ? `, ${c.events.labels.bonded}` : s.betrayed.includes(k) ? `, ${c.events.labels.betrayed}` : '';
  // „Bajban” already says trouble; a warning or ruin is added to it.
  const step = (k: ResidentId) => { const l = s.consLevel[k] ?? 0; return l && l !== TROUBLE ? `, ${c.notes.cons[CONS_LEVELS[l - 1]]}` : ''; };
  const house = STORY.map(k => `<li class="with-face">${faceOf(s, c, k)}<span>${c.residents[k].name}: ${STATUS_LABEL[residentStatus(s, k)]}${step(k)}${trust(k)}</span></li>`).join('');
  return `<article class="sheet">${head(s)}
  <div class="stamp" aria-hidden="true">${g.title}</div>
  <h1 id="t" tabindex="-1">Negyedéves értékelés</h1>
  <p class="lede">${c.career.quarters[q.quarter]}. Minősítés: ${g.title.toLowerCase()}.</p>
  <span class="note big">${g.note}</span>
  <span class="sig">${sig(s)}</span>
  ${q.task ? taskResult(q.task, c, b, v) : ''}
  <h2>Besorolás</h2>
  ${q.excluded
    ? `<p><strong>${c.career.excluded.label}</strong></p><p>${c.career.excluded.text}</p>`
    : `<p><strong>${ranks[q.rankAfter].label}</strong></p>
  <p>${change}</p>
  ${q.reward !== null && ranks[q.reward].reward ? `<p class="reward"><strong>${c.career.rewardTitle}:</strong> ${ranks[q.reward].reward}.${v.dev ? rewardDev(b, q.reward) : ''}</p>` : ''}
  <p class="meta">Jelentésenként ${b.ranks[q.rankAfter].slots} mondat.</p>`}
  ${q.calmed === null ? '' : `<p>${q.calmed ? c.notes.watch.calmed : c.notes.watch.still}</p>`}
  <h2>A ház a negyedév végén</h2>
  <ul class="house">${house}</ul>
  <h2>Állásod a következő negyedév elején</h2>
  ${meters(q.after, q.before, v)}
  <div class="actions"><button class="btn" data-action="next">${q.excluded ? c.career.excluded.button : 'Következő negyedév'}</button></div>
  </article>`;
}

/** Developer mode: what a reward does to the meters. */
function rewardDev(b: Balance, rank: number): string {
  const r = b.rewards[String(rank)];
  const parts = [r.E && `elégedettség ${r.E > 0 ? '+' : ''}${r.E}`, r.H && `hihetőség ${r.H > 0 ? '+' : ''}${r.H}`,
    r.L && `lelkiismeret ${r.L > 0 ? '+' : ''}${r.L}`, r.holiday && `egy hét kimarad, utána +${b.holiday.expect} elvárás`].filter(Boolean);
  return ` <span class="dev">(${parts.join(', ')})</span>`;
}

function ending(s: GameState, c: Content, b: Balance, v: View): string {
  const e = c.endings[endingKey(s, b)];
  // Every step each resident went through, in the order it happened to them.
  const hit = STORY.filter(k => (s.consLevel[k] ?? 0) > 0 && c.residents[k].cons);
  const cons = hit.length
    ? `<h2>Ami a jelentéseid nyomán történt</h2><div class="news">${hit.map(k =>
      CONS_LEVELS.slice(0, s.consLevel[k]).map(l => `<p>${c.residents[k].cons![l]}</p>`).join('')).join('')}</div>`
    : '';
  const truths = STORY.map(k => {
    const r = c.residents[k];
    const level = s.consLevel[k] ?? 0;
    const fate = r.fate ? ` ${r.fate[level >= CONS_LEVELS.length ? 'ruin' : s.cons.includes(k) ? 'bajban' : 'ok']}` : '';
    const kept = s.bonds.includes(k) && c.events.kept[k] ? ` ${c.events.kept[k]}` : '';
    return `<p>${r.truth}${fate}${kept}</p>`;
  }).join('');
  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">${e.title}</h1>
  <p>${e.text}</p>
  <p class="meta">Végső besorolásod: ${c.career.ranks[s.rank].label} (${c.career.quarters[quarterOf(s, c)]})</p>
  ${s.pastTasks.length ? `<p class="meta">Teljesített kiemelt feladatok: ${s.doneTasks.length} / ${s.pastTasks.length}</p>` : ''}
  ${meters(s.meters, null, v)}
  ${cons}
  <h2>Ami valójában történt</h2>
  ${truths}
  <h2>2026. november 4.</h2>
  <p>Az iratok nyilvánosak lettek. Az adatbázis háromszor kidobott, negyedszerre bejutottál. ${s.reportsOnYou ? c.notes.watch.epilogueSome.replace('{n}', String(s.reportsOnYou)) : c.notes.watch.epilogueNone}</p>
  <p class="quote">„A célszemély gyanúsan sokat ír. Hogy mit, az nem tudható.”</p>
  <section class="dossier" aria-labelledby="dossier-t">
  <h2 id="dossier-t">${c.dossier.title}</h2>
  <p>${c.dossier.lede}</p>
  <img class="dossier-preview" alt="${c.dossier.heading}: ${s.code}" width="1080" height="1350" hidden>
  <div class="actions dossier-actions">
    <button class="btn" data-dossier="download">${c.dossier.download}</button>
    <button class="btn quiet" data-dossier="share">${c.dossier.share}</button>
    <button class="btn quiet" data-dossier="copy">${c.dossier.copy}</button>
  </div>
  <p class="hint dossier-status" aria-live="polite"></p>
  </section>
  <div class="actions"><button class="btn" data-action="restart">Újrakezdés új fedőnévvel</button></div>
  </article>`;
}

function screen(s: GameState, c: Content, b: Balance, v: View): string {
  switch (s.screen) {
    case 'intro': return intro(s, c, v);
    case 'week': return week(s, c, b, v);
    case 'response': return response(s, c, v);
    case 'quarter': return quarter(s, c, b, v);
    case 'ending': return ending(s, c, b, v);
  }
}

/** Content texts carry `{id}` placeholders; the generated family names go in here, in one place. */
export const renderScreen = (s: GameState, c: Content, b: Balance, v: View): string =>
  fillNames(screen(s, c, b, v), nameVars(s));
