# vigo-isi-arkiv
Nodejs script that handles document from vigo-isi

# OVERGANG TIL VFK/TFK ved nyttår
- Sjekk ./lib/call-archive.js, her er det bare å fjerne overrrideToVTFK-scopet
- Sjekk ./jobs/syncElevmappe.js, her må det swappes fra skipDSF til manualData (nytt i archive-v2), i tillegg kan 404 sjekken fjernes
- Sjekk ./jobs/signOff.js, her må det swappes til kommentert ut kode

# Flyt
## ./jobs/queue-ready-documents
[./jobs/queue-ready-documents.js](./jobs/queue-ready-documents.js)
- Generer soap-spørring for ISI-lokal (uuid genereres basert på timestamp for alltid å få unike, "lånt" koden til npm-pakka "soap" for dette)
- Spør ISI-lokal om x antall nye dokumenter for et gitt fylkesnummer
- Lagrer resultatet som enkeltdokumenter (json) i queue-mappe for det gitte fylke

## ./jobs/handle-queue
[./jobs/handle-queue.js](./jobs/handle-queue.js)
- Henter klare dokumenter for et gitt fylkes queue mappe (sjekker om tidspunket i property nextRun er passert), for hvert dokument
  - Henter korrekt flow for den gitte dokumenttypen (matches mot filene i ./flows-mappa)
  - Sender dokumentet og flow videre til ./jobs/handle-document.js

## ./jobs/handle-document
[./jobs/handle-document.js](./jobs/handle-document.js)
- Sjekker hvilke oppgaver som skal gjennomføres på dokumentet basert på flow, og prøver å kjøre disse sekvensielt.
- Dersom en av jobbene feiler (f. eks deadlock i jobben archive)
  - Stoppes kjøringen av dette dokumentet
  - Antall runs inkrementeres
  - Status for kjøringen så langt lagres (slik at den kan plukke opp igjen der den slapp, når den prøver neste gang)
  - Error logger, og varsles til Teams (dersom man ønsker)
  - Dersom dokumentet har kjørt for mange ganger, legges det i failed-mappen

### Jobber som kan sjekkes / kjøres i ./jobs/handle-document (i sekvensiell rekkefølge)
#### syncElevmappe
Oppretter/oppdaterer privatperson og elevens elevmappe i arkivet, returnerer elevmappe-saksnummer og folkeregister-informasjon om personen.

#### archive
Arkiverer det innsendte dokumentet i elevens elevmappe, returnerer dokumentnummer.

#### signOff
Avskriver dokumentet opprettte i [archive](#archive) med koden "Tatt til orientering", retunerer dokumentnummer.

#### statusVigo
Generer soap-spørrig for ISI-lokal, og sender status ARKIVERT til Vigo, returnerer responsen fra ISI-lokal

#### archiveResponseLetter
Oppretter og legger inn et svarbrev i arkivet for utsending til eleven, basert på dokumenttypen (i dag bare brukt på typen KONTRAKT). F. eks ved typen KONTRAKT opprettes det et informasjonsbrev som skal sendes til eleven. Returnerer dokumentnummer for det opprettede dokumentet.

#### sendResponseLetter
Sender brevet opprettet i [archiveResponseLetter](#archiveresponseletter) til eleven via sak-arkiv/SvarUT. Dersom det er noe kødd med adressen eller adressesperring, sendes ikke brevet, men det opprettes en merknad på arkivdokumentet om at utsending må håndteres manuelt.

#### signOffResponseLetter
Dersom dokumentet fra [archiveResponseLetter](#archiveresponseletter) ble sendt på SvarUT, avsskriver det originale dokumentet fra [archive](#archive), med koden "Besvart med utgående dokument **documentNumber**", der **doucmentNumber** er dokumentNummeret til dokumentet opprettet av [archiveResponseLetter](#archiveresponseletter).

#### stats
Oppretter et statistikk-element i felles statistikk-database (basert på hvilket fylke dokumentet tilhører)

#### finishDocument
**Kjører uavhengig av hva som er satt opp i flow for dokumentet**. Sjekkes / kjøres som siste jobb, når alle foregående jobber er fullført. Setter finishedTimestamp og flytter dokumentet til finished.

## ./jobs/delete-finished-documents
[./jobs/delete-finished-documents.js](./jobs/delete-finished-documents.js)
- For hvert dokument som ligger i finished-mappe
- Dersom dokumentetes finishedTimestamp-dato er over miljøvariabel DELETE_FINISHED_AFTER_DAYS (default 30) dager gammel, så slettes dokumentet.
- Ellers blir det liggende

# Scripts
## queue-and-handle-ready-documents
[./scripts/queue-and-handle-ready-documents](./scripts/queue-and-handle-ready-documents.js)

Hovedskriptet. Kjører hele flyten beskrevet over.

## queue-telemark
[./scripts/queue-telemark](./scripts/queue-telemark.js)

For testing.
Henter NUMBER_OF_DOCS dokumenter for Telemark fra ISI-lokal, og legger dem i kø uten å gjøre noe mer.

## queue-vestfold
[./scripts/queue-vestfold](./scripts/queue-vestfold.js)

For testing.
Henter NUMBER_OF_DOCS dokumenter for Vestfold fra ISI-lokal, og legger dem i kø uten å gjøre noe mer.

## telemark-handle-queue
[./scripts/telemark-handle-queue](./scripts/telemark-handle-queue.js)

For testing.
Håndterer dokumenter som ligger i telemark/queue, uten å hente nye dokumenter fra ISI-lokal

## vestfold-handle-queue
[./scripts/vestfold-handle-queue](./scripts/vestfold-handle-queue.js)

For testing.
Håndterer dokumenter som ligger i vestfold/queue, uten å hente nye dokumenter fra ISI-lokal

## tfk-status-alert
[./scripts/tfk-status-alert](./scripts/tfk-status-alert.js)

Sjekker hva som ligger av telemark-dokumenter på server (hvor mange i kø, hvor mange om hvem som har feilet, og hvor mange som ble fullført i går), og sender statusrapport til gitte teamskanaler satt i TEAMS_STATUS_WEBHOOK_URLS

## vfk-status-alert
[./scripts/vfk-status-alert](./scripts/vfk-status-alert.js)

Sjekker hva som ligger av vestfold-dokumenter på server (hvor mange i kø, hvor mange om hvem som har feilet, og hvor mange som ble fullført i går), og sender statusrapport til gitte teamskanaler satt i TEAMS_STATUS_WEBHOOK_URLS

# Oppsett av løsningen
Klon ned prosjektet der det skal kjøre (lettest å klone det rett inn i VSCode)
```bash
git clone {url til repo}
```
Åpne prosjektet der du klona det ned
```bash
cd {path til klona repo}
```
Installer dependencies
```bash
npm i
```
Lag deg en .env fil med følgende verdier
```bash
NUMBER_OF_DOCS="10" # OPTIONAL default 30. Antall dokumenter som skal hentes fra ISI-lokal for hvert fylke av gangen
ISI_LOKAL_URL="https://isi-lokal-url" # Url til ISI-lokal tjeneste 
ISI_LOKAL_USERNAME="brukernavn" # Brukernavn for autentisering mot ISI-lokal
ISI_LOKAL_PASSWORD="superhemmelig" # Passord for autentisering mot ISI-lokal
VFK_ARCHIVE_URL="https://arkiv-url" # Url til arkiv-api
VFK_ARCHIVE_CLIENT_ID="client-id app registrering"
VFK_ARCHIVE_TENANT_ID="tenant-id app registrering"
VFK_ARCHIVE_CLIENT_SECRET="client-secret app registrering"
VFK_ARCHIVE_SCOPE="arkiv-api-scope"
TFK_ARCHIVE_CLIENT_ID="client-id app registrering"
TFK_ARCHIVE_TENANT_ID="tenant-id app registrering"
TFK_ARCHIVE_CLIENT_SECRET="client-secret app registrering"
TFK_ARCHIVE_SCOPE="arkiv-api-scope"
VFK_STATS_URL="https://stats-url"
VFK_STATS_KEY="nykkel"
TFK_STATS_URL="https://stats-url"
TFK_STATS_KEY="nykkeligjen"
MOCK_ISI_LOKAL="true" # OPTIONAL default undefined. Settes til "true" dersom du vil teste mock-dokumenter, i stedet for å spørre ISI-lokal
MOCK_FNR="12345678910" # OPTIONAL default undefined. Overkjører alle fnr med verdien i dennee, for testing.
RETRY_INTERVALS_MINUTES="5,10,60" # OPTIONAL. Setter hvor mange ganger vi skal prøve å kjøre et dokument (i dette eksempelet prøver i først en gang til etter 5 minutter, deretter igjen etter 10 minutter, og til slutt etter 60 minutter. Lista kan fylles så mye som trengs)
DELETE_FINISHED_AFTER_DAYS="10" # OPTIONAL default 30. Hvor mange dager skal ferdige dokumenter beholdes før de slettes.
TEAMS_STATUS_WEBHOOK_URLS="https://webhook-url" # OPTIONAL. Hvor skal statusrapport sendes
TEAMS_WEBHOOK_URL="https://webhook-url"  # OPTIONAL. Dersom du ønsker at WARN og ERROR skal varsles i en Teams kanal
```

## Kjør / test
For å kjøre eller teste brukes scriptene i [./scripts](./scripts/)

Kjøres på følgende måte **(HUSK Å KJØRE FRA PROSJEKTETS ROT FOR Å FÅ MED .env)**:
```bash
node ./scripts/{script-navn}.js
```

## Logger
Logger opprettes automatisk og finnes i [./logs](./logs/). Det opprettes en ny loggfil per mnd

# Oppdateringer
Gjør de endringer som trengs, test at ting fungerer lokal eller i test-miljø. Sync så endringer ned til produksjonsområdet.

TODO: Lag fancy funksjonalitet for nye releases og oppdateringer.

