# Lezione 12 — Letture dirette Firestore
[← Indice](00-indice.md)

## Obiettivo della lezione

Imparare a leggere il codice che parla direttamente con Firestore per le operazioni di
**lettura**: le funzioni `collection()`, `query()`, `getDocs()`, `doc()`, `getDoc()` e
`updateDoc()` dell'SDK client. Capire il pattern che ricorre identico in ogni file di
`firebase/services/`, e — soprattutto — cogliere il segnale che la Lezione 13 spiegherà fino
in fondo: perché alcune scritture (come `updateClient`) restano dirette dal client, mentre
altre (creare o eliminare un cliente) no.

## Concetti teorici

### Le funzioni dell'SDK Firestore usate in questi file

`firebase/services/clients.js` e `firebase/services/groups.js` usano solo cinque funzioni
dell'SDK, tutte da `firebase/firestore`. Vale la pena isolarle una per una, perché ricorrono
identiche in *tutti* gli altri service del progetto (`notes.js`, `org.js`, ecc.):

- **`collection(db, path)`** — crea un riferimento a una collezione (non i dati, solo il
  "puntatore"). Da solo non fa nessuna chiamata di rete.
- **`query(collectionRef, ...clausole)`** — avvolge un riferimento a collezione con clausole
  opzionali (`where`, `orderBy`, `limit`...). In `clients.js` non c'è nessuna clausola —
  `query(collection(db, clientsPath(orgId)))` è, di fatto, "tutti i documenti di questa
  collezione, senza filtri" — ma il progetto lo scrive comunque passando dalla `query()`
  invece di passare `collection(...)` direttamente a `getDocs`. Le due forme sono equivalenti
  quando non ci sono clausole; usare sempre `query()` è probabilmente una scelta di uniformità
  con gli altri file dello stesso progetto che *hanno* clausole (es. `notes.js`, che vedremo,
  usa `orderBy('createdAt', 'asc')`).
- **`getDocs(query)`** — qui avviene la vera chiamata di rete: scarica *tutti* i documenti che
  soddisfano la query, in un colpo solo, e restituisce una `Promise<QuerySnapshot>`.
- **`doc(db, collectionPath, docId)`** — crea un riferimento a un **singolo documento**
  (non a una collezione). Nota la differenza di arità rispetto a `collection`: qui il path
  della collezione e l'ID del documento sono argomenti separati.
- **`getDoc(docRef)`** — la versione "singolare" di `getDocs`: scarica un solo documento,
  restituisce una `Promise<DocumentSnapshot>`.
- **`updateDoc(docRef, data)`** — scrive un aggiornamento *parziale* su un documento
  **esistente**. "Parziale" è la parola chiave: `updateDoc(ref, { peso: 80 })` modifica solo
  il campo `peso`, lascia intatti tutti gli altri campi del documento. Se il documento non
  esiste ancora, `updateDoc` fallisce (lancia un errore) — per crearne uno servirebbe `setDoc`,
  che qui non viene mai usato in `clients.js`.

> 📎 **Approfondimento: `getDocs`/`getDoc` (lettura one-shot) vs `onSnapshot` (lettura realtime)**
>
> Le funzioni viste in questa lezione (`getDocs`, `getDoc`) fanno una **fotografia**: interrogano
> Firestore una volta, ricevono i dati in quel preciso istante, e la `Promise` si risolve. Se
> dopo un secondo un altro utente modifica quello stesso documento su Firestore, il componente
> React che ha chiamato `getClients` **non lo sa** — mostrerà dati vecchi finché qualcosa non
> richiama di nuovo la funzione di fetch (in RankEX, tipicamente un altro giro di
> `fetchClients()` dentro `useClients.js`, o un remount del componente).
>
> Esiste un'alternativa, `onSnapshot`, che invece di restituire una `Promise` registra un
> **listener**: la funzione di callback viene richiamata ogni volta che i dati cambiano su
> Firestore, in tempo reale, senza dover richiedere nulla esplicitamente. RankEX la usa in
> punti specifici del progetto (calendario, notifiche — dove il tempo reale ha senso di
> business), ma **non** in `clients.js`/`groups.js`: qui basta una fotografia, ricaricata
> quando serve. Il perché di questa scelta selettiva — e come funziona `onSnapshot` nel
> dettaglio — è il contenuto della Lezione 15.

### Il pattern `{ id: d.id, ...d.data() }`

Un `DocumentSnapshot` in Firestore separa **l'identificatore del documento** dai **suoi campi**:
`d.id` è l'ID del documento (una stringa, es. `"a1B2c3"`), mentre `d.data()` è un metodo che
restituisce un oggetto JS con *solo* i campi salvati (`{ name: 'Mario', xp: 340, ... }`) —
**senza** l'id incluso. Questo è per design: l'id di un documento non è "un campo come gli
altri", è un metadato del suo *riferimento* nella struttura ad albero di Firestore, non un
valore che hai scritto tu con `setDoc`/`updateDoc`.

Il pattern che vedrai ovunque nel codice — `snap.docs.map(d => ({ id: d.id, ...d.data() }))` —
serve esattamente a ricomporli in un unico oggetto JS piatto, comodo per lo state React (dove
di solito vuoi che ogni elemento di un array abbia il suo `id` accessibile come proprietà
normale, per esempio per usarlo in una `key` di React o per richiamare `updateClient(orgId, client.id, ...)`).

## Dove compare nel progetto

- [`src/firebase/services/clients.js`](../../src/firebase/services/clients.js) — `getClients`, `getClientById`, `updateClient`
- [`src/firebase/services/groups.js`](../../src/firebase/services/groups.js) — `getGroups`
- [`src/firebase/services/notes.js`](../../src/firebase/services/notes.js) — stesso pattern, con `orderBy`
- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — consumer di `getClients`, righe 25-35
- Tutti gli altri file in `src/firebase/services/` seguono lo stesso pattern per le letture

## Analisi del codice

### `src/firebase/services/clients.js` — il file intero

```js
import {
  collection, getDocs, getDoc, updateDoc,
  doc, query,
} from 'firebase/firestore'
import { db }          from './db'
import { clientsPath } from '../paths'

export const getClients    = async (orgId) => {
  const q    = query(collection(db, clientsPath(orgId)))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientById = async (orgId, clientId) => {
  const snap = await getDoc(doc(db, clientsPath(orgId), clientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// updateClient rimane — usato per aggiornamenti diretti a basso rischio (peso/altezza
// in useMisure.js, avatarId in AvatarPicker.jsx). BIA e campionamenti passano invece da
// Cloud Functions callable (saveBiaUseCase → salvaBia, ecc.) — vedi usecases/.
export const updateClient = (orgId, id, data) => updateDoc(doc(db, clientsPath(orgId), id), data)
```

**`getClients` (righe 8-12).** `collection(db, clientsPath(orgId))` costruisce il riferimento
alla collezione (`organizations/{orgId}/clients`, dalla Lezione 11); `query(...)` la avvolge
senza clausole; `await getDocs(q)` scarica tutti i documenti in un'unica risposta HTTP;
`snap.docs` è un array di `QueryDocumentSnapshot`, e il `.map` finale li trasforma in oggetti
piatti con `id`. Nota che la funzione è `async` e ritorna implicitamente una `Promise` — chi
la chiama deve fare `await getClients(orgId)` o gestirla come `Promise` (`useClients.js` la
consuma con `.then/.catch/.finally`, non `await`, come vedremo nel diagramma).

**`getClientById` (righe 14-17).** Stesso concetto ma su un singolo documento: `doc(db, clientsPath(orgId), clientId)`
costruisce il riferimento al documento specifico (nota: qui `clientsPath(orgId)` viene passato
come *secondo* argomento di `doc()`, non interpolato in una stringa — è la stessa firma vista
per `collection()` ma con l'ID del documento come terzo parametro). `snap.exists()` è un
metodo booleano che va controllato **prima** di chiamare `.data()`: se il documento non
esiste, `.data()` restituirebbe `undefined` e propagarlo silenziosamente nello spread
(`{ id: ..., ...undefined }`) produrrebbe un oggetto con solo `id` e nient'altro — un bug
subdolo. Il ternario a riga 16 lo previene esplicitamente restituendo `null`.

**`updateClient` (righe 19-22) — il gancio verso la Lezione 13.** Il commento che vedi oggi
sopra `updateClient` è già la versione **aggiornata** — dettaglia esplicitamente i due soli
punti che lo chiamano (`useMisure.js` per peso/altezza, `AvatarPicker.jsx` per l'avatar) e
dice esplicitamente che BIA passa da Cloud Function. Non è sempre stato così: quando abbiamo
scritto questa lezione la prima volta, il commento era una singola riga — *"updateClient
rimane — usato per aggiornamenti diretti (BIA, peso/altezza, ecc.)"* — e la parola "BIA" era
già sbagliata allora (la BIA era già stata migrata a `saveBiaUseCase` → `salvaBia`, il
commento non l'aveva mai registrato). Lo stesso valeva per `CLAUDE.md`, sezione "File
critici", che a quel tempo citava ancora *"firebase/services/clients.js → addClient/deleteClient
usano batch + counter"* — funzioni che in questo file, già allora, non esistevano più (erano
migrate alle Cloud Functions). **Entrambi sono stati corretti** nello stesso giro di
manutenzione che ha introdotto anche i fix delle Lezioni 11, 13, 14 e 16 — puoi vederlo con
`git log --oneline -- src/firebase/services/clients.js CLAUDE.md`.

Il punto pedagogico non cambia: se cerchi in questo file una funzione `addClient` o
`deleteClient`, non la trovi, non sono mai esistite in questa forma di recente — sono state
migrate alle Cloud Functions (creazione ed eliminazione cliente toccano contatori piano e
l'account Firebase Auth, motivo per cui non restano dirette). Perché proprio quelle due
operazioni e non `updateClient` è la domanda a cui risponde per intero la Lezione 13. Prova a
farti un'ipotesi prima di proseguire: quali campi tocca `updateClient` oggi, in pratica, nel
resto del codebase? Sono campi "di proprietà" innocui del cliente, o campi che incidono su
contatori/limiti dell'intera organizzazione?

### `src/firebase/services/groups.js` — il file intero

```js
import {
  collection, getDocs,
  query,
} from 'firebase/firestore'
import { db }         from './db'
import { groupsPath } from '../paths'

// Struttura gruppo: { id, name, clientIds: [] }

export const getGroups = async (orgId) => {
  const q    = query(collection(db, groupsPath(orgId)))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
```

Identico pattern di `getClients`, applicato a `groups`. Ma nota cosa **manca** rispetto a
`clients.js`: qui non c'è nessuna funzione di scrittura, nemmeno un `updateGroup` diretto.
Cercando nel progetto le operazioni di scrittura sui gruppi, si trovano in
`src/usecases/addGroupUseCase.js`, `updateGroupUseCase.js` e `deleteGroupUseCase.js` — tutte
e tre basate su Cloud Functions callable (lo stesso pattern della Lezione 13), senza **nessuna**
eccezione diretta residua. `groups.js` è quindi il caso "più migrato" dei due: `clients.js` ha
tenuto un varco diretto (`updateClient`), `groups.js` no. Questo non è un'incoerenza — è un
segnale che la migrazione da scritture dirette a Cloud Functions (menzionata nella memoria di
progetto come completata a fine luglio 2026) non ha necessariamente lasciato lo stesso "residuo"
di scritture dirette in ogni entità: dipende da quali campi di quell'entità sono considerati
sensibili abbastanza da giustificare il passaggio dal server.

## Diagramma mentale

```
ClientsPage.jsx  (componente, si monta)
   │
   ▼
useClients(orgId)                              [hooks/useClients.js]
   │  useEffect(() => { fetchClients() }, [fetchClients])   ← solo al mount / quando orgId cambia
   ▼
getClients(orgId)                              [firebase/services/clients.js]
   │
   │  collection(db, clientsPath(orgId))   → riferimento, nessuna rete
   │  query(collectionRef)                 → wrapper, nessuna rete
   │  await getDocs(q)                     → 1 round-trip HTTP a Firestore
   ▼
QuerySnapshot { docs: [DocumentSnapshot, DocumentSnapshot, ...] }
   │
   │  .docs.map(d => ({ id: d.id, ...d.data() }))
   ▼
Array di oggetti JS piatti: [{ id:'c1', name:'Mario', xp:340, ... }, ...]
   │
   ▼
setClients(data)   → React re-render con i dati
```

Il punto chiave da fissare: **tra il momento in cui `getDocs` risolve e il prossimo `fetchClients()`
manuale, i dati in `clients` (lo state React) sono una fotografia ferma** — non un flusso live.
Se un altro trainer, da un altro browser, modifica lo stesso cliente nel frattempo, questa
istanza dell'app non lo saprà finché non richiama `getClients` di nuovo.

## Errori comuni

**1. Dimenticare `d.id` nel `.map`.** Scrivere `snap.docs.map(d => d.data())` invece di
`snap.docs.map(d => ({ id: d.id, ...d.data() }))` produce oggetti a cui manca l'identificatore
del documento. Il sintomo arriva più tardi, non nel punto dell'errore: quando provi a chiamare
`updateClient(orgId, client.id, ...)` da qualche altra parte del codice, `client.id` sarà
`undefined`, e la scrittura fallirà (o peggio, silenziosamente scriverà su un path malformato).

**2. Confondere `getDoc` (singolare) e `getDocs` (plurale).** Sono due funzioni diverse con
firme diverse: `getDoc` prende un `DocumentReference` (da `doc(...)`), `getDocs` prende una
`Query` o `CollectionReference` (da `collection(...)` o `query(...)`). Passare l'argomento
sbagliato al posto sbagliato è un errore di tipo che TypeScript avrebbe intercettato a
compile-time — questo progetto è in JavaScript puro, quindi l'errore emerge solo a runtime
(un `TypeError` su un metodo che l'oggetto sbagliato non ha).

**3. Chiamare `updateDoc` su un documento che potrebbe non esistere ancora.** `updateClient`
(riga 20 di `clients.js`) assume implicitamente che il cliente esista già — è sempre chiamato
*dopo* che il cliente è stato creato (via Cloud Function, Lezione 13). Se venisse chiamato su
un `clientId` inesistente, Firestore risponderebbe con un errore ("No document to update").
Per creare-o-aggiornare esisterebbe `setDoc(ref, data, { merge: true })`, ma non è la funzione
usata qui — la scelta di `updateDoc` è coerente con l'uso previsto (aggiornamenti su entità
già esistenti, mai creazione).

**4. Dimenticare `await`.** `getClients` e `getClientById` sono `async`: omettere `await`
davanti alla chiamata (o non gestire la `Promise` restituita) significa proseguire con
un oggetto `Promise` invece dei dati veri — un errore molto comune per chi non ha ancora
interiorizzato che *ogni* funzione `async` restituisce sempre una `Promise`, indipendentemente
da cosa fa al suo interno.

**5. Trattare `getDocs` come se fosse "live".** Coperto nell'Approfondimento sopra, ma vale la
pena ripeterlo come errore concreto: se ti aspetti che l'array `clients` in `useClients.js` si
aggiorni automaticamente quando un altro utente modifica Firestore, resterai deluso — non è
questo il comportamento di `getDocs`. Per quello serve `onSnapshot` (Lezione 15), usato in
RankEX solo dove il tempo reale è davvero necessario (calendario, notifiche).

## Best Practice

**Pattern uniforme `{ id: d.id, ...d.data() }` in ogni service.** Vederlo ripetuto
identico in `clients.js`, `groups.js`, `notes.js` (e in tutti gli altri service non trattati
in questa lezione) non è ripetizione sciatta: è coerenza deliberata. Uno sviluppatore che
impara questo pattern una volta lo riconosce istantaneamente in ogni altro file del progetto,
senza dover rileggere la logica da zero ogni volta — è "codice noioso" nel senso buono del
termine.

**Un solo `updateClient` generico invece di tante funzioni specifiche (`updateClientBia`,
`updateClientMisure`, ecc.).** `updateClient(orgId, id, data)` accetta un oggetto `data`
qualsiasi e lo passa a `updateDoc` così com'è — è il chiamante (`useMisure.js`, `AvatarPicker.jsx`,
come vedremo nella Lezione 13) a decidere quali campi passare. Il vantaggio è meno codice
duplicato nel service; lo svantaggio è che `clients.js` da solo non impone *quali* campi sia
lecito aggiornare per questa via — quel controllo, per i client che aggiornano il proprio
stesso documento, è delegato interamente alle Firestore Security Rules (lo vedremo nella
Lezione 16: la regola per `isOwnClient` limita esplicitamente i campi scrivibili da un
cliente sul proprio documento a un elenco chiuso).

**Coerenza tra `clients.js` (un varco diretto rimasto) e `groups.js` (zero varchi diretti).**
Non è un'incoerenza da correggere: è il riflesso naturale di quali campi di ciascuna entità
sono stati giudicati "abbastanza sensibili" da spostare dietro una Cloud Function. Vedremo
nella Lezione 13 gli argomenti concreti dietro questa scelta.

## Quiz

1. Cosa fa `query(collection(db, clientsPath(orgId)))` senza nessuna clausola aggiuntiva?
   A) Lancia un errore, perché `query` richiede sempre almeno una clausola
   B) È equivalente a passare direttamente `collection(...)` a `getDocs`: nessun filtro, tutti i documenti
   C) Ordina automaticamente i risultati per data di creazione
   D) Limita il risultato a 10 documenti di default

2. Qual è la differenza principale tra `getDoc` e `getDocs`?
   A) Nessuna, sono alias della stessa funzione
   B) `getDoc` prende un riferimento a un singolo documento, `getDocs` prende una collezione/query e restituisce più documenti
   C) `getDoc` è sincrona, `getDocs` è asincrona
   D) `getDoc` funziona solo in sviluppo, `getDocs` solo in produzione

3. Perché `d.data()` non include mai l'`id` del documento?
   A) È un bug noto dell'SDK Firebase
   B) L'id è un metadato del riferimento del documento, non un campo che hai salvato tu con `setDoc`/`updateDoc`
   C) Bisogna abilitare un'opzione per includerlo
   D) L'id viene incluso solo se il documento ha meno di 10 campi

4. In `getClientById`, cosa restituisce la funzione se il documento non esiste?
   A) Un oggetto vuoto `{}`
   B) `undefined`
   C) `null`, per un controllo esplicito con `snap.exists()`
   D) Lancia un'eccezione

5. Cosa succede se chiami `updateDoc` su un documento che non esiste ancora in quella collezione?
   A) Firestore lo crea automaticamente, comportandosi come `setDoc`
   B) L'operazione fallisce con un errore ("No document to update")
   C) L'operazione viene silenziosamente ignorata senza errori
   D) Firestore crea il documento con solo i campi passati, ignorando gli altri

6. Cosa significa concretamente che `getDocs` è una lettura "one-shot"?
   A) Puoi chiamarla una sola volta nell'intero ciclo di vita dell'app
   B) Restituisce una fotografia dei dati al momento della chiamata; se i dati cambiano dopo su Firestore, il risultato già ricevuto non si aggiorna da solo
   C) Funziona solo la prima volta che il componente si monta
   D) È limitata a un solo documento per chiamata

7. Cosa manca in `groups.js` rispetto a `clients.js`?
   A) `groups.js` non ha nessuna funzione di lettura
   B) `groups.js` non ha nessuna funzione di scrittura diretta residua — nemmeno un `updateGroup`, a differenza di `updateClient` in `clients.js`
   C) `groups.js` non importa `db`
   D) `groups.js` usa `onSnapshot` invece di `getDocs`

8. Il commento nella riga 19 di `clients.js` ("updateClient rimane...") suggerisce che:
   A) `updateClient` è una funzione nuova, appena aggiunta
   B) Altre funzioni di scrittura che stavano in questo file sono state rimosse/spostate altrove
   C) `updateClient` verrà rimossa in una prossima versione
   D) Il commento non ha alcun significato architetturale, è solo una nota stilistica

9. Fino ad ago 2026, la sezione "File critici" di `CLAUDE.md` citava ancora `addClient`/`deleteClient` in `clients.js` (poi corretta). Perché era comunque un esempio interessante da notare in questa lezione, a prescindere dal fatto che sia stato poi fixato?
   A) Perché dimostra che `CLAUDE.md` ha sempre ragione e il codice va allineato ad esso
   B) Perché era un caso verificabile di documentazione che descriveva uno stato precedente dell'architettura rispetto al codice — un motivo in più per fidarsi sempre del codice prima della documentazione, anche quando (come oggi) la documentazione è già stata corretta
   C) Perché significava che `addClient`/`deleteClient` esistevano ancora ma erano nascoste
   D) Perché era un errore di battitura senza importanza

10. Cosa succederebbe, in pratica, se dimenticassi `.map(d => ({ id: d.id, ...d.data() }))` e usassi solo `.map(d => d.data())` in `getClients`?
    A) Nessuna differenza visibile
    B) I client nello state React non avrebbero un `id` accessibile come proprietà, causando problemi più avanti (es. `updateClient(orgId, client.id, ...)` con `id` `undefined`)
    C) Firestore rifiuterebbe la query
    D) I dati verrebbero comunque salvati correttamente, solo la UI non li mostrerebbe

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B** — senza clausole, `query()` è un wrapper "no-op": il risultato è identico a passare
   direttamente il `CollectionReference` a `getDocs`. A, C, D descrivono comportamenti che
   richiederebbero clausole esplicite (`where`, `orderBy`, `limit`) che qui non ci sono.

2. **B** — è la differenza di arità/scopo discussa nella lezione. C è falsa: entrambe sono
   funzioni asincrone che restituiscono `Promise`. A e D sono affermazioni inventate senza
   base nel comportamento reale dell'SDK.

3. **B** — è la spiegazione data nella sezione "Il pattern `{ id: d.id, ...d.data() }`":
   l'id è un metadato del riferimento (path + ultimo segmento), non un campo del documento.
   A, C, D descrivono meccanismi che non esistono nell'SDK Firestore.

4. **C** — riga 16: `return snap.exists() ? { id: snap.id, ...snap.data() } : null`. La
   funzione controlla esplicitamente `exists()` prima di accedere a `.data()`, evitando lo
   scenario B (che sarebbe il comportamento "silenzioso e pericoloso" se non ci fosse il
   controllo). A e D non corrispondono al codice reale.

5. **B** — `updateDoc` richiede che il documento esista già; a differenza di `setDoc` con
   `{ merge: true }`, non lo crea. A descrive il comportamento di un'altra funzione
   (`setDoc` con merge), non di `updateDoc`. C e D sono comportamenti inventati.

6. **B** — è la definizione di lettura "one-shot" data nell'Approfondimento. A, C, D sono
   fraintendimenti comuni ma non corrispondono al comportamento reale: puoi chiamare
   `getDocs` tutte le volte che vuoi, non solo al primo mount, e non è limitata a un documento.

7. **B** — verificato leggendo entrambi i file per intero: `groups.js` contiene solo
   `getGroups`, nessuna funzione di scrittura; `clients.js` contiene invece `updateClient`
   come unico varco diretto rimasto. A è falsa (`getGroups` esiste). C è falsa (`db` viene
   importato). D è falsa (nessuno dei due file usa `onSnapshot`).

8. **B** — la parola "rimane" implica esplicitamente che qualcos'altro non c'è più. È
   esattamente il gancio verso la Lezione 13. A, C, D non sono supportate dal testo del
   commento né dal resto del file.

9. **B** — è il punto pedagogico centrale di questa nota: la documentazione può restare
   indietro rispetto a un refactor reale (qui, la migrazione di scritture verso Cloud
   Functions), e la fonte di verità ultima resta sempre il codice sorgente attuale, non un
   documento scritto in un momento precedente dell'evoluzione del progetto — **anche dopo**
   che quella specifica riga di `CLAUDE.md` è stata corretta, come in questo caso: il valore
   dell'esempio non era "questa riga è sbagliata", era "verifica sempre sul codice, non
   fidarti di un documento a prescindere da quanto sembri autorevole", ed è vero prima,
   durante e dopo il fix. A è l'atteggiamento opposto a quello corretto. C e D sono letture
   errate della situazione.

10. **B** — è l'errore comune n.1 descritto nella lezione: perdere `id` rende l'oggetto
    inutilizzabile per qualunque operazione successiva che abbia bisogno di riferirsi a quel
    documento specifico (update, delete, navigazione a un dettaglio). A, C, D sottostimano
    l'impatto reale di questo errore.

## Esercizi

1. **(Facile)** Leggendo il codice di `getClientById`, scrivi a parole cosa restituisce la
   funzione nei due casi: documento esistente vs documento non esistente. Nessun codice da
   scrivere, solo la spiegazione a parole.

2. **(Facile)** Con una ricerca testuale nel progetto, verifica se esiste una funzione
   `getGroupById(orgId, groupId)` in `groups.js` o altrove in `firebase/services/`. Se non
   esiste, quale funzione dovrebbe seguire esattamente lo stesso pattern di `getClientById`
   per fornire questa capacità?

3. **(Medio)** Apri `src/hooks/useClients.js` e individua l'`useEffect` che richiama
   `fetchClients()`. In quali momenti esatti del ciclo di vita del componente viene
   rieseguito? (Suggerimento: guarda l'array delle dipendenze di `fetchClients`, definita con
   `useCallback`.)

4. **(Medio)** Immagina che un componente chiami `getClients(orgId)` a ogni render (invece di
   una volta sola dentro un `useEffect`). Cosa cambia in termini di numero di letture Firestore
   fatturate al giorno (vedi `CLAUDE.md`, sezione "Monitoraggio costi", limite 50.000 letture/giorno
   sul piano Spark)? Fai una stima approssimativa ipotizzando 5 re-render al secondo durante
   un'interazione utente attiva.

5. **(Difficile)** Riscrivi mentalmente `updateClient` come se usasse `setDoc(ref, data, { merge: true })`
   invece di `updateDoc(ref, data)`. Quali sono le differenze pratiche di comportamento nei
   seguenti due scenari: (a) il documento non esiste ancora; (b) `data` contiene un campo con
   valore `undefined` esplicito? (Suggerimento: consulta la documentazione ufficiale Firestore
   per il comportamento di `setDoc` con `merge: true` rispetto a `updateDoc` — questo esercizio
   richiede di uscire dal codice del progetto per verificare un comportamento dell'SDK.)

## Challenge

`groups.js` oggi espone solo `getGroups(orgId)`, che scarica **tutti** i gruppi dell'org in
un colpo solo. Non esiste un `getGroupById(orgId, groupId)` per recuperare un singolo gruppo
senza scaricare l'intera lista — verificalo tu stesso con una ricerca nel codice prima di
procedere. Immagina un ipotetico caso d'uso futuro: una pagina di dettaglio gruppo raggiunta
via URL diretto (es. `/gruppi/abc123`, un deep link condiviso da un trainer a un collega), dove
non avrebbe senso scaricare *tutti* i gruppi dell'organizzazione solo per mostrarne uno.

Scrivi (come esercizio, senza necessariamente inserirla nel codice reale del progetto) la
funzione `getGroupById(orgId, groupId)` in `groups.js`, seguendo esattamente lo stesso pattern
già visto in `getClientById` di `clients.js`: stessa struttura di import (`doc`, `getDoc`),
stesso controllo `exists()`, stesso stile di ritorno (`{ id, ...data }` o `null`). Poi scrivi,
in una riga di commento, la ragione architetturale per cui — nonostante il pattern sia identico
— *dove* verrebbe effettivamente chiamata questa nuova funzione (un hook? un componente
pagina?) dovrebbe comunque rispettare la convenzione "`orgId` come primo argomento" vista nella
Lezione 11, per restare coerente con il resto del progetto.
