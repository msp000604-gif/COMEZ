# Dataset en onderzoeksopzet

## Antwoordenexport

| Kolom | Betekenis |
|---|---|
| student_number | Studentennummer inclusief s en voorloopnullen |
| study_group | A = 3 vragen; B = 6 vragen |
| question_count | Aantal toegewezen kwaliteitsvragen |
| rotation_offset | Rotatieschema 0–4 |
| study_day | Dag 1–5 vanaf de ingestelde startdatum |
| meal_date | Datum van het gerapporteerde avondeten |
| question_id | Vaste ID, bijvoorbeeld cognitive of meal_format |
| dimension | Dimensie of aanvullende vraagcategorie |
| question_text | Vraagtekst bij registratie |
| answer | Antwoord; tekst, ja/nee/NVT of keuzecategorie |
| first_answered_at | Eerste opslag van dit antwoord (server timestamp) |
| updated_at | Meest recente opslag van dit antwoord |
| started_at | Openen van de dagregistratie |
| completed_at | Afronden van de volledige dagregistratie; leeg als niet afgerond |
| day_complete | true/false |

Er is maximaal één antwoordrij per vraag per deelnemer per studiedag. Teruggaan en opnieuw opslaan werkt de rij bij; dit creëert geen dubbel antwoord. Er is geen volledige wijzigingshistoriek. Server timestamps zijn tijdzonebewust; dagen worden bepaald in Europe/Brussels.

Optionele vrije tekst mag leeg zijn: een lege cel is geen negatief antwoord. Een niet-gestelde kwaliteitsvraag heeft geen antwoordrij. Een geplande maar niet beantwoorde vraag herken je via de toegewezen vragen in de dagenexport. 'Niet van toepassing' is een aparte antwoordcategorie, geen Nee.

## Dagenexport

Bevat vijf geplande dagen per deelnemer. Status: `future`, `not_started`, `started` of `completed`. Vandaag zonder registratie is `not_started`; label dit pas als gemist wanneer de dag voorbij is. `assigned_questions` bevat JSON met vraag-ID, dimensie en tekst voor geopende registraties. `answered_count` telt ook de aanvullende vragen en eventueel lege optionele tekstvelden.

`elapsed_seconds` is verstreken tijd tussen openen en afronden, inclusief pauzes en tabblad op de achtergrond. Het is **geen zuivere actieve invultijd**. Bij niet-afgeronde dagen is deze waarde leeg.

## Standaardrotatie groep A

| Dag | Vragen |
|---|---|
| 1 | Temporeel, cognitief, sociaal |
| 2 | Fysiologisch, omgeving, affectief |
| 3 | Temporeel, omgeving, affectief |
| 4 | Cognitief, fysiologisch, sociaal |
| 5 | Temporeel, fysiologisch, omgeving |

De schema-offset verschuift deze vijf rijen cyclisch. Zo krijgt elke deelnemer bij vijf volledige dagen elke dimensie minstens tweemaal. Groep B krijgt alle zes vragen dagelijks. De rotatie is deterministisch en servergestuurd; studenten kiezen de variant niet zelf.

Beide groepen beantwoorden daarnaast maaltijdvorm, maaltijdomschrijving, optionele reflectie en op dag vijf de eindbeoordeling. De namen '3 vragen' en '6 vragen' slaan uitsluitend op kwaliteitsvragen.

## Analyse

Vergelijk invullast en voltooiing verkennend tussen A en B. Onderzoek informatieverlies door binnen dezelfde personen uit B vragen/dagen weg te laten en hun volledige en verkorte profielen te vergelijken. Groepsverschillen kunnen bij vijf personen per groep ook persoonsverschillen zijn. Vijf dagen vormen geen bewezen stabiel eetprofiel. Zeven archetypes zijn niet als classificatiemodel geïmplementeerd.
