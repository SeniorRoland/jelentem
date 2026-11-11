# Játékterv

## Alapötlet

1979 tavasza, Alsóbürokrác, egy bérház (minden játékban más címen, pl. Béke utca 17.). A játékos motiválatlan besúgó, akit 1971-ben vagy 1972-ben szerveztek be, de azóta érdemi jelentést nem adott; a dossziéját most az új tartótiszt előveszi. Fedőneve véletlenszerű (pl. „Kockás Abrosz”). A tartótiszt, egy százados, hetente jelentést vár a ház lakóiról. A lakók unalmasak, és a játékos nem akar ártani nekik.

A játék lényege egyensúlyozás: a jelentés legyen elég izgalmas a századosnak, elég hihető, hogy ne kezdjenek gyanakodni a játékosra, és elég ártalmatlan, hogy a szomszédok ne kerüljenek bajba. A legjobb besúgó sokat ír, és semmit sem mond.

## Betöltő képernyő

Előtte a címkép: fekete képernyő, amelyen lassan, szavanként, elmosódásból élesedve előtűnik a cím, idézetként: „Jelentem, / nem történt semmi”. A vessző után lélegzetnyi szünet és sortörés, az utolsó szó előtt még egy. Alatta később a forrás: (Egy beszervezett). Pár másodperc csend után a kép elsötétül, és jön az irattár. Bármelyik kattintásra vagy billentyűre átugorható, csökkentett mozgásnál egyben látszik.

A címkép és a betöltés között egy tájékoztató lap áll (`loading.json` → `notice`): a játék szatíra a rendszerről, nem célja a korszak eseményeinek relativizálása, és nem az áldozatokon nevet. Továbblépni csak a „Tudomásul vettem” gombbal lehet. Ugyanez a szöveg bármikor előhívható a bal felső sarok „!” gombjával, a súgó „?” gombja mellett.

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

A következmények fokozódnak: a lakóra az év során összegyűlt ártalom 2 pontnál figyelmeztetést hoz (Mari nénit „elbeszélgetésre” hívják, Józsi bácsi garázsát átnézi a körzeti megbízott, Pityut behívatják a dékánira), 4 pontnál bajba kerül (házkutatás, bevont forgalmi, elmaradt tanulmányút; innen ágazik el a története), 7 pontnál a megélhetését is elveszíti (felfüggesztett nyugdíj, raktárrá tett garázs, kizárás az egyetemről). A figyelmeztetés még nem zárja ki a legjobb véget, csak jelzés.

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

1. **Megfigyelés:** négy eseménykártya a házból, a 144 darabos készletből sorsolva: egy-egy Mari nénire, Józsi bácsira és Pityura, a negyedik a házmesterre vagy a közös területre. A hét szintje (1–3) dönti el, mennyire izgalmas és terhelő; a harmadik héten minden változat a lakó titkára utal (kávé Bécsből, hinta, gépelt versek). Egy játékban egy megfigyelés csak egyszer jöhet. Ha ugyanaz a téma (Trabant, Bécs, gépelés) másodszor is bekerül a jelentésbe, a százados külön megjegyzést ír.
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
- **Kizárva a hálózatból:** passzív állományban két egymást követő negyedévet is hiányosra zártál, a dossziédat visszatették a polcra. A harmadik negyedéves értékelésnél, a játék vége előtt jöhet. Megúsztad, de nem dicsőséggel.

A befejezés az év végén, a 12. hét után jön, vagy korábban, ha valamelyik mérő nullára esik. Minden befejezés után jön a 2026. november 4-i epilógus: a játékos megnézi a saját aktáját a túlterhelt adatbázisban, és a házmester jelentését találja róla.

A befejezés alján „Az aktád”: a dosszié, ahogy 2026-ban előkerül. Az év mondata a legemlékezetesebb jelentett mondat (minél vadabb és kevésbé hihető, annál inkább, és ha a százados megjegyzést írt mellé, az még többet nyom), a pecsét az értékelés címe. Képként letölthető vagy megosztható, szövegként másolható.

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
- [x] **v0.0.3** (9296343): a hangok a `master` ágon, taggel.
- [x] **Fokozódó következmények** (260d9de): lakónként három lépcső az év során összegyűlt ártalom szerint: figyelmeztetés (2), bajba kerülés (4, a régi egyetlen következmény), a megélhetés elvesztése (7). A hét híre a legmagasabb új lépcső, a negyedéves értékelés jelzi a figyelmeztetést és a rombadöntést, a befejezés lépésről lépésre elmondja, és a lakó sorsának külön változata van. A kiegyensúlyozás nem változott; a véletlen játékos átlagosan 1,2 lakót tesz tönkre.
- [x] **Címkép** (b2a7a59): a betöltés előtt fekete képernyőn, drámaian, idézetként jelenik meg a cím, forrásként „(Egy beszervezett)”.
- [x] **v0.0.4** (a9fccd5): a fokozódó következmények és a címkép a `master` ágon, taggel.
- [x] **Megosztható akta** (7924b6c): a befejezés után a saját dossziéd képként (1080×1350, megsárgult karton): fénykép, fedőnév, kitakart valódi név, végső besorolás, a házmester jelentései rólad, az év mondata a százados kék tintás megjegyzésével, a bajba juttatott lakók és az értékelés pecsétje. Letölthető PNG-ként, telefonon megosztható, a rövid változata szövegként másolható; közzététel után a játék címe is rákerül.
- [x] **v0.0.5** (2c105b2): a megosztható akta a `master` ágon, taggel.
- [x] **A címkép idézőjele** (f59ac4a): a záró idézőjel nem törhet külön sorba.
- [x] **Súgó** (6e89972): bekeretezett gomb a bal felső sarokban (eredetileg „H”, ma „?”), mögötte kivonatos útmutató a játék menetéről (feladat, egy hét, a három mérő, negyedévek, a ház, tudnivalók), számok és titkok nélkül; Escape-pel vagy a háttérre kattintva zárul.
- [x] **v0.0.6** (d638d50): a címkép javítása és a súgó a `master` ágon, taggel.
- [x] **Közzététel** (976fa5e): a játék a https://seniorroland.github.io/jelentem/ címen játszható. A GitHub Actions minden `master`-re érkező push után validál, tesztel, buildel és kiteszi; a tároló a https://github.com/SeniorRoland/jelentem, a `master` az alapértelmezett ág.
- [x] **Átvezetések** (63f7125): közös jelenetlejátszó (átugorható, csökkentett mozgásnál egyben látszik), és három jelenet: új játék előtt a százados leemeli a poros dossziét, és rápecsételi a fedőnevet; hetek között letépett naptárlap az új hét dátumával és egy mondattal a házról (kb. 3,5 másodperc); a negyedéves értékelés előtt fekete lapon a negyedév eredményei: a minősítés pecsétje, a besorolás változása, a kiemelt feladat sorsa és a lakók állapota arcképpel.
- [x] **v0.0.7** (af477a4): az átvezetések a `master` ágon, taggel; az első kiadás, amely automatikusan kikerült a nyilvános oldalra.
- [x] **Tájékoztató** (df494c4): mi a játék, és mi nem: szatíra a rendszerről, amely nem relativizálja a korszak eseményeit, és nem az áldozatokon nevet. Saját lapon a címkép után, „Tudomásul vettem” gombbal; a bal felső sarokban „!” gombbal előhívható; a súgó gombja „H” helyett „?”.
- [x] **v0.0.8** (6c6f98b): a tájékoztató és a „?”/„!” gombok a `master` ágon, taggel, élesben.
- [x] **A sarok gombjai** (242b806): a lábléc megszűnt; a bal felső sarokban „?”, „!”, „♪” (hang be/ki: bekapcsolva olyan, mint a többi gomb, kikapcsolva piros vonal húzza át) és „↺” (új játék, előtte humoros kérdéssel: „Biztosan új fedőnevet kér, elvtárs?”). A fejlesztői mód csak a rejtett `?fejleszto` URL-paraméterrel kapcsol be.
- [x] **v0.0.9** (51aef6e): a sarok gombjai és a rejtett fejlesztői mód a `master` ágon, taggel, élesben.
- [x] **v0.0.10** (4965d60): a hosszabb heti átvezetés a `master` ágon, taggel, élesben.
- [x] **Bővített megfigyelés- és értelmezés-készlet** (1ae79d6): 48 új megfigyelés (lakónként +5 az 1. és +5 a 2. szinten, a házmesternek és a közös területnek szintenként +3) és 30 új értelmezés (tierenként +10), a felük a százados margójegyzetével. Az értékek a csoportjuk átlagán, így a kiegyensúlyozás nem változott (óvatos 36% → 35%, előrelátó 89% → 88%, a futtatások szórásán belül).
- [x] **v0.0.11** (750ae64): a bővített készlet a `master` ágon, taggel, élesben.
- [x] **Jutalmak és kizárás** (79d4e2b): az előléptetés jutalmának hatása van: megbízhatóként 100 forint és cigaretta (elégedettség +4, lelkiismeret −5), kiemeltként SZOT-beutaló (elégedettség +10, a következő negyedév első hete kimarad egy balatonfüredi képeslappal, utána +1 elvárás), rezidensjelöltként íróasztal és táskarádió (hihetőség +6, lelkiismeret −6). Passzív állományban két egymást követő hiányos negyedév után kizárás a hálózatból, saját befejezéssel. Szimuláció: óvatos 31,5% legjobb vég és 20,2% kizárás (a behívatás 54% → 38%), előrelátó 85,7% (88% volt; a beutaló kihagyott hete okozza).
- [x] **v0.0.12** (b9138ad): a jutalmak és a kizárás a `master` ágon, taggel, élesben.
- [x] **A százados bekukucskál** (f36b926): easter egg. Ritkán, véletlen pillanatban a százados (bajszos, ballonkabátos, kalapos, cigarettázó, áttetsző hátterű, generált figura) bekukucskál a képernyő egyik széléről, felülről fejjel lefelé lógva, egy pillanatig figyel, majd eltűnik. Akit rajtakap, annak kézzel írt megjegyzést hagy („A bizalom jó. Az ellenőrzés jobb.”). A súgó nem említi.
- [x] **v0.0.13** (735269d): a kukucskáló százados a `master` ágon, taggel, élesben.
- [x] **Rezidensjelölt szint** (cf37a3c): a legfelső rangon – csak az utolsó negyedévben, legfeljebb három hétig – egy másik, generált fedőnevű besúgó háromsoros jelentését is át kell nézni. A meghagyott mondat ártalma a lakót terheli, a felét a lelkiismeret is megérzi; a kihúzáshoz hetente két bikkfanyelvű indoklás jár, nélküle a százados megkérdezi: „Miért húzta ki? Kit véd?” A szimulációban a jól játszó, mindent ártalmasat kihúzó bot legjobb vége nem változott (86%); a mohó, mindent meghagyó játékosnál a lakók szenvednek.
- [x] **v0.0.14** (d49aa68): a rezidensjelölt szint a `master` ágon, taggel, élesben.
- [x] **A százados arca** (4fcef92): a kukucskáló figura a negyedéves értékelésen gemkapoccsal feltűzött fényképként (a minősítés pecsétje alatt, a kézírásos megjegyzés mellett), és a bevezető jelenet elején a sötétből előtűnve, lágyan elhalványuló széllel. Világos és sötét témában is; a képernyőolvasó nem olvassa fel.
- [x] **v0.0.15** (d3dd80b): a százados arca és a teljes játékleírás a `master` ágon, taggel, élesben.
- [x] **Verziószám a sarokban** (8154384, a bal alsó sarokba költöztetve: d8b55a6): a bal alsó sarokban halványan, fehérrel a játék verziója, a `package.json`-ból a build során, így minden kiadásnál magától frissül.
- [x] **v0.0.16** (f93e53e): a verziószám a `master` ágon, taggel, élesben.
- [x] **Képrészletek a képernyőkön** (COMMIT): a háttérfotóból kivágott apróságok a százados fényképéhez hasonlóan gemkapoccsal feltűzve, gépelt felirattal: a cigarettásdoboz a megbízhatói jutalomnál („Nyugtázni nem kell”), a piros telefon a behívatásnál („Ezen jött a hívás”). A kivágások kicsik, a torz feliratok nem olvashatók rajtuk. Újabb részlet: kép a `src/assets/details`-be, és `photo` mező a rangnál vagy a befejezésnél.

### Hátralévő

Az első blokk a következő nagyobb lépés; utána a sorrend javaslat.

**Hangolás és karbantartás**

- [ ] **Kocsivissza-felvétel:** a sorváltás most szintetizált; egy CC0 felvétel `src/assets/sounds/return.mp3` néven kódváltoztatás nélkül a helyére lép (a Freesoundon sok van, de a letöltéshez fiók kell).
- [ ] **Emberi nehézségi próba:** most, hogy a játék nyilvános, valódi játékosokkal is mérhető. A véletlen játékos most 0%-ban éri el a legjobb véget, az óvatos bot 36%-ban, az előrelátó 89%-ban. Ha emberi játékosnak túl nehéz, a `consequences.trouble` 4 → 5 sokat könnyít. Ötlet még, hogy a hat kiosztott értelmezésből ne mindig legyen kettő óvatos.
