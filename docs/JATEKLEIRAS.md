# Jelentem, nem történt semmi – teljes játékleírás

> **Figyelem: ez a leírás mindent elárul.** A játék szabályait, a számokat, a rejtett mechanikákat, a lakók titkait és az összes befejezést. A játékon belüli súgó („?”) szándékosan nem tartalmaz ilyesmit; ez a dokumentum a fejlesztőknek, a tesztelőknek és azoknak szól, akik már végigjátszották, vagy nem bánják, ha mindent tudnak.

Minden szám a `src/content/balance.json` jelenlegi értéke (v0.0.14). Ha ott változik valami, ezt a leírást is frissíteni kell.

---

## Tartalom

1. [Mi ez a játék?](#1-mi-ez-a-játék)
2. [A képernyők sorrendje](#2-a-képernyők-sorrendje)
3. [A beszervezési karton és a kategória](#3-a-beszervezési-karton-és-a-kategória)
4. [A ház és a lakók](#4-a-ház-és-a-lakók)
5. [Egy hét: megfigyelések, értelmezések, mondatok](#5-egy-hét-megfigyelések-értelmezések-mondatok)
6. [A három mérő és a heti elszámolás](#6-a-három-mérő-és-a-heti-elszámolás)
7. [Az elvárás](#7-az-elvárás)
8. [Ártalom, következmények, a lakók sorsa](#8-ártalom-következmények-a-lakók-sorsa)
9. [A negyedév vége: értékelés, rang, jutalom, kizárás](#9-a-negyedév-vége-értékelés-rang-jutalom-kizárás)
10. [Célfeladatok](#10-célfeladatok)
11. [A házmester ellenjelentése](#11-a-házmester-ellenjelentése)
12. [A ház élete: események, bizalom, alibi, árulás](#12-a-ház-élete-események-bizalom-alibi-árulás)
13. [Rezidensjelölt: a másik besúgó jelentése](#13-rezidensjelölt-a-másik-besúgó-jelentése)
14. [Befejezések, és hogyan juthatsz el hozzájuk](#14-befejezések-és-hogyan-juthatsz-el-hozzájuk)
15. [Az akta](#15-az-akta)
16. [Általános tanácsok](#16-általános-tanácsok)
17. [A felület, a hang, a mentés, a rejtett dolgok](#17-a-felület-a-hang-a-mentés-a-rejtett-dolgok)
18. [Minden szám egy helyen](#18-minden-szám-egy-helyen)
19. [Mit mutat a szimuláció?](#19-mit-mutat-a-szimuláció)

---

## 1. Mi ez a játék?

1979, Alsóbürokrác, egy kitalált dunántúli kisváros bérháza. Te egy motiválatlan besúgó vagy, akit 1971-ben vagy 1972-ben szerveztek be, de azóta semmit sem jelentett. Most az új tartótiszt, egy százados, előveszi a dossziédat, és hetente jelentést vár a ház lakóiról.

**A cél:** egy éven át (négy negyedév, tizenkét hét) úgy jelenteni, hogy

- a **százados elégedett** legyen (izgalmas jelentést vár, és egyre többet),
- a jelentéseid **hihetők** maradjanak (aki túloz, arra gyanakodni kezdenek),
- és lehetőleg **senkinek ne essen baja** miattad (ami terhel, az a lakót és a lelkiismeretedet is sújtja).

A játék mottója a lényeget is mondja: *a legjobb besúgó sokat ír, és semmit sem mond.* A legjobb befejezés címe ugyanez: „Jelentem, nem történt semmi”.

A játék szatíra a rendszerről és a bürokráciáról, nem az áldozatokról. Minden szereplő, a ház, a város és a százados kitalált.

---

## 2. A képernyők sorrendje

1. **Címkép:** fekete képernyő, a cím idézetként, szavanként előtűnve: „Jelentem, / nem történt semmi”, alatta „(Egy beszervezett)”. Kb. 11 másodperc, kattintásra vagy billentyűre átugorható.
2. **Tájékoztató:** mit jelent a játék, és mit nem. Csak a **„Tudomásul vettem”** gombbal lehet továbblépni.
3. **Betöltés:** a Központi Irattár „kikéri az aktát”: hat véletlen bürokratikus lépés, egy visszaesés, végül 112%-os tervteljesítés és „Engedélyezve” pecsét. Az „Az akta megnyitása” gomb visz tovább, a „Sorban állás nélkül (protekcióval)” átugorja.
4. **Bevezető jelenet** (csak új játéknál): a sötétből előtűnik a százados (bajusz, ballonkabát, kalap, cigaretta), leemeli a poros dossziét, ráírja a fedőnevedet, és lepecsételi („Átvéve”).
5. **Nyitólevél és beszervezési karton:** a százados levele, a megfigyelendő személyek arcképes listája, a beszervezési kartonod. Itt kérhetsz másik fedőnevet. A „Munkába állok” indítja a játékot.
6. **Hetek** (12): minden hét előtt egy rövid naptárlap-jelenet, utána a **heti lap** (megfigyelések, értelmezések, a jelentés), majd a **visszaküldött lap** (a százados megjegyzései, a mérők, a hírek).
7. **Tartótiszt-csere** (az évek felében, a III. negyedév első hete előtt): „Személyi változás” jelenet az új százados fényképével ([6.2](#62-tartótiszt-csere)).
8. **Negyedéves értékelés** (a 3., 6. és 9. hét után): előtte egy jelenet a negyedév eredményeivel, utána a százados értékelése, amelyre gemkapoccsal a fényképét is feltűzte.
9. **Befejezés:** a 12. hét után, vagy korábban, ha egy mérő elfogy, vagy ha kizárnak. A végén a megosztható **akta**.

A játék minden lépés után mentődik; a böngésző bezárása után ugyanonnan folytatható.

---

## 3. A beszervezési karton és a kategória

Minden játék elején egy véletlen, de összefüggő karton készül: név (a vezetéknév egy rád igaz tulajdonságból), születési év és hely, anyja neve, foglalkozás, munkahely, végzettség, **kategória**, a beszervezés ideje (1971–72), osztályozás, a beszervezés alapja, fedőnév, pecsételt sorszám, és egy korhoz illő fénykép.

A **kategória** az egyetlen kartonadat, amelynek játékbeli hatása van:

| Kategória | Elvárás-pótlék hetente | Kételkedés (a hihetőség-veszteség szorzója) |
|---|---|---|
| népi demokráciához hű | **−1** | **×1,5** |
| lojális | 0 | ×1,25 |
| kulák | +1 | ×1 |
| egyházi | +1 | ×1 |
| osztályidegen | +1 | ×1 |
| ellenforradalmi tevékenység | +2 | ×0,75 |
| egyéb ellenséges tevékenység | +2 | ×0,75 |
| csendőr | **+3** | **×0,75** |

**Mit jelent ez?** A „hű” besúgótól kevesebbet várnak, de ha túloz, az jobban fáj neki (a negatív hihetőség másfélszeresét veszíti). A kompromittált múltú (csendőr, ellenséges) besúgótól többet várnak, cserébe a túlzásait elnézőbben fogadják. A levélben a százados egy mondattal utal is a kategóriádra.

> **Tipp:** a „hű” kategória a legkönnyebb óvatos játékra (kicsi az elvárás), a csendőr a legnehezebb (a szimulációban az óvatos stratégiával szinte soha nem jut el a legjobb végig).

---

## 4. A ház és a lakók

A ház címe minden játékban más (pl. „Tanács utca 41.”). Négy lakóról jelentesz; a szerepük állandó, a nevük, a koruk és az arcuk sorsolt:

| Lakó | Szerep | Kor | Példa nevek |
|---|---|---|---|
| az idős asszony („Mari néni”) | nyugdíjas, egyedül él a földszinten, bécsi sógornője van | 65–80 | Mária / Mari néni, Erzsébet / Erzsi néni, Ilona / Ilonka néni… |
| az ezermester („Józsi bácsi”) | nyugdíjas, az udvari garázs bérlője, Trabantja van | 57–75 | József / Józsi bácsi, János / Jani bácsi, Ferenc / Feri bácsi… |
| a fiatal („Pityu”) | egyetemi hallgató, albérletben a második emeleten | 20–28 | István / Pityu, László / Laci, Gábor / Gabi… |
| a házmester | a kapu melletti lakásban, nála a ház kulcsai | 44–61 | Lajosné, Gézáné, Tiborné… (férje nevén) |

A vezetéknevek is egy-egy igaz tulajdonságból jönnek (pl. „Kosaras”, mert kosárral jár a piacra; „Kerekes”, mert örökké a kocsiját szereli). A fiatal szerelmének, „a harmadik emeleti lánynak” a neve is sorsolt.

**A lakók titkai** (a „Ami valójában történt” részben derülnek ki; a 3. szintű megfigyelések ezekre utalnak):

- az idős asszony „gyanús” kávéja a bécsi sógornőjétől jön a karácsonyi csomagban;
- az ezermester a garázsban hintát épít a feleségének a negyvenedik házassági évfordulójukra;
- a fiatal füzetében Petőfi szerelmes versei vannak, írógéppel lemásolva, a lánynak.

A házmesternek nincs titka, és őt nem éri következmény. Viszont ő is figyel (lásd [11. fejezet](#11-a-házmester-ellenjelentése)).

---

## 5. Egy hét: megfigyelések, értelmezések, mondatok

### 5.1. A heti lap

- **Megfigyelések** (cetlik): hetente **négy**, egy-egy a három fő lakóról, a negyedik a házmesterről vagy a közös területről (pince, lépcsőház, udvar). Ezen felül jöhet egy rólad szóló „Alulírott…” megfigyelés (ha a házmester figyel), és egy-két eseményhez kötött megfigyelés.
- **Értelmezések** (kártyák): hetente **6**: 2 óvatos, 2 közepes, 2 vad. Ezen felül 1 **terelő** kártya, ha van nyitott célfeladat, és 1 **alibi** kártya, ha valaki egy kedvessége óta megbízik benned (szívesség után nem jár). A paklit a játék úgy keveri, hogy előbb a még nem használt kártyák jöjjenek.
- **A jelentés:** **2 vagy 3 mondathely**, a rangodtól függően ([9. fejezet](#9-a-negyedév-vége-értékelés-rang-jutalom-kizárás)).

### 5.2. Egy mondat

Egy mondat = **egy megfigyelés + legfeljebb egy értelmezés**. Koppints egy megfigyelésre: bekerül az első üres helyre. Koppints egy értelmezésre: a **legutóbb betett** olyan megfigyeléshez kapcsolódik, amelynek még nincs értelmezése. Így a megfigyelés → értelmezés → megfigyelés sorrend az első mondatot, a megfigyelés → megfigyelés → értelmezés a másodikat egészíti ki, az első puszta tény marad. Bármelyik cetlit **rá is húzhatod** a kívánt mondatra (egérrel azonnal, telefonon hosszú nyomás után; a lap széléhez érve görget): a megfigyelés lecseréli az ott lévőt, az értelmezés csak olyan mondatra kerülhet, amelyben már van megfigyelés. A jelentésben lévő részeket is áthúzhatod egy másik mondatra. A jelentésben lévő szövegre koppintva kiveheted. Nem kötelező minden helyet kitölteni, és az **üres jelentés** is jelentés (csak a százados nem fog örülni neki).

Értelmezés nélkül a mondat **puszta tény**: kicsit hihetőbb, és az ártalmát kissé csökkenti.

### 5.3. A megfigyelések

Minden megfigyelésnek van **izgalma** és **ártalma**. A hét szintje (1–3) határozza meg, milyen erősek:

| | 1. szint | 2. szint | 3. szint (titkok, negyedéves történetek) |
|---|---|---|---|
| idős asszony, ezermester | izgalom 1–3, ártalom 0–1 | izgalom 2–3, ártalom 1 | izgalom 4–6, ártalom 2–4 |
| a fiatal | izgalom 3–4, ártalom 2 | izgalom 5, ártalom 3 | izgalom 4–6, ártalom 2–4 |
| házmester, közös terület | izgalom 2, ártalom 0 | izgalom 2, ártalom 0 | izgalom 3, ártalom 0 |

A hetek szintje negyedévenként: **1., 2., 3.** (az első hét enyhe, a harmadik a legizgalmasabb és legterhelőbb). Egy megfigyelés egy játékban csak egyszer jöhet elő. A 3. szintű megfigyelések a lakó negyedéves történetét viszik, és **elágaznak**: ha a lakót már baj érte, a története a „bajban” ágon folytatódik.

> **Fontos:** a fiatalról szóló megfigyelések a legizgalmasabbak, de a legártalmasabbak is. A házmesterről és a közös területről szólók **ártalmatlanok**: ezek a legbiztonságosabb izgalomforrások.

### 5.4. Az értelmezések

| Típus | Izgalom | Hihetőség | Ártalom-szorzó | Mire jó |
|---|---|---|---|---|
| **óvatos** | 0–2 | 0…+3 | ×0,4 | hihetővé tesz, csökkenti az ártalmat |
| **közepes** | 2–5 | −2…+1 | ×0,5–1 | izgalmat ad, mérsékelt kockázattal |
| **vad** | 6–9 | −10…−4 | ×1,2–2 | sok izgalom, de hiteltelen és veszélyes |
| **terelő** | 3–4 | −1…0 | ×0,5 | teljesíti a célfeladatot valami ártalmatlan magyarázattal |
| **alibi** | 1 | 0 | ×0,2 | egy megbízó lakó hétköznapi ügyeit fedezi |
| *(puszta tény)* | 0 | +1 | ×0,8 | – |

### 5.5. Egy mondat pontozása

- **Izgalom** = a megfigyelés izgalma + az értelmezés izgalma.
- **Hihetőség** = az értelmezés hihetősége (puszta ténynél +1).
  - **Abszurditás:** ha egy legalább 7 izgalmú értelmezést egy legfeljebb 2 izgalmú megfigyelésre teszel, további **−3**.
  - Ha a hihetőség negatív, megszorzódik a kategóriád kételkedésével (kerekítve).
- **Ártalom** = a megfigyelés ártalma × az értelmezés szorzója, **kerekítve** (puszta ténynél ×0,8).

A kerekítés miatt az óvatos kártya (×0,4) csak az **1-es** ártalmat nullázza le; a 2-es és 3-as ártalomból 1 marad.

### 5.6. Példák (a játék motorjával kiszámolva)

| Mondat | Izgalom | Hihetőség | Ártalom |
|---|---|---|---|
| „Mari néni szombaton reggeltől estig befőzött, a lépcsőházban erős paprikaszag terjengett, **amelynek jelentőségét az idő fogja eldönteni**.” (1. szint + óvatos) | 2+2 = **4** | **+1** | 0×0,4 = **0** |
| „Józsi bácsi közölte, hogy a Trabantjára tizenkét évet várt, és most, hogy megvan, tizenkét évig fogja szerelni, **ami további megfigyelést indokolhat**.” (1. szint + közepes) | 2+3 = **5** | **0** | 1×0,5 = 0,5 → **1** |
| „Mari néni a gangon egy órán át rázta a porrongyot, szabályos, három rövid, három hosszú ütemben, **ami alapján a célszemély egy imperialista sejt vezetője lehet**.” (unalmas megfigyelés + vad) | 1+9 = **10** | −10 − 3 (abszurd) = **−13** | 0×2 = **0** |
| „Pityu késő éjjel a rádiókészüléke mellett ült, a falon recsegő, idegen nyelvű hangok szűrődtek át.” (2. szint, puszta tény) | **5** | **+1** | 3×0,8 = 2,4 → **2** |
| ugyanez **+ óvatos** („…amelynek jelentőségét az idő fogja eldönteni”) | 5+2 = **7** | **+1** | 3×0,4 = 1,2 → **1** |
| ugyanez **+ vad** („…és mindezt a Szabad Európa Rádió utasítására tette”) | 5+7 = **12** | **−6** | 3×2 = **6** |
| ugyanez **+ alibi** (ha a fiatal megbízik benned) | 5+1 = **6** | **0** | 3×0,2 = 0,6 → **1** |

A porrongyos példa jól mutatja a vad kártyák csapdáját: ártalmatlan, nagyon izgalmas, de egyetlen mondattal −26 hihetőséget ér.

### 5.7. A százados megjegyzései

A visszaküldött lapon minden mondat mellett lehet egy margójegyzet (a megfigyelésé vagy az értelmezésé; ha egy visszatérő témát – Bécs, a Trabant, a gépelés – másodszor jelentesz, egy külön „ismétlés” jegyzet). Alul pedig az egész jelentésre egy összegzés jön, az izgalom és az elvárás különbsége szerint:

| Helyzet | Megjegyzés |
|---|---|
| üres jelentés | „Elvtárs, üres lapot kaptam. Papírhiány idején ez különösen fájó.” |
| izgalom − elvárás < −2 | „Ez nem jelentés, hanem időjárás-jelentés. Több konkrétumot!” |
| −2 … +2 | „Megfelelő. Folytassa.” |
| +3 … +6 | „Jó irány. Maradjon ébren.” |
| több mint +6 | „Kiváló! Végre valami.” |
| ha a hihetőség összege −8 vagy kevesebb | külön: „Ne fantáziáljon, elvtárs. Az ilyen tehetségre a Filmgyárban van szükség.” |

A pecsét „Átvéve”, ha az elégedettség nem csökkent, különben „Hiányos”.

---

## 6. A három mérő és a heti elszámolás

| Mérő | Kezdő érték | Mit jelent |
|---|---|---|
| **A százados elégedettsége** (E) | 50 | mennyire elégedett veled |
| **Hihetőséged** (H) | 60 | mennyire hisznek neked |
| **Lelkiismereted** (L) | 100 | mennyire tudsz még tükörbe nézni |

Mindhárom 0 és 100 között mozog. A felületen sávként és szóval látszik (kritikus < 20 ≤ alacsony < 40 ≤ közepes < 70 ≤ magas).

**Hetente, a jelentés leadásakor:**

- **E** += (a mondatok izgalmának összege − a heti elvárás) × **3**, mínusz **1** minden elírásért (lásd lent)
- **H** += (a mondatok hihetőségének összege, plusz az ellenjelentés hatása) × **2**
- **L** −= (a mondatok ártalmának összege; egy megbízó lakót ért ártalom kétszeresen) × **5**

**Példa** (1. hét, lojális kategória, kezdő rang, elvárás 7): a paprikás és a Trabantos mondat a fenti táblázatból.
Izgalom 4+5 = 9, hihetőség 1+0 = 1, ártalom 0+1 = 1.
→ E: 50 + (9−7)×3 = **56**; H: 60 + 1×2 = **62**; L: 100 − 1×5 = **95**. Az ezermesterre 1 ártalom gyűlt („szóba került”). A százados: „Megfelelő. Folytassa.” (a különbség épp +2).

Ha egy jelentés után **bármelyik mérő 0-ra esik**, az ügyet azonnal lezárják ([14. fejezet](#14-befejezések-és-hogyan-juthatsz-el-hozzájuk)).

### 6.1. Gépelési hibák

Minden leadott mondatban lehet egy elírás: egy legalább ötbetűs szóban két szomszédos betű felcserélődik (az első és az utolsó betű sosem, a nevek sem). Az esélye mondatonként **4% + 20% × (1 − lelkiismeret/100)**, a heti elszámolás előtti lelkiismeret szerint: tiszta lelkiismerettel (L 100) **4%**, L 40-nél **16%**, L 0-nál **24%**. Remeg a kéz.

Minden elírás **−1 elégedettség** (a súlyozás után, közvetlenül). A visszaküldött lapon a hibás szó áthúzva látszik, fölötte a százados kézzel írt javítása, a lap alján pedig egy megjegyzése („Gépírásból elégtelen. A betűk sorrendje nem ízlés kérdése.”, „Kijavítottam. A tintát a fizetéséből vonom le.” …). Az aktába a helyes szöveg kerül.

> **Tipp:** az elírás ellen nem lehet közvetlenül védekezni, de ritkább, ha nem ártasz, mert akkor magas marad a lelkiismeret.

### 6.2. Tartótiszt-csere

Az évek **felében** (50%) a III. negyedév első lejátszott hetén új százados veszi át az ügyedet. Ezt a játék elején sorsolja ki, és előre semmi nem jelzi. A hét előtt egy jelenet mutatja be: „Személyi változás”, az új tartótiszt fényképe (szemüveges, szakállas, csíkos öltönyös férfi), „…századost áthelyezték. Hogy hová, azt nem közölték.”, és egy pletyka arról, mit szeret. Ettől kezdve az ő neve és aláírása áll a lapokon, és az ő fényképe kerül a negyedéves értékelésre.

Az új századosnak **ízlése** van, és ez minden mondatod izgalmát módosítja, az értelmezés fajtája szerint:

| Ízlés | A pletyka | Puszta tény | Óvatos | Közepes | Vad |
|---|---|---|---|---|---|
| **Eseményes** | „Ő szereti, ha történik valami.” | −1 | −1 | 0 | **+2** |
| **Száraz** | „Neki a tények kellenek, szárazon.” | **+1** | **+1** | 0 | −2 |

(A terelő és az alibi kártyát az ízlés nem érinti.)

**Példa:** a száraz százados alatt egy 4-es izgalmú megfigyelés óvatos (izgalom 1) értelmezéssel 4+1+1 = **6** izgalmat ér, vad (izgalom 6) értelmezéssel 4+6−2 = **8**-at.

> **Tipp:** figyeld a pletykát. Eseményes századosnál a vad értelmezés megéri, de vigyázz, mert a vad értelmezés ártalma is nagy. Száraz századosnál az óvatos és a puszta tény is kielégítheti, és ez a kíméletes játéknak kedvez.

---

## 7. Az elvárás

A heti elvárás = **alapelvárás** + **rangpótlék** + **kategóriapótlék** + (ha volt) **esemény-módosítás** + (a SZOT-beutaló utáni negyedévben) **+1**.

**Alapelvárás hetenként:**

| | 1. hét | 2. hét | 3. hét |
|---|---|---|---|
| I. negyedév (március) | 7 | 9 | 11 |
| II. negyedév (június) | 7 | 9 | 11 |
| III. negyedév (szeptember) | 8 | 10 | 12 |
| IV. negyedév (december) | 8 | 10 | 12 |

**Rangpótlék:** passzív 0, kezdő 0, megbízható +1, kiemelt +3, rezidensjelölt +4.

**Példa:** a III. negyedév 3. hetén egy kiemelt (+3), csendőr (+3) besúgótól, ha éppen a tanács ellenőre járt a házban (+2): 12 + 3 + 3 + 2 = **20** izgalmat várnak egyetlen jelentéstől. Ez három mondatból már csak kockázatosan jön össze.

---

## 8. Ártalom, következmények, a lakók sorsa

Minden jelentett ártalom a megfigyelés lakójára **összegyűlik az év során** (a házmesterre és a közös területre nem). Ahogy nő, lépcsőket lép át, és **soha nem megy vissza**:

| Összegyűlt ártalom | Lépcső | Mi történik (példák) |
|---|---|---|
| ≥ 1 | *szóba került* | még semmi, de már gyanús |
| ≥ **2** | **figyelmeztetés** | az idős asszonyt „elbeszélgetésre” hívják; az ezermester garázsát átnézi a körzeti megbízott; a fiatalt behívatják a dékánira |
| ≥ **4** | **bajban** | házkutatás; bevont forgalmi; elmaradt bécsi tanulmányút – **a lakó története innen a „bajban” ágon folytatódik** |
| ≥ **7** | **a megélhetés elvesztése** | felfüggesztett nyugdíj; a garázst raktárnak utalják ki; kizárják az egyetemről |

A hír a visszaküldött lap „Hírek a házból” részében jelenik meg (egy héten lakónként csak a legmagasabb új lépcső). A negyedéves értékelés lakólistáján is látszik, a befejezés pedig lépésről lépésre elmondja.

**A legjobb befejezést a „bajban” lépcső zárja ki** – a figyelmeztetés még nem, az csak jelzés.

**Példa:** a vad kártyás Pityu-mondat (ártalom 6) egyetlen héten átlépi a 2-es és a 4-es lépcsőt is: a hír „bajba került” lesz, és a fiatal története onnantól másképp alakul. Ha később még 1 ártalom éri, elveszíti az egyetemi helyét.

---

## 9. A negyedév vége: értékelés, rang, jutalom, kizárás

A 3., 6. és 9. hét után jön a **negyedéves értékelés** (a 12. után nincs, ott a befejezés jön). Ennek sorrendje:

1. **A célfeladat elszámolása:** teljesítve E **+8**, elmaradva E **−12**.
2. **Minősítés** (az így kapott mérők szerint):
   - **Kiváló**, ha E ≥ **65** és H ≥ **45**;
   - **Hiányos**, ha E < **45**;
   - különben **Megfelelő**.
3. **Rangváltás:** kiváló → egy ranggal feljebb, hiányos → egy ranggal lejjebb, megfelelő → marad.
4. **Pihentetés:** E 20%-ot visszahúzódik az 50 felé (pl. 80 → 74, 30 → 34); H **+8**; L **+15**.
5. **A házmester** abbahagyja az ellenjelentést, ha H most legalább **55**.
6. **Kizárás** és **jutalom** (lásd lent).

### 9.1. Rangok

| Rang | Mondathely | Rangpótlék | Jutalom az előléptetéskor | A jutalom hatása |
|---|---|---|---|---|
| passzív állomány | 2 | 0 | – | – |
| **kezdő hálózati személy** (kezdő rang) | 2 | 0 | – | – |
| megbízható hálózati személy | 2 | +1 | 100 forint és egy doboz cigaretta | E **+4**, L **−5** |
| kiemelt hálózati személy | **3** | +3 | SZOT-beutaló Balatonfüredre | E **+10**; a következő negyedév **első hete kimarad** (balatonfüredi képeslappal), a negyedév további heteiben **+1** elvárás |
| rezidensjelölt | **3** | +4 | saját íróasztal és egy Orion táskarádió | H **+6**, L **−6**; és jön az átnézés ([13. fejezet](#13-rezidensjelölt-a-másik-besúgó-jelentése)) |

A rangot csak negyedév végén lehet váltani, és egyszerre csak eggyel. Rezidensjelöltté ezért legkorábban a III. negyedév végén lehet válni (kezdőből három kiváló negyedév kell), vagyis **ez a rang legfeljebb az utolsó három hétre szól**.

A megbízhatói jutalom mellé az értékelésen a cigarettásdoboz fényképe is odakerül („Nyugtázni nem kell”).

A beutaló hetében nincs jelentés, nincs esemény, és a mérők sem változnak. Ha abban a negyedévben célfeladat jár, azt az első lejátszott hét adja ki.

> **Tipp:** az előléptetés kétélű. Több mondat több izgalmat ad, de nagyobb elvárást is, és a jutalmak a lelkiismeretbe kerülnek. Ha a legjobb végre hajtasz, nem baj, ha nem rohansz a ranglétrán.

### 9.2. Kizárás a hálózatból

Ha **passzív állományban** két egymást követő negyedévet is **hiányosra** zársz, kizárnak a hálózatból: az értékelés után az ügy lezárul, és a „Kizárva a hálózatból” befejezés jön. (Az a negyedév, amelyben *lefokoznak* passzívba, még nem számít bele, csak az, amelyiket már passzívként kezded.) A gyakorlatban ez a harmadik negyedéves értékelésnél történhet meg.

---

## 10. Célfeladatok

A **II. negyedévtől** minden negyedév első hetén a százados kiad egy **kiemelt feladatot** (egy játékban mindegyik legfeljebb egyszer):

| Feladat | Téma |
|---|---|
| „Derítse ki, ki hallgatja a házban a Szabad Európa Rádiót!” | SZE |
| „Gyűjtsön adatot a házban fellelhető nyugati árucikkekről!” | nyugati áru |
| „Derítse fel, tartanak-e a házban engedély nélküli összejövetelt!” | összejövetel |
| „Jelentse, ki mesél politikai vicceket a lépcsőházban!” | vicc |

A feladat a negyedév bármelyik hetén teljesül, ha a jelentés **egy mondatának megfigyelése vagy értelmezése** a feladat témájához tartozik. A heti lapon egy keretes doboz mutatja az állapotát.

Amíg a feladat nyitott, minden héten kapsz egy **terelő kártyát** a témájához: ez teljesíti a feladatot, de valami ártalmatlant okol (pl. a hangokat „a pincében tárolt, elromlott rádió adhatta le magától”). Így a feladat teljesíthető anélkül, hogy bárkire terhelőt írnál.

Elszámolás a negyedév végén: **+8** vagy **−12** elégedettség (az utolsó negyedévben a befejezés előtt). Ha a játék korábban ér véget, a már teljesített feladat teljesítettnek számít, de jutalom nélkül.

> **Tipp:** tedd a terelő kártyát egy ártalmatlan megfigyelésre (házmester, közös terület), és a feladat kockázat nélkül teljesül. A 12 pontos büntetés egy egész negyedévnyi munkát elronthat.

---

## 11. A házmester ellenjelentése

Ha egy jelentés után a **hihetőséged 40 alá esik**, a házmester is elkezd rólad jelenteni (a hír a visszaküldött lapon: „Önről”). Ettől kezdve minden héten kapsz egy rólad szóló megfigyelést is („Alulírott…”, izgalom 1–2, ártalom 0):

- ha **beírod** a saját jelentésedbe (önkritika): hihetőség **+2** (×2 = +4 H), és a százados elismeri;
- ha **kihagyod**: hihetőség **−4** (×2 = −8 H), a házmester jelentése megérkezik helyetted („Erről Ön nem írt. Miért nem?”), és nő a rólad szóló jelentések száma.

A figyelés a negyedév végén szűnik meg, ha a hihetőséged (a pihentetés után) legalább **55**. A befejezés epilógusában kiderül, hány jelentés szól rólad.

> **Tipp:** ha figyelnek, mindig írd be az „Alulírott…” mondatot. Ártalmatlan, ad egy kis izgalmat, és hihetőséget hoz ahelyett, hogy elvenne.

---

## 12. A ház élete: események, bizalom, alibi, árulás

### 12.1. Házi események

A **2. héttől** minden héten **60%** eséllyel történik valami a házban (egy játékban mindegyik legfeljebb egyszer). Az esemény a heti lap tetején jelenik meg, és hoz egy saját megfigyelést.

| Esemény | Elvárás | Mikor |
|---|---|---|
| Áramszünet | **−2** | bármikor |
| Kánikula | **−2** | csak júniusban |
| Lakógyűlés | +1 | bármikor |
| Kommunista szombat | +1 | bármikor |
| Telefon (a házmesternél) | +1 | bármikor |
| A tanács ellenőre | **+2** | bármikor |
| Civil sétáló (a százados a környéken) | **+2** | bármikor |
| Csőtörés, Új tévé, Banán | 0 | bármikor |
| Szüreti bál | 0 | csak szeptemberben |
| Fenyőfa | 0 | csak decemberben |

### 12.2. Kedvesség és bizalom

Az eseményt egy lakó **kedvessége** is adhatja (pogácsa, meggybefőtt, levélfelolvasás; megjavított szék, pálinka, fuvar; kölcsönlemez, felhordott szén, tanács a vershez). Ez csak olyan lakótól jöhet, akit **még semmi ártalom nem ért**, aki még nem bízik benned, és akit még nem árultál el.

A kedvességtől **bizalmas viszony** lesz köztetek:

- **Kísértés:** kapsz egy *bizalmas* megfigyelést róla (izgalom 4–6, ártalom 3) – ez a legnagyobb izgalom, amit a héten kaphatsz.
- **Alibi:** amíg a viszony tart, hetente jár egy **alibi kártya** rá (izgalom 1, hihetőség 0, ártalom ×0,2). A lakó **hétköznapi** ügyeit fedezi. Ha másik lakóra vagy egy eseményhez kötött megfigyelésre (a bizalmasra is!) teszed, **semmit sem fed**: teljes ártalom, hihetőség **−3**, és a százados megkérdezi: „Kit véd Ön, elvtárs, és mitől?”
- **Árulás:** ha mégis ártalmasat jelentesz róla, annak a mondatnak az ártalma **kétszeresen** sújtja a lelkiismeretedet, a bizalom véget ér, és ő többé nem lesz kedves. A hírt is megkapod („…azóta nem köszön a lépcsőházban”).
- **Megtartott bizalom:** ha a játék végéig nem árulod el, a befejezésben külön mondat szól róla.

> **Tipp:** a bizalmas megfigyelést hagyd a cetlik között. Az alibivel viszont sokkal biztonságosabban jelenthetsz a lakó hétköznapjairól, mert egy 2-es ártalmat teljesen, egy 3-ast majdnem teljesen eltüntet.

### 12.3. A lépcsőházban

A 2. héttől minden heti lapon, a hét bevezetője alatt egy mondat szól arról, kivel találkoztál a lépcsőházban, és hogyan nézett rád. A három lakó sorban követi egymást (a hét sorszáma szerint), mérőszám nélkül. A mondat a lakó helyzetétől függ, ebben a sorrendben:

1. **elárultad** (bizalmas lakót ért ártalom): kerül téged („meglátott a lépcsőn, és visszafordult”);
2. **bajban van** (következmény érte): magába roskadt, a lakása elcsendesedett;
3. **bízik benned**: kedves, rád bíz valamit;
4. **szóba került** (érte már ártalom): óvatos, gyorsan becsukja az ajtót;
5. **nyugodt**: hétköznapi, barátságos.

Ez nem ad új információt ahhoz képest, amit a negyedéves értékelés is mutat, de hétről hétre, finoman jelzi, hogyan áll a ház veled.

### 12.4. Szívességek

A 3. héttől hetente **30%** eséllyel egy lakó szívességet kér (évente legfeljebb **3**, mindegyik csak egyszer; elárult vagy bajba jutott lakó nem kér). Kilenc kérés van, lakónként három: feladni egy levelet Bécsbe, átvenni egy csomagot, vigyázni egy kulcsra; elrejteni egy alkatrészt vagy egy szerszámosládát, aláírni egy tanúsítványt; megőrizni egy doboz könyvet, elvinni egy borítékot Pestre, kölcsönadni az írógépet.

A heti lapon a kérés alatt két gomb: **Elvállalom** / **Nem vállalom** (újra megnyomva visszavonható). A döntés a jelentés leadásakor számít; ha nem döntesz, az **nem**.

- **Igen:** a lakó **megbízik benned** (mint egy kedvesség után): ha később ártasz neki, az árulás, kétszeres lelkiismeret-veszteséggel. **Alibi kártya ezért nem jár.** **30%** eséllyel a százados tudomást szerez róla: elégedettség **−3**, hihetőség **−6**, és megjegyzést fűz hozzá („A barátkozást hagyja ránk.”).
- **Nem:** a lakó eltávolodik (ha megbízott benned, már nem bízik), lelkiismeret **−3**.

A visszaküldött lap „Hírek a házból” részében olvasod, hogyan alakult (pl. „…másnap egy tányér diós kalácsot hagyott a kilincseden.”).

> **Tipp:** a szívesség a kíméletes játékot segíti: aki megbízik benned, azt jobban fáj bántani, és a szimulációban a tervező játékos ettől óvatosabban jelent. Ha a hihetőséged alacsony, egy kiderült szívesség lefokozást hozhat, akkor inkább mondj nemet.

---

## 13. Rezidensjelölt: a másik besúgó jelentése

Rezidensjelöltként a heti lapon a saját jelentésed alatt megjelenik egy **másik hálózati személy** (generált fedőnév, pl. „Kockás Porszívó”) **háromsoros jelentése**, amelyet továbbítás előtt át kell nézned. A mondatai a hét szintjéhez illő megfigyelésekből és a kezedben nem lévő közepes vagy vad értelmezésekből állnak, lehetőleg három különböző lakóról. Ezeket a megfigyeléseket te később sem kapod meg.

Mondatonként koppintással **kihúzhatod** vagy visszateheted:

| Ha a mondatot… | Akkor |
|---|---|
| **meghagyod** | az **ártalma teljes egészében a lakót** terheli (a következmények között számít), a **fele a lelkiismeretedet**; az **izgalmának fele** a te jelentésedhez adódik |
| **kihúzod, indoklással** | semmi ártalom; hihetőség **−1** (×2) |
| **kihúzod, indoklás nélkül** | semmi ártalom; hihetőség **−4** (×2), és a százados a margóra írja: „Miért húzta ki? Kit véd?” |

Hetente **két indoklás** jár (bikkfanyelvűek, pl. „A forrás megbízhatatlan, ugyanis a házmester.”), és ezek a kihúzás sorrendjében jutnak a mondatokhoz. A harmadik kihúzás mindig indoklás nélküli. Alul látszik, hány indoklás maradt.

> **Tipp:** ha a hihetőséged rendben van, húzz ki mindent, ami ártana. A szimulációban ez a jól játszó stratégiát egyáltalán nem rontja: a hitel elbírja az árát. Aki mindent meghagy, a lakókon veri le.

---

## 14. Befejezések, és hogyan juthatsz el hozzájuk

A befejezés a 12. hét után jön (az utolsó negyedév feladata ilyenkor még elszámolódik), vagy korábban: ha egy jelentés után bármelyik mérő **0-ra esik**, vagy ha **kizárnak**. A feltételeket a játék ebben a sorrendben nézi:

| # | Befejezés | Mikor |
|---|---|---|
| 1 | **Kizárva a hálózatból** | két egymást követő hiányos negyedév passzív állományban |
| 2 | **Megfigyelt megfigyelő** | a hihetőség 0-ra esett |
| 3 | **Behívatás** | az elégedettség 0-ra esett |
| 4 | **Kiváló munkatárs** | a lelkiismeret 0-ra esett |
| 5 | **Megfigyelt megfigyelő** | a végén a hihetőség 30 alatt van |
| 6 | **Behívatás** | a végén az elégedettség 30 alatt van |
| 7 | **Kiváló munkatárs** | a végén a lelkiismeret 70 alatt van, **vagy valaki bajba került** (legalább 4 ártalom) |
| 8 | **Jelentem, nem történt semmi** | minden más esetben |

### 14.1. „Jelentem, nem történt semmi” – a legjobb befejezés

*Egy éven át írtál, és semmit sem mondtál. A százados unalmában az áthelyezését kérte a balatoni kirendeltségre. A ház lakói soha nem tudták meg, kinek köszönhetik a nyugalmukat.*

**Feltétel:** a végén E ≥ 30, H ≥ 30, L ≥ 70, senki sincs bajban (legfeljebb figyelmeztetést kapott), és nem zártak ki.

**Hogyan:**
- Az izgalmat **ártalmatlan forrásból** szerezd: a házmesterről és a közös területről szóló megfigyelésekből, az események megfigyeléseiből, és az óvatos vagy közepes kártyákból ártalmatlan megfigyeléseken.
- A lakókról szóló megfigyelést óvatos kártyával vagy alibivel írd, és csak ha az ártalma legfeljebb 1 (óvatossal) vagy 2 (alibivel).
- **A vad kártyákat** csak ártalmatlan megfigyelésen használd, és csak akkor, ha a hitelednek belefér (az abszurditás −3-at hoz).
- **Nem kell minden héten elérned az elvárást.** Az elégedettségnek csak 30 felett kell maradnia, és a negyedévek végén vissza is húzódik az 50 felé.
- Teljesítsd a célfeladatokat a terelő kártyával.
- Ha a házmester figyel, írd be az „Alulírott…” mondatot.
- Tartsd meg a bizalmat: ne áruld el azt, aki megbízott benned.
- A lelkiismeret 70-es határára figyelj: a megbízható és a rezidensjelölt rang jutalma 5–6 pontot elvesz belőle.

### 14.2. „Kiváló munkatárs”

*A százados elégedett. Dicséretet kaptál és egy Orion táskarádiót. A házban viszont valahogy mindenki elhallgat, amikor megjelensz a lépcsőházban.*

**Feltétel:** valakit bajba juttattál (legalább 4 összegyűlt ártalom), vagy a lelkiismereted 70 alá esett (akár nullára is).

**Hogyan:** jelents izgalmasan és terhelően a lakókról, főleg a fiatalról, közepes és vad kártyákkal, de tartsd a hitelt 30 felett. Ez a „sikeres besúgó” befejezése, ami a játék szemszögéből kudarc.

### 14.3. „Megfigyelt megfigyelő”

*A jelentéseid túl izgalmasak voltak ahhoz, hogy igazak legyenek. A százados új besúgót állított rád.*

**Feltétel:** a hihetőség a végén 30 alatt van, vagy közben 0-ra esik.

**Hogyan:** sok vad kártya, főleg unalmas megfigyeléseken (abszurditás), és ha a házmester figyel, az „Alulírott…” mondatok kihagyása. A kételkedő kategóriák (a „hű” ×1,5) gyorsabban jutnak ide. Ez a leggyakoribb befejezés, ha valaki csak az izgalomra hajt.

### 14.4. „Behívatás”

*A százados szerint a jelentéseid a rádió időjárás-jelentésénél is kevésbé izgalmasak. Elbeszélgetésre rendeltek be, ahol három órán át egy eltűnt szánkóról kérdeztek.*

A lapon gemkapoccsal a piros telefon fényképe („Ezen jött a hívás”).

**Feltétel:** az elégedettség a végén 30 alatt van, vagy közben 0-ra esik.

**Hogyan:** üres vagy unalmas jelentések, elmaradt célfeladatok. Három üres jelentés egymás után már az első negyedévben ide vezet.

### 14.5. „Kizárva a hálózatból”

*A százados a dossziédra ráírta: „Alkalmatlan. A kapcsolattartást megszüntetjük.” A dossziét visszatették a polcra, és többé senki sem kereste. A ház lakói semmit sem vettek észre. Talán ez volt a legtöbb, amit értük tehettél, még ha nem is így tervezted.*

**Feltétel:** passzív állományban két egymást követő negyedévet is hiányosra zársz.

**Hogyan:** játssz nagyon óvatosan és keveset: az első vagy második negyedévben hiányos minősítéssel kerülj passzív állományba, aztán maradj ott hiányosan. A „megúsztad, de nem dicsőséggel” befejezés; ilyenkor általában senkinek sem esik baja. A szimulációban az óvatos játékosok ötöde jut ide.

### 14.6. Ami minden befejezés után jön

- **Teljesítménykimutatás:** táblázat az évedről. Az első sor a kiinduló állapot (E 50, H 60, L 100), utána soronként minden lejátszott hét jelentése és minden negyedév vége (a minősítéssel), az utolsó negyedévben a célfeladat elszámolása is. Minden cellában a mérő értéke a sor után, és mellette a változása (+, −, ±0). A negyedévsor a pihentetést, a feladatot és a jutalmat együtt mutatja. Alatta az **összesítés** mérőnként: a legjobb és a legrosszabb hét (csak a heti jelentésekből, egyenlőségnél a korábbi), és a heti jelentések összes hatása. A SZOT-hét kimarad belőle. Ez az egyetlen hely, ahol a mérők pontos számait fejlesztői mód nélkül is látod.
- **Ami a jelentéseid nyomán történt:** minden lakó minden elért lépcsője, sorrendben.
- **Ami valójában történt:** a lakók titkai (lásd [4. fejezet](#4-a-ház-és-a-lakók)), a sorsuk a lépcsőjük szerint (rendben / bajban / tönkretéve), és ha valaki megbízott benned a végéig, az ő külön mondata.
- **2026. november 4.:** az iratok nyilvánosak lettek; megtudod, hány jelentés szól rólad.
- **Az aktád** (következő fejezet).

---

## 15. Az akta

A befejezés alján a saját dossziéd képként (1080×1350, megsárgult karton): fénykép, fedőnév, kitakart valódi név, végső besorolás, hány hét és hány mondat, a házmester jelentései rólad, hányan bíztak meg benned, **az év mondata** a százados kézírásos megjegyzésével, a bajba juttatott lakók, és az értékelés piros pecsétként.

**Az év mondata** a legemlékezetesebb jelentett mondat: a pontszáma *izgalom − hihetőség + 4 (ha volt hozzá margójegyzet) − 0,1 × ártalom*. Minél vadabb, hiteltelenebb, és minél többet szólt hozzá a százados, annál inkább.

Gombok: **letöltés** PNG-ként, **megosztás** (ahol a böngésző tudja, főleg telefonon), **szöveg másolása** (rövid összefoglaló a játék címével).

---

### 15.1. Érdemrendek

A játékokon átívelő kitüntetések, ebben a böngészőben tárolva (törléskor elvesznek). A befejezés lapján megjelenik, mit érdemeltél ki az évben (az újak finoman ragyognak), és bármikor megnézheted mindet a bal felső sarok **★** gombja mögötti fiókban. A még meg nem szerzetteknek csak egy homályos tippje látszik.

| Érdemrend | Hogyan kapod |
|---|---|
| **Jelentem, nem történt semmi** | a legjobb befejezés |
| **Kiváló dolgozó** | „Kiváló munkatárs” befejezés |
| **Három óra a szánkóról** | behívatás |
| **Kizárva, becsülettel** | kizárás a hálózatból |
| **Saját akta** | „Megfigyelt” befejezés |
| **Tiszta kéz** | mind a 12 hét, és senkit (a házmesternét sem) ért ártalom |
| **Rezidensjelölt** | a legfelső rang a végén |
| **Minden feladat teljesítve** | legalább 3 célfeladat, mind teljesítve |
| **A ház barátja** | a végén legalább ketten megbíznak benned (kedvesség vagy szívesség) |
| **Jó szomszéd** | legalább 2 szívesség, mindet elvállaltad, és egy sem derült ki |
| **Balatoni emlék** | SZOT-beutaló (a kiemelt rang jutalma) |
| **Két gazda szolgája** | tartótiszt-csere, és mind a 12 hét |
| **Rajtakapva** | rákattintasz a bekukucskáló századosra |

Fejlesztői módban (`?fejleszto`) a befejezés nem ad érdemrendet.

---

## 16. Általános tanácsok

1. **Olvasd a százados megjegyzéseit.** Többet elárulnak a szabályokról, mint gondolnád.
2. **A házmester és a közös terület a barátod:** az ottani megfigyelések ártalmatlanok, mégis hoznak izgalmat.
3. **A puszta tény** (értelmezés nélkül) hihető, de az ártalmat csak kicsit csökkenti. Ártalmas megfigyelésnél jobb egy óvatos kártya.
4. **Vad kártyát csak ártalmatlan megfigyelésre**, és sose egy 1–2 izgalmú megfigyelésre, mert az abszurditás plusz −3-at hoz.
5. **Az elvárást nem kötelező elérni.** Egy héten alatta maradni csak elégedettséget visz, ártalmat nem okoz.
6. **A hihetőség a legtartósabb erőforrás:** negyedévente +8-at kap vissza, de ha 40 alá esik, a házmester is figyelni kezd.
7. **A célfeladat 20 pontot ér** (+8 vagy −12). A terelő kártya szinte mindig a legolcsóbb megoldás.
8. **Az események elvárás-módosítása** megmondja, mikor kell többet adni (tanács ellenőre, civil sétáló) és mikor lehet lazítani (áramszünet, kánikula).
9. **A kedvesség kísértés.** A bizalmas megfigyelés csábító, de egy árulás duplán fáj, és örökre elveszíted az alibit.
10. **A rang nem cél:** a magasabb rang nagyobb elvárást hoz; a lelkiismeret a jutalmakkal fogy.

---

## 17. A felület, a hang, a mentés, a rejtett dolgok

- **Bal felső sarok:** „?” – súgó (a szabályok titkok nélkül); „!” – a tájékoztató a játék jellegéről; „♪” – hang be/ki (kikapcsolva piros vonal húzza át); „↺” – új játék, előtte egy humoros kérdés („Biztosan új fedőnevet kér, elvtárs?”), alapértelmezett válasza a „Mégsem”. A bal alsó sarokban halványan, fehérrel a játék verziószáma (pl. „v0.0.15”).
- **Hang:** valódi írógép-felvételek (CC0). Cetli a jelentésbe: gépelés; kész mondat: csengő és új sor; kivétel: egy billentyű; leadás: a lap kihúzása; a válasz és a negyedéves értékelés: pecsét; képernyőváltás: lapozás.
- **Mozgás:** csak a pecsétek, a címkép és a képernyők közti jelenetek mozognak. Csökkentett mozgásnál (rendszerbeállítás) a heti naptár elmarad, a többi jelenet egyben látszik, és a százados sem kukucskál.
- **Mentés:** minden lépés után, ebben a böngészőben. A befejezett játék mentése törlődik. A régebbi változatok mentései a frissítés után is folytathatók.
- **Easter egg:** a heti és válaszlapok kb. negyedén, véletlen pillanatban (9–45 másodperc után) a százados – bajusz, ballonkabát, kalap, cigaretta – bekukucskál a képernyő egyik széléről (felülről fejjel lefelé), másfél másodpercig figyel, aztán eltűnik. Ha rákattintasz, kézzel írt megjegyzést hagy (pl. „A bizalom jó. Az ellenőrzés jobb.”).
- **Rejtett URL-paraméterek:**
  - `?fejleszto` – fejlesztői mód: minden kártya és megfigyelés értékei, a heti elvárás, a nevek oka, a jutalmak hatása, a mérők pontos számai. Ilyenkor a látogatásszámláló sem számol.
  - `?kukucs` – a százados minden lapon szinte azonnal bekukucskál (teszteléshez).

---

## 18. Minden szám egy helyen

| Paraméter | Érték |
|---|---|
| Kezdő mérők | E 50, H 60, L 100 |
| Súlyok | E ×3, H ×2, L ×5 |
| Heti lap | 4 megfigyelés; 2 óvatos + 2 közepes + 2 vad értelmezés (+ terelő, + alibi) |
| Puszta tény | hihetőség +1, ártalom ×0,8 |
| Abszurditás | értelmezés izgalma ≥ 7 és megfigyelés izgalma ≤ 2 → −3 hihetőség |
| Összegzés | „Kiváló!” ha izgalom − elvárás > 6; „Jó irány” ha > 2; „időjárás-jelentés” ha < −2; „Ne fantáziáljon” ha hihetőség ≤ −8 |
| Negyedév | kiváló: E ≥ 65 és H ≥ 45; hiányos: E < 45; E 20%-ot az 50 felé; H +8; L +15 |
| Célfeladat | a II. negyedévtől; +8 / −12 |
| Ellenjelentés | H < 40 után indul; beírva +2, kihagyva −4 hihetőség; leáll, ha H ≥ 55 a negyedév végén |
| Események | a 2. héttől, 60% eséllyel; bizalmas lakót ért ártalom ×2 lelkiismeret; rossz helyen használt alibi −3 hihetőség |
| Következmények | 2 figyelmeztetés, 4 bajban, 7 a megélhetés elvesztése |
| Jutalmak | megbízható E +4 / L −5; kiemelt E +10, kimaradó hét, +1 elvárás; rezidensjelölt H +6 / L −6 |
| Kizárás | 2 egymást követő hiányos negyedév passzívban |
| Tartótiszt-csere | 50% eséllyel, a III. negyedévtől; eseményes: tény −1, óvatos −1, vad +2; száraz: tény +1, óvatos +1, vad −2 izgalom |
| Szívesség | a 3. héttől 30%, évente legfeljebb 3; igen: bizalom, 30% eséllyel E −3 / H −6; nem: L −3 |
| Elírás | mondatonként 4% + 20% × (1 − L/100) esély, egyenként −1 elégedettség |
| Átnézés | 3 mondat, 2 indoklás; meghagyva az izgalom fele és az ártalom fele (a lelkiismeretnek), az ártalom egésze a lakónak; kihúzva −1 / −4 hihetőség |
| Befejezés határai | H 30, E 30, L 70 |

---

## 19. Mit mutat a szimuláció?

A `npm run sim -- 3000` négy bot-stratégiával játszik 3000-3000 játékot:

| Stratégia | Legjobb | Kizárva | Kiváló munkatárs | Megfigyelt | Behívatás |
|---|---|---|---|---|---|
| **véletlen** (találomra; a szívességekre fej vagy írás) | 0% | 4% | 32% | 57% | 7% |
| **mohó** (mindig a legizgalmasabb; minden szívességre nem) | 0% | 0% | 5% | 95% | 0% |
| **óvatos** (soha semmi ártalom; minden szívességre igen) | 29% | 21% | 0% | 13% | 37% |
| **előrelátó** (mindent lát, egy hétre előre tervez; igen, ha H ≥ 55) | 91% | 0% | 7% | 2% | 0% |

**Tanulságok:**
- Vakon nem lehet egy éven át senkinek sem ártani: a véletlen játékos sosem éri el a legjobb véget.
- A puszta óvatosság kevés: az óvatos játékos gyakran unalmas, és behívatással vagy kizárással végez.
- Tervezéssel a legjobb vég elérhető, de nem biztos.
- A kategória számít: az óvatos stratégia a „hű” kategóriával 73%-ban, a csendőrrel szinte soha nem jut a legjobb végig.
