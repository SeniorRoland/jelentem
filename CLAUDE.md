# Jelentem, nem történt semmi

Szatirikus böngészős játék: 1979, egy kitalált dunántúli kisváros (Alsóbürokrác), a játékos egy motiválatlan besúgó, aki heti jelentést ír a házról. A cél úgy kielégíteni a tartótisztet, hogy közben senkinek ne ártson. A játékot a 2026. november 4-i ügynökakta-nyilvánosságra hozatal ihlette. A részletes játéktervet a `docs/DESIGN.md` tartalmazza.

## Parancsok

- `npm run dev` – fejlesztői szerver (Vite)
- `npm test` – Vitest egységtesztek
- `npm run validate` – a tartalom (JSON) konzisztencia-ellenőrzése
- `npm run sim` – kiegyensúlyozási szimuláció (bot-stratégiák, befejezések eloszlása); `npm run sim -- 10000` több játékkal
- `npm run build` – típusellenőrzés + éles build a `dist/` mappába

Minden változtatás után futtasd: `npm run validate && npm test && npm run build`. Ha a `balance.json`-t vagy kártyaértékeket módosítottál, futtasd a `npm run sim`-et is, és írd le az eredményt a módosítás összefoglalójában.

## Architektúra

Három réteg, szigorúan elválasztva:

- `src/engine/` – a játékszabályok. Tiszta TypeScript, DOM nélkül. A `state.ts`-ben lévő `dispatch()` egy tiszta reducer: soha nem módosítja a bemenő állapotot (ezt teszt ellenőrzi). A véletlenszám-forrás (`Rng`) mindig paraméterként érkezik, a tesztek és a szimuláció a `mulberry32` seedelt generátort használják.
- `src/content/` – minden szöveg és szám JSON-ban: hetek (`weeks.json`: szint és megfigyelés-helyek), a megfigyelés-készlet (`observations.json`, 60 db), értelmezés-kártyák (`interpretations.json`, 40 db), lakók, befejezések, százados-jegyzetek, fedőnevek, a beszervezési karton adatai (`recruit.json`), a betöltő képernyő szövegei (`loading.json`), és a kiegyensúlyozási paraméterek (`balance.json`). A `validate.ts` ellenőrzi a konzisztenciát.
- `src/ui/` – HTML-sablonokat előállító függvények (`render.ts`), a `src/main.ts` köti össze az eseményekkel. Az UI csak olvassa az állapotot, a változtatás mindig `dispatch()`-on keresztül megy.

Új szabályt a motorba írj, tesztet hozzá a `src/engine/*.test.ts`-be. Új tartalomhoz ne nyúlj a kódhoz, csak a JSON-hoz.

## Játékmechanika röviden

- Három mérő 0–100 között: `E` (a százados elégedettsége), `H` (hihetőség), `L` (lelkiismeret).
- Egy mondat = megfigyelés + opcionális értelmezés. A megfigyelésnek `izg` (izgalom) és `art` (ártalom) értéke van, az értelmezésnek `izg`, `hih` (hihetőség-változás) és `mult` (ártalom-szorzó).
- Hetente: `E += (izgalom összeg − elvárás) × weight.E`, `H += hihetőség összeg × weight.H`, `L −= ártalom összeg × weight.L`.
- Ha egy lakóra összegyűlt ártalom eléri a `consThreshold`-ot, következmény éri (`residents.json` → `cons`).
- Befejezések: `best`, `kivalo`, `megfigyelt`, `behivatas` (`rules.ts` → `endingKey`).

## Tartalmi és hangnemi szabályok

- A játék szatíra a rendszerről és a bürokráciáról, nem az áldozatokról. A humor a jelentések bikkfanyelvéből és az abszurditásból jön.
- **Csak kitalált szereplők, helyszínek és intézményi alakok.** Valós, élő vagy elhunyt személyt soha ne nevezz meg besúgóként, tartótisztként vagy megfigyeltként, még viccként sem. Valós intézménynév (BM III/III., DÉDÁSZ, Szabad Európa Rádió) korfestésként használható.
- Magyar tipográfia: idézőjel „ ”, gondolatjel –, három pont …. Egyenes idézőjelet a validátor elutasít.
- A lakók vezetékneve generált: a szövegekben `{mari}`, `{jozsi}`, `{pityu}`, `{porgoly}` helyettesítő áll (pl. „{mari} Máriánál”), soha ne írj be fix vezetéknevet. A ragot a keresztnév kapja, ne a helyettesítő. A behelyettesítés a `renderScreen()`-ben történik, az ismeretlen helyettesítőt a validátor jelzi.
- Új megfigyelésnél a `level` a hét szintje (1–3: egyre izgalmasabb és terhelőbb), a 3. szint a lakó titkára utal. Az azonos `tag`-ű megfigyelések ismételt jelentésekor a `notes.json` → `repeat` jegyzete jön. Szintenként és helyenként legalább 3 változat kell (a validátor ellenőrzi).
- A megfigyelés és az értelmezés szövege ne végződjön ponttal (a motor rakja össze: `megfigyelés, értelmezés.`). Az értelmezés vesszővel kapcsolódik, ezért „ami…”, „amelynek…”, „és…” kezdetű legyen.
- Betűtípus: Courier Prime (gépelt szöveg) és Caveat (a százados kézírása). Új betűtípus csak akkor, ha ellenőrzötten tartalmazza az ő, ű, Ő, Ű betűket.

## UI-szabályok

- Mobil az elsődleges: koppintásos kezelés, nincs kötelező drag-and-drop.
- Billentyűzettel is játszható legyen: minden interaktív elem `<button>`, látható fókusz.
- Világos és sötét téma: színek csak a `:root` CSS-változókon keresztül (`src/styles.css`).
- Mozgás csak a pecsét-animációnál, `prefers-reduced-motion` mellett kikapcsol.
- Nincs keretrendszer. Ha valami miatt mégis kellene (pl. Angular vagy Svelte), előbb kérdezd meg.

## Ismert kiegyensúlyozási állapot

A 0.1.0-ban a 0-s szorzójú óvatos értelmezések (és az `m6`) teljesen semlegesítették a legterhelőbb megfigyeléseket is, így az „óvatos” bot 100%-ban, a véletlen játékos 32%-ban érte el a legjobb véget.

Az első hangolás után: az óvatos kártyák szorzója 0,4 (tompít, de nem töröl, ezt teszt is ellenőrzi), az `m6` szorzója 0,5, az elvárás `[7, 9, 11]`, a `consThreshold` 3. A `npm run sim -- 10000` eredménye (best / kivalo / megfigyelt / behivatas):

- véletlen: 14% / 62% / 22% / 2%
- óvatos (0 ártalom): 85% / 0% / 0% / 15%
- előrelátó (mindent lát, egy hétre előre tervez): 100% / 0% / 0% / 0%

A legjobb vég tehát elérhető marad, de már nem jár automatikusan az óvatossággal: ártalmatlan izgalmat leginkább a semleges megfigyelések felfújásával lehet szerezni, ami a hihetőségbe kerül.
