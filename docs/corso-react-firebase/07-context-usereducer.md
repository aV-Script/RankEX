# Lezione 7 — Context API + useReducer
[← Indice](00-indice.md)

## Obiettivo della lezione

In questa lezione chiudi il Modulo 1 collegando tutto quello visto finora (`useState`,
`useEffect`, custom hook, `useCallback`) a un livello più alto: lo stato condiviso tra molti
componenti. Analizzerai `TrainerContext.jsx` (Context + `useReducer`, con una scelta
architetturale precisa — due Context separati invece di uno solo) e lo confronterai con altri due
Context reali del progetto, `ReadonlyContext.jsx` e `ThemeContext.jsx`, che risolvono problemi
simili con soluzioni diverse. Alla fine saprai motivare, con il codice reale davanti, quando usare
Context, quando usare `useReducer` invece di `useState`, e perché la stessa codebase contiene tre
pattern Context differenti — non per incoerenza, ma perché i tre problemi non sono identici.

## Concetti teorici

### Il problema che Context risolve: prop drilling

Immagina un valore (es. l'organizzazione corrente, `orgId`) che serve a un componente sepolto
cinque livelli sotto la pagina principale. Senza Context, dovresti passarlo come prop attraverso
**ogni** componente intermedio, anche quelli che non lo usano affatto, solo per farlo arrivare a
destinazione — il cosiddetto *prop drilling*. Ogni componente intermedio si "sporca" con una prop
che non gli interessa, solo per fare da tramite.

### 📎 Approfondimento: Context API

`createContext` + `Provider` + `useContext` sono i tre pezzi del meccanismo:

```js
const MyCtx = createContext(valoreDiDefault)

function Provider({ children }) {
  return <MyCtx.Provider value={qualcosa}>{children}</MyCtx.Provider>
}

function useMyValue() {
  return useContext(MyCtx)
}
```

Qualunque componente annidato dentro `<MyCtx.Provider>`, a qualunque profondità, può chiamare
`useContext(MyCtx)` (o l'hook wrapper `useMyValue()`) e ricevere `value` **senza** che nessun
componente intermedio debba conoscerlo o ripassarlo. È il meccanismo con cui React risolve il
prop drilling per dati che servono davvero a un sottoalbero ampio.

**Analogia:** un Context è come un annuncio diffuso via altoparlante in tutto un edificio,
invece di un bigliettino passato di persona in persona piano per piano. Chi ha bisogno
dell'informazione (il consumer) la ascolta direttamente, indipendentemente da quanti piani lo
separano dalla sala regia (il Provider) — nessun piano intermedio deve "ripetere" l'annuncio.

**Quando NON usarlo:** Context ha un costo — ogni consumer si ri-renderizza quando il `value` del
suo Provider cambia identità. Per uno stato locale a un solo componente (come `showPassword` in
`LoginForm.jsx`, Lezione 4), Context sarebbe un'astrazione ingiustificata: nessun altro
componente ne ha bisogno, quindi non c'è nessun prop drilling da risolvere. Il criterio pratico:
**Context per dati condivisi da un sottoalbero ampio di componenti eterogenei; `useState` locale
per dati che restano dentro un solo componente (o la sua diretta gerarchia figlio→figlio).**

### 📎 Approfondimento: useReducer

`useReducer` è un'alternativa a `useState` pensata per stato che cambia secondo **transizioni
esplicite e nominate**, invece che tramite setter liberi sparsi nel codice:

```js
function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_CLIENT': return { ...state, selectedClient: action.payload }
    default: return state
  }
}
const [state, dispatch] = useReducer(reducer, statoIniziale)
// da qualunque punto: dispatch({ type: 'SELECT_CLIENT', payload: cliente })
```

La differenza con più `useState` sparsi non è solo estetica. Con `useState`, chiunque abbia
accesso al setter (`setSelectedClient`) può scrivere **qualunque valore**, senza vincoli — il
"contratto" di cosa è una modifica legale allo stato non è scritto da nessuna parte, va dedotto
leggendo tutti i punti che chiamano quel setter. Con `useReducer`, invece, **tutte** le
transizioni legali sono elencate in un unico posto (il reducer, tramite lo `switch`): leggendo
`ACTIONS` e il corpo del reducer, sai esattamente cosa può succedere allo stato, senza dover
cercare in tutto il codebase chi chiama quale setter con quale valore.

**Analogia:** `useState` libero è come lasciare che chiunque riscriva a mano un registro
contabile: funziona, ma non c'è garanzia di coerenza tra le voci. `useReducer` è come un modulo
prestampato con causali fisse ("versamento", "prelievo") — puoi solo scegliere tra le opzioni
previste, e chi legge il registro sa in anticipo l'intero ventaglio di operazioni possibili senza
dover leggere ogni singola riga scritta a mano.

## Dove compare nel progetto

- [`src/context/TrainerContext.jsx`](../../src/context/TrainerContext.jsx) — `createContext` +
  `useReducer`, con **due** Context separati (`StateCtx`, `DispatchCtx`).
- [`src/context/ReadonlyContext.jsx`](../../src/context/ReadonlyContext.jsx) — Context minimale,
  nessuno stato interno, un booleano passato dall'alto.
- [`src/context/ThemeContext.jsx`](../../src/context/ThemeContext.jsx) — un solo Context,
  `useState` + `useEffect` + `useCallback` + `useMemo`, value bundlato e memoizzato.
- [`src/features/trainer/TrainerView.jsx`](../../src/features/trainer/TrainerView.jsx) — dove
  `TrainerProvider` e `ReadonlyProvider` vengono effettivamente montati.
- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — consumer reale di **solo**
  `useTrainerDispatch()` (mai `useTrainerState()`), esempio concreto discusso più sotto.
- [`src/features/trainer/clients-page/ClientCard.jsx`](../../src/features/trainer/clients-page/ClientCard.jsx)
  — consumer reale di **solo** `useTrainerState()` (mai `useTrainerDispatch()`), il caso
  complementare a `useClients.js`.
- [`src/components/ui/ThemePicker.jsx`](../../src/components/ui/ThemePicker.jsx) — consumer di
  `useTheme()` che legge sia stato (`themeId`) sia azione (`setTheme`) nello stesso punto.

## Analisi del codice

### 1. `TrainerContext.jsx` — azioni, reducer e stato iniziale (righe 1-32)

```js
import { createContext, useContext, useReducer } from 'react'

export const ACTIONS = Object.freeze({
  SELECT_CLIENT:   'SELECT_CLIENT',
  DESELECT_CLIENT: 'DESELECT_CLIENT',
})

const initialState = {
  selectedClient: null,
  orgId:       null,
  moduleType:  null,
  terminology: null,
  userRole:    null,
  orgPlan:     'free',
}

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SELECT_CLIENT:
      return { ...state, selectedClient: payload }
    case ACTIONS.DESELECT_CLIENT:
      return { ...state, selectedClient: null }
    default:
      return state
  }
}
```

- `ACTIONS` (righe 4-7) è un oggetto **congelato** (`Object.freeze`) con due sole azioni
  possibili: `SELECT_CLIENT` e `DESELECT_CLIENT`. Questo è esattamente il "modulo prestampato"
  dell'analogia sopra — tutto lo stato del reducer, in questo file, può cambiare in **due soli
  modi**, entrambi visibili leggendo dieci righe di codice.
- `reducer` (righe 21-32) è una funzione pura: riceve lo stato corrente e un'azione, ritorna il
  nuovo stato, senza mai mutare `state` direttamente (nota lo spread `{ ...state, ... }` in
  entrambi i casi, non `state.selectedClient = payload`). Il caso `default: return state` è
  fondamentale: per qualunque azione non riconosciuta, il reducer ritorna lo stato **invariato**
  — un contratto difensivo tipico di questo pattern.
- Da notare cosa **non** c'è in `ACTIONS`: non esiste un'azione per cambiare `orgId`,
  `moduleType`, `terminology`, `userRole` o `orgPlan` — questi cinque campi, una volta impostati
  dal `Provider` al momento della creazione (vedi sotto), restano fissi per tutta la vita del
  Provider. L'unico pezzo di stato realmente "mutabile" via `dispatch`, in questo Context, è
  `selectedClient`.

### 2. Il Provider e il doppio Context (righe 34-59)

```js
const StateCtx    = createContext(null)
const DispatchCtx = createContext(null)

export function TrainerProvider({ orgId, moduleType, terminology, userRole, orgPlan, children }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    orgId,
    moduleType,
    terminology,
    userRole,
    orgPlan: orgPlan ?? 'free',
  })

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}
```

Qui c'è la scelta architetturale centrale di questa lezione: **due Context separati**,
`StateCtx` e `DispatchCtx`, annidati l'uno dentro l'altro, invece di un unico Context con
`value={{ state, dispatch }}`. Il `Provider` (riga 42) riceve `orgId`, `moduleType`,
`terminology`, `userRole`, `orgPlan` come **prop** (passate da `TrainerView.jsx`, vedi sotto) e
le usa per costruire lo stato iniziale del reducer — quindi questi valori entrano nel Context una
volta sola, al momento della creazione, e da lì in poi vivono dentro `state`.

### 3. I due hook consumer (righe 61-73)

```js
export function useTrainerState() {
  const ctx = useContext(StateCtx)
  if (!ctx) throw new Error('useTrainerState deve essere usato dentro <TrainerProvider>')
  return ctx
}

export function useTrainerDispatch() {
  const ctx = useContext(DispatchCtx)
  if (!ctx) throw new Error('useTrainerDispatch deve essere usato dentro <TrainerProvider>')
  return ctx
}
```

Nota il pattern difensivo: entrambi gli hook lanciano un errore esplicito e leggibile se chiamati
fuori da `<TrainerProvider>`, invece di ritornare silenziosamente `null` e lasciare che l'errore
esploda più tardi, in un punto lontano e confuso del codice (es. `undefined is not a function`
quando qualcuno prova a chiamare `dispatch(...)` su un `null`). È un dettaglio piccolo ma da
imitare in qualunque Context custom tu scriva.

### 4. Perché due Context: il beneficio in termini di re-render

Questo è il cuore concettuale della lezione. Confrontiamo due mondi:

**Mondo A (quello reale, nel codice): due Context separati.**
`dispatch`, prodotto da `useReducer`, è **garantito stabile da React** per l'intera vita del
componente che lo possiede — non cambia mai identità tra un render e l'altro, indipendentemente
da quante volte lo stato cambia (è la stessa garanzia che React dà al setter di `useState`).
Quindi `DispatchCtx.Provider value={dispatch}` (riga 55) riceve sempre lo **stesso** `value` —
un consumer che chiama **solo** `useTrainerDispatch()` non si ri-renderizza **mai** a causa di
cambiamenti di `state`, perché non è nemmeno iscritto a `StateCtx`.

**Mondo B (ipotetico, se il codice usasse un solo Context):**
```js
// NON è il codice reale — ipotesi per confronto
<SingleCtx.Provider value={{ state, dispatch }}>
```
Qui `value` è un oggetto letterale nuovo **ad ogni render** del Provider (esattamente come
l'oggetto ritornato da `useToast()`, visto nella Lezione 6) — perché `state` cambia identità ogni
volta che il reducer produce un nuovo stato, e un nuovo `state` significa un nuovo oggetto
`{ state, dispatch }`. **Ogni** consumer di `SingleCtx`, incluso uno che legge solo `dispatch` e
non tocca mai `state`, si ri-renderizzerebbe ad ogni `dispatch(...)` chiamato da qualunque punto
dell'app — anche se quel consumer non usa affatto l'informazione che è cambiata.

**La prova nel codice reale, non ipotetica:** [`src/hooks/useClients.js`](../../src/hooks/useClients.js)
importa **solo** `useTrainerDispatch` (riga 2: `import { useTrainerDispatch, ACTIONS } from
'../context/TrainerContext'`) — non chiama mai `useTrainerState()`. È un consumer che ha bisogno
di *notificare* cambiamenti (`dispatch({ type: ACTIONS.SELECT_CLIENT, ... })`, viste nella
Lezione 6) ma non ha bisogno di *leggere* `selectedClient`/`orgId`/ecc. Con il design a due
Context, `useClients` non si ri-renderizza mai per un cambio di `state` — cosa che, con un
Context unico, sarebbe successa ad ogni `SELECT_CLIENT`/`DESELECT_CLIENT` dispatchato da
qualunque punto dell'app, `useClients` compreso.

Il caso complementare, sempre reale: [`ClientCard.jsx`](../../src/features/trainer/clients-page/ClientCard.jsx)
(riga 11: `const { moduleType } = useTrainerState()`) chiama **solo** `useTrainerState()`, mai
`useTrainerDispatch()` — ha bisogno di leggere `moduleType` per decidere come renderizzare il
badge del cliente (categoria PT vs ruolo soccer), ma non ha mai bisogno di scrivere nulla nel
Context. Con il design a due Context, `ClientCard` si iscrive solo a `StateCtx`: si ri-renderizza
(correttamente) quando `state` cambia, ma non sarebbe mai influenzato da un ipotetico cambio di
identità di `dispatch` (che comunque, come detto, non cambia mai).

Queste due funzioni reali, una per ciascun lato dello split, sono la controprova migliore che il
progetto non ha introdotto lo split "per principio" ma perché **esistono davvero** consumer con
esigenze asimmetriche.

### 5. Dove viene montato: `TrainerView.jsx` (righe 22-35)

```jsx
return (
  <TrainerProvider
    orgId={orgId}
    moduleType={moduleType}
    terminology={resolvedTerminology}
    userRole={userRole}
    orgPlan={org?.plan ?? 'free'}
  >
    <ReadonlyProvider readonly={readonly}>
      <TrainerLayout user={user} orgId={orgId} />
    </ReadonlyProvider>
  </TrainerProvider>
)
```

`TrainerProvider` e `ReadonlyProvider` sono annidati, con `TrainerProvider` più esterno. `readonly`
(riga 20 di `TrainerView.jsx`: `const readonly = userRole === 'staff_readonly'`) è calcolato
**fuori** dal Context — è un valore derivato da `profile?.role`, non stato React — e passato come
prop a `ReadonlyProvider`. Da qui in giù, ogni componente della gerarchia (`TrainerLayout` e
tutto ciò che contiene) può accedere sia a `useTrainerState()`/`useTrainerDispatch()` sia a
`useReadonly()`.

### 6. `ReadonlyContext.jsx` — il Context più semplice possibile (tutto il file)

```js
import { createContext, useContext } from 'react'

const ReadonlyCtx = createContext(false)

export function ReadonlyProvider({ readonly, children }) {
  return (
    <ReadonlyCtx.Provider value={!!readonly}>
      {children}
    </ReadonlyCtx.Provider>
  )
}

export function useReadonly() {
  return useContext(ReadonlyCtx)
}
```

Nessuno `useState`, nessun `useReducer`, nessun hook interno al Provider. `ReadonlyProvider` è
un puro "passa-attraverso": riceve `readonly` come prop e lo re-inietta nel Context, con
`!!readonly` (doppia negazione) a garantire che il valore sia sempre un booleano vero e proprio
anche se qualcuno passasse `undefined`/`null`/una stringa. Non serve altro: **questo** Context
esiste unicamente per evitare di ripassare `readonly` come prop attraverso ogni componente
intermedio della UI trainer (bottoni, form, sezioni della dashboard cliente) che deve sapere se
disabilitarsi — è prop drilling risolto nella sua forma più elementare, senza nessuna delle
complessità di stato viste in `TrainerContext`.

Questo è il contrasto pedagogico più diretto della lezione: **non tutti i Context devono essere
complessi.** Qui il "problema" da risolvere è solo "un booleano deve arrivare a molti componenti
annidati" — niente reducer, niente split state/dispatch, perché non c'è nessuno stato da gestire
localmente: il valore arriva già pronto dall'alto (da `profile.role`, calcolato in `TrainerView.jsx`)
e non cambia mai *dentro* il Context stesso.

### 7. `ThemeContext.jsx` — un solo Context, ma con `useMemo` (righe 46-90)

```js
export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME } catch { return DEFAULT_THEME }
  })

  const theme = THEMES_MAP[themeId] ?? THEMES_MAP[DEFAULT_THEME]

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((id) => {
    const t = THEMES_MAP[id]
    if (!t) return
    setThemeId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch {}
    applyTheme(t)
  }, [])

  const previewTheme = useCallback((id) => {
    const t = THEMES_MAP[id]
    if (t) applyTheme(t)
  }, [])

  const cancelPreview = useCallback(() => {
    applyTheme(theme)
  }, [theme])

  const value = useMemo(
    () => ({ theme, themeId, themes: THEMES, setTheme, previewTheme, cancelPreview }),
    [theme, themeId, setTheme, previewTheme, cancelPreview]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```

Terzo pattern, diverso sia da `TrainerContext` sia da `ReadonlyContext`:

- Un **solo** Context (`ThemeContext`, non splittato in state/dispatch).
- `themeId` è un normale `useState`, inizializzato pigramente (funzione passata a `useState`,
  eseguita una sola volta) leggendo `localStorage` — coerente con quanto visto sul lazy
  initializer, con un `try/catch` a difesa da un `localStorage` non disponibile (es. modalità
  privata di alcuni browser).
- Un `useEffect` (righe 53-55, dipendenza `[theme]`) sincronizza il tema calcolato con il DOM
  reale (`applyTheme`, che scrive CSS custom properties su `document.documentElement` e inietta
  un `<style>` per il background) — è un altro esempio concreto di "sincronizzazione col mondo
  esterno" del tipo visto nella Lezione 5, qui applicato al DOM invece che a timer o rete.
- `setTheme`, `previewTheme`, `cancelPreview` sono ciascuna avvolta in `useCallback` (esattamente
  come i metodi di `useToast.js`, Lezione 6) — **ma**, a differenza di `useToast`, qui il valore
  finale del Context **è** avvolto in `useMemo` (righe 74-77), con una dependency array che
  elenca ogni singolo ingrediente (`theme`, `themeId`, `setTheme`, `previewTheme`, `cancelPreview`).
  Questo `value` resta quindi lo stesso oggetto tra un render e l'altro finché nessuno di questi
  cinque ingredienti cambia — un modo diverso, ma altrettanto valido, di garantire un `value` di
  Context stabile, rispetto allo split in due Context di `TrainerContext`.

### 8. Perché `ThemeContext` non ha bisogno dello split (e `TrainerContext` sì)

Verificando i consumer reali: [`ThemePicker.jsx`](../../src/components/ui/ThemePicker.jsx) (riga
26: `const { themes, themeId, setTheme } = useTheme()`) legge **sia** `themeId` **sia**
`setTheme` nello stesso componente — deve sapere qual è il tema attivo (per evidenziarlo nella UI
di selezione) *e* deve poterlo cambiare. Non esiste, nei consumer di `useTheme()` verificati nel
progetto, un caso analogo a `useClients.js` (che vuole *solo* scrivere) o a `ClientCard.jsx` (che
vuole *solo* leggere): chi consuma il tema, tipicamente, ha bisogno di entrambe le cose insieme.
In un caso così, splittare in due Context non porterebbe nessun beneficio pratico di re-render —
aggiungerebbe solo complessità (due Provider annidati, due hook invece di uno) per un problema
che qui non esiste. `useMemo` sul value bundlato è la soluzione proporzionata al problema reale
di `ThemeContext`, esattamente come lo split in due Context lo è per `TrainerContext`, dove
`useClients.js` e `ClientCard.jsx` dimostrano l'esistenza di consumer realmente asimmetrici.

## Diagramma mentale

```
                         TrainerProvider (TrainerContext.jsx)
                         ┌─────────────────────────────────┐
                         │ useReducer(reducer, initialState)│
                         │   state ──────► StateCtx.Provider│───┐
                         │   dispatch ───► DispatchCtx.Prov.│─┐ │
                         └─────────────────────────────────┘ │ │
                                                               │ │
     useClients.js  ──── useTrainerDispatch() ─────────────────┘ │   (SOLO scrittura,
        (chiama dispatch({type: SELECT_CLIENT, ...}))            │    mai legge state
        NON si ri-renderizza mai per cambi di `state`            │    → mai re-render
                                                                   │    per cambi state)
     ClientCard.jsx ──── useTrainerState() ─────────────────────┘
        (legge { moduleType })                                  (SOLO lettura,
        si ri-renderizza quando state cambia (corretto)           mai chiama dispatch)


ReadonlyContext.jsx                          ThemeContext.jsx
┌───────────────────────┐                    ┌──────────────────────────────┐
│ nessuno stato interno  │                    │ useState(themeId)             │
│ value = !!readonly     │                    │ useEffect → applyTheme(DOM)   │
│ (booleano dall'alto)   │                    │ useCallback × 3 (azioni)      │
└───────────────────────┘                    │ useMemo({theme,...,setTheme}) │
     UN Context, statico                      └──────────────────────────────┘
                                                  UN Context, ma value memoizzato
                                                  (nessuno split: i consumer reali
                                                   leggono sempre stato+azioni insieme)
```

## Errori comuni

1. **Fondere `StateCtx` e `DispatchCtx` in un unico Context "per semplicità"**, senza rendersi
   conto che si perderebbe esattamente il beneficio dimostrato da `useClients.js`: ogni
   `dispatch` chiamato da qualunque punto dell'app farebbe ri-renderizzare anche i consumer che
   non leggono mai `state`.
2. **Dimenticare `Object.freeze` su `ACTIONS`** (o, peggio, scrivere stringhe letterali sparse
   nel codice invece di usare le costanti `ACTIONS.SELECT_CLIENT`): un typo in una stringa
   (`'SLECT_CLIENT'`) finirebbe nel ramo `default: return state` del reducer, senza nessun
   errore visibile — lo stato semplicemente non cambierebbe, in silenzio.
3. **Mutare `state` direttamente nel reducer** (es. `state.selectedClient = payload; return
   state`) invece di ritornare un nuovo oggetto con lo spread. React confronta l'identità del
   valore ritornato dal reducer per decidere se ri-renderizzare i consumer — mutare l'oggetto
   esistente e ritornare lo stesso riferimento farebbe sì che React non veda alcun cambiamento,
   e i componenti non si aggiornerebbero.
4. **Chiamare `useTrainerState()` o `useTrainerDispatch()` fuori da `<TrainerProvider>`** (per
   esempio in un test isolato, o in un componente montato accidentalmente fuori
   dall'albero di `TrainerView`): il codice lancia volutamente un errore esplicito
   (`throw new Error(...)`) invece di fallire silenziosamente — è un comportamento voluto, non
   un bug, ma va gestito wrappando correttamente il componente nel test/storia.
5. **Aggiungere un'azione a `ThemeContext` pensando di doverla splittare come `TrainerContext`**:
   sarebbe un refactoring motivato dal pattern astratto ("i Context complessi si splittano")
   invece che dal problema reale — come mostrato, nessun consumer di `useTheme()` verificato nel
   progetto ha oggi bisogno di *solo* stato o *solo* azioni, quindi lo split non porterebbe
   benefici misurabili, solo complessità aggiuntiva.

## Best Practice

**Lo split di `TrainerContext` è giustificato da consumer reali, non ipotetici.** Il confronto
diretto tra `useClients.js` (solo `useTrainerDispatch`) e `ClientCard.jsx` (solo
`useTrainerState`) è la prova che questa non è ottimizzazione prematura: sono due file esistenti,
con esigenze realmente asimmetriche, che beneficiano concretamente dello split.

**`ReadonlyContext` non ha "copiato" lo schema di `TrainerContext"** perché il suo problema è
diverso: un solo valore, statico per tutta la vita del Provider (derivato da `profile.role`
all'esterno), nessuna transizione di stato interna da gestire. Applicare `useReducer` qui
sarebbe un caso da manuale di complessità non necessaria — utile da ricordare quando si è tentati
di riusare un pattern "perché ha funzionato altrove", invece di guardare il problema specifico.

**`ThemeContext` risolve lo stesso problema di fondo di `TrainerContext` (value di Context
stabile) con uno strumento diverso (`useMemo` su un value bundlato, invece dello split in due
Context) — ed è la scelta giusta lì, perché i suoi consumer non sono asimmetrici come quelli di
`TrainerContext`.** È un buon promemoria che "Context + stato mutabile" non ha un'unica soluzione
canonica: la soluzione dipende da *chi consuma cosa*, non da una regola fissa applicabile a
prescindere.

## Quiz

1. Qual è il problema che Context API risolve rispetto al semplice passaggio di prop?
   A. Rende i componenti più veloci in assoluto
   B. Evita di dover passare un valore attraverso componenti intermedi che non lo usano (prop drilling)
   C. Sostituisce completamente `useState`
   D. Permette di scrivere componenti senza JSX

2. In `TrainerContext.jsx`, quante e quali sono le azioni definite in `ACTIONS`?
   A. Tre: SELECT_CLIENT, DESELECT_CLIENT, UPDATE_CLIENT
   B. Due: SELECT_CLIENT e DESELECT_CLIENT
   C. Una sola: SELECT_CLIENT
   D. Nessuna, `ACTIONS` è vuoto e le azioni sono stringhe libere

3. Perché il reducer di `TrainerContext.jsx` ritorna sempre un nuovo oggetto con lo spread (`{ ...state, ... }`) invece di mutare `state` direttamente?
   A. Per motivi puramente stilistici, senza conseguenze funzionali
   B. Perché React rileva i cambiamenti di stato confrontando l'identità del valore ritornato; mutare l'oggetto esistente non produrrebbe un nuovo riferimento e i consumer non si aggiornerebbero
   C. Perché JavaScript non permette di mutare oggetti dentro un reducer
   D. Per evitare errori di sintassi

4. Perché `TrainerContext.jsx` usa due Context separati (`StateCtx` e `DispatchCtx`) invece di uno solo con `{ state, dispatch }`?
   A. È un requisito tecnico obbligatorio di `useReducer`
   B. Per permettere ai consumer che leggono solo `dispatch` (stabile per natura) di non ri-renderizzarsi quando `state` cambia
   C. Perché un singolo Context non può contenere più di un valore
   D. Per motivi di leggibilità del codice, senza impatto sui re-render

5. Quale file del progetto dimostra concretamente il beneficio dello split in due Context, chiamando SOLO `useTrainerDispatch()` e mai `useTrainerState()`?
   A. `ClientCard.jsx`
   B. `ThemePicker.jsx`
   C. `useClients.js`
   D. `ReadonlyContext.jsx`

6. Cosa fa `ReadonlyProvider` (in `ReadonlyContext.jsx`) al proprio interno?
   A. Usa `useReducer` per gestire transizioni complesse di stato
   B. Nessuno stato interno: re-inietta nel Context il valore `readonly` ricevuto come prop, forzandolo a booleano con `!!readonly`
   C. Fa una chiamata a Firestore per determinare se l'utente è readonly
   D. Usa `useState` per tenere traccia del valore readonly

7. In `ThemeContext.jsx`, a cosa serve `useMemo` intorno al `value` del Provider (righe 74-77)?
   A. A memorizzare il tema in `localStorage`
   B. A garantire che l'oggetto `value` passato al Provider mantenga la stessa identità tra i render finché nessuno dei suoi ingredienti (`theme`, `themeId`, `setTheme`, `previewTheme`, `cancelPreview`) cambia
   C. A velocizzare il calcolo di `THEMES_MAP[themeId]`
   D. `useMemo` qui non ha nessun effetto pratico

8. Perché `ThemeContext.jsx` NON splitta stato e azioni in due Context separati, a differenza di `TrainerContext.jsx`?
   A. Perché tecnicamente non sarebbe possibile con `useState`
   B. Perché i consumer reali verificati (es. `ThemePicker.jsx`) leggono sia stato (`themeId`) sia azioni (`setTheme`) insieme, quindi lo split non porterebbe benefici misurabili
   C. Perché `ThemeContext` non ha nessuna azione
   D. È un'incoerenza del codice senza giustificazione

9. Cosa succederebbe se un componente chiamasse `useTrainerState()` fuori da `<TrainerProvider>`?
   A. Riceverebbe silenziosamente `null`
   B. Verrebbe lanciato un errore esplicito: `'useTrainerState deve essere usato dentro <TrainerProvider>'`
   C. L'app si bloccherebbe senza alcun messaggio
   D. Verrebbe usato automaticamente lo stato iniziale di default

10. In `TrainerView.jsx`, da dove viene calcolato il valore `readonly` passato a `ReadonlyProvider`?
    A. Da una chiamata separata a Firestore
    B. Da `userRole === 'staff_readonly'`, calcolato fuori dal Context a partire dal ruolo del profilo utente
    C. Da uno `useState` interno a `ReadonlyProvider`
    D. È sempre `false` di default e va impostato manualmente

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È la definizione data nei Concetti teorici: Context esiste per evitare che dati
   condivisi debbano attraversare componenti intermedi che non li usano.
2. **B.** Confermato dal codice, righe 4-7: `Object.freeze({ SELECT_CLIENT: '...',
   DESELECT_CLIENT: '...' })` — esattamente due azioni.
3. **B.** È il principio di immutabilità dello stato React: il confronto di identità (non un
   deep-equal) è ciò che permette a React di sapere "qualcosa è cambiato, ri-renderizza".
4. **B.** È il cuore della lezione: `dispatch` è stabile per natura (garanzia di React su
   `useReducer`), quindi isolarlo in un proprio Context evita ri-render inutili nei consumer che
   non leggono mai `state`.
5. **C.** Confermato dall'import in `useClients.js` riga 2: solo `useTrainerDispatch`, mai
   `useTrainerState`.
6. **B.** Confermato dal codice completo di `ReadonlyContext.jsx`: nessun `useState`/`useReducer`,
   solo `<ReadonlyCtx.Provider value={!!readonly}>`.
7. **B.** È la definizione di `useMemo` applicata al caso specifico: la dependency array elenca
   tutti gli ingredienti del `value`, garantendo stabilità referenziale quando nessuno cambia.
8. **B.** Confermato verificando `ThemePicker.jsx` riga 26: `const { themes, themeId, setTheme }
   = useTheme()` — legge entrambe le categorie di dato nello stesso punto, a differenza dei
   consumer asimmetrici di `TrainerContext`.
9. **B.** Confermato dal codice, righe 63-65: `if (!ctx) throw new Error(...)` — comportamento
   difensivo esplicito, non un fallback silenzioso.
10. **B.** Confermato in `TrainerView.jsx` riga 20: `const readonly = userRole ===
    'staff_readonly'` — calcolato fuori dal Context, poi passato come prop a `ReadonlyProvider`.

## Esercizi

1. **Facile.** In `ClientCard.jsx`, individua la riga esatta in cui viene chiamato
   `useTrainerState()` e verifica, leggendo il resto del componente, come viene usato
   `moduleType` per decidere il contenuto del badge (categoria PT vs ruolo soccer).
2. **Facile.** Prova ad aggiungere temporaneamente un `console.log('ClientCard render')` in cima
   a `ClientCard.jsx` e un `dispatch({ type: ACTIONS.SELECT_CLIENT, payload: ... })` chiamato da
   un punto qualunque dell'app: verifica che `ClientCard` si ri-renderizzi (perché legge
   `state` tramite `useTrainerState`), mentre un ipotetico componente che chiamasse solo
   `useTrainerDispatch()` non lo farebbe.
3. **Medio.** Aggiungi una nuova azione `ACTIONS.SET_ORG_PLAN` al reducer di `TrainerContext.jsx`
   (case che aggiorna `orgPlan` nello stato), senza toccare nient'altro nel file. Verifica che
   il `default: return state` continui a proteggere da azioni sconosciute.
4. **Medio.** In `ThemeContext.jsx`, prova a rimuovere temporaneamente `useMemo` intorno al
   `value` del Provider (lasciando l'oggetto letterale diretto) e osserva, con un
   `console.log` in un consumer come `ThemePicker.jsx`, se e quando ri-renderizza più spesso.
   Ripristina `useMemo` alla fine.
5. **Difficile.** Disegna (su carta o in un file di note, non nel progetto) come cambierebbe
   `TrainerContext.jsx` se dovesse gestire anche un terzo pezzo di stato mutabile via `dispatch`
   (es. un filtro "vista corrente" condiviso). Aggiungi l'azione, il campo nello stato iniziale,
   il case nel reducer — e rifletti se lo split in due Context resterebbe comunque la scelta
   giusta anche con più stato da gestire.

## Challenge

Individua un altro punto del progetto in cui, oggi, un valore derivato da `profile.role` viene
ricalcolato più volte in punti diversi (invece di passare da un Context), e valuta se meriti la
stessa estrazione fatta per `readonly` in `ReadonlyContext.jsx`. In alternativa, se non trovi un
caso davvero motivato da duplicazione reale, implementa questa modifica più circoscritta e
verificabile:

1. In `TrainerContext.jsx`, aggiungi una nuova azione `ACTIONS.SET_MODULE_TYPE` (case che
   aggiorna `moduleType` nello stato tramite `payload`).
2. Aggiungi, nel corpo di `useTrainerState`/`useTrainerDispatch`, nessun cambiamento — verifica
   solo che l'hook esistente `useTrainerDispatch()` sia già sufficiente per dispatchare la nuova
   azione da qualunque consumer, senza bisogno di aggiungere altri hook.
3. Da un punto qualunque della UI trainer (per esempio un bottone temporaneo in
   `ClientsPage.jsx`, solo per il test), chiama `dispatch({ type: ACTIONS.SET_MODULE_TYPE,
   payload: 'soccer_academy' })` e verifica in `ClientCard.jsx` (che legge `moduleType` da
   `useTrainerState()`) che il badge cambi coerentemente, confermando che lo split
   `StateCtx`/`DispatchCtx` funziona correttamente anche per un nuovo pezzo di stato diverso da
   `selectedClient`.
4. Rimuovi il bottone di test alla fine — l'obiettivo dell'esercizio è osservare lo split
   state/dispatch in azione su un caso nuovo, non lasciare codice sperimentale nel progetto.
