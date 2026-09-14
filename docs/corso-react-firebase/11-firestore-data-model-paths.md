# Lezione 11 — Modello dati Firestore e path helpers
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire come Firestore organizza i dati (documenti, collezioni, sottocollezioni) e perché
questo modello è profondamente diverso da un database relazionale. Capire perché RankEX
mette **tutti** i dati operativi sotto `organizations/{orgId}/...` invece che in collezioni
"piatte" con un campo `orgId`, e perché `src/firebase/paths.js` — un file di appena 13 righe —
è uno dei più importanti del progetto. Al termine sarai in grado di leggere qualsiasi path
Firestore nel codice e sapere esattamente cosa rappresenta, senza doverlo indovinare.

## Concetti teorici

### Firestore non è una tabella SQL

Se vieni da un mondo relazionale (MySQL, Postgres) la prima cosa da disimparare è pensare
per tabelle e righe con schema fisso. Firestore è un database **documentale**: i dati sono
oggetti JSON (chiamati *documenti*) raggruppati in *collezioni*. Non c'è uno schema imposto
dal database — due documenti nella stessa collezione possono avere campi completamente
diversi. Lo schema che vedi descritto in `CLAUDE.md` (sezione "Modelli dati") non è imposto
da Firestore: è una convenzione che il codice applicativo rispetta, non una regola che il
database farebbe rispettare da solo (a differenza di un `CREATE TABLE` SQL con colonne
tipizzate).

> 📎 **Approfondimento: il modello document/collection/subcollection di Firestore**
>
> Pensa a un archivio con cassettiere etichettate. Ogni **collezione** è un cassetto con
> un'etichetta (`clients`, `slots`, `groups`...). Dentro il cassetto trovi delle **cartelline**
> numerate o etichettate — sono i **documenti**: ogni cartellina ha un ID univoco e contiene
> fogli con coppie chiave/valore (`name: "Mario"`, `xp: 340`), inclusi fogli "compositi" come
> array o oggetti annidati (`stats: { forza: 72, velocita: 65 }`).
>
> La parte che non ha equivalente in SQL: **ogni singola cartellina può contenere, al suo
> interno, un altro cassetto in miniatura** con altre cartelline dentro — questa è una
> **sottocollezione** (*subcollection*). In RankEX, `organizations/{orgId}/clients/{clientId}/notes`
> è esattamente questo: dentro la cartellina del cliente `{clientId}`, c'è un cassettino
> `notes` con dentro le note di quel cliente e nessun altro. In SQL dovresti simulare questo
> con una tabella `notes` e una foreign key `client_id` — qui invece l'annidamento fa parte
> della struttura del path stesso, non è un campo da filtrare.
>
> Una sottocollezione **non fa parte** del documento genitore in senso stretto: se leggi
> `clients/{clientId}` con `getDoc`, i dati di `notes` non arrivano — sono un percorso
> Firestore a sé stante che va interrogato separatamente. È più corretto pensarla come
> "una collezione il cui percorso passa da un documento specifico", non come un campo del
> documento.

### Perché sotto `organizations/{orgId}/...` e non in una collezione root con campo `orgId`

RankEX è multi-tenant: più organizzazioni (palestre, accademie calcistiche) condividono lo
stesso database Firestore, ma i dati di un'org non devono mai essere visibili o interrogabili
da un'altra. Ci sono due modi per modellarlo:

**Opzione A — collezione root + campo `orgId` (NON usata in RankEX):**
```
clients/{clientId}   → { orgId: "abc123", name: "Mario", ... }
```
Per leggere solo i clienti di un'org servirebbe **sempre** ricordarsi di aggiungere
`where('orgId', '==', orgId)` a ogni singola query, in ogni singolo file. Dimenticarlo anche
una sola volta in un componente nuovo tra sei mesi significa restituire dati di *tutte* le
organizzazioni. Anche le Firestore Security Rules diventano più complesse: per autorizzare
la lettura di un documento devi prima *leggerlo* per scoprire il suo `orgId` (`resource.data.orgId`),
il che non funziona affatto per le query di tipo "lista" (le rules valutate su una `list`
query non hanno un singolo `resource` da ispezionare finché non sai già cosa stai cercando).

**Opzione B — sottocollezione annidata (quella usata in RankEX):**
```
organizations/{orgId}/clients/{clientId}   → { name: "Mario", ... }  (niente campo orgId qui)
```
L'isolamento tra tenant è strutturale, non convenzionale: `collection(db, 'organizations/abc123/clients')`
può fisicamente restituire solo i clienti di `abc123` — non esiste query che li mescoli con
un'altra org, perché il path stesso lo impedisce. Le regole di sicurezza diventano naturali:
`match /organizations/{orgId}/clients/{clientId}` cattura l'`orgId` direttamente dal segmento
di path, disponibile *prima* ancora di leggere il documento (lo vedremo nel dettaglio nella
Lezione 16). Query e rules sono "scoped by construction".

Questo è coerente con quanto documentato in `CLAUDE.md` (sezione "Struttura Firestore"): tutti
i dati operativi — clienti, slot, gruppi, ricorrenze, notifiche, schede allenamento — vivono
sotto `organizations/{orgId}/`. Le uniche collezioni root-level nel progetto sono `users`
(il profilo minimo per il routing e le regole, un documento per uid) e `audit_logs`
(append-only, cross-org per definizione — un super_admin deve poter vedere l'audit di
qualunque organizzazione).

### Path helper come "single source of truth"

Un path Firestore, per l'SDK, è semplicemente una **stringa**: `collection(db, 'organizations/abc/clients')`.
Non c'è un compilatore che verifica se quella stringa corrisponde a una collezione "reale" —
Firestore è schemaless, quindi una stringa con un typo non genera nessun errore, nessun
"collection not found": genera semplicemente un percorso *diverso*, che l'SDK tratta come
valido e vuoto. Per questo motivo scrivere il path a mano in ogni file che ne ha bisogno è
fragile: la stessa stringa `organizations/${orgId}/clients` deve essere scritta *identica*
in tutti i file che leggono/scrivono clienti, e nessuno strumento ti avvisa se in un file la
scrivi in un modo leggermente diverso.

La soluzione adottata in RankEX è centralizzare ogni path in un'unica funzione esportata da
`src/firebase/paths.js`, così la stringa esiste letteralmente in un solo punto del codice.

## Dove compare nel progetto

- [`src/firebase/paths.js`](../../src/firebase/paths.js) — tutti i path helper
- [`src/firebase/config.js`](../../src/firebase/config.js) — `initializeApp`, istanza `functions`
- [`src/firebase/services/db.js`](../../src/firebase/services/db.js) — istanza `db` condivisa
- [`src/firebase/services/clients.js`](../../src/firebase/services/clients.js) — consumer di `clientsPath`
- [`src/firebase/services/notes.js`](../../src/firebase/services/notes.js) — consumer di `notesPath`
- [`src/firebase/services/groups.js`](../../src/firebase/services/groups.js) — consumer di `groupsPath`
- [`src/firebase/services/org.js`](../../src/firebase/services/org.js) — consumer di `membersPath` (aggiunto ago 2026, vedi "Errori comuni")
- [`firestore.rules`](../../firestore.rules) — le regole rispecchiano esattamente la stessa gerarchia di path
- `CLAUDE.md`, sezione "Struttura Firestore" e "Path helpers" — documentazione ufficiale del modello

## Analisi del codice

### `src/firebase/paths.js` — il file intero

```js
/**
 * Path helpers per le subcollections Firestore.
 * Tutti i dati operativi vivono sotto organizations/{orgId}/.
 */

export const clientsPath       = (orgId) => `organizations/${orgId}/clients`
export const slotsPath         = (orgId) => `organizations/${orgId}/slots`
export const groupsPath        = (orgId) => `organizations/${orgId}/groups`
export const recurrencesPath   = (orgId) => `organizations/${orgId}/recurrences`
export const notificationsPath = (orgId) => `organizations/${orgId}/notifications`
export const notesPath         = (orgId, clientId) => `organizations/${orgId}/clients/${clientId}/notes`
export const groupNotesPath    = (orgId, groupId)  => `organizations/${orgId}/groups/${groupId}/notes`
export const workoutPlansPath  = (orgId) => `organizations/${orgId}/workoutPlans`
```

Ogni funzione è una pura interpolazione di stringa: prende uno o più ID e restituisce il path
completo verso una collezione. Nota due dettagli che sembrano piccoli ma non lo sono:

1. **`orgId` è sempre il primo argomento**, in ogni singola funzione — anche in quelle a due
   argomenti come `notesPath(orgId, clientId)`. Non è un caso stilistico: è la convenzione
   documentata in `CLAUDE.md` ("orgId come primo argomento") che attraversa *tutto* il
   progetto — hook, service, usecase. Se la stai leggendo per la prima volta in questo corso,
   questa è la riga più importante da interiorizzare: ogni volta che vedi una funzione che
   riceve dati di un'org, il primo parametro sarà `orgId`, punto.

2. **Il tipo di ritorno è sempre una stringa "path a collezione"**, mai "path a documento".
   `clientsPath(orgId)` restituisce `organizations/abc/clients` (3 segmenti, dispari) — per
   ottenere il path di *un* cliente specifico serve comunque `doc(db, clientsPath(orgId), clientId)`,
   che aggiunge il quarto segmento. Vedremo esattamente questo pattern nella Lezione 12.

Il file **ora** contiene anche `membersPath`, aggiunto in un secondo momento — non c'era
quando abbiamo scritto questa lezione la prima volta. È rimasto qui come caso di studio
concreto — non ipotetico — di cosa succede quando la convenzione "un path, un helper" non
viene rispettata fino in fondo, e di come si fixa quando lo si nota: lo vedi nella sezione
"Errori comuni".

### `src/firebase/config.js` — inizializzazione dell'app Firebase

```js
import { initializeApp }  from 'firebase/app'
import { getFunctions }   from 'firebase/functions'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const functions = getFunctions(app, 'europe-west1')

export default app
```

- **Righe 5-11**: la configurazione non contiene mai valori hardcoded — arriva da
  `import.meta.env`, il meccanismo di Vite per le variabili d'ambiente (`.env.development`
  vs `.env.production`, come documentato in `CLAUDE.md`). Questo è ciò che permette allo
  stesso identico codice sorgente di parlare con il progetto Firebase `rankex-dev` in
  sviluppo e `fitquest-60a09` in produzione, senza `if` sparsi nel codice.
- **Riga 14**: `initializeApp(firebaseConfig)` crea l'istanza dell'app Firebase — è il punto
  di ingresso di *tutti* i moduli Firebase (Auth, Firestore, Functions). Viene chiamato una
  sola volta qui; ogni altro file che ha bisogno dell'app la importa (`import app from '../config'`,
  come fa `db.js` alla riga 3), non la reinizializza mai.
- **Riga 16**: `getFunctions(app, 'europe-west1')` è degno di nota per il secondo argomento:
  la **regione**. Le Cloud Functions di RankEX sono deployate in `europe-west1` (lo vedremo
  confermato lato server nella Lezione 13, dove ogni funzione callable dichiara
  `onCall({ region: 'europe-west1' }, ...)`). Se questa stringa non corrispondesse esattamente
  alla regione di deploy, ogni chiamata `httpsCallable` fallirebbe con un errore di funzione
  non trovata — è un accoppiamento silenzioso tra client e server che non viene verificato a
  build-time, solo a runtime.

### `src/firebase/services/db.js` — il singleton di Firestore

```js
// Istanza Firestore condivisa — importata dagli altri moduli firebase/
import { getFirestore } from 'firebase/firestore'
import app from '../config'

export const db = getFirestore(app)
```

Tre righe, ma è il file che *ogni* service Firestore del progetto importa (lo vedrai in
`clients.js`, `groups.js`, `notes.js`... nella Lezione 12). `getFirestore(app)` restituisce
di per sé un'istanza già cachata internamente dall'SDK per lo stesso `app` — chiamarla più
volte con lo stesso `app` non crea istanze diverse. Il valore di avere comunque un singolo
punto di export (`db.js`) non è quindi evitare doppie istanze (l'SDK lo farebbe comunque),
ma avere **un solo posto** da cui ogni file importa `db` — se un domani si dovesse aggiungere
`connectFirestoreEmulator(db, 'localhost', 8080)` per lo sviluppo locale, questo è l'unico
file da toccare, invece di rincorrere ogni singolo file che chiama `getFirestore` per conto
proprio.

## Diagramma mentale

```
organizations (collection, root)
 └── {orgId} (document)
       │  name, moduleType, plan, memberCount, clientCount, ownerId, status...
       │
       ├── members/{uid}            (subcollection — membersPath(orgId), vedi sotto)
       │     role, name, email, joinedAt
       │
       ├── clients/{clientId}       (subcollection — clientsPath(orgId))
       │     name, eta, xp, rank, stats{}, campionamenti[], badges{}...
       │     └── notes/{noteId}     (subcollection annidata a 2 livelli — notesPath(orgId, clientId))
       │           text, authorId, parentId, createdAt
       │
       ├── slots/{slotId}           (slotsPath)
       ├── groups/{groupId}         (groupsPath)
       │     └── notes/{noteId}     (groupNotesPath(orgId, groupId))
       ├── recurrences/{recId}      (recurrencesPath)
       ├── notifications/{notId}    (notificationsPath)
       └── workoutPlans/{planId}    (workoutPlansPath)

users (collection, root — FUORI da organizations)
 └── {uid} (document)
       role, orgId, clientId, trainerId, mustChangePassword

audit_logs (collection, root — append-only, cross-org)
 └── {logId} (document)
       action, uid, email, timestamp, details, env
```

Nota come `clients/{clientId}/notes` sia una sottocollezione **a due livelli di annidamento**
sotto `organizations/{orgId}` — il documento genitore diretto di `notes` non è l'organizzazione,
è il cliente. Questo è il motivo per cui `notesPath` ha bisogno di due parametri (`orgId`,
`clientId`) mentre `clientsPath` ne ha bisogno di uno solo.

## Errori comuni

**1. Hardcodare il path invece di usare l'helper — è successo davvero nel codice reale, poi è
stato fixato.** Quando abbiamo scritto questa lezione la prima volta, [`src/firebase/services/org.js`](../../src/firebase/services/org.js)
aveva quattro funzioni (`getMembers`, `getMember`, `removeMember`, `updateMember`) che
scrivevano tutte, in modo indipendente, la stringa letterale `` `organizations/${orgId}/members` ``
invece di usare un `membersPath(orgId)` — perché quell'helper semplicemente non esisteva,
non era mai stato aggiunto quando è stata creata la subcollection `members`. Non era (ancora)
un bug: la stringa era scritta correttamente in tutti e quattro i punti. Ma era esattamente
il tipo di situazione in cui, se un domani qualcuno rinomina `members` in `team_members` (magari
per allinearsi alla terminologia "Team" usata in UI), deve ricordarsi di cambiare quella
stringa in quattro punti diversi di un file, invece di uno in `paths.js`.

**Il fix è stato applicato** (commit `f154ff1`, ago 2026): `membersPath(orgId)` è stato
aggiunto a `paths.js` e i quattro punti in `org.js` sono stati aggiornati per usarlo (oggi
`removeMember` non esiste nemmeno più — vedi Lezione 13, sezione Backend, per un secondo
bug trovato nello stesso file). Il codice che vedi oggi aprendo `org.js` è già la versione
corretta — questa sezione descrive **perché** valeva la pena farlo, non un problema ancora
da risolvere. Lo riprendiamo, in versione "prima/dopo", negli Esercizi.

**2. Pensare che eliminare un documento elimini anche le sue sottocollezioni.**
Questo è un comportamento reale di Firestore che sorprende chi viene da SQL: **eliminare un
documento non elimina le sue sottocollezioni**. Non esiste un "cascade delete" automatico.
Se apri [`functions/src/callable/eliminaCliente.js`](../../functions/src/callable/eliminaCliente.js),
righe 35-56, il batch di eliminazione tocca: il documento cliente (`batch.delete(clientRef)`,
riga 38), il documento `users/{clientAuthUid}` (riga 42), il contatore `clientCount` (riga 47)
e i riferimenti nei gruppi (righe 51-54) — **non** tocca mai `clients/{clientId}/notes`.
Le eventuali note associate a quel cliente restano fisicamente su Firestore, orfane: non più
raggiungibili da nessuna UI (perché nessuna schermata elenca note di un cliente che non esiste
più), ma ancora lì, occupando storage. Su un progetto Spark come RankEX (limite 1 GB, vedi
`CLAUDE.md` sezione "Monitoraggio costi") questo non è oggi un problema pratico vista la scala,
ma è importante saperlo: **la pulizia delle sottocollezioni, se serve, va scritta esplicitamente**
— Firestore non la fa per te.

**3. Invertire l'ordine degli argomenti in un path helper a più parametri.**
`notesPath(orgId, clientId)` e `groupNotesPath(orgId, groupId)` prendono entrambi due stringhe.
Se in un file scrivessi per errore `notesPath(clientId, orgId)`, JavaScript non si lamenta —
sono entrambe stringhe, la firma della funzione non impone nulla sul *contenuto* dei parametri,
solo sulla loro posizione. Il risultato sarebbe un path sintatticamente valido ma semanticamente
sbagliato (`organizations/{clientId}/clients/{orgId}/notes`), che porterebbe a un errore di
permessi lato Firestore Rules (l'org non esisterebbe con quell'ID) o, peggio, a un percorso
che *esiste* per puro caso con dati di un'altra organizzazione.

**4. Trattare Firestore come se supportasse JOIN.**
Non esiste una query che dica "dammi il cliente e in automatico anche le sue note". Ogni
sottocollezione richiede una lettura separata (lo vediamo nella Lezione 12: `getClients` e
`getNotes` sono due funzioni distinte, chiamate da hook distinti). Questo è il prezzo del
modello documentale: query semplici e velocissime per singola collezione, ma nessuna
composizione automatica lato database — la composizione, se serve, la fa il codice
applicativo (o si denormalizzano i dati, duplicandoli, come si fa in molti progetti Firestore
di produzione — RankEX non lo fa per note/client, probabilmente perché il volume è piccolo).

## Best Practice

**Centralizzare i path in un solo file vs. stringhe sparse.** Il costo di `paths.js` è
minimo (13 righe), il beneficio è che un rename di collezione, o un audit di "quali
sottocollezioni esistono sotto `organizations/{orgId}`", si fa leggendo *un* file invece di
grep-are l'intero `src/`. La lezione appresa da `org.js` (vedi sopra) è che questa disciplina
va applicata *sempre*, non solo quando "si ricorda" — la convenzione da sola, senza uno
strumento che la faccia rispettare (lint rule, code review), degrada nel tempo.

**Sottocollezione annidata vs. collezione piatta + filtro.** Per dati strettamente scoped a
un tenant (praticamente tutto in RankEX tranne `users` e `audit_logs`), la sottocollezione
annidata è la scelta corretta: sicurezza strutturale, query naturalmente filtrate, nessun
rischio di dimenticare un `where`. Il costo è che aggregazioni cross-tenant (es. "quanti
clienti totali su tutte le org", una metrica che il super_admin potrebbe voler vedere)
richiedono o una `collectionGroup` query (mai usata nel codice attuale — verificato: zero
occorrenze di `collectionGroup` in `src/`) oppure, più probabilmente nel caso di RankEX,
contatori denormalizzati a livello di documento organizzazione (`memberCount`, `clientCount`)
— che infatti è esattamente il meccanismo che il progetto usa per le dashboard di
`SuperAdminView`, invece di contare dal vivo.

**`orgId` sempre primo parametro.** Non è solo un'abitudine di stile: è ciò che rende
prevedibile la firma di *ogni* funzione del layer dati, dal path helper più semplice fino
agli usecase della Lezione 13. Uno sviluppatore che impara questa unica regola può leggere
la firma di una funzione mai vista prima e sapere già cosa aspettarsi dal primo argomento.

## Quiz

1. Cosa restituisce `clientsPath('org_42')`?
   A) `clients/org_42`
   B) `organizations/org_42/clients`
   C) `organizations/clients/org_42`
   D) Un errore, perché manca il `clientId`

2. Perché i dati dei clienti non sono in una collezione root `clients` con un campo `orgId`?
   A) Firestore non permette campi chiamati `orgId`
   B) Le query cross-tenant sarebbero più veloci così
   C) L'isolamento tra organizzazioni sarebbe garantito solo da un `where` che si può dimenticare, invece che dalla struttura del path
   D) Non c'è alcuna differenza pratica tra le due opzioni

3. Cosa succede se in un nuovo file scrivi `collection(db, 'organizations/' + orgId + '/client')` (senza la "s" finale) invece di usare `clientsPath(orgId)`?
   A) Firestore lancia un errore "collection not found" a runtime
   B) Vite fallisce la build perché rileva il path errato
   C) Il codice viene eseguito senza errori, ma legge/scrive su una collezione diversa e vuota
   D) L'SDK corregge automaticamente il typo confrontandolo con le collezioni esistenti

4. Nella firma `notesPath(orgId, clientId)`, quale argomento va sempre per primo secondo la convenzione di RankEX?
   A) Dipende dal file chiamante
   B) `clientId`, perché è il dato più specifico
   C) `orgId`, sempre, in ogni funzione del progetto che riceve dati di un'organizzazione
   D) In ordine alfabetico

5. Cosa fa `getFirestore(app)` in `db.js`?
   A) Crea una nuova connessione al database ogni volta che viene chiamato
   B) Restituisce l'istanza Firestore associata a quell'app (cachata internamente dall'SDK)
   C) Inizializza le Firestore Security Rules
   D) Configura l'emulatore locale di Firestore

6. Perché `getFunctions(app, 'europe-west1')` specifica esplicitamente una regione?
   A) È un parametro obbligatorio senza alcun default
   B) Deve corrispondere alla regione in cui sono effettivamente deployate le Cloud Functions, altrimenti le chiamate falliscono
   C) Determina in quale lingua vengono restituiti i messaggi di errore
   D) Serve solo per la fatturazione, non ha effetto sulle chiamate

7. Cosa succede alle sottocollezioni di un documento quando quel documento viene eliminato con `batch.delete(...)`?
   A) Vengono eliminate automaticamente insieme al documento
   B) Restano su Firestore, ora orfane e irraggiungibili dalla UI ma ancora presenti come dati
   C) Firestore le sposta automaticamente sotto un altro documento
   D) L'operazione di delete fallisce se esistono sottocollezioni

8. Oggi, in `firebase/services/org.js`, i path verso `organizations/{orgId}/members` sono:
   A) Generati da un helper `membersPath(orgId)` in `paths.js`
   B) Scritti come stringhe hardcoded in almeno quattro punti diversi del file
   C) Recuperati da una variabile d'ambiente
   D) Calcolati dinamicamente a partire da `clientsPath`

9. Perché in Firestore non esiste un equivalente diretto della `JOIN` SQL?
   A) È una limitazione temporanea che Google rimuoverà in una prossima versione
   B) Il modello a documenti non ha relazioni tra collezioni gestite dal database stesso — ogni collezione/sottocollezione va letta separatamente dal codice applicativo
   C) Le JOIN esistono ma richiedono un piano Firebase a pagamento
   D) Le sottocollezioni sostituiscono completamente il bisogno di JOIN in ogni caso d'uso

10. Cosa cambierebbe, concettualmente, se RankEX usasse `collectionGroup('clients')` invece delle letture attuali?
    A) Nulla, sono equivalenti
    B) Restituirebbe i clienti di **tutte** le organizzazioni in un'unica query, quindi servirebbe un filtro/regola aggiuntiva per non mescolare i tenant
    C) È una funzionalità che richiede un indice composito e non esiste nell'SDK
    D) Funziona solo su collezioni root, non su sottocollezioni

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B** — `organizations/org_42/clients`. È un'interpolazione di stringa diretta (riga 6 di `paths.js`); non tocca `clientId` perché restituisce il path della *collezione*, non di un documento specifico. A è sbagliata perché omette `organizations/`; C ha l'ordine dei segmenti invertito; D è sbagliata perché la funzione prende un solo argomento per design — non serve `clientId` per il path della collezione.

2. **C** — è la differenza discussa nella sezione "Perché sotto organizations/{orgId}". A è falsa (Firestore non ha restrizioni sui nomi di campo di questo tipo). B è invertita: in realtà le query sulla sottocollezione annidata sono scoped "gratis", quelle su collezione piatta richiedono un filtro aggiuntivo. D ignora la differenza di sicurezza strutturale spiegata nella lezione.

3. **C** — Firestore è schemaless: una stringa di path sintatticamente valida ma "sbagliata" (typo) non genera errori, semplicemente punta altrove. A è falsa: non esiste il concetto di "collection not found" per una lettura, restituisce solo un risultato vuoto. B è falsa: Vite non ha modo di sapere se una stringa JS corrisponde a un path Firestore reale, non è un errore di tipo. D è falsa: nessun meccanismo di autocorrezione esiste nell'SDK.

4. **C** — `orgId` è sempre il primo parametro in ogni funzione del progetto che tocca dati di un'organizzazione, path helper inclusi. È una convenzione esplicita, non casuale (vedi `CLAUDE.md`).

5. **B** — `getFirestore(app)` restituisce (o crea la prima volta, poi cachata) l'istanza Firestore per quell'app. A è falsa: chiamate ripetute con lo stesso `app` non creano nuove connessioni. C e D descrivono compiti che non appartengono a questa funzione (le rules si configurano/deployano separatamente; l'emulatore richiederebbe una chiamata esplicita a `connectFirestoreEmulator`, non presente in questo file).

6. **B** — la regione del client SDK deve combaciare con la regione di deploy delle Cloud Functions (lo confermiamo lato server nella Lezione 13). A è falsa: il secondo argomento è opzionale nell'API di `getFunctions`, ma se omesso userebbe una regione di default diversa da `europe-west1`. C e D non hanno relazione con l'effetto reale del parametro.

7. **B** — è il comportamento reale osservato in `eliminaCliente.js`: il batch elimina il documento cliente ma non la sottocollezione `notes`. A è il comportamento che ci si aspetterebbe venendo da SQL, ma non è come funziona Firestore. C e D non corrispondono a nessun comportamento reale dell'SDK.

8. **A** — verificato leggendo `org.js` oggi: `getMembers`, `getMember` e `updateMember` (`removeMember` non esiste più, vedi Lezione 13) usano tutte `membersPath(orgId)` importato da `paths.js`. **Non era così** quando questa lezione è stata scritta la prima volta — allora la risposta corretta era B (stringhe hardcoded in quattro punti). Se hai risposto B perché lo ricordavi da una lettura precedente del corso, non hai sbagliato: hai risposto con lo stato di ago 2026 invece che con quello attuale. È lo stesso principio della sezione "Errori comuni": il codice cambia, la documentazione (e i corsi) devono inseguirlo.

9. **B** — è il punto centrale della sezione "Trattare Firestore come se supportasse JOIN". A, C, D sono affermazioni non corrispondenti a come funziona effettivamente Firestore.

10. **B** — una `collectionGroup` query interroga *tutte* le sottocollezioni con quel nome, indipendentemente dal documento padre — quindi tutti gli `organizations/*/clients`, di ogni org, in un colpo solo. Andrebbe combinata con regole di sicurezza specifiche per `collectionGroup` (diverse da quelle su singola collezione) per non violare l'isolamento multi-tenant. RankEX oggi non la usa da nessuna parte (verificato).

## Esercizi

1. **(Facile)** Apri `src/firebase/paths.js` e scrivi, senza eseguire codice, il valore
   restituito da `groupNotesPath('vdp5', 'grp_junior')`.

2. **(Facile)** Usa la ricerca testuale del tuo editor per trovare *tutti* i file in `src/`
   che importano `clientsPath` da `../paths` (o path relativo equivalente). Quanti sono?
   Elenca i file trovati.

3. **(Medio)** Apri `git log -p -- src/firebase/paths.js src/firebase/services/org.js` (o
   `git show f154ff1` se preferisci vedere solo quel commit) e trova il commit che ha
   introdotto `membersPath`. Rispondi: quante righe sono cambiate in `org.js` per adottare
   l'helper? Il comportamento a runtime è cambiato in qualche modo, o è un refactor puro
   (stesso input → stesso path stringa restituito, prima e dopo)? Come verificheresti la tua
   risposta senza fidarti solo della lettura del diff?

4. **(Medio)** Rileggi `functions/src/callable/eliminaCliente.js`, righe 28-56 (dalla lettura
   dei gruppi fino al `batch.commit()`). Elenca, uno per
   uno, tutti i documenti/campi toccati dal batch di eliminazione. Poi rispondi: se un cliente
   eliminato aveva 3 note nella sua subcollection `notes`, dove si trovano quelle 3 note
   *dopo* l'eliminazione? Sono ancora leggibili da qualche punto della UI?

5. **(Difficile)** RankEX oggi non usa `collectionGroup`. Immagina che il super_admin voglia
   una vista "tutte le note scritte in tutte le organizzazioni nell'ultima settimana" (per un
   controllo di qualità sul contenuto). Progetta ad alto livello: che tipo di query useresti
   (`collectionGroup('notes')`), quale campo aggiuntivo servirebbe nei documenti nota per
   filtrare per data lato query, e che tipo di regola di sicurezza (`match /{path=**}/notes/{noteId}`)
   dovresti scrivere per permettere solo al super_admin questa lettura cross-tenant. Non serve
   scrivere codice funzionante: è un esercizio di progettazione.

## Challenge

Il micro-refactor `membersPath` (descritto sopra) è già stato fatto — non ha più senso
riproporlo come compito. Ma lo stesso problema esiste ancora, non risolto, **dall'altra parte
del confine client/server**: apri qualsiasi file in [`functions/src/callable/`](../../functions/src/callable)
(es. `creaCliente.js`, `eliminaCliente.js`, `salvaXP.js`) e nota che ogni singola callable
scrive i propri path Firestore come template string inline —
`` db.doc(`organizations/${orgId}`) ``, `` db.collection(`organizations/${orgId}/clients`) ``,
`` db.doc(`users/${uid}`) `` — ripetuti indipendentemente in **31 file diversi**, senza alcun
equivalente di `paths.js` lato server.

`functions/src/shared/` ha già copie speculari minimali di `plans.config.js`, `constants.js`,
`gamification.js` e `tests.js` (vedi Lezione 13) — ma non di `paths.js`. Il tuo compito:

1. Apri almeno 5 file in `functions/src/callable/` e fai l'inventario di ogni stringa di path
   Firestore che trovi (con quali segmenti variabili — `orgId`, `clientId`, `uid`...). Quanti
   pattern distinti trovi? Coincidono con quelli già presenti in `src/firebase/paths.js`?
2. Progetta (e se vuoi implementa davvero, seguendo lo stile di `shared/constants.js` —
   "speculare a src/..., commento in testa") un `functions/src/shared/paths.js` con gli stessi
   pattern, e riscrivi almeno 2 callable per usarlo.
3. Rispondi per iscritto, prima di eventualmente implementare: vale davvero la pena? `paths.js`
   lato client è read-heavy (decine di consumer, un solo file da mantenere); lato server ogni
   callable tocca in media 2-3 path diversi. Il beneficio di centralizzazione è lo stesso, o è
   minore perché la duplicazione è più diluita? Motiva la tua risposta invece di applicare la
   regola "centralizzare è sempre meglio" senza verificarla sul caso concreto.

Non c'è una risposta "giusta" attesa al punto 3 — è lo stesso tipo di giudizio ingegneristico
che ha prodotto `membersPath` lato client (beneficio reale, costo minimo) ma che potrebbe non
valere identico lato server, dove l'architettura è deliberatamente fatta di copie minimali e
indipendenti proprio per non introdurre un accoppiamento tra `functions/` e `src/`.
