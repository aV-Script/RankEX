## **1\. Document Information**

**Project Name:** RankEX  
**Document Title:** Executive Overview  
**Version:** 1.0  

## **2\. Executive Summary**

RankEX è una piattaforma SaaS multi-tenant progettata per supportare il monitoraggio, l’analisi e l’ottimizzazione delle performance atletiche in contesti professionali e semi-professionali. La soluzione nasce con l’obiettivo di colmare il divario tra raccolta dati, interpretazione delle performance e gestione operativa degli atleti, integrando tali dimensioni in un unico ecosistema digitale coerente.

Attraverso RankEX, personal trainer, centri fitness e accademie sportive possono disporre di uno strumento unificato che consente di tracciare i progressi nel tempo, strutturare programmi di allenamento e migliorare il coinvolgimento degli utenti mediante meccaniche di gamification. La piattaforma è progettata per adattarsi a contesti operativi differenti, mantenendo al contempo una forte coerenza nella gestione dei dati e nell’esperienza utente.

## **3\. Business Context**

Il settore del fitness e della preparazione atletica è caratterizzato da un’elevata frammentazione degli strumenti utilizzati quotidianamente. La gestione dei clienti, il monitoraggio delle performance e la pianificazione degli allenamenti sono spesso distribuiti su sistemi distinti, con conseguente perdita di efficienza e difficoltà nell’interpretazione dei dati.

RankEX si inserisce in questo contesto proponendo un approccio integrato, in cui tutte le informazioni rilevanti vengono centralizzate e rese accessibili in modo strutturato. Questo consente non solo di migliorare la qualità del servizio offerto agli utenti finali, ma anche di introdurre un modello decisionale basato su dati oggettivi e facilmente confrontabili nel tempo.

## **4\. Product Overview**

La piattaforma è organizzata secondo una logica modulare, che permette di adattare il comportamento del sistema a specifici domini applicativi senza compromettere la coerenza architetturale.

Il primo dominio, dedicato al personal training e al contesto gym, è pensato per professionisti e strutture che operano con clienti caratterizzati da livelli di preparazione differenti. In questo ambito, RankEX consente di classificare gli utenti in base alla loro condizione fisica e di applicare protocolli di valutazione coerenti con il livello di appartenenza. A questo si affianca la possibilità di integrare dati di composizione corporea tramite BIA, offrendo una visione più completa dello stato fisico del cliente.

Il secondo dominio è orientato alle accademie calcistiche e introduce un modello più standardizzato, in cui tutti gli atleti vengono valutati attraverso un set fisso di test. In questo contesto, l’attenzione è posta sulla comparabilità dei risultati e sulla gestione strutturata di squadre e ruoli, consentendo ai coach di monitorare in modo uniforme l’evoluzione delle performance.

## **5\. Core Capabilities**

RankEX si distingue per la capacità di integrare in modo coerente diverse funzionalità chiave all’interno di un unico sistema. Il monitoraggio delle performance rappresenta uno degli elementi centrali della piattaforma e si basa sulla raccolta strutturata dei risultati dei test atletici, successivamente elaborati tramite algoritmi di calcolo dei percentili. Questo approccio consente di posizionare ogni utente rispetto a benchmark di riferimento, rendendo immediatamente comprensibile il livello di performance.

Parallelamente, la piattaforma offre strumenti avanzati per la gestione dei clienti, permettendo di organizzare gli utenti in gruppi, assegnarli a sessioni e segmentarli in base a caratteristiche specifiche. La pianificazione degli allenamenti è supportata da un sistema di calendario che include la gestione delle ricorrenze, facilitando la creazione di programmi strutturati nel tempo.

Un ulteriore elemento distintivo è rappresentato dal sistema di gamification, che introduce dinamiche di progressione basate su experience points, livelli e ranking. Questo meccanismo contribuisce a migliorare l’engagement degli utenti, incentivando la continuità e la partecipazione attiva.

Nel contesto del personal training, la piattaforma integra inoltre funzionalità di analisi della composizione corporea, consentendo di registrare e monitorare parametri fisiologici nel tempo. Queste informazioni vengono affiancate ai dati di performance, offrendo una visione più completa dello stato di forma dell’utente.

## **6\. Architecture Overview**

Dal punto di vista tecnologico, RankEX è sviluppato come piattaforma cloud-native e si basa su un’architettura progettata per garantire scalabilità, affidabilità e semplicità di gestione.

Il frontend è realizzato utilizzando React, mentre il backend si appoggia ai servizi Firebase, che forniscono funzionalità di autenticazione e database in tempo reale tramite Firestore. L’intero sistema è distribuito tramite infrastruttura cloud, eliminando la necessità di gestione diretta dei server e consentendo una scalabilità automatica in funzione del carico.

Questa architettura permette di ridurre la complessità operativa e di accelerare lo sviluppo di nuove funzionalità, mantenendo al contempo elevati standard di sicurezza e disponibilità.

## **7\. Multi-Tenant Model**

RankEX adotta un modello multi-tenant in cui ogni utente appartiene a una specifica organizzazione. Questo approccio garantisce l’isolamento dei dati e consente a ciascuna organizzazione di operare in modo indipendente, mantenendo configurazioni e informazioni separate.

Il modello è sufficientemente flessibile da supportare sia strutture complesse con più membri, sia singoli professionisti che operano come entità autonome. In entrambi i casi, la piattaforma mantiene una chiara separazione dei dati e una gestione coerente degli accessi.

## **8\. User Roles**

Il sistema prevede diversi livelli di accesso, progettati per riflettere le esigenze operative delle diverse tipologie di utenti. I ruoli spaziano da una gestione globale della piattaforma, riservata agli amministratori centrali, fino all’accesso limitato ai soli dati personali per gli utenti finali.

Questa struttura consente di garantire sicurezza e controllo, assicurando che ogni utente possa accedere esclusivamente alle informazioni e alle funzionalità pertinenti al proprio ruolo.

## **9\. Value Proposition**

Il valore principale di RankEX risiede nella capacità di introdurre un approccio strutturato e data-driven in un settore tradizionalmente caratterizzato da processi poco standardizzati. La piattaforma consente di oggettivare la valutazione delle performance, migliorare la qualità del servizio offerto e aumentare il coinvolgimento degli utenti.

Allo stesso tempo, l’integrazione delle diverse funzionalità in un unico sistema riduce la complessità operativa e favorisce una gestione più efficiente delle attività quotidiane.

## **10\. Scalability and Future Growth**

RankEX è progettato con una visione orientata alla crescita, sia in termini di numero di utenti che di espansione funzionale. L’architettura modulare consente di introdurre nuovi domini applicativi senza impattare sulle componenti esistenti, mentre l’infrastruttura cloud garantisce la capacità di gestire volumi crescenti di dati e traffico.

Le evoluzioni future sono orientate ad approfondire l’esperienza di gamification e gli strumenti operativi per trainer e atleti:

- **Avatar cliente** — rappresentazione visiva personalizzabile che evolve al crescere del rank e del livello XP, aumentando il senso di progressione e identità dell’atleta.
- **Badge e achievement** — sistema di traguardi automatici (prima sessione, presenze consecutive, rank-up, personal best) per premiare costanza e miglioramento.
- **Streak di presenze** — moltiplicatore XP per settimane consecutive senza assenze, incentivando la partecipazione regolare. *(Il moltiplicatore streak è già attivo sulle sessioni; questa voce si riferisce alla versione estesa con badge visivi e storico streak.)*
- **Leaderboard di gruppo** — *(IMPLEMENTATO — apr 2026)* classifica interna a squadre o gruppi, ordinabile per media complessiva o singola statistica. Disponibile per tutti i moduli.
- **Obiettivi assegnati dal trainer** — il coach fissa target misurabili su test specifici per ogni atleta; il sistema monitora l’avanzamento e notifica al raggiungimento.
- **Piano di allenamento** — *(IMPLEMENTATO — apr 2026)* il trainer compone piani multi-giorno (max 7 giorni, esercizi con serie/ripetizioni/recupero) e li assegna ai clienti. L’atleta consulta la scheda attiva in read-only nella propria dashboard.