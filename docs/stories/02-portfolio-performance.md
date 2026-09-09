# Story 02 — Acquisti e performance del portafoglio

## Valore utente

Come investitore, voglio registrare uno o più acquisti e vedere valore, costo e rendimento netto nella mia valuta base, così da conoscere l'andamento delle posizioni attive includendo l'effetto dei cambi.

## Risultato della slice

Al termine della storia l'utente può trasformare un risultato di ricerca o un elemento della watchlist nella prima posizione del portafoglio, aggiungere ulteriori acquisti e consultare performance deterministiche per posizione e per l'unico portafoglio locale. Il widget compatto può mostrare il rendimento netto aggregato.

La storia dipende dalla Story 01 per shell, ricerca, provider, quotazioni, watchlist, cache e preferenza dell'indicatore. Gli importi di costi maturati fanno già parte del contratto matematico del rendimento; la creazione dei piani e le regole di ricorrenza sono introdotte nella Story 03.

## Flusso utente

1. Da un risultato di ricerca o da uno strumento in watchlist, l'utente avvia il primo acquisto.
2. Inserisce la data obbligatoria e almeno uno tra quantità e costo sostenuto; se inserisce il costo, ne indica la valuta effettivamente pagata.
3. Se quantità e costo sono entrambi presenti, il sistema conserva i valori esatti. Se ne manca uno, lo stima usando prezzo e cambio storici della data e lo identifica visibilmente come stimato.
4. Il primo acquisto porta lo strumento nel portafoglio e lo rimuove dalla watchlist; gli acquisti successivi aggiornano quantità e costo medio ponderato.
5. L'utente configura la valuta base e consulta riepilogo, righe di posizione e dettaglio corrente.
6. Se abilita la performance del portafoglio, il widget mostra il rendimento netto aggregato delle posizioni attive; se non esistono posizioni attive, mostra `—`.

## Modello di acquisto

Ogni acquisto contiene identificatore dello strumento, data, quantità opzionale, costo sostenuto opzionale e, quando il costo è fornito, la relativa valuta. La data è obbligatoria e almeno uno tra quantità e costo deve essere presente. Le commissioni di acquisto e gli altri oneri di acquisizione non hanno campi separati: sono compresi nel costo inserito dall'utente.

Quando entrambi i valori sono forniti sono autorevoli. Quando ne è fornito uno solo, il valore mancante deriva dal prezzo storico e dal cambio storico applicabili alla data dell'acquisto; il valore derivato deve restare distinguibile da quello inserito. Sono ammessi più acquisti per strumento e il costo medio è ponderato su tutti gli acquisti che appartengono ancora alla posizione attiva.

L'assenza sia di quantità sia di costo rifiuta il salvataggio con un errore a livello di campo.

## Valute e calcoli

- La valuta base è configurabile e, al primo utilizzo, deriva dal locale di sistema.
- Il costo fornito resta espresso nella valuta realmente pagata dall'utente.
- I valori correnti sono convertiti nella valuta base con l'ultimo cambio ritardato disponibile.
- Le stime alla data di acquisto usano prezzi e cambi storici.
- I guadagni e le perdite da cambio concorrono alla performance.

Per ogni posizione attiva al tempo `t`:

```text
market_value(t) = active_quantity(t) * market_price(t)
total_capital(t) = remaining_cost_basis(t) + accrued_position_costs(t)
net_profit(t) = market_value(t) - total_capital(t)
net_return(t) = net_profit(t) / total_capital(t)
```

Per il portafoglio:

```text
portfolio_market_value(t) = sum of active position market values
portfolio_total_capital(t) = sum of active position total capital
                           + accrued portfolio-level costs
portfolio_net_profit(t) = portfolio_market_value(t) - portfolio_total_capital(t)
portfolio_net_return(t) = portfolio_net_profit(t) / portfolio_total_capital(t)
```

Il rendimento aggregato è quindi ponderato per il capitale investito, non è la media aritmetica delle percentuali delle posizioni.

## Presentazione

La panoramica Portfolio mostra valore corrente aggregato, costo residuo aggregato, costi di gestione maturati, profitto o perdita assoluta e rendimento netto percentuale. Contiene una riga selezionabile per ogni posizione attiva.

Ogni riga mostra prezzo corrente, valuta di quotazione, variazione giornaliera, valore corrente della posizione, costo residuo, profitto o perdita assoluta e rendimento percentuale. Il dettaglio corrente mostra inoltre borsa o mercato e stato aperto/chiuso quando disponibili; un metadato opzionale assente è mostrato come non disponibile senza invalidare lo strumento. Grafico, storico delle operazioni e TER vengono completati dalla Story 03.

## Confini

Sono inclusi acquisti, validazione, stime, costo medio ponderato, esclusività tra watchlist e portafoglio, valuta base, conversioni FX, formule di posizione e portafoglio, panoramica e indicatore aggregato. In questa slice i costi maturati sono un input del motore di calcolo; configurazione e maturazione mensile o annuale dei piani restano nella Story 03.

Non sono inclusi prelievi o vendite, proventi di vendita, rendimento realizzato, dividendi, grafico storico, split, TER, import/export o portafogli multipli.

## Criteri di accettazione

### AC-002 — Rendimento netto nel widget

**Given** l'indicatore di performance è abilitato e il portafoglio contiene almeno una posizione attiva con costo residuo ed eventuali costi di gestione applicabili<br>
**When** il widget compatto calcola il valore da mostrare<br>
**Then** visualizza il rendimento netto aggregato, ponderato sul capitale totale residuo e comprensivo dei costi applicabili.

### AC-005 — Primo acquisto senza duplicati

**Given** uno strumento appartiene alla watchlist e non al portafoglio<br>
**When** l'utente registra il suo primo acquisto valido<br>
**Then** lo strumento viene rimosso dalla watchlist e inserito nel portafoglio una sola volta, conservando l'acquisto.

### AC-006 — Quantità e costo esatti

**Given** un acquisto con data, quantità e costo sostenuto, oltre alla valuta del costo<br>
**When** l'utente salva l'acquisto<br>
**Then** quantità e costo inseriti sono trattati come valori autorevoli e non vengono ricalcolati dal provider.

### AC-007 — Stima del valore mancante

**Given** un acquisto valido con data e soltanto quantità oppure soltanto costo sostenuto<br>
**When** il sistema completa l'acquisto<br>
**Then** deriva il valore mancante dal prezzo storico e dal cambio storico della data e lo identifica visibilmente come stima.

### AC-008 — Costo medio ponderato

**Given** due acquisti dello stesso strumento a costi unitari differenti<br>
**When** il sistema calcola la posizione attiva<br>
**Then** il costo medio per unità corrisponde al costo complessivo degli acquisti diviso per la quantità complessiva, con le conversioni previste, e non alla media semplice dei due costi unitari.

### AC-013 — Formula del rendimento netto

**Given** EUR 1.000 di costo residuo, EUR 1.100 di valore corrente e EUR 20 di costi maturati<br>
**When** il rendimento netto viene calcolato come `(1.100 - 1.000 - 20) / (1.000 + 20)` e arrotondato a due decimali<br>
**Then** il valore visualizzato è `7,84%` nel locale italiano, equivalente a `7.84%` nel locale inglese.

### AC-014 — Effetto del cambio

**Given** una posizione quotata in valuta diversa dalla valuta base e dati di prezzo invariati<br>
**When** cambia il tasso di cambio usato per convertire il valore corrente<br>
**Then** cambiano il valore e la performance espressi nella valuta base.

## Verifiche supplementari della slice

- **Given** un acquisto senza quantità e senza costo, **when** l'utente prova a salvarlo, **then** il sistema lo rifiuta con un errore a livello di campo.
- **Given** uno strumento estraneo sia alla watchlist sia al portafoglio, **when** viene registrato il primo acquisto da una ricerca, **then** entra direttamente nel portafoglio senza duplicati.
- **Given** più posizioni con percentuali differenti, **when** viene calcolato il rendimento aggregato, **then** il risultato deriva dai totali di valore e capitale e non dalla media delle percentuali.
- **Given** nessuna posizione attiva e la modalità portafoglio abilitata, **when** si visualizza il widget, **then** compare `—`.
- **Given** dati e cache identici, **when** il calcolo viene ripetuto, **then** produce lo stesso risultato.

