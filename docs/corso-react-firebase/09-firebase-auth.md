# Lezione 9 — Firebase Auth e ciclo utente → profilo → org
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire cosa fa davvero `useAuth()` — il custom hook che è la sorgente di verità per "chi sei,
che permessi hai, a quale organizzazione appartieni" in tutta RankEX. Analizziamo il pattern
a 3 stati (`undefined`/`null`/valore), la cascata sequenziale
utente → profilo → organizzazione → terminologia, e perché `refreshProfile` è pensata per
essere richiamata anche da fuori l'hook.

## Concetti teorici

### 📎 Approfondimento: Firebase Authentication

Firebase Auth è un servizio gestito da Google che si occupa, al posto tuo, di tutto ciò che
riguarda "chi è questo utente": verifica di email/password, emissione e rinnovo automatico di
un token di sessione (un JWT), gestione della persistenza (rimani loggato dopo un refresh
della pagina o no), reset password, ecc. Non devi costruire tu un sistema di sessioni, hashare
tu le password, gestire tu la scadenza dei token: lo fa l'SDK.

Analogia: pensa a Firebase Auth come a un buttafuori con un badge magnetico all'ingresso di un
edificio. Tu (il client React) non controlli mai da solo se una persona ha il diritto di
entrare — chiedi al buttafuori. Lui, una volta verificata l'identità, ti consegna un badge
(l'oggetto `user`, con dentro `uid`, `email`, un token) che userai per aprire le altre porte
(Firestore, Cloud Functions) — porte che a loro volta chiederanno al buttafuori "questo badge è
valido?" prima di farti passare. In [`firebase/services/auth.js`](../../src/firebase/services/auth.js)
riga 15, `export const auth = getAuth(app)` è letteralmente la connessione a questo buttafuori
per l'app Firebase configurata in `firebase/config.js`.

### 📎 Approfondimento: `onAuthStateChanged` / `onAuthChange` — un listener, non una chiamata

Il dettaglio concettuale più importante di questa lezione: `onAuthStateChanged` (esportato
come `onAuthChange` in `auth.js` riga 38) **non è** una funzione che chiami una volta e ti dà
una risposta — è un **listener** che ti iscrivi UNA volta e che Firebase richiama ogni volta
che lo stato di autenticazione cambia:

- al primo mount, con lo stato *corrente* (che potrebbe già essere "loggato", se l'SDK trova
  una sessione valida persistita da un login precedente — IndexedDB/localStorage a seconda
  della `persistence` configurata);
- ad ogni login;
- ad ogni logout;
- quando il token viene rinnovato automaticamente in background.

Questo è il motivo per cui, dopo un refresh della pagina (F5), RankEX "ricorda" che sei
loggato senza che tu debba fare nulla: non c'è nessuno stato React che sopravvive a un
refresh (React riparte sempre da zero), ma Firebase SDK ripristina la sessione da storage
persistente e richiama il listener con l'utente già presente.

Analogia: non è come chiedere "che ore sono?" (una domanda, una risposta, fine) — è come
abbonarsi a un citofono che suona ogni volta che qualcuno entra o esce dal palazzo. Non devi
controllare tu attivamente "è ancora loggato?": il citofono suona da solo quando succede
qualcosa di rilevante.

### Il pattern a 3 stati: `undefined` / `null` / valore

`useAuth.js` inizializza sia `user` che `profile` con `useState(undefined)` (righe 8-9), non
con `useState(null)`. È una scelta deliberata, commentata esplicitamente a riga 9:
`// undefined=loading, null=non trovato`. La differenza fra i due "stati vuoti" è cruciale:

- `undefined` = "non abbiamo ancora una risposta, non sappiamo ancora nulla" (sto caricando)
- `null` = "abbiamo controllato, e la risposta è: non c'è" (non loggato / documento assente)
- un valore reale = "pronto, ecco il dato"

Se si collassassero questi due stati in uno solo (es. un booleano `isLoading` +
`user: null | Object`), un componente che deve decidere cosa mostrare non potrebbe più
distinguere "sto ancora aspettando Firebase" da "ho già la risposta ed è: nessun utente". Il
sintomo tipico di questo errore è un **flash di contenuto sbagliato**: ad esempio mostrare
`<LoginPage/>` per una frazione di secondo prima di scoprire che l'utente in realtà era già
loggato, con conseguente redirect immediato — un lampo visivo fastidioso e, in casi peggiori,
un componente che tenta di leggere dati per un utente che "sembra" non loggato quando in
realtà lo è ancora da verificare. Questo pattern a 3 stati è esattamente ciò che
`ProtectedRoute.jsx` (lezione 8) sfrutta con i suoi `if` separati per `undefined` e `null`.

### La cascata sequenziale: user → profile → org → terminology

`refreshProfile` (righe 13-38) fa quattro cose, in questo ordine preciso:

1. legge il profilo Firestore (`getUserProfile(uid)`) — da questo emerge `p.orgId`
2. **solo se** `p.orgId` esiste, legge l'organizzazione (`getOrganization(p.orgId)`)
3. deriva la terminologia (`getTerminology(o?.moduleType, o?.terminologyVariant)`) — puro
   calcolo sincrono, nessuna rete
4. (implicito) tutto questo parte solo dopo che Firebase Auth ha già consegnato uno `user`

Non è una sequenza scelta per "ordine di importanza" — è una **dipendenza di dati reale**: non
puoi sapere quale organizzazione leggere finché non hai letto il profilo che contiene
`orgId`. Non è quindi possibile, né avrebbe senso, lanciare `getUserProfile` e
`getOrganization` in parallelo con `Promise.all` — il secondo argomento della seconda
chiamata non esiste finché la prima non risponde.

### Perché due livelli di `try/catch` con comportamento diverso

Guardando `refreshProfile` da vicino, si notano due `catch` con effetti molto diversi:

- il `catch` **interno** (righe 23-27), attorno a `getOrganization`: se fallisce, imposta
  `org = null` e usa una terminologia di default (`personal_training`) — un fallback
  "degradato" che permette all'app di continuare a funzionare comunque;
- il `catch` **esterno** (righe 32-37), attorno a `getUserProfile`: se fallisce, azzera
  `profile`, `org` e `terminology` tutti a `null` — un blocco totale che riporta l'app allo
  stato "non loggato/non trovato".

La differenza è la criticità del dato. Senza `profile` (che contiene `role`), l'app non sa
letteralmente cosa mostrare — nessuna vista ha senso senza sapere il ruolo, quindi il fallback
corretto è "trattalo come se non fosse loggato" (coerente con `ProtectedRoute.jsx`, che
reindirizza a `/login` quando `profile === null`). Senza `org`, invece, l'app può ancora
funzionare in una forma ridotta (con una terminologia di default) — non è ideale, ma non è
bloccante.

### Perché `refreshProfile` è esposta (non solo interna)

`useAuth()` restituisce `refreshProfile` insieme a `user`/`profile`/`org`/`terminology`
(riga 56). Il motivo: ci sono momenti in cui il documento Firestore `/users/{uid}` cambia
**senza che cambi nulla nello stato di Firebase Auth** — l'utente non fa logout/login, quindi
`onAuthStateChanged` non si attiva mai per questo. L'esempio concreto nel codice: quando un
utente con `mustChangePassword: true` completa `ChangePasswordScreen`
([`src/features/client/ChangePasswordScreen.jsx`](../../src/features/client/ChangePasswordScreen.jsx)
riga 35), scrive direttamente su Firestore `updateDoc(doc(db, 'users', userId), {
mustChangePassword: false })` — un evento invisibile a Firebase Auth. Senza un modo per dire
esplicitamente "il profilo è cambiato, ricaricalo", lo stato React `profile` resterebbe
quello vecchio (`mustChangePassword: true`) e l'utente rimarrebbe bloccato per sempre sullo
stesso schermo. Da qui i tre `refreshProfile(user.uid)` richiamati nei gestori `onDone` in
[`routes.config.jsx`](../../src/app/routes.config.jsx) (righe 38, 52, 66).

## Dove compare nel progetto

- [`src/features/auth/useAuth.js`](../../src/features/auth/useAuth.js) — l'hook centrale
- [`src/firebase/services/auth.js`](../../src/firebase/services/auth.js) — funzioni Firebase Auth (login, logout, onAuthChange, gestione account secondari)
- [`src/firebase/services/users.js`](../../src/firebase/services/users.js) — lettura/scrittura `/users/{uid}`
- [`src/firebase/services/org.js`](../../src/firebase/services/org.js) — lettura organizzazioni
- [`src/app/App.jsx`](../../src/app/App.jsx) — consuma `useAuth()`, calcola `isLoading`
- [`src/app/routes.config.jsx`](../../src/app/routes.config.jsx) — chiama `refreshProfile` dopo il cambio password obbligatorio
- [`src/features/client/ChangePasswordScreen.jsx`](../../src/features/client/ChangePasswordScreen.jsx) — chi scrive `mustChangePassword: false` e triggera il refresh

## Analisi del codice

### `useAuth.js` — l'hook, per intero

```js
export function useAuth() {
  const [user,        setUser]        = useState(undefined)
  const [profile,     setProfile]     = useState(undefined) // undefined=loading, null=non trovato
  const [org,         setOrg]         = useState(undefined)
  const [terminology, setTerminology] = useState(undefined)
```

Quattro pezzi di stato indipendenti, tutti inizializzati a `undefined` (loading). Nota che
`org` e `terminology` non hanno un commento esplicito come `profile`, ma seguono la stessa
convenzione (lo vedremo confermato più sotto, in `App.jsx`, dove `org === undefined` è usato
esattamente come "sto ancora caricando").

```js
const refreshProfile = async (uid) => {
  try {
    const p = await getUserProfile(uid)
    setProfile(p ?? null)

    if (p?.orgId) {
      try {
        const o = await getOrganization(p.orgId)
        setOrg(o)
        setTerminology(getTerminology(o?.moduleType, o?.terminologyVariant))
      } catch {
        // Org non raggiungibile (regole, rete) — procedi senza
        setOrg(null)
        setTerminology(getTerminology('personal_training'))
      }
    } else {
      setOrg(null)
      setTerminology(getTerminology('personal_training'))
    }
  } catch {
    // Profilo non raggiungibile — forza logout state
    setProfile(null)
    setOrg(null)
    setTerminology(null)
  }
}
```

Da leggere dall'esterno verso l'interno:

- `getUserProfile(uid)` (dettaglio tra poco) restituisce `null` se il documento non esiste —
  `setProfile(p ?? null)` normalizza comunque un eventuale `undefined` restituito dalla
  funzione a `null`, per non lasciare mai lo stato React "a metà".
- `if (p?.orgId)`: se il profilo non ha `orgId` (caso plausibile per un profilo mal formato, o
  potenzialmente per ruoli che non ne hanno uno significativo — il codice qui non distingue
  esplicitamente per ruolo, controlla solo l'esistenza del campo), si salta direttamente al
  ramo `else` (righe 28-31): niente organizzazione, terminologia di default.
- Il `try/catch` più interno isola SOLO il fallimento di `getOrganization` — se questa riga
  lancia (rete, permessi Firestore), il profilo (già impostato correttamente sopra) resta
  valido, e solo `org`/`terminology` degradano.
- Il `catch` più esterno cattura un fallimento di `getUserProfile` stesso — e qui la reazione
  è molto più drastica: azzera tutto e tre a `null`.

```js
useEffect(() => {
  return onAuthChange(async (u) => {
    if (!u) {
      setUser(null)
      setProfile(null)
      setOrg(null)
      setTerminology(null)
      return
    }
    setUser(u)
    setProfile(undefined)
    setOrg(undefined)
    await refreshProfile(u.uid)
  })
}, [])
```

Qui si vede il collegamento fra il "citofono" (`onAuthChange`) e lo stato React. Il `return`
in testa all'`useEffect` è particolarmente elegante: `onAuthChange(...)` (che sotto il cofano
chiama `onAuthStateChanged(auth, cb)`) restituisce **esso stesso** la funzione di
disiscrizione (`unsubscribe`) — quindi `return onAuthChange(...)` fornisce direttamente a
React la cleanup function corretta per l'effect, senza bisogno di scriverla a mano in un'altra
riga. Il dependency array vuoto `[]` significa: questo effect va eseguito una sola volta, al
mount — l'iscrizione al listener vive per tutta la vita del componente (`App.jsx`, che è
sempre montato mentre l'app gira).

Dentro il callback: se `u` è `null` (nessun utente), si azzera tutto direttamente a `null`
(nessuna cascata da fare, non c'è nessun profilo da cercare). Se `u` esiste, si nota una cosa
importante: `setProfile(undefined)` e `setOrg(undefined)` vengono **richiamati di nuovo** anche
se non è il primissimo mount — cioè, ad ogni nuovo login, lo stato torna esplicitamente a
"loading" prima di ripartire con `refreshProfile`. Questo evita che, passando da un utente A a
un utente B (scenario raro ma possibile, es. test), rimangano visibili per un istante i dati
vecchi dell'utente precedente.

### `firebase/services/auth.js` — le fondamenta

```js
export const auth = getAuth(app)

// Admin domain → session persistence (logout alla chiusura del browser)
// Tutti gli altri → local persistence (rimane loggato)
setPersistence(auth, isAdminDomain() ? browserSessionPersistence : browserLocalPersistence)
```

`getAuth(app)` crea/recupera l'istanza di Auth legata alla configurazione Firebase del
progetto (vista in `firebase/config.js`). Subito dopo, `setPersistence` decide **dove**
Firebase salva la sessione: `browserLocalPersistence` (sopravvive alla chiusura del browser —
comportamento standard "resta loggato") oppure `browserSessionPersistence` (sparisce quando
chiudi la scheda/il browser). La scelta dipende da `isAdminDomain()` — i super_admin, che
operano su un dominio separato (lo vedremo nella prossima lezione), hanno persistenza più
corta per motivi di sicurezza operativa.

```js
export const login         = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const register      = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
export const logout        = async ()    => { await auditLog(AUDIT_ACTIONS.LOGOUT); return signOut(auth) }
export const resetPassword = (email)     => sendPasswordResetEmail(auth, email)
export const onAuthChange  = (cb)        => onAuthStateChanged(auth, cb)
export const getCurrentUser = ()         => auth.currentUser
```

Un sottile wrapper attorno alle funzioni SDK di Firebase, con un'aggiunta: `logout` scrive
prima un evento di audit log (`AUDIT_ACTIONS.LOGOUT`) e solo dopo esegue `signOut(auth)` —
coerente con quanto descritto in `CLAUDE.md` sulla tracciabilità delle azioni di sessione.

```js
const SECONDARY_CONFIG = { apiKey: ..., authDomain: ..., ... }
const secondaryApp  = initializeApp(SECONDARY_CONFIG, 'secondary')
const secondaryAuth = getAuth(secondaryApp)

export async function createClientAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  return cred.user.uid
}
```

Questo è un dettaglio tecnico non banale, e vale la pena capirlo bene perché è un'insidia
reale di Firebase Auth lato client: **`createUserWithEmailAndPassword` non si limita a creare
un nuovo utente — lo autentica anche immediatamente**, sostituendo la sessione corrente.
Se un `org_admin` loggato usasse l'istanza `auth` principale per creare l'account di un nuovo
membro del team, si ritroverebbe — nello stesso browser — improvvisamente loggato come il
nuovo membro appena creato, perdendo la propria sessione. Per evitarlo, RankEX inizializza una
**seconda app Firebase** (`initializeApp(SECONDARY_CONFIG, 'secondary')` — stessa
configurazione, ma un'istanza distinta, identificata dal secondo argomento `'secondary'`) con
la propria istanza `secondaryAuth`, completamente separata da `auth`. Creare un utente lì non
tocca in alcun modo la sessione dell'org_admin che sta operando.

```js
export async function finalizeClientAccount() {
  await signOut(secondaryAuth)
}

export async function rollbackClientAccount() {
  const user = secondaryAuth.currentUser
  if (user) {
    try { await deleteUser(user) } catch {}
  }
  try { await signOut(secondaryAuth) } catch {}
}
```

Due funzioni di pulizia della sessione secondaria: `finalizeClientAccount` chiude la sessione
temporanea dopo un successo, `rollbackClientAccount` la annulla del tutto (elimina l'utente
appena creato) in caso di errore a metà flusso — entrambe con `try/catch` silenziosi, per non
far fallire il rollback stesso. Il commento a riga 22 del file precisa: "Usata da
`CreateMemberForm`. La creazione cliente è migrata a Cloud Function (`creaCliente`)" — quindi
oggi questo pattern con app secondaria serve solo per la creazione di **membri del team**
(trainer, staff_readonly, ecc.), non più per i clienti, la cui creazione passa da una Cloud
Function server-side (vedremo il layer `usecases/` in lezione 13).

### `firebase/services/users.js` — lettura profilo

```js
export const getUserProfile    = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
```

Una `getDoc` diretta, one-shot (non un listener realtime — nessun `onSnapshot` qui). Se il
documento non esiste, `snap.exists()` è `false` e la funzione restituisce esplicitamente
`null` — è questo `null` che, propagato fino a `useAuth`, distingue "non trovato" da "sto
ancora aspettando".

### `firebase/services/org.js` — lettura organizzazione

```js
export const getOrganization = async (orgId) => {
  const snap = await getDoc(doc(db, 'organizations', orgId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
```

Stesso pattern di `getUserProfile`, con una differenza: qui il risultato include anche
`id: snap.id` — l'ID del documento (l'`orgId` stesso) viene "iniettato" dentro l'oggetto
restituito, perché a differenza di `snap.data()` da solo, l'ID del documento non fa parte dei
campi salvati (Firestore non duplica l'ID dentro i dati del documento).

## Diagramma mentale

```
Firebase Auth SDK (persistente in IndexedDB/localStorage)
        │
        │  onAuthStateChanged (listener, sopravvive ai refresh pagina)
        ▼
┌────────────────────────── useAuth() ──────────────────────────┐
│                                                                 │
│  u === null?                                                   │
│    └─► user=null, profile=null, org=null, terminology=null     │
│        (fine cascata — nessun profilo da cercare)               │
│                                                                 │
│  u esiste?                                                     │
│    └─► user=u, profile=undefined, org=undefined  (reset loading)│
│        │                                                        │
│        ▼  refreshProfile(u.uid)                                │
│     getUserProfile(uid) ──── fallisce ────► profile=org=term=null│
│        │ ok                                                     │
│        ▼  p = { orgId, role, ... }                              │
│     setProfile(p)                                               │
│        │                                                        │
│     p.orgId esiste? ── no ──► org=null, terminology=default     │
│        │ sì                                                     │
│        ▼  getOrganization(p.orgId) ── fallisce ──► org=null,     │
│        │ ok                              terminology=default     │
│        ▼                                                         │
│     setOrg(o); setTerminology(getTerminology(o.moduleType,...))  │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
   { user, profile, org, terminology, refreshProfile }
        │
        ▼
   App.jsx → AppRouter.jsx → ProtectedRoute.jsx (lezione 8)


Trigger manuale (nessun evento di Auth coinvolto):

  ChangePasswordScreen.onDone()
        │
        ▼
  refreshProfile(user.uid)   ← richiamata ESPLICITAMENTE, non da onAuthChange
        │
        ▼
  rilegge /users/{uid} → mustChangePassword ora è false → sblocca la vista vera
```

## Errori comuni

1. **Pensare che `onAuthStateChanged` sia una promise one-shot.** Non lo è: è un listener
   che continua a essere richiamato per tutta la vita dell'app. Se non lo si disiscrive mai
   (o non lo si tratta come cleanup dell'effect), si accumulano più listener attivi dopo
   remount ripetuti. RankEX lo evita restituendo direttamente la unsubscribe da `useEffect`.

2. **Trattare `profile` con un semplice `if (!profile)`.** `!undefined` e `!null` sono
   entrambi `true` in JavaScript — un controllo così sommario tratterebbe "sto ancora
   caricando" e "non ho trovato nulla, serve un redirect" allo stesso modo, causando
   esattamente il flash di contenuto sbagliato descritto nei Concetti Teorici.

3. **Chiamare `createUserWithEmailAndPassword` sull'istanza `auth` primaria** pensando di poter
   "creare un account senza effetti collaterali". Il comportamento reale dell'SDK (autentica
   automaticamente come il nuovo utente) non è intuitivo e sorprende chi non lo sa — da qui la
   necessità della `secondaryAuth` per `createClientAccount`.

4. **Aggiungere una nuova fetch dentro il callback di `onAuthChange` senza un proprio
   try/catch.** L'intera cascata in `refreshProfile` è protetta; se si aggiungesse un'altra
   chiamata asincrona non protetta (es. una quinta fetch per un nuovo dato), un suo fallimento
   propagherebbe un errore non gestito nel callback — e siccome `App.jsx` calcola `isLoading`
   aspettando che `profile`/`org` non siano più `undefined`, un errore non gestito che
   interrompe la funzione a metà rischia di lasciare l'app bloccata in loading indefinito.

5. **Dimenticare `refreshProfile` dopo una scrittura diretta su `/users/{uid}`.** Non c'è
   nessun `onSnapshot` realtime su questo documento: se un altro punto del codice scrivesse
   `role`, `orgId` o `mustChangePassword` su Firestore senza poi richiamare
   `refreshProfile(uid)`, lo stato React `profile` resterebbe silenziosamente disallineato dal
   database finché l'utente non ricarica la pagina (o rifà login).

## Best Practice

**Fetch one-shot esplicito invece di `onSnapshot` realtime su `/users/{uid}`.** Si potrebbe
obiettare: perché non sincronizzare `profile` in tempo reale con un listener, evitando del
tutto la necessità di `refreshProfile` manuale? Il trade-off reale: un `onSnapshot` attivo per
l'intera durata della sessione costerebbe una connessione persistente e letture Firestore
fatturate ad ogni possibile scrittura sul documento — per un dato che, nei fatti, cambia sotto
i piedi dell'utente stesso solo in tre punti noti e circoscritti del codice (i tre `onDone` in
`routes.config.jsx`). Dato questo, un fetch esplicito e mirato è una scelta pragmatica ed
economica, coerente con la sezione "Monitoraggio costi Firebase" di `CLAUDE.md` (piano
gratuito Spark, limiti di lettura giornalieri). La lezione 15 (Realtime con `onSnapshot`)
mostrerà dove RankEX fa invece la scelta opposta (calendario, notifiche) — dati che cambiano
per iniziativa di *altri* attori (un altro trainer, un evento esterno), dove un fetch
one-shot non basterebbe.

**Gradazione della gestione errori.** Il confronto fra il `catch` interno (degradazione
morbida per `org`) e quello esterno (blocco totale per `profile`) è un buon esempio di error
handling che riflette la reale criticità del dato, invece di un unico `catch` generico che
tratta ogni fallimento allo stesso modo.

**Cleanup minimale e corretto.** `return onAuthChange(cb)` invece di
`return () => onAuthChange(cb)()` o simili: sfrutta il fatto che `onAuthStateChanged`
restituisce già la funzione giusta, senza indirection superflua.

## Quiz

1. Cosa restituisce `onAuthStateChanged` (usato internamente da `onAuthChange` in `auth.js`
   riga 38)?
   - A. Una Promise che si risolve una sola volta con l'utente corrente
   - B. Una funzione di "unsubscribe" da chiamare per smettere di ascoltare i cambi di stato
     — il listener stesso viene richiamato ad ogni cambiamento (login, logout, refresh pagina)
   - C. Un oggetto `user` sincrono
   - D. Niente, va usato con `await`

2. Nel custom hook `useAuth`, cosa significa che `profile` valga `undefined`?
   - A. L'utente non è loggato
   - B. Il fetch del profilo Firestore è in corso, non è ancora arrivata risposta
   - C. Il documento `/users/{uid}` non esiste
   - D. C'è stato un errore di permessi

3. Perché la lettura dell'organizzazione (`getOrganization`) avviene DOPO la lettura del
   profilo, e non in parallelo con `Promise.all`?
   - A. Per motivi di performance
   - B. Perché `orgId` (necessario per leggere l'org) si trova dentro il documento profilo —
     non è disponibile finché il profilo non è stato letto: è una dipendenza di dati reale,
     non solo un dettaglio implementativo
   - C. Firebase non supporta letture parallele
   - D. Per rispettare l'ordine alfabetico delle collection

4. Cosa fa il blocco `catch` alle righe 23-27 di `useAuth.js` (attorno a `getOrganization`)?
   - A. Rilancia l'errore per farlo gestire da un ErrorBoundary
   - B. Se la lettura dell'org fallisce, imposta `org` a `null` e usa una terminologia di
     default (`personal_training`), permettendo comunque all'app di procedere invece di
     bloccarsi
   - C. Fa il logout automatico dell'utente
   - D. Ritenta automaticamente la chiamata 3 volte

5. Perché `createClientAccount` (in `auth.js`) usa una `secondaryAuth` (una seconda istanza
   dell'app Firebase) invece della `auth` principale?
   - A. Per motivi di sicurezza contro attacchi CSRF
   - B. Perché `createUserWithEmailAndPassword` autentica automaticamente come il nuovo
     utente creato — usare l'istanza principale disconnetterebbe/sostituirebbe la sessione del
     trainer che sta eseguendo l'operazione
   - C. Perché Firebase richiede sempre due app per creare utenti
   - D. Per poter creare più di un utente alla volta

6. `refreshProfile` è restituita da `useAuth()` e passata fino a `ChangePasswordScreen`
   (tramite `routes.config.jsx`). Perché serve chiamarla esplicitamente dopo il cambio
   password, invece di aspettare che l'app si aggiorni da sola?
   - A. Non serve davvero, è codice ridondante
   - B. Perché `mustChangePassword: false` viene scritto direttamente su Firestore
     (`updateDoc`), un evento che NON fa scattare `onAuthStateChanged` (che reagisce solo a
     eventi di autenticazione, non a modifiche Firestore) — senza chiamata esplicita lo stato
     `profile` in React resterebbe quello vecchio
   - C. Perché Firebase Auth richiede sempre un refresh manuale del token dopo ogni operazione
   - D. Per motivi di caching del browser

7. Cosa succede nell'hook se, dopo il login, la lettura di `getUserProfile(uid)` fallisce
   (es. errore di permessi Firestore)?
   - A. `profile` resta a `undefined` per sempre, mostrando un loading infinito
   - B. Il catch esterno (righe 32-37) imposta `profile`, `org` e `terminology` tutti a
     `null` — l'app tratterà lo stato come "non loggato/non trovato" e `ProtectedRoute`
     reindirizzerà a `/login`
   - C. L'app crasha con un errore non gestito
   - D. Viene fatto automaticamente un retry infinito

8. Cosa fa concretamente `return onAuthChange(async (u) => {...})` dentro `useEffect` in
   `useAuth.js` (riga 41)?
   - A. Ritorna una Promise che React aspetta prima di montare il componente
   - B. Ritorna la funzione di unsubscribe restituita da `onAuthStateChanged` — è esattamente
     la cleanup function che `useEffect` chiamerà allo smontaggio, senza bisogno di scriverla
     a mano
   - C. Ritorna l'utente corrente
   - D. Non ritorna nulla di utile, è solo una convenzione stilistica

9. Se un componente scrivesse `if (!profile) return <LoginPage/>` invece del pattern a 3
   stati usato in `ProtectedRoute`, quale bug introdurrebbe?
   - A. Nessuno, `!profile` copre correttamente sia `undefined` che `null`
   - B. Mostrerebbe `<LoginPage/>` anche mentre il profilo sta ancora caricando (`undefined`
     è falsy), causando un flash della pagina di login prima che il vero stato sia noto —
     invece del loading screen atteso
   - C. Il componente non si renderizzerebbe mai
   - D. Causerebbe un loop infinito di redirect

10. Il commento a riga 22 di `auth.js` dice: "La creazione cliente è migrata a Cloud Function
    (`creaCliente`)". Cosa implica per l'uso della `secondaryAuth` app?
    - A. `secondaryAuth` non è più usata da nessuno ed è morta
    - B. `secondaryAuth` resta usata da `createClientAccount`/`CreateMemberForm` per la
      creazione di MEMBRI del team (trainer, staff_readonly, ecc.), mentre la creazione di
      CLIENTI non passa più dal client SDK ma da una Cloud Function server-side
    - C. `secondaryAuth` è usata solo in sviluppo
    - D. Serve solo per i super_admin

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È un listener persistente, non una promise one-shot (A, D false). Non restituisce
   direttamente un oggetto `user` sincrono (C) — il valore arriva tramite il callback passato.

2. **B.** Definito esplicitamente dal commento a riga 9 del file. A confonde `undefined` con
   `null` (che invece indica "non loggato"/"non trovato"). C descrive il caso `null`, non
   `undefined`. D non è distinto nel codice — un errore di permessi finisce nel `catch`
   esterno, che produce comunque `null`, non uno stato "errore" separato.

3. **B.** Dipendenza dati reale: `getOrganization(p.orgId)` ha letteralmente bisogno di un
   valore che esiste solo dopo aver letto `p`. A, C, D sono motivazioni inventate non
   supportate dal codice.

4. **B.** Il catch interno degrada senza bloccare. A è falsa: l'errore viene catturato, non
   rilanciato. C è falsa: non c'è nessun logout qui, solo `org`/`terminology` vengono toccati.
   D è falsa: nessun meccanismo di retry è presente nel codice.

5. **B.** È il comportamento reale e non ovvio di `createUserWithEmailAndPassword`. A è
   un'affermazione di sicurezza generica non pertinente. C è falsa: Firebase non "richiede"
   due app, è una scelta del progetto per evitare l'effetto collaterale descritto. D è
   inventata, non è il motivo.

6. **B.** È esattamente il meccanismo spiegato nei Concetti Teorici: una scrittura Firestore
   diretta non genera un evento di Auth. A è sbagliata, è necessaria. C è falsa: non è un
   requisito di Firebase Auth, è specifico al fatto che lo stato React non si aggiorna da
   solo. D è inventata.

7. **B.** Comportamento verificabile leggendo righe 32-37: azzeramento totale a `null`. A è
   sbagliata: proprio grazie al catch, `profile` non resta `undefined` per sempre. C è falsa:
   l'errore è gestito, non propaga un crash. D è inventata, nessun retry nel codice.

8. **B.** Sfrutta il fatto che `onAuthStateChanged` (quindi `onAuthChange`) restituisce
   direttamente la funzione di unsubscribe. A è concettualmente sbagliata: React non "aspetta"
   una Promise ritornata da un effect in questo modo (gli effect asincroni funzionano
   diversamente, ed è per questo che qui il valore di ritorno rilevante è la cleanup, non una
   Promise da attendere). C e D sono inventate.

9. **B.** È lo stesso bug descritto negli Errori Comuni: `undefined` è falsy quanto `null`,
   quindi `!profile` non distingue i due stati. A nega proprio la distinzione che la lezione
   dimostra essere necessaria. C e D descrivono conseguenze non plausibili per questo
   specifico errore.

10. **B.** Coerente col commento nel codice: la migrazione ha riguardato solo la creazione
    CLIENTI, non quella dei membri del team, che continua a usare questo pattern. A è
    contraddetta dall'uso ancora presente in `createClientAccount`/riferimento a
    `CreateMemberForm`. C e D sono affermazioni non supportate dal codice letto.

## Esercizi

1. **(facile)** Apri [`useAuth.js`](../../src/features/auth/useAuth.js) e disegna a mano la
   tabella degli stati possibili di `{ user, profile, org, terminology }` in questi 4
   momenti: (a) primissimo render prima che Firebase risponda, (b) utente non loggato, (c)
   utente loggato ma fetch profilo in corso, (d) utente loggato con profilo e org caricati.

2. **(facile-medio)** Aggiungi un `console.log` temporaneo dentro `refreshProfile` (prima e
   dopo ogni `await`) e osserva in console l'ordine reale delle operazioni durante un login —
   verifica che sia davvero sequenziale (profilo poi org) e non parallelo. Rimuovi i log al
   termine.

3. **(medio)** Nel tuo ambiente locale (`rankex-dev`), individua nel documento Firestore di
   un tuo utente di test il campo `orgId` — poi modifica manualmente (dalla Firebase Console)
   quel campo con un ID di organizzazione inesistente, fai un refresh della pagina e osserva
   cosa succede nell'app (grazie al catch di righe 23-27). Ripristina il valore corretto dopo
   il test.

4. **(medio-difficile)** Immagina di dover aggiungere un quinto campo calcolato al risultato
   di `useAuth()`, ad esempio `isReadonly` (derivato da `profile?.role === 'staff_readonly'`).
   Scrivi (solo come esercizio mentale/commento, non serve committare) dove esattamente lo
   aggiungeresti in `useAuth.js` e cosa dovresti restituire nell'oggetto finale (riga 56).

5. **(difficile)** `getOrganization` in caso di errore imposta silenziosamente `org=null`.
   Ipotizza tre casi limite reali (rete assente, regole Firestore che negano l'accesso, org
   eliminata mentre l'utente ha ancora un token valido) e traccia — solo leggendo il codice,
   senza eseguirlo — cosa vedrebbe l'utente finale in ciascuno dei tre casi, seguendo la
   catena `useAuth` → `App.jsx` (`isLoading`) → `AppRouter` → `ProtectedRoute` → vista finale.

## Challenge

`App.jsx` ha un solo timeout generico (`LOADING_TIMEOUT_MS = 10_000`, riga 13) che, se il
caricamento non termina entro 10 secondi, mostra un pulsante "Ricarica" — senza distinguere
la causa (rete lenta? Firestore irraggiungibile? bug?). Progetta (solo su carta/commento, non
serve modificare `src/`) un timeout più mirato **dentro** `refreshProfile`: se
`getUserProfile` non risponde entro N secondi, tratta il caso come se fosse fallito (stesso
comportamento del catch esterno, righe 32-37) invece di restare in attesa indefinita fino al
timeout generico di `App.jsx`. Indica: dove inseriresti il timer, come lo cancelleresti in
caso di risposta in tempo, e se useresti `Promise.race` o un'altra tecnica — motiva la scelta.
