# Story 01 — Mercato, watchlist e widget compatto

## Valore utente

Come investitore che usa Omarchy, voglio cercare strumenti finanziari, organizzare una watchlist e leggerne l'andamento dal pannello e dalla barra, così da controllare rapidamente il mercato senza aprire un'altra applicazione o creare un account.

## Risultato della slice

Al termine della storia esiste un plugin nativo per l'interfaccia stabile corrente di Omarchy Shell/Quickshell. Il plugin è utilizzabile su tutti i monitor e offre un widget compatto, un pannello espanso, ricerca, watchlist ordinabile, impostazioni essenziali, cache condivisa e aggiornamento dei dati di mercato. I dati introdotti da questa slice sopravvivono ai riavvii.

Questa è la prima storia e non dipende dalle successive. Le sezioni Portfolio e relative viste possono mostrare uno stato vuoto finché la Story 02 non introduce acquisti e calcoli.

## Flusso utente

1. Il plugin si avvia e colloca il widget nella stessa sezione configurata della barra di ogni monitor.
2. L'utente apre il pannello dal widget e passa tra Portfolio, Watchlist, Ricerca e Impostazioni.
3. In Ricerca inserisce nome, ticker o un altro identificatore supportato dal provider.
4. Se trova uno strumento, lo aggiunge alla watchlist; un nuovo elemento viene accodato.
5. In Watchlist riordina manualmente gli elementi tramite trascinamento.
6. Con l'indicatore di performance del portafoglio disattivato, il widget mostra la variazione giornaliera del primo elemento; senza un valore disponibile mostra `—`.
7. Le quotazioni vengono lette dalla cache condivisa e aggiornate automaticamente solo quando scadute, oppure su richiesta manuale.

## Ambito funzionale

- Integrare il widget come plugin nativo della barra Omarchy su ogni monitor, con un'unica posizione globale: sinistra, centro o destra.
- Rendere il widget cliccabile per aprire il pannello espanso con le quattro sezioni previste: Portfolio, Watchlist, Ricerca e Impostazioni.
- Consentire dalle impostazioni la scelta della posizione in barra e l'attivazione o disattivazione dell'indicatore di performance del portafoglio.
- Quando la modalità selezionata non dispone ancora di dati, mostrare `—` invece di zero.
- Cercare per nome, ticker o altro identificatore esposto dal provider.
- Gestire azioni, ETF, ETC, ETN, indici, fondi comuni, obbligazioni, criptovalute, strumenti valutari e materie prime, nei limiti della copertura del provider.
- Consentire l'aggiunta di un risultato alla singola watchlist locale, accodando i nuovi elementi.
- Consentire il riordino manuale della watchlist tramite drag-and-drop e conservarne l'ordine.
- Usare inizialmente Yahoo Finance o una fonte gratuita equivalente, senza account o chiave API; le quotazioni possono essere ritardate.
- Isolare il comportamento specifico del provider dai dati della watchlist e, in prospettiva, del portafoglio.
- Mostrare il timestamp dei dati di mercato nei punti in cui un dato ritardato potrebbe essere interpretato come corrente.

## Cache, refresh ed errori

- Tutte le istanze sui monitor condividono una sola cache e una sola operazione di refresh.
- La cache delle quotazioni scade dopo sei ore. All'avvio o all'apertura del pannello si aggiorna solo se scaduta.
- Il refresh automatico non è più frequente di una volta ogni sei ore; l'intervallo non è configurabile in v1.
- Il refresh manuale resta disponibile e le ricerche interattive, sempre avviate dall'utente, sono indipendenti dal ciclo periodico.
- Un errore su uno strumento non impedisce l'aggiornamento degli altri e non elimina uno strumento già noto.
- Con dati in cache, un errore di rete o del provider conserva i valori, visualizza l'ultimo aggiornamento e li marca come obsoleti.
- Senza dati in cache, lo stesso errore produce uno stato non disponibile, mai un valore zero.
- Una ricerca senza corrispondenze produce soltanto `Not found`; non è prevista la creazione manuale di strumenti non supportati.
- Metadati opzionali mancanti non rendono invalido uno strumento e sono rappresentati con un indicatore di indisponibilità.

## Confini

Sono inclusi il guscio del plugin, la navigazione del pannello, la ricerca, la watchlist, il widget in modalità watchlist, l'adattatore del provider, la cache e il refresh. Acquisti, ingresso nel portafoglio, calcoli di performance e valuta base appartengono alla Story 02. Prelievi, grafici, azioni societarie, piani di costo e TER appartengono alla Story 03. Import/export, localizzazione completa, temi e prova prestazionale appartengono alla Story 04.

Restano fuori dall'intero prodotto: tempo reale garantito, creazione manuale di strumenti assenti dal provider, screener o feed di scoperta, notifiche, consulenza finanziaria, negoziazione e integrazioni con broker.

## Criteri di accettazione

### AC-001 — Presenza e posizione su tutti i monitor

**Given** un'installazione Omarchy supportata con più monitor e una posizione globale della barra scelta tra sinistra, centro o destra<br>
**When** Omarchy Shell carica il plugin o l'utente cambia la posizione nelle impostazioni<br>
**Then** il widget compare su ogni monitor nella stessa sezione configurata.

### AC-003 — Indicatore basato sulla watchlist

**Given** l'indicatore di performance del portafoglio è disattivato e la watchlist contiene strumenti in ordine manuale<br>
**When** il widget compatto viene visualizzato<br>
**Then** mostra la variazione percentuale giornaliera del primo strumento, e il valore segue un eventuale riordino della watchlist.

### AC-004 — Ricerca delle classi supportate

**Given** il provider contiene una corrispondenza appartenente a una delle classi supportate: azione, ETF, ETC, ETN, indice, fondo comune, obbligazione, criptovaluta, strumento valutario o materia prima<br>
**When** l'utente cerca per nome, ticker o altro identificatore esposto dal provider<br>
**Then** la ricerca può restituire lo strumento con la sua classe; se il provider non contiene alcuna corrispondenza, mostra `Not found`.

### AC-017 — Refresh automatico condiviso

**Given** più istanze del widget usano la stessa cache e questa è stata aggiornata meno di sei ore prima<br>
**When** il plugin si avvia, il pannello viene aperto o un'altra istanza richiede i dati<br>
**Then** non parte un nuovo refresh automatico e tutte le istanze leggono la cache condivisa.

### AC-018 — Dati obsoleti in caso di errore

**Given** esistono valori in cache e il provider o la rete non sono disponibili<br>
**When** un refresh fallisce<br>
**Then** i valori memorizzati restano visibili, sono marcati come obsoleti con l'orario dell'ultimo aggiornamento e non vengono sostituiti con zero.

## Verifiche supplementari della slice

- **Given** la watchlist è vuota o il primo strumento non ha un dato disponibile, **when** è attiva la modalità watchlist, **then** il widget mostra `—`.
- **Given** la cache è scaduta, **when** avviene il primo avvio o la prima apertura del pannello, **then** parte una sola operazione condivisa di refresh.
- **Given** la cache è ancora valida, **when** l'utente richiede un refresh manuale, **then** il sistema può aggiornare i dati senza modificare l'intervallo automatico.
- **Given** un refresh multiplo, **when** un solo strumento fallisce, **then** gli altri vengono aggiornati e lo strumento fallito non viene eliminato.
- **Given** nessun dato in cache e il provider non disponibile, **when** serve una quotazione, **then** l'interfaccia mostra lo stato non disponibile e non zero.
- **Given** watchlist, ordine e preferenze della slice, **when** Omarchy Shell viene riavviato, **then** tali dati vengono ripristinati.
