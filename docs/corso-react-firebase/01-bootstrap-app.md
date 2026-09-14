# Lezione 1 — Bootstrap dell'app: da index.html a main.jsx a App.jsx
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire cosa succede, letteralmente, nei primi millisecondi in cui un browser apre RankEX:
come un file HTML statico diventa un'applicazione React viva, chi "monta" cosa dentro cosa, e
perché `App.jsx` — il componente più in alto nell'albero — è tutto tranne che banale: gestisce
tre stati di caricamento diversi, un timeout di sicurezza, e la composizione di sei provider/guardie
prima ancora di mostrare una singola pagina reale.

## Concetti teorici

Un'applicazione React "pura" (senza framework server-side come Next.js) parte sempre da un
**entry point HTML** minimale: un solo `<div>` vuoto e un tag `<script>`. Tutto il resto — ogni
pixel che l'utente vede — viene generato da JavaScript *dopo* che la pagina è stata caricata.
Questo è il modello **SPA (Single Page Application)**: il browser scarica una pagina sola, e da
lì in poi è JavaScript a riscrivere il contenuto senza mai ricaricare l'HTML.

Per farlo, React ha bisogno di tre cose, in ordine:
1. Un punto di aggancio nel DOM reale (l'elemento `<div id="root">`).
2. Una funzione che prenda quel punto e lo trasformi in una "radice" gestita da React
   (`ReactDOM.createRoot`).
3. Un albero di componenti da renderizzare dentro quella radice (`<App />`, avvolto dai provider
   necessari).

RankEX usa **Vite** come bundler/dev server. Vite non "compila" un bundle gigante come Webpack
faceva storicamente: in sviluppo serve i moduli ES nativi del browser uno a uno (velocissimo,
niente bundling), e solo in fase di `build` produce i file ottimizzati per la produzione.

> ### 📎 Approfondimento: entry point e moduli ES
> Immagina l'HTML come il portone di un edificio e `main.jsx` come il primo impiegato che entra
> e accende tutte le luci (monta l'applicazione). Il tag `<script type="module">` dice al browser
> "questo file è un modulo ES nativo, può usare `import`/`export` senza bisogno di un bundler già
> pronto". Prima di ES Modules (2015+), ogni libreria doveva essere caricata con un `<script>`
> separato e l'ordine contava manualmente; con i moduli, è JavaScript stesso a risolvere il grafo
> delle dipendenze (`import ReactDOM from 'react-dom/client'` dice esplicitamente "ho bisogno di
> questo pacchetto, vai a prenderlo").

> ### 📎 Approfondimento: Virtual DOM e `createRoot`
> Manipolare il DOM reale del browser (`document.createElement`, `.appendChild`, ecc.) è lento,
> perché ogni modifica può forzare il browser a ricalcolare layout e ridisegnare la pagina. React
> risolve il problema con un **Virtual DOM**: una rappresentazione in memoria (semplici oggetti
> JavaScript) di come *dovrebbe* apparire l'interfaccia. Quando lo stato cambia, React costruisce
> un nuovo Virtual DOM, lo confronta ("diffing") con quello precedente, e applica al DOM reale
> **solo le differenze minime**. `ReactDOM.createRoot(nodo).render(<App />)` è l'atto di dire a
> React "prenditi in carico questo nodo del DOM reale: da qui in poi, gestiscilo tu con il tuo
> Virtual DOM". Analogia: è come dare a un elettricista (React) le chiavi di un solo interruttore
> generale (`#root`) — da lì in poi decide lui quali luci accendere/spegnere, e lo fa nel modo più
> efficiente possibile, senza che tu debba indicare interruttore per interruttore.

> ### 📎 Approfondimento: JSX (introduzione rapida)
> In `main.jsx` vedrai codice come `<BrowserRouter><ToastProvider><App /></ToastProvider></BrowserRouter>`
> dentro una chiamata a funzione (`.render(...)`). Non è HTML: è **JSX**, un'estensione di sintassi
> di JavaScript che assomiglia a HTML ma viene trasformata, in fase di build (da Vite/Babel), in
> normali chiamate a funzione (`React.createElement(BrowserRouter, null, React.createElement(...))`).
> Scrivere `<Foo prop="x" />` invece di `createElement(Foo, {prop: 'x'})` è pura leggibilità — sotto
> il cofano sono identici. La Lezione 2 la tratta in profondità con esempi presi da
> `components/ui/index.jsx`; qui basta sapere che ogni tag che vedi (maiuscolo = componente
> custom, minuscolo = tag HTML nativo) è, letteralmente, una funzione chiamata con dei parametri.

> ### 📎 Approfondimento: `useEffect` di base
> `useEffect` è l'hook che permette a un componente di eseguire codice **dopo** che React ha
> disegnato (o ridisegnato) l'interfaccia — tipicamente per "effetti collaterali" che non c'entrano
> con il calcolo del JSX: timer, sottoscrizioni, fetch di rete, log. La forma generale è:
> ```js
> useEffect(() => {
>   // codice da eseguire dopo il render
>   return () => { /* funzione di cleanup, opzionale */ }
> }, [dipendenze])
> ```
> L'array di dipendenze dice a React *quando* rieseguire l'effetto: se è vuoto (`[]`) l'effetto
> gira una sola volta al montaggio; se contiene variabili, l'effetto viene rieseguito ogni volta
> che una di quelle variabili cambia valore tra un render e l'altro. La funzione di cleanup (il
> `return` interno) viene chiamata da React **prima** di rieseguire l'effetto (o quando il
> componente viene smontato) — serve a "disfare" quello che l'effetto precedente aveva fatto
> (es. cancellare un timer, chiudere una sottoscrizione), per evitare fughe di risorse ("memory
> leak") o comportamenti fantasma. La vedremo in azione tra poco in `App.jsx` con un `setTimeout`,
> e in dettaglio nella Lezione 5.

## Dove compare nel progetto

- [`index.html`](../../index.html) — entry point HTML, root del DOM
- [`src/main.jsx`](../../src/main.jsx) — mount point React, composizione provider globali
- [`src/app/App.jsx`](../../src/app/App.jsx) — componente radice: stati di caricamento, provider applicativi
- [`src/app/AppRouter.jsx`](../../src/app/AppRouter.jsx) — routing per ruolo (analisi approfondita in Lezione 8)
- [`src/app/routes.config.jsx`](../../src/app/routes.config.jsx) — mappa ruolo → vista, lazy loading
- [`vite.config.js`](../../vite.config.js) — configurazione bundler/dev server
- [`src/features/auth/useAuth.js`](../../src/features/auth/useAuth.js) — hook che produce `user`/`profile`/`org` usati da `App.jsx`
- [`src/components/common/LoadingScreen.jsx`](../../src/components/common/LoadingScreen.jsx) — fallback di caricamento
- [`src/context/ToastContext.jsx`](../../src/context/ToastContext.jsx) — provider avvolto in `main.jsx`
- [`src/components/common/ErrorBoundary.jsx`](../../src/components/common/ErrorBoundary.jsx) — cattura errori di rendering (Lezione 20)
- [`src/hooks/useVersionCheck.js`](../../src/hooks/useVersionCheck.js) — rileva build nuove, collegato a `vite.config.js`

## Analisi del codice

### 1. `index.html` — il portone

```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
```
(righe 23-26)

Due righe fanno tutto il lavoro:
- `<div id="root">` è **vuoto** — non c'è nessun markup pre-renderizzato. Questo è importante:
  se disattivassi JavaScript nel browser, RankEX mostrerebbe una pagina bianca. È il costo
  normale di una SPA client-side-only (nessun SSR in questo progetto).
- `<script type="module" src="/src/main.jsx">` dice al browser di eseguire `main.jsx` come modulo
  ES. Da qui in poi il controllo passa a React.

Da notare anche righe 9 e 18: `<meta name="theme-color" content="#0a0f1e">` (colore della UI del
browser su mobile, es. la barra di stato Android) e `<link rel="manifest" href="/manifest.json">`
(configurazione PWA) — dettagli di piattaforma che esulano da React ma fanno parte del bootstrap
"vero" dell'app quando viene installata come PWA.

### 2. `vite.config.js` — come Vite costruisce il tutto

```js
// vite.config.js, righe 22-36
export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin, ...visualizerPlugin],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          recharts: ['recharts'],
          vendor:   ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
```

`react()` è il plugin ufficiale che insegna a Vite a trasformare JSX in `createElement(...)` (fa
anche da "trasformatore" per il Fast Refresh in sviluppo — le modifiche a un componente si
riflettono nel browser senza perdere lo stato). `tailwindcss()` è il plugin `@tailwindcss/vite`:
lo tratteremo nella Lezione 3, per ora basti sapere che è lui a leggere `src/index.css` e generare
il CSS finale — non esiste un `tailwind.config.js` classico in questo repo (verificato: nessun
file con quel nome nella root), perché Tailwind v4 è "CSS-first" e la configurazione vive dentro
il CSS stesso.

`manualChunks` è un'ottimizzazione di build: invece di lasciare che Rollup (il bundler sotto
Vite) metta tutto in un unico file JS enorme, questa configurazione forza tre "pacchetti"
separati — `firebase`, `recharts`, `vendor` (React + Router). Perché ha senso farlo: sono le tre
librerie più pesanti del progetto, e separandole in chunk dedicati il browser può metterle in
cache indipendentemente. Se domani aggiorni solo il codice applicativo (non le dipendenze), gli
utenti che tornano sul sito **non devono riscaricare** `firebase`/`recharts`/`vendor` — la cache
del browser li serve dalla cache locale, e scarica solo il chunk applicativo cambiato.

Il dettaglio più interessante è `versionPlugin` (righe 15-20):
```js
const versionPlugin = {
  name: 'version-json',
  writeBundle() {
    writeFileSync('dist/version.json', JSON.stringify({ v: Date.now() }))
  },
}
```
Questo plugin, a ogni `build`, scrive un file `dist/version.json` con un timestamp. Non è
decorativo: è la metà server-side di `useVersionCheck.js`, che ogni 5 minuti (`POLL_MS = 5 * 60 *
1000`, riga 3 del file) fa `fetch('/version.json?t=...')`, confronta il valore `v` ricevuto con
quello memorizzato al primo caricamento (`current.current`), e se sono diversi imposta
`hasUpdate = true` — che in `App.jsx` (righe 53-70) fa comparire il banner "Nuova versione
disponibile". È un esempio concreto di come una riga di config di build (`vite.config.js`) e un
hook applicativo (`useVersionCheck.js`) siano due metà dello stesso meccanismo, pur non
importandosi mai a vicenda direttamente — comunicano tramite un file statico.

### 3. `main.jsx` — il mount

```jsx
// src/main.jsx, tutto il file
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.jsx'
import { ToastProvider } from './context/ToastContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <App />
    </ToastProvider>
  </BrowserRouter>
)
```

Riga per riga:
- `document.getElementById('root')` recupera il `<div>` vuoto di `index.html`.
- `ReactDOM.createRoot(...)` lo trasforma in una radice React (vedi approfondimento sopra).
- `.render(<BrowserRouter>...</BrowserRouter>)` disegna l'albero.
- `import './index.css'` — nota che il CSS viene importato **da JavaScript**, non con un
  `<link>` in `index.html`. È Vite/Tailwind a gestirlo: in dev lo inietta via JS per il hot
  reload, in build lo estrae in un file `.css` fisico linkato automaticamente nell'HTML finale.

La parte concettualmente più importante è **l'ordine di annidamento dei provider**:
`BrowserRouter` è il più esterno, `ToastProvider` è nel mezzo, `App` è il più interno.

> ### 📎 Approfondimento: composizione dei Provider (Context, in breve)
> Un "Provider" in React è un componente che rende disponibile un valore (dati, funzioni) a
> *tutti* i suoi discendenti, a qualunque profondità, senza doverlo passare manualmente come prop
> a ogni livello (il problema che si chiama "prop drilling"). `BrowserRouter` fornisce il contesto
> di routing (permette a qualunque componente sotto di lui di sapere "in che URL siamo" o di
> navigare); `ToastProvider` fornisce la funzione per mostrare notifiche toast a qualunque
> componente sotto di lui, ovunque si trovi nell'albero. L'analogia: sono come impianti condivisi
> di un edificio (elettricità, acqua) — li installi ai piani alti (esterni), e ogni stanza (ogni
> componente) sotto può "attaccarsi alla presa" senza che tu debba far passare un cavo dedicato da
> ogni piano. Approfondiremo `Context` + `useReducer` nella Lezione 7 su `TrainerContext`.

Perché `ToastProvider` è **dentro** `BrowserRouter` e non fuori? Nel codice non c'è un commento
esplicito che lo giustifichi, ma il ragionamento architetturale è: `ToastProvider` non ha bisogno
di sapere in che rotta ci troviamo, quindi in teoria l'ordine tra questi due specifici provider
sarebbe intercambiabile. Quello che *non* è intercambiabile è che entrambi devono stare **sopra**
`<App />`, perché `App.jsx` e tutto ciò che renderizza (incluso `AppRouter`) hanno bisogno sia del
routing sia dei toast.

### 4. `App.jsx` — il cuore del bootstrap

Qui la logica si fa seria. Partiamo dagli stati:

```jsx
// src/app/App.jsx, righe 15-23
export default function App() {
  const { user, profile, org, terminology, refreshProfile } = useAuth()
  const [timedOut, setTimedOut]                             = useState(false)

  const { showWarning: showSessionWarning, extendSession } = useSessionTimeout(profile?.role)
  const hasUpdate = useVersionCheck()

  // true finché l'SDK auth non risponde, o finché l'utente loggato aspetta il profilo+org
  const isLoading = user === undefined || (user !== null && (profile === undefined || org === undefined))
```

`App` è un **componente funzionale**: una funzione JavaScript che ritorna JSX (la vedremo definita
formalmente in Lezione 2). Le prime righe chiamano hook: `useAuth()` (Lezione 9 la analizza
integralmente), `useState(false)` per `timedOut`, `useSessionTimeout(profile?.role)` e
`useVersionCheck()`. Nota `profile?.role`: l'*optional chaining* (`?.`) è necessario perché
`profile` può essere `undefined` (ancora in caricamento) — accedere a `.role` su `undefined` senza
`?.` lancerebbe un `TypeError` e farebbe crashare l'intera app prima ancora che l'`ErrorBoundary`
sia montato.

**La riga 23 è la più densa concettualmente di tutta la lezione.** Per capirla serve sapere come
`useAuth.js` inizializza i suoi stati:

```js
// src/features/auth/useAuth.js, righe 8-11
const [user,        setUser]        = useState(undefined)
const [profile,     setProfile]     = useState(undefined) // undefined=loading, null=non trovato
const [org,         setOrg]         = useState(undefined)
```

`user`, `profile` e `org` partono tutti da `undefined`. Solo dentro l'`useEffect` di `useAuth.js`
(righe 40-54), quando Firebase Auth chiama la callback `onAuthChange`, questi valori vengono
aggiornati a `null` (se l'utente non è loggato) oppure al valore reale. Questo produce **tre stati
distinti e distinguibili** per ciascuna variabile:
```
undefined → "non lo so ancora" (il fetch/listener non ha ancora risposto)
null      → "lo so: non c'è" (utente non loggato / profilo non trovato)
valore    → "lo so: eccolo"
```

Ora la riga 23 si legge così:
```js
const isLoading = user === undefined || (user !== null && (profile === undefined || org === undefined))
```
- `user === undefined` → l'SDK di Firebase Auth non ha ancora risposto affatto (nemmeno sa dirci
  "sei loggato" o "non sei loggato"). In questo caso siamo sicuramente in caricamento.
- **altrimenti**, se `user !== null` (cioè l'utente **è** loggato, un oggetto Firebase User) →
  dobbiamo aspettare anche `profile` e `org`, perché `useAuth.js` li recupera in sequenza *dopo*
  aver saputo chi è l'utente (righe 49-52: `setProfile(undefined)`, poi `await
  refreshProfile(u.uid)`, che a sua volta chiama `getUserProfile` e poi `getOrganization`).
- se invece `user === null` (sappiamo con certezza che **non** è loggato), l'espressione tra
  parentesi non viene nemmeno valutata (corto-circuito dell'`&&`) e `isLoading` diventa `false`
  immediatamente — non ha senso aspettare un profilo che non esisterà mai per un utente non
  loggato.

Il motivo per cui questa distinzione a tre stati è necessaria (e non un semplice booleano
`isLoading`/`isLoggedIn`) è evitare un bug molto comune nelle SPA: mostrare per un istante la
schermata di login e poi, un attimo dopo, "saltare" alla dashboard perché in realtà l'utente era
già loggato (Firebase stava solo leggendo la sessione persistita). Con il pattern a tre stati,
finché non sappiamo con certezza se l'utente è loggato o no, mostriamo *sempre* `LoadingScreen`
— mai un flash di contenuto sbagliato.

```jsx
// src/app/App.jsx, righe 25-29
useEffect(() => {
  if (!isLoading) { setTimedOut(false); return }
  const t = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS)
  return () => clearTimeout(t)
}, [isLoading])
```

Questo `useEffect` ha come unica dipendenza `isLoading`: viene rieseguito solo quando quel valore
cambia (non a ogni render). Comportamento:
- se `isLoading` è `false` → resetta `timedOut` a `false` e non fa altro (nessun timer).
- se `isLoading` è `true` → avvia un timer di `LOADING_TIMEOUT_MS` (10 000 ms, riga 13) che, se
  scatta, imposta `timedOut = true`.
- la funzione di cleanup (`return () => clearTimeout(t)`) viene chiamata da React **prima** di
  rieseguire l'effetto o quando il componente si smonta. In pratica: se `isLoading` torna `false`
  *prima* che i 10 secondi scadano (caso normale — profilo e org arrivano in fretta), React pulisce
  il vecchio timer prima che possa mai scattare. Senza questo cleanup, un timer "fantasma"
  potrebbe far comparire "CARICAMENTO FALLITO" anche dopo un caricamento riuscito.

```jsx
// src/app/App.jsx, righe 31-43
if (isLoading && timedOut) return (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <p className="font-display text-white/50 tracking-widest text-sm">CARICAMENTO FALLITO</p>
    <button onClick={() => window.location.reload()} ...>Ricarica</button>
  </div>
)
if (isLoading) return <LoadingScreen />
```

Due `return` anticipati (*early return*, pattern molto comune in React per gestire stati
alternativi senza annidare `if/else` dentro il JSX): se il caricamento è bloccato da più di 10
secondi, mostra un errore con un bottone che ricarica la pagina (`window.location.reload()` — un
vero reload del browser, non una navigazione client-side, perché a questo punto lo stato React
potrebbe essere in un vicolo cieco). Altrimenti, se è ancora `isLoading` ma nei tempi normali,
mostra `LoadingScreen` (un semplice `<div data-testid="loading">CARICAMENTO...</div>`, usato anche
dai test e2e per aspettare la fine del caricamento).

```jsx
// src/app/App.jsx, righe 44-51
return (
  <ThemeProvider>
    <ErrorBoundary>
      <DomainGuard role={profile?.role}>
        <AppRouter user={user} profile={profile} org={org} terminology={terminology} refreshProfile={refreshProfile} />
      </DomainGuard>
    </ErrorBoundary>
    {showSessionWarning && <SessionWarningDialog onExtend={extendSession} />}
```

Una volta superato il caricamento, l'albero reale si compone così, dal più esterno al più interno:
`ThemeProvider` (applica le CSS custom properties del tema attivo al `<html>`, Lezione 3) →
`ErrorBoundary` (cattura qualunque errore di rendering sotto di lui e mostra un fallback invece di
una schermata bianca, Lezione 20) → `DomainGuard` (blocca l'accesso incrociato tra dominio
`app`/`admin`, solo in produzione, Lezione 10) → `AppRouter` (decide *quale* vista mostrare in base
al ruolo). Nota che `ThemeProvider` sta **fuori** da `ErrorBoundary`: se `AppRouter` esplode con un
errore, l'`ErrorBoundary` mostra il suo fallback, ma il tema resta comunque applicato — l'errore
non "spoglia" l'interfaccia del suo stile.

### 5. `AppRouter.jsx` e `routes.config.jsx` — solo per orientarsi

```jsx
// src/app/AppRouter.jsx, righe 9-30 (estratto)
return (
  <Routes>
    <Route path="/login" element={...} />
    {PROTECTED_ROUTES.map(({ path, allowedRoles, element }) => (
      <Route key={path} path={path} element={
        <ProtectedRoute user={user} profile={profile} allowedRoles={allowedRoles}>
          {element(user, profile, { org, terminology, refreshProfile })}
        </ProtectedRoute>
      } />
    ))}
  </Routes>
)
```

`AppRouter` itera su `PROTECTED_ROUTES` (definito in `routes.config.jsx`) e genera una `<Route>`
per ciascuna voce, avvolta in `ProtectedRoute` (che verifica se `profile.role` è tra
`allowedRoles`). In `routes.config.jsx` (righe 6-9) noterai anche:
```jsx
const TrainerView = lazy(() => import('../features/trainer/TrainerView'))
```
`lazy()` + `<Suspense fallback={<LoadingScreen />}>` (usato dentro ogni `element`, es. righe 24-29)
è un meccanismo di **code-splitting**: il codice di `TrainerView` (e delle tre viste sorelle) non
viene scaricato dal browser finché l'utente non naviga effettivamente verso quella rotta. Non
approfondiamo oltre qui — è il cuore della Lezione 8 — ma è utile sapere fin da ora che il "peso"
di ogni area applicativa (trainer, client, admin, org) è isolato in un chunk JS separato, scaricato
solo quando serve.

Va anche notato, per completezza sullo stack reale: `react-router-dom` in `package.json` è alla
versione `^7.15.0` — React Router v7. Le API usate qui (`<Routes>`, `<Route>`, `<Navigate>`,
`<BrowserRouter>`) sono le stesse della v6: la libreria mantiene il pacchetto `react-router-dom`
come entry point compatibile anche nella major più recente. Il routing "vero" (nested routes,
loader, ecc.) è materia della Lezione 8 — qui interessa solo sapere che il progetto è aggiornato
alla major più recente, non a v6 come talvolta si potrebbe assumere guardando solo la sintassi.

## Diagramma mentale

```
index.html
  <div id="root"></div>
  <script type="module" src="/src/main.jsx">
        │
        ▼
main.jsx
  createRoot(#root).render(
    <BrowserRouter>              ← contesto di routing
      <ToastProvider>            ← contesto notifiche toast
        <App />
      </ToastProvider>
    </BrowserRouter>
  )
        │
        ▼
App.jsx
  useAuth() → { user, profile, org, terminology, refreshProfile }
  useSessionTimeout(profile?.role)
  useVersionCheck()
        │
        ▼
  isLoading = user === undefined
              || (user !== null && (profile === undefined || org === undefined))
        │
   ┌────┴─────┐
   │ true      │ false
   ▼           ▼
 timedOut?   <ThemeProvider>
   │           <ErrorBoundary>
  yes│no        <DomainGuard role=...>
   │  │            <AppRouter user profile org .../>
"CARICAMENTO  </DomainGuard>
 FALLITO"    </ErrorBoundary>
   │        </ThemeProvider>
  <LoadingScreen/>
```

## Errori comuni

1. **Sostituire `user === undefined` con `!user`.** Sembra equivalente ma non lo è: `!user` è
   `true` sia quando `user` è `undefined` (ancora in caricamento) sia quando `user` è `null`
   (sappiamo per certo che non è loggato). Con questa modifica, un utente non loggato vedrebbe
   `isLoading` sempre `true` (perché `user` resterebbe `null` per sempre, e `null` fa scattare
   `!user`), e l'app resterebbe bloccata su `LoadingScreen` in eterno, senza mai arrivare alla
   pagina di login.

2. **Dimenticare il `return () => clearTimeout(t)` nell'`useEffect` del timeout.** Senza cleanup,
   ogni volta che l'effetto rigira (cioè ogni volta che `isLoading` cambia) si accumula un nuovo
   `setTimeout` senza cancellare quello vecchio. Nel caso più innocuo è uno spreco di timer; nello
   scenario peggiore, un timer "vecchio" può scattare *dopo* che il caricamento è già andato a buon
   fine, mostrando "CARICAMENTO FALLITO" a un utente che in realtà sta già usando l'app.

3. **Cambiare l'array di dipendenze da `[isLoading]` a `[]`.** L'effetto partirebbe una sola volta
   al mount e non verrebbe mai più rieseguito quando `isLoading` cambia da `true` a `false` o
   viceversa — il timer di 10 secondi scatterebbe una volta sola nella vita del componente,
   rompendo la logica per qualunque transizione successiva (es. logout e nuovo login nella stessa
   sessione di navigazione).

4. **Spostare `<ToastProvider>` dentro `App.jsx` invece che in `main.jsx`.** Qualunque componente
   che ha bisogno del context dei toast (`useToastContext()`) smetterebbe di funzionare se
   renderizzato *fuori* da `App` — ad esempio in un eventuale futuro schermo di errore globale
   renderizzato prima che `App` monti. Non è il caso oggi in RankEX, ma è il tipo di accoppiamento
   implicito ("questo componente funziona solo se è dentro quel provider, in quel punto
   dell'albero") che va tenuto a mente ogni volta che si sposta un Provider.

5. **Rimuovere `profile === undefined || org === undefined` dalla condizione di `isLoading`,
   lasciando solo `user === undefined`.** L'app passerebbe ad `AppRouter` non appena Firebase Auth
   risponde, anche se `profile`/`org` sono ancora `undefined`. `DomainGuard role={profile?.role}`
   riceverebbe `undefined` per un istante, e componenti a valle che si aspettano un `role` definito
   potrebbero comportarsi in modo imprevedibile prima che il fetch di profilo/org completi.

## Best Practice

**Pattern a tre stati (`undefined`/`null`/valore) vs. flag booleano separato.** Un approccio più
"da principiante" sarebbe stato tenere uno stato dedicato `const [loading, setLoading] =
useState(true)` e impostarlo manualmente a `false` alla fine di ogni fetch. Il problema di questo
approccio è che introduce una **seconda fonte di verità**: bisogna ricordarsi di sincronizzare
`loading` con lo stato reale dei dati in ogni punto del codice (facile dimenticare un
`setLoading(false)` in un ramo di errore, per esempio). Il pattern usato in RankEX **deriva**
`isLoading` direttamente dalla forma dei dati stessi (`user === undefined`, ecc.) — non esiste un
flag separato da tenere sincronizzato, perché lo stato di caricamento *è* letteralmente "non ho
ancora un valore per questi dati". È una tecnica che vale la pena riconoscere: se ti accorgi di
avere un flag `loading` che duplica un'informazione già deducibile da altri stati, valuta se puoi
eliminarlo e derivarlo, come fa `App.jsx` qui.

**Version-check con `cache: 'no-store'` e query string univoca.** In `useVersionCheck.js` (riga
12) la fetch usa `fetch('/version.json?t=${Date.now()}', { cache: 'no-store' })`. È un dettaglio
piccolo ma corretto: senza `cache: 'no-store'` e senza un parametro sempre diverso in query string,
il browser (o un service worker) potrebbe servire una versione di `version.json` dalla cache,
vanificando l'intero scopo del controllo (che è, appunto, accorgersi che il file sul server è
cambiato).

## Quiz

1. Cosa contiene inizialmente `<div id="root">` in `index.html`?
   A) Il markup HTML della LoginPage
   B) Nulla, è un div vuoto
   C) Un commento placeholder
   D) Lo spinner di caricamento

2. Cosa fa `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`?
   A) Scarica il componente App da un server
   B) Crea una radice React gestita da React e vi disegna dentro l'albero di componenti
   C) Compila App.jsx in HTML statico una volta sola
   D) Registra un service worker

3. In `useAuth.js`, `profile` parte con `useState(undefined)`. Cosa significa `undefined` in
   questo contesto, secondo il commento in riga 9?
   A) L'utente non è loggato
   B) Il profilo è in caricamento
   C) Il profilo non esiste su Firestore
   D) Errore di rete

4. Qual è la condizione esatta di `isLoading` in `App.jsx` (riga 23)?
   A) `user === undefined`
   B) `!user || !profile || !org`
   C) `user === undefined || (user !== null && (profile === undefined || org === undefined))`
   D) `user === null && profile === null`

5. Perché la condizione usa `user !== null` (e non semplicemente `user`) prima di controllare
   `profile`/`org`?
   A) Per leggibilità, sono equivalenti
   B) Perché se `user` è `null` (non loggato) non ha senso aspettare profilo/org che non arriveranno mai
   C) Perché `null` in JavaScript è sempre falsy quindi serve un controllo esplicito per forza
   D) È un refuso, dovrebbe essere `user != null`

6. A cosa serve il `return () => clearTimeout(t)` dentro l'`useEffect` del timeout in `App.jsx`?
   A) A fermare React da un loop infinito
   B) A pulire il timer precedente prima di un nuovo giro dell'effetto o allo smontaggio del componente
   C) A resettare `timedOut` a `false`
   D) Non serve, è codice morto

7. Cosa genera `versionPlugin` in `vite.config.js`, e a cosa si collega?
   A) Un file `manifest.json`, usato dal service worker
   B) Un file `dist/version.json` con un timestamp, letto poi da `useVersionCheck.js`
   C) Un chunk `version.js` separato via `manualChunks`
   D) Nessun collegamento con il codice applicativo, è solo per debug

8. Perché in `vite.config.js` `firebase`, `recharts` e `vendor` sono chunk separati in
   `manualChunks`?
   A) Per obbligo di React Router 7
   B) Per permettere al browser di mettere in cache queste librerie pesanti indipendentemente dal codice applicativo
   C) Perché altrimenti Vite non riesce a fare il build
   D) È un requisito di Tailwind v4

9. In `App.jsx`, perché `ThemeProvider` avvolge `ErrorBoundary` e non il contrario?
   A) È indifferente, l'ordine non ha effetto
   B) Così, se `AppRouter` lancia un errore catturato da `ErrorBoundary`, il tema resta comunque applicato al fallback
   C) `ErrorBoundary` richiede obbligatoriamente `ThemeProvider` come parent diretto per motivi tecnici di React
   D) Perché `ThemeProvider` deve stare sempre più vicino possibile al DOM

10. Cosa fa `lazy(() => import('../features/trainer/TrainerView'))` in `routes.config.jsx`?
    A) Carica `TrainerView` immediatamente ma in background
    B) Rende `TrainerView` disponibile solo a `super_admin`
    C) Definisce un componente il cui codice viene scaricato dal browser solo quando serve effettivamente renderizzarlo
    D) Serve solo in sviluppo, in produzione viene ignorato

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre — le lezioni sono state generate tutte insieme,
quindi qui la correzione arriva subito invece che al tuo prossimo messaggio.

1. **B** — `<div id="root"></div>` è vuoto nel file sorgente (riga 24 di `index.html`); tutto il
   contenuto viene generato da React dopo il caricamento di `main.jsx`. (A) confonde SPA con SSR,
   (C) e (D) non hanno riscontro nel file.

2. **B** — è esattamente la definizione di `createRoot`+`render` spiegata nell'approfondimento sul
   Virtual DOM. (A) e (C) descrivono comportamenti che non esistono in questo modello client-side;
   (D) è una feature PWA gestita separatamente (manifest.json), non da `createRoot`.

3. **B** — il commento alla riga 9 di `useAuth.js` dice esplicitamente `// undefined=loading,
   null=non trovato`. (A) e (C) sono in realtà rappresentati da `null`, non `undefined` — è
   proprio la distinzione a tre stati che rende (A)/(C) sbagliate come risposta a "cosa significa
   `undefined`" specificamente. (D) non è gestito da questo stato.

4. **C** — è la riga 23 esatta di `App.jsx`. (A) ignora completamente il caso profilo/org; (B)
   userebbe `!user` che confonde "non loggato" con "sto caricando" (vedi Errore comune 1); (D) è
   una condizione che non compare mai nel codice.

5. **B** — se `user` è `null` sappiamo con certezza che non c'è nessun utente loggato, quindi
   `profile`/`org` non verranno mai popolati per definizione: aspettarli bloccherebbe l'app per
   sempre su `LoadingScreen`. (A) è falso, cambia il comportamento (vedi Errore comune 1); (C) e
   (D) non riflettono il codice reale.

6. **B** — è la funzione di cleanup di `useEffect`, eseguita da React prima di ogni rirun
   dell'effetto o allo smontaggio, per evitare timer "fantasma" (vedi approfondimento su
   `useEffect`). (A) non è come funziona React (non ci sono loop qui); (C) è compito del branch
   `if (!isLoading)`, non del cleanup; (D) è falso, senza cleanup si introduce un bug reale
   (Errore comune 2).

7. **B** — righe 15-20 di `vite.config.js` scrivono `dist/version.json` con `{ v: Date.now() }`;
   `useVersionCheck.js` lo fetcha (riga 12) e confronta `v`. (A) confonde con `manifest.json`
   (PWA, tutt'altro file); (C) non corrisponde a `manualChunks` (righe 26-34, che riguarda solo
   librerie JS); (D) è falso, il collegamento è reale anche se indiretto (via file statico).

8. **B** — è il motivo esplicitamente ragionato nell'analisi: separare i chunk permette al browser
   di cachare `firebase`/`recharts`/`vendor` indipendentemente dal codice applicativo che cambia
   più spesso. (A), (C), (D) non hanno alcun riscontro — è puramente un'ottimizzazione di caching,
   non un requisito tecnico di alcuna libreria.

9. **B** — è il ragionamento fatto nell'analisi del codice: se `ErrorBoundary` cattura un errore
   di `AppRouter`, il fallback renderizzato è comunque dentro `ThemeProvider`, quindi mantiene lo
   stile del tema attivo. (A) è impreciso, l'ordine ha un effetto osservabile; (C) non è vero, non
   c'è un simile requisito tecnico in React; (D) non è un criterio che guida la composizione qui.

10. **C** — è la definizione di *code-splitting* con `lazy()`: il modulo `TrainerView` non è nel
    bundle iniziale, viene richiesto (e scaricato) dal browser solo quando React deve renderizzarlo
    per la prima volta, mostrando nel frattempo il fallback di `<Suspense>`. (A) è il contrario di
    "lazy"; (B) confonde con `allowedRoles` di `ProtectedRoute`, un controllo separato; (D) è falso,
    il lazy-loading è attivo sia in dev che in produzione.

## Esercizi

1. **Osservazione guidata.** Apri le DevTools del browser (tab Network), ricarica RankEX in
   sviluppo (`npm run dev`) e individua la richiesta per `main.jsx`. Poi individua, tra gli
   `import` che scatenano, la richiesta per `App.jsx` e per `useAuth.js`. Annota l'ordine in cui
   arrivano.

2. **Modifica controllata.** Cambia temporaneamente `LOADING_TIMEOUT_MS` da `10_000` a `500` in
   `App.jsx` (riga 13), throttla la rete in DevTools ("Slow 3G") e osserva comparire la schermata
   "CARICAMENTO FALLITO". Poi ripristina il valore originale. Obiettivo: vedere con i tuoi occhi il
   ramo di codice che normalmente non si attiva mai in condizioni di rete normali.

3. **Traccia lo stato.** Aggiungi temporaneamente un `console.log({ user, profile, org, isLoading
   })` subito dopo la riga 23 di `App.jsx`. Fai un login completo e osserva in console quante volte
   il componente viene rieseguito e come cambiano i tre valori nel tempo, da `undefined` a `null` o
   al valore finale. Rimuovi il log al termine.

4. **Domanda di codice.** Senza eseguire nulla: se `user` diventasse `null` *dopo* essere stato un
   oggetto valido (es. un logout mentre l'app è aperta), cosa succede a `isLoading`? Verifica la tua
   risposta rileggendo `useAuth.js` righe 41-47 e la formula di `isLoading`.

5. **Esplorazione del router.** Apri `routes.config.jsx` e conta quante viste sono effettivamente
   lazy-caricate. Prova a immaginare cosa succederebbe (in termini di peso del bundle iniziale) se
   tutte e quattro venissero invece importate normalmente (senza `lazy()`) in cima al file. Non
   serve implementarlo: è un esercizio di ragionamento sul trade-off.

## Challenge

`App.jsx` mostra "CARICAMENTO FALLITO" con un semplice bottone "Ricarica" quando il timeout di 10
secondi scatta, ma non registra da nessuna parte *perché* il caricamento non è arrivato a
completamento (Firebase Auth lento? `getUserProfile` che fallisce silenziosamente? rete assente?).
Implementa un miglioramento reale e circoscritto: quando `timedOut` diventa `true`, invece di (o in
aggiunta a) mostrare solo il messaggio generico, fai un `console.warn` che stampi lo stato esatto
di `user`/`profile`/`org` in quel momento (es. `console.warn('[App] timeout caricamento', { user,
profile, org })`), così un domani, in produzione, chi guarda i log della console (o uno strumento
di monitoring collegato in futuro) può capire subito quale dei tre dati non è mai arrivato. Non
serve toccare `useAuth.js`: la modifica va fatta interamente dentro l'`useEffect` di `App.jsx`
(righe 25-29), aggiungendo la chiamata al `console.warn` nel branch in cui il timer scatta
(attenzione: `setTimeout` cattura `user`/`profile`/`org` per closure al momento in cui viene
creato, non al momento in cui scatta — verifica se questo è un problema per il tuo log e, se lo è,
capisci perché prima di "correggerlo").
