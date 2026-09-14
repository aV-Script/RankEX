# Lezione 21 — Sicurezza applicativa
[← Indice](00-indice.md)

## Obiettivo della lezione

Analizzare i tre meccanismi di sicurezza applicativa lato client di RankEX — audit log,
password policy, session timeout differenziato per ruolo — capire un dettaglio tecnico
sottile ma reale (`getAuth(app)` lazy dentro `auditLog.js`), e chiudere con un'onestà
tecnica necessaria: quali limiti sono strutturali in un'app Firebase puro-frontend senza
backend custom, e perché non sono "bug da fixare" ma conseguenze dell'architettura scelta.

## Concetti teorici

La sicurezza di un'app che gira interamente nel browser (nessun server proprietario, solo
Firebase come backend-as-a-service) si gioca su tre fronti distinti, e RankEX li tratta tutti e
tre:

1. **Autorizzazione dei dati** — chi può leggere/scrivere cosa. Questo è il compito delle
   Firestore Security Rules (trattate nella Lezione 16), non di questa lezione.
2. **Tracciabilità** — un registro di "chi ha fatto cosa e quando", indipendente
   dall'autorizzazione: anche un'azione legittima (un org_admin che rimuove un membro) deve
   lasciare una traccia verificabile a posteriori. È il ruolo dell'**audit log**.
3. **Igiene delle credenziali e delle sessioni** — password sufficientemente robuste, sessioni
   che scadono, meno tempo possibile in cui un dispositivo rubato/incustodito resta una sessione
   valida. Sono i ruoli di `validatePassword` e `useSessionTimeout`.

Un concetto trasversale a tutti e tre: **RankEX non ha un server applicativo proprio**. Non
esiste un processo Node.js sempre acceso che intercetta ogni richiesta e applica logica di
sicurezza in modo centralizzato — esiste il codice React nel browser (che si fida solo fino a un
certo punto) e Firebase (Auth + Firestore + Cloud Functions) come infrastruttura gestita.
Ogni pattern di sicurezza in questa lezione va letto con questa domanda in mente: *"cosa succede
se un utente malintenzionato bypassa completamente il codice React e parla direttamente con
Firebase?"* — è la stessa lente che la Lezione 16 (Security Rules) userà in modo sistematico, qui
la applichiamo ai tre meccanismi sopra.

## Dove compare nel progetto

- [`src/utils/auditLog.js`](../../src/utils/auditLog.js) — scrittura dell'evento immutabile
- [`src/utils/validation.js`](../../src/utils/validation.js) — `validatePassword` e le altre funzioni di validazione pure
- [`src/hooks/useSessionTimeout.js`](../../src/hooks/useSessionTimeout.js) — logout automatico differenziato per ruolo
- [`src/firebase/services/auth.js`](../../src/firebase/services/auth.js) — `setPersistence`, `logout`, `changeTrainerPassword`, `changeUserEmail`
- [`src/features/auth/useLoginForm.js`](../../src/features/auth/useLoginForm.js) — `AUDIT_ACTIONS.LOGIN` / `LOGIN_FAILED`
- [`src/features/org/org-pages/MembersPage.jsx`](../../src/features/org/org-pages/MembersPage.jsx) — `AUDIT_ACTIONS.ROLE_CHANGED` / `MEMBER_REMOVED`
- `firestore.rules`, righe 227-232 — regola `audit_logs/{logId}` (append-only)
- CLAUDE.md, sezione "Sicurezza" — riferimento ufficiale su hardening e limiti noti

## Analisi del codice

### `auditLog.js` — il registro append-only

```js
export async function auditLog(action, details = {}) {
  const user = getAuth(app).currentUser
  if (!user) return

  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      uid:       user.uid,
      email:     user.email,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      details,
      env:       ENV,
    })
  } catch {
    // Silenzioso: l'audit non deve mai bloccare l'operazione principale
  }
}
```

Punti chiave:

- **`getAuth(app).currentUser` letto ad ogni chiamata**, non messo in cache — garantisce che se
  l'utente ha appena fatto login o logout, `auditLog` veda sempre lo stato corrente, non uno
  "congelato" al momento in cui il modulo è stato caricato la prima volta.
- **`if (!user) return`** — se non c'è un utente autenticato, la funzione esce silenziosamente
  senza scrivere nulla. Coerente con la regola Firestore a riga 229 (`allow create: if isAuth()`):
  scrivere senza essere autenticati sarebbe comunque rifiutato dal server, quindi evitarlo prima
  è solo un'ottimizzazione (niente round-trip di rete inutile), non un buco di sicurezza in meno.
- **`try/catch` che inghiotte silenziosamente ogni errore** — il commento è esplicito:
  *"l'audit non deve mai bloccare l'operazione principale"*. Se scrivere il log fallisse (rete
  assente, quota Firestore esaurita, permessi inaspettati), l'azione principale (es. rimuovere un
  membro) **deve comunque completarsi** — un audit log che blocca il business logic sarebbe un
  effetto collaterale peggiore del problema che risolve.
- **`serverTimestamp()`** invece di `new Date()` — il timestamp viene assegnato dal server
  Firestore al momento della scrittura, non dall'orologio (potenzialmente sbagliato o
  manipolabile) del dispositivo client. Per un registro che deve essere affidabile a fini di
  audit, questa non è una scelta stilistica.

Sulla regola Firestore (righe 227-232 di `firestore.rules`):

```
match /audit_logs/{logId} {
  allow read:   if isSuperAdmin();
  allow create: if isAuth();
  allow update: if false;
  allow delete: if false;
}
```

`allow update: if false` e `allow delete: if false` sono ciò che rende il registro **davvero**
append-only: non è una convenzione rispettata "per buona educazione" dal codice client, è una
regola imposta lato server che nessun client — nemmeno uno che bypassa completamente l'app React
e parla direttamente con l'SDK Firestore — può aggirare. `allow read: if isSuperAdmin()` chiude
il cerchio: solo chi ha visibilità globale sul sistema può consultare la cronologia.

### Perché questo pattern conta per una SaaS che gestisce dati di minori

RankEX serve anche `soccer_academy`, con clienti nella fascia `soccer_youth` (7-9 anni). Un
registro immutabile di chi ha creato, letto o eliminato un profilo cliente, chi ha cambiato ruolo
a un membro dell'organizzazione, chi si è loggato e quando, non è solo "buona pratica" astratta:
è ciò che permette — a distanza di mesi — di rispondere con certezza a "chi ha avuto accesso a
questo dato e quando", requisito tipico in ambito compliance quando si trattano dati di minori o
di clienti in generale. Il fatto che sia append-only (nessun update/delete permesso) è ciò che
rende la risposta affidabile: se fosse modificabile, un abuso potrebbe essere "ripulito"
retroattivamente dallo stesso attore che lo ha commesso.

### 📎 Approfondimento: audit log

Immagina il registro delle chiamate del tuo gestore telefonico: non puoi cancellare una
chiamata già fatta, e non puoi modificarne l'orario o il numero chiamato — puoi solo
consultarlo (e nemmeno tu direttamente, serve una richiesta formale). Un audit log software
funziona sullo stesso principio: ogni evento è una riga scritta una volta sola, mai più
toccata. Non serve a "prevenire" un'azione scorretta (per quello ci sono le Security Rules) —
serve a **renderla tracciabile dopo il fatto**, il che di per sé è anche un deterrente: sapere
di essere osservabili cambia il comportamento.

### `validation.js` — `validatePassword` e la sua diffusione reale

```js
export function validatePassword(password) {
  if (!password)
    return { valid: false, error: 'Password obbligatoria' }
  if (password.length < 8)
    return { valid: false, error: 'Minimo 8 caratteri' }
  if (!/[0-9]/.test(password))
    return { valid: false, error: 'Deve contenere almeno un numero' }
  if (!/[A-Z]/.test(password))
    return { valid: false, error: 'Deve contenere almeno una lettera maiuscola' }
  return { valid: true, error: null }
}
```

Una funzione pura da manuale: nessun `import` da Firebase, nessun side effect, un solo tipo di
ritorno (`{ valid, error }`) su tutti i rami — coerente con lo stile dichiarato di
`utils/validation.js` in testa al file ("Funzioni di validazione pure"). Le tre condizioni sono
verificate in ordine e la funzione esce (early return) alla prima che fallisce — quindi l'utente
vede **un errore alla volta**, non tutti insieme; un dettaglio UX minore ma deliberato (il
messaggio più specifico e azionabile per primo).

CLAUDE.md afferma "importato da 16 file" riferendosi a `utils/validation.js` nel suo insieme (il
modulo, non la singola funzione `validatePassword`). Verificato con una ricerca sull'import
`from '.../utils/validation'` in tutta `src/`: il conteggio reale è **17 file** (inclusi
componenti wizard come `StepAnagrafica.jsx`/`StepBia.jsx`, pagine come `BiaView.jsx`,
`ClientDashboard.jsx`, `CampionamentoView.jsx`, hook come `useWizard.js`/`useCampionamento.js`/
`useClientFilters.js`, oltre ai punti attesi come `useLoginForm.js` e `ChangePasswordScreen.jsx`)
— un numero molto vicino a quello dichiarato, la discrepanza di un'unità è plausibile con normali
modifiche successive alla stesura di CLAUDE.md. La funzione `validatePassword` specifica, invece,
è importata da **6 file**: `ProfilePage.jsx`, `AdminProfilePage.jsx`, `ChangePasswordScreen.jsx`,
`useWizard.js`, più il file sorgente stesso e il suo test (`validation.test.js`). La lezione da
trarre non è il numero esatto, ma il motivo dietro: **una firma di validazione condivisa e
riusata ovunque si crei/cambi una password (wizard nuovo cliente, cambio password trainer, cambio
password client, profilo super_admin) garantisce che la policy sia identica in ogni punto
d'ingresso** — se ogni form reinventasse la propria regex, prima o poi un punto d'ingresso
avrebbe una policy più debole degli altri, e sarebbe il punto debole reale del sistema.

### `useSessionTimeout.js` — timeout differenziato per ruolo

```js
const TIMEOUT_MS = {
  super_admin:    30 * 60 * 1000,          //  30 minuti
  org_admin:       2 * 60 * 60 * 1000,    //   2 ore
  trainer:         8 * 60 * 60 * 1000,    //   8 ore
  staff_readonly:  8 * 60 * 60 * 1000,    //   8 ore
  client:          24 * 60 * 60 * 1000,       // 24 ore
}

const WARNING_MS = 60 * 1000

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll']

export function useSessionTimeout(role) {
  ...
  useEffect(() => {
    if (!role) return
    const timeout = TIMEOUT_MS[role] ?? TIMEOUT_MS.trainer

    const reset = () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      setShowWarning(false)
      warnTimerRef.current   = setTimeout(() => setShowWarning(true), Math.max(timeout - WARNING_MS, 0))
      logoutTimerRef.current = setTimeout(() => logout(), timeout)
    }
    resetRef.current = reset

    reset()
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))

    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset))
    }
  }, [role])

  return { showWarning, extendSession: () => resetRef.current() }
}
```

La logica: due `setTimeout` annidati per ogni "giro" — uno che scatta `WARNING_MS` (60 secondi)
prima della scadenza vera e mostra un avviso (`showWarning`), uno che scatta esattamente al
timeout e forza `logout()`. Ogni evento in `ACTIVITY_EVENTS` (mousemove, click, tasto, touch,
scroll) richiama `reset()`, che cancella entrambi i timer e li riarma da zero — è così che "il
timer si azzera su ogni interazione" (comportamento descritto in CLAUDE.md). `resetRef` è un
`useRef` che tiene sempre l'ultima versione di `reset` accessibile da fuori l'effect —
necessario perché `extendSession` (restituito dall'hook, usato dal bottone "resta connesso" nel
`SessionWarningDialog`) deve poter richiamare `reset()` anche se l'effect non si è rieseguito.

**Perché ha senso che un ruolo con più potere abbia un timeout più corto**: il timeout di
sessione è una mitigazione contro un rischio specifico — un dispositivo autenticato lasciato
incustodito. Il danno potenziale di quella finestra di rischio è proporzionale a **cosa quel
ruolo può fare** una volta dentro. Un `super_admin` ha visibilità globale su tutte le
organizzazioni della piattaforma (CLAUDE.md: "visibilità globale, customer service") — 30 minuti
di finestra di rischio sono già un compromesso, non un lusso. Un `client`, all'altro estremo, può
solo vedere e modificare i propri dati personali (i propri test, la propria scheda, le proprie
note) — un dispositivo incustodito con quella sessione attiva espone molto meno, e 24 ore di
comodità (niente re-login continuo su un'app usata magari solo in palestra, sporadicamente) hanno
un costo di rischio molto più contenuto. È un caso concreto del principio "il costo di un
controllo di sicurezza deve essere proporzionale al rischio che mitiga", non un timeout uguale
per tutti applicato per pigrizia.

### Il caso interessante: `AUDIT_ACTIONS.LOGIN_FAILED` non viene mai scritto

Vale la pena isolarlo perché è un dettaglio reale del codice, non ipotetico. In
[`useLoginForm.js`](../../src/features/auth/useLoginForm.js):

```js
try {
  await login(email.trim(), password)
  await auditLog(AUDIT_ACTIONS.LOGIN)
} catch (err) {
  auditLog(AUDIT_ACTIONS.LOGIN_FAILED, { email: email.trim() })
  setError(getFirebaseErrorMessage(err, 'Errore di accesso'))
}
```

Il ramo `catch` scatta quando `login()` **fallisce** — cioè quando l'utente non è (e non
diventa) autenticato. Ma `auditLog()`, come visto sopra, apre con `if (!getAuth(app).currentUser) return`.
In un tentativo di login fallito **non c'è** un `currentUser` (né quello vecchio, se l'utente non
era già loggato con un'altra sessione, né uno nuovo, perché il login è fallito). Il risultato:
la chiamata `auditLog(AUDIT_ACTIONS.LOGIN_FAILED, ...)` esce dalla funzione al primo `if` e
**non scrive mai nulla in Firestore** — l'azione `LOGIN_FAILED`, pur definita in `AUDIT_ACTIONS`
e pur chiamata nel codice, è di fatto irraggiungibile nel caso d'uso più comune (un utente non
ancora loggato che sbaglia password). Anche a voler bypassare il controllo lato client, la
regola Firestore `allow create: if isAuth()` blocca comunque un tentativo di scrittura non
autenticato. Un tentativo di forzare la password di un account **da parte di un utente non
loggato** (lo scenario di sicurezza più rilevante da tracciare: brute-force) oggi non lascia
traccia nell'audit log. Registrarlo davvero richiederebbe una scrittura autorizzata diversamente
(es. via una Cloud Function con permessi propri, non legata a `auth.currentUser` del chiamante) —
un miglioramento reale, non ancora presente nel codice.

## Perché `getAuth(app)` in `auditLog.js` è lazy — il meccanismo tecnico reale

Questo è il punto che CLAUDE.md segnala come "non spostare, causerebbe conflitto con
`setPersistence`" senza spiegarne il meccanismo. Confrontando i due file:

`firebase/services/auth.js`, righe 1-19:
```js
import { getAuth, browserLocalPersistence, browserSessionPersistence, setPersistence, ... } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import app              from '../config'
import { auditLog, AUDIT_ACTIONS } from '../../utils/auditLog'   // riga 12
import { isAdminDomain }           from '../../utils/env'

export const auth = getAuth(app)                                  // riga 15

setPersistence(auth, isAdminDomain() ? browserSessionPersistence : browserLocalPersistence)  // riga 19
```

Il dettaglio decisivo è alla **riga 12**: `auth.js` importa `auditLog.js`. In un modulo ES,
l'ordine di esecuzione del codice top-level segue l'ordine di risoluzione degli import,
*profondità-prima*: quando qualcosa importa `auth.js`, il motore JS deve prima eseguire per
intero tutti i moduli che `auth.js` stesso importa (righe 1-13) — `auditLog.js` compreso —
**prima** di eseguire il corpo proprio di `auth.js` (righe 15 e 19).

Se `auditLog.js` avesse, a livello di modulo, `export const authAudit = getAuth(app)` (eager,
invece che dentro la funzione come oggi), quella riga eseguirebbe **prima** che `auth.js` arrivi
alla propria riga 15 (figuriamoci alla riga 19 con `setPersistence`). Da notare: non creerebbe
una "seconda istanza" di Auth scollegata — `getAuth(app)` è una funzione memoizzata per istanza
`app`: chiamata più volte con lo stesso `app` restituisce sempre lo stesso oggetto Auth
singleton. Il problema reale è un altro: **la creazione della prima istanza Auth per
un'applicazione innesca, internamente all'SDK, l'avvio asincrono del processo di ripristino
dell'utente persistito** (lettura da IndexedDB/localStorage), usando qualunque persistenza sia
attiva **in quel momento** — di default `browserLocalPersistence`, finché `setPersistence()` non
la cambia esplicitamente. Se quel processo di ripristino parte prima che `setPersistence(auth,
browserSessionPersistence)` (riga 19, per il dominio admin) abbia potuto eseguire, l'istanza Auth
avrebbe già iniziato a operare con la persistenza sbagliata per quella sessione — vanificando
esattamente la ragione per cui il dominio admin vuole *session persistence* (logout automatico
alla chiusura del browser, comportamento più stringente per `super_admin`).

Con `getAuth(app)` **dentro** la funzione `auditLog` (com'è oggi), la prima vera chiamata a
`getAuth(app)` da parte di quel file avviene solo quando `auditLog(...)` viene effettivamente
invocata a runtime (es. al primo login) — cioè ben dopo che il modulo `auth.js` è stato caricato
per intero e ha già eseguito sia riga 15 sia riga 19 in sequenza sincrona. A quel punto
`getAuth(app)` in `auditLog.js` restituisce semplicemente **la stessa istanza** già creata e già
configurata da `auth.js`, senza alcuna corsa contro `setPersistence`. È per questo che lo spostamento
a livello di modulo va evitato: non per un problema di "più istanze", ma per un problema di
**ordine di inizializzazione** legato al fatto che `auth.js` importa `auditLog.js` come sua
dipendenza diretta.

## Limiti noti (strutturali)

CLAUDE.md è esplicito su due limitazioni, ed è corretto che lo sia: non sono difetti di
implementazione da correggere, sono conseguenze dirette di "Firebase puro-frontend, nessun
backend applicativo proprio".

- **Session timeout solo client-side.** `useSessionTimeout` gira interamente nel browser: se
  l'utente chiude la scheda a metà timer, o se un attaccante ha già ottenuto il token JWT
  dell'utente prima dello scadere, il timeout lato client non lo invalida — quel token resta
  valido lato Firebase Auth per la sua durata standard (circa un'ora) a prescindere da cosa
  succeda nell'interfaccia React. Un vero enforcement lato server richiederebbe un backend che
  verifica anche il "tempo trascorso dall'ultima attività" ad ogni richiesta, cosa che Firebase
  Auth di per sé non offre nativamente.
- **`signOut()` non revoca il refresh token server-side.** Guardando `firebase/services/auth.js`,
  `logout` chiama semplicemente `signOut(auth)` (dell'SDK client) dopo aver scritto l'audit log.
  `signOut()` cancella lo stato locale (il token in memoria/storage del browser) ma **non**
  invalida il refresh token lato server Firebase — un token già emesso, se fosse stato copiato
  altrove prima del logout, resterebbe tecnicamente utilizzabile per un tempo residuo (l'ordine
  di un'ora, la durata tipica di un token Firebase). Revocarlo davvero richiederebbe l'Admin SDK
  (`admin.auth().revokeRefreshTokens(uid)`), disponibile solo lato server — cioè in una Cloud
  Function, non nel codice client che gira nel browser dell'utente.

Questi due limiti non sono nascosti nel codice: sono documentati esplicitamente in CLAUDE.md
proprio perché conoscerli è parte della competenza di sicurezza attesa da chi mantiene il
progetto — sapere *cosa* un controllo lato client può e non può garantire evita di trattarlo come
una barriera assoluta quando è, per costruzione, una barriera "best effort".

## Diagramma mentale

```
Ordine di esecuzione al primo import di auth.js
──────────────────────────────────────────────
import { getAuth, setPersistence, ... } from 'firebase/auth'   (libreria, side-effect nullo)
import { initializeApp }                from 'firebase/app'    (libreria)
import app                              from '../config'        ← eseguito PRIMA
import { auditLog, AUDIT_ACTIONS }      from '../../utils/auditLog'
   └─ auditLog.js VIENE ESEGUITO QUI (dipendenza di auth.js)
      └─ oggi: nessun getAuth() a livello di modulo → nessun rischio
      └─ SE fosse eager: getAuth(app) partirebbe QUI, PRIMA di riga 15/19 sotto
import { isAdminDomain }                from '../../utils/env'

── corpo di auth.js ──
export const auth = getAuth(app)                                          // riga 15
setPersistence(auth, isAdminDomain() ? session : local)                   // riga 19
```

## Errori comuni

1. **Spostare `getAuth(app)` a livello di modulo in `auditLog.js`** pensando che "tanto è la
   stessa istanza" — è vero che è la stessa istanza (memoizzata), ma il problema non è
   l'istanza, è **quando** viene creata rispetto a `setPersistence`.
2. **Pensare che `useSessionTimeout` sia una misura di sicurezza "hard".** È una misura di
   comodità/igiene lato UX più che un controllo di sicurezza enforceable — il vero controllo
   d'accesso resta nelle Firestore Rules e nella scadenza naturale del token Firebase.
3. **Duplicare la regex di `validatePassword` in un nuovo form** invece di importare la funzione
   condivisa — il rischio concreto è che le due policy divergano nel tempo (es. qualcuno
   "semplifica" la regex in un punto e dimentica l'altro).
4. **Aspettarsi che l'audit log catturi anche i tentativi di login falliti anonimi** — come
   mostrato sopra, oggi non lo fa, per via del controllo `if (!user) return` in cima ad
   `auditLog`.

## Best Practice

- **Un solo punto di validazione password condiviso** (`validatePassword`), mai duplicato — è il
  motivo per cui CLAUDE.md lo marca esplicitamente come file critico "usata ovunque".
- **Un audit log che non lancia mai** (try/catch silenzioso) — un sistema di sicurezza secondario
  non deve mai poter bloccare l'operazione primaria che sta osservando.
- **Timeout proporzionali al danno potenziale del ruolo**, non un valore unico "buono per tutti".
- **`setPersistence` chiamato il prima possibile, in modo sincrono, subito dopo `getAuth`** —
  esattamente il pattern in `auth.js` righe 15/19, senza operazioni asincrone o import
  "rischiosi" frapposti in mezzo.
- **Documentare onestamente i limiti strutturali** (come fa CLAUDE.md) invece di presentare un
  controllo lato client come una garanzia assoluta che non è.

## Quiz

1. Perché `auditLog()` restituisce subito se `getAuth(app).currentUser` è `null`?
   - A) Per motivi di performance, non è collegato alla sicurezza
   - B) Perché senza utente autenticato la scrittura verrebbe comunque rifiutata dalla regola `allow create: if isAuth()`, quindi evitarla prima è solo un'ottimizzazione
   - C) Perché altrimenti l'app andrebbe in crash
   - D) Perché `audit_logs` richiede un `uid` come chiave del documento

2. Cosa rende il registro `audit_logs` davvero "append-only"?
   - A) Una convenzione rispettata dal codice React
   - B) Le regole Firestore `allow update: if false` e `allow delete: if false`
   - C) Il fatto che usa `serverTimestamp()`
   - D) Il fatto che solo `super_admin` può leggerlo

3. Perché `auditLog` usa `serverTimestamp()` invece di `new Date()`?
   - A) Perché `new Date()` non esiste in Firestore
   - B) Perché il timestamp deve essere assegnato dal server, non dall'orologio (potenzialmente errato o manipolabile) del client
   - C) Per compatibilità con Firestore Rules
   - D) Non c'è differenza pratica

4. Qual è il vero motivo per cui `getAuth(app)` in `auditLog.js` deve restare dentro la funzione (lazy)?
   - A) Perché altrimenti crea una seconda istanza Auth scollegata
   - B) Perché `auth.js` importa `auditLog.js` come dipendenza diretta: un `getAuth()` eager in `auditLog.js` eseguirebbe prima che `auth.js` esegua `setPersistence`
   - C) Perché `getAuth` non è disponibile a livello di modulo
   - D) Non c'è un motivo tecnico reale, è solo una convenzione di stile

5. Cosa fa `setPersistence(auth, ...)` in `auth.js`?
   - A) Decide se l'utente resta loggato tra chiusure del browser (local) o solo per la sessione corrente (session)
   - B) Decide quanto dura il token Firebase
   - C) Cripta la password dell'utente
   - D) Configura l'audit log

6. Perché `super_admin` ha un timeout di sessione più corto (30 minuti) rispetto a `client` (24 ore)?
   - A) È un valore arbitrario, senza logica dietro
   - B) Perché il danno potenziale di una sessione super_admin compromessa (visibilità globale su tutte le org) è molto più alto di quello di una sessione client
   - C) Perché i super_admin usano dispositivi meno sicuri
   - D) Per limitare il traffico verso Firestore

7. Quanti file importano `utils/validation.js` nel progetto, secondo la verifica reale fatta in questa lezione?
   - A) Esattamente 6
   - B) Esattamente 16
   - C) 17
   - D) Più di 30

8. Perché la chiamata `auditLog(AUDIT_ACTIONS.LOGIN_FAILED, ...)` in `useLoginForm.js` non scrive mai nulla in Firestore nel caso comune di password sbagliata?
   - A) Perché `AUDIT_ACTIONS.LOGIN_FAILED` non esiste
   - B) Perché al momento del fallimento del login non c'è un `currentUser`, e `auditLog` esce subito se `!user`
   - C) Perché la regola Firestore lo impedisce sempre, anche per utenti autenticati
   - D) Perché `useLoginForm.js` non importa `auditLog`

9. Perché "session timeout solo client-side" è un limite strutturale e non un bug?
   - A) Perché React non supporta i timer
   - B) Perché senza un backend applicativo proprio che verifichi l'inattività ad ogni richiesta, il timer può solo agire nel browser, non invalidare il token lato server
   - C) Perché Firebase non permette timeout
   - D) Perché è una scelta di design arbitraria senza vincoli tecnici

10. Cosa servirebbe per revocare davvero un refresh token Firebase lato server dopo un logout?
    - A) Chiamare `signOut()` due volte
    - B) L'Admin SDK (`admin.auth().revokeRefreshTokens(uid)`), disponibile solo lato server/Cloud Function
    - C) Cancellare l'utente da `/users/{uid}`
    - D) Non è possibile in nessun modo con Firebase

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È un'ottimizzazione, non una barriera di sicurezza in sé — la vera barriera è la regola
   Firestore `allow create: if isAuth()`, che vale a prescindere da cosa fa il codice client.
2. **B.** Le regole `allow update: if false` / `allow delete: if false` sono imposte lato server:
   nessun client, nemmeno uno che bypassa l'app, può modificarle o cancellarle.
3. **B.** L'orologio del dispositivo client è fuori dal controllo del server e potenzialmente
   errato o manipolato — `serverTimestamp()` garantisce un valore affidabile per un registro di
   audit.
4. **B.** Il meccanismo reale riguarda l'ordine di esecuzione dei moduli ES: `auth.js` importa
   `auditLog.js` come dipendenza (riga 12), quindi qualunque codice top-level in `auditLog.js`
   eseguirebbe prima delle righe 15/19 di `auth.js`. Non è un problema di "seconda istanza"
   (A è sbagliata: `getAuth(app)` è memoizzato per app).
5. **A.** `browserLocalPersistence` vs `browserSessionPersistence` — la differenza è se la
   sessione sopravvive alla chiusura del browser o no.
6. **B.** Il timeout è proporzionale al danno potenziale legato ai permessi del ruolo — più
   potere, finestra di rischio più corta.
7. **C.** Verificato con una ricerca reale sugli import nel codice: 17 file, non i 16 dichiarati
   in CLAUDE.md (differenza minima, plausibile per modifiche successive).
8. **B.** Al momento del `catch` in un login fallito, l'utente non è autenticato — `auditLog`
   esce subito al controllo `if (!user) return`, quindi non scrive nulla, nonostante la chiamata
   sia presente nel codice.
9. **B.** Senza un backend proprio che rivaluti l'inattività ad ogni richiesta contro il server,
   un timer nel browser può solo forzare un `signOut()` locale — non può invalidare un token già
   emesso lato Firebase.
10. **B.** Serve l'Admin SDK, eseguibile solo in un ambiente server-side fidato (Cloud Function),
    perché richiede privilegi che il client autenticato normale non ha.

## Esercizi

1. **Facile.** Apri `AUDIT_ACTIONS` in [`auditLog.js`](../../src/utils/auditLog.js) e, per ognuna
   delle azioni elencate (`LOGIN`, `CLIENT_CREATED`, `ROLE_CHANGED`, ecc.), trova con Grep il file
   reale dove viene effettivamente chiamata — verifica se ce n'è qualcuna definita ma mai usata.
2. **Facile-medio.** Calcola manualmente, per ciascun ruolo in `TIMEOUT_MS`, dopo quanti minuti
   esatti scatta l'avviso `showWarning` (cioè `timeout - WARNING_MS`, convertito in minuti).
3. **Medio.** Scrivi un test unitario per `validatePassword` (in stile
   [`validation.test.js`](../../src/__tests__/utils/validation.test.js), se esiste già leggilo
   prima) che copra: password vuota, password troppo corta, password senza numero, password
   senza maiuscola, password valida — verifica che il messaggio d'errore restituito corrisponda
   esattamente a quello atteso in ciascun caso.
4. **Medio-difficile.** Proponi (solo come pseudocodice/commento, senza modificare `auditLog.js`)
   come si potrebbe registrare davvero un `LOGIN_FAILED` da parte di un utente non autenticato,
   tenendo conto che la regola Firestore attuale richiede `isAuth()` per scrivere in
   `audit_logs`. Suggerimento: pensa a dove altrove nel progetto una scrittura viene fatta
   passare da una Cloud Function invece che da una scrittura diretta client → Firestore.
5. **Difficile.** Leggi `changeTrainerPassword` in `firebase/services/auth.js` e spiega perché
   richiede `reauthenticateWithCredential` prima di `updatePassword` — cosa impedirebbe, se
   quel passaggio non ci fosse, e collega la risposta al codice errore
   `auth/requires-recent-login` già presente in `firebaseErrors.js` (Lezione 20).

## Challenge

Il limite descritto in questa lezione — `AUDIT_ACTIONS.LOGIN_FAILED` che non viene mai
effettivamente scritto per un tentativo di login anonimo fallito — è un gap di sicurezza reale
per una piattaforma che vuole poter rilevare tentativi di brute-force sulle password. Progetta
(solo su carta/commento, senza toccare `firestore.rules` né il codice reale, dato che
CLAUDE.md richiede estrema cautela su quel file) una soluzione che permetta di registrare i
tentativi di login falliti **anche da utenti non autenticati**, rispettando i vincoli esistenti:
niente scritture Firestore dirette senza autenticazione permesse dalle regole attuali. Traccia
almeno due approcci alternativi (es. una nuova Cloud Function callable dedicata che scrive con i
privilegi dell'Admin SDK, oppure un contatore di tentativi falliti mantenuto lato Firebase Auth
stesso via `too-many-requests`) e motiva quale sceglieresti, tenendo conto che il progetto è
ancora sul piano gratuito Spark (vedi sezione "Monitoraggio costi Firebase" di CLAUDE.md) e che
ogni scrittura extra ha un costo in quota giornaliera.
