# vigo-isi-arkiv
Nodejs script that handles document from vigo-isi

# OVERGANG TIL VFK/TFK ved nyttår
- Sjekk ./lib/call-archive.js, her er det bare å fjerne overrrideToVTFK-scopet
- Sjekk ./jobs/syncElevmappe.js, her må det swappes fra skipDSF til manualData (nytt i archive-v2), i tillegg kan 404 sjekken fjernes

# Flyt

## Get-ready-documents
- Generer soap-spørring for ISI-lokal (uuid genereres basert på timestamp for alltid å få unike, "lånt" koden til npm-pakka "soap" for dette)
- Spør ISI-lokal om x antall nye dokumenter for et gitt fylkesnummer
- Lagrer resultatet som enkeltdokumenter (json) i queue-mappe for det gitte fylke

## Handle-document
- Henter klare dokumenter for et gitt fylkes queue mappe
- Henter korrekt flow for den gitte dokumenttypen
- Gjennomfører jobber angitt i flow-en

# Jobber
- SyncElevmappe
- 


