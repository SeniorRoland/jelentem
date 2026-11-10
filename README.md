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

## Dokumentáció

- `docs/JATEKLEIRAS.md` – a játék teljes leírása: szabályok, számok, példák, a befejezések és a hozzájuk vezető tippek. **Mindent elárul**, a játékbeli súgó szándékosan nem.
- `docs/DESIGN.md` – a játékterv és az ütemterv.

## Közzététel

A játék itt játszható: https://seniorroland.github.io/jelentem/

A `.github/workflows/deploy.yml` minden `master` ágra küldött push után ellenőriz, tesztel, buildel és kiteszi a játékot GitHub Pagesre. A fejlesztés a `develop` ágon folyik, a `master` a kiadott változat (`v0.0.x` tagek). A repó beállításaiban a Pages forrását „GitHub Actions”-re kell állítani.

## Folytatás Claude Code-dal

A projekt gyökerében lévő `CLAUDE.md` minden fontos tudnivalót tartalmaz Claude Code számára (architektúra, parancsok, hangnemi szabályok). Néhány jó első kérés:

- „Olvasd el a docs/DESIGN.md-t, és tegyél javaslatot a balance.json hangolására úgy, hogy a véletlen játékos 10–15%-ban érje el a legjobb befejezést. Használd az npm run sim-et.”
- „Készítsd el a DESIGN.md ütemtervéből a következő pontot, egy új feature ágon a develop ágból.”
- „Írj három új megfigyelést a második szintre a házmesterről, és futtasd a validátort.”

Szatíra. A szereplők, a ház, a város és a százados kitaláltak.
