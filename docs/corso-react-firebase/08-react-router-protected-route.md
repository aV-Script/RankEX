# Lezione 8 — React Router, lazy loading, ProtectedRoute
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire come RankEX decide "cosa mostrare" in base all'URL e al ruolo dell'utente loggato:
il meccanismo di matching di React Router, perché le 4 aree principali dell'app sono
caricate con `lazy()`, e come `ProtectedRoute` decide — con quattro semplici `if` — se
lasciarti passare, mostrarti un loading, o rediretti altrove. È l'ultimo tassello prima di
Firebase Auth (lezione 9): qui vediamo *dove* arrivano `user` e `profile`, nella prossima
vediamo *come* vengono prodotti.

## Concetti teorici

### 📎 Approfondimento: React Router — Routes, Route, Navigate

React Router è la libreria che permette a una Single Page Application (un'unica pagina HTML,
`index.html`, che React riscrive dinamicamente) di comportarsi come se avesse più "pagine",
senza mai ricaricare il browser. In RankEX questo è visibile fin da `main.jsx`
([`src/main.jsx`](../../src/main.jsx)), dove tutto è avvolto in `<BrowserRouter>`: questo
componente si aggancia alla History API del browser (la stessa che gestisce i tasti
avanti/indietro) e tiene traccia dell'URL corrente senza mai fare una richiesta HTTP di
pagina intera.

Dentro `<BrowserRouter>`, il componente `<Routes>` funziona come un centralino telefonico:
riceve l'URL corrente e lo confronta con l'elenco dei suoi figli `<Route path="..." .../>`,
scegliendo quello che corrisponde. A differenza di un centralino che smista una telefonata a
UN operatore, `<Routes>` sceglie e monta **un solo** `<Route>` alla volta (non più figli
contemporaneamente) — è la vista esclusiva per quell'URL.

`<Navigate to="..." />` è invece un componente "che agisce": quando React lo monta, invece di
disegnare qualcosa a schermo, dice al router "cambia strada, vai a questo URL". È il modo
dichiarativo (JSX) di fare quello che con `useNavigate()` faresti in modo imperativo dentro un
gestore di eventi. In RankEX non è mai presente `useNavigate` (lo vedremo tra poco) — ogni
redirect passa da `<Navigate>` renderizzato condizionalmente.

Analogia: pensa a `<Routes>` come all'insegna luminosa fuori da un teatro con più sale — in
base al biglietto che hai (l'URL), l'insegna si accende su UNA sala sola. `<Navigate>` è
l'usciere che, se hai sbagliato sala, ti riaccompagna fisicamente a quella giusta.

### 📎 Approfondimento: `lazy()` + `Suspense` — code splitting

Quando Vite compila l'app, normalmente produce un unico bundle JavaScript (o pochi bundle
grossi) che il browser deve scaricare ed eseguire prima di mostrare qualsiasi cosa. Più il
bundle è grande, più il primo caricamento è lento — e questo è un problema serio per un'app
dove un cliente non userà **mai** il codice di `SuperAdminView`, e un super_admin non userà
**mai** quello di `ClientView`.

`lazy(() => import('...'))` dice a Vite: "non includere questo modulo nel bundle principale,
mettilo in un file JS separato (un *chunk*) che verrà scaricato solo quando serve davvero".
Il problema è che `import()` dinamico restituisce una `Promise` — e React non sa disegnare una
Promise a schermo. Qui entra `<Suspense fallback={...}>`: è un "recinto" che dice a React
"se uno dei miei figli sta ancora aspettando qualcosa (un chunk lazy, tipicamente), mostra
`fallback` al posto suo finché non è pronto".

Analogia: `lazy()` è come ordinare al ristorante solo quando arrivi al tavolo, invece di farti
consegnare a casa l'intero menu di piatti già pronti la mattina — cucini (scarichi) solo il
piatto (chunk) che il cliente ha effettivamente ordinato. `Suspense` è il cameriere che, mentre
il piatto è in cucina, ti porta un bicchiere d'acqua (il `fallback`) per non farti restare a
fissare il tavolo vuoto.

### Il pattern "data-driven routing"

Invece di scrivere quattro blocchi `<Route path="/admin" element={<ErrorBoundary>...}/>` uno
sotto l'altro (ripetendo la stessa struttura JSX quattro volte, cambiando solo path/ruoli/
componente), RankEX definisce **un array di dati** — `PROTECTED_ROUTES` in
[`routes.config.jsx`](../../src/app/routes.config.jsx) — e poi `AppRouter` lo trasforma in
JSX con un solo `.map()`. È lo stesso principio "config-driven UI" che troverai in
`trainer.config.jsx` (mappa `PAGES`) e in `navItems.config.jsx` — un tema ricorrente in
RankEX, che la lezione 19 tratterà in modo trasversale. Qui vediamo la sua prima e più
importante applicazione: il routing stesso.

### Il pattern render-prop: `element: (user, profile, helpers) => (...)`

Il dettaglio più delicato di `routes.config.jsx` è che il campo `element` di ogni oggetto
in `PROTECTED_ROUTES` **non è JSX**, è una **funzione che restituisce JSX**. Il motivo è
temporale: `PROTECTED_ROUTES` viene definito a livello di modulo, quando il file viene
importato — in quel momento non esiste ancora nessun `user` loggato, nessun `profile`: quei
valori nascono dentro `useAuth()` solo quando l'app gira nel browser e Firebase risponde.

Se `element` fosse un elemento JSX statico (`element: <TrainerView/>`), non avrebbe modo di
ricevere `user`/`profile`/`org` aggiornati ad ogni render. Rendendolo una funzione, chi la
consuma (`AppRouter`) può invocarla **al momento del render**, passandole i valori correnti:
`element(user, profile, { org, terminology, refreshProfile })`. È lo stesso principio delle
render-prop di React: una funzione passata come dato, che il ricevente chiama quando e con
cosa vuole lui, invece di un valore già "cristallizzato" in anticipo.

## Dove compare nel progetto

- [`src/app/AppRouter.jsx`](../../src/app/AppRouter.jsx) — il router vero e proprio
- [`src/app/routes.config.jsx`](../../src/app/routes.config.jsx) — configurazione dati delle route protette + `ROLE_REDIRECT`
- [`src/components/common/ProtectedRoute.jsx`](../../src/components/common/ProtectedRoute.jsx) — il gate di accesso
- [`src/app/App.jsx`](../../src/app/App.jsx) — chi monta `AppRouter` e con quali props
- [`src/main.jsx`](../../src/main.jsx) — chi monta `<BrowserRouter>`
- [`src/features/trainer/trainer.config.jsx`](../../src/features/trainer/trainer.config.jsx) — stesso pattern data-driven, ma per le sotto-pagine interne al trainer (senza React Router — vedi nota più sotto)

## Analisi del codice

### `main.jsx` — dove nasce il routing

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <App />
    </ToastProvider>
  </BrowserRouter>
)
```

`<BrowserRouter>` è il livello più esterno possibile: tutto ciò che sta sotto (incluso
`<App/>`, che monta `<AppRouter/>` molti livelli più in basso) può usare `<Routes>`,
`<Route>`, `<Navigate>`. Se questo wrapper mancasse, `<Routes>` dentro `AppRouter.jsx`
lancerebbe un errore a runtime ("You cannot render a `<Routes>` outside a `<Router>`").

### `AppRouter.jsx` — riga per riga

```jsx
export function AppRouter({ user, profile, org, terminology, refreshProfile }) {
  const role = profile?.role
```

`AppRouter` non fa nessuna fetch, nessuna chiamata Firebase: riceve tutto già pronto come
prop da `App.jsx`. `role` viene derivato con optional chaining (`profile?.role`) — se
`profile` è `undefined` o `null`, `role` è semplicemente `undefined`, senza lanciare errori.
Questo tornerà utile tra poco.

```jsx
<Route
  path="/login"
  element={
    user && role
      ? <Navigate to={ROLE_REDIRECT[role] ?? '/login'} replace />
      : <LoginPage />
  }
/>
```

La route `/login` è l'unica definita direttamente in `AppRouter.jsx` (non nell'array
`PROTECTED_ROUTES`, perché non è "protetta" da nessun ruolo — è l'ingresso). La logica: se
`user` è loggato **e** ha un `role` risolto, non ha senso mostrargli di nuovo il form di
login — lo si rispedisce direttamente all'area sua (`ROLE_REDIRECT[role]`). Altrimenti,
mostra `<LoginPage/>`.

Nota il `?? '/login'` — è una difesa contro un `role` che esistesse ma non fosse fra le
chiavi note di `ROLE_REDIRECT` (i cinque ruoli documentati in `CLAUDE.md`): in quel caso
improbabile, invece di navigare verso `undefined` (che romperebbe il router), si ripiega
sullo stesso `/login`.

```jsx
{PROTECTED_ROUTES.map(({ path, allowedRoles, element }) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute user={user} profile={profile} allowedRoles={allowedRoles}>
        {element(user, profile, { org, terminology, refreshProfile })}
      </ProtectedRoute>
    }
  />
))}
```

Qui avviene la trasformazione dati → JSX. Per ognuno dei 4 oggetti in `PROTECTED_ROUTES`
(li vediamo tra un attimo), viene generato un `<Route>`. Il `key={path}` è richiesto da
React per qualunque lista generata con `.map()` — usa `path` perché è l'unico valore
garantito unico fra le 4 entry.

Nota bene cosa succede dentro `element={...}`: `element(user, profile, {...})` è una
**chiamata di funzione**, non un componente JSX (`<element/>` sarebbe stato sbagliato — non
esiste come tag). Il risultato di quella chiamata (un elemento JSX vero, tipo
`<ErrorBoundary><Suspense>...</Suspense></ErrorBoundary>`) diventa il figlio (`children`) di
`<ProtectedRoute>`.

Un punto sottile ma importante da capire bene: **questa riga viene eseguita per tutte e 4 le
entry ad ogni render di `AppRouter`**, indipendentemente da quale URL sia effettivamente
attivo — perché `.map()` è puro JavaScript, gira sempre su tutto l'array, prima ancora che
`<Routes>` decida quale `<Route>` mostrare davvero. Questo NON significa che tutte e 4 le
viste (`TrainerView`, `ClientView`, ecc.) vengano eseguite/montate: `element(...)` produce
solo la "ricetta" (l'albero di elementi React, cioè oggetti JS leggeri creati da
`React.createElement` sotto il cofano di JSX), non l'esecuzione vera del componente. Solo il
`<Route>` che `<Routes>` sceglie in base al path verrà effettivamente montato — cioè solo per
quello React chiamerà davvero la funzione `TrainerView(...)` ed eseguirà i suoi hook. Costruire
la "ricetta" per le altre 3 è economico (oggetti JS), montarle davvero (mount + effect) non
avviene mai per quelle non attive.

```jsx
<Route
  path="*"
  element={
    !user
      ? <Navigate to="/login" replace />
      : <Navigate to={ROLE_REDIRECT[role] ?? '/login'} replace />
  }
/>
```

Il path `"*"` è il "jolly": corrisponde a qualsiasi URL che non abbia già trovato un match
fra `/login`, `/admin`, `/org`, `/trainer`, `/client`. Include sia URL davvero inesistenti
(refusi, link rotti) sia — punto interessante — l'URL radice `/`, che non è mai definito
esplicitamente come `<Route>` da nessuna parte in questo file. Ne riparliamo tra poco negli
Errori Comuni, perché `ProtectedRoute` usa proprio `/` come destinazione di un suo redirect,
e i due meccanismi si incastrano.

### `routes.config.jsx` — la configurazione

```jsx
const TrainerView     = lazy(() => import('../features/trainer/TrainerView'))
const ClientView      = lazy(() => import('../features/client/ClientView'))
const SuperAdminView  = lazy(() => import('../features/admin/SuperAdminView'))
const OrgAdminView    = lazy(() => import('../features/org/OrgAdminView'))
```

Le quattro viste principali — un chunk JS ciascuna. `ChangePasswordScreen`, invece, è
importata in modo **eager** (riga 2, `import ChangePasswordScreen from '...'`, non `lazy`).
Il codice non lo dichiara esplicitamente, ma è ragionevole dedurne il motivo guardando come
viene usata: appare come primo possibile schermo per `org_admin`, `trainer` e `client` subito
dopo il login (quando `profile?.mustChangePassword` è vero — tipicamente un account appena
creato dal trainer con password temporanea). Renderla lazy aggiungerebbe un giro di rete in
più proprio nel momento più delicato (primo accesso), a fronte di un beneficio minimo: è un
semplice form, non un componente pesante come le viste principali.

```jsx
export const ROLE_REDIRECT = {
  super_admin:   '/admin',
  org_admin:     '/org',
  trainer:       '/trainer',
  staff_readonly:'/trainer',
  client:        '/client',
}
```

Da notare: `trainer` e `staff_readonly` puntano alla **stessa** `/trainer` — coerente con
quanto descritto in `CLAUDE.md` (`staff_readonly` usa `TrainerView` con `readonly=true`, non
una vista dedicata). Questa mappa serve in due punti di `AppRouter.jsx`: riga 15 (evitare
`/login` a chi è già loggato) e riga 37 (catch-all).

```jsx
export const PROTECTED_ROUTES = [
  {
    path:         '/admin',
    allowedRoles: ['super_admin'],
    element:      (user, profile, _helpers) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <SuperAdminView user={user} profile={profile} />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  ...
```

La entry `/admin` è l'unica che non ha bisogno del check `mustChangePassword` — coerente con
il fatto che i super_admin non passano dal flusso "account creato dal trainer con password
temporanea" descritto in `CLAUDE.md`. Nota anche `_helpers`: il parametro è dichiarato ma non
usato (prefisso `_` per convenzione, segnala esplicitamente "lo so che non lo uso").

Le altre tre entry (`/org`, `/trainer`, `/client`) condividono lo stesso scheletro:

```jsx
{profile?.mustChangePassword
  ? <ChangePasswordScreen userId={user.uid} onDone={() => refreshProfile(user.uid)} />
  : <OrgAdminView user={user} profile={profile} org={org} terminology={terminology} />
}
```

Prima di mostrare la vista vera, si controlla `profile?.mustChangePassword`: se vero, si
blocca l'utente su `ChangePasswordScreen` finché non cambia la password (vedremo il dettaglio
di `refreshProfile` nella prossima lezione). Da notare una piccola incoerenza di stile reale
fra le entry: `/org` e `/trainer` destrutturano `{ org, terminology, refreshProfile }` nella
firma della funzione, mentre `/client` (riga 62) riceve l'intero oggetto come `helpers` e
accede via `helpers.refreshProfile` (riga 66) — stessa logica, stile leggermente diverso. Non
è un bug, ma se dovessi toccare questo file conviene notare l'inconsistenza prima di
copiare/incollare un pattern dall'uno o dall'altro.

Nota anche cosa **non** riceve `ClientView`: a differenza delle altre tre viste, non riceve
`org` né `terminology` come prop — riceve solo `clientId={profile?.clientId}` e
`orgId={profile?.orgId}` (riga 67). La ragione architetturale (chi ha bisogno di cosa in base
al ruolo) esula da questa lezione, ma è un dettaglio visibile leggendo semplicemente le firme.

### `ProtectedRoute.jsx` — il gate

```jsx
export function ProtectedRoute({ user, profile, allowedRoles, children }) {
  if (!user)                  return <Navigate to="/login" replace />
  if (profile === undefined)  return <LoadingScreen />          // loading in corso
  if (profile === null)       return <Navigate to="/login" replace /> // profilo non trovato
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />
  return children
}
```

Quattro `if` in sequenza, letti dall'alto in basso come un flowchart:

1. **`!user`** — non c'è nessuno loggato su Firebase Auth → via a `/login`. Questo caso è
   raggiungibile per davvero: un utente sloggato che digita direttamente
   `rankex-app.web.app/trainer` nella barra indirizzi arriva qui.
2. **`profile === undefined`** — Firebase ha risposto (`user` esiste) ma il profilo
   Firestore non è ancora arrivato → mostra `LoadingScreen`. Analizzando `App.jsx` (che
   vedremo meglio in lezione 9) si scopre che, di fatto, `AppRouter` — e quindi
   `ProtectedRoute` — non viene mai montato finché `profile` è `undefined` per un utente
   loggato: `App.jsx` tiene il proprio `LoadingScreen` più in alto fino a quel momento. Questo
   `if` è quindi, allo stato attuale del codice, una difesa che documenta esplicitamente
   l'invariante ("qui il profilo non deve mai essere `undefined`") più che un ramo
   effettivamente raggiunto — ma è comunque corretto tenerlo: se in futuro qualcuno montasse
   `ProtectedRoute` da un altro punto (test, storybook, un refactor di `App.jsx`), continuerebbe
   a comportarsi in modo sicuro.
3. **`profile === null`** — il fetch è terminato, ma non esiste nessun documento
   `/users/{uid}` per questo utente (account Firebase Auth "orfano", senza controparte
   Firestore) → di nuovo `/login`.
4. **`!allowedRoles.includes(profile.role)`** — a questo punto `profile` è garantito essere un
   oggetto vero (i due `if` precedenti lo hanno escluso), quindi `profile.role` è sicuro da
   leggere senza `?.`. Se il ruolo non è fra quelli ammessi per questa route, redirect a `/`.

Se nessuno dei quattro `if` scatta, `return children` — cioè l'elemento JSX già costruito da
`element(...)` in `AppRouter.jsx`.

## Diagramma mentale

```
Browser naviga verso un URL
        │
        ▼
  <BrowserRouter>  (main.jsx — abilita routing SPA via History API)
        │
        ▼
     <Routes>  (AppRouter.jsx)
        │
        ├── path="/login"  ──► user&&role? Navigate(ROLE_REDIRECT) : <LoginPage/>
        │
        ├── path="/admin"    ─┐
        ├── path="/org"       │  ognuna avvolta in <ProtectedRoute>
        ├── path="/trainer"   │  generate da PROTECTED_ROUTES.map(...)
        ├── path="/client"   ─┘
        │
        └── path="*"  ──► !user? Navigate(/login) : Navigate(ROLE_REDIRECT[role])


Dentro ogni <ProtectedRoute allowedRoles=[...]>:

   !user? ────────────────► Navigate("/login")
     │ no
     ▼
   profile===undefined? ──► <LoadingScreen/>
     │ no
     ▼
   profile===null? ───────► Navigate("/login")
     │ no
     ▼
   role non ammesso? ─────► Navigate("/")  ──► ricade su path="*" ──► redirect finale
     │ no
     ▼
   render children (ErrorBoundary > Suspense > View lazy-loaded)
```

## Errori comuni

1. **Confondere `element={<Foo/>}` con `element={Foo}`.** React Router v6+ (e quindi v7)
   richiede un elemento JSX già istanziato nel prop `element`, non un riferimento al
   componente. In `routes.config.jsx` questo è garantito perché `element` è sempre una
   funzione che a sua volta *restituisce* JSX (`<ErrorBoundary>...`) — ma se qualcuno
   scrivesse un giorno `element: SuperAdminView` invece di `element: (user, profile) => (
   <SuperAdminView user={user}/>)`, `AppRouter.jsx` proverebbe a *chiamare* un componente React
   come fosse una funzione qualsiasi, con risultati inattesi.

2. **Dimenticare `replace` su `<Navigate>`.** Senza `replace`, ogni redirect aggiungerebbe
   una nuova entry nella cronologia del browser. Concretamente: un trainer che digita
   `/admin` verrebbe rimbalzato a `/` e poi a `/trainer` — con `replace` (usato ovunque in
   questi due file) quei rimbalzi *sostituiscono* le entry di history invece di accumularsi,
   quindi il tasto "indietro" del browser riporta l'utente alla pagina prima del tentativo,
   non in un loop fra `/admin`, `/` e `/trainer`.

3. **Il doppio rimbalzo via `/`.** Se un `trainer` prova ad aprire `/admin`:
   `<Routes>` fa match su `path="/admin"` (il router non sa nulla di ruoli, guarda solo il
   path) → `ProtectedRoute` verifica `allowedRoles=['super_admin']`, il ruolo `trainer` non
   c'è → `Navigate to="/"` → ma `"/"` non è un path esplicito da nessuna parte in
   `AppRouter.jsx`, quindi ricade sul catch-all `path="*"` → lì, essendo `user` truthy,
   scatta un secondo `Navigate` verso `ROLE_REDIRECT['trainer']` cioè `/trainer`. Non è un
   bug (l'utente finisce comunque dove deve), ma se stai debuggando un redirect che "sembra
   avvenire due volte", ora sai perché.

4. **Dimenticare `<Suspense>` attorno a un componente `lazy`.** Se rimuovessi il wrapper
   `<Suspense fallback={<LoadingScreen/>}>` attorno a, ad esempio, `<TrainerView/>`, React
   lancerebbe un errore a runtime del tipo "A component suspended while responding to
   synchronous input" — perché non ci sarebbe nessun confine pronto a gestire lo stato di
   attesa del chunk JS.

5. **`allowedRoles` mancante o non-array.** `ProtectedRoute.jsx` riga 8 chiama
   `allowedRoles.includes(...)` senza nessun controllo difensivo (niente `allowedRoles?.`).
   Se una nuova entry in `PROTECTED_ROUTES` dimenticasse il campo `allowedRoles`, questa riga
   lancerebbe un `TypeError` a runtime (`Cannot read properties of undefined`) — non un
   redirect pulito, un vero crash catturato solo dall'`ErrorBoundary` più esterno.

## Best Practice

**Config array + `.map()` invece di JSX ripetuto a mano.** Il vantaggio non è solo estetico:
`ROLE_REDIRECT` e `PROTECTED_ROUTES` diventano un'unica fonte di verità che altri file possono
importare e riusare (`AppRouter.jsx` li importa entrambi). Se domani si aggiungesse un sesto
ruolo, il lavoro nel routing si riduce ad aggiungere UNA entry nell'array e UNA riga nella
mappa — non a duplicare/adattare un blocco JSX di 10 righe.

**Lazy-loading dei 4 rami principali.** Ha senso proprio perché i 4 ruoli sono
*mutuamente esclusivi* per sessione: un utente è sempre e solo uno fra
super_admin/org_admin/trainer(-readonly)/client, non passa mai da uno all'altro nella stessa
sessione (richiederebbe un logout/login). Caricare comunque tutto il codice delle altre 3 aree
sarebbe puro spreco di banda al primo caricamento. Lo stesso principio, applicato a grana più
fine, torna in `trainer.config.jsx`, dove solo `TestGuidePage` è lazy fra le pagine interne
del trainer, perché — come dice il commento nel file — è "aperta raramente rispetto alle altre
pagine".

**Doppio livello di `ErrorBoundary`.** `App.jsx` ha già un `<ErrorBoundary>` che avvolge
`<AppRouter>` per intero (visibile a riga 46 di `App.jsx`); eppure ogni singola entry di
`PROTECTED_ROUTES` è avvolta in un **proprio** `<ErrorBoundary>` locale. È difesa in
profondità: oggi, con un solo ramo montato alla volta, l'effetto pratico dei due livelli è
quasi identico; ma se in futuro l'app rendesse più rami contemporaneamente (es. un layout con
sidebar persistente + contenuto), l'`ErrorBoundary` per-ramo eviterebbe che un crash in una
sola vista abbatta l'intera shell dell'applicazione.

**Nessuna route annidata, deliberatamente.** Un dato di fatto interessante, verificabile con
una ricerca testuale: `react-router-dom` è importato SOLO in tre file di tutto `src/`
(`main.jsx`, `AppRouter.jsx`, `ProtectedRoute.jsx`). Nessun `useNavigate`, nessun
`useParams`, nessuna `<Route>` annidata dentro `TrainerView` o le sue sotto-pagine — la
navigazione fra `ClientsPage`, `GroupsPage`, `TestGuidePage` ecc. avviene con un pattern
diverso, puramente basato su stato React e una mappa `PAGES` (che vedrai in
`trainer.config.jsx`), non sull'URL. Significa che l'intera app RankEX ha, di fatto, solo
5-6 URL possibili in totale. È una scelta architetturale reale con un trade-off reale: si
perde la possibilità di fare un link diretto a "il cliente Mario alla tab Note" (l'URL resta
sempre `/trainer`), ma si guadagna semplicità — zero gestione di path relativi, `<Outlet/>`,
parametri di route. Non è né giusto né sbagliato in assoluto: è coerente con un'app dove
l'utente naviga quasi sempre dentro la stessa sessione, senza necessità di condividere link
profondi.

## Quiz

1. Cosa succede se apri l'app su `rankex-app.web.app/xyz` (path inesistente) mentre sei
   loggato come `trainer`?
   - A. Vedi una pagina 404 bianca
   - B. `<Routes>` matcha `path="*"`, `user` è truthy, quindi vieni rediretto a
     `ROLE_REDIRECT['trainer']` cioè `/trainer`
   - C. L'app va in crash e mostra l'ErrorBoundary
   - D. Vieni rediretto a `/login`

2. In `AppRouter.jsx`, perché `element(user, profile, { org, terminology, refreshProfile })`
   è una chiamata di funzione invece di un elemento JSX diretto tipo `<TrainerView .../>`?
   - A. Perché React Router richiede sempre funzioni nel prop `element`
   - B. Perché al momento in cui `PROTECTED_ROUTES` viene definito (fuori da qualunque
     componente) `user`/`profile`/`org` non esistono ancora — la funzione li riceve solo
     quando `AppRouter` la invoca durante il render
   - C. È solo una preferenza di stile, non cambia nulla
   - D. Per evitare il warning "each child in a list should have a unique key"

3. In `ProtectedRoute.jsx`, cosa distingue `profile === undefined` da `profile === null`?
   - A. Sono equivalenti, entrambi indicano "non loggato"
   - B. `undefined` significa che il fetch del profilo è ancora in corso; `null` significa
     che il fetch è terminato ma non ha trovato un documento
   - C. `undefined` è per i super_admin, `null` per i client
   - D. Nessuna differenza logica, solo stile di codice

4. Perché `TrainerView`, `ClientView`, `SuperAdminView` e `OrgAdminView` sono importati con
   `lazy(() => import(...))` invece che con un normale `import` in cima al file?
   - A. Perché altrimenti non funzionerebbero con Firebase
   - B. Per fare code-splitting: ogni ramo diventa un chunk JS separato, scaricato solo
     quando quel ruolo effettivamente accede alla sua area, riducendo il bundle iniziale
   - C. È un requisito obbligatorio di React Router v7
   - D. Per evitare che i quattro componenti condividano lo stato

5. Cosa fa `replace` nella prop di `<Navigate to="/login" replace />`?
   - A. Ricarica la pagina
   - B. Sostituisce la entry corrente nella history del browser invece di aggiungerne una
     nuova, evitando che il tasto "indietro" rimbalzi sulla stessa redirect
   - C. Rimpiazza il componente `LoginPage` con un altro
   - D. Cancella tutta la cronologia del browser

6. Un trainer digita manualmente nella barra indirizzi `rankex-app.web.app/admin`. Cosa
   succede, in base al codice di `AppRouter.jsx` + `ProtectedRoute.jsx`?
   - A. `<Routes>` matcha `path="/admin"`, `ProtectedRoute` verifica
     `allowedRoles=['super_admin']`, il ruolo `trainer` non è incluso → redirect a `/` → che
     a sua volta matcha `path="*"` → redirect finale a `/trainer`
   - B. Vede la SuperAdminView per un istante prima del redirect
   - C. L'app crasha perché `SuperAdminView` non è mai stata caricata
   - D. Rimane bloccato su `/admin` con una pagina bianca

7. Perché in `routes.config.jsx` ogni ramo (`/org`, `/trainer`, `/client`) è avvolto sia in
   `<ErrorBoundary>` che in `<Suspense fallback={<LoadingScreen/>}>`?
   - A. Sono ridondanti, uno dei due potrebbe essere rimosso senza effetti
   - B. `Suspense` gestisce l'attesa del chunk JS lazy-loaded (stato "loading"),
     `ErrorBoundary` gestisce un eventuale errore di rendering runtime (stato "errore") — due
     failure mode diversi, due meccanismi diversi
   - C. `ErrorBoundary` serve solo in sviluppo, non in produzione
   - D. `Suspense` sostituisce `ErrorBoundary` nelle versioni più recenti di React

8. Se rimuovessi la riga `key={path}` dal `.map` che genera i `<Route>` in `AppRouter.jsx`,
   cosa cambierebbe concretamente nel comportamento visibile dell'app?
   - A. L'app smetterebbe di funzionare
   - B. Nulla di visibile nell'uso normale (`PROTECTED_ROUTES` è un array statico, definito
     una sola volta) — ma React stamperebbe un warning in console, ed è comunque una
     convenzione da rispettare sempre per liste generate con `.map()`
   - C. Le route perderebbero il controllo di `allowedRoles`
   - D. `ProtectedRoute` non riceverebbe più `children`

9. Cosa rappresenta `PROTECTED_ROUTES` di per sé, prima che `AppRouter` lo consumi?
   - A. Un elenco di componenti React già istanziati e pronti al montaggio
   - B. Un semplice array JS di oggetti `{ path, allowedRoles, element }` — dati puri,
     nessun JSX viene "montato" finché `AppRouter` non esegue `.map()` e chiama `element(...)`
   - C. Una configurazione letta da Firestore a runtime
   - D. Un hook custom che restituisce le route disponibili

10. Nel confronto `user && role ? <Navigate .../> : <LoginPage/>` (righe 14-16 di
    `AppRouter.jsx`), in quale scenario reale `user` è truthy ma `role` è falsy?
    - A. Mai, è impossibile per come è strutturato `useAuth`
    - B. Quando l'utente è autenticato su Firebase Auth ma il suo documento `/users/{uid}`
      non esiste (o legge fallisce) — `profile` diventa `null`, quindi `profile?.role` è
      `undefined`
    - C. Solo per i super_admin
    - D. Solo durante il primo secondo dopo il login, sempre

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre — confrontare le tue risposte con le
spiegazioni è molto più utile che leggerle direttamente.

1. **B.** Il catch-all `path="*"` intercetta qualunque URL non riconosciuto; con `user`
   presente, il redirect va verso l'area del ruolo, non verso `/login` (D, sbagliata: quel
   ramo è per `!user`). Non c'è nessuna pagina 404 gestita (A) né alcun motivo di crash (C).

2. **B.** È la spiegazione corretta del pattern render-prop: la funzione riceve i valori
   runtime solo quando viene invocata da `AppRouter`. A è falso: React Router accetta
   normalissimi elementi JSX in `element` (`<Route element={<Foo/>}/>` è l'uso standard) —
   qui è una scelta del progetto, non un vincolo della libreria. C sottovaluta un dettaglio
   architetturale reale. D è totalmente estraneo al motivo (le `key` riguardano `.map()`,
   non `element`).

3. **B.** È esattamente la distinzione a 3 stati che vedremo approfondita in lezione 9.
   A e D negano una differenza che invece è centrale nel codice (righe 6-7 di
   `ProtectedRoute.jsx` la trattano con due `if` separati). C è inventata, nessun codice lo
   suggerisce.

4. **B.** Code-splitting per ridurre il bundle iniziale — coerente col fatto che i 4 rami
   sono mutuamente esclusivi per sessione. A e C sono false affermazioni generiche su
   Firebase/React Router. D è sbagliata: la condivisione di stato fra i rami non c'entra con
   `lazy()`, che riguarda solo il caricamento del codice.

5. **B.** `replace` sostituisce l'entry di history corrente. A e C descrivono comportamenti
   che `Navigate` non ha. D è eccessiva: `replace` tocca solo l'entry corrente, non l'intera
   cronologia.

6. **A.** È il "doppio rimbalzo" descritto negli Errori Comuni: `/admin` matcha per path, ma
   `ProtectedRoute` nega l'accesso per ruolo e manda a `/`, che a sua volta ricade sul
   catch-all. B è falsa: `SuperAdminView` non viene mai montata (il match su `allowedRoles`
   avviene prima che il `children` — cioè la vista lazy — venga effettivamente reso). C è
   falsa, non c'è nessun crash. D è falsa, non resta bloccato: viene rediretto.

7. **B.** Due failure mode distinti richiedono due meccanismi distinti: `Suspense` non sa
   gestire un errore di rendering, `ErrorBoundary` non sa gestire un chunk ancora in
   caricamento. A è sbagliata proprio per questo. C è falsa, `ErrorBoundary` è attivo sempre.
   D è falsa, sono meccanismi complementari non alternativi.

8. **B.** L'assenza di `key` produce solo un warning React in console quando si genera una
   lista con `.map()`; qui l'array è statico quindi l'impatto pratico è nullo, ma la
   convenzione va comunque rispettata (specialmente se in futuro l'array diventasse
   dinamico). A, C, D attribuiscono a `key` effetti che non ha — `key` è puramente
   un'informazione per l'algoritmo di reconciliation di React, non tocca `allowedRoles` né
   `children`.

9. **B.** È letteralmente un array JS di oggetti — nessun elemento React viene creato finché
   `AppRouter` non esegue `.map()` e chiama le funzioni `element`. A confonde "dati di
   configurazione" con "elementi già montati". C e D inventano meccanismi non presenti nel
   codice (nessuna lettura Firestore, nessun hook custom qui).

10. **B.** È uno scenario concreto: se `getUserProfile` fallisce o il documento non esiste,
    `profile` diventa `null` (vedremo il dettaglio esatto in lezione 9), quindi
    `profile?.role` vale `undefined`, che è falsy. A è sbagliata proprio perché questo
    scenario esiste ed è gestito nel codice. C e D sono ipotesi non supportate — non c'è
    nulla di specifico ai super_admin né un timer fisso "un secondo" in questa logica.

## Esercizi

1. **(facile)** Apri [`routes.config.jsx`](../../src/app/routes.config.jsx) e, senza
   eseguire nulla, disegna a mano la tabella `path → allowedRoles → componente` per le 4
   route protette. Confrontala poi con quanto scritto nel file.

2. **(facile-medio)** Aggiungi temporaneamente un `console.log('element invocato per', path)`
   dentro ciascuna delle 4 funzioni `element` in `routes.config.jsx` (puoi mettere il log
   fuori dalla funzione stessa, oppure come prima riga del corpo). Avvia l'app in dev, fai
   login come trainer e osserva in console quante volte — e quando — ciascuna funzione viene
   chiamata. Verifica sperimentalmente l'affermazione fatta in questa lezione: tutte e 4
   vengono invocate ad ogni render di `AppRouter`, ma solo una viene davvero montata. Ricorda
   di rimuovere i log al termine.

3. **(medio)** `ProtectedRoute.jsx` riga 8 fa `allowedRoles.includes(profile.role)` senza
   controllare se `allowedRoles` esiste. Scrivi (come commento, senza modificare il file
   reale) la riga che renderebbe il controllo sicuro anche se `allowedRoles` fosse
   `undefined`, e verifica in `routes.config.jsx` se esiste davvero un'entry che potrebbe
   omettere quel campo.

4. **(medio-difficile)** Traccia a mano, leggendo solo il codice (senza eseguirlo), cosa vede
   un utente con `profile.role === 'staff_readonly'` che digita `/client` nella barra
   indirizzi. Segui la catena `AppRouter` → `ProtectedRoute` → redirect, indicando ogni `if`
   attraversato.

5. **(difficile)** Immagina di dover aggiungere un quinto ruolo interno, ad esempio
   `super_admin_readonly`, che deve vedere `SuperAdminView` ma in sola lettura (come già fa
   `staff_readonly` con `TrainerView`). Elenca — senza scrivere codice — esattamente quali
   righe di quali file (`routes.config.jsx`, `ProtectedRoute.jsx`, eventualmente altri)
   andrebbero toccate per farlo funzionare a livello di routing, seguendo lo stesso pattern
   già usato per `staff_readonly`.

## Challenge

Aggiungi (in locale, solo per esercizio — non serve committare) una route temporanea
`/debug-auth`, visibile **solo in development**, che mostri a schermo intero
`JSON.stringify({ user, profile, org, terminology }, null, 2)` — utile come strumento di
debug rapido senza dover aprire React DevTools. Implementala seguendo lo stesso pattern
data-driven già visto: puoi aggiungere una entry extra nell'array `PROTECTED_ROUTES` (con
`allowedRoles` molto permissivo) oppure una `<Route>` sorella dedicata direttamente in
`AppRouter.jsx`, condizionata su `isDev` (lo trovi in `utils/env.js`, e lo vedremo nel
dettaglio in lezione 10). Fai attenzione a NON lasciarla raggiungibile in produzione: pensa a
dove e come va effettuato quel controllo perché non ci finisca per errore nel bundle di prod.
