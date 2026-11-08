# Játékterv

## Alapötlet

1979 tavasza, Alsóbürokrác, Bem utca 12. A játékos motiválatlan besúgó, akit 1971-ben vagy 1972-ben szerveztek be, de azóta érdemi jelentést nem adott; a dossziéját most az új tartótiszt előveszi. Fedőneve véletlenszerű (pl. „Kockás Abrosz”). A tartótiszt, Vágási százados, hetente jelentést vár a ház lakóiról. A lakók unalmasak, és a játékos nem akar ártani nekik.

A játék lényege egyensúlyozás: a jelentés legyen elég izgalmas a századosnak, elég hihető, hogy ne kezdjenek gyanakodni a játékosra, és elég ártalmatlan, hogy a szomszédok ne kerüljenek bajba. A legjobb besúgó sokat ír, és semmit sem mond.

## Betöltő képernyő

Indításkor a Központi Irattár „kikéri az aktát” (`src/ui/loading.ts`, szövegek: `src/content/loading.json`). Hat véletlen bürokratikus lépés fut le (pl. „Engedély kérése az engedélykéréshez”), írógépes folyamatjelzővel. Közben egy visszaesés visszaveti a haladást (pl. „A 2026-os adatbázis túlterhelt. Kérjük, próbálkozzon 1979-ben”), a végén 112 százalékos tervteljesítés és „Engedélyezve” pecsét jön. A pecsét a betűtípusok betöltését is megvárja. Mozgás csak a pecsétnél van; a „Sorban állás nélkül (protekcióval)” gomb azonnal átugorja.

## Beszervezési karton

A nyitóképernyőn a játékos saját, véletlenszerűen generált kartonja látható (`src/content/recruit.json`, `src/engine/recruit.ts`): név, születési év és hely, anyja neve, foglalkozás, munkahely, végzettség, kategória, a beszervezés ideje, osztályozása és alapja, fedőnév, valamint egy pecsételt hatjegyű sorszám. A mezők egymáshoz illenek:

- A **kategória** („Milyen kategóriába tartozik”) korlátozza a születési évet, a nemet és a foglalkozást (pl. a csendőr 1924 előtt született férfi, ma éjjeliőr vagy portás).
- A **vezetéknév** a személy egy igaz tulajdonságából jön (nomen est omen): foglalkozásból (a portás Kapus, a raktáros Kulcsár), kategóriából (a csendőr Vitéz, az osztályidegen Gróf), végzettségből (Deák) vagy korból (Ősz, Ifjú). A listában legalább 30 név van; a validátor ellenőrzi, hogy minden foglalkozáshoz és kategóriához jusson név. Fejlesztői módban a karton kiírja a név okát. Az anyja leánykori neve a születési helyből képződik (Iratosd → Iratosdi).
- A **beszervezés ideje** dönti el az osztályozási rendszert: 1972 előtt ügynök vagy informátor, 1972-től ügynök (Ü), titkos megbízott (TMB) vagy titkos munkatárs (TMT). Rezidens és K-/T-lakás-tulajdonos nem lehet, mert ezek nem illenek egy házról jelentő, kezdő hálózati személyhez.
- A „hű” és „lojális” kategóriájúakat informátornak, TMB-nek vagy TMT-nek, hazafias vagy lojális alapon szervezték be; a többieket ügynöknek, terhelő adatok vagy anyagi érdekeltség (néha ezek kombinációja) alapján.

**Nyitott kérdés:** a kategória később befolyásolhatja, mit vár a százados (pl. egy kompromittált ügynöktől többet és gyanakvóbban). A `Recruit.categoryId` már az állapotban van, de a motor egyelőre nem használja.

## Év, negyedévek, rangok

A játék 1979 egy éve: négy negyedév, mindegyik három hétből (március, június, szeptember, december). A negyedév végén negyedéves értékelés jön (`career.json`, `career.ts`):

- **Minősítés:** kiváló (a százados elégedett és a hihetőség jó), megfelelő vagy hiányos (a százados elégedetlen).
- **Rang:** passzív állomány → kezdő → megbízható → kiemelt hálózati személy → rezidensjelölt. Kiválóért előléptetés, hiányosért lefokozás jár. Az előléptetés büntetés is: magasabb elvárás, a kiemelt szinttől három mondatos jelentés. A jutalom szatirikus (100 forint és egy doboz cigaretta).
- **Átmenet:** a százados hangulata részben visszaáll, a lelkiismeret és a hihetőség kicsit helyreáll.
- **A ház állapota:** az értékelés lakónként kiírja, hogy nyugodt, szóba került vagy bajban van.

## Lakói történetek

Minden negyedév harmadik hetén lakónként egy történet-megfigyelés jön (`observations.json` → `quarters`, `requires`). Az első negyedévben a titok bukkan fel, utána a történet két ágon folytatódik, attól függően, hogy a lakót érte-e már következmény:

- **Mari néni:** a bécsi sógornő látogatása, útlevélkérelem, karácsonyi kávé. Bajban: suttogva vásárol, elutasított útlevél, cetli nélküli befőtt.
- **Józsi bácsi:** a hinta elkészül, a gyerekeknek is épít egyet, végül beindul a Trabant. Bajban: gyalog hordja a gerendákat, elkobzott hinta, magas kerítés.
- **Pityu:** verses est a Kovács lánynak, gitár, eljegyzés. Bajban: katonai behívó, levelek a laktanyából, leszerelés.

A befejezésben a „Ami valójában történt” rész a titok mellett a lakó sorsát is elmondja (`residents.json` → `fate`). A játék minden lépés után mentődik (localStorage).

## Mérők

- **A százados elégedettsége (E):** az elvárás alatti izgalom csökkenti. Nullán: behívatás.
- **Hihetőség (H):** a túlzó értelmezések csökkentik. Nullán: a játékost kezdik megfigyelni.
- **Lelkiismeret (L):** a terhelő mondatok csökkentik, és a sértett lakót következmény éri.

## Egy hét menete

1. **Megfigyelés:** négy eseménykártya a házból, a 60 darabos készletből sorsolva: egy-egy Mari nénire, Józsi bácsira és Pityura, a negyedik a házmesterre vagy a közös területre. A hét szintje (1–3) dönti el, mennyire izgalmas és terhelő; a harmadik héten minden változat a lakó titkára utal (kávé Bécsből, hinta, gépelt versek). Egy játékban egy megfigyelés csak egyszer jöhet. Ha ugyanaz a téma (Trabant, Bécs, gépelés) másodszor is bekerül a jelentésbe, a százados külön megjegyzést ír.
2. **Jelentésírás:** két mondat, mindegyik egy megfigyelés és egy választható értelmezés. Hat értelmezés kerül kézbe a 40 darabos pakliból (két óvatos, két közepes, két vad), a még nem használtak előnyben.
3. **A százados válasza:** kék tintás margójegyzetek, összesítő megjegyzés, pecsét („Átvéve” vagy „Hiányos”), és ha valakire túl sok ártalom gyűlt, hír a házból.

## Szereplők (mind kitalált)

A lakók vezetékneve minden játékban újra generálódik, a lakó egy igaz tulajdonságából (`residents.json` → `surnames`, öt jelölt lakónként): Mari néni lehet Szakács, Kosaras, Mézes, Szilvás vagy Borsos; Józsi bácsi Kerekes, Bognár, Ács, Asztalos vagy Bodnár; Pityu Hosszú, Göndör, Diák, Lantos vagy Fürtös; a házmester Szemes, Füles, Kulcsár, Kapus vagy Ajtós. Két szereplő (a beszervezettet is beleértve) soha nem kapja ugyanazt a nevet.

- **Mari néni (Mária):** befőz, piacra jár. Titka: nyugatnémet kávé a bécsi sógornőtől.
- **Józsi bácsi (József):** örökké a Trabantot szereli. Titka: hintát épít a feleségének a 40. évfordulóra.
- **Pityu (István):** hosszú hajú egyetemista. Titka: Petőfi-versek gépelt másolata a Kovács lánynak.
- **A házmester (… Lajosné):** a házmester. Túl sokat kérdez. Az epilógusból kiderül, hogy a játékosról jelentett.
- **Vágási százados:** a tartótiszt, a humor fő hordozója a margójegyzetekben.

## Befejezések

- **Jelentem, nem történt semmi:** minden mérő rendben, senkit nem ért következmény. A százados unalmában áthelyezését kéri.
- **Kiváló munkatárs:** a százados elégedett, de valakinek baja lett, vagy a lelkiismeret 70 alá esett.
- **Megfigyelt megfigyelő:** a hihetőség 30 alá esett.
- **Behívatás:** a százados elégedettsége 30 alá esett.

Minden befejezés után jön a 2026. november 4-i epilógus: a játékos megnézi a saját aktáját a túlterhelt adatbázisban, és a házmester jelentését találja róla.

## Következő lépések

1. **Kiegyensúlyozás.** A négy negyedévre újrahangolva (lásd `CLAUDE.md`). Nyitott: a rezidensjelölt szint még csak több mondatot és magasabb elvárást jelent; a „másik besúgó jelentésének szerkesztése” még nincs meg. További ötlet, hogy a hat kiosztott értelmezésből ne mindig legyen kettő óvatos.
2. **Mentés** – kész: minden lépés után localStorage-ba.
3. **Több hét** – kész: négy negyedév, 12 hét, elágazó lakói történetekkel. Új hethez `weeks.json`-bejegyzés és az adott szint (és negyedév) változatai kellenek; a validátor szól, ha valamelyik helyre kevés jut.
4. **Kiemelt feladatok:** a százados konkrét célpontot jelöl ki („Derítse ki, ki hallgat Szabad Európát!”), és ilyenkor el kell terelni a gyanút.
5. **Véletlen események:** pl. a szomszéd megkínál pogácsával, ami a következő terhelő mondatnál extra lelkiismeret-büntetést ad.
6. **Megosztható akta:** a befejezés után egy kép vagy link a saját „aktáról”, a legviccesebb jelentéssel.
7. **Hang:** írógép-kattogás a jelentésíráskor, pecsétpuffanás a válasznál (kikapcsolható).
