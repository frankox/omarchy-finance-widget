# Story 04 — Portabilità e readiness

## Valore utente

Come utente del widget, voglio conservare, trasferire e recuperare in sicurezza tutti i miei dati e usare un'interfaccia coerente con lingua e tema del sistema, così da poter considerare il widget affidabile per l'uso quotidiano.

## Risultato della slice

Al termine della storia l'intera esperienza realizzata nelle Stories 01–03 è pronta per la v1: lo stato è persistente e portabile tramite JSON, gli import non validi sono atomici, l'interfaccia supporta inglese e italiano e i temi Omarchy chiari e scuri, e la navigazione rispetta il limite prestazionale con 100 strumenti.

La storia dipende dalle Stories 01–03 perché esporta, importa e verifica l'intero stato da esse prodotto. La specifica di prodotto resta la fonte autorevole per ogni comportamento.

## Flusso utente

1. Il widget carica dal dispositivo portafoglio, watchlist, transazioni, costi, preferenze e versione dello schema.
2. Dalle impostazioni l'utente esporta in JSON tutti i dati di sua proprietà necessari a riprodurre lo stato; l'interfaccia avverte che il file contiene informazioni finanziarie sensibili.
3. L'utente seleziona un JSON da importare.
4. Prima di modificare lo stato corrente, il sistema valida interamente contenuto e compatibilità.
5. Se il file è valido, il widget riproduce calcoli, storico, ordine e impostazioni; se non lo è, spiega il problema e lascia intatti tutti i dati esistenti.
6. Lingua, formati e tema seguono il sistema mentre la navigazione resta reattiva fino al limite supportato di 100 strumenti complessivi.

## Persistenza, privacy e portabilità

- Memorizzare localmente portafoglio, watchlist, transazioni, costi, preferenze e versione dello schema, preservandoli attraverso riavvii di Omarchy Shell e aggiornamenti del widget.
- Non richiedere credenziali, non memorizzare segreti, non usare account o sincronizzazione cloud e non raccogliere telemetria o analytics.
- Non trasmettere dati personali del portafoglio, salvo i valori strettamente necessari alle richieste di dati di mercato.
- Esportare in JSON tutti i dati di proprietà dell'utente necessari a riprodurre lo stato. I dati di mercato in cache possono essere omessi.
- Identificare chiaramente nell'interfaccia il file esportato come contenente informazioni finanziarie sensibili.
- Validare prima dell'import versione dello schema, tipi dei campi, valori obbligatori, riferimenti agli strumenti, ordine delle transazioni, quantità e valute.
- Applicare un import valido soltanto dopo la validazione completa, in modo da riprodurre lo stato esportato; qualsiasi errore di validazione preserva integralmente lo stato precedente e viene spiegato all'utente.
- A parità di dati importati e dati di mercato in cache, mantenere deterministici i calcoli finanziari.

## Localizzazione e temi

- Fornire interfaccia inglese e italiana, selezionata automaticamente dalla lingua del sistema.
- Usare l'inglese quando la lingua di sistema non è supportata.
- Formattare date, numeri, percentuali e valute secondo il locale di sistema.
- Seguire il tema Omarchy attivo e mantenere utilizzabile l'interfaccia con i temi chiari e scuri supportati.

## Compatibilità e prestazioni

- Destinare la v1 all'interfaccia plugin della release stabile corrente di Omarchy al momento del rilascio.
- Supportare fino a 100 strumenti complessivi tra watchlist e portafoglio senza stalli visibili nell'interazione.
- Con cache disponibile e 100 strumenti, l'apertura del pannello e il passaggio tra le sezioni principali non devono bloccare l'interfaccia per più di 500 ms su un'installazione Omarchy supportata.
- Evitare polling continuo e operazioni di refresh separate per monitor, mantenendo il modello condiviso introdotto nella Story 01.

## Confini

Sono inclusi persistenza completa, JSON import/export, validazione atomica, privacy locale, localizzazione, formattazione, integrazione con i temi, compatibilità corrente e prova prestazionale. La storia non modifica le regole finanziarie o di mercato delle slice precedenti.

Restano esclusi cloud e sincronizzazione, più utenti o profili, più portafogli o watchlist, telemetria, supporto garantito a versioni storiche di Omarchy e qualsiasi funzione indicata come non-obiettivo dalla specifica.

## Criteri di accettazione

### AC-019 — Round trip completo

**Given** uno stato valido con portafoglio, storico transazioni, ordine della watchlist e impostazioni<br>
**When** l'utente lo esporta e importa successivamente il JSON prodotto<br>
**Then** il widget riproduce gli stessi calcoli di portafoglio, lo stesso storico, lo stesso ordine della watchlist e le stesse impostazioni.

### AC-020 — Import non valido atomico

**Given** dati locali esistenti e un file JSON malformato, incompatibile o non valido<br>
**When** l'utente tenta l'importazione<br>
**Then** il widget spiega il fallimento di validazione e lascia invariati tutti i dati esistenti, senza sovrascritture parziali.

### AC-021 — Selezione della lingua

**Given** la lingua di sistema è inglese, italiana oppure non supportata<br>
**When** il widget carica l'interfaccia<br>
**Then** usa rispettivamente inglese, italiano oppure inglese come fallback, mentre i valori seguono il locale di sistema.

### AC-022 — Temi Omarchy

**Given** un tema Omarchy chiaro o scuro supportato<br>
**When** il tema è attivo<br>
**Then** il widget ne adotta l'aspetto e tutte le sue viste restano utilizzabili.

### AC-023 — Limite di interazione

**Given** 100 strumenti complessivi tra watchlist e portafoglio e tutti i dati necessari già in cache<br>
**When** l'utente apre il pannello espanso o passa tra le sue sezioni principali<br>
**Then** ciascuna interazione non blocca l'interfaccia per più di 500 ms su un'installazione Omarchy supportata.

## Verifiche supplementari della slice

- **Given** dati creati nelle quattro aree funzionali, **when** Omarchy Shell viene riavviato o il widget viene aggiornato, **then** lo stato locale viene ripristinato.
- **Given** un export, **when** l'utente sta per produrre il file, **then** l'interfaccia lo identifica chiaramente come contenente dati finanziari sensibili.
- **Given** un import con un errore di versione, tipo, campo obbligatorio, riferimento, ordine, quantità o valuta, **when** avviene la validazione, **then** l'errore è spiegato prima di qualsiasi modifica persistente.
- **Given** gli stessi dati importati e la stessa cache, **when** i calcoli sono ripetuti, **then** i risultati sono identici.
- **Given** l'uso ordinario del widget, **when** si osservano persistenza e traffico, **then** non risultano telemetria, segreti memorizzati o trasmissioni estranee alle richieste di mercato necessarie.
