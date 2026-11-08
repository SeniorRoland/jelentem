# Jelentem, nem történt semmi

Szatirikus böngészős játék egy 1979-es besúgóról, aki sokat ír, és semmit sem mond.

## Indítás

```bash
npm install
npm run dev
```

Majd nyisd meg a kiírt címet (alapból http://localhost:5173).

## Hasznos parancsok

| Parancs | Mit csinál |
|---|---|
| `npm test` | egységtesztek |
| `npm run validate` | tartalom-ellenőrzés |
| `npm run sim` | kiegyensúlyozási szimuláció |
| `npm run build` | éles build a `dist/` mappába |

## Közzététel

A `.github/workflows/deploy.yml` minden `main` ágra küldött push után ellenőriz, tesztel, buildel és kiteszi a játékot GitHub Pagesre. A repó beállításaiban a Pages forrását „GitHub Actions”-re kell állítani.

## Folytatás Claude Code-dal

A projekt gyökerében lévő `CLAUDE.md` minden fontos tudnivalót tartalmaz Claude Code számára (architektúra, parancsok, hangnemi szabályok). Néhány jó első kérés:

- „Olvasd el a docs/DESIGN.md-t, és tegyél javaslatot a balance.json hangolására úgy, hogy a véletlen játékos 10–15%-ban érje el a legjobb befejezést. Használd az npm run sim-et.”
- „Adj hozzá mentést localStorage-ba, hogy frissítés után is folytatható legyen a játék.”
- „Írj egy negyedik és ötödik hetet a lakók titkainak továbbvitelével.”

Szatíra. A szereplők, a ház, a város és a százados kitaláltak.
