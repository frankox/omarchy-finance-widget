# Story 03 — Ciclo di vita delle posizioni

## Valore utente

Come investitore, voglio registrare riduzioni delle posizioni e comprendere nel tempo l'effetto di operazioni, split e costi, così da leggere una performance corrente coerente con la storia effettiva dei miei investimenti.

## Risultato della slice

Al termine della storia il modello introdotto nella Story 02 gestisce l'intero ciclo di vita di una posizione: prelievi parziali o totali, storico, grafico, split e reverse split, costi ricorrenti e TER informativo. Tutti questi eventi incidono sui valori storici soltanto dal momento in cui si verificano.

La storia dipende dalle Stories 01 e 02 per strumenti, dati di mercato, acquisti, valute e calcoli di base.

## Flusso utente

1. Dal dettaglio di uno strumento l'utente consulta dati correnti, performance, storico degli acquisti e dei prelievi e grafico.
2. Per ridurre o chiudere la posizione registra data e quantità del prelievo; non inserisce proventi.
3. Il sistema valida la quantità posseduta alla data scelta e applica il metodo del costo medio ponderato.
4. L'utente seleziona il periodo del grafico e decide se mostrare i marker di acquisti e prelievi; split e reverse split restano rappresentati.
5. Dalle impostazioni crea piani di costo mensili o annuali per l'intero portafoglio o per un singolo strumento.
6. Il sistema include i costi solo alle date di ricorrenza e mostra il TER disponibile come informazione separata.

## Prelievi e stato della posizione

- Un prelievo rappresenta una vendita parziale o totale e contiene soltanto data e quantità prelevata.
- Non vengono registrati proventi e non si calcolano profitto o perdita realizzati.
- Con il costo medio ponderato, un prelievo riduce quantità e costo residuo nella stessa proporzione; il costo medio unitario non cambia.
- La quantità prelevata non può superare quella posseduta alla data del prelievo; la violazione produce un errore a livello di campo.
- Un prelievo totale esclude lo strumento dai totali delle posizioni attive, ma ne conserva localmente la storia. In seguito lo strumento può essere spostato nella watchlist oppure eliminato.

## Grafico e azioni societarie

- Il dettaglio offre i periodi un giorno, una settimana, un mese, tre mesi, un anno e massimo storico disponibile.
- Il grafico usa prezzi e cambi storici e applica, a ogni timestamp, soltanto acquisti, prelievi, addebiti di gestione e azioni societarie già avvenuti.
- Acquisti e prelievi hanno marker che l'utente può mostrare o nascondere con un toggle.
- Split e reverse split sono visibili nel grafico e regolano quantità e costo medio unitario senza cambiare il costo totale.
- I dati storici sono memorizzati in cache dove pratico.
- I dividendi sono ignorati.

## Costi di gestione e TER

I costi di gestione sono opzionali. Ogni piano contiene nome, importo fisso, valuta, frequenza mensile o annuale, data iniziale, data finale opzionale e ambito portafoglio o singolo strumento.

Un costo è riconosciuto soltanto in ciascuna data di ricorrenza compresa nel piano e non matura pro rata nei giorni intermedi. Se espresso in una valuta diversa dalla base, viene convertito usando il cambio della data di addebito. I costi di posizione alimentano il capitale totale della rispettiva posizione; quelli di portafoglio alimentano il capitale totale aggregato secondo le formule della Story 02.

Il TER viene mostrato nel dettaglio quando applicabile e disponibile. Rimane un metadato informativo e non viene dedotto di nuovo dalla performance, perché è già riflesso nei prezzi o NAV quotati.

## Confini

Sono inclusi prelievi, validazione temporale delle disponibilità, chiusura della posizione, storico, grafico e periodi, marker, split e reverse split, piani di costo e TER. Sono riutilizzati provider, cache, conversioni e motore di performance delle storie precedenti.

Restano esclusi proventi delle vendite, profitto o perdita realizzati, dividendi, tassazione e commissioni di transazione come campo separato. Import/export e requisiti finali di readiness appartengono alla Story 04.

## Criteri di accettazione

### AC-009 — Prelievo proporzionale

**Given** una posizione attiva con quantità e costo residuo noti<br>
**When** l'utente registra un prelievo parziale valido<br>
**Then** quantità e costo residuo diminuiscono nella stessa proporzione, il costo medio unitario resta invariato e non vengono calcolati proventi o rendimento realizzato.

### AC-010 — Prelievo superiore alla disponibilità

**Given** la quantità effettivamente posseduta alla data scelta<br>
**When** l'utente tenta di prelevare una quantità superiore<br>
**Then** il prelievo viene rifiutato con un errore a livello di campo e la posizione non cambia.

### AC-011 — Storico e marker delle operazioni

**Given** una posizione con acquisti e prelievi in date differenti<br>
**When** l'utente apre il dettaglio e cambia lo stato del toggle dei marker<br>
**Then** il grafico riflette le operazioni nel tempo e mostra o nasconde i marker di acquisto e prelievo come richiesto.

### AC-012 — Split senza variazione del costo totale

**Given** una posizione interessata da uno split o reverse split<br>
**When** l'azione societaria diventa applicabile<br>
**Then** quantità e costo medio unitario vengono adeguati in modo inverso, mentre il costo totale resta invariato.

### AC-015 — Ricorrenza dei costi

**Given** piani di costo fisso mensili o annuali con date iniziale ed eventualmente finale<br>
**When** il sistema calcola la performance a una data<br>
**Then** include gli importi dovuti nelle date di ricorrenza già trascorse e non matura importi pro rata tra una ricorrenza e l'altra.

### AC-016 — TER informativo

**Given** uno strumento per cui il provider rende disponibile il TER<br>
**When** l'utente apre il dettaglio e il sistema calcola la performance<br>
**Then** il TER viene mostrato come metadato e non genera una seconda deduzione di costo.

## Verifiche supplementari della slice

- **Given** un prelievo pari all'intera quantità disponibile, **when** viene salvato, **then** la posizione esce dai totali attivi ma storia e strumento restano locali e possono essere spostati in watchlist o eliminati.
- **Given** un costo in valuta diversa dalla base, **when** cade una data di ricorrenza, **then** l'importo usa il cambio storico di quella data.
- **Given** un timestamp del grafico, **when** si calcola il valore storico, **then** sono applicati solo eventi e costi già avvenuti a quel timestamp.
- **Given** il dettaglio di una posizione, **when** l'utente seleziona uno dei sei periodi previsti, **then** il grafico usa un giorno, una settimana, un mese, tre mesi, un anno o il massimo storico disponibile.
- **Given** TER o stato del mercato non disponibili, **when** si apre il dettaglio, **then** il dato mancante ha un indicatore di indisponibilità e lo strumento resta valido.
