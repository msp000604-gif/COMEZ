# COMEZ · Savor the Flavor.

Vijfdaags eetmomentendagboek voor studenten, met een beheerscherm en CSV-export.

**Begin bij [START_HIER.md](START_HIER.md).** Dat legt stap voor stap uit hoe je Supabase instelt en de bestanden naar GitHub Pages uploadt.

- Studentnummer: s + zeven cijfers, plus privédeelnamecode.
- Per student drie roterende of zes vaste kwaliteitsvragen.
- Maaltijdregistratie, reflectie, eindbeoordeling op dag vijf.
- Eén datarij per antwoord; opslag bij de knop Volgende.
- Servergestuurde dagplanning, hervatten en blokkeren van dubbele afrondingen.
- Beheer en CSV-export via admin.html.
- Demo met ?demo=1; demo-antwoorden worden niet opgeslagen.

## Ontwikkelen en testen

Node.js 20+ aanbevolen. Voor lokaal bekijken: `npm run dev` (geen installatie nodig).
Voor de tests: `npm install` en `npm test`. PGlite is uitsluitend een lokale testafhankelijkheid; niet gebruikt door de website.

De backendtest gebruikt een geïsoleerde PostgreSQL-engine en fictieve auth-gebruikers. Er worden geen echte externe accounts of datasets aangeraakt.

## Grenzen van de verificatie

De browserdemo en de databasefuncties zijn lokaal gecontroleerd. De koppeling met een live Supabase-project, Supabase Auth en jullie GitHub Pages-deployment moet na configuratie met twee fictieve deelnemers getest worden. Alle onderzoeksinhoud is voorlopig en aanpasbaar; het systeem deelt studenten niet automatisch in archetypes in.
