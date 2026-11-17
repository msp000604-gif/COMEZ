# COMEZ — je onderzoekswebsite op GitHub Pages

Dit pakket bevat de complete website, het beheerscherm en de database-inrichting. De vormgeving gebruikt crème, oranje, speelse lijntekeningen en een monospaced accentletter. Er is geen betaald lettertype nodig.

**Nog te doen voordat je echte antwoorden kunt verzamelen:** een eigen Supabase-project aanmaken, het SQL-bestand uitvoeren, één beheerder aanwijzen en twee publieke projectgegevens in config.js invullen. De website wordt met dit downloadpakket niet automatisch gepubliceerd. Zonder databaseconfiguratie is alleen de expliciete demo bruikbaar.

## 1. Database aanmaken

1. Maak op https://supabase.com een project aan (kies een passende Europese regio).
2. Open de SQL Editor van dat project.
3. Open `backend/setup.sql` uit dit pakket, plak de volledige inhoud in de editor en voer die uit. Doe dit één keer in een nieuw project. Het script verandert niets in je andere projecten. Bij een fout wordt de hele installatie teruggedraaid.
4. Maak onder Authentication → Users een beheerder aan met jouw e-mailadres en een sterk wachtwoord (bevestig het e-mailadres indien nodig). Zet openbare gebruikersregistratie uit; deelnemers hebben geen Supabase-account nodig.
5. Voer in de SQL Editor onderstaande instructie uit, met jouw echte beheerdersmail:

```sql
insert into comez_private.admins(user_id)
select id from auth.users where lower(email)=lower('JOUW-EMAIL-HIER')
on conflict do nothing;
```

Controleer in SQL Editor dat jouw gebruiker is toegevoegd:

```sql
select count(*) from comez_private.admins;
```

Het aantal moet minimaal 1 zijn. Een willekeurig Supabase-account krijgt geen beheerdersrechten.

## 2. Website koppelen

Zoek de project-URL en de **publishable key** (of legacy **anon key**) in de projectinstellingen/API Keys van Supabase. Vul `config.js` aan:

```js
window.COMEZ_CONFIG = {
  supabaseUrl: 'https://JOUW-PROJECT.supabase.co',
  supabasePublishableKey: 'JOUW-PUBLIEKE-PUBLISHABLE-KEY',
  studyContact: 'Jullie naam en contactmail',
};
```

Deze twee projectgegevens zijn bedoeld voor een browser en mogen in de repository staan. Gebruik hier **nooit** een secret key, service_role-key, databasewachtwoord, deelnamecode of beheerderswachtwoord. De toegangscontrole zit in de database, niet in een verborgen webpagina.

Vul vóór de pilot jullie deelnemersinformatie aan: contact, doel, vrijwilligheid, bewaartermijn en procedure om gegevens te laten verwijderen. Het scherm bevat daarvoor een korte basisverklaring; het vervangt niet jullie eigen onderzoeksinformatie.

## 3. Uploaden naar GitHub

1. Maak een openbare repository, bijvoorbeeld `comez-study`.
2. Pak de ZIP op je computer uit.
3. Upload de **inhoud** van de map naar de hoofdmap van je repository. `index.html` moet direct in de hoofdmap staan, niet in een extra map of alleen in de ZIP.
4. Ga naar Settings → Pages.
5. Kies bij Source: **Deploy from a branch**.
6. Kies branch **main**, map **/(root)**, en sla op.
7. Wacht tot GitHub Pages de website heeft gepubliceerd. Kopieer de link die GitHub daar toont.

Geen build, Node-installatie of GitHub Actions nodig om de website te publiceren. De ontwikkel- en testbestanden mogen mee in de openbare repository; ze bevatten geen echte deelnemersgegevens.

GitHub Pages host de bestanden. Supabase slaat de antwoorden op. De database wordt nooit naar GitHub geschreven.

## 4. Deelnemers beheren

1. Open de website en kies rechtsboven **Onderzoeksteam**. Dit is `admin.html`.
2. Log in met de beheerder uit stap 1.
3. Voer een studentennummer in: `s` plus exact zeven cijfers. Voorloopnullen blijven behouden.
4. Kies **3 roterende vragen** of **6 vaste vragen**.
5. Kies de startdatum. De studie loopt vijf opeenvolgende kalenderdagen in Belgische tijd, vanaf die datum.
6. Voor groep A kies je één van vijf rotatieschema's. Verdeel die schema's vooraf over de studenten; het systeem loot de groepen niet automatisch.
7. Klik op **Deelnemer opslaan**.
8. Bij een nieuwe deelnemer verschijnt een willekeurige persoonlijke deelnamecode. Kopieer die direct en deel deze privé samen met de studielink en het studentennummer. De code wordt maar één keer getoond.

Elke correct gevormde studentcode kan worden toegevoegd; niets is hardcoded op het voorbeeldnummer. Onbekende studenten kunnen niet deelnemen totdat je ze aanmaakt. Dit voorkomt dat buitenstaanders je dataset vullen.

Een bestaande deelnemer selecteren vult het formulier in. Je kunt de toewijzing aanpassen zolang die student nog geen dagregistratie heeft geopend. Daarna staat de toewijzing vast om de onderzoeksdata consistent te houden. Om een verloren code te vervangen staat een beheerquery in `backend/onderhoud.sql`; dit vereist toegang tot de SQL Editor.

## 5. Wat de student ziet

1. Studentennummer + persoonlijke deelnamecode + bevestiging deelname.
2. Maaltijdvorm en beschrijving van de avondmaaltijd.
3. Drie of zes kwaliteitsvragen volgens de toewijzing in de database.
4. Optionele reflectie over wat het eetmoment aangenamer had gemaakt.
5. Op studiedag vijf ook ervaren invullast en een optionele voorkeur/toelichting.
6. Na afronden een bedankpagina. De volgende echte studiedag opent op de volgende kalenderdag; studenten kunnen niet vooruitklikken naar morgen.

De knop **Opslaan & volgende** slaat de antwoorden van dat scherm op, telkens als afzonderlijke datarijen. Niet-verzonden invoer blijft alleen in het huidige scherm; sluit de pagina niet voordat de opslag is bevestigd. Na opnieuw aanmelden worden eerder opgeslagen antwoorden van de huidige dag teruggehaald. Afgeronde dagen zijn vergrendeld. Een mislukte opslag toont een foutmelding en gaat niet verder.

Geen maaltijd gehad? Dan worden de kwaliteitsvragen overgeslagen en blijft die situatie herkenbaar via `meal_format`. Niet-gestelde vragen worden niet als 'Nee' opgeslagen. Een overgeslagen dag wordt ook niet kunstmatig aangevuld.

## 6. Exporteren naar Excel

In het beheerscherm:

- **Download antwoorden · CSV**: één rij per beantwoorde vraag. Bevat ook antwoorden uit nog niet afgeronde dagen; filter `day_complete` als je alleen volledige registraties wilt.
- **Download dagen & invulduur · CSV**: vijf rijen per deelnemer, inclusief nog niet begonnen, toekomstige en gedeeltelijk ingevulde dagen.

CSV is UTF-8 met BOM en puntkomma's. Open in Excel, of gebruik Gegevens → Van tekst/CSV → UTF-8 → scheidingsteken puntkomma. Bij import kun je antwoordkolommen expliciet als tekst instellen. Vrije tekst die als spreadsheetformule kan worden geïnterpreteerd krijgt in de export een beschermend apostrof; de originele tekst blijft in de database.

Bewaar exports buiten GitHub. De `.gitignore` sluit CSV-bestanden uit voor git-gebruik, maar handmatig uploaden via de GitHub-website kan dat omzeilen.

Zie `DATASET.md` voor kolommen en interpretatie.

## 7. Vragen aanpassen

De zes vragen zijn **voorbeeldvragen voor jullie pilot**, geen gevalideerde schaal of archetypeberekening. Eén vraag dekt niet een volledige kwaliteitsdimensie. De app berekent bewust geen wetenschappelijk onderbouwd archetype uit deze beperkte gegevens.

Vóór installatie: pas de vraagteksten aan in `backend/setup.sql`. Behoud de bestaande vraag-ID's en dimensies, zodat rotatie en exports blijven werken. Pas ook `shared.js` aan als je dezelfde teksten in de demo wilt zien.

Na installatie: wijzig de teksten via SQL Editor in `comez_private.questions`, bijvoorbeeld:

```sql
update comez_private.questions
set question_text='JULLIE NIEUWE VRAAG'
where id='temporal';
```

De al geopende dagregistraties behouden hun toegewezen vraagteksten. Verander de vragen bij voorkeur niet tijdens één pilot. `shared.js` is alleen de bron voor de demo; echte vragen komen uit de database.

## 8. Demo en lokaal bekijken

Voeg `?demo=1` achter de website-URL toe. Vul een geldig fictief studentennummer en een willekeurige code in. Kies 3 of 6 vragen. In deze expliciet gemarkeerde demo wordt niets opgeslagen of naar Supabase verstuurd. De demo kan naar de volgende demodag doorklikken.

Lokaal: installeer Node.js en gebruik `npm run dev`, open daarna `http://localhost:3000/?demo=1`. Dubbelklikken op `index.html` werkt niet betrouwbaar vanwege JavaScriptmodules.

## 9. Controle vóór de echte pilot

Maak eerst twee fictieve testdeelnemers: eentje met 3 en eentje met 6 vragen. Controleer op jullie eigen Supabase-project dat aanmelden, opslaan, opnieuw aanmelden, afronden en beide CSV-downloads werken. Test ook op een telefoon. Gebruik een nieuw project of verwijder uitsluitend je eigen testrecords voordat de pilot start.

De code is lokaal getest met een echte PostgreSQL-engine via PGlite en de demo is in de browser doorlopen. Jullie eigen Supabase-hosting, Auth-configuratie en publieke GitHub Pages-link konden zonder jullie projectgegevens nog niet live worden getest.

Techniek: geen front-end libraries, alleen HTML/CSS/JavaScript en Supabase REST/Auth. Deelnemerssessies verlopen na 12 uur; beheerders melden zich opnieuw aan na tokenverloop. Sessies worden alleen in browsergeheugen gehouden, niet in localStorage. Codehashes, sessies, nummers en antwoorden staan in een niet via de Data API aangeboden privéschema met RLS; beveiligde databasefuncties controleren elke bewerking.

Voor een grote publieke studie: laat jullie hosting- en privacyopzet evalueren en voeg zo nodig monitoring/rate limiting toe. Dit pakket is ingericht voor de kleine vijfdaagse pilot.

## Bronnen

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
