import { fillNames } from '../engine/names';
import { formatDate } from '../engine/recruit';
import { anyMeterZero, endingKey } from '../engine/rules';
import type { Balance, Content, GameState, Hint, Meters } from '../engine/types';

export interface View {
  dev: boolean;
}

const HINTS: Record<Hint, string> = {
  '': 'Koppints egy cetlire, és bekerül a jelentésbe. A jelentésben lévő szövegre koppintva kiveheted.',
  slotsFull: 'Mindkét mondat megvan. Vegyél ki egy megfigyelést, ha cserélnél.',
  needObs: 'Előbb válassz egy megfigyelést, amihez az értelmezés tartozik.',
  intsFull: 'Mindkét mondatnak van már értelmezése. Vegyél ki egyet, ha cserélnél.',
};

const bar = (v: number) => { const n = Math.round(v / 10); return '█'.repeat(n) + '░'.repeat(10 - n); };
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
  <div class="k-head"><p class="k-secret">Szigorúan titkos!<br>Különösen fontos!</p><h2 id="karton-t" class="k-title">Beszervezési karton</h2></div>
  <dl class="k-fields">${rows.map(([k, val], i) => `<div class="k-row"><dt>${k}:</dt><dd><span class="k-val">${val}</span>${v.dev && i === 0 ? `<span class="dev">a név oka: ${r.nameWhy}</span>` : ''}</dd></div>`).join('')}</dl>
  <div class="k-foot"><span class="k-serial"><span class="sr-only">Sorszám: </span>${r.serial}</span><button class="btn quiet" data-action="reroll" data-id="code">Másik fedőnév</button></div>
  </section>`;
}

function intro(s: GameState, c: Content, v: View): string {
  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">Jelentem, nem történt semmi</h1>
  <p class="lede">Alsóbürokrác, 1979 tavasza.</p>
  <p>Elvtárs!</p>
  <p>Önt ${s.recruit.recruitedOn.slice(0, 4)}-ben társadalmi kapcsolatként beszervezték. Azóta érdemi jelentést nem adott, dossziéja a polcon porosodott. Ügyét a mai nappal átvettem. Feladata, hogy hetente jelentést írjon a Bem utca 12. lakóiról: {mari} Máriáról (Mari néni), {jozsi} Józsefről (Józsi bácsi), {pityu} Istvánról (Pityu), valamint szükség esetén {porgoly} Lajosné házmesterről.</p>
  <p>Az elvtárs munkáját bizalommal várjuk.</p>
  <span class="sig">Vágási százados</span>
  ${karton(s, c, v)}
  <h2>Hogyan működik</h2>
  <p>Minden héten megfigyeléseket kapsz a házból. A jelentésed két mondatból áll: válassz egy megfigyelést, majd tegyél mellé egy értelmezést.</p>
  <p>A százados izgalmas jelentést vár, és hétről hétre többet. Ha viszont túlzol, elveszíted a hihetőségedet, és ha valakire terhelő dolgot írsz, annak baja lesz. A legjobb besúgó sokat ír, és semmit sem mond.</p>
  <div class="actions"><button class="btn" data-action="start">Munkába állok</button></div>
  <p class="fine">Ez egy szatirikus játék. A szereplők, a ház, a város és a százados kitaláltak.</p>
  </article>`;
}

function week(s: GameState, c: Content, v: View): string {
  const w = c.weeks[s.week];
  const obs = (id: string) => w.obs.find(x => x.id === id)!;
  const int = (id: string) => c.ints.find(x => x.id === id)!;
  const placedO = new Set(s.slots.map(x => x.o).filter(Boolean));
  const placedI = new Set(s.slots.map(x => x.i).filter(Boolean));

  const obsSlips = w.obs.map(o => `<button class="slip" data-action="toggleObs" data-id="${o.id}" aria-pressed="${placedO.has(o.id)}">${o.text}.<small>${o.who ? c.residents[o.who].name : 'Közös terület'}</small>${v.dev ? `<span class="dev">izgalom ${o.izg}, ártalom ${o.art}</span>` : ''}</button>`).join('');
  const intSlips = s.dealt.map(id => {
    const it = int(id);
    return `<button class="slip" data-action="toggleInt" data-id="${id}" aria-pressed="${placedI.has(id)}">…, ${it.text}.${v.dev ? `<span class="dev">izgalom ${it.izg}, hihetőség ${it.hih}, ártalom ×${it.mult}</span>` : ''}</button>`;
  }).join('');

  const sentences = s.slots.map((sl, idx) => {
    const o = sl.o
      ? `<button class="part" data-action="unplace" data-slot="${idx}" data-part="o" aria-label="Megfigyelés kivétele">${obs(sl.o).text}</button>`
      : `<span class="blank">………………… (megfigyelés)</span>`;
    const i = sl.i
      ? `, <button class="part" data-action="unplace" data-slot="${idx}" data-part="i" aria-label="Értelmezés kivétele">${int(sl.i).text}</button>.`
      : sl.o ? `<span class="blank">, ………………… (értelmezés, ha akarod)</span>.` : `<span class="blank">, ………………… (értelmezés)</span>`;
    return `<li>${o}${i}</li>`;
  }).join('');

  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">Jelentés, ${s.week + 1}. hét</h1>
  <p class="meta">Fedőnév: ${s.code}</p>
  <p class="meta">Időszak: ${w.label}</p>
  <p class="meta">Tárgy: a Bem utca 12. lakói</p>
  ${meters(s.meters, null, v)}
  <p class="lede" style="margin-top:1.25rem">${w.intro}</p>
  <h2>Megfigyelések a héten</h2>
  <div class="slips">${obsSlips}</div>
  <h2>Kéznél lévő értelmezések</h2>
  <div class="slips">${intSlips}</div>
  <h2>A jelentés szövege</h2>
  <div class="report"><ol>${sentences}</ol></div>
  <p class="hint" aria-live="polite">${HINTS[s.hint]}</p>
  <div class="actions"><button class="btn" data-action="submit">Jelentés leadása</button></div>
  </article>`;
}

function response(s: GameState, c: Content, v: View): string {
  const r = s.last!;
  const body = r.sents.length
    ? `<ol>${r.sents.map(x => `<li>${x.text}${x.note ? `<span class="note">${x.note}</span>` : ''}</li>`).join('')}</ol>`
    : `<p>Jelentem, a megfigyelt időszakban nem történt semmi.</p>`;
  const news = r.newCons.length
    ? `<h2>Hírek a házból</h2><div class="news">${r.newCons.map(k => `<p>${c.residents[k].cons}</p>`).join('')}</div>`
    : '';
  const last = s.week >= c.weeks.length - 1 || anyMeterZero(s.meters);
  return `<article class="sheet">${head(s)}
  <div class="stamp" aria-hidden="true">${r.stamp}</div>
  <h1 id="t" tabindex="-1">Visszaküldve, ${s.week + 1}. hét</h1>
  <p class="lede">Vágási százados megjegyzéseivel. Pecsét: ${r.stamp.toLowerCase()}.</p>
  <div class="report">${body}</div>
  <span class="note big">${r.overall}</span>
  ${r.extra ? `<span class="note">${r.extra}</span>` : ''}
  <span class="sig">V. szds.</span>
  ${news}
  <h2>Állásod</h2>
  ${meters(s.meters, r.before, v)}
  <div class="actions"><button class="btn" data-action="next">${last ? 'Negyedéves értékelés' : 'Következő hét'}</button></div>
  </article>`;
}

function ending(s: GameState, c: Content, b: Balance, v: View): string {
  const e = c.endings[endingKey(s, b)];
  const cons = s.cons.length
    ? `<h2>Ami a jelentéseid nyomán történt</h2><div class="news">${s.cons.map(k => `<p>${c.residents[k].cons}</p>`).join('')}</div>`
    : '';
  const truths = (['mari', 'jozsi', 'pityu'] as const).map(k => `<p>${c.residents[k].truth}</p>`).join('');
  return `<article class="sheet">${head(s)}
  <h1 id="t" tabindex="-1">${e.title}</h1>
  <p>${e.text}</p>
  ${meters(s.meters, null, v)}
  ${cons}
  <h2>Ami valójában történt</h2>
  ${truths}
  <h2>2026. november 4.</h2>
  <p>Az iratok nyilvánosak lettek. Az adatbázis háromszor kidobott, negyedszerre bejutottál. Rákerestél a saját nevedre. Egyetlen találat: {porgoly} Lajosné jelentése 1979 márciusából.</p>
  <p class="quote">„A célszemély gyanúsan sokat ír. Hogy mit, az nem tudható.”</p>
  <div class="actions"><button class="btn" data-action="restart">Újrakezdés új fedőnévvel</button></div>
  </article>`;
}

function screen(s: GameState, c: Content, b: Balance, v: View): string {
  switch (s.screen) {
    case 'intro': return intro(s, c, v);
    case 'week': return week(s, c, v);
    case 'response': return response(s, c, v);
    case 'ending': return ending(s, c, b, v);
  }
}

/** Content texts carry `{id}` placeholders; the generated family names go in here, in one place. */
export const renderScreen = (s: GameState, c: Content, b: Balance, v: View): string => fillNames(screen(s, c, b, v), s.names);
