# Játékterv

## Alapötlet

1979 tavasza, Alsóbürokrác, Bem utca 12. A játékos frissen beszervezett, motiválatlan besúgó, véletlenszerű fedőnévvel (pl. „Kockás Abrosz”). A tartótiszt, Vágási százados, hetente jelentést vár a ház lakóiról. A lakók unalmasak, és a játékos nem akar ártani nekik.

A játék lényege egyensúlyozás: a jelentés legyen elég izgalmas a századosnak, elég hihető, hogy ne kezdjenek gyanakodni a játékosra, és elég ártalmatlan, hogy a szomszédok ne kerüljenek bajba. A legjobb besúgó sokat ír, és semmit sem mond.

## Mérők

- **A százados elégedettsége (E):** az elvárás alatti izgalom csökkenti. Nullán: behívatás.
- **Hihetőség (H):** a túlzó értelmezések csökkentik. Nullán: a játékost kezdik megfigyelni.
- **Lelkiismeret (L):** a terhelő mondatok csökkentik, és a sértett lakót következmény éri.

## Egy hét menete

1. **Megfigyelés:** négy eseménykártya a házból.
2. **Jelentésírás:** két mondat, mindegyik egy megfigyelés és egy választható értelmezés. Hat értelmezés kerül kézbe (két óvatos, két közepes, két vad).
3. **A százados válasza:** kék tintás margójegyzetek, összesítő megjegyzés, pecsét („Átvéve” vagy „Hiányos”), és ha valakire túl sok ártalom gyűlt, hír a házból.

## Szereplők (mind kitalált)

- **Szűcs Mária (Mari néni):** befőz, piacra jár. Titka: nyugatnémet kávé a bécsi sógornőtől.
- **Halmi József (Józsi bácsi):** örökké a Trabantot szereli. Titka: hintát épít a feleségének a 40. évfordulóra.
- **Kerekes István (Pityu):** hosszú hajú egyetemista. Titka: Petőfi-versek gépelt másolata a Kovács lánynak.
- **Pörgöly Lajosné:** a házmester. Túl sokat kérdez. Az epilógusból kiderül, hogy a játékosról jelentett.
- **Vágási százados:** a tartótiszt, a humor fő hordozója a margójegyzetekben.

## Befejezések

- **Jelentem, nem történt semmi:** minden mérő rendben, senkit nem ért következmény. A százados unalmában áthelyezését kéri.
- **Kiváló munkatárs:** a százados elégedett, de valakinek baja lett, vagy a lelkiismeret 70 alá esett.
- **Megfigyelt megfigyelő:** a hihetőség 30 alá esett.
- **Behívatás:** a százados elégedettsége 30 alá esett.

Minden befejezés után jön a 2026. november 4-i epilógus: a játékos megnézi a saját aktáját a túlterhelt adatbázisban, és Pörgöly néni jelentését találja róla.

## Következő lépések

1. **Kiegyensúlyozás.** Az első kör kész (az óvatos értelmezések már nem nullázzák az ártalmat, magasabb elvárás, alacsonyabb következmény-küszöb; a véletlen játékos 14%-ban éri el a legjobb véget, lásd `CLAUDE.md`). Ha több hét lesz, újra kell hangolni; további ötlet, hogy a hat kiosztott értelmezésből ne mindig legyen kettő óvatos.
2. **Mentés** localStorage-ba (try/catch-csel, üres tárolóval is működjön).
3. **Több hét (12–15)**, a lakók titkainak fokozatos kibontásával: a titok egy ponton megfigyelésként is felbukkan, és el kell dönteni, beírja-e a játékos.
4. **Kiemelt feladatok:** a százados konkrét célpontot jelöl ki („Derítse ki, ki hallgat Szabad Európát!”), és ilyenkor el kell terelni a gyanút.
5. **Véletlen események:** pl. a szomszéd megkínál pogácsával, ami a következő terhelő mondatnál extra lelkiismeret-büntetést ad.
6. **Megosztható akta:** a befejezés után egy kép vagy link a saját „aktáról”, a legviccesebb jelentéssel.
7. **Hang:** írógép-kattogás a jelentésíráskor, pecsétpuffanás a válasznál (kikapcsolható).
