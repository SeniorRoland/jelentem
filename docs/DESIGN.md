# Játékterv

## Alapötlet

1979 tavasza, Alsóbürokrác, egy bérház (minden játékban más címen, pl. Béke utca 17.). A játékos motiválatlan besúgó, akit 1971-ben vagy 1972-ben szerveztek be, de azóta érdemi jelentést nem adott; a dossziéját most az új tartótiszt előveszi. Fedőneve véletlenszerű (pl. „Kockás Abrosz”). A tartótiszt, egy százados, hetente jelentést vár a ház lakóiról. A lakók unalmasak, és a játékos nem akar ártani nekik.

A játék lényege egyensúlyozás: a jelentés legyen elég izgalmas a századosnak, elég hihető, hogy ne kezdjenek gyanakodni a játékosra, és elég ártalmatlan, hogy a szomszédok ne kerüljenek bajba. A legjobb besúgó sokat ír, és semmit sem mond.

## Betöltő képernyő

Indításkor a Központi Irattár „kikéri az aktát” (`src/ui/loading.ts`, szövegek: `src/content/loading.json`). Hat véletlen bürokratikus lépés fut le (pl. „Engedély kérése az engedélykéréshez”), írógépes folyamatjelzővel. Közben egy visszaesés visszaveti a haladást (pl. „A 2026-os adatbázis túlterhelt. Kérjük, próbálkozzon 1979-ben”), a végén 112 százalékos tervteljesítés és „Engedélyezve” pecsét jön. A pecsét a betűtípusok betöltését is megvárja. Mozgás csak a pecsétnél van; a „Sorban állás nélkül (protekcióval)” gomb azonnal átugorja.

## Beszervezési karton

A nyitóképernyőn a játékos saját, véletlenszerűen generált kartonja látható (`src/content/recruit.json`, `src/engine/recruit.ts`): név, születési év és hely, anyja neve, foglalkozás, munkahely, végzettség, kategória, a beszervezés ideje, osztályozása és alapja, fedőnév, valamint egy pecsételt hatjegyű sorszám. A mezők egymáshoz illenek:

- A **kategória** („Milyen kategóriába tartozik”) korlátozza a születési évet, a nemet és a foglalkozást (pl. a csendőr 1924 előtt született férfi, ma éjjeliőr vagy portás).
- A **vezetéknév** a személy egy igaz tulajdonságából jön (nomen est omen): foglalkozásból (a portás Kapus, a raktáros Kulcsár), kategóriából (a csendőr Vitéz, az osztályidegen Gróf), végzettségből (Deák) vagy korból (Ősz, Ifjú). A listában legalább 30 név van; a validátor ellenőrzi, hogy minden foglalkozáshoz és kategóriához jusson név. Fejlesztői módban a karton kiírja a név okát. Az anyja leánykori neve a születési helyből képződik (Iratosd → Iratosdi).
- A **beszervezés ideje** dönti el az osztályozási rendszert: 1972 előtt ügynök vagy informátor, 1972-től ügynök (Ü), titkos megbízott (TMB) vagy titkos munkatárs (TMT). Rezidens és K-/T-lakás-tulajdonos nem lehet, mert ezek nem illenek egy házról jelentő, kezdő hálózati személyhez.
- A „hű” és „lojális” kategóriájúakat informátornak, TMB-nek vagy TMT-nek, hazafias vagy lojális alapon szervezték be; a többieket ügynöknek, terhelő adatok vagy anyagi érdekeltség (néha ezek kombinációja) alapján.

A **kategória** a játékot is befolyásolja (`balance.json` → `categories`, a levélben a százados egy mondata utal rá):

- A „hű” és a „lojális” beszervezettől kevesebbet várnak, de a túlzásaik többe kerülnek (a hihetőség-veszteség 1,5-, illetve 1,25-szörös): a hű ember nem talál ki dolgokat.
- A kompromittált kategóriáktól (ellenforradalmi, egyéb ellenséges tevékenység, csendőr) többet várnak (+2–3 izgalom hetente), és kevésbé kételkednek bennük (0,75-szörös veszteség); a kulák, az egyházi és az osztályidegen a kettő között van (+1).

## Év, negyedévek, rangok

A játék 1979 egy éve: négy negyedév, mindegyik három hétből (március, június, szeptember, december). A negyedév végén negyedéves értékelés jön (`career.json`, `career.ts`):

- **Minősítés:** kiváló (a százados elégedett és a hihetőség jó), megfelelő vagy hiányos (a százados elégedetlen).
- **Rang:** passzív állomány → kezdő → megbízható → kiemelt hálózati személy → rezidensjelölt. Kiválóért előléptetés, hiányosért lefokozás jár. Az előléptetés büntetés is: magasabb elvárás, a kiemelt szinttől három mondatos jelentés. A jutalom szatirikus (100 forint és egy doboz cigaretta).
- **Átmenet:** a százados hangulata részben visszaáll, a lelkiismeret és a hihetőség kicsit helyreáll.
- **A ház állapota:** az értékelés lakónként kiírja, hogy nyugodt, szóba került vagy bajban van.

## A házmester ellenjelentése

Ha egy jelentés után a hihetőség 40 alá esik, a házmester a játékosról kezd jelenteni, és ezt a százados közli is („Mostantól hetente ír. Javasoljuk, hogy Ön is írjon magáról, mielőtt ő teszi.”). Ettől kezdve hetente egy rólad szóló megfigyelés is kézbe kerül (`observations.json` → `self`, 12 db, pl. „Alulírott vett egy kockás füzetet, pontosan olyat, mint amilyen a házmesteré”):

- Ha beírod a jelentésbe (önkritika), a hihetőség nő, és senkinek sem árt.
- Ha kihagyod, a házmester megírja helyetted; a százados idézi a jelentését, és számon kéri („Erről Ön nem írt. Miért nem?”), a hihetőség pedig esik. Így az alacsony hihetőség magától is mélyül, ha nem teszel ellene.
- A negyedéves értékelésnél, ha a hihetőség legalább 55, a házmester leáll; ha nem, tovább ír.
- A 2026-os epilógus megszámolja, hány jelentés szól rólad („3 találat, mind … Lajosné tollából”).

## Célfeladatok

A második negyedévtől minden negyedév elején a százados kiemelt feladatot ad (`tasks.json`): „Derítse ki, ki hallgatja a házban a Szabad Európa Rádiót!”, „Gyűjtsön adatot a házban fellelhető nyugati árucikkekről!”, „Derítse fel, tartanak-e a házban engedély nélküli összejövetelt!”, „Jelentse, ki mesél politikai vicceket a lépcsőházban!”. Egy játékban mindegyik legfeljebb egyszer jön.

- A feladat akkor teljesül, ha a negyedév valamelyik jelentésében van egy mondat a témáról: egy témába vágó megfigyelés (pl. Pityu éjszakai rádiózása) vagy értelmezés.
- Amíg a feladat nyitott, hetente egy **terelő kártya** is kézbe kerül (pl. „…amiből megállapítható, hogy a Szabad Európát a házban legfeljebb a padlás galambjai hallgatják”). Ártalmatlan megfigyeléshez (a házmester, a közös terület) téve senkinek sem árt: ez a gyanú elterelése.
- A negyedéves értékelésnél a teljesített feladat elégedettség-pluszt ad, a teljesítetlen büntetést, és a százados mindkettőt megjegyzi. Az utolsó negyedév feladata a befejezés előtt számolódik el.

## Lakói történetek

Minden negyedév harmadik hetén lakónként egy történet-megfigyelés jön (`observations.json` → `quarters`, `requires`). Az első negyedévben a titok bukkan fel, utána a történet két ágon folytatódik, attól függően, hogy a lakót érte-e már következmény:

- **Mari néni:** a bécsi sógornő látogatása, útlevélkérelem, karácsonyi kávé. Bajban: suttogva vásárol, elutasított útlevél, cetli nélküli befőtt.
- **Józsi bácsi:** a hinta elkészül, a gyerekeknek is épít egyet, végül beindul a Trabant. Bajban: gyalog hordja a gerendákat, elkobzott hinta, magas kerítés.
- **Pityu:** verses est a Kovács lánynak, gitár, eljegyzés. Bajban: katonai behívó, levelek a laktanyából, leszerelés.

A befejezésben a „Ami valójában történt” rész a titok mellett a lakó sorsát is elmondja (`residents.json` → `fate`). A játék minden lépés után mentődik (localStorage).

## A ház élete

A második héttől hetente 60% eséllyel történik valami a házban (`events.json`), és egy játékban egyik sem ismétlődik. Két fajtája van:

- **Házi esemény:** áramszünet, lakógyűlés, kommunista szombat, csőtörés, a tanács ellenőre, a százados civilben, új tévé, banán a közértben, telefon a házmesternél; negyedévhez kötve a kánikula, a szüreti bál és a fenyőfavásár. Módosíthatja a hét elvárását (−2 … +2), és hoz egy saját megfigyelést.
- **Kedvesség:** egy nyugodt lakó kedves hozzád (pogácsa, meggybefőtt, megjavított szék, pálinka, kölcsönlemez, felhordott szén…). Ettől **bizalmas viszony** lesz köztetek:
  - kapsz egy bizalmas megfigyelést, ami izgalmas, de terhelő: ez a kísértés;
  - amíg a viszony tart, hetente egy **alibi** kártya jár rá, amely a hétköznapi ügyeit szinte ártalom nélkül fedezi (izgalom 1, hihetőség 0, ártalom ×0,2), a bizalmas megfigyelést viszont nem; más lakóra vagy eseményre téve semmit sem fed, és a százados gyanakszik (−3 hihetőség);
  - ha mégis terhelőt írsz róla, az ártalom kétszer annyit von le a lelkiismeretedből, a viszony véget ér, és ő sem lesz többé kedves.

A negyedéves értékelés jelzi, ki bízik benned, és kit árultál el; a befejezésben a megtartott bizalomról külön mondat szól.

## Mérők

- **A százados elégedettsége (E):** az elvárás alatti izgalom csökkenti. Nullán: behívatás.
- **Hihetőség (H):** a túlzó értelmezések csökkentik. Nullán: a játékost kezdik megfigyelni.
- **Lelkiismeret (L):** a terhelő mondatok csökkentik, és a sértett lakót következmény éri.

## Egy hét menete

1. **Megfigyelés:** négy eseménykártya a házból, a 60 darabos készletből sorsolva: egy-egy Mari nénire, Józsi bácsira és Pityura, a negyedik a házmesterre vagy a közös területre. A hét szintje (1–3) dönti el, mennyire izgalmas és terhelő; a harmadik héten minden változat a lakó titkára utal (kávé Bécsből, hinta, gépelt versek). Egy játékban egy megfigyelés csak egyszer jöhet. Ha ugyanaz a téma (Trabant, Bécs, gépelés) másodszor is bekerül a jelentésbe, a százados külön megjegyzést ír.
2. **Jelentésírás:** két mondat, mindegyik egy megfigyelés és egy választható értelmezés. Hat értelmezés kerül kézbe a 40 darabos pakliból (két óvatos, két közepes, két vad), a még nem használtak előnyben.
3. **A százados válasza:** kék tintás margójegyzetek, összesítő megjegyzés, pecsét („Átvéve” vagy „Hiányos”), és ha valakire túl sok ártalom gyűlt, hír a házból.

## Szereplők (mind kitalált)

A lakók szerepe állandó, de a nevük, a koruk és az arcuk minden játékban más. A keresztnév szerepenként nyolc korhű jelöltből jön a becenévvel együtt (Mária / Mari néni, Erzsébet / Erzsi néni…; József / Józsi bácsi, Ferenc / Feri bácsi…; István / Pityu, László / Laci…; a házmesterné a férje nevén: Lajosné, Gézáné…). Az arckép 60 generált portréból sorsolódik a szerep neme és korhatára szerint, a lakó kora az arcképé. A nyitólevél után a megfigyelendő személyek arcképes listája jön, a jelentés minden mondata mellett ott a megfigyelt arca (rólad szóló mondatnál a tiéd, a közös területnél üres keret), és a beszervezési kartonon is van fénykép.

A lakók vezetékneve is minden játékban újra generálódik, a lakó egy igaz tulajdonságából (`residents.json` → `surnames`, öt jelölt lakónként): Mari néni lehet Szakács, Kosaras, Mézes, Szilvás vagy Borsos; Józsi bácsi Kerekes, Bognár, Ács, Asztalos vagy Bodnár; Pityu Hosszú, Göndör, Diák, Lantos vagy Fürtös; a házmester Szemes, Füles, Kulcsár, Kapus vagy Ajtós. Két szereplő (a beszervezettet is beleértve) soha nem kapja ugyanazt a nevet.

Az alábbi nevek az eredetiek, ezek a jelöltlisták első elemei.

- **Mari néni (Mária):** befőz, piacra jár. Titka: nyugatnémet kávé a bécsi sógornőtől.
- **Józsi bácsi (József):** örökké a Trabantot szereli. Titka: hintát épít a feleségének a 40. évfordulóra.
- **Pityu (István):** hosszú hajú egyetemista. Titka: Petőfi-versek gépelt másolata a Kovács lánynak.
- **A házmester (… Lajosné):** a házmester. Túl sokat kérdez. Az epilógusból kiderül, hogy a játékosról jelentett.
- **A százados:** a tartótiszt, a humor fő hordozója a margójegyzetekben. A neve is generált, és a szerepére utal (`captain.json`): Vadász (az ellenségre vadászik), Halász (adatokat halászik a zavarosban), Leskó (lesben áll), Fülöp (a fülét mindenhol ott tartja), Tollas (kék tollal javít), Bíró, Hallgató vagy Vizsgáló. A margón kezdőbetűvel szignál („V. szds.”). A neve sosem egyezik a beszervezettével vagy egy lakóéval.

## Befejezések

- **Jelentem, nem történt semmi:** minden mérő rendben, senkit nem ért következmény. A százados unalmában áthelyezését kéri.
- **Kiváló munkatárs:** a százados elégedett, de valakinek baja lett, vagy a lelkiismeret 70 alá esett.
- **Megfigyelt megfigyelő:** a hihetőség 30 alá esett.
- **Behívatás:** a százados elégedettsége 30 alá esett.

A befejezés az év végén, a 12. hét után jön, vagy korábban, ha valamelyik mérő nullára esik. Minden befejezés után jön a 2026. november 4-i epilógus: a játékos megnézi a saját aktáját a túlterhelt adatbázisban, és a házmester jelentését találja róla.

## Ütemterv

A „[x]” az elkészült, a „[ ]” a hátralévő lépés. A zárójelben a commit, amelyben elkészült.

### Elkészült

- [x] **Első kiegyensúlyozás** (5f68f63): az óvatos értelmezések már nem nullázzák az ártalmat, az elvárás és a következmény-küszöb szigorodott; új „előrelátó” bot a szimulációban.
- [x] **Beszervezési karton** (5613819): a nyitóképernyőn a játékos véletlen, összefüggő kartonja (kategória, a beszervezés ideje 1971–72-ben, osztályozás a korabeli rendszer szerint, alap, fedőnév, pecsételt sorszám), megsárgult papíron, kipontozott sorokkal.
- [x] **Generált, tulajdonság alapú vezetéknevek** (5613819): a beszervezett és a lakók neve is egy rájuk igaz tulajdonságból jön, ismétlődés nélkül; a szövegekben `{mari}`-féle helyettesítők.
- [x] **Megfigyelés-készlet és értelmezés-pakli** (5e62ee6): hetente sorsolt megfigyelések, 40 értelmezés, téma szerinti ismétlés-jegyzetek.
- [x] **Betöltő képernyő** (b421989): az akta kikérése az irattárból, visszaeséssel, 112 százalékos tervteljesítéssel és pecséttel.
- [x] **v0.0.1** (7789db2): a fentiek a `master` ágon, taggel.
- [x] **Négy negyedév, értékelés és rangok** (db9c3cd): 12 hét, negyedéves minősítés, előléptetés és lefokozás öt rangon át, a rang szerint több mondat és nagyobb elvárás.
- [x] **Mentés** (db9c3cd): minden lépés után localStorage-ba, a tartalomhoz nem illő mentés elvetésével.
- [x] **Lakói állapotok és elágazó történetek** (db9c3cd): nyugodt / szóba került / bajban; negyedévenként két ágon folytatódó történet lakónként (96 megfigyelés), a befejezésben a lakók sorsa.
- [x] **Újrahangolás négy negyedévre** (db9c3cd): a puszta óvatosság kevés (28%), tervezéssel a legjobb vég elérhető, de nem biztos (60%).
- [x] **A kategória hatása az elvárásra** (9905479): kategóriánként elvárás-pótlék és kételkedés, a levélben a százados mondata.
- [x] **Célfeladatok** (9905479): negyedévente egy feladat a második negyedévtől, terelő kártyákkal, jutalommal és büntetéssel. A kiemelt rangtól kötelező változat helyett minden rangon jár.
- [x] **Beolvasztás a `develop` ágba** (9905479): a negyedéves rendszer és a célfeladatok a `develop` ágon.
- [x] **Generált százados-név** (a9bb2aa): a szerepére utaló vezetéknév, kezdőbetűs szignó.
- [x] **Az asztal mint háttér** (5b823f9): a tartótiszt íróasztalának fotója a betöltő képernyőn élesen, játék közben elmosva, sötétítve; mobilon álló változat.
- [x] **A házmester ellenjelentése** (97b0cf1): alacsony hihetőségnél rólad szóló megfigyelések, önkritika vagy számonkérés, megnyugvás a negyedév végén, számlálás az epilógusban.
- [x] **Változatos ház, nevek és arcképek** (671d983): generált cím, keresztnév és becenév, 60 arckép kor és nem szerint, arcképes lakólista, arc a jelentés mondatai mellett, fénykép a kartonon; a Kovács lány neve is generált.
- [x] **Szomszédi viszony és véletlen események** (e9ac014): 12 házi esemény és 9 kedvesség, bizalmas megfigyelések, alibi kártyák, árulás dupla lelkiismeret-veszteséggel. A puszta óvatosság így gyakrabban elég (10% → 36%), a tervezés jobban kifizetődik (76% → 89%).
- [x] **v0.0.2** (1a570f5): a négy negyedév, a célfeladatok, az ellenjelentés, az asztal-háttér, a ház élete és a változatos nevek, arcképek a `master` ágon, taggel.
- [x] **Hang** (feed514): valódi írógép-felvételek (BigSoundBank, CC0, Hermes Precisa 305: billentyű, szóköz, csengő), a hiányzó hangok Web Audio-val szintetizálva: írógép-kattogás, ha egy cetli a jelentésbe kerül, csengő és új sor, ha egy mondatnak a megfigyelése és az értelmezése is megvan, egy billentyű, ha kikerül, a lap kihúzása a leadáskor, pecsétpuffanás a válasz és a negyedéves értékelés pecsétjével egy időben, lapozás képernyőváltáskor. A láblécben kikapcsolható, a beállítás megmarad.

### Hátralévő

Az első blokk a következő nagyobb lépés; utána a sorrend javaslat.

**A karrier tartalma**

- [ ] **Rezidensjelölt szint:** egy másik besúgó jelentését is szerkeszteni kell (kihúzni belőle, de a hiányt megmagyarázni). Most a legfelső rang csak több mondatot és nagyobb elvárást jelent.
- [ ] **A jutalmak mechanikai hatása:** a 100 forint és a cigaretta most csak szöveg; adjon például elégedettség-pluszt, egy SZOT-beutaló pedig hagyjon ki egy hetet, miközben nő az elvárás.
- [ ] **A passzív állomány mint út:** ha passzív állományban is hiányos a munka, „kizárás a hálózatból”, ami a legjobb vég egy másik változata lehet: a rendszer egyszerűen elfelejt.

**A ház élete**

- [ ] **Fokozódó következmények:** most lakónként egyetlen következmény van; legyen fokozatos (figyelmeztetés → házkutatás → a munkahely elvesztése).

**Befejezés és megjelenés**

- [ ] **Megosztható akta:** a befejezés után egy kép vagy link a saját aktáról, az év legviccesebb mondatával.
- [ ] **Képrészletek a képernyőkön:** a háttérfotóból kivágott apróságok egy-egy alkalmas helyre (a cigarettásdoboz az előléptetés jutalmánál, a piros telefon a behívatásnál). Előtte érdemes a fotók torz feliratait javítani, vagy WebP-re váltani, ha lesz hozzá kódoló.

**Hangolás és karbantartás**

- [ ] **Kocsivissza-felvétel:** a sorváltás most szintetizált; egy CC0 felvétel `src/assets/sounds/return.mp3` néven kódváltoztatás nélkül a helyére lép (a Freesoundon sok van, de a letöltéshez fiók kell).
- [ ] **Emberi nehézségi próba:** a véletlen játékos most 0%-ban éri el a legjobb véget, az óvatos bot 36%-ban, az előrelátó 89%-ban. Ha emberi játékosnak túl nehéz, a `consThreshold` 4 → 5 sokat könnyít. Ötlet még, hogy a hat kiosztott értelmezésből ne mindig legyen kettő óvatos.
- [ ] **Közzététel:** a README GitHub Pages-telepítést ír (`.github/workflows/deploy.yml`), de a fájl nincs a repóban, és távoli tároló sincs beállítva.
