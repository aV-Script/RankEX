## **1\. Document Information**

**Project Name:** RankEX  
**Document Title:** Business Logic & Algorithms  
**Version:** 1.0

## **2\. Introduction**

Il presente documento descrive le logiche di business e gli algoritmi principali che regolano il funzionamento della piattaforma RankEX.

L’obiettivo è formalizzare in modo chiaro e non ambiguo le regole utilizzate per il calcolo delle performance, la progressione degli utenti e la gestione dei dati derivati. Questo documento rappresenta la fonte di verità per tutte le logiche computazionali del sistema e deve essere considerato vincolante per lo sviluppo e la validazione delle funzionalità.

Le logiche descritte sono indipendenti dall’implementazione tecnica e devono essere interpretate come specifiche funzionali formali.

## **3\. Performance Evaluation Model**

La valutazione delle performance degli utenti si basa esclusivamente sui risultati ottenuti nei test atletici.

Ogni test produce un valore numerico che viene trasformato in un percentile, rappresentando la posizione relativa dell’utente rispetto a una popolazione di riferimento. Questo approccio consente di normalizzare risultati eterogenei e di confrontare performance diverse su una scala comune.

La media dei percentili ottenuti nei test costituisce il valore sintetico principale utilizzato dal sistema per rappresentare il livello complessivo dell’utente.

È importante sottolineare che tutti i calcoli di performance sono indipendenti da qualsiasi altra informazione, inclusi dati fisiologici o attività svolte.

## **4\. Percentile Calculation**

Il percentile rappresenta la posizione relativa di un valore all’interno di una distribuzione di riferimento.

Per ogni test, il sistema utilizza tabelle predefinite che associano valori numerici a percentili, tenendo conto di variabili come età e sesso. Questo consente di garantire una valutazione equa e comparabile tra utenti con caratteristiche diverse.

Nel caso in cui più test condividano la stessa metrica di riferimento, il sistema utilizza un identificativo univoco del test per determinare la corretta tabella di valutazione, evitando ambiguità.

Il risultato finale del calcolo è un valore normalizzato compreso tra 0 e 100.

## **5\. Rank Determination**

Il rank rappresenta una classificazione sintetica del livello dell’utente ed è derivato direttamente dalla media dei percentili.

Il sistema definisce una serie di soglie che suddividono la scala dei valori in intervalli, ciascuno associato a un livello di rank. Questa classificazione consente di rappresentare in modo immediato il livello dell’utente, mantenendo coerenza tra diversi contesti applicativi.

Il rank viene aggiornato automaticamente ogni volta che vengono registrati nuovi risultati nei test atletici.

È fondamentale evidenziare che il rank dipende esclusivamente dai test e non è influenzato da altri fattori, inclusi experience points o dati di composizione corporea.

## **6\. Experience Points System (XP)**

Il sistema di experience points è progettato per incentivare la partecipazione e la continuità degli utenti nel lungo periodo.

Gli XP vengono assegnati in seguito a specifiche azioni: partecipazione alle sessioni, registrazione di campionamenti atletici e misurazioni BIA. La progressione dei livelli segue una curva incrementale calibrata per coprire un orizzonte di 3–5 anni di utilizzo attivo.

**Curva di livellaggio:** ogni livello richiede l’1.08× dei punti del livello precedente, con un punto di partenza di 500 XP (Lv.1→Lv.2). Questo moltiplicatore consente a un atleta attivo di raggiungere il livello 30 in circa 3.5–4 anni con frequenza regolare (3 sessioni settimanali).

Il sistema prevede bonus legati alla costanza tramite streak sessioni: ogni sessione consecutiva completata senza assenze aumenta il moltiplicatore XP del 10%, fino a un massimo del +100% a streak 10 (doppio XP).

## **7\. Session XP Logic**

Le sessioni rappresentano la principale fonte di accumulo di experience points.

Al termine di una sessione, il sistema assegna XP esclusivamente agli utenti presenti. Gli utenti assenti non ricevono alcun punto e la loro streak viene azzerata a zero.

Nel caso in cui una sessione venga contrassegnata come non svolta (skipped), il sistema non assegna XP a nessun partecipante.

La quantità di XP per sessione dipende dal valore base (50 XP) moltiplicato per il fattore streak: `XP = round(50 × (1 + min(streak × 0.1, 1.0)))`. Il massimo teorico è 100 XP/sessione a streak 10 o superiore.

## **8\. Campionamento e BIA — Logica XP Unificata**

I due eventi di misurazione — campionamento atletico e BIA — seguono la stessa logica a tier basata sul numero di parametri migliorati rispetto alla misurazione precedente. Questo garantisce coerenza e prevedibilità per trainer e atleti.

**Tier unificato (campionamento e BIA):**

| Situazione | XP assegnati |
|---|---|
| Prima misurazione in assoluto | 50 XP |
| 0 parametri/stat migliorati | 10 XP |
| 1 parametro/stat migliorato | 30 XP |
| 2–3 parametri/stat migliorati | 60 XP |
| 4+ parametri/stat migliorati (tutti) | 100 XP |

Per il **campionamento**, si contano le statistiche percentili aumentate rispetto all’ultimo campionamento. Per la **BIA**, si contano i 4 parametri chiave migliorati: massa grassa (↓), massa muscolare (↑), acqua corporea (↑) e grasso viscerale (↓).

Il sistema premia sempre la consistenza: anche senza miglioramenti, effettuare una misurazione garantisce 10 XP. Questo evita che una regressione temporanea demotivi l’atleta dall’effettuare le misurazioni successive.

I dati BIA non influenzano in alcun modo il calcolo del rank, mantenendo separati i due sistemi di valutazione. Il BIA non è disponibile nel modulo soccer academy.

## **9\. Profile Type Logic**

Il comportamento del sistema varia in funzione del tipo di profilo associato al cliente.

I profili possono essere configurati per supportare esclusivamente i test atletici, esclusivamente la BIA oppure entrambe le funzionalità. Questa distinzione determina quali dati possono essere registrati e quali logiche vengono applicate.

Nel caso in cui un profilo venga aggiornato per includere nuove funzionalità, il sistema gestisce la transizione mantenendo la coerenza dei dati esistenti. In alcuni casi, è previsto il reset di specifiche informazioni per garantire integrità del modello.

## **10\. Plan Limitation Logic**

La piattaforma implementa un sistema di limiti basato sul piano sottoscritto dall’organizzazione.

I limiti principali riguardano il numero di membri del team e il numero di clienti gestibili. Questi vincoli vengono verificati al momento della creazione di nuove entità.

Nel caso in cui il limite venga raggiunto, il sistema blocca l’operazione e restituisce un messaggio esplicativo. Le operazioni di aggiornamento o eliminazione non sono soggette a queste restrizioni.

Questo approccio consente di mantenere controllo sull’utilizzo della piattaforma senza introdurre complessità nelle operazioni quotidiane.

## **11\. Data Update Logic**

Le operazioni che modificano lo stato del sistema seguono un modello coerente basato su aggiornamenti atomici e gestione degli errori.

Quando un’azione coinvolge più entità, il sistema garantisce che tutte le modifiche vengano applicate in modo consistente. In caso di errore, nessuna modifica viene salvata, evitando stati intermedi non validi.

A livello di interfaccia, viene adottato un approccio di aggiornamento ottimistico, che migliora la percezione di reattività senza compromettere l’integrità dei dati.

## **12\. Consistency Between Systems**

RankEX mantiene una separazione netta tra i diversi sistemi di valutazione, evitando interferenze tra logiche indipendenti.

In particolare, il sistema di rank e quello di experience points operano su dimensioni diverse e non si influenzano reciprocamente. Allo stesso modo, i dati di composizione corporea sono gestiti separatamente rispetto alle performance atletiche.

Questa separazione garantisce chiarezza, coerenza e facilità di interpretazione dei dati.

## **13\. Edge Cases and Exceptions**

Il sistema gestisce una serie di casi particolari per garantire robustezza.

Tra questi rientrano situazioni in cui dati incompleti o incoerenti potrebbero compromettere i calcoli. In tali casi, il sistema adotta comportamenti conservativi, evitando di produrre risultati non affidabili.

Le modifiche retroattive, come l’aggiornamento di dati passati, vengono gestite con attenzione per preservare la consistenza dello storico.