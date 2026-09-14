# Lezione 13 — Cloud Functions callable e il layer usecases/
[← Indice](00-indice.md)

## Obiettivo della lezione

Questa è la lezione che rivela la parte più sorprendente dell'architettura di RankEX: non
tutte le scritture Firestore partono dal browser. Un intero layer, `src/usecases/` (31 file),
non tocca mai Firestore direttamente — invoca **Cloud Functions callable**, che girano su
server Google, con privilegi che il browser non ha mai. Seguiremo il roundtrip completo,
client → callable → server → Firestore, per quattro operazioni reali (creare un cliente,
eliminarlo, aggiungere XP, salvare un campionamento), risolveremo il gancio lasciato aperto
nella Lezione 12 (perché `updateClient` resta diretto), e — verificandolo riga per riga nel
codice reale, non per ipotesi — scopriremo anche tre punti dell'architettura attuale che
meritano una discussione onesta, non solo un elogio.

## Concetti teorici

### Cos'è, esattamente, una Cloud Function "callable"

Una Cloud Function può essere di diversi tipi. Quelle che ci interessano qui sono definite
con `onCall(...)` lato server (le trovi tutte in `functions/src/callable/`) e invocate con
`httpsCallable(...)` lato client. È una coppia di funzioni pensate per parlarsi: il client
non fa una `fetch()` generica verso un URL — chiama `httpsCallable(functions, 'creaCliente')`,
ottiene una funzione JS locale, e la invoca come se fosse una funzione asincrona qualsiasi:
`await _creaCliente({ orgId, trainerId, formData })`.

Dietro le quinte, l'SDK fa comunque una richiesta HTTP POST verso l'endpoint della funzione —
ma se ne occupa lui: prende il token ID dell'utente Firebase Auth attualmente loggato (se
c'è) e lo allega automaticamente come header della richiesta. Lato server, `onCall` riceve
questo come `request.auth` **già popolato e verificato** — `request.auth.uid`,
`request.auth.token.email`, ecc. — senza che il client debba fare nulla di esplicito per
questo, e senza che il server debba verificare manualmente una firma JWT: lo fa l'infrastruttura
di Cloud Functions prima ancora che il tuo codice `onCall` venga eseguito.

> 📎 **Approfondimento: `httpsCallable` / Cloud Functions callable, da zero**
>
> Immagina due modi di chiedere un'informazione a un ufficio.
>
> **REST "a mano"**: scrivi una lettera (la richiesta HTTP), devi ricordarti di allegare un
> documento d'identità valido (il token JWT, recuperato con `user.getIdToken()` e messo
> manualmente in un header `Authorization: Bearer ...`), spedirla a un indirizzo specifico
> (l'URL dell'endpoint), e sperare che l'ufficio accetti lettere da mittenti come il tuo sito
> (il problema del **CORS**: un server HTTP "nudo" deve essere configurato esplicitamente per
> accettare richieste da un'origine come `https://rankex-app.web.app`, altrimenti il browser
> blocca la risposta prima ancora che arrivi al tuo codice).
>
> **Callable Firebase**: è come chiamare un centralino interno dove il tuo numero (l'utente
> loggato) è già riconosciuto automaticamente appena alzi la cornetta — non devi dire chi sei,
> il sistema lo sa già. L'SDK client e l'SDK server parlano lo stesso protocollo concordato da
> Firebase: il client allega il token automaticamente, il server lo riceve già verificato in
> `request.auth`, e il problema CORS per le chiamate del genere è gestito dall'infrastruttura
> Firebase stessa, non da configurazione manuale nel tuo codice.
>
> La differenza pratica per chi legge il codice: quando vedi `httpsCallable(functions, 'nomeFunzione')`
> lato client e `onCall(..., async (request) => { ... request.auth ... })` lato server, stai
> guardando i due capi dello stesso filo. Non esiste un file di routing HTTP da cercare altrove:
> il nome della stringa (`'creaCliente'`, `'salvaXP'`...) *è* l'indirizzo, e deve combaciare
> esattamente con il nome della funzione esportata da `functions/src/index.js`.

### REST tradizionale vs. Cloud Function callable — in sintesi

| Aspetto | REST "a mano" (es. Express + fetch) | Callable Firebase |
|---|---|---|
| Autenticazione | Il client deve recuperare e allegare il token manualmente | Automatica: l'SDK client allega il token, il server lo riceve già verificato in `request.auth` |
| CORS | Da configurare esplicitamente sul server | Gestito dal protocollo callable di Firebase |
| Formato richiesta/risposta | Libero (JSON, form-data, ecc.), da concordare a mano | JSON serializzato/deserializzato automaticamente dall'SDK |
| Chi può chiamarla | Chiunque conosca l'URL (poi eventualmente filtrato da middleware) | Chiunque abbia le credenziali Firebase dell'app — ma **`request.auth` può comunque essere `null`** se l'utente non è loggato: la funzione deve comunque validare esplicitamente (vedi `requireAuth`) |
| Deploy | Infrastruttura a scelta | Firebase Cloud Functions, una regione dichiarata esplicitamente (`europe-west1` qui) |

### Perché spostare certe scritture sul server invece di lasciarle dirette dal client

Non è una scelta stilistica. Leggendo il codice reale di `creaCliente.js`, `eliminaCliente.js`,
`salvaXP.js` e `salvaCampionamento.js` (analizzati in dettaglio più sotto), emergono almeno
tre motivi concreti e verificabili, diversi da caso a caso:

1. **Privilegi che il client non può avere per definizione.** `creaCliente` crea un account
   Firebase Auth per il nuovo cliente con `getAuth().createUser({ email, password })` — questa
   è una API dell'**Admin SDK** (`firebase-admin/auth`), disponibile solo in un ambiente
   server fidato. Un client non può creare account Auth altrui con privilegi amministrativi:
   sarebbe una falla di sicurezza enorme se un browser potesse farlo. Stessa cosa in
   `eliminaCliente`, che elimina l'account Auth del cliente con `getAuth().deleteUser(...)`.

2. **Non fidarsi di calcoli "contendibili" fatti dal client.** `salvaCampionamento` non
   riceve percentili già calcolati dal client — riceve `testValues` (i valori grezzi delle
   misurazioni: tempi, ripetizioni, centimetri) e li ricalcola da zero, server-side, con la
   stessa formula usata dal client per l'anteprima (`calcPercentileEx`, mirrorata in
   `functions/src/shared/percentile.js`). Il commento alla riga 7 di
   `saveCampionamentoUseCase.js` lo dice esplicitamente: *"Il BE calcola i percentili
   server-side dai valori grezzi (testValues)"*. Il motivo è che percentili, rank e XP sono
   dati **competitivi** — alimentano classifiche (`GroupLeaderboard.jsx`) e sblocco di rank —
   e un client compromesso o modificato ad-hoc potrebbe altrimenti auto-dichiararsi un
   percentile falso per scalare la classifica.

3. **Operazioni multi-documento coordinate, con rollback che richiede privilegi admin.**
   `creaCliente` scrive in un unico batch atomico tre documenti diversi (cliente, `users/{uid}`,
   contatore `clientCount` dell'org) — e se il batch fallisce **dopo** aver già creato l'account
   Auth, esegue un rollback esplicito eliminando quell'account (`getAuth().deleteUser(clientUid)`,
   righe 80-82). Anche questo rollback richiede l'Admin SDK.

> 📎 **Approfondimento: l'Admin SDK bypassa sempre le Firestore Security Rules**
>
> Questo è un concetto che sorprende molti sviluppatori alla prima esperienza con Cloud
> Functions: quando il codice server-side usa `firebase-admin/firestore` (come fanno tutte
> le funzioni in `functions/src/callable/`), **le Firestore Security Rules non vengono mai
> valutate**. Le rules (quelle che analizzeremo nel dettaglio nella Lezione 16) sono un
> meccanismo di autorizzazione pensato per il client SDK (`firebase/firestore`, quello che usa
> il browser) — l'Admin SDK gira con privilegi equivalenti a un amministratore del database,
> proprio perché gira in un ambiente considerato fidato (un server Google, non un browser
> controllato dall'utente finale).
>
> Questo significa che **qualsiasi controllo scritto solo nelle Firestore Rules non protegge
> automaticamente un percorso di scrittura che passa da una Cloud Function**: se una regola
> dice "puoi creare un cliente solo se sei sotto il limite del piano", quella regola si applica
> a una scrittura diretta dal client SDK — non a `creaCliente`, che scrive con l'Admin SDK e
> quindi la ignora completamente. Qualunque validazione di business logic debba valere anche
> per il percorso server, va **riscritta esplicitamente dentro la Cloud Function stessa**. Lo
> verifichiamo con un caso reale più sotto, in "Errori comuni".

## Dove compare nel progetto

- [`src/usecases/createClientUseCase.js`](../../src/usecases/createClientUseCase.js)
- [`src/usecases/deleteClientUseCase.js`](../../src/usecases/deleteClientUseCase.js)
- [`src/usecases/saveXPUseCase.js`](../../src/usecases/saveXPUseCase.js)
- [`src/usecases/saveCampionamentoUseCase.js`](../../src/usecases/saveCampionamentoUseCase.js)
- [`src/usecases/saveBiaUseCase.js`](../../src/usecases/saveBiaUseCase.js) — citata per risolvere il gancio della Lezione 12
- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — chi chiama gli usecase, con optimistic update
- [`src/utils/auditLog.js`](../../src/utils/auditLog.js)
- [`functions/src/index.js`](../../functions/src/index.js) — entry point, mappa di tutte le funzioni esportate
- [`functions/src/callable/creaCliente.js`](../../functions/src/callable/creaCliente.js)
- [`functions/src/callable/eliminaCliente.js`](../../functions/src/callable/eliminaCliente.js)
- [`functions/src/callable/salvaXP.js`](../../functions/src/callable/salvaXP.js)
- [`functions/src/callable/salvaCampionamento.js`](../../functions/src/callable/salvaCampionamento.js)
- [`functions/src/shared/auth.js`](../../functions/src/shared/auth.js) — `requireOrgAccess` e le altre guardie
- [`functions/src/shared/gamification.js`](../../functions/src/shared/gamification.js) — mirror server-side di `src/utils/gamification.js`
- [`src/firebase/services/clients.js`](../../src/firebase/services/clients.js) — `updateClient`, il varco diretto rimasto
- [`src/features/client/useMisure.js`](../../src/features/client/useMisure.js) e [`src/features/client/client-view/avatar/AvatarPicker.jsx`](../../src/features/client/client-view/avatar/AvatarPicker.jsx) — i due unici consumer reali di `updateClient`
- [`firestore.rules`](../../firestore.rules), righe 144-151 — la regola `clients` che vedremo essere bypassata dal percorso server

**Nota importante prima di procedere.** Non trovi in questa lista `firebase/services/clients.js`
descritto con `addClient`/`deleteClient`, anche se una parte di `CLAUDE.md` (sezione "File
critici") li cita ancora: *"firebase/services/clients.js → addClient/deleteClient usano batch
+ counter"*. Verificato leggendo il file: quelle funzioni **non ci sono più** in `clients.js`
oggi. La logica descritta (batch + counter) esiste ancora, comportamentalmente identica — ma
oggi vive server-side, dentro `creaCliente.js`/`eliminaCliente.js`, non più in un file
`firebase/services/`. È un esempio reale di documentazione rimasta indietro rispetto a un
refactor architetturale (la migrazione al backend, completata a fine luglio 2026): un promemoria
concreto che, quando la documentazione e il codice non collimano, è sempre il codice ad avere
l'ultima parola.

## Analisi del codice

### Lato client — i quattro usecase

```js
// src/usecases/createClientUseCase.js
import { httpsCallable }     from 'firebase/functions'
import { functions }         from '../firebase/config'
import { auditLog, AUDIT_ACTIONS } from '../utils/auditLog'

const _creaCliente = httpsCallable(functions, 'creaCliente')

export async function createClientUseCase(orgId, trainerId, formData) {
  const { data } = await _creaCliente({ orgId, trainerId, formData })
  auditLog(AUDIT_ACTIONS.CLIENT_CREATED, { clientId: data.id, clientName: data.name, orgId })
  return data
}
```

- **Riga 5**: `httpsCallable(functions, 'creaCliente')` viene chiamata **a livello di modulo**,
  non dentro la funzione esportata — significa che il "collegamento" alla Cloud Function viene
  creato una sola volta, al primo import del file, e riusato a ogni chiamata di
  `createClientUseCase`. `functions` è la stessa istanza esportata da `firebase/config.js`
  (Lezione 11), configurata con `region: 'europe-west1'` — deve combaciare con
  `onCall({ region: 'europe-west1' }, ...)` lato server, altrimenti la chiamata fallirebbe.
- **Riga 8**: `const { data } = await _creaCliente({ orgId, trainerId, formData })` — il
  payload passato è un oggetto JS qualsiasi, serializzato in JSON dall'SDK. La risposta della
  Cloud Function arriva nella proprietà `.data` dell'oggetto restituito (questo è il contratto
  fisso dell'SDK callable, non una scelta del progetto).
- **Riga 9**: `auditLog(AUDIT_ACTIONS.CLIENT_CREATED, ...)` viene chiamato **dopo** che la
  callable è già tornata con successo — non prima, non in parallelo. Ci torniamo a fondo più
  sotto: qui basti notare che avviene lato client, con `AUDIT_ACTIONS.CLIENT_CREATED` che vale
  la stringa `'client.created'` (guarda `utils/auditLog.js`, riga 16).

```js
// src/usecases/deleteClientUseCase.js
import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaCliente = httpsCallable(functions, 'eliminaCliente')

export async function deleteClientUseCase(orgId, clientId) {
  const { data } = await _eliminaCliente({ orgId, clientId })
  return data
}
```

Stessa struttura minimale — e nota cosa **manca** rispetto a `createClientUseCase`: nessuna
chiamata ad `auditLog` qui dentro. Se cerchi dove viene loggata l'eliminazione di un cliente,
non è in questo file: è in `hooks/useClients.js`, riga 102 (`handleDeleteClient`), **dopo** aver
atteso `deleteClientUseCase`. È un'incoerenza di collocazione (a volte l'audit vive dentro
l'usecase, a volte dentro l'hook chiamante) su cui torniamo in "Errori comuni".

```js
// src/usecases/saveXPUseCase.js
import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaXP = httpsCallable(functions, 'salvaXP')

export async function saveXPUseCase(orgId, client, xpToAdd, note, _update) {
  await _salvaXP({ orgId, clientId: client.id, xpToAdd, note })
}
```

Nota il quinto parametro, `_update` — il prefisso underscore è la convenzione JS/TS per "questo
parametro esiste nella firma ma non viene usato nel corpo della funzione". Guardando chi chiama
`saveXPUseCase` (`useClients.js`, riga 86: `await saveXPUseCase(orgId, client, xpToAdd, note, update)`),
`update` è il risultato del calcolo XP fatto **lato client** con `buildXPUpdate` (riga 79 dello
stesso file) — usato per l'aggiornamento ottimistico della UI, ma **non inviato al server**: il
server rilegge il cliente da Firestore e ricalcola tutto da sé (lo vediamo tra poco in
`salvaXP.js`, server-side). Il parametro è lì probabilmente per simmetria di firma con
`saveCampionamentoUseCase` (che ha lo stesso pattern), non perché serva davvero qui.

```js
// src/usecases/saveCampionamentoUseCase.js
import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaCampionamento = httpsCallable(functions, 'salvaCampionamento')

export async function saveCampionamentoUseCase(orgId, client, _update, testValues) {
  // Il BE calcola i percentili server-side dai valori grezzi (testValues).
  await _salvaCampionamento({ orgId, clientId: client.id, testValues: testValues ?? {} })
}
```

Il commento è testuale nel file — ed è la chiave di lettura di tutto questo usecase: al server
non arriva `update` (il patch già calcolato lato client, di nuovo prefissato con `_` per
segnalare che non viene usato), arrivano solo `testValues`, i dati grezzi. Il client calcola
comunque `update` per l'anteprima ottimistica immediata (UX: l'utente vede subito il nuovo
rank/XP senza aspettare il roundtrip di rete) — ma quel calcolo è "usa e getta" ai fini della
UI, non è mai la fonte di verità persistita.

### Lato server — l'entry point

```js
// functions/src/index.js (estratto)
import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { chiudiSessione }          from './callable/chiudiSessione.js'
export { salvaCampionamento }      from './callable/salvaCampionamento.js'
export { salvaXP }                 from './callable/salvaXP.js'
export { salvaBia }                from './callable/salvaBia.js'
export { creaCliente }             from './callable/creaCliente.js'
export { eliminaCliente }              from './callable/eliminaCliente.js'
// ... altre 20 funzioni esportate allo stesso modo
```

`initializeApp()` qui (riga 29, **senza** argomenti) è l'inizializzazione dell'**Admin SDK**
(`firebase-admin/app`) — da non confondere con `initializeApp(firebaseConfig)` di
`src/firebase/config.js`, che è il **client SDK**. Sono due pacchetti npm diversi
(`firebase-admin` vs `firebase`), con API diverse, anche se il nome della funzione di
bootstrap è identico per convenzione dell'ecosistema Firebase. Ogni `export { nome } from './callable/nome.js'`
registra quella funzione come Cloud Function deployabile con esattamente quel nome — è
questo il file che determina quali stringhe sono valide come secondo argomento di
`httpsCallable(functions, '...')` lato client. Il commento all'inizio del file (righe 1-25,
non riportate qui per brevità) elenca esplicitamente quali funzioni "sostituiscono" quali
vecchi usecase client-side — una traccia utile della cronologia della migrazione.

### Lato server — `creaCliente.js`, il roundtrip più ricco

```js
// functions/src/callable/creaCliente.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }          from 'firebase-admin/auth'
import { requireOrgAccess } from '../shared/auth.js'
import { buildNewClient }   from '../shared/gamification.js'

const REGION = 'europe-west1'

const NEW_CLIENT_DEFAULTS = { level: 1, rank: 'F', rankColor: '#6b7280', xp: 0, xpNext: 500, /* ... */ }

export const creaCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, trainerId, formData } = request.data
  await requireOrgAccess(request, orgId)

  if (!formData?.email || !formData?.password) {
    throw new HttpsError('invalid-argument', 'email e password sono obbligatori')
  }

  const { email, password, testValues = {}, stats = {}, ...anagrafica } = formData

  let clientUid
  try {
    const userRecord = await getAuth().createUser({ email, password })
    clientUid = userRecord.uid
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email già in uso')
    }
    throw new HttpsError('internal', `Errore creazione account: ${err.message}`)
  }

  const data = buildNewClient(trainerId, { ...anagrafica, testValues, stats }, NEW_CLIENT_DEFAULTS)

  const db = getFirestore()
  const clientRef = db.collection(`organizations/${orgId}/clients`).doc()
  const clientId  = clientRef.id

  try {
    const batch = db.batch()
    batch.set(clientRef, { ...data, email, clientAuthUid: clientUid, createdAt: new Date().toISOString() })
    batch.set(db.doc(`users/${clientUid}`), { role: 'client', orgId, clientId, trainerId, mustChangePassword: true })
    batch.update(db.doc(`organizations/${orgId}`), { clientCount: FieldValue.increment(1) })
    await batch.commit()
  } catch (err) {
    try { await getAuth().deleteUser(clientUid) } catch {}
    throw new HttpsError('internal', `Errore salvataggio Firestore: ${err.message}`)
  }

  db.collection('audit_logs').add({
    action: 'CLIENT_CREATED', uid: request.auth?.uid ?? null, email: request.auth?.token?.email ?? null,
    timestamp: new Date().toISOString(), details: { clientId, clientName: data.name, orgId }, env: 'functions',
  }).catch(() => {})

  return { id: clientId, ...data, email, clientAuthUid: clientUid }
})
```

Riga per riga, con lente sulle scelte non ovvie:

- **Riga 8**: `const REGION = 'europe-west1'` — questa è la controparte esatta della stringa
  vista in `firebase/config.js`. Le due stringhe non hanno nessun meccanismo automatico che le
  tenga sincronizzate: sono due file completamente separati (`src/` vs `functions/`), in due
  progetti npm distinti con `package.json` propri. Se un domani si cambiasse regione, andrebbero
  aggiornate a mano in entrambi i posti.
- **Riga 30**: `await requireOrgAccess(request, orgId)` — è il primo controllo eseguito, prima
  di qualunque logica di business. Se questa `await` lancia (perché l'utente non è autenticato,
  o non appartiene a quell'org, o il suo ruolo non è tra quelli ammessi), l'esecuzione della
  funzione si interrompe lì: nessun account Auth verrà creato, nessuna scrittura avverrà.
  Analizziamo `requireOrgAccess` a fondo più sotto.
- **Righe 32-34**: validazione dei parametri minimi (`email`/`password`) con `HttpsError('invalid-argument', ...)`.
  `HttpsError` è la classe con cui una Cloud Function callable comunica un errore "strutturato"
  al client — arriva dall'altra parte come un errore JS con `.code` e `.message` leggibili
  (non un generico 500), permettendo alla UI di mostrare messaggi mirati (vedi
  `getFirebaseErrorMessage`, citato in `CLAUDE.md` tra gli import corretti del progetto).
- **Righe 40-48**: `getAuth().createUser({ email, password })` — **questa è l'operazione che
  nessun client potrebbe mai eseguire da solo**: crea un account Firebase Auth per conto di
  qualcun altro. È il motivo architetturale più forte per cui l'intera creazione cliente deve
  vivere qui e non nel browser. L'errore `'auth/email-already-exists'` viene tradotto in un
  `HttpsError('already-exists', ...)` più leggibile per il client.
- **Riga 50**: `buildNewClient(trainerId, {...}, NEW_CLIENT_DEFAULTS)` — questa è la stessa
  funzione che esiste, **duplicata riga per riga**, in `src/utils/gamification.js`. Il file
  server la importa da `functions/src/shared/gamification.js`, che dichiara esplicitamente
  nel proprio commento di intestazione: *"Logica gamification lato server — speculare a
  src/utils/gamification.js"*. È un mirror manuale, non un modulo condiviso via workspace/monorepo
  — se la formula di progressione livello cambiasse in uno dei due file, andrebbe cambiata
  anche nell'altro a mano. Ne parliamo in "Errori comuni".
- **Righe 56-78**: il batch atomico — tre scritture (`clientRef`, `users/{clientUid}`,
  incremento di `clientCount`) che vanno a buon fine **tutte insieme o nessuna**
  (`batch.commit()`, riga 78). Se una fallisse a metà senza batch, si rischierebbe uno stato
  inconsistente (es. account Auth creato ma nessun documento cliente).
- **Righe 79-82 — il rollback**: se il batch fallisce, la funzione elimina esplicitamente
  l'account Auth appena creato (`getAuth().deleteUser(clientUid)`), dentro un `try/catch` che
  ignora silenziosamente un eventuale secondo errore (l'utente potrebbe già non esistere più).
  Questo compensa manualmente la mancanza di "transazionalità" tra due sistemi diversi
  (Firebase Auth e Firestore non condividono una transazione atomica nativa) — è application-level
  rollback, scritto a mano, non un meccanismo del database.
- **Righe 85-93 — l'audit log server-side**: `db.collection('audit_logs').add({ action: 'CLIENT_CREATED', ... })`,
  con `.catch(() => {})` per non far fallire l'intera richiesta se la scrittura dell'audit
  fallisse ("fire and forget", stesso principio dichiarato per la versione client-side in
  `CLAUDE.md`). Nota `action: 'CLIENT_CREATED'` — **maiuscolo, snake case**. Confrontalo con
  `AUDIT_ACTIONS.CLIENT_CREATED` lato client, che vale `'client.created'` (minuscolo, punto).
  **Sono due stringhe diverse per lo stesso evento.** Ne parliamo subito.

### Il doppio audit log — una scoperta concreta, non un'ipotesi

Mettendo fianco a fianco `createClientUseCase.js` (client, riga 9) e `creaCliente.js` (server,
righe 85-93), il codice reale mostra che **la creazione di un cliente scrive due voci di audit
log distinte** in `/audit_logs`, per lo stesso evento:

| | Lato server (`creaCliente.js`) | Lato client (`createClientUseCase.js`) |
|---|---|---|
| `action` | `'CLIENT_CREATED'` | `AUDIT_ACTIONS.CLIENT_CREATED` = `'client.created'` |
| Quando | Dentro la Cloud Function, subito dopo il batch commit | Dopo che la callable è già tornata con successo |
| `uid`/`email` | Da `request.auth` | Da `getAuth(app).currentUser` (client SDK) |
| `userAgent` | **Assente** — l'oggetto scritto non ha questo campo | Presente: `navigator.userAgent` (riga 46 di `auditLog.js`) |

Non è un'ipotesi da manuale: è quello che i due file fanno, verificato leggendoli entrambi per
intero. È tentante liquidarlo come "un bug di duplicazione lasciato dalla migrazione" — ed è
plausibile che sia esattamente questo (probabile: originariamente l'audit viveva solo lato
client, come accade ancora oggi per `CLIENT_DELETED` in `useClients.js`; quando la scrittura è
stata spostata al server, è stato aggiunto un audit anche lì, senza rimuovere quello preesistente
lato client). Ma c'è anche un argomento tecnico reale a favore di **non** rimuovere del tutto
quello client-side: il campo `userAgent` (che fa parte dello schema ufficiale di `audit_logs`
documentato in `CLAUDE.md`) può essere popolato **solo** lato browser — `navigator` non esiste
in un ambiente Node.js/Cloud Functions. Se l'audit vivesse solo server-side, quel campo
sarebbe perso per sempre su questo tipo di evento.

Quindi la risposta onesta alla domanda "è un limite o una scelta ragionata?" è: **probabilmente
entrambe le cose contemporaneamente**. È un residuo di migrazione non ripulito (il naming
diverso, `'CLIENT_CREATED'` vs `'client.created'`, non ha alcuna giustificazione tecnica — è
puro debito di coerenza, e rende più complicato interrogare `audit_logs` filtrando per
`action` in modo uniforme). Ma il fatto che l'audit avvenga *anche* lato client ha un motivo
reale legato a un dato (`userAgent`) che il server non può fornire. La lezione per te come
sviluppatore: quando trovi una duplicazione apparente nel codice, cerca sempre se c'è un
motivo tecnico dietro prima di eliminarla — a volte c'è, a volte no, ma va verificato, non
assunto.

### Lato server — `eliminaCliente.js`, coordinazione multi-collezione

```js
export const eliminaCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId } = request.data
  if (!orgId || !clientId) throw new HttpsError('invalid-argument', 'orgId e clientId sono obbligatori')
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const clientDoc = await clientRef.get()
  if (!clientDoc.exists) throw new HttpsError('not-found', 'Cliente non trovato')

  const clientData    = clientDoc.data()
  const clientAuthUid = clientData.clientAuthUid ?? null

  const groupsSnap = await db.collection(`organizations/${orgId}/groups`).get()
  const groupsToUpdate = groupsSnap.docs.filter(g => (g.data().clientIds ?? []).includes(clientId))

  const batch = db.batch()
  batch.delete(clientRef)
  if (clientAuthUid) batch.delete(db.doc(`users/${clientAuthUid}`))
  batch.update(db.doc(`organizations/${orgId}`), { clientCount: FieldValue.increment(-1) })
  groupsToUpdate.forEach(g => {
    batch.update(g.ref, { clientIds: (g.data().clientIds ?? []).filter(id => id !== clientId) })
  })

  await batch.commit()

  if (clientAuthUid) {
    try { await getAuth().deleteUser(clientAuthUid) } catch { /* utente già assente in Auth */ }
  }

  return { ok: true }
})
```

Nota la **sequenza**: prima una lettura (`groupsSnap`, per sapere quali gruppi contengono
questo cliente), poi un batch che tocca fino a `2 + N` documenti (cliente, eventuale utente
Auth, org counter, più un update per ogni gruppo che lo conteneva), e **solo dopo** che il
batch è confermato, l'eliminazione dell'account Auth (fuori dal batch, perché Firebase Auth
non fa parte di Firestore e non può entrare in un batch write). Come già notato nella Lezione
11, questo batch **non tocca** `clients/{clientId}/notes` — le note del cliente restano
orfane. E, a differenza di `creaCliente.js`, questa funzione **non scrive nessuna voce in
`audit_logs`** — l'unico audit per `CLIENT_DELETED` avviene lato client, in `useClients.js`
riga 102, dopo l'`await` di `deleteClientUseCase`. Quindi per la creazione l'audit è doppio
(client + server, naming diverso); per l'eliminazione è singolo (solo client). Un'altra
asimmetria reale, non ipotetica, tra le due funzioni "gemelle" per struttura ma diverse per
dettagli di implementazione.

### Lato server — `salvaXP.js` e `salvaCampionamento.js`, la stessa forma

```js
export const salvaXP = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, xpToAdd, note } = request.data
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const snap = await clientRef.get()
  if (!snap.exists) throw new Error('Cliente non trovato')

  const client = { id: clientId, ...snap.data() }
  const { update } = buildXPUpdate(client, xpToAdd, note)   // ricalcolato server-side da zero

  const batch = db.batch()
  batch.update(clientRef, update)
  if (client.clientAuthUid) {
    batch.set(db.collection(`organizations/${orgId}/notifications`).doc(), { clientId, message: `...`, type: 'xp', ... })
  }
  await batch.commit()
  return { ok: true }
})
```

Il punto centrale: `buildXPUpdate(client, xpToAdd, note)` viene chiamata **qui**, dopo aver
riletto `client` fresco da Firestore con `snap.data()` — non riceve in nessun modo l'`update`
che il client aveva già calcolato per l'anteprima ottimistica (visto sopra: il quinto
parametro `_update` di `saveXPUseCase` non viene nemmeno spedito al server, il payload della
callable non lo contiene). Il client dice solo "aggiungi `xpToAdd` XP a questo cliente, con
questa nota" — quanto XP sia esattamente necessario per il prossimo livello, qual è il livello
risultante, tutto questo lo decide sempre e solo il server, leggendo lo stato *attuale* del
documento. Questo evita anche un problema di "stato stantio": se il client avesse calcolato
`update` sulla base di dati vecchi (es. un altro trainer ha già aggiunto XP nel frattempo),
inviare quel calcolo pre-fatto al server persisterebbe un valore sbagliato — mentre rileggere
fresco (righe `clientRef.get()`) mitiga (senza eliminare del tutto — non c'è una transazione
Firestore esplicita qui, solo un `get()` seguito da un `batch.update()`) il rischio di
sovrascrivere un aggiornamento concorrente.

`salvaCampionamento.js` segue la stessa forma, con l'aggiunta del ricalcolo dei percentili già
discusso:

```js
export const salvaCampionamento = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, testValues = {} } = request.data
  await requireOrgAccess(request, orgId)
  // ... legge il client fresco, poi:
  const newStats = {}
  for (const test of TESTS_META.filter(t => t.categories.includes(categoria))) {
    const finalValue = resolveTestInput(test, testValues)          // dai valori grezzi
    if (finalValue !== null) {
      const { value } = calcPercentileEx(test.stat, finalValue, sex, clientAge, test.key)
      if (value !== null) newStats[test.stat] = value
    }
  }
  const { update } = buildCampionamentoUpdate(client, newStats, testValues)
  // ... batch update + notifica
})
```

`newStats` — i percentili — non arrivano mai dal client in questa funzione: vengono ricostruiti
da zero, test per test, a partire da `testValues` (i numeri grezzi immessi dal trainer, es.
"12.4 secondi" per uno sprint). Anche `TESTS_META`, `calcPercentileEx` e `applyFormula`
(usate qui) sono copie server-side (`functions/src/shared/`) delle rispettive controparti
client (`constants/tests.js`, `utils/percentile.js`, `utils/formulas.js`) — lo stesso pattern
di mirror manuale già visto per `gamification.js`.

### `shared/auth.js` — le guardie usate da tutte le callable

```js
export async function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticazione richiesta')
  const db      = getFirestore()
  const userDoc = await db.collection('users').doc(request.auth.uid).get()
  if (!userDoc.exists) throw new HttpsError('not-found', 'Profilo utente non trovato')
  return { uid: request.auth.uid, ...userDoc.data() }
}

export async function requireOrgAccess(request, orgId) {
  const profile = await requireAuth(request)
  if (profile.role === 'super_admin') return profile
  if (!['org_admin', 'trainer'].includes(profile.role)) {
    throw new HttpsError('permission-denied', 'Permessi insufficienti')
  }
  if (profile.orgId !== orgId) {
    throw new HttpsError('permission-denied', 'Accesso negato a questa organizzazione')
  }
  return profile
}
```

`requireOrgAccess` — usata identica in tutte e quattro le callable analizzate — fa tre cose in
sequenza: (1) verifica che `request.auth` esista (cioè che la richiesta porti un token valido —
questo è ciò che l'SDK ha allegato automaticamente, ma va comunque controllato: **`request.auth`
può essere `null`** se qualcuno chiama la funzione senza essere loggato, la sola esistenza del
protocollo callable non basta come autenticazione); (2) rilegge il profilo da `users/{uid}` per
sapere il **ruolo reale** dell'utente (non fidandosi di un ruolo che il client potrebbe
dichiarare nel payload); (3) verifica che quel ruolo sia tra quelli ammessi (`org_admin` o
`trainer`, oppure `super_admin` che bypassa il controllo org) **e** che `profile.orgId`
combaci con l'`orgId` richiesto nell'operazione — impedendo a un trainer dell'organizzazione
A di operare sui dati dell'organizzazione B anche se conoscesse l'`orgId` giusto da passare
nel payload.

### `recalcolaCampionamenti` — l'eccezione alla regola delle 31

Le quattro operazioni viste finora seguono tutte lo stesso schema: un file in `usecases/`,
un file in `functions/src/callable/`, un rapporto 1:1. Sembra una regola assoluta. Non lo è
— e non per ipotesi, contando i file:

```
functions/src/callable/*.js  →  32 file
src/usecases/*.js            →  31 file
```

La differenza è `recalcolaCampionamenti.js`. Nessun `recalcolaCampionamentiUseCase.js` la
avvolge. Chi la chiama, allora? `AdminDashboard.jsx` (area super_admin), diretto:

```js
// src/features/admin/admin-pages/AdminDashboard.jsx, riga 8
const _recalcola = httpsCallable(functions, 'recalcolaCampionamenti')

// riga 39 — handleDryRun
const { data } = await _recalcola({ dryRun: true })

// riga 50 — handleConfirmRecalc, dopo che l'admin ha visto il report del dry-run
const { data } = await _recalcola({ dryRun: false })
```

Il nome è quasi identico a uno script che già conosci se hai guardato la cartella
`scripts/`: `recalcolo-campionamenti.mjs`. La tentazione è pensare "ok, quindi lo script
chiama questa callable". **Verificato riga per riga: falso.** Lo script non fa nessuna
`httpsCallable` — importa `firebase-admin`, si autentica con un file di service account
passato da riga di comando, e scrive su Firestore per conto proprio:

```js
// scripts/recalcolo-campionamenti.mjs
import admin from 'firebase-admin'
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()
// ... ricalcola percentili e media, scrive direttamente
```

La callable non lo invoca né viene invocata da lui. Sono **due implementazioni
indipendenti della stessa logica**, e non serve indovinare il perché: il commento in
testa a `recalcolaCampionamenti.js` lo dice esplicitamente —

> *"Migra la logica di scripts/recalcolo-campionamenti.mjs lato server."*

Lo script è nato prima — un tool da terminale, per un dev con in mano una chiave di
service account, dopo una correzione alle tabelle percentili. La callable è arrivata
dopo: la stessa logica riscritta per essere richiamabile in sicurezza dall'admin via
UI, con `requireRole(['super_admin'])` al posto di una chiave JSON, e un `dryRun` che
mostra un report prima di scrivere per davvero.

```
scripts/recalcolo-campionamenti.mjs          functions/src/callable/recalcolaCampionamenti.js
  (nato prima — terminale + service account)    (nato dopo — stessa logica, per l'app)
        │                                                    │
        ▼                                                    │  requireRole(super_admin)
   Firestore ◄─────────────────────────────────  dryRun? ────┤  no scrittura, solo report
   (scrittura diretta,                                       │
    Admin SDK)                                                ▼
                                                          Firestore
                                                       (scrittura reale)

   nessuna freccia tra i due riquadri in alto: non si chiamano a vicenda
```

Perché è l'unica eccezione? Probabilmente perché non è un'operazione CRUD su un singolo
record (il pattern per cui `usecases/` è stato pensato) ma un'operazione batch, rara,
attivata a mano dopo un cambio alle tabelle di riferimento — meno "un'azione utente",
più "un tasto di servizio". Questo non la rende innocua da ignorare: se un giorno cerchi
"quali Cloud Function chiama l'app" grep-ando solo `src/usecases/`, questa ti scapperà.
La lezione per te: una convenzione con un'eccezione sola è ancora una buona convenzione
— ma solo se sai *dov'è* l'eccezione, non se la assumi inesistente.

## Diagramma mentale

Roundtrip completo per `creaCliente`, dal click del trainer alla risposta:

```
NewClientView.jsx (form compilato dal trainer)
   │  handleAddClient(formData)          [hooks/useClients.js]
   ▼
createClientUseCase(orgId, trainerId, formData)     [src/usecases/createClientUseCase.js]
   │
   │  _creaCliente({ orgId, trainerId, formData })
   │  ── httpsCallable allega automaticamente il token ID Auth del trainer ──
   ▼
                    [ rete: 1 richiesta HTTPS verso Cloud Functions, europe-west1 ]
                                          │
                                          ▼
onCall handler `creaCliente`             [functions/src/callable/creaCliente.js]
   │
   ├─ requireOrgAccess(request, orgId)   → legge users/{uid}, verifica ruolo+org
   ├─ getAuth().createUser(...)          → crea account Firebase Auth (Admin SDK)
   ├─ buildNewClient(...)                → calcola xp/rank/level iniziali (mirror server)
   ├─ batch: set client, set users/{uid}, increment(clientCount)
   ├─ batch.commit()                     → atomico: tutto o niente
   ├─ (se fallisce → deleteUser rollback)
   └─ audit_logs.add({ action:'CLIENT_CREATED', ... })   → fire and forget
   │
   ▼  return { id, ...data, email, clientAuthUid }
                                          │
                    [ rete: risposta HTTPS, deserializzata in { data } ]
                                          │
   ◄──────────────────────────────────────
   │
createClientUseCase riceve { data }
   │  auditLog(AUDIT_ACTIONS.CLIENT_CREATED, ...)   → SECONDA voce di audit, lato client
   ▼
useClients.js: setClients(prev => [...prev, newClient])   → UI aggiornata con la risposta reale
```

Il pattern ibrido dell'intero progetto, riassunto:

```
┌─────────────────────────────────────────────────────────────────────┐
│ LETTURE               → sempre dirette (firebase/services/*.js)      │
│                          getDocs/getDoc — nessun overhead di rete    │
│                          aggiuntivo, nessun dato sensibile da        │
│                          proteggere in lettura (le rules bastano)    │
├─────────────────────────────────────────────────────────────────────┤
│ SCRITTURE SENSIBILI   → Cloud Function callable (usecases/)          │
│                          creaCliente, eliminaCliente, salvaXP,       │
│                          salvaCampionamento, salvaBia, ecc.           │
│                          Criterio verificato nel codice: tocca un    │
│                          account Auth altrui, un contatore di org,   │
│                          o un dato "competitivo" (XP/rank/percentile)│
├─────────────────────────────────────────────────────────────────────┤
│ SCRITTURE NON SENSIBILI → ancora dirette (updateClient)               │
│                          misure (peso/altezza) via useMisure.js,     │
│                          avatarId via AvatarPicker.jsx — campi di    │
│                          proprietà del cliente, non competitivi,     │
│                          non toccano contatori né account altrui,    │
│                          protetti comunque dalle Firestore Rules     │
│                          (canWrite, o whitelist stretta per il       │
│                          cliente sul proprio stesso documento)       │
└─────────────────────────────────────────────────────────────────────┘
```

## Il gancio risolto: perché `updateClient` resta diretto

Nella Lezione 12 avevamo lasciato la domanda aperta guardando il commento di `clients.js`
riga 19: *"updateClient rimane — usato per aggiornamenti diretti (BIA, peso/altezza, ecc.)"*.
Verifichiamolo, invece di darlo per buono.

Una ricerca di `updateClient` in tutto `src/` mostra **solo due chiamate reali** oltre alla
definizione:

- `src/features/client/useMisure.js`, riga 31: `await updateClient(orgId, client.id, patch)` —
  dove `patch` contiene solo `peso`/`altezza`/`misureHistory` (via `arrayUnion`).
- `src/features/client/client-view/avatar/AvatarPicker.jsx`, riga 19:
  `await updateClient(orgId, clientId, { avatarId })`.

**La BIA non c'è.** Cercando `saveBiaUseCase` si trova un usecase dedicato (`src/usecases/saveBiaUseCase.js`),
basato su `httpsCallable(functions, 'salvaBia')` — la BIA è stata migrata a Cloud Function
esattamente come XP e campionamento, con lo stesso principio: il server rilegge il client e
ricalcola l'XP guadagnato, come dichiara il commento nel file stesso (*"Il BE rilegge il
client da Firestore, ricalcola XP e persiste in batch atomico"*). Il commento nella riga 19
di `clients.js` è quindi **parzialmente non aggiornato**: descrive uno stato precedente in
cui anche la BIA passava da `updateClient`, prima che venisse migrata come le altre.

La vera linea di demarcazione, ricostruita dal codice attuale (non dal commento) è più netta
di quanto sembrasse:

- `updateClient` oggi tocca **solo** campi che (a) non intaccano nessun contatore a livello
  di organizzazione, (b) non richiedono creare/eliminare un account Auth altrui, e (c) non
  alimentano nessuna logica "competitiva" (XP, rank, percentili, classifiche).
- Questo è confermato anche dalle Firestore Rules stesse (`firestore.rules`, righe 148-150):
  un client loggato come ruolo `'client'` può aggiornare il **proprio** documento solo su un
  elenco chiuso di campi — `['wearable', 'avatarId', 'badgeShowcase']` — via `isOwnClient`.
  Le misure (`peso`/`altezza`) **non** sono in quella whitelist: infatti `useMisure.js` viene
  chiamato dal contesto trainer (`useTrainerState()`, non un contesto "client self-service"),
  quindi la scrittura passa comunque dal controllo `canWrite(orgId)` (riservato a
  trainer/org_admin/super_admin), non dall'eccezione per il cliente stesso.

In altre parole: `updateClient` non è un varco "generico e non protetto" — resta protetto due
volte, dalle Firestore Rules (per chi può scriverci) e dalla natura dei campi che tocca (per
cosa può scriverci). Non serve spostarlo su una Cloud Function perché il danno massimo
possibile di un client "bugiardo" su questi campi — un peso finto, un avatar diverso da quello
"giusto" — non ha impatto su nessun altro utente, su nessun limite di piano, su nessuna
classifica. È esattamente l'opposto del rischio che giustifica lo spostamento al server per
`creaCliente`/`salvaXP`/`salvaCampionamento`.

## Errori comuni

**1. Pensare che "spostare al server" renda automaticamente tutto sicuro — verificato che NON
era sempre vero qui, ed è stato un bug reale trovato scrivendo questa lezione.** Le Firestore
Rules per la creazione di un cliente (`firestore.rules`, riga 146-147) includono un controllo
esplicito del limite di piano: `memberRole(orgId) in ['org_admin', 'trainer'] &&
withinClientLimit(orgId)`. Ma quella regola si applica **solo** a scritture dirette dal client
SDK — e, come spiegato nell'Approfondimento sopra, l'Admin SDK usato da `creaCliente.js`
**bypassa completamente le rules**. Quando questa lezione è stata scritta la prima volta,
`creaCliente.js` non conteneva **nessun controllo esplicito del limite piano dentro la
funzione stessa** — nessun confronto tra `org.clientCount` e il limite del piano prima di
eseguire il batch con `increment(1)`. Il blocco che l'utente vedeva (`NewClientView.jsx`,
schermata invece del wizard quando `clients.length >= getPlanLimits(orgPlan).clients`) era
**solo lato UI**, facilmente aggirabile da chiunque sapesse invocare direttamente la callable
(es. dalla console del browser). Non era un'ipotesi teorica: era quello che il codice, letto
per intero, mostrava — ed è esattamente lo stesso identico gap trovato in `creaMembroTeam.js`
per il limite trainer (`memberCount`), non solo in `creaCliente.js`.

**Il fix** (commit `2c8b9fe`, deployato su `rankex-dev` e `fitquest-60a09` lo stesso giorno):
è stato aggiunto `functions/src/shared/plans.js` (speculare a `src/config/plans.config.js`,
con `isAtClientLimit`/`isAtTrainerLimit`), e sia `creaCliente.js` che `creaMembroTeam.js` ora
leggono l'org **prima** di creare l'account Auth e lanciano `HttpsError('resource-exhausted', ...)`
se il piano è già al limite (con bypass esplicito per `super_admin`, coerente con le rules).
Apri i due file oggi: il controllo che manca in questa spiegazione c'è, verificabile riga per
riga. Il codice che vedi ora è già la versione corretta — questa sezione, e la Challenge più
sotto, raccontano **come si trova e si ragiona su un gap come questo**, non un problema ancora
da risolvere.

**2. Dimenticare che una Cloud Function callable deve comunque validare l'auth esplicitamente.**
`request.auth` non è garantito essere popolato solo perché la chiamata arriva tramite il
protocollo callable — un utente non loggato (o un token scaduto/non valido) risulta in
`request.auth === null` o assente. Ogni funzione qui analizzata comincia sempre con
`requireAuth`/`requireOrgAccess` proprio per questo: **saltare questo controllo anche in una
sola nuova funzione futura significherebbe permettere chiamate anonime**.

**3. Duplicare un audit log senza convergenza di naming (visto sopra).** Se in futuro si
aggiungesse un audit lato server per un'altra azione già loggata lato client, vale la pena
riusare le stesse stringhe di `AUDIT_ACTIONS` (magari importando le costanti in un pacchetto
condiviso) invece di reinventare un formato diverso — altrimenti chi interroga `/audit_logs`
in futuro deve conoscere due convenzioni di naming per lo stesso evento.

**4. Mismatch di regione tra client e server (richiamo dalla Lezione 11).** `getFunctions(app, 'europe-west1')`
lato client deve combaciare esattamente con `onCall({ region: 'europe-west1' }, ...)` lato
server — qui verificato coerente in tutte e quattro le funzioni analizzate, ma è un
accoppiamento tra due file/progetti separati che nessun tool automatico controlla per te.

**5. Far calcolare al client dati "contendibili" e fidarsi ciecamente della risposta.**
Il contro-esempio corretto è proprio `salvaCampionamento`: il client calcola comunque i
percentili per l'anteprima ottimistica (UX), ma il server li ricalcola sempre da zero dai
valori grezzi, ignorando quelli client-side. Se un domani una nuova funzionalità aggiungesse
un valore "calcolato lato client" e lo persistesse così com'è senza ricalcolo server-side, si
romperebbe silenziosamente questa garanzia — è un pattern da riconoscere e replicare
consapevolmente, non un dettaglio implementativo casuale.

## Best Practice

**Ricalcolare sempre lato server i dati che alimentano competizione tra utenti (XP, rank,
percentili).** È il pattern più solido visto in questa lezione: il client può calcolare
liberamente per la UI, ma la persistenza definitiva non si fida mai di un valore già
calcolato ricevuto dal client — lo ricostruisce da input grezzi verificabili.

**Non assumere che una regola scritta nelle Firestore Rules protegga anche i percorsi
Admin SDK.** Ogni volta che una Cloud Function scrive con `firebase-admin/firestore`, ogni
vincolo di business che deve valere *anche* lì va scritto esplicitamente nel codice della
funzione — le rules, per quel percorso, semplicemente non vengono interpellate.

**Un solo punto di validazione per ruolo/org (`requireOrgAccess`), riusato ovunque invece di
reimplementato in ogni funzione.** Le quattro callable analizzate condividono la stessa guardia
da `shared/auth.js` — se la logica di autorizzazione cambiasse (es. un nuovo ruolo ammesso),
si cambia in un solo file, non in trenta.

**Mirror esplicito e documentato (non un `import` condiviso) tra `utils/gamification.js`
(client) e `functions/src/shared/gamification.js` (server).** È una scelta con un costo
manutentivo reale — un bug fix in una formula va applicato in due file — ma evita di
introdurre nel bundle client codice pensato per un ambiente Node.js, e viceversa. Il commento
esplicito in testa al file server (*"speculare a src/utils/gamification.js"*) è ciò che rende
questa duplicazione intenzionale riconoscibile, invece che un semplice copia-incolla dimenticato.

## Quiz

1. Cosa allega automaticamente l'SDK quando chiami `httpsCallable(functions, 'nomeFunzione')({...})`?
   A) Nessun dato aggiuntivo, è una fetch pura
   B) Il token ID dell'utente Firebase Auth attualmente loggato, come header della richiesta
   C) La cronologia delle chiamate precedenti
   D) Le Firestore Security Rules dell'app

2. Perché `creaCliente` deve necessariamente girare su un server con Admin SDK e non può essere fatto interamente dal client?
   A) Solo per motivi di performance
   B) Perché deve creare un account Firebase Auth per un altro utente — un'operazione con privilegi che il client non può avere
   C) Perché Firestore non permette scritture batch dal client
   D) Non è vero, potrebbe essere fatto interamente dal client con lo stesso livello di sicurezza

3. Cosa succede alle Firestore Security Rules quando una Cloud Function scrive con `firebase-admin/firestore`?
   A) Vengono valutate normalmente, come per il client SDK
   B) Vengono bypassate completamente — l'Admin SDK non è soggetto alle rules
   C) Vengono valutate solo per le operazioni di lettura, non di scrittura
   D) Dipende da un flag di configurazione nella Cloud Function

4. In `salvaCampionamento`, da dove arrivano i valori `newStats` (i percentili) effettivamente persistiti?
   A) Dal payload inviato dal client, già calcolati
   B) Vengono ricalcolati server-side a partire da `testValues` (i valori grezzi), ignorando eventuali calcoli client-side
   C) Da una cache Redis condivisa
   D) Vengono sempre impostati a `null` e calcolati in un secondo momento

5. Cosa fa `requireOrgAccess(request, orgId)` in `shared/auth.js`?
   A) Verifica solo che l'utente sia loggato, nient'altro
   B) Verifica autenticazione, rilegge il ruolo reale da `users/{uid}`, e controlla che l'org del profilo combaci con `orgId` richiesto (con bypass per `super_admin`)
   C) Crea automaticamente un profilo utente se non esiste
   D) Controlla solo il limite di piano dell'organizzazione

6. Verificato leggendo `creaCliente.js` per intero **oggi**: cosa controlla la funzione riguardo al limite di clienti del piano dell'organizzazione, prima di creare il nuovo cliente?
   A) Confronta `org.clientCount` con il limite del piano (via `isAtClientLimit`) e lancia `HttpsError('resource-exhausted', ...)` se al limite, con bypass per `super_admin`
   B) Nessun controllo esplicito — si affida solo al blocco UI lato client (`NewClientView.jsx`)
   C) Delega il controllo alle Firestore Rules, che vengono comunque valutate
   D) Chiede conferma esplicita all'utente prima di procedere

7. Cosa succede se il batch di scrittura in `creaCliente.js` fallisce **dopo** che l'account Firebase Auth è già stato creato?
   A) L'account Auth resta orfano per sempre, nessuna azione correttiva
   B) La funzione tenta esplicitamente di eliminare l'account Auth appena creato, come rollback manuale
   C) Firestore annulla automaticamente anche la creazione dell'account Auth
   D) La funzione va in retry automatico indefinito

8. Confrontando `createClientUseCase.js` (client) e `creaCliente.js` (server), cosa emerge riguardo all'audit log per la creazione di un cliente?
   A) Viene scritta una sola voce di audit, lato server
   B) Viene scritta una sola voce di audit, lato client
   C) Vengono scritte due voci di audit distinte, con `action` in due formati diversi (`'CLIENT_CREATED'` server vs `'client.created'` client)
   D) Non viene scritto nessun audit log per questa operazione

9. Perché il campo `userAgent` dell'audit log può essere popolato solo dalla versione client-side e non da quella server-side?
   A) È una scelta stilistica senza motivo tecnico
   B) `navigator.userAgent` è un'API del browser, non disponibile in un ambiente Node.js/Cloud Functions
   C) Il server non ha i permessi per leggere quel campo
   D) Viene sempre impostato a `"unknown"` lato server

10. Il commento sopra `updateClient` in `clients.js` cita esplicitamente `useMisure.js` e `AvatarPicker.jsx` come suoi soli chiamanti, e dice che la BIA passa da Cloud Function. Questo commento, verificato nel codice attuale, è:
    A) Completamente accurato — e lo è perché è stato riscritto apposta dopo che una versione precedente, più generica ("BIA, peso/altezza, ecc."), era diventata fuorviante
    B) Parzialmente non aggiornato: la BIA è ancora gestita da `updateClient`
    C) Completamente falso: `updateClient` non viene mai chiamato da nessun file
    D) Riguarda una funzione che non esiste più nel progetto

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B** — è il cuore del protocollo callable, spiegato nell'Approfondimento: il token ID
   viene allegato automaticamente, rendendo `request.auth` disponibile lato server. A è falsa
   (non è una fetch "nuda": l'SDK aggiunge comunque il protocollo callable). C e D non
   corrispondono a nessun comportamento reale dell'SDK.

2. **B** — `getAuth().createUser(...)` (Admin SDK) è l'operazione che nessun client potrebbe
   eseguire per un altro utente. A sottostima il vero motivo (sicurezza, non performance).
   C è falsa: i batch write esistono anche nel client SDK (`writeBatch`). D contraddice
   direttamente quanto verificato nel codice e nell'Approfondimento sull'Admin SDK.

3. **B** — è il punto centrale dell'Approfondimento "l'Admin SDK bypassa sempre le Firestore
   Security Rules". A è l'errore comune n.1 di questa lezione. C e D non corrispondono al
   comportamento reale documentato da Firebase.

4. **B** — confermato dal commento esplicito in `saveCampionamentoUseCase.js` e dal codice di
   `salvaCampionamento.js` (ciclo su `TESTS_META`, `calcPercentileEx` sui valori grezzi). A è
   l'esatto opposto di quanto verificato. C e D sono invenzioni non presenti nel codice.

5. **B** — descrive esattamente le tre verifiche in sequenza fatte da `requireOrgAccess`
   (vedi codice analizzato). A è incompleta (manca il controllo di ruolo/org). C e D
   descrivono comportamenti che questa funzione non ha.

6. **A** — verificato leggendo `creaCliente.js` per intero **oggi**: il controllo c'è,
   tramite `isAtClientLimit` importato da `functions/src/shared/plans.js`, con bypass per
   `super_admin`. **Non era così** quando questa lezione è stata scritta la prima volta —
   allora la risposta corretta era B (nessun controllo, solo blocco UI). È lo stesso caso
   della domanda 8 della Lezione 11: se ricordavi B da una lettura precedente, avevi ragione
   per lo stato di allora, non per quello di oggi. C e D restano sbagliate in entrambi i casi.

7. **B** — righe 80-82 di `creaCliente.js`: `try { await getAuth().deleteUser(clientUid) } catch {}`.
   È un rollback applicativo esplicito, non un meccanismo automatico di Firestore/Auth (che
   infatti non esiste tra sistemi diversi come nell'opzione C). A e D non corrispondono al
   codice.

8. **C** — è la scoperta discussa a fondo nella sezione dedicata: due `action` diverse per lo
   stesso evento, una per lato. A e B descrivono solo metà della realtà verificata. D è
   falsa: entrambi i lati scrivono effettivamente in `audit_logs`.

9. **B** — `navigator` è un oggetto globale del browser (Web API), assente in un runtime
   Node.js come quello delle Cloud Functions. È un vincolo tecnico reale, non una scelta
   arbitraria (esclude quindi A). C e D non corrispondono a nulla nel codice.

10. **A** — verificato con una ricerca di `updateClient` in tutto `src/`: solo `useMisure.js`
    (peso/altezza) e `AvatarPicker.jsx` (avatarId) lo usano oggi; la BIA passa da
    `saveBiaUseCase.js`/Cloud Function `salvaBia`, e il commento lo dice esplicitamente. Una
    versione precedente del commento era più generica ("BIA, peso/altezza, ecc.") e non
    rifletteva più la realtà da quando la BIA era stata migrata — è stata riscritta apposta
    (vedi Lezione 12). B, C, D non corrispondono al codice attuale.

## Esercizi

1. **(Facile)** Elenca, guardando `functions/src/index.js`, tutte le Cloud Function il cui
   nome inizia per `elimina` o `rimuovi`. Cosa hanno probabilmente in comune, a livello di
   pattern architetturale, rispetto a quelle che iniziano per `aggiungi`?

2. **(Facile)** In `hooks/useClients.js`, confronta `handleAddClient` (righe 47-57) e
   `handleDeleteClient` (righe 94-108): quale dei due usa il pattern "optimistic update con
   rollback" (aggiorna subito lo stato locale, poi chiama il server, poi eventualmente
   ripristina) e quale invece aspetta la risposta del server prima di aggiornare lo stato?
   (Analizzeremo questo pattern nel dettaglio nella Lezione 14 — qui basta identificarlo.)

3. **(Medio)** `saveXPUseCase` ha ancora un parametro prefissato con underscore (`_update`)
   che non viene mai usato nel corpo della funzione — verificalo tu stesso aprendo il file.
   `saveCampionamentoUseCase` **non ce l'ha più**: il suo terzo parametro, che si chiamava
   `_update`, oggi si chiama `update` ed è usato davvero (estrae `update?.log?.[0]?.action`
   per passarlo alla callable come `logAction` — lo vedremo nel dettaglio in Lezione 14).
   Confronta le due firme oggi e rispondi: perché la stessa "forma" di parametro (il terzo
   argomento, un oggetto di update calcolato lato client) ha avuto due destini diversi in due
   funzioni quasi gemelle? Cosa contiene `update.log[0].action` nel caso campionamento che
   non ha un equivalente utile nel caso XP?

4. **(Medio)** Confronta `eliminaCliente.js` (nessun audit log server-side) con `creaCliente.js`
   (audit log server-side presente). Ipotizza — e scrivi in poche righe — il codice che
   aggiungerebbe un audit log coerente dentro `eliminaCliente.js`, usando lo stesso stile
   (`db.collection('audit_logs').add({...}).catch(() => {})`) e lo stesso formato di `action`
   già usato da `creaCliente.js` (maiuscolo/snake, per restare coerente con quel file — anche
   se, come discusso, sarebbe meglio allineare tutto ad `AUDIT_ACTIONS` in futuro).

5. **(Difficile)** `salvaXP.js` legge il cliente con un semplice `clientRef.get()` e poi scrive
   con `batch.update(clientRef, update)` — non usa `db.runTransaction(...)`. Descrivi uno
   scenario concreto (due trainer, stesso cliente, azioni quasi simultanee) in cui l'assenza
   di una transazione esplicita potrebbe causare una perdita di uno dei due incrementi di XP.
   Poi spiega, ad alto livello, come `runTransaction` risolverebbe il problema (non serve
   scrivere codice funzionante, ma la spiegazione deve essere tecnicamente corretta rispetto
   a come funzionano le transazioni Firestore: retry automatico in caso di conflitto di
   lettura).

## Challenge

### Retrospettiva: com'è stato risolto davvero

Il gap descritto sopra (nessun controllo server-side sul limite piano) è stato trovato
leggendo il codice per questa stessa lezione, poi fixato per davvero — non solo in
`creaCliente.js` ma anche nel gemello `creaMembroTeam.js` (stesso pattern, limite trainer
invece di clienti). Ecco cosa è cambiato, in sintesi (il diff completo è nel commit `2c8b9fe`):

1. Nuovo file `functions/src/shared/plans.js` — speculare a `src/config/plans.config.js`,
   con `PLAN_LIMITS`, `getPlanLimits`, `isAtTrainerLimit`, `isAtClientLimit`. Stesso pattern
   di `shared/constants.js`/`shared/gamification.js` già visti in questa lezione.
2. In `creaCliente.js`: la lettura di `organizations/{orgId}` è stata anticipata **prima**
   della creazione dell'account Auth (non dopo, come nel codice originale che leggeva `db`
   solo più avanti per il batch) — proprio per non creare un account Firebase orfano se la
   richiesta va comunque rifiutata per limite raggiunto.
3. `requireOrgAccess`/`requireOrgAdmin` ora vengono catturati nella variabile `profile`
   (prima il valore di ritorno era scartato) per poter controllare `profile.role !== 'super_admin'`
   ed esentarlo dal limite, coerentemente con le rules e con `CLAUDE.md`.
4. Deploy manuale su `rankex-dev` e poi `fitquest-60a09` — **le Cloud Functions non fanno
   parte del deploy automatico** di `deploy.yml` (lo vedi nella Lezione 22).

Apri `creaCliente.js` e `creaMembroTeam.js` adesso e verifica tu stesso questi quattro punti
sul codice reale, invece di fidarti di questo riassunto.

### Il compito per te: un gap gemello, ancora aperto

La sezione "Errori comuni" #3 di questa lezione segnala che `creaCliente.js` scrive un audit
log lato server con `action: 'CLIENT_CREATED'` (maiuscolo/snake), mentre `createClientUseCase.js`
lato client scrive `AUDIT_ACTIONS.CLIENT_CREATED` che vale `'client.created'` (minuscolo/punto)
— due eventi distinti in `/audit_logs` per la stessa operazione, con due convenzioni di naming
diverse. **Questo non è stato fixato** nello stesso giro di manutenzione — a differenza del
gap sul limite piano, resta un problema reale e aperto oggi. Il tuo compito:

1. Verifica tu stesso, leggendo `functions/src/callable/creaCliente.js` e
   `src/usecases/createClientUseCase.js`, che la doppia scrittura e la doppia convenzione di
   naming esistano ancora esattamente come descritto.
2. Controlla se lo stesso pattern (doppia scrittura, naming incoerente) si ripete in
   `creaMembroTeam.js`/`createMemberUseCase.js`, o se lì il comportamento è diverso — leggi
   entrambi i file prima di rispondere, non generalizzare dal solo caso cliente.
3. Proponi (per iscritto, o come diff vero se vuoi implementarlo) una soluzione: rimuovere la
   scrittura duplicata lato client (fidandosi solo dell'audit server-side, dove esiste), unificare
   il formato di `action` in un'unica convenzione condivisa, o qualcos'altro — motiva la scelta
   pensando a chi in futuro dovrà interrogare `/audit_logs` per un audit di sicurezza reale, e a
   cosa succede se un giorno la Cloud Function fallisce *dopo* l'audit client-side (l'operazione
   non è avvenuta, ma un log dice che sì).

A differenza del gap sul limite piano, qui non stai verificando un fix già fatto: stai facendo
lo stesso tipo di lavoro da zero, su un problema reale ancora presente nel codice oggi.
