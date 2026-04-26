## **1\. Document Information**

**Project Name:** RankEX  
**Document Title:** Product Functional Specification  
**Version:** 1.0

## **2\. Introduction**

Il presente documento descrive in modo dettagliato il comportamento funzionale della piattaforma RankEX, con l’obiettivo di definire in maniera chiara e condivisa tutte le funzionalità disponibili, le logiche operative e le interazioni tra utente e sistema.

A differenza della documentazione tecnica, questo documento si concentra su ciò che il sistema fa, su come reagisce alle azioni degli utenti e su quali risultati produce, evitando riferimenti all’implementazione o a dettagli di codice.

Il documento rappresenta il riferimento principale per:

- validazione funzionale con il cliente
- allineamento tra team di sviluppo e prodotto
- onboarding di nuovi membri del team

## **3\. Product Structure**

RankEX è strutturato come piattaforma modulare, in cui il comportamento del sistema varia in funzione del dominio applicativo associato all’organizzazione.

Ogni organizzazione opera all’interno di un singolo modulo, che determina terminologia, test disponibili e logiche di gestione dei clienti.

Attualmente sono previsti due moduli principali: personal training e soccer academy.

Nel modulo personal training, il sistema si adatta al livello del cliente, proponendo test e logiche coerenti con la sua condizione fisica. Nel modulo soccer academy, invece, il comportamento è standardizzato e tutti gli atleti vengono valutati secondo lo stesso insieme di test.

Questa distinzione è completamente trasparente per l’utente finale ma influenza in modo significativo il comportamento dell’interfaccia e delle funzionalità disponibili.

## **4\. User Lifecycle**

L’interazione con la piattaforma varia in base al ruolo dell’utente, ma segue un ciclo di vita comune che parte dall’autenticazione e prosegue con l’accesso alle funzionalità specifiche del proprio profilo.

Gli utenti operativi (trainer, admin) accedono a un’area gestionale da cui possono creare e gestire clienti, pianificare sessioni e analizzare dati. Gli utenti finali (clienti) accedono invece a una vista semplificata, focalizzata esclusivamente sui propri dati e progressi.

Il sistema garantisce che ogni utente possa visualizzare e modificare solo le informazioni pertinenti al proprio ruolo, mantenendo un elevato livello di controllo sugli accessi.

## **5\. Client Management**

La gestione dei clienti rappresenta uno degli elementi centrali della piattaforma. Ogni cliente è identificato da un profilo che contiene informazioni anagrafiche, dati fisici e storico delle attività.

Nel modulo personal training, il cliente viene associato a una categoria che ne determina il livello (ad esempio health, active o athlete). Questa classificazione influisce direttamente sui test disponibili e sulla modalità di valutazione delle performance.

Nel modulo soccer academy, invece, la categoria non viene utilizzata a fini funzionali, ma viene sostituita dal ruolo sportivo dell’atleta, che ha esclusivamente una funzione descrittiva e visiva.

Durante la creazione di un nuovo cliente, il sistema guida l’utente attraverso un processo strutturato che varia in base al modulo attivo. Nel caso del personal training, vengono richieste informazioni relative alla categoria e al tipo di profilo, mentre nel contesto soccer viene introdotto uno step dedicato alla selezione del ruolo.

Il sistema prevede inoltre limitazioni legate al piano attivo dell’organizzazione. Nel caso in cui venga raggiunto il numero massimo di clienti consentiti, la creazione di nuovi profili viene bloccata e l’interfaccia mostra un messaggio esplicativo.

## **6\. Performance Testing**

RankEX integra un sistema strutturato per la gestione dei test atletici, che consente di raccogliere dati oggettivi sulle performance degli utenti.

Nel modulo personal training, i test disponibili variano in funzione della categoria del cliente, garantendo che ogni utente venga valutato attraverso protocolli coerenti con il proprio livello di preparazione. Alcuni test possono essere condivisi tra più categorie, mentre altri sono specifici.

Nel modulo soccer academy, invece, il sistema utilizza un insieme fisso di test applicato a tutti gli atleti. Questo approccio consente di garantire uniformità nella raccolta dei dati e facilita il confronto tra diversi soggetti.

Ogni test produce un valore numerico che viene successivamente elaborato per calcolare un percentile, permettendo di confrontare la performance del cliente rispetto a una popolazione di riferimento.

## **7\. Performance Evaluation**

I dati raccolti attraverso i test vengono utilizzati per costruire una valutazione complessiva della performance del cliente.

Il sistema calcola una media delle performance e assegna un rank, che rappresenta in modo sintetico il livello dell’utente. Questo rank è determinato esclusivamente dai risultati dei test atletici e non viene influenzato da altri fattori.

L’approccio adottato consente di mantenere una chiara separazione tra dati oggettivi e altre informazioni, garantendo coerenza e trasparenza nella valutazione.

## **8\. Body Composition Analysis (BIA)**

Nel modulo personal training, la piattaforma supporta la registrazione e l’analisi dei dati di composizione corporea tramite BIA.

Questa funzionalità consente di monitorare parametri fisiologici come massa grassa, massa muscolare e altri indicatori rilevanti, offrendo una visione complementare rispetto ai test atletici.

I dati BIA vengono gestiti separatamente rispetto ai dati di performance e non influenzano il calcolo del rank. Tuttavia, contribuiscono al sistema di gamification, incentivando il miglioramento nel tempo.

Il sistema supporta diversi tipi di profilo cliente, che determinano quali funzionalità sono disponibili. Alcuni utenti possono avere accesso esclusivamente ai test, altri solo alla BIA, mentre altri ancora possono utilizzare entrambe le funzionalità.

## **9\. Gamification System**

RankEX integra un sistema di gamification progettato per aumentare il coinvolgimento degli utenti e incentivare la continuità nel tempo, calibrato su un orizzonte di utilizzo di 3–5 anni.

**Fonti di XP:** gli utenti accumulano experience points partecipando alle sessioni, registrando campionamenti atletici e misurazioni BIA. La partecipazione alle sessioni rappresenta la fonte principale; campionamento e BIA contribuiscono con bonus legati al miglioramento.

**Sessioni:** ogni sessione completata con presenza garantisce XP base (50), moltiplicato da un fattore streak che premia la continuità. La streak aumenta del 10% per ogni sessione consecutiva senza assenze, fino a un massimo di +100% a streak 10. Un’assenza azzera la streak.

**Campionamento e BIA — logica unificata:** entrambi gli eventi di misurazione seguono la stessa struttura a tier: 50 XP alla prima misurazione, poi 10/30/60/100 XP in base al numero di parametri migliorati rispetto alla sessione precedente (0 / 1 / 2–3 / tutti). Effettuare una misurazione garantisce sempre almeno 10 XP, anche in caso di regressione.

**Progressione livelli:** ogni livello richiede l’1.08× dei punti del livello precedente, con partenza a 500 XP. La curva è calibrata affinché un atleta attivo raggiunga il livello 30 in circa 3.5–4 anni con frequenza regolare.

**Leaderboard di gruppo:** ogni gruppo/squadra dispone di una classifica interna consultabile dal trainer, ordinabile per media complessiva o per singola statistica atletica. I primi tre posti sono evidenziati con colori oro, argento e bronzo.

Il rank dell’utente rimane indipendente dal sistema di experience points e continua a basarsi esclusivamente sulla media dei percentili dei test atletici.

## **10\. Calendar and Session Management**

La piattaforma include un sistema di gestione del calendario che consente di pianificare e monitorare le sessioni di allenamento.

Le sessioni possono essere create manualmente o generate automaticamente tramite ricorrenze, che permettono di definire schemi ripetitivi nel tempo. Questo approccio semplifica la gestione operativa, soprattutto in contesti con un numero elevato di utenti.

Al termine di una sessione, il sistema consente di registrare la presenza o l’assenza dei partecipanti. Gli utenti presenti ricevono experience points, mentre quelli assenti non ottengono alcun beneficio.

È inoltre possibile contrassegnare una sessione come non svolta, nel qual caso non viene assegnato alcun punteggio.

## **11\. Group Management**

I clienti possono essere organizzati in gruppi, facilitando la gestione di attività collettive.

L’associazione tra clienti e gruppi ha un impatto diretto sulle sessioni pianificate. Quando un cliente viene aggiunto o rimosso da un gruppo, il sistema aggiorna automaticamente le sessioni future associate a quel gruppo, mantenendo la coerenza dei dati.

Le modifiche non influenzano le sessioni già concluse, garantendo la stabilità dello storico.

## **12\. Notifications**

Il sistema prevede la gestione di notifiche interne, utilizzate per comunicare eventi rilevanti agli utenti.

Le notifiche possono essere generate automaticamente in seguito a determinate azioni, come la registrazione di una sessione o il mancato completamento di un’attività.

Ogni notifica è associata a un utente specifico e può essere contrassegnata come letta.

## **13\. Plan Limitations**

RankEX adotta un modello SaaS basato su piani, che definiscono limiti operativi per ciascuna organizzazione.

I limiti principali riguardano il numero di membri del team e il numero di clienti gestibili. Quando tali limiti vengono raggiunti, il sistema impedisce la creazione di nuove entità e fornisce un feedback visivo all’utente.

Queste restrizioni sono applicate in modo coerente sia a livello di interfaccia che a livello di sistema, garantendo integrità e prevedibilità del comportamento.

## **14\. Security and Access Control**

La piattaforma implementa un modello di controllo degli accessi basato sui ruoli, che definisce in modo preciso quali operazioni possono essere eseguite da ciascun utente.

Le autorizzazioni vengono applicate sia a livello di interfaccia che a livello di sistema, assicurando che gli utenti possano accedere esclusivamente alle informazioni di propria competenza.

Questo approccio contribuisce a garantire la sicurezza dei dati e la conformità alle best practice di gestione delle informazioni.

## **15\. Conclusion**

Il presente documento descrive il comportamento funzionale di RankEX in modo completo e strutturato, fornendo una base solida per lo sviluppo, la validazione e l’evoluzione futura della piattaforma.

La chiarezza delle logiche descritte consente di ridurre ambiguità e incomprensioni, facilitando la collaborazione tra tutte le parti coinvolte nel progetto.