# ADR-0001 — Stack tecnologico e architettura runtime

- **Stato:** Accettata
- **Data:** 2026-09-08
- **Ambito:** implementazione delle quattro storie della v1
- **Fonte dei requisiti:** [Omarchy Finance Widget — Product Specification](../specs/omarchy-finance-widget.md)

## Contesto

Il prodotto deve essere un plugin nativo di Omarchy Shell/Quickshell, apparire su ogni monitor, condividere una sola cache e una sola operazione di refresh, mantenere i dati localmente e calcolare in modo deterministico quantità, costi, cambi e performance.

L'interfaccia deve restare reattiva con 100 strumenti. Il motore applicativo deve quindi essere separato dal rendering QML e deve poter essere testato senza avviare l'intera shell. Python non viene adottato perché non è una tecnologia familiare al proprietario del progetto.

## Decisione

### Interfaccia nativa QML

L'interfaccia sarà sviluppata con QML, Qt Quick e Quickshell, riutilizzando i componenti `qs.Ui` e `qs.Commons` forniti da Omarchy.

Il manifest dichiarerà un plugin con i kind `bar-widget` e `service`, `keepLoaded: true` e una sola istanza logica del widget (`allowMultiple: false`). Il bar widget potrà essere materializzato su ogni monitor, mentre il service resterà un singleton condiviso nel processo `omarchy-shell`.

Il codice QML sarà responsabile di:

- widget compatto e pannello espanso;
- navigazione, form, grafico e stati di caricamento o errore;
- binding ai view model;
- formattazione secondo il locale;
- adozione dei colori, font e spaziature del tema Omarchy;
- gestione della posizione globale nella barra tramite le API supportate da Omarchy.

La logica finanziaria non sarà implementata nei componenti grafici.

### Servizio condiviso Quickshell

`FinanceService.qml` sarà il coordinatore QML unico per tutte le istanze visuali. Sarà responsabile di:

- avviare e supervisionare il worker applicativo;
- esporre alla UI uno stato osservabile;
- mantenere un solo timer di refresh;
- impedire refresh concorrenti o separati per monitor;
- tradurre le risposte del worker in view model e stati `loading`, `stale`, `unavailable` ed `error`.

### Motore TypeScript su Deno

Il motore applicativo sarà scritto in TypeScript ed eseguito con Deno come processo figlio di `omarchy-shell`. Non sarà un daemon di sistema né un'applicazione autonoma.

Il worker conterrà quattro aree separate:

1. **Domain:** acquisti, prelievi, costo medio ponderato, split, costi ricorrenti, valute e formule di performance.
2. **Application:** comandi e query dei flussi utente, coordinamento del refresh e validazione.
3. **Infrastructure:** persistenza SQLite, filesystem, import/export e migrazioni.
4. **Providers:** porte per i dati di mercato e relativi adapter.

Il worker userà le autorizzazioni Deno minime necessarie per rete e directory locali del plugin. Le dipendenze saranno versionate e rese disponibili con il progetto, senza download durante l'esecuzione ordinaria.

### Comunicazione tra QML e worker

QML e TypeScript comunicheranno tramite messaggi JSON Lines su standard input e standard output. Ogni richiesta avrà un identificatore di correlazione e produrrà una risposta di successo o errore; gli aggiornamenti spontanei del servizio saranno eventi separati.

Il protocollo sarà interno e versionato. Nessun dato personale verrà scritto nei log. La caduta del worker non dovrà causare la caduta di `omarchy-shell`: il service mostrerà dati stale disponibili oppure uno stato non disponibile.

### Persistenza SQLite

SQLite sarà la fonte persistente dello stato locale e sarà incapsulato dietro un repository. Conterrà dati utente, preferenze, versione dello schema e cache di mercato, mantenendo distinguibili dati autorevoli e dati ricostruibili.

La sezione della barra rimarrà di proprietà di `shell.json`, come previsto da Omarchy, e non sarà duplicata in SQLite come fonte autorevole. L'orchestratore di import/export includerà anche questa impostazione attraverso un adapter QML verso la shell. Prima di qualsiasi modifica verrà validato l'intero documento; se l'applicazione coordinata di database e posizione della barra fallisce, verranno ripristinati sia la transazione sia il valore Omarchy precedente.

Gli import saranno validati completamente prima della scrittura e applicati in una transazione. Un errore provocherà rollback e lascerà invariato lo stato precedente. Le migrazioni saranno versionate e testate.

Il JSON rimarrà il formato pubblico e versionato di import/export; SQLite è soltanto un dettaglio interno.

### Aritmetica decimale

Importi, quantità, prezzi e cambi non useranno il tipo `number` come rappresentazione autorevole. Attraverseranno i confini JSON come stringhe decimali e saranno calcolati con una libreria decimale TypeScript versionata, inizialmente `decimal.js`.

Conversione, precisione e arrotondamento saranno eseguiti soltanto nel dominio. La UI riceverà valori già calcolati e applicherà esclusivamente la formattazione locale richiesta per la visualizzazione.

### Provider sostituibile

Il dominio dipenderà da una porta `MarketDataProvider`, non da Yahoo Finance direttamente. La porta coprirà ricerca, quotazioni, dati storici, cambi, metadati e azioni societarie.

Yahoo Finance sarà il primo adapter candidato. La sua copertura e il suo comportamento verranno verificati con uno spike prima di consolidare l'integrazione. La sostituzione dell'adapter non dovrà richiedere modifiche ai dati del portafoglio o alle formule finanziarie.

### Grafico

Il grafico sarà disegnato nativamente in QML tramite Canvas o Shape, senza un framework grafico esterno. Il worker preparerà la serie temporale e i marker; la UI si limiterà a visualizzarli.

### Test e qualità

Il progetto userà gli strumenti integrati di Deno per formattazione, lint e test. La strategia comprenderà:

- test unitari delle funzioni pure del dominio;
- test di contratto del provider con fixture locali;
- test di integrazione del repository, delle migrazioni e del rollback degli import;
- test del protocollo JSON Lines;
- smoke test del caricamento del plugin in Omarchy Shell;
- benchmark con 100 strumenti e cache disponibile.

I test del provider non dipenderanno normalmente dalla rete; i controlli live saranno separati.

## Struttura prevista

```text
manifest.json
qml/
  BarWidget.qml
  FinanceService.qml
  Panel.qml
  views/
  components/
  i18n/
backend/
  main.ts
  domain/
  application/
  infrastructure/
  providers/
tests/
  unit/
  integration/
  fixtures/
docs/
  decisions/
  specs/
  stories/
```

## Conseguenze

### Positive

- Il proprietario del progetto può lavorare nel linguaggio TypeScript invece di Python.
- La UI rimane nativa e coerente con Omarchy.
- Calcoli, rete e database non bloccano direttamente il rendering QML.
- Un solo service soddisfa il requisito di cache e refresh condivisi tra monitor.
- Il dominio è testabile senza avviare Quickshell.
- Provider e persistenza restano sostituibili tramite porte dedicate.

### Costi e rischi

- Il plugin richiede Deno oppure una futura modalità di distribuzione equivalente.
- Driver SQLite e libreria decimale devono essere bloccati, distribuiti e aggiornati consapevolmente.
- Il protocollo tra due processi introduce gestione di lifecycle, timeout e correlazione delle richieste.
- Yahoo Finance non offre un contratto stabile sufficiente a eliminare il rischio di cambiamenti del provider.

## Alternative considerate

- **Python:** tecnicamente adeguato grazie a `decimal` e SQLite nella libreria standard, ma scartato per manutenibilità da parte del proprietario.
- **JavaScript interamente in QML:** riduce i processi, ma concentra rete, persistenza e calcoli nel processo grafico e rende più difficile rispettare isolamento e limite di interazione.
- **Node.js:** ecosistema ampio, ma Deno offre esecuzione TypeScript diretta e strumenti integrati con minore configurazione.
- **Go:** produce un singolo binario, ma richiede una toolchain e librerie aggiuntive per decimali e SQLite.
- **Rust:** offre forte sicurezza e prestazioni, ma introduce una curva di apprendimento e una complessità non necessarie per la v1.
- **C++/Qt:** integrazione profonda con Qt, ma richiede un ciclo di compilazione e distribuzione sproporzionato per un plugin di questa scala.

## Verifiche prima dell'implementazione completa

La Story 01 includerà uno spike tecnico limitato per confermare:

- avvio e arresto affidabile di un worker Deno da un service Quickshell;
- messaggistica JSON Lines bidirezionale senza bloccare la UI;
- disponibilità o strategia di installazione di Deno su una Omarchy pulita supportata;
- caricamento del service singleton da parte di un plugin di terze parti con bar widget;
- packaging offline del driver SQLite e della libreria decimale;
- ricerca, quotazioni, storico, cambi, metadati e split ottenibili dal primo provider candidato.

Un esito negativo dello spike richiederà una nuova ADR prima di cambiare runtime, persistenza o provider. Non modifica automaticamente i requisiti della specifica.

## Nota sulle versioni osservate

Durante la decisione, l'ambiente di sviluppo riportava Omarchy `4.0.1-1`, Quickshell `0.3.1` e Deno `2.9.5`. Questi numeri descrivono soltanto l'ambiente osservato: il target normativo rimane la release stabile corrente di Omarchy al momento del rilascio.
