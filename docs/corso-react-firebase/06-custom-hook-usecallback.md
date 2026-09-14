# Lezione 6 — Custom hook, useCallback e closures
[← Indice](00-indice.md)

## Obiettivo della lezione

Questa è la lezione più densa del Modulo 1: analizzerai `useClients.js`, l'hook più centrale e
complesso del progetto (usato da `TrainerView.jsx` per tutta la gestione CRUD dei clienti), riga
per riga. Alla fine capirai cos'è davvero una *closure*, perché `useCallback` esiste per
risolvere un problema concreto (non "per performance" in astratto), e saprai leggere ogni singola
dependency array del file spiegando esattamente perché contiene quei valori e non altri —
incluso un dettaglio reale e sottile nascosto in `useToast.js`.

## Concetti teorici

### 📎 Approfondimento: Custom Hook

Un *custom hook* è semplicemente una funzione JavaScript il cui nome inizia con `use` e che, al
suo interno, chiama altri hook (`useState`, `useEffect`, altri custom hook...). Non è una
funzionalità speciale del linguaggio: è una **convenzione** — ma una convenzione fondamentale,
perché è proprio grazie al prefisso `use` che React (e il linter `eslint-plugin-react-hooks`)
sanno che quella funzione deve rispettare le *regole degli hook* (es. non può essere chiamata
dentro un `if`, deve essere chiamata sempre nello stesso ordine ad ogni render).

Il vantaggio pratico: un custom hook ti permette di **riusare logica stateful** — non solo
funzioni pure, ma vero e proprio stato + effetti + gestori — tra componenti diversi, senza
copiare/incollare `useState`+`useEffect` in ognuno. `useClients(orgId, userId)` è un esempio
perfetto: incapsula fetch, stato ottimistico, rollback e integrazione con Context in un unico
posto, e `TrainerView.jsx` lo consuma con una sola riga (`const { clients, ... } = useClients(orgId, user.uid)`)
senza dover sapere nulla dei dettagli implementativi.

**Analogia:** un custom hook è come una ricetta di cucina scritta una volta e riusabile — non è
un ingrediente nuovo (non introduce nulla che React non abbia già), è un modo di *organizzare*
ingredienti esistenti (`useState`, `useEffect`, `useCallback`) in un procedimento riutilizzabile,
con un nome che ne descrive lo scopo.

### 📎 Approfondimento: Closure

Una *closure* è una funzione che "si porta dietro" (ricorda) le variabili dell'ambiente in cui è
stata **creata**, anche dopo che quell'ambiente ha smesso di essere quello "corrente".

```js
function creaContatore() {
  let n = 0
  return () => { n += 1; return n }  // questa funzione "ricorda" n
}
const contaA = creaContatore()
contaA() // 1
contaA() // 2 — n è sopravvissuto tra le due chiamate, dentro la closure
```

**Analogia:** immagina uno zaino che ogni funzione si porta dietro nel momento in cui viene
creata, contenente tutte le variabili che erano visibili in quel punto del codice. Anche se la
funzione viene chiamata molto più tardi, da un altro punto del programma, lo zaino resta quello
di quando è stata "impacchettata" — non si aggiorna magicamente con i valori più recenti.

**Perché questo riguarda React da vicino:** ogni volta che un componente (o un custom hook) si
ri-renderizza, la funzione componente viene **rieseguita da capo**. Ogni funzione dichiarata al
suo interno (ogni `handleXxx`) è quindi, a rigore, una **funzione nuova** ad ogni render, con una
**nuova closure** che cattura i valori di quello specifico render. `useCallback` esiste per
poter dire a React "se le dipendenze non sono cambiate, ridammi la stessa funzione (la stessa
closure) di prima, non crearne una nuova identica ma diversa in memoria".

### 📎 Approfondimento: useCallback

```js
const handleAddClient = useCallback(async (formData) => {
  // ...usa orgId, userId, toast...
}, [orgId, userId, toast])
```

`useCallback(fn, deps)` ritorna la **stessa identità di funzione** tra un render e l'altro,
finché nessuno dei valori in `deps` è cambiato. Se una dipendenza cambia, `useCallback` ricrea la
funzione (con la closure aggiornata sui nuovi valori) e da quel momento ritorna quella nuova
identità, stabile a sua volta finché le dipendenze non cambiano di nuovo.

Perché serve **davvero**, non "in teoria": in `useClients.js` vedrai tra poco che `fetchClients`
è usato come dipendenza di un `useEffect` (riga 35: `useEffect(() => { fetchClients() },
[fetchClients])`). Se `fetchClients` non fosse avvolto in `useCallback`, sarebbe una nuova
funzione a ogni render → l'`useEffect` che la vede tra le sue dipendenze si riattiverebbe *a ogni
render* → richiamerebbe `getClients(orgId)` di continuo → un loop di richieste a Firestore ad
ogni singolo render del componente. Questo è il caso d'uso canonico di `useCallback`: una
funzione ritornata da un hook, usata come dipendenza a valle.

**Stale closure bug:** se dimentichi una dipendenza realmente usata dentro la funzione,
`useCallback` continuerà a ritornarti la vecchia versione (con la vecchia closure) anche quando
il valore dimenticato è cambiato nel frattempo — la funzione "vede" un valore vecchio, congelato
al render in cui fu creata l'ultima volta che le sue dipendenze (dichiarate) erano cambiate. È
esattamente il concetto di closure applicato a un bug molto reale e molto comune.

## Dove compare nel progetto

- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — il custom hook al centro di
  questa lezione: fetch, `updateLocal`/`removeLocal`, `handleAddClient`, `handleCampionamento`
  (con optimistic update + rollback), `handleAddXP`, `handleDeleteClient`.
- [`src/hooks/useToast.js`](../../src/hooks/useToast.js) — hook più piccolo, usato come
  dipendenza in tre delle quattro funzioni CRUD di `useClients.js`.
- [`src/context/ToastContext.jsx`](../../src/context/ToastContext.jsx) — sorgente di `addToast`,
  utile per capire fino in fondo la catena di stabilità dei riferimenti discussa in Best Practice.
- [`src/features/trainer/TrainerView.jsx`](../../src/features/trainer/TrainerView.jsx) —
  consumer reale: `const { clients, isLoading, fetchError, fetchClients, handleAddClient,
  handleCampionamento, handleDeleteClient } = useClients(orgId, user.uid)`.

## Analisi del codice

### 1. Firma e stato interno (righe 1-22)

```js
import { useState, useEffect, useCallback } from 'react'
import { useTrainerDispatch, ACTIONS }      from '../context/TrainerContext'
import { getClients }                from '../firebase/services/clients'
import { buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { createClientUseCase }      from '../usecases/createClientUseCase'
import { deleteClientUseCase }      from '../usecases/deleteClientUseCase'
import { saveCampionamentoUseCase } from '../usecases/saveCampionamentoUseCase'
import { saveXPUseCase }            from '../usecases/saveXPUseCase'
import { useToast }                 from './useToast'
import { getFirebaseErrorMessage }  from '../utils/firebaseErrors'
import { auditLog, AUDIT_ACTIONS }  from '../utils/auditLog'

export function useClients(orgId, userId) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const dispatch              = useTrainerDispatch()
  const toast                 = useToast()
```

Nota subito la separazione architetturale (coerente con quanto descritto nel documento tecnico
del progetto): `getClients` (lettura diretta Firestore, da `firebase/services/`) è importato
separatamente da `createClientUseCase`/`deleteClientUseCase`/`saveCampionamentoUseCase`/
`saveXPUseCase` (scritture, da `usecases/`, che internamente chiamano Cloud Functions). Questo
hook non fa lui stesso `fetch` o chiamate Firestore dirette per le scritture: **orchestra**
chiamate ad altri livelli, e gestisce lo stato locale (`clients`, `loading`, `error`) risultante.

`dispatch = useTrainerDispatch()` (riga 21) è l'unico punto in cui questo hook tocca il Context
globale — e lo fa **solo in scrittura** (`useTrainerDispatch`, non `useTrainerState`): approfondiremo
perché questa distinzione conta molto nella Lezione 7.

### 2. Fetch e l'esempio canonico di `useCallback` (righe 25-35)

```js
const fetchClients = useCallback(() => {
  if (!orgId) return
  setLoading(true)
  setError(null)
  getClients(orgId)
    .then(data => setClients(data))
    .catch(err  => setError(err.message))
    .finally(()  => setLoading(false))
}, [orgId])

useEffect(() => { fetchClients() }, [fetchClients])
```

Questo è **il** blocco da capire a fondo per giustificare `useCallback` in questo file:

- `fetchClients` è avvolta in `useCallback` con dipendenza `[orgId]`: significa "ricrea questa
  funzione solo se `orgId` cambia; altrimenti dammi sempre lo stesso riferimento".
- Subito sotto, `useEffect(() => { fetchClients() }, [fetchClients])` usa **la funzione stessa**
  come dipendenza. Segui la catena: se `fetchClients` fosse una funzione normale (non
  memoizzata), ad ogni render di `useClients` verrebbe creata una nuova identità di funzione →
  l'`useEffect` vedrebbe una dipendenza "cambiata" a ogni render (un nuovo riferimento è sempre
  "diverso" per React, anche se il codice al suo interno è identico) → si riattiverebbe → il
  fetch a Firestore ripartirebbe → `setClients`/`setLoading` cambierebbero stato → nuovo render →
  nuova `fetchClients` → e così via, in un ciclo che nella pratica si traduce in chiamate a
  raffica finché il browser (o Firestore) non si lamenta.
- Con `useCallback([orgId])`, invece, `fetchClients` resta lo **stesso riferimento** tra un
  render e l'altro finché `orgId` non cambia davvero — l'`useEffect` si attiva solo quando serve:
  al mount, e ogni volta che l'organizzazione cambia (scenario reale: un `super_admin` che passa
  da un'org all'altra, o un trainer che si logga in un'org diversa).

Questo singolo blocco è probabilmente il miglior esempio concreto, in tutto il progetto, del
perché `useCallback` non è un'ottimizzazione "di moda" ma una necessità funzionale quando una
funzione memoizzata finisce nella dependency array di un altro hook.

### 3. `updateLocal`/`removeLocal` — dipendenze vuote, e perché è corretto (righe 38-44)

```js
const updateLocal = useCallback((id, updater) => {
  setClients(prev => prev.map(c => c.id === id ? { ...c, ...updater } : c))
}, [])

const removeLocal = useCallback((id) => {
  setClients(prev => prev.filter(c => c.id !== id))
}, [])
```

Array di dipendenze vuoto (`[]`) per entrambe. Non è un caso limite dimenticato: **è corretto**
perché entrambe usano la forma *updater-funzione* di `setClients` (`prev => ...`), non leggono
mai `clients` "dal di fuori" tramite closure. `prev` viene fornito da React stesso al momento
dell'esecuzione, sempre aggiornato al valore più recente — quindi queste due funzioni non hanno
*nessun* valore esterno mutabile da cui dipendere, e possono restare identiche per tutta la vita
del componente. È lo stesso principio del pattern `setShowPassword(v => !v)` visto nella
Lezione 4, qui applicato a un array invece che a un booleano.

### 4. `handleAddClient` — le dipendenze raccontano cosa viene letto (righe 47-57)

```js
const handleAddClient = useCallback(async (formData) => {
  try {
    const newClient = await createClientUseCase(orgId, userId ?? orgId, formData)
    setClients(prev => [...prev, newClient])
    toast.success('Cliente creato')
    return newClient
  } catch (err) {
    toast.error(getFirebaseErrorMessage(err, 'Impossibile creare il cliente'))
    throw err
  }
}, [orgId, userId, toast])
```

Le dipendenze `[orgId, userId, toast]` non sono arbitrarie: sono **esattamente** i tre valori
esterni letti dentro il corpo della funzione — `orgId` e `userId` alla riga 49 (passati a
`createClientUseCase`), `toast` alle righe 51 e 54 (`toast.success`/`toast.error`). Questo è il
criterio meccanico per compilare correttamente una dependency array: elenca ogni identificatore
usato nel corpo della funzione che **non** è definito dentro la funzione stessa e **non** è un
setter di `useState` (i setter sono garantiti stabili da React, non serve mai includerli).

### 5. `handleCampionamento` — optimistic update con rollback (righe 60-75)

```js
const handleCampionamento = useCallback(async (client, newStats, testValues) => {
  const { update } = buildCampionamentoUpdate(client, newStats, testValues)
  const snapshot   = client

  updateLocal(client.id, update)
  dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

  try {
    await saveCampionamentoUseCase(orgId, client, update, testValues)
    toast.success('Campionamento salvato')
  } catch {
    updateLocal(client.id, snapshot)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
    toast.error('Impossibile salvare il campionamento')
  }
}, [orgId, dispatch, updateLocal, toast])
```

Il pattern *optimistic update* (già descritto nel documento tecnico del progetto) è visibile qui
in azione:

1. `buildCampionamentoUpdate` (funzione pura, `utils/gamification.js`) calcola il nuovo stato
   **senza** toccare Firestore — solo matematica su dati già in memoria.
2. `snapshot = client` salva il cliente **prima** della modifica, per poterlo ripristinare in
   caso di errore.
3. `updateLocal(client.id, update)` aggiorna subito la UI (riga 64) — l'utente vede il
   cambiamento **prima** che Firestore abbia confermato nulla.
4. `dispatch({ type: ACTIONS.SELECT_CLIENT, ... })` (riga 65) sincronizza lo stesso aggiornamento
   nel Context globale (`TrainerContext`, Lezione 7) — perché il cliente selezionato può essere
   letto da altri componenti che non passano da `useClients`.
5. Solo **dopo** aver già aggiornato la UI, parte la vera chiamata (`saveCampionamentoUseCase`).
6. Se fallisce (`catch`, righe 70-74), sia lo stato locale (`updateLocal(client.id, snapshot)`)
   sia il Context (`dispatch(..., payload: snapshot)`) vengono riportati al valore precedente —
   il rollback.

Le dipendenze `[orgId, dispatch, updateLocal, toast]` seguono lo stesso criterio meccanico di
prima: `orgId` (riga 68), `dispatch` (righe 65, 72), `updateLocal` (righe 64, 71), `toast`
(righe 69, 73) — tutti letti nel corpo, tutti presenti nell'array. Da notare: `dispatch` è
garantito stabile da React per l'intera vita del componente che chiama `useReducer` (lo vedrai
nella Lezione 7), quindi includerlo qui non causa mai ricreazioni extra di `handleCampionamento`
— è nell'array per correttezza dichiarativa, non perché cambi spesso.

### 6. `handleAddXP` — stesso pattern, ma senza `toast` (righe 78-91)

```js
const handleAddXP = useCallback(async (client, xpToAdd, note) => {
  const { update } = buildXPUpdate(client, xpToAdd, note)
  const snapshot   = client

  updateLocal(client.id, update)
  dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

  try {
    await saveXPUseCase(orgId, client, xpToAdd, note, update)
  } catch {
    updateLocal(client.id, snapshot)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
  }
}, [orgId, dispatch, updateLocal])
```

Confronta con `handleCampionamento`: stessa forma esatta (snapshot, optimistic update, dispatch,
try/catch con rollback), ma qui `toast` **non compare né nel corpo né nelle dipendenze**
(`[orgId, dispatch, updateLocal]`, senza `toast`). È un dato di fatto reale del codice, non
un'invenzione: `handleAddXP` non dà **nessun feedback toast**, né in caso di successo né in caso
di fallimento, a differenza delle altre tre funzioni CRUD di questo hook che notificano sempre
l'utente. È un'incoerenza degna di nota — la riprendiamo negli Errori comuni.

### 7. `handleDeleteClient` — l'unica funzione che dipende da `clients` (righe 94-108)

```js
const handleDeleteClient = useCallback(async (clientId) => {
  const snapshot = clients.find(c => c.id === clientId)

  removeLocal(clientId)
  dispatch({ type: ACTIONS.DESELECT_CLIENT })

  try {
    await deleteClientUseCase(orgId, clientId)
    auditLog(AUDIT_ACTIONS.CLIENT_DELETED, { clientId, clientName: snapshot?.name, orgId })
    toast.success('Cliente eliminato')
  } catch {
    if (snapshot) setClients(prev => [...prev, snapshot])
    toast.error('Impossibile eliminare il cliente')
  }
}, [orgId, clients, dispatch, removeLocal, toast])
```

Qui c'è una differenza strutturale importante rispetto a `updateLocal`/`removeLocal`: alla riga
95, `clients.find(c => c.id === clientId)` legge **l'intero array `clients` per closure**, non
tramite un updater-funzione — serve infatti l'oggetto cliente completo (`snapshot`) per poterlo
eventualmente reinserire in caso di fallimento (riga 105: `setClients(prev => [...prev,
snapshot])`, che invece usa correttamente la forma funzionale per l'inserimento). Questo obbliga
`clients` a comparire nella dependency array (riga 108). Conseguenza pratica: **`handleDeleteClient`
viene ricreata ogni volta che `clients` cambia** — cioè quasi ad ogni operazione CRUD riuscita —
a differenza di `updateLocal`/`removeLocal`, che restano stabili per l'intera vita del componente.
È un buon promemoria che le dipendenze di un `useCallback` non sono solo un requisito di
correttezza (evitare stale closure): raccontano anche, leggendole, *quanto spesso* quella
funzione si ricrea realmente.

## Diagramma mentale

```
useClients(orgId, userId)
│
├── useState: clients, loading, error         ← stato locale
├── useTrainerDispatch()                      ← Context (solo scrittura)
├── useToast()                                ← nuovo oggetto {success,error,warning,info} ogni render
│
├── fetchClients   = useCallback([orgId])              ──┐
│     useEffect(() => fetchClients(), [fetchClients])  ←─┘  (si riattiva SOLO se orgId cambia)
│
├── updateLocal    = useCallback([])           ← stabile per sempre (usa setClients(prev => ...))
├── removeLocal    = useCallback([])           ← stabile per sempre
│
├── handleAddClient      = useCallback([orgId, userId, toast])
├── handleCampionamento  = useCallback([orgId, dispatch, updateLocal, toast])   ← optimistic + rollback
├── handleAddXP          = useCallback([orgId, dispatch, updateLocal])         ← optimistic + rollback, NESSUN toast
└── handleDeleteClient   = useCallback([orgId, clients, dispatch, removeLocal, toast])
                                        ↑
                                        legge clients per closure (snapshot) → si ricrea ad ogni CRUD

Closure in una parola:
  ogni render di useClients crea, potenzialmente, funzioni NUOVE.
  useCallback dice "no, ridammi la stessa, finché queste dipendenze non cambiano".
  Se una dipendenza usata nel corpo manca dall'array → la funzione resta "congelata"
  sul valore vecchio anche quando quello vero è già cambiato altrove (stale closure).
```

## Errori comuni

1. **Dimenticare `orgId` dalle dipendenze di `handleAddClient`.** Scenario didattico: se un
   giorno RankEX permettesse a un `super_admin` di cambiare organizzazione attiva senza smontare
   `TrainerView`, e `orgId` venisse omesso dall'array, `handleAddClient` continuerebbe a creare
   clienti nell'organizzazione **vecchia** anche dopo il cambio — perché la closure avrebbe
   "congelato" il valore di `orgId` al momento dell'ultima ricreazione della funzione.
2. **Aggiungere `clients` "per sicurezza" a tutte le funzioni**, pensando che sia sempre più
   sicuro includere più dipendenze del necessario. In realtà peggiorerebbe le prestazioni:
   `handleAddClient`, `handleCampionamento` e `handleAddXP` verrebbero ricreate ad ogni singola
   modifica dell'array clienti, anche quando non ne hanno alcun bisogno reale (nessuna delle tre
   legge `clients` per closure).
3. **Confondere "dipendenze vuote" con "la funzione non fa nulla di dinamico".**
   `updateLocal`/`removeLocal` hanno `[]` non perché siano statiche, ma perché usano la forma
   funzionale del setter (`prev => ...`) — è una tecnica precisa per *evitare* di dover dipendere
   da `clients`, non un'assenza di logica.
4. **Passare `toast` (l'oggetto intero) pensando sia stabile come i suoi metodi.** Vedi il
   dettaglio completo in Best Practice qui sotto — è un errore concettuale sottile e reale nel
   codice attuale.
5. **Pensare che `useCallback` impedisca l'esecuzione della funzione.** `useCallback` non
   memoizza il *risultato* di una chiamata (quello è compito di `useMemo` su un valore, o della
   memoizzazione dei componenti con `React.memo`): memoizza solo il *riferimento* alla funzione.
   `handleAddClient()` viene comunque eseguita per intero ogni volta che viene chiamata — quello
   che resta stabile è solo l'identità della funzione stessa tra un render e l'altro.

## Best Practice

### Il caso reale di `useToast.js`

```js
export function useToast() {
  const addToast = useToastContext()
  const success = useCallback((message) => addToast({ message, variant: 'success' }), [addToast])
  const error   = useCallback((message) => addToast({ message, variant: 'error'   }), [addToast])
  const warning = useCallback((message) => addToast({ message, variant: 'warning' }), [addToast])
  const info    = useCallback((message) => addToast({ message, variant: 'info'    }), [addToast])
  return { success, error, warning, info }
}
```

Osservazione grounded nel codice reale: **ogni singolo metodo** (`success`, `error`, `warning`,
`info`) è correttamente avvolto in `useCallback` con dipendenza `[addToast]`. Verificando anche
`ToastContext.jsx` (righe 13-21), `addToast` è a sua volta un `useCallback` con dipendenza
`[removeToast]`, e `removeToast` ha dipendenze `[]` — quindi `addToast` è stabile per tutta la
vita del `ToastProvider`, e di conseguenza `success`/`error`/`warning`/`info` sono **anch'essi**
stabili tra i render: stessa identità di funzione ogni volta, esattamente come dovrebbero essere.

**Ma** la riga finale, `return { success, error, warning, info }`, crea un **nuovo oggetto
letterale ad ogni chiamata** di `useToast()` — non è avvolta in `useMemo`. Questo significa che,
anche se `toast.success` è stabile, la variabile `toast` (l'intero oggetto ritornato) **cambia
identità a ogni render** di chi chiama `useToast()`.

Conseguenza diretta e verificabile in `useClients.js`: `const toast = useToast()` (riga 22)
produce un `toast` con identità nuova a ogni render dell'hook. Quando `handleAddClient`,
`handleCampionamento` e `handleDeleteClient` mettono `toast` (l'oggetto intero, non i singoli
metodi) nelle proprie dependency array (righe 57, 75, 108), quelle `useCallback` si **ricreano
ad ogni render di `useClients`**, vanificando parzialmente il beneficio della memoizzazione per
queste tre funzioni — il pattern non è "rotto" (non causa loop, perché nulla usa queste funzioni
CRUD come dipendenza di un altro effect, a differenza di `fetchClients`), ma è un'occasione persa:
il costo di `useCallback` (tenere traccia delle dipendenze, confrontarle ad ogni render) viene
comunque pagato, senza ottenerne il beneficio (stabilità del riferimento) per queste tre
funzioni specifiche.

**Come si risolverebbe, motivato dal codice reale:** o avvolgere il return di `useToast` in
`useMemo(() => ({ success, error, warning, info }), [success, error, warning, info])` (rendendo
stabile anche l'oggetto contenitore, non solo i suoi metodi), oppure — lato `useClients.js` —
dipendere dai singoli metodi effettivamente usati (`toast.success`, `toast.error`) invece che
dall'intero oggetto `toast`. Nel progetto esistono già componenti avvolti in `React.memo` (es.
`ClientCard.jsx`), a conferma che la stabilità referenziale delle funzioni passate come prop o
usate come dipendenze **è** un problema che il codice si preoccupa di gestire altrove — rende
questa piccola incoerenza in `useToast`/`useClients` un buon esercizio di lettura critica, più
che un bug che rompe qualcosa oggi.

## Quiz

1. Cosa distingue un custom hook da una normale funzione JavaScript?
   A. Deve sempre ritornare un oggetto
   B. Il nome inizia con `use` e, al suo interno, può chiamare altri hook rispettando le regole degli hook
   C. Deve essere definito in un file chiamato esattamente come la funzione
   D. Può essere chiamato solo dentro un `useEffect`

2. Cosa succederebbe se `fetchClients` in `useClients.js` NON fosse avvolta in `useCallback`?
   A. Nessuna differenza pratica, `useCallback` è solo estetico
   B. L'`useEffect` che la usa come dipendenza (`[fetchClients]`) si riattiverebbe a ogni render, richiamando `getClients(orgId)` in loop
   C. `fetchClients` smetterebbe di funzionare del tutto
   D. Il componente non potrebbe più montarsi

3. Perché `updateLocal` e `removeLocal` hanno una dependency array vuota (`[]`) e questo è corretto?
   A. Perché non fanno nulla di utile
   B. Perché usano la forma funzionale del setter (`setClients(prev => ...)`), che non richiede di leggere `clients` per closure
   C. Perché `useCallback` con `[]` è sempre l'opzione più sicura in ogni caso
   D. Per un bug del codice che andrebbe corretto

4. Cosa significa "stale closure" nel contesto di `useCallback`?
   A. Un errore di sintassi che impedisce la compilazione
   B. Una funzione memoizzata che continua a "vedere" un valore vecchio di una variabile, perché quella variabile non è stata inclusa nella dependency array
   C. Un `useState` che non si aggiorna mai
   D. Un problema che riguarda solo `useEffect`, non `useCallback`

5. Perché `handleDeleteClient` include `clients` nella propria dependency array, a differenza delle altre funzioni CRUD dell'hook?
   A. È un errore, dovrebbe essere rimosso
   B. Perché legge `clients.find(...)` direttamente per closure, per costruire lo `snapshot` da ripristinare in caso di rollback
   C. Perché `deleteClientUseCase` lo richiede come parametro
   D. Perché `dispatch` lo richiede

6. Nel pattern optimistic update di `handleCampionamento`, in quale ordine avvengono le operazioni?
   A. Prima si chiama Firestore, poi si aggiorna la UI solo se la chiamata riesce
   B. Si aggiorna subito la UI (`updateLocal` + `dispatch`), poi si chiama il servizio; in caso di errore si ripristina lo snapshot precedente
   C. Si aggiorna solo il Context, mai lo stato locale
   D. Non c'è nessun meccanismo di rollback nel codice

7. Cosa manca in `handleAddXP` rispetto a `handleCampionamento`, pur avendo la stessa struttura di optimistic update + rollback?
   A. Manca il rollback in caso di errore
   B. Manca qualunque feedback toast (né successo né errore)
   C. Manca l'aggiornamento del Context tramite `dispatch`
   D. Manca `orgId` come parametro

8. In `useToast.js`, perché `success`, `error`, `warning` e `info` sono individualmente stabili tra i render (a parità di `addToast`)?
   A. Perché sono dichiarati con `const` invece di `let`
   B. Perché ognuno è avvolto in un proprio `useCallback` con dipendenza `[addToast]`, e `addToast` stesso è stabile
   C. Perché JavaScript rende automaticamente stabili tutte le funzioni async
   D. Non sono stabili, cambiano sempre identità

9. Perché l'oggetto ritornato da `useToast()` (`{ success, error, warning, info }`) NON è stabile tra i render, anche se i suoi singoli metodi lo sono?
   A. Perché `useCallback` non funziona con oggetti
   B. Perché il `return { ... }` crea un nuovo oggetto letterale ad ogni chiamata della funzione, senza essere avvolto in `useMemo`
   C. Perché `addToast` cambia identità ad ogni render
   D. È un errore di battitura nel codice, l'oggetto è in realtà stabile

10. Qual è la conseguenza pratica, in `useClients.js`, di usare `toast` (l'oggetto intero) invece di `toast.success`/`toast.error` nelle dependency array di `handleAddClient`, `handleCampionamento` e `handleDeleteClient`?
    A. Nessuna, il codice è comunque corretto e ottimale
    B. Quelle tre `useCallback` si ricreano ad ogni render di `useClients`, vanificando parzialmente il beneficio della memoizzazione per quelle funzioni specifiche
    C. L'app va in errore a runtime
    D. I toast smettono di funzionare

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È la definizione operativa data nell'Approfondimento: convenzione di naming (`use...`)
   che abilita le regole degli hook, non un costrutto sintattico speciale del linguaggio.
2. **B.** Descritto in dettaglio nell'analisi del blocco 2: la dependency array
   `[fetchClients]` dell'`useEffect` renderebbe l'effetto sensibile a ogni nuova identità di
   `fetchClients`, e senza `useCallback` quella identità cambierebbe ad ogni render.
3. **B.** `prev => prev.map(...)`/`prev => prev.filter(...)` non catturano `clients` dall'esterno:
   ricevono sempre il valore più aggiornato direttamente da React al momento dell'esecuzione.
4. **B.** È la definizione data nell'Approfondimento su useCallback, applicabile in generale a
   ogni valore usato nel corpo di una funzione memoizzata ma omesso dalle dipendenze.
5. **B.** Riga 95: `clients.find(c => c.id === clientId)` — a differenza di `updateLocal`/
   `removeLocal`, qui `clients` viene letto per closure, non tramite forma funzionale.
6. **B.** Confermato dall'ordine reale del codice (righe 60-75): `updateLocal`/`dispatch` PRIMA
   di `await saveCampionamentoUseCase`, con rollback nel `catch`.
7. **B.** Confrontando i due blocchi di codice: `handleCampionamento` chiama `toast.success`/
   `toast.error`, `handleAddXP` non chiama mai `toast` — né `toast` compare nelle sue
   dipendenze (`[orgId, dispatch, updateLocal]`, senza `toast`).
8. **B.** Confermato da `useToast.js` righe 6-9 e dalla catena di stabilità di `addToast` in
   `ToastContext.jsx`.
9. **B.** L'oggetto `{ success, error, warning, info }` (riga 10 di `useToast.js`) non è
   avvolto in `useMemo`, quindi è un letterale nuovo a ogni invocazione della funzione, anche se
   il contenuto dei suoi campi (i metodi) è referenzialmente identico al giro precedente.
10. **B.** È esattamente la conseguenza descritta in Best Practice: l'identità nuova di `toast`
    ad ogni render forza la ricreazione delle `useCallback` che la includono come dipendenza,
    anche quando i metodi effettivamente usati (`toast.success`, `toast.error`) non sono affatto
    cambiati.

## Esercizi

1. **Facile.** In `useClients.js`, aggiungi un `console.log('fetchClients ricreata')` subito
   prima del `return` dentro `fetchClients`, e un secondo log fuori, a livello dell'hook, che
   stampa `fetchClients` stessa a ogni render (`console.log('render useClients, fetchClients =',
   fetchClients)`). Osserva quante volte l'identità cambia navigando tra clienti diversi.
2. **Facile.** Elenca a mano, per `handleAddClient`, `handleCampionamento`, `handleAddXP` e
   `handleDeleteClient`, quali identificatori esterni vengono letti nel corpo di ciascuna
   funzione, e verifica che coincidano esattamente con la dependency array dichiarata — è
   l'esercizio di lettura meccanica descritto nell'Analisi del codice.
3. **Medio.** Aggiungi un `toast.success('XP aggiunti')` in caso di successo e un
   `toast.error('Impossibile aggiungere XP')` nel `catch` di `handleAddXP`, rendendola coerente
   con `handleCampionamento`/`handleDeleteClient`. Aggiorna correttamente la dependency array
   aggiungendo `toast`.
4. **Medio.** Prova (solo per l'esperimento, poi ripristina) a rimuovere `orgId` dalla
   dependency array di `handleAddClient` senza toccare il corpo della funzione. Il linter di
   React (`eslint-plugin-react-hooks`, regola `exhaustive-deps`) dovrebbe segnalarlo — verifica
   che l'avviso compaia nel tuo editor o lanciando il lint del progetto.
5. **Difficile.** Modifica `useToast.js` avvolgendo il valore di ritorno in `useMemo(() => ({
   success, error, warning, info }), [success, error, warning, info])`. Poi, in `useClients.js`,
   aggiungi un `console.log` che stampa l'identità di `toast` ad ogni render e verifica che ora
   resti effettivamente stabile tra render successivi che non toccano il `ToastProvider`.

## Challenge

`handleAddXP` (righe 78-91 di `useClients.js`) è l'unica delle quattro funzioni CRUD di questo
hook a non dare alcun feedback visivo (né di successo né di errore) all'utente — un'incoerenza
reale rispetto a `handleAddClient`, `handleCampionamento` e `handleDeleteClient`, che notificano
sempre tramite `toast`.

Implementa la correzione end-to-end:

1. Aggiungi `toast.success('XP aggiunti')` subito dopo `await saveXPUseCase(...)` nel blocco
   `try`.
2. Aggiungi `toast.error('Impossibile aggiungere XP')` nel blocco `catch`, dopo il rollback
   (`updateLocal`/`dispatch`).
3. Aggiorna la dependency array di `useCallback` aggiungendo `toast`: da
   `[orgId, dispatch, updateLocal]` a `[orgId, dispatch, updateLocal, toast]`.
4. Verifica manualmente nell'app (vista trainer, dashboard di un cliente) che aggiungere XP a un
   cliente mostri ora lo stesso tipo di notifica toast già visibile per un campionamento salvato
   o un cliente creato — coerenza di UX su un'operazione che, dal punto di vista dell'utente, ha
   la stessa importanza delle altre tre.

Questo esercizio ti fa toccare con mano, su un caso reale e non inventato, sia il ragionamento
sulle dependency array (punto 3) sia la disciplina di UX coerente discussa nella sezione Errori
comuni.
