# Lezione 20 — Error boundaries e gestione errori
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire l'unico meccanismo che React offre per intercettare un errore che esplode durante il
render di un sottoalbero di componenti, perché quel meccanismo richiede — ancora oggi, con
React 18 — un class component, e come RankEX lo usa in due varianti (fallback full-page e
fallback compatto) per evitare che un grafico rotto porti giù l'intera dashboard.

## Concetti teorici

Un **Error Boundary** è un componente che cattura gli errori JavaScript lanciati durante il
render, nei metodi di lifecycle e nei costruttori dei componenti che ha come figli (l'intero
sottoalbero sotto di lui), li logga, e mostra una UI di fallback al posto dell'albero che è
andato in crash — invece di far sparire l'intera pagina con una schermata bianca.

Analogia: pensa a un interruttore differenziale (salvavita) nel quadro elettrico di casa. Se un
elettrodomestico in una stanza va in corto, il differenziale di quella stanza scatta e stacca la
corrente **solo lì** — non fa saltare la corrente in tutta la casa. Un Error Boundary fa lo
stesso con un errore React: isola il crash al sottoalbero che lo ha causato, invece di far
"saltare" l'intera applicazione.

Due limiti fondamentali da conoscere, perché delimitano cosa un Error Boundary NON fa:
1. **Non cattura errori asincroni** — un errore dentro un `setTimeout`, una Promise non gestita,
   o un handler di evento (`onClick`) non viene intercettato da un Error Boundary. Cattura
   *solo* errori sincroni durante il render.
2. **Non cattura errori nell'Error Boundary stesso** — se il fallback che renderizzi al suo
   interno lancia a sua volta un errore, quello non viene ricatturato dallo stesso boundary
   (serve un boundary genitore più esterno).

### Perché deve essere un class component — l'unica eccezione della codebase

React espone due API per gli Error Boundary: il metodo statico
`static getDerivedStateFromError(error)` (per aggiornare lo state e mostrare il fallback al
prossimo render) e il metodo di istanza `componentDidCatch(error, info)` (per il logging/side
effect, es. inviare l'errore a un servizio di monitoring). **Nessuna delle due esiste come
hook.** Non c'è un `useErrorBoundary()` nell'API pubblica di React 18 — è una scelta
architetturale del team React, non una dimenticanza: questi due metodi si agganciano a una fase
del ciclo di vita (la gestione di un errore "esploso" a metà render) che il modello a hook, pensato
per essere eseguito in sequenza prevedibile ad ogni render, non modella bene. Finché React non
introdurrà un'alternativa a hook, l'Error Boundary resta un caso in cui il class component non è
un retaggio di codice vecchio, ma l'unico strumento disponibile.

Verificato sul progetto: `grep -r "extends Component"` su tutta `src/` restituisce **un solo
file**, [`ErrorBoundary.jsx`](../../src/components/common/ErrorBoundary.jsx). In un progetto che
altrimenti applica rigorosamente "solo function component + hook" (coerente con lo stack
dichiarato: "React 18.3 (function components + hooks, no class components)" nell'indice del
corso), questa è l'unica, consapevole eccezione — un caso di studio da tenere a mente: **la
regola "mai class component" ha un'eccezione tecnica precisa, non stilistica**.

## Dove compare nel progetto

- [`src/components/common/ErrorBoundary.jsx`](../../src/components/common/ErrorBoundary.jsx) — il class component, unico nella codebase
- [`src/components/common/ErrorFallback.jsx`](../../src/components/common/ErrorFallback.jsx) — fallback di default, full-page
- [`src/components/common/ChartErrorFallback.jsx`](../../src/components/common/ChartErrorFallback.jsx) — fallback compatto per i grafici
- [`src/utils/firebaseErrors.js`](../../src/utils/firebaseErrors.js) — traduzione errori Firebase → messaggi italiani
- [`src/app/App.jsx`](../../src/app/App.jsx) — boundary "esterno", avvolge l'intero `AppRouter`
- [`src/features/client/ClientDashboard.jsx`](../../src/features/client/ClientDashboard.jsx) — tre boundary "interni" attorno a `StatsChart`, `BiaHistoryChart`, `XPTrendChart`
- [`src/features/trainer/groups-page/GroupDetailView.jsx`](../../src/features/trainer/groups-page/GroupDetailView.jsx) — boundary attorno a `GroupAnalysis` e `GroupComparison`

## Analisi del codice

### `ErrorBoundary.jsx` — il meccanismo completo

```jsx
import { Component } from 'react'
import { ErrorFallback } from './ErrorFallback'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // TODO: sostituire con Sentry.captureException(error, { extra: info })
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
        ? this.props.fallback({ error: this.state.error, onReset: this.handleReset })
        : <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }
    return this.props.children
  }
}
```

Riga per riga:

- **Righe 6-8**: `state = { hasError: false, error: null }` — lo stato che decide cosa
  renderizzare. Finché `hasError` è `false`, il boundary è "trasparente" e passa semplicemente
  `this.props.children` (riga 29).
- **Righe 10-12**: `getDerivedStateFromError` è un metodo **statico** — non ha accesso a `this`,
  riceve l'errore e deve restituire il nuovo state. React lo chiama durante la fase di "render"
  del ciclo di aggiornamento, quando un discendente lancia un errore. È qui che si decide **cosa
  mostrare** al prossimo render.
- **Righe 14-17**: `componentDidCatch` viene chiamato **dopo** il commit, nella fase di
  "commit" — è il posto giusto per i side effect (logging, invio a un servizio esterno), mai per
  cambiare lo state (per quello c'è `getDerivedStateFromError`). Il commento `TODO` a riga 15 è
  onesto: oggi il logging è solo `console.error`, non c'è ancora un servizio di error tracking
  collegato (Sentry o simili) — un punto reale, non ipotetico, su cosa manca al progetto.
- **Righe 19-21**: `handleReset` è una class field (arrow function assegnata come proprietà di
  istanza) — la sintassi che permette di passarla come callback senza dover fare `.bind(this)`
  nel costruttore, perché l'arrow function cattura `this` lessicalmente al momento della
  definizione della classe, non al momento della chiamata.
- **Riga 24-28**: qui è il punto più interessante. Se c'è un errore, il boundary controlla se
  gli è stata passata una prop `fallback`. Se sì, la **chiama come funzione**:
  `this.props.fallback({ error, onReset })`. Se no, usa il default `<ErrorFallback />` con la
  sintassi JSX normale.

### Perché la sintassi è diversa tra i due rami (`fallback(...)` vs `<ErrorFallback />`)

Questo è un dettaglio che vale la pena isolare perché è facile confonderlo con un errore. Un
componente funzione in React è, letteralmente, solo una funzione JavaScript che prende `props` e
restituisce JSX. Chiamarlo con `this.props.fallback({ error, onReset })` esegue quella funzione
direttamente e ne usa il valore di ritorno (JSX) — un modo perfettamente legittimo di ottenere
l'output di un componente funzione **quando quel componente non usa hook al suo interno**. Se
`ChartErrorFallback` chiamasse `useState` o `useEffect`, invocarlo come funzione semplice
romperebbe le regole degli hook (serve il contesto di rendering di React, che solo `<Componente />`
attiva). Verificato: [`ChartErrorFallback.jsx`](../../src/components/common/ChartErrorFallback.jsx)
non usa hook — è deliberatamente un componente puro (props in, JSX out), il che rende sicura la
chiamata diretta. Questo pattern si chiama **render prop**: una prop il cui valore è una
funzione che, chiamata, restituisce JSX — usato qui per lasciare al chiamante del boundary la
scelta di *cosa* mostrare, mantenendo il boundary generico.

### `ErrorFallback.jsx` — il fallback di default, full-page

```jsx
export function ErrorFallback({ error, onReset }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      ...
      <div className="flex gap-3">
        <Button variant="neutral" size="sm" onClick={onReset}>RIPROVA</Button>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>RICARICA</Button>
      </div>
    </div>
  )
}
```

Nota i due bottoni con comportamento diverso: **RIPROVA** chiama `onReset` (che internamente fa
`setState({ hasError: false })` — riprova a renderizzare lo stesso albero React senza ricaricare
la pagina, utile se l'errore era transitorio, es. un dato temporaneamente `undefined`).
**RICARICA** fa `window.location.reload()` — un reset drastico, l'ultima spiaggia quando lo stato
dell'applicazione è probabilmente corrotto e serve ripartire da zero (nuova richiesta HTTP,
nuovo bundle JS, nuovo stato Firebase Auth).

### `ChartErrorFallback.jsx` — perché serve un fallback diverso per un componente piccolo

```jsx
export function ChartErrorFallback({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="font-body text-[13px] text-white/60">
        Impossibile visualizzare questo grafico.
      </span>
      <Button variant="primary" size="sm" onClick={onReset}>RIPROVA</Button>
    </div>
  )
}
```

Il commento nel file (righe 4-7) è esplicito sul motivo: **"a differenza di ErrorFallback
(full-page), contiene il crash nella card del grafico senza svuotare il resto della
dashboard/tab (RX-49)"**. Il ragionamento architetturale: `StatsChart`, `BiaHistoryChart` e
`XPTrendChart` sono tutti basati su Recharts, una libreria che calcola geometrie SVG a partire
dai dati — è la parte più fragile della dashboard cliente (dati mancanti, array vuoti, valori
`NaN` propagati da un calcolo a monte sono le cause più probabili di crash lì). Se un errore in
uno di quei tre grafici facesse scattare l'`ErrorFallback` full-page che RankEX usa in `App.jsx`,
un trainer che sta guardando la scheda BIA di un cliente perderebbe **l'intera dashboard** — note,
scheda allenamento, calendario, tutto — per un bug isolato in un grafico. Il fallback compatto,
al contrario, degrada un solo riquadro e lascia il resto dell'interfaccia perfettamente
funzionante. È un esempio concreto del principio "isolare il blast radius di un errore alla
componente più piccola ragionevole", non solo "alla pagina intera".

Uso reale in [`ClientDashboard.jsx`](../../src/features/client/ClientDashboard.jsx) (righe 243-245):

```jsx
<ErrorBoundary fallback={ChartErrorFallback}>
  <StatsChart campionamenti={client.campionamenti} color={brandGreen} categoria={client.categoria} />
</ErrorBoundary>
```

Da notare: `fallback={ChartErrorFallback}` passa il **riferimento alla funzione**, non JSX
(`fallback={<ChartErrorFallback />}` sarebbe sbagliato — passerebbe un elemento React già
"congelato" con le props che aveva in quel momento, non una funzione richiamabile con
`{ error, onReset }` dinamici). `App.jsx` invece (riga 46) usa `<ErrorBoundary>` senza prop
`fallback`, lasciando che scatti il default `<ErrorFallback />` full-page — coerente: è il
boundary più esterno, avvolge l'intero `AppRouter`, quindi se scatta è già "game over" per la
sessione corrente.

### `firebaseErrors.js` — tradurre errori tecnici in messaggi utente

```js
const FIREBASE_ERROR_MESSAGES = {
  'auth/wrong-password':         'Password non corretta',
  'auth/user-not-found':         'Nessun account associato a questa email',
  ...
  'permission-denied':           'Accesso negato. Permessi insufficienti.',
  'unavailable':                 'Servizio temporaneamente non disponibile. Riprova.',
  ...
}

export function getFirebaseErrorMessage(err, fallback = 'Errore imprevisto. Riprova.') {
  if (!err) return fallback
  return FIREBASE_ERROR_MESSAGES[err.code] ?? err.message ?? fallback
}
```

Questa funzione non ha niente a che fare con gli Error Boundary — cattura errori **gestiti**
(dentro un `try/catch` esplicito, es. in `useLoginForm.js`), non crash del render. È qui perché
appartiene alla stessa famiglia concettuale: "gestione degli errori verso l'utente finale". Il
motivo per cui serve: gli errori nativi di Firebase arrivano come oggetto `FirebaseError` con un
campo `.code` in formato macchina (`auth/wrong-password`) e un `.message` in inglese tecnico
(`"Firebase: Error (auth/wrong-password)."`) — nessuno dei due è presentabile a un utente finale
italiano che sta solo provando ad accedere. La funzione fa un mapping esplicito codice → frase
naturale, con **due livelli di fallback**: se il codice non è nella mappa, usa `err.message`
(meglio di niente); se non c'è nemmeno quello, usa il messaggio generico passato come secondo
argomento (es. `'Errore di accesso'` in `useLoginForm.js`). L'operatore `??` (nullish coalescing)
è scelto apposta invece di `||`: se `err.message` fosse una stringa vuota `''` (falsy ma non
`null`/`undefined`), `||` la scarterebbe e passerebbe al fallback, mentre `??` la accetterebbe —
qui il comportamento coincide raramente nella pratica (un `message` vuoto è raro), ma è comunque
la scelta semanticamente corretta per "assente" contro "falsy".

## 📎 Approfondimento: perché il render deve essere sincrono per essere "catturabile"

React costruisce l'albero dei componenti in due fasi: **render** (chiama le funzioni componente,
calcola il JSX, tutto sincrono e "puro") e **commit** (applica le modifiche al DOM reale). Un
Error Boundary si aggancia esattamente al confine tra queste due fasi: se una funzione componente
lancia un'eccezione mentre React sta ancora "calcolando" l'albero (fase di render), React può
interrompere quel calcolo e chiedere al boundary più vicino sopra nell'albero cosa mostrare al
posto del sottoalbero fallito. Se invece l'errore arriva **dopo**, dentro un `setTimeout` o dentro
la callback di una Promise risolta più tardi, quel codice non sta più eseguendo dentro la "fase di
render" di React — sta girando come codice JavaScript qualsiasi, fuori dal ciclo che React
osserva. Ecco perché un errore dentro `onClick={() => JSON.parse(datoNonValido)}` **non** viene
catturato da nessun Error Boundary: va gestito con un `try/catch` locale, esattamente come fa
`firebaseErrors.js` con `getFirebaseErrorMessage`.

## Diagramma mentale

```
App.jsx
 └─ <ErrorBoundary>                      ← boundary ESTERNO, nessun fallback custom
      └─ <AppRouter>
           └─ ... tutte le pagine ...
                └─ ClientDashboard.jsx
                     ├─ <ErrorBoundary fallback={ChartErrorFallback}>
                     │    └─ <StatsChart />        ← se crasha: solo questa card sparisce
                     ├─ <ErrorBoundary fallback={ChartErrorFallback}>
                     │    └─ <BiaHistoryChart />    ← se crasha: solo questa card sparisce
                     └─ <ErrorBoundary fallback={ChartErrorFallback}>
                          └─ <XPTrendChart />       ← se crasha: solo questa card sparisce

Se un grafico crasha:
  1. getDerivedStateFromError() intercetta l'errore → hasError: true
  2. componentDidCatch() lo logga (oggi solo console.error)
  3. render() chiama fallback({ error, onReset }) invece dei children
  4. Il resto della dashboard (note, calendario, scheda) resta INTATTO
     — non risale fino al boundary esterno di App.jsx

Se un componente FUORI da un boundary interno crasha (es. un bug in ClientDashboardHeader):
  → risale fino al boundary di App.jsx → ErrorFallback full-page
```

## Errori comuni

1. **Passare `fallback={<ChartErrorFallback />}` invece di `fallback={ChartErrorFallback}`.**
   Il primo è un elemento React già istanziato (con `error`/`onReset` inesistenti al momento
   della creazione, perché a quel punto l'errore non è ancora avvenuto); `ErrorBoundary` lo
   tratterebbe come "truthy" ma tentare `this.props.fallback({...})` su un elemento (non una
   funzione) lancerebbe `TypeError: fallback is not a function` — un secondo errore, questa
   volta non catturato da nessuno (il boundary è già "rotto").
2. **Mettere un `ErrorBoundary` solo attorno alla pagina intera e mai attorno ai pezzi
   rischiosi.** Funziona, ma un singolo bug in un grafico secondario butta giù l'intera pagina —
   esattamente il problema che `ChartErrorFallback` risolve nel progetto.
3. **Dimenticare che `componentDidCatch` non ferma la propagazione di side effect già in corso.**
   Se il componente che crasha aveva già avviato una scrittura Firestore prima del crash (es. un
   `onClick` che chiama `saveXPUseCase` e poi un `setState` successivo esplode), l'Error Boundary
   cattura solo l'errore di render — non fa rollback di operazioni asincrone già partite.
4. **Aspettarsi che l'Error Boundary catturi errori dentro `try/catch` già gestiti.** Se un
   hook cattura già l'errore con `try/catch` e lo trasforma in uno stato `error` mostrato via
   JSX condizionale, l'Error Boundary non se ne accorge — perché a quel punto non è più un
   errore "lanciato" durante il render, è uno stato applicativo normale.

## Best Practice

- **Boundary a grana fine per componenti con superficie di crash alta** (grafici, parser di
  dati esterni, librerie di terze parti) — esattamente il pattern `ChartErrorFallback` nel
  progetto — contro **un boundary a grana larga** per tutto il resto (l'`ErrorBoundary` senza
  `fallback` in `App.jsx`), che fa da rete di sicurezza finale.
- **`componentDidCatch` come punto di aggancio per l'observability**, non solo `console.error`.
  Il `TODO` nel file è un promemoria onesto: in un progetto in produzione con utenti reali, un
  errore di render silenzioso (visibile solo a chi guarda la console del browser) è
  praticamente invisibile a chi gestisce il prodotto.
- **`onReset` deve essere sempre offerto**, mai solo "ricarica la pagina" — un `setState` che
  ritenta il render è un'esperienza molto meno invasiva di un reload completo (che perde lo
  stato di navigazione, form compilati altrove, ecc.).
- **Non usare Error Boundary per la gestione ordinaria degli errori** (validazione form, errori
  di rete attesi): quelli vanno gestiti con `try/catch` + stato locale + `getFirebaseErrorMessage`,
  come fa `useLoginForm.js`. L'Error Boundary è l'ultima rete, non la prima linea di difesa.

## Quiz

1. Perché `ErrorBoundary` in RankEX è un class component e non una function component con hook?
   - A) Per compatibilità con React 16
   - B) Per convenzione stilistica del team
   - C) Perché React non offre ancora un hook equivalente a `getDerivedStateFromError`/`componentDidCatch`
   - D) Perché i class component sono più performanti

2. Quale metodo di `ErrorBoundary` viene usato per **aggiornare lo state** e decidere di mostrare il fallback?
   - A) `componentDidCatch`
   - B) `getDerivedStateFromError`
   - C) `componentDidUpdate`
   - D) `render`

3. Un errore lanciato dentro un `onClick` viene catturato da un `ErrorBoundary`?
   - A) Sì, sempre
   - B) No, mai — va gestito con `try/catch` locale
   - C) Solo se il boundary ha una prop `fallback`
   - D) Solo in produzione, non in sviluppo

4. Nel codice di `ErrorBoundary.jsx`, come viene invocato un `fallback` custom passato come prop?
   - A) Come JSX: `<this.props.fallback />`
   - B) Come funzione: `this.props.fallback({ error, onReset })`
   - C) Tramite `React.createElement`
   - D) Non viene invocato, viene solo renderizzato lo state

5. Perché `ChartErrorFallback` può essere chiamato come funzione semplice (`fallback(...)`) senza violare le regole degli hook?
   - A) Perché è avvolto in un `useMemo`
   - B) Perché non contiene alcun hook al suo interno
   - C) Perché React lo trasforma automaticamente
   - D) Perché è dichiarato con `function` e non `const () =>`

6. Cosa succede se in `ClientDashboard.jsx` si scrivesse `fallback={<ChartErrorFallback />}` invece di `fallback={ChartErrorFallback}`?
   - A) Funziona comunque, React normalizza automaticamente
   - B) Il boundary tenta di chiamare l'elemento come funzione e lancia un secondo errore
   - C) Il fallback non viene mai mostrato
   - D) È equivalente, solo sintassi diversa

7. A cosa serve `getFirebaseErrorMessage` in `firebaseErrors.js`?
   - A) A catturare errori di render come un Error Boundary
   - B) A tradurre i codici errore Firebase in messaggi leggibili per l'utente finale
   - C) A loggare gli errori su un servizio esterno
   - D) A validare i dati prima di inviarli a Firebase

8. Cosa fa il bottone "RICARICA" in `ErrorFallback.jsx` a differenza di "RIPROVA"?
   - A) Chiama `onReset` come "RIPROVA"
   - B) Fa `window.location.reload()`, un reset completo del browser
   - C) Fa logout dell'utente
   - D) Non ha alcuna azione, è solo decorativo

9. Perché nel progetto ci sono boundary sia attorno a singoli grafici sia uno attorno a tutta l'app in `App.jsx`?
   - A) È ridondante, uno dei due è inutile
   - B) Per avere due livelli di isolamento: un crash in un grafico non deve buttare giù l'intera pagina, mentre un crash altrove ha comunque una rete di sicurezza finale
   - C) Perché React lo richiede per legge
   - D) Solo per motivi di performance

10. Cosa NON cattura un Error Boundary?
    - A) Un errore lanciato durante il render di un componente figlio
    - B) Un errore lanciato dentro una Promise `.then()` non gestita
    - C) Un errore lanciato in `getDerivedStateFromError` di un componente discendente
    - D) Entrambe B (parzialmente corretto solo se combinato con altro contesto — vedi spiegazione)

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **C.** Non è una scelta stilistica: `getDerivedStateFromError` e `componentDidCatch` non
   hanno equivalente come hook nell'API pubblica di React 18. È l'unica vera eccezione della
   codebase alla regola "solo function component".
2. **B.** `getDerivedStateFromError` aggiorna lo state (`hasError`, `error`) durante la fase di
   render; `componentDidCatch` (A) è per i side effect nella fase di commit, non aggiorna lo state.
3. **B.** Un `onClick` gira fuori dalla fase di render di React — l'Error Boundary osserva solo
   errori sincroni durante il render dei discendenti, non eventi o codice asincrono.
4. **B.** Riga 26 di `ErrorBoundary.jsx`: `this.props.fallback({ error: this.state.error, onReset: this.handleReset })` — chiamata diretta come funzione.
5. **B.** `ChartErrorFallback` non usa `useState`/`useEffect`/altri hook — è puro (props in, JSX
   out), quindi chiamarlo come funzione semplice invece che tramite `<Componente />` è sicuro.
6. **B.** `<ChartErrorFallback />` è un oggetto elemento React, non una funzione — tentare
   `this.props.fallback({...})` su di esso lancia `TypeError: fallback is not a function`.
7. **B.** Non ha a che fare con gli Error Boundary: traduce `err.code` (es. `auth/wrong-password`)
   in una frase italiana leggibile, con fallback su `err.message` e poi su un messaggio generico.
8. **B.** `window.location.reload()` — un reset totale (nuovo bundle, nuova sessione), diverso da
   "RIPROVA" che fa solo `setState({ hasError: false })` per ritentare il render esistente.
9. **B.** Isolamento a due livelli: boundary interni per componenti "fragili" (grafici Recharts)
   che degradano localmente, boundary esterno come ultima rete di sicurezza per tutto il resto.
10. **B.** Una Promise `.then()` non gestita gira fuori dalla fase di render sincrona osservata da
    React — non viene catturata da nessun Error Boundary (serve gestione esplicita, es.
    `.catch()` o `try/catch` in una funzione `async`).

## Esercizi

1. **Facile.** Apri [`ErrorFallback.jsx`](../../src/components/common/ErrorFallback.jsx) e
   aggiungi, sotto il messaggio `error?.message`, un piccolo testo condizionale che appare
   solo se `import.meta.env.DEV` è vero, mostrando `error?.stack` (utile in sviluppo, mai in
   produzione).
2. **Facile-medio.** In [`ClientDashboard.jsx`](../../src/features/client/ClientDashboard.jsx),
   trova un quarto componente che renderizza dati potenzialmente instabili (non un grafico) e
   valuta se meriterebbe anch'esso un `ErrorBoundary` con `ChartErrorFallback` — motiva la tua
   scelta per iscritto (perché sì o perché no).
3. **Medio.** Scrivi un piccolo componente `BuggyTest.jsx` che lancia `throw new Error('test')`
   se una prop `crash` è `true`, montalo temporaneamente dentro un `<ErrorBoundary
   fallback={ChartErrorFallback}>` in una pagina qualsiasi, e verifica manualmente (via browser)
   che il fallback compatto scatti senza portare giù il resto della UI. Rimuovilo dopo il test.
4. **Medio-difficile.** Il `TODO` in `componentDidCatch` suggerisce Sentry. Senza integrare
   davvero un servizio esterno, scrivi la funzione `logErrorToService(error, info)` che
   `componentDidCatch` dovrebbe chiamare, con la firma che avrebbe un vero SDK di error tracking
   (es. `{ error, componentStack: info.componentStack, userAgent: navigator.userAgent, env: ENV }`)
   — così il giorno che deciderai di collegare un servizio reale, il punto di aggancio è già pronto.
5. **Difficile.** `getFirebaseErrorMessage` ha una mappa fissa di codici. Analizza
   `useLoginForm.js`, `ChangePasswordScreen.jsx` e qualunque altro file che chiama
   `getFirebaseErrorMessage` (cerca con grep `getFirebaseErrorMessage` in `src/`) e verifica se
   ci sono codici di errore Firebase realmente possibili in quei flussi (es. `auth/weak-password`
   per il cambio password) che non sono nella mappa — proponi le aggiunte mancanti.

## Challenge

`AtletaTab.jsx` (dentro `client-dashboard/`, la card riepilogo avatar+rank+XP in cima alla
dashboard cliente, vista sia da trainer che da client) **non** è avvolto da nessun
`ErrorBoundary` oggi — è tra i primi elementi renderizzati e un suo crash farebbe salire l'errore
fino al boundary esterno di `App.jsx`, con conseguente `ErrorFallback` full-page e perdita
dell'intera dashboard, anche se il resto (note, calendario, scheda allenamento) starebbe
funzionando benissimo. Aggiungi un `ErrorBoundary` con `fallback={ChartErrorFallback}` (o, se lo
ritieni più adatto per un componente che non è un grafico, crea una variante testuale simile ma
con un messaggio pertinente, es. "Impossibile mostrare il riepilogo atleta") attorno al punto in
cui `AtletaTab` viene montato in `ClientDashboard.jsx`, verifica che il resto della dashboard
resti intatto simulando un crash controllato (es. accedendo temporaneamente a una proprietà di un
oggetto `undefined` dentro `AtletaTab`), e poi rimuovi il crash di test.
