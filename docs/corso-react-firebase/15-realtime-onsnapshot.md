# Lezione 15 — Realtime con onSnapshot
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire la differenza tra una lettura "one-shot" (`getDoc`/`getDocs`, una Promise che si
risolve una volta sola) e un listener realtime (`onSnapshot`, una sottoscrizione che resta
attiva finché non la chiudi tu), il pattern di cleanup obbligatorio che lo accompagna, e
soprattutto **dove** nel progetto viene usato davvero — verificato con una ricerca nel codice,
non assunto dalla documentazione. Il risultato di questa verifica, come vedrai, non coincide
con quello che ci si aspetterebbe leggendo `CLAUDE.md`.

## Concetti teorici

Firestore offre due modi fondamentalmente diversi per leggere un documento o una collection:

- **Lettura one-shot** (`getDoc(ref)` / `getDocs(query)`): una `Promise` che si risolve una
  volta con lo stato dei dati **in quel preciso istante**. Se il documento cambia un secondo
  dopo, il tuo codice non lo sa, a meno che tu non richiami di nuovo `getDoc`/`getDocs`
  manualmente (un "refetch" esplicito).
- **Listener realtime** (`onSnapshot(ref, callback)`): non restituisce una Promise, restituisce
  una **funzione di cancellazione** (`unsubscribe`). Il `callback` viene invocato subito con lo
  stato attuale, e poi **automaticamente ogni volta che il documento (o i risultati della
  query) cambiano** su Firestore — indipendentemente da chi ha scritto quella modifica: lo
  stesso browser, un altro dispositivo, un altro utente, o una Cloud Function con Admin SDK.

> 📎 **Approfondimento: `onSnapshot` / listener realtime**
>
> Pensa alla differenza tra comprare un giornale ed accendere la radio. Comprare il giornale
> (`getDoc`) ti dà una fotografia accurata delle notizie **al momento della stampa** — se
> succede qualcosa dieci minuti dopo, il tuo giornale non lo sa, e per saperlo devi comprare
> una nuova copia (un altro `getDoc`). Accendere la radio (`onSnapshot`) invece ti mantiene
   "sintonizzato": ogni nuovo aggiornamento arriva da solo, in tempo reale, senza che tu debba
> fare nulla di nuovo — finché non spegni la radio (`unsubscribe()`). Il prezzo di restare
> sintonizzati è che il canale deve trasmettere continuamente (un costo, seppur ridotto,
> anche quando non hai bisogno di aggiornamenti immediati) — è per questo che nessuna app
> tiene *ogni* dato sintonizzato via radio: si sceglie caso per caso cosa vale la pena ascoltare
> in diretta e cosa si può semplicemente ricontrollare quando serve.

Il **cleanup** non è opzionale: `onSnapshot` resta agganciato a Firestore finché qualcuno non
chiama la funzione che restituisce. Se un componente React che ha aperto un listener viene
smontato (l'utente naviga altrove) senza chiamare quella funzione, il listener **continua a
esistere** — un vero memory leak: continua a ricevere aggiornamenti, continua a consumare
letture Firestore, e prova a chiamare `setState` su un componente che non esiste più. Per
questo, ogni `onSnapshot` dentro un `useEffect` deve avere come valore di ritorno dell'effect
proprio la funzione `unsubscribe` — è esattamente il pattern di cleanup di `useEffect` che
probabilmente hai già visto nella Lezione 5, applicato qui a una risorsa esterna (una
connessione realtime) invece che a un timer o a un event listener del DOM.

## Dove compare nel progetto

Prima di scrivere qualunque cosa su questo argomento, conviene verificare i fatti con una
ricerca testuale in tutto `src/`, invece di fidarsi a memoria di cosa "dovrebbe" essere
realtime. Il risultato di `grep -r "onSnapshot" src/` è netto:

```
src/features/client/useClient.js
```

**Un solo file, in tutto il progetto, usa `onSnapshot`.** Non ce ne sono altri — né nel
calendario, né nelle notifiche, né nella lista clienti, né nei gruppi. Confrontalo con
`CLAUDE.md`, che nella sezione "Ottimizzazioni già presenti" descrive: *"`onSnapshot` solo dove
serve il real-time (calendario, notifiche)"*. Verificando il codice, quell'affermazione **non
corrisponde più (se mai è corrisposta) alla realtà attuale del progetto**: calendario e
notifiche usano letture one-shot, non listener. È un promemoria concreto — proprio nella
lezione dedicata alle security rules e ai listener, che sono tra le parti più delicate
dell'app — del motivo per cui questo corso insiste sul leggere il codice reale invece di
fidarsi di un documento riassuntivo, per quanto curato: anche la documentazione di un progetto
vivo va sempre verificata, perché tende a invecchiare più in fretta del codice.

Il vero (e unico) consumer di `onSnapshot`:
- [`src/features/client/useClient.js`](../../src/features/client/useClient.js) — l'intero file
- [`src/features/client/ClientView.jsx`](../../src/features/client/ClientView.jsx) (riga 17) —
  lo consuma, ed è il **componente radice di tutta l'area cliente** (montato una sola volta,
  per l'intera sessione, quando un utente con `role: 'client'` fa login)

Per contrasto, ecco cosa usano *davvero* calendario, notifiche e lista clienti — tutte letture
one-shot con `getDocs`:
- [`src/firebase/services/calendar.js`](../../src/firebase/services/calendar.js) —
  `getTrainerSlots`, `getClientSlots`, `getSlotsByGroup`, `getTrainerRecurrences` (righe 10-76):
  tutte `getDocs(query(...))`, nessun `onSnapshot`
- [`src/firebase/services/notifications.js`](../../src/firebase/services/notifications.js) —
  `getNotifications` (riga 8-20): `getDocs`, non `onSnapshot`
- [`src/firebase/services/clients.js`](../../src/firebase/services/clients.js) — `getClients`
  (riga 8-12): `getDocs`, non `onSnapshot`
- [`src/features/calendar/useCalendar.js`](../../src/features/calendar/useCalendar.js) — la
  funzione `fetchSlots` (righe 37-47) richiama `getTrainerSlots` una volta al mount/cambio
  range, e viene richiamata **esplicitamente** dopo ogni mutazione che potrebbe non bastare
  all'update ottimistico locale (es. `handleAddRecurrence`, riga 96-104, chiama `fetchSlots()`
  dopo il successo, perché una ricorrenza genera più slot che sarebbe scomodo costruire a mano
  lato client)

## Analisi del codice

### L'unico vero listener realtime del progetto (`useClient.js`, 31 righe, per intero)

```js
import { useState, useEffect } from 'react'
import { onSnapshot, doc }     from 'firebase/firestore'
import { db }                  from '../../firebase/services/db'
import { clientsPath }         from '../../firebase/paths'

export function useClient(orgId, clientId) {
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!orgId || !clientId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const ref = doc(db, clientsPath(orgId), clientId)
    const unsub = onSnapshot(
      ref,
      snap => {
        setClient(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [orgId, clientId])

  return { client, loading, error }
}
```

Riga per riga:
- **Riga 12**: guardia di sicurezza — se `orgId` o `clientId` non sono ancora disponibili (es.
  al primo render, prima che il profilo utente sia caricato), l'effect esce subito senza
  tentare `doc(db, ..., undefined)`, che lancerebbe un'eccezione a runtime.
- **Riga 15**: `ref = doc(db, clientsPath(orgId), clientId)` — nota che è un riferimento a un
  **singolo documento** (`doc(...)`), non a una query su una collection (`collection(...)` +
  `query(...)`). È una distinzione che tornerà cruciale nella sezione sui costi, più sotto.
- **Righe 16-26**: `onSnapshot` prende **tre argomenti**, non uno solo come una `.then()`: il
  riferimento, un callback di successo (invocato subito, poi a ogni cambiamento) e un callback
  di errore (invocato se, per esempio, una Firestore Security Rule nega la lettura — vedi
  Lezione 16). Non è un `.catch()` opzionale: se si omette il terzo argomento, un errore di
  permessi passa silenzioso e il componente resta bloccato con `loading: true` per sempre.
- **Riga 19**: `snap.exists() ? { id: snap.id, ...snap.data() } : null` — lo stesso pattern di
  normalizzazione che si vede ovunque nei service one-shot del progetto (`getClientById`,
  `getNotes`, ecc.): il documento Firestore non include il proprio id nei suoi campi, va
  aggiunto a mano da `snap.id`.
- **Riga 27**: `return unsub` — il cleanup. React chiamerà questa funzione ogni volta che
  l'effect deve "ripulire" prima di ri-eseguirsi (cambio di `orgId`/`clientId` nelle
  dipendenze) o quando il componente che usa `useClient` viene smontato (es. l'utente fa
  logout). Senza questa riga, ogni cambio di cliente aprirebbe un **nuovo** listener senza mai
  chiudere il precedente — listener che si accumulano invisibilmente nel tempo.
- **Array delle dipendenze `[orgId, clientId]`** (riga 28): se uno dei due cambia, l'intero
  effect si ri-esegue: prima il cleanup della vecchia sottoscrizione (chiude il listener sul
  vecchio documento), poi l'apertura di una nuova sottoscrizione sul nuovo documento. È corretto
  così — un `clientId` diverso significa letteralmente "un altro documento", non ha senso
  continuare ad ascoltare quello vecchio.

### Chi lo consuma — `ClientView.jsx`

```js
// ClientView.jsx, riga 17
const { client, loading } = useClient(orgId, clientId)
```

`ClientView` è il componente montato da `AppRouter` quando `profile.role === 'client'` (vedi
`app/routes.config.jsx`, Lezione 8) — resta montato per l'intera durata della sessione
dell'atleta nell'app. Questo è il motivo per cui il costo del listener è prevedibile: non è
"un listener per ogni pagina", è **un solo listener per l'intera sessione dell'utente
client**, su un solo documento.

### Perché solo qui? L'analisi costi/UX, verificata sul codice

Un `onSnapshot` su un **singolo documento** (come `useClient.js`) ha un profilo di costo
molto diverso da un `onSnapshot` su una **query/collection** (come sarebbe, per ipotesi, se
`getTrainerSlots` o `getClients` diventassero realtime):

```
onSnapshot(doc)     → 1 lettura alla sottoscrizione iniziale
                       + 1 lettura ogni volta che QUEL documento cambia
                       (costo proporzionale alle scritture su UN documento,
                        per tutta la durata della sessione)

onSnapshot(query)    → N letture alla sottoscrizione iniziale (N = documenti nel risultato)
                       + 1 lettura per ogni documento della query che cambia
                       (costo proporzionale al numero di documenti nella vista
                        moltiplicato per la frequenza di modifica dell'intera collection)
```

Nel contesto di RankEX, sul piano Firebase Spark (gratuito, 50.000 letture/giorno — vedi
`CLAUDE.md`, sezione "Monitoraggio costi Firebase"), la differenza è rilevante: `getClients`
recupera **tutti** i clienti di un'organizzazione in un colpo solo; se quella lettura fosse
realtime, ogni trainer collegato pagherebbe una lettura per ogni cliente al mount **più** una
lettura extra per ogni singola modifica a un qualsiasi cliente dell'org, anche se il trainer
sta guardando tutt'altro. Con più organizzazioni attive contemporaneamente, il costo
diventerebbe rapidamente imprevedibile. Un singolo documento cliente, invece, ha un tetto di
costo naturale: cambia solo quando *quel* cliente viene aggiornato, e c'è un solo listener
attivo per lui alla volta (la sua stessa sessione).

Sul fronte UX, la domanda giusta da porsi non è "quali dati cambiano spesso", ma **"chi altro,
diverso dalla persona che guarda lo schermo in questo momento, potrebbe scrivere su questo
dato mentre lo sto guardando?"**:

- Il documento `clients/{clientId}` viene scritto dal **trainer**, spesso su un dispositivo
  diverso, mentre l'**atleta** potrebbe avere la propria dashboard aperta sul telefono nello
  stesso istante (es. il trainer chiude una sessione e assegna XP con `handleCloseSlot` — vedi
  Lezione 14 — mentre l'atleta è seduto lì a guardare). Senza `onSnapshot`, l'atleta vedrebbe
  il proprio XP aggiornarsi solo al prossimo refresh manuale della pagina — un'esperienza
  scadente per quello che dovrebbe essere il momento più gratificante dell'app (il numero che
  sale). Con `onSnapshot`, l'aggiornamento appare da solo, istantaneamente.
- Il calendario e le notifiche, al contrario, cambiano quasi sempre per iniziativa dello
  **stesso** utente che li sta guardando: è il trainer che pianifica il proprio calendario
  aggiungendo uno slot, ed è per questo che `useCalendar.js` richiama `fetchSlots()`
  manualmente subito dopo ogni mutazione riuscita (es. riga 97, dopo
  `handleAddRecurrence`) — non c'è bisogno di "restare sintonizzati" su un canale che
  trasmette solo quando sei tu stesso a premere il microfono.
- La lista clienti (`useClients.js`, Lezione 14) segue lo stesso ragionamento: è il trainer
  stesso, nella propria sessione, a creare/modificare/eliminare clienti — l'optimistic update
  già gestito localmente (Lezione 14) copre il caso normale, e un refetch esplicito
  (`fetchClients`) copre i casi limite.

## Diagramma mentale

```
 Browser TRAINER                     Firestore                    Browser CLIENT (atleta)
 ────────────────                    ─────────                    ───────────────────────
 handleCloseSlot()
   → Cloud Function
     'chiudiSessione'      ────────►  organizations/{orgId}
                                        /clients/{clientId}
                                        .update({ xp, rank, ... })
                                              │
                                              │  (il documento È CAMBIATO)
                                              ▼
                                     onSnapshot(ref) SVEGLIA
                                     il listener aperto da useClient()
                                              │
                                              ▼
                                     callback(snap) ──────────────►  setClient(nuovo stato)
                                                                            │
                                                                            ▼
                                                                     re-render automatico:
                                                                     l'XP/rank sale sullo
                                                                     schermo dell'atleta
                                                                     SENZA refresh manuale
```

Contrasto — cosa succede invece per il calendario (nessun listener):

```
 Browser TRAINER A                    Firestore                   Browser TRAINER B
 ─────────────────                    ─────────                   ──────────────────
 handleAddSlot()
   → addSlotUseCase        ────────►  organizations/{orgId}/slots
                                              │
                                    (nessun listener sveglio:
                                     nessuno sta ascoltando
                                     questa collection)
                                              │
                                              ▼
                              Trainer B vedrà il nuovo slot solo
                              al prossimo mount di useCalendar
                              o cambio vista (nuova fetchSlots())
```

## Errori comuni

- **Dimenticare `return unsub`.** Se l'effect di `useClient.js` non ritornasse la funzione di
  cleanup, ogni cambio di `clientId` (es. il trainer passa da un cliente all'altro, se questo
  hook venisse riusato in un contesto del genere) accumulerebbe un listener aggiuntivo senza
  mai chiudere i precedenti: ognuno continuerebbe silenziosamente a consumare letture e a
  provare ad aggiornare uno stato ormai orfano.
- **Confondere il terzo argomento di `onSnapshot` con un `.catch()` opzionale.** A differenza
  di una Promise, `onSnapshot` non "rifiuta silenziosamente" se ometti la gestione errori —
  semplicemente non saprai mai che qualcosa è andato storto (es. una regola Firestore che nega
  l'accesso), e la UI resterà bloccata sullo stato di `loading` iniziale.
- **Applicare `onSnapshot` a una query ampia "perché è comodo" senza considerare il costo.**
  È l'errore opposto a quello di questa lezione: partire dal presupposto che il realtime sia
  sempre "meglio" e applicarlo a una collection intera (es. tutti i clienti di un'org) senza
  fare i conti su quante letture extra genera ogni singola scrittura su quella collection,
  moltiplicata per quanti utenti hanno quella vista aperta contemporaneamente.
- **Non gestire il caso `snap.exists() === false`.** Riga 19 di `useClient.js` lo fa
  correttamente (`setClient(null)`), ma è un dettaglio facile da dimenticare: un documento può
  non esistere (più) — per esempio se il trainer elimina il cliente mentre l'atleta ha ancora
  la propria dashboard aperta in un'altra scheda — e il codice che consuma `client` deve
  saperlo gestire (`ClientView.jsx`, riga 43: `if (!client) return <FullScreenMsg>...`).

## Best Practice

- Usa una **lettura one-shot** (`getDoc`/`getDocs`) quando i dati cambiano principalmente per
  iniziativa dello stesso utente che li sta guardando, e un refetch esplicito dopo ogni
  mutazione è sufficiente — è il caso di calendario, notifiche, lista clienti in questo
  progetto.
- Usa un **listener realtime** (`onSnapshot`) quando un altro attore (un altro utente, un altro
  dispositivo, una Cloud Function) può scrivere sullo stesso dato mentre l'utente corrente lo
  sta guardando, e la UX di "vederlo apparire da solo" ha un valore concreto — è il caso della
  dashboard dell'atleta in questo progetto.
- Preferisci un listener su **singolo documento** rispetto a un listener su **collection/query**
  quando possibile: il costo è più prevedibile e limitato, come si vede confrontando
  `useClient.js` (un doc) con l'ipotesi, scartata nel progetto, di rendere realtime
  `getClients` (un'intera collection).
- Ritorna **sempre** la funzione di `unsubscribe` da un `useEffect` che apre un `onSnapshot` —
  è un pattern meccanico, ma la sua omissione è tra le cause più comuni di memory leak in app
  React+Firebase.
- Verifica sempre le affermazioni sulla codebase leggendo il codice, non fidandoti di un
  riassunto — anche quando il riassunto è la documentazione ufficiale del progetto stesso. In
  questo caso specifico, `CLAUDE.md` elenca "calendario, notifiche" come esempi di realtime;
  il codice mostra che l'unico caso reale è la dashboard del singolo cliente. Non è un errore
  grave (probabilmente descrive un'intenzione di design più che lo stato attuale, o riflette
  un'epoca precedente del codice), ma è un promemoria di quanto sia facile che un documento
  scritto in un momento diverga silenziosamente dal codice che continua a evolvere.

## Quiz

1. Qual è la differenza fondamentale tra `getDoc(ref)` e `onSnapshot(ref, cb)`?
   - A) `getDoc` è per singoli documenti, `onSnapshot` solo per query
   - B) `getDoc` restituisce una Promise che si risolve una volta; `onSnapshot` registra un callback invocato ripetutamente ad ogni cambiamento
   - C) Sono identici, cambia solo la sintassi
   - D) `onSnapshot` richiede sempre l'autenticazione, `getDoc` no

2. Secondo la ricerca `grep -r "onSnapshot" src/` effettuata in questa lezione, quanti file nel progetto usano realmente `onSnapshot`?
   - A) Nessuno
   - B) Uno solo: `src/features/client/useClient.js`
   - C) Tre: calendario, notifiche, cliente singolo
   - D) Tutti i file in `firebase/services/`

3. Cosa restituisce la chiamata a `onSnapshot(ref, successCb, errorCb)`?
   - A) Una Promise
   - B) Il documento corrente
   - C) Una funzione di unsubscribe da chiamare per chiudere il listener
   - D) Nulla (`undefined`)

4. In `useClient.js`, cosa succede se si dimentica `return unsub` alla fine dell'effect?
   - A) Il codice non compila
   - B) Il listener non si apre mai
   - C) Il listener resta attivo anche dopo lo smontaggio del componente o il cambio di `clientId`, accumulandosi nel tempo
   - D) Firestore chiude automaticamente il listener dopo 60 secondi

5. Perché `useClient.js` usa `doc(db, clientsPath(orgId), clientId)` e non una `query` su una collection?
   - A) Perché `onSnapshot` non supporta le query
   - B) Perché serve leggere un singolo documento cliente specifico, non un insieme di documenti
   - C) Per errore di battitura nel codice originale
   - D) Perché `clientsPath` restituisce sempre un singolo id

6. Cosa fa concretamente `getTrainerSlots` in `firebase/services/calendar.js`?
   - A) Apre un `onSnapshot` sulla collection `slots`
   - B) Esegue una singola lettura (`getDocs`) filtrata per range di date
   - C) Ascolta in realtime tutte le modifiche al calendario di tutte le org
   - D) È un alias di `useCalendar.js`

7. Perché rendere realtime l'intera collection `clients` di un'organizzazione (ipotesi, non nel codice attuale) sarebbe più costoso in termini di letture Firestore rispetto a un `onSnapshot` su un solo documento cliente?
   - A) Non lo sarebbe, il costo è identico
   - B) Perché la sottoscrizione iniziale fatturerebbe una lettura per ogni documento della collection, più una lettura per ogni singola modifica a un qualsiasi cliente dell'org, indipendentemente da cosa il trainer sta effettivamente guardando
   - C) Perché Firestore non permette `onSnapshot` su collection con più di 10 documenti
   - D) Perché le query richiedono sempre un indice composito

8. Qual è il criterio, verificato nel codice di questo progetto, che distingue un dato "realtime" da uno "one-shot + refetch esplicito"?
   - A) La dimensione del documento in byte
   - B) Se un attore diverso dall'utente che guarda può scrivere sullo stesso dato mentre lo si sta guardando
   - C) Se il documento si trova in una subcollection o in una collection di primo livello
   - D) Se il campo `orgId` è presente nel path

9. Cosa succede nella UI se il documento osservato da `onSnapshot` viene eliminato mentre il listener è attivo?
   - A) Viene lanciata un'eccezione non gestita
   - B) Il callback di successo viene comunque invocato, con `snap.exists() === false`; `useClient.js` gestisce il caso restituendo `client: null`
   - C) Il listener smette di funzionare silenziosamente
   - D) Viene invocato il callback di errore, non quello di successo

10. `useCalendar.js` richiama esplicitamente `fetchSlots()` dopo `handleAddRecurrence` (riga 97). Perché, se non usa `onSnapshot`?
    - A) È un bug: dovrebbe usare `onSnapshot` invece
    - B) Perché una ricorrenza genera più slot lato server, e senza un modo automatico di saperlo (nessun listener), serve un refetch esplicito per vedere il risultato completo
    - C) `fetchSlots()` non fa nulla, è codice morto
    - D) Perché `addRecurrenceUseCase` non restituisce alcun dato

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È la distinzione concettuale chiave della lezione. A è falsa (`getDoc` è per singoli
   doc, ma `getDocs` esiste per le query; entrambi i modelli, one-shot e realtime, supportano
   sia singolo doc che query). C ignora una differenza sostanziale di comportamento, non solo
   di sintassi. D è inventata, l'autenticazione dipende dalle Security Rules, non dal tipo di
   lettura.
2. **B.** Confermato dalla ricerca testuale effettuata in questa lezione: un solo file,
   `src/features/client/useClient.js`. C corrisponde a un'aspettativa plausibile leggendo
   `CLAUDE.md`, ma non al risultato verificato nel codice.
3. **C.** A differenza di `getDoc`, che ritorna una Promise, `onSnapshot` ritorna direttamente
   una funzione (`unsub` nel codice) da richiamare per chiudere la sottoscrizione — è quello
   che viene ritornato dall'effect a riga 27 di `useClient.js`.
4. **C.** È il memory leak descritto negli "Errori comuni": nessun errore di compilazione (A
   falso), il listener si apre comunque (B falso), e Firestore non ha un timeout automatico dei
   listener client-side (D falso, inventato).
5. **B.** `clientsPath(orgId)` costruisce il path della collection, ma `doc(db, path,
   clientId)` con un terzo argomento produce un riferimento a **un documento specifico**
   all'interno di quella collection — non una query sull'intera collection. A è falso,
   `onSnapshot` supporta entrambi i casi (è usato su query altrove in molti altri progetti
   Firebase, solo non in questo). C e D sono inventate.
6. **B.** Righe 10-20 di `calendar.js`: `query(...)` seguita da `await getDocs(q)` — una
   lettura singola, non un listener. A, C, D descrivono comportamenti assenti dal file.
7. **B.** È il ragionamento sviluppato nella sezione costi: il costo di un `onSnapshot` su
   query è proporzionale al numero di documenti nel risultato iniziale **più** una lettura per
   ogni cambiamento successivo a un qualsiasi documento della collection, mentre un
   `onSnapshot` su singolo doc costa al massimo una lettura per ogni cambiamento a *quel*
   documento. A è l'esatto opposto della realtà. C e D sono limitazioni inventate, non reali
   vincoli di Firestore.
8. **B.** È il criterio esplicito discusso in questa lezione, verificato confrontando
   `useClient.js` (un altro attore — il trainer — scrive mentre il cliente guarda) con
   calendario/notifiche/clienti (lo stesso utente scrive e guarda). A, C, D non trovano
   riscontro nel codice o nella logica Firestore.
9. **B.** Righe 18-19 di `useClient.js`: `snap.exists() ? {...} : null` — il callback di
   successo gestisce esplicitamente anche il caso di documento cancellato, non lancia
   eccezioni né richiama il callback di errore (che è riservato a errori di permessi/rete, non
   all'assenza del documento).
10. **B.** Coerente con il commento del codice stesso (righe 78-81 di `useCalendar.js`): il
    backend genera più slot da una ricorrenza, e senza un listener che se ne accorga da solo,
    serve un refetch esplicito per allineare lo stato locale. A è una proposta di redesign non
    supportata dal ragionamento sui costi appena fatto; C e D sono false, la funzione è
    effettivamente chiamata e `addRecurrenceUseCase` restituisce un id (riga 98), ma non
    l'elenco completo degli slot generati.

## Esercizi

1. **Facile.** Esegui tu stesso la ricerca `onSnapshot` in `src/` con lo strumento di ricerca
   del tuo editor (o `grep -rn "onSnapshot" src/`) e verifica che il risultato coincida con
   quanto riportato in questa lezione. Prova la stessa ricerca anche in `functions/src/` — la
   Cloud Function scrive mai in modo da "svegliare" quel listener? In quale file e con quale
   chiamata (indizio: cerca `batch.update` sul path di un cliente in
   `functions/src/callable/`)?
2. **Facile-medio.** Apri `ClientView.jsx` e traccia il percorso completo: da dove arrivano
   `orgId` e `clientId` che vengono passati a `useClient(orgId, clientId)`? Risali la catena di
   componenti/prop fino ad `AppRouter.jsx`.
3. **Medio.** Simula (solo localmente, senza commit) cosa succederebbe se `useClients.js`
   (Lezione 14, lista clienti del trainer) venisse convertito da `getClients` (one-shot) a un
   `onSnapshot` su `collection(db, clientsPath(orgId))`. Scrivi la nuova versione di
   `fetchClients` e, a parte, elenca almeno tre conseguenze pratiche (positive o negative) di
   questa modifica ipotetica — sia in termini di UX sia di costo.
4. **Medio-difficile.** `useNotifications.js` (Lezione richiamata in questa, non riscritta qui)
   usa una lettura one-shot (`getNotifications`) al mount, senza refetch periodico. Descrivi un
   caso limite realistico in cui l'atleta non vedrebbe una notifica nuova finché non ricarica
   manualmente la pagina, e valuta se convertire quel file a `onSnapshot` sarebbe giustificato
   secondo il criterio costo/UX di questa lezione (suggerimento: chi scrive le notifiche, e
   quando, rispetto a chi le legge?).
5. **Difficile.** Nella lezione hai visto che il listener di `useClient.js` è aperto per
   l'intera sessione dell'atleta (`ClientView` è il componente radice dell'area cliente).
   Ipotizza — e argomenta con numeri approssimativi — quante letture Firestore genererebbe in
   un giorno un'organizzazione con 50 atleti attivi, ciascuno con la propria dashboard aperta
   per 30 minuti al giorno, se in media il proprio documento cliente viene aggiornato 3 volte
   al giorno (per XP, campionamenti, badge). Confrontalo con il tetto gratuito di 50.000
   letture/giorno citato in `CLAUDE.md`.

## Challenge

Nel file `src/hooks/useNotifications.js`, le notifiche vengono lette una sola volta al mount
(`getNotifications`, riga 22) e non c'è alcun meccanismo — né realtime, né polling — per
accorgersi di una nuova notifica arrivata mentre l'atleta ha già la dashboard aperta (l'unico
modo per vederla è chiudere e riaprire l'app, o ricaricare la pagina).

Come esercizio di design (da non implementare realmente nel progetto, ma da scrivere come
pseudocodice/bozza di diff in un file scratch): progetta la conversione di
`useNotifications(orgId, clientId)` a un listener realtime sulla query esistente
(`where('clientId', '==', clientId)` su `notificationsPath(orgId)`). Rispondi esplicitamente,
nel tuo pseudocodice o nei commenti che lo accompagnano, a queste tre domande, usando il
ragionamento costi/UX sviluppato in questa lezione:
1. Chi scrive le notifiche di un cliente, e da dove (guarda `functions/src/callable/
   salvaCampionamento.js`, righe 58-76, e `functions/src/callable/salvaXP.js`, righe 23-32, per
   la risposta) — è "un altro attore" rispetto a chi le legge?
2. Quante notifiche non lette ha in media un cliente contemporaneamente (indizio: la TTL di 7
   giorni in `useNotifications.js`, riga 8, e il fatto che vengono cancellate se lette da più
   di 7 giorni) — la query è quindi "piccola" o "grande" in termini di documenti?
3. Con quale trade-off, rispetto alla soluzione one-shot attuale, staresti scambiando "costo in
   letture" con "reattività percepita"?
