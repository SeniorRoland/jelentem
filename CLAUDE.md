# Jelentem, nem történt semmi

Szatirikus böngészős játék: 1979, egy kitalált dunántúli kisváros (Alsóbürokrác), a játékos egy motiválatlan besúgó, aki heti jelentést ír a házról. A cél úgy kielégíteni a tartótisztet, hogy közben senkinek ne ártson. A játékot a 2026. november 4-i ügynökakta-nyilvánosságra hozatal ihlette. A részletes játéktervet a `docs/DESIGN.md` tartalmazza.

## Parancsok

- `npm run dev` – fejlesztői szerver (Vite)
- `npm test` – Vitest egységtesztek
- `npm run validate` – a tartalom (JSON) konzisztencia-ellenőrzése
- `npm run sim` – kiegyensúlyozási szimuláció (bot-stratégiák, befejezések eloszlása, végső rang, bajba került lakók); `npm run sim -- 10000` több játékkal; `SIM_BALANCE='{"quarter":{"resetE":0.3}}' npm run sim` a `balance.json` ideiglenes felülírásával (objektumok kulcsonként, tömbök elemenként olvadnak össze)
- `npm run build` – típusellenőrzés + éles build a `dist/` mappába

Minden változtatás után futtasd: `npm run validate && npm test && npm run build`. Ha a `balance.json`-t vagy kártyaértékeket módosítottál, futtasd a `npm run sim`-et is, és írd le az eredményt a módosítás összefoglalójában.

## Architektúra

Három réteg, szigorúan elválasztva:

- `src/engine/` – a játékszabályok. Tiszta TypeScript, DOM nélkül. A `state.ts`-ben lévő `dispatch()` egy tiszta reducer: soha nem módosítja a bemenő állapotot (ezt teszt ellenőrzi). A véletlenszám-forrás (`Rng`) mindig paraméterként érkezik, a tesztek és a szimuláció a `mulberry32` seedelt generátort használják.
- `src/content/` – minden szöveg és szám JSON-ban: hetek (`weeks.json`: szint és megfigyelés-helyek), a megfigyelés-készlet (`observations.json`, 60 db), értelmezés-kártyák (`interpretations.json`, 40 db), lakók, befejezések, százados-jegyzetek, fedőnevek, a beszervezési karton adatai (`recruit.json`), a betöltő képernyő szövegei (`loading.json`), és a kiegyensúlyozási paraméterek (`balance.json`). A `validate.ts` ellenőrzi a konzisztenciát.
- `src/ui/` – HTML-sablonokat előállító függvények (`render.ts`), a `src/main.ts` köti össze az eseményekkel. Az UI csak olvassa az állapotot, a változtatás mindig `dispatch()`-on keresztül megy.

Új szabályt a motorba írj, tesztet hozzá a `src/engine/*.test.ts`-be. Új tartalomhoz ne nyúlj a kódhoz, csak a JSON-hoz.

## Játékmechanika röviden

- Négy negyedév × 3 hét (`weeks.json` → `quarter`, `level`). Negyedév végén `career.ts` → `endQuarter`: minősítés (`kivalo` ha E ≥ `promoteE` és H ≥ `promoteH`, `hianyos` ha E < `demoteE`), rangváltás (0 = passzív állomány … 4 = rezidensjelölt; a rang adja a mondathelyek számát és az elvárás-pótlékot, `balance.ranks`), majd E `resetE` arányban visszahúzódik `start.E` felé, H `healH`-val, L `healL`-lel nő.
- Kategória (`balance.categories[recruit.categoryId]`): `expectBonus` az elváráshoz, `doubt` szorzó a negatív hihetőségre (`scoreSentence` 4. paramétere).
- Célfeladat (`tasks.json`, `balance.task`): `task.fromQuarter`-től minden negyedév első hetén a motor kiad egyet (`state.task`); a jelentés teljesíti, ha egy mondat megfigyelése vagy értelmezése a feladat `topic`-jához tartozik (`topics` mező). Nyitott feladatnál a `deal` egy `divert` tierű terelő kártyát is ad. Elszámolás: `settleTask` a negyedév végén (E ± `reward`/`penalty` a minősítés előtt), az utolsó negyedévben a befejezés előtt.
- Lakói állapot (`residentStatus`): `nyugodt` → `gyanus` (érte már ártalom) → `bajban` (következmény érte). A megfigyelések a hét elején sorsolódnak, és `quarters`/`requires` feltételekkel elágazhatnak az állapot szerint.
- Három mérő 0–100 között: `E` (a százados elégedettsége), `H` (hihetőség), `L` (lelkiismeret).
- Egy mondat = megfigyelés + opcionális értelmezés. A megfigyelésnek `izg` (izgalom) és `art` (ártalom) értéke van, az értelmezésnek `izg`, `hih` (hihetőség-változás) és `mult` (ártalom-szorzó).
- Hetente (elvárás = `expect[hét] + ranks[rang].expectBonus`): `E += (izgalom összeg − elvárás) × weight.E`, `H += hihetőség összeg × weight.H`, `L −= ártalom összeg × weight.L`.
- Ha egy lakóra összegyűlt ártalom eléri a `consThreshold`-ot, következmény éri (`residents.json` → `cons`).
- Befejezések: `best`, `kivalo`, `megfigyelt`, `behivatas` (`rules.ts` → `endingKey`), a 12. hét után vagy amikor egy mérő nullára esik. A „Ami valójában történt” rész lakónként a `fate.ok` vagy `fate.bajban` szöveget mutatja.
- Mentés: `src/ui/save.ts`, minden lépés után localStorage-ba; a befejezett vagy a tartalomhoz már nem illő mentést elveti.

## Tartalmi és hangnemi szabályok

- A játék szatíra a rendszerről és a bürokráciáról, nem az áldozatokról. A humor a jelentések bikkfanyelvéből és az abszurditásból jön.
- **Csak kitalált szereplők, helyszínek és intézményi alakok.** Valós, élő vagy elhunyt személyt soha ne nevezz meg besúgóként, tartótisztként vagy megfigyeltként, még viccként sem. Valós intézménynév (BM III/III., DÉDÁSZ, Szabad Európa Rádió) korfestésként használható.
- Magyar tipográfia: idézőjel „ ”, gondolatjel –, három pont …. Egyenes idézőjelet a validátor elutasít.
- A lakók és a százados vezetékneve generált: a szövegekben `{mari}`, `{jozsi}`, `{pityu}`, `{porgoly}`, `{szazados}` helyettesítő áll (pl. „{mari} Máriánál”), soha ne írj be fix vezetéknevet. A ragot a keresztnév kapja, ne a helyettesítő. A behelyettesítés a `renderScreen()`-ben történik, az ismeretlen helyettesítőt a validátor jelzi.
- Új megfigyelésnél a `level` a hét szintje (1–3: egyre izgalmasabb és terhelőbb), a 3. szint a lakó titkára vagy negyedéves történetére utal. A negyedéves történet-megfigyelésnek `quarters` (melyik negyedév) és `requires` (`{"pityu": ["bajban"]}` – csak a saját lakójára) mezője van; mindkét ágat (rendben / bajban) meg kell írni. A validátor ellenőrzi, hogy minden hét minden helyére, minden állapotban jusson elég friss megfigyelés. Az azonos `tag`-ű megfigyelések ismételt jelentésekor a `notes.json` → `repeat` jegyzete jön. Szintenként és helyenként legalább 3 változat kell (a validátor ellenőrzi).
- A megfigyelés és az értelmezés szövege ne végződjön ponttal (a motor rakja össze: `megfigyelés, értelmezés.`). Az értelmezés vesszővel kapcsolódik, ezért „ami…”, „amelynek…”, „és…” kezdetű legyen.
- Betűtípus: Courier Prime (gépelt szöveg) és Caveat (a százados kézírása). Új betűtípus csak akkor, ha ellenőrzötten tartalmazza az ő, ű, Ő, Ű betűket.

## UI-szabályok

- Mobil az elsődleges: koppintásos kezelés, nincs kötelező drag-and-drop.
- Billentyűzettel is játszható legyen: minden interaktív elem `<button>`, látható fókusz.
- Világos és sötét téma: színek csak a `:root` CSS-változókon keresztül (`src/styles.css`).
- Mozgás csak a pecsét-animációnál, `prefers-reduced-motion` mellett kikapcsol.
- Nincs keretrendszer. Ha valami miatt mégis kellene (pl. Angular vagy Svelte), előbb kérdezd meg.

## Ismert kiegyensúlyozási állapot

Négy negyedév, 12 hét. Elvárás `[7, 9, 11, 7, 9, 11, 8, 10, 12, 8, 10, 12]` + rangpótlék (0, 0, 1, 3, 4; a 3–4. rang három mondatot ír) + kategóriapótlék (−1 … +3), célfeladat a 2. negyedévtől (+8 / −12), `consThreshold` 4 (a 12 hét alatt összeadódik), negyedév végén `resetE` 0,2, `healH` 8, `healL` 15, minősítés: kiváló E ≥ 65 és H ≥ 45, hiányos E < 45.

A `npm run sim -- 5000` eredménye (best / kivalo / megfigyelt / behivatas, végső átlagrang, teljesített feladatok):

- véletlen: 0% / 53% / 39% / 8%, rang 1,25, feladat 67%
- mohó: 0% / 16% / 84% / 0%
- óvatos (0 ártalom): 9% / 0% / 2% / 89%, rang 0,11, feladat 41% (a „hű” kategóriával 61%, az ellenséges kategóriákkal 0%)
- előrelátó (mindent lát, egy hétre előre tervez, keresi a feladatot): 76% / 24% / 0% / 0%, rang 3,0, feladat 100% (kategóriánként 64–87%)

A `npm run sim` kategóriánként is kiírja a legjobb vég arányát. A csendőr a legkönnyebb az előrelátónak: a magas elvárás miatt ritkábban léptetik elő a háromhelyes, ártalmasabb rangokba.

A legjobb vég tervezéssel elérhető, de nem biztos; a puszta óvatosság kevés. A véletlen játékos 0%-a szándékos: egy év alatt vakon nem lehet senkinek sem ártani.
