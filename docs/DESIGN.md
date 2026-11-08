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

1. **Kiegyensúlyozás.** Az első kör kész (az óvatos értelmezések már nem nullázzák az ártalmat, magasabb elvárás, alacsonyabb következmény-küszöb; a véletlen játékos 14%-ban éri el a legjobb véget, lásd `CLAUDE.md`). Ha több hét lesz, újra kell hangolni; további ötlet, hogy a hat kiosztott értelmezésből ne mindig legyen kettő óvatos.
2. **Mentés** localStorage-ba (try/catch-csel, üres tárolóval is működjön).
3. **Több hét (12–15)**, a lakók titkainak fokozatos kibontásával. A megfigyelés-készlet már szintekre bontott, új hethez csak `weeks.json`-bejegyzés és az adott szint változatai kellenek: a titok egy ponton megfigyelésként is felbukkan, és el kell dönteni, beírja-e a játékos.
4. **Kiemelt feladatok:** a százados konkrét célpontot jelöl ki („Derítse ki, ki hallgat Szabad Európát!”), és ilyenkor el kell terelni a gyanút.
5. **Véletlen események:** pl. a szomszéd megkínál pogácsával, ami a következő terhelő mondatnál extra lelkiismeret-büntetést ad.
6. **Megosztható akta:** a befejezés után egy kép vagy link a saját „aktáról”, a legviccesebb jelentéssel.
7. **Hang:** írógép-kattogás a jelentésíráskor, pecsétpuffanás a válasznál (kikapcsolható).
