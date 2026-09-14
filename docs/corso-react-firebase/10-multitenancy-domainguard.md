# Lezione 10 — Multi-tenancy: orgId, ruoli, DomainGuard
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire cos'è il multi-tenancy e come RankEX lo implementa: `organizations/{orgId}` come
radice di ogni dato operativo, `orgId` come convenzione di codice (non come meccanismo di
sicurezza), e `DomainGuard` come separazione fisica fra il dominio super_admin e quello degli
utenti normali. Chiudiamo il Modulo 2 collegando i puntini fra routing (lezione 8) e Auth
(lezione 9): ora sappiamo *chi* è loggato, qui vediamo *a quale confine* appartiene.

## Concetti teorici

### 📎 Approfondimento: Multi-tenancy

Multi-tenancy significa che **una singola istanza applicativa e un singolo database**
servono molte organizzazioni (*tenant*) diverse, mantenendole isolate le une dalle altre a
livello logico — invece di deployare un'installazione separata (database, server, dominio)
per ogni cliente. È il modello standard di quasi ogni SaaS B2B moderno: Slack, Notion,
Salesforce funzionano tutti così.

Analogia: pensa a un condominio. C'è un unico edificio (un solo progetto Firebase, un solo
database Firestore, un solo codice React deployato), ma ogni appartamento (ogni
`organizations/{orgId}`) ha le proprie chiavi. Un inquilino (un `trainer` o `org_admin`) può
aprire solo la porta del proprio appartamento — anche se, tecnicamente, l'intero edificio è
"un solo posto fisico". In RankEX, `organizations/{orgId}` è la radice di ogni dato operativo:
come documentato in `CLAUDE.md` (sezione "Struttura Firestore"), sotto ogni org vivono
`clients/`, `slots/`, `groups/`, `recurrences/`, `notifications/`, `workoutPlans/` — tutte
subcollection annidate sotto quello specifico `orgId`. Non esiste, ad esempio, una collection
globale `clients` condivisa fra tutte le org: ogni cliente vive dentro l'org a cui appartiene.

**Punto cruciale da non confondere:** l'isolamento *logico* (il fatto che i dati siano
strutturati per orgId) non è di per sé isolamento *di sicurezza*. Un client Firestore, in
teoria, potrebbe costruire una query verso `organizations/org-di-un-altro/clients` — quello
che realmente impedisce che questa query abbia successo sono le **Firestore Security Rules**
(valutate lato server ad ogni richiesta, viste in dettaglio in lezione 16), non l'ordine dei
parametri nelle funzioni JavaScript. Questo distinguo torna più avanti in questa lezione.

### Hosting multisito Firebase: perché due domini

`CLAUDE.md` documenta due target di Firebase Hosting sullo stesso progetto:
`rankex-app.web.app` (trainer, org_admin, client, staff_readonly) e `rankex-admin.web.app`
(solo super_admin). "Multisito" in Firebase Hosting significa che un solo progetto può
pubblicare più siti statici indipendenti, ciascuno con il proprio hostname, potenzialmente
servendo build diverse dello stesso codice (o build identiche, come qui, con comportamento
diverso a runtime in base al dominio rilevato).

Perché separarli fisicamente, se le Firestore Rules già proteggono i dati indipendentemente
dal dominio da cui arriva la richiesta? Non è (solo) una questione di sicurezza — è
soprattutto **separazione operativa e percettiva**: un super_admin, che ha visibilità globale
su customer service e dati sensibili di più organizzazioni, non deve mai trovarsi per errore
mescolato nell'interfaccia "normale" (rischio concreto di confusione operativa, es. eseguire
un'azione pensando di essere nel contesto di un'org quando in realtà si ha visibilità
globale). Viceversa, un trainer non deve nemmeno *vedere* che esiste un'area amministrativa
separata.

### Perché `DomainGuard` è disattivato in development

`DomainGuard` legge `isDev` da [`utils/env.js`](../../src/utils/env.js):

```js
export const ENV = import.meta.env.VITE_ENV ?? import.meta.env.MODE
export const isDev = ENV === 'development'
```

Da leggere con attenzione: `ENV` preferisce `import.meta.env.VITE_ENV` — una variabile
*custom* del progetto, definita nei file `.env.development`/`.env.production` (documentati in
`CLAUDE.md`, sezione "File .env") — e solo se quella non è definita ripiega su
`import.meta.env.MODE`, la variabile *standard* iniettata automaticamente da Vite
(`'development'` quando gira `vite dev`, `'production'` quando gira `vite build`). Questo
doppio fallback garantisce che `ENV` sia sempre determinato correttamente sia nell'ambiente
configurato di RankEX sia in un ipotetico setup Vite senza `.env` custom.

In sviluppo locale, tutte le viste girano sullo stesso `localhost`, servite dallo stesso
server Vite — non ha alcun senso replicare lì la separazione multisito di produzione (non
esistono due hostname distinti in locale). Per questo `isDev` cortocircuita l'intero guard:
sia dentro `isAdminDomain()` stesso (righe 13-16 di `env.js`: `if (isDev) return false`), sia
dentro `DomainGuard` (riga 16: `if (isDev || role == null) return children`) — un controllo
leggermente ridondante nei due punti, ma innocuo, e anzi difensivo: anche se uno dei due
controlli venisse rimosso per errore, l'altro basterebbe comunque a disattivare il guard in
dev.

## Dove compare nel progetto

- [`src/components/common/DomainGuard.jsx`](../../src/components/common/DomainGuard.jsx) — il guard vero e proprio
- [`src/utils/env.js`](../../src/utils/env.js) — `ENV`, `isDev`, `isProduction`, `isAdminDomain()`
- [`src/app/App.jsx`](../../src/app/App.jsx) — dove `DomainGuard` viene montato, con `role={profile?.role}`
- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — esempio concreto della convenzione "orgId primo argomento"
- [`src/context/TrainerContext.jsx`](../../src/context/TrainerContext.jsx) — `useTrainerState()`, l'alternativa al prop-drilling per componenti profondi

## Analisi del codice

### `DomainGuard.jsx` — riga per riga

```jsx
import { isAdminDomain, isDev } from '../../utils/env'

const ADMIN_URL = 'https://rankex-admin.web.app'
const APP_URL   = 'https://rankex-app.web.app'
```

Due URL hardcoded — non `VITE_`-configurabili, letteralmente scritti nel codice. Coerente con
il fatto che questi due hostname sono fissi e noti a priori (non cambiano fra ambienti nello
stesso modo in cui cambiano le credenziali Firebase).

```jsx
export function DomainGuard({ role, children }) {
  if (isDev || role == null) return children

  if (isAdminDomain() && role !== 'super_admin') {
    return <Blocked message="Questa area è riservata agli amministratori di sistema." href={APP_URL} label="Vai all'app" />
  }

  if (!isAdminDomain() && role === 'super_admin') {
    return <Blocked message="Gli amministratori di sistema devono accedere dal portale admin." href={ADMIN_URL} label="Vai all'admin" />
  }

  return children
}
```

Il componente è, in sostanza, una piccola macchina a stati con 4 uscite possibili:

1. `isDev || role == null` → nessun controllo, passa tutto. Nota `role == null` con il
   doppio uguale (non `===`): è intenzionale, non un refuso. In JavaScript, `== null`
   intercetta **sia** `null` **sia** `undefined` in un solo confronto — equivalente, ma più
   corto, di `role === null || role === undefined`. È uno dei pochi casi in cui `==` è
   considerato idiomatico anche in codice JS moderno rigoroso. Qui serve perché il guard deve
   restare inerte finché il ruolo non è ancora noto (`undefined`, profilo in caricamento — la
   docstring a riga 13 lo conferma: "Il guard si attiva solo dopo che il profilo è caricato").
2. Dominio admin + ruolo diverso da `super_admin` → bloccato, con link verso l'app normale.
3. Dominio non-admin + ruolo `super_admin` → bloccato, con link verso il portale admin.
4. Nessuna delle condizioni sopra → passa (`return children`).

Da notare: le condizioni 2 e 3 sono scritte come `if` separati e sequenziali, non come
un'unica espressione booleana complessa — più leggibile, e ognuna produce un messaggio/link
diverso, quindi non potrebbero comunque essere fuse senza perdere quella differenziazione.

```jsx
function Blocked({ message, href, label }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      ...
      <a href={href} ...>{label}</a>
    </div>
  )
}
```

`Blocked` è un componente locale, definito e usato solo dentro questo file, non esportato.
Non ha bisogno di vivere in `components/` come componente condiviso — è puramente una vista
di presentazione mono-uso per questo specifico scenario di blocco.

### `env.js` — le fondamenta

```js
export const ENV = import.meta.env.VITE_ENV ?? import.meta.env.MODE

export const isDev        = ENV === 'development'
export const isProduction = ENV === 'production'
export const isUat        = ENV === 'uat'
```

`isDev`/`isProduction`/`isUat` sono **costanti**, non funzioni: vengono calcolate una sola
volta, al caricamento del modulo. Ha senso perché `import.meta.env.*` è statico — sostituito
da Vite a build-time per le variabili con prefisso `VITE_`, e `MODE` è anch'esso fissato
all'avvio del dev server o della build. Non c'è alcun motivo per cui questi valori
cambierebbero durante l'esecuzione dell'app, quindi calcolarli una sola volta come costanti di
modulo (invece che ricalcolarli ad ogni chiamata con una funzione) è corretto ed efficiente.

```js
const ADMIN_HOSTNAMES = ['admin.rankex.app', 'admin-uat.rankex.app', 'rankex-admin.web.app']

export function isAdminDomain() {
  if (isDev) return false
  return ADMIN_HOSTNAMES.includes(window.location.hostname)
}
```

Qui, al contrario, `isAdminDomain()` **è** una funzione, non una costante — e la ragione è
speculare a quella di sopra: dipende da `window.location.hostname`, un valore noto solo a
runtime, dentro il browser, quando la pagina è effettivamente caricata su un certo dominio.
Non potrebbe essere "congelato" a build-time come `isDev`, perché lo stesso identico bundle
JS (la stessa identica build) viene servito su entrambi gli hostname di produzione — è
`window.location.hostname` a fare la differenza runtime fra i due, non un flag di build
separato.

Da notare, leggendo l'array `ADMIN_HOSTNAMES`: contiene tre valori, non due. `CLAUDE.md`
(sezione "Hosting Firebase — multisito") documenta esplicitamente solo
`rankex-admin.web.app`. Gli altri due — `admin.rankex.app` e `admin-uat.rankex.app` —
suggeriscono rispettivamente un dominio custom pianificato (invece del sottodominio
`*.web.app` di default Firebase) e un ambiente UAT (coerente con la costante `isUat` definita
appena sopra) che al momento non risultano documentati altrove nel materiale ufficiale del
progetto. Questo è un caso in cui il codice sembra un passo avanti rispetto alla
documentazione disponibile — non è possibile, solo leggendo questi due file, stabilire se
quei domini siano già attivi, pianificati, o residui di una configurazione precedente: vale
la pena verificarlo con il team prima di fare assunzioni.

### `useClients.js` — la convenzione applicata

```js
/**
 * @param {string} orgId    — ID organizzazione (subcollection path)
 * @param {string} [userId] — UID del trainer che crea i clienti (opzionale)
 */
export function useClients(orgId, userId) {
```

Firma già vista nelle lezioni precedenti, qui la guardiamo dal punto di vista del "perché".
`CLAUDE.md` (sezione "orgId come primo argomento") lo dichiara come convenzione
architetturale deliberata: **tutte** le funzioni service e **tutti** gli hook operativi
accettano `orgId` come primo parametro esplicito, invece di leggerlo implicitamente da un
Context globale dentro l'hook stesso. Tre motivazioni, tutte verificabili osservando come il
progetto è strutturato:

1. **Esplicitezza** — leggendo la sola firma `useClients(orgId, userId)`, capisci
   immediatamente che questo hook opera nel perimetro di una specifica organizzazione, senza
   dover risalire a un Provider nascosto nell'albero dei componenti per scoprirlo.
2. **Testabilità** — puoi chiamare `useClients('org-test-123', 'uid-test')` (ad esempio in un
   test con `renderHook`) senza dover avvolgere il test in un Context Provider fittizio solo
   per fornire un `orgId`.
3. **Nessuna dipendenza implicita per un dato critico** — se `orgId` venisse letto
   implicitamente da un Context globale sbagliato (es. un bug che imposta il Context all'org
   sbagliata), l'errore si propagherebbe silenziosamente a *ogni* hook che lo leggesse in
   quel modo, senza che nessuna firma di funzione lo segnalasse. Con `orgId` esplicito, un
   valore sbagliato è visibile direttamente al call-site (dove l'hook viene invocato).

`CLAUDE.md` precisa anche **quando** usare invece `useTrainerState()` (definito in
[`TrainerContext.jsx`](../../src/context/TrainerContext.jsx)) per lo stesso dato: nei
componenti che ricevono già `orgId` come prop lungo la catena diretta dalla pagina
(`trainer.config.jsx` → `TrainerLayout` → `<CurrentPage orgId={orgId}/>`), va propagato
esplicitamente come prop, componente per componente. Solo per hook/componenti annidati in
profondità e *non collegati* a quella catena di prop (l'esempio citato in `CLAUDE.md`:
`useBia`, `useWearable`, `useMisure` — usati da sezioni della dashboard cliente lontane dal
punto in cui `orgId` entra come prop) è corretto usare `useTrainerState()`, per evitare
prop-drilling su più livelli. La regola esplicita: **non mescolare i due pattern per lo stesso
dato all'interno della stessa catena di componenti** — se un componente riceve già `orgId` da
un genitore diretto, non deve richiamare `useTrainerState()` per lo stesso valore.

## Diagramma mentale

```
Firestore (UN SOLO database, multi-tenant)

organizations/
  ├── org_abc123/                    ← es. una palestra PT
  │     ├── clients/{clientId}
  │     ├── slots/{slotId}
  │     ├── groups/{groupId}
  │     ├── recurrences/{recId}
  │     └── members/{uid}
  │
  ├── org_def456/                    ← es. un'accademia soccer
  │     ├── clients/{clientId}
  │     └── ...
  │
  └── org_ghi789/
        └── ...

users/{uid}          ← puntatore fuori da ogni org: { orgId, role, clientId? }
audit_logs/{logId}   ← fuori da ogni org, solo super_admin legge


           Isolamento LOGICO (struttura dati)     Isolamento DI SICUREZZA
           ───────────────────────────────        ────────────────────────
           orgId come chiave di subcollection  ≠   Firestore Security Rules
           "convenzione di codice, leggibilità"    "vera barriera, server-side"


DomainGuard — matrice dominio × ruolo (solo produzione, isDev disattiva tutto):

                        role === super_admin       role !== super_admin
  admin domain          ✓ passa                    ✗ Blocked → link app
  app domain             ✗ Blocked → link admin      ✓ passa
```

## Errori comuni

1. **Confondere isolamento logico con isolamento di sicurezza.** Pensare che passare
   l'`orgId` "giusto" lato client sia sufficiente a proteggere i dati. Non lo è: senza le
   Firestore Rules (`isClientOfOrg`, `canRead`, ecc., citate in `CLAUDE.md` e trattate in
   lezione 16), nulla impedirebbe — a livello di API Firestore pura — una richiesta verso
   l'orgId sbagliato. Il codice client è "educato" a rispettare la convenzione, non è la
   barriera reale.

2. **"Correggere" il `role == null` in `role === null`.** Un refactor superficiale
   potrebbe scambiare quel doppio uguale per un errore di battitura e "sistemarlo" a
   `===`, introducendo un bug reale: il guard smetterebbe di considerare correttamente il
   caso `role === undefined` (profilo ancora in caricamento), potenzialmente applicando il
   blocco prima ancora che il ruolo sia noto.

3. **Testare la separazione domini solo in development**, dove `DomainGuard` è
   completamente disattivato per definizione. Un bug in questo componente sarebbe
   invisibile finché non si testa davvero su un hostname di produzione (o UAT, se in uso) —
   in locale il guard non fa mai nulla, quindi non lo si nota mai.

4. **Confondere `isAdminDomain` (funzione) con `isDev` (costante).** Scrivere
   `if (isAdminDomain && ...)` invece di `if (isAdminDomain() && ...)` non lancerebbe un
   errore immediato — una funzione è sempre truthy come valore — ma il controllo risulterebbe
   sempre vero, indipendentemente dal dominio reale, un bug silenzioso e subdolo.

5. **Passare il valore sbagliato come `orgId`.** Dato che è un parametro esplicito e non
   magicamente risolto da un Context, un refuso come `useClients(org, uid)` (l'intero oggetto
   organizzazione, invece di `org.id`) produce un `orgId` di tipo oggetto invece che stringa —
   i path Firestore costruiti con quel valore risulterebbero malformati, e il sintomo visibile
   sarebbe "nessun dato torna indietro", senza un errore esplicito che indichi la causa reale.
   Proprio per questo `CLAUDE.md` raccomanda di non mescolare prop e `useTrainerState()` per
   lo stesso dato nella stessa catena: avere due possibili fonti per lo stesso `orgId`
   aumenta il rischio che una delle due, prima o poi, diverga dall'altra.

## Best Practice

**Perché non un `CurrentOrgContext` globale, letto implicitamente ovunque?** Sarebbe
un'alternativa plausibile: un Context che espone `orgId` e che ogni hook legge internamente
con `useContext`, senza doverlo ricevere come parametro. RankEX usa comunque un Context
(`TrainerContext`), ma per uno scopo diverso e più circoscritto: stato UI condiviso in un
sottoalbero (il cliente attualmente selezionato), non un dato multi-tenant critico che serve
letteralmente ovunque. La distinzione di principio, motivata dal codice reale: un Context è
adatto a stato che è naturalmente "di sottoalbero" e cambia in risposta a interazioni UI (
selezione, apertura di un pannello); un parametro esplicito è più adatto a un dato che deve
essere visibile a chi legge la firma di ogni funzione che lo consuma, specialmente quando è
tanto critico per la sicurezza logica dell'app quanto `orgId`.

**`DomainGuard` come difesa aggiuntiva, non come unica barriera.** Anche se la vera sicurezza
sta nelle Firestore Rules, avere anche un guard client-side che impedisce percettivamente
l'accesso incrociato fra dominio admin e dominio utenti è comunque una buona pratica
operativa: riduce il rischio di errore umano (un super_admin che opera per sbaglio
nell'interfaccia "normale"), anche se non deve mai essere considerato, da solo, un meccanismo
di sicurezza.

**Costanti quando il valore è statico, funzioni quando dipende da runtime.** Il confronto
diretto fra `isDev`/`isProduction` (costanti, valutate una volta a import-time, perché
derivano da valori fissati a build-time) e `isAdminDomain()` (funzione, perché dipende da
`window.location.hostname`, disponibile solo a runtime nel browser) è un piccolo ma chiaro
esempio di una scelta di design coerente col dato che si sta modellando.

## Quiz

1. Cos'è il "multi-tenancy" nel contesto di RankEX?
   - A. Un pattern per gestire più temi grafici (dark/light) nella stessa app
   - B. Una singola applicazione/database che serve più organizzazioni (tenant) isolate
     logicamente le une dalle altre, invece di un deployment separato per ognuna
   - C. Una tecnica di caching lato client
   - D. Un sinonimo di "multi-lingua"

2. Dove risiede davvero la garanzia che un trainer dell'organizzazione A non possa leggere i
   dati dell'organizzazione B?
   - A. Nel fatto che `orgId` è sempre il primo argomento delle funzioni
   - B. Nelle Firestore Security Rules, valutate server-side ad ogni richiesta — il client
     (incluso l'ordine dei parametri) è solo una convenzione di leggibilità, non un
     meccanismo di sicurezza
   - C. Nel `DomainGuard`
   - D. Nel fatto che ogni org ha un hosting Firebase separato

3. Perché `DomainGuard` non fa nulla quando l'app gira in `npm run dev`?
   - A. È un bug non ancora risolto
   - B. Perché `isDev` (da `utils/env.js`) risulta `true` in sviluppo, e la riga 16 di
     `DomainGuard.jsx` (`if (isDev || role == null) return children`) fa uscire subito la
     funzione senza applicare alcun blocco
   - C. Perché in sviluppo non esiste il ruolo `super_admin`
   - D. Perché `window.location.hostname` non esiste in locale

4. In `DomainGuard.jsx` riga 16, perché si usa `role == null` (doppio uguale) invece di
   `role === null`?
   - A. È un errore, dovrebbe essere `===`
   - B. `== null` intercetta intenzionalmente sia `null` sia `undefined` in un solo
     controllo — equivalente a `role === null || role === undefined`, uno dei pochi usi
     idiomatici accettati di `==` in JS moderno
   - C. Non c'è alcuna differenza pratica tra i due
   - D. `===` non funziona con le variabili `role`

5. Perché `isAdminDomain()` in `env.js` è definita come FUNZIONE, mentre `isDev`/
   `isProduction` sono COSTANTI?
   - A. Per pura preferenza di stile
   - B. Perché `isAdminDomain()` dipende da `window.location.hostname`, un valore noto solo
     a runtime nel browser, mentre `isDev`/`isProduction` derivano da `import.meta.env`,
     valori fissati a build-time — non avrebbe senso "congelarli" allo stesso modo
   - C. Perché le funzioni sono sempre più veloci delle costanti
   - D. Perché `window` non è disponibile quando il modulo viene importato la prima volta

6. Cosa succederebbe se un componente chiamasse `useClients(org, userId)` passando l'intero
   oggetto `org` (es. `{ id: 'abc', name: '...', plan: 'pro' }`) invece di `org.id`?
   - A. Funzionerebbe comunque, JavaScript farebbe la conversione automaticamente
   - B. `orgId` diventerebbe un oggetto invece di una stringa; i path Firestore costruiti con
     quel valore (es. `organizations/{orgId}/clients`) sarebbero sbagliati — un bug silenzioso
     rilevabile solo perché nessun dato tornerebbe indietro
   - C. React lancerebbe un errore a compile-time
   - D. Le Firestore rules bloccherebbero comunque la richiesta in modo sicuro

7. Cosa rappresentano i tre hostname in `ADMIN_HOSTNAMES` (`env.js` riga 7)?
   - A. Solo `rankex-admin.web.app` è realmente in uso secondo `CLAUDE.md`; `admin.rankex.app`
     e `admin-uat.rankex.app` suggeriscono un dominio custom e un ambiente UAT non
     documentati esplicitamente in `CLAUDE.md` — un dettaglio che emerge solo leggendo il
     codice
   - B. Sono tre alias casuali senza significato
   - C. Sono usati solo nei test automatici
   - D. Sono hostname di sviluppo locale

8. Perché RankEX usa DUE siti di hosting separati (`rankex-app.web.app` e
   `rankex-admin.web.app`) invece di un solo sito con un controllo di ruolo interno?
   - A. Firebase Hosting non permetterebbe altrimenti di avere un'area super_admin
   - B. Non è (solo) una questione di sicurezza — le Firestore rules proteggono comunque i
     dati indipendentemente dal dominio — è soprattutto separazione operativa/percettiva: un
     super_admin non deve trovarsi per errore nell'app "normale" e viceversa
   - C. Per avere due bundle JS più leggeri
   - D. È un requisito imposto da React Router

9. Secondo la convenzione documentata in `CLAUDE.md` ("orgId come primo argomento"), quando è
   corretto usare `useTrainerState()` invece di passare `orgId` come prop?
   - A. Sempre, in ogni componente
   - B. Mai, va sempre passato come prop
   - C. Nei componenti/hook annidati in profondità, non collegati direttamente alla catena di
     prop della pagina (es. `useBia`, `useWearable`) — mentre nei componenti dentro `PAGES`
     (`trainer.config.jsx`) e nei loro figli diretti va propagato esplicitamente come prop
   - D. Solo per i super_admin

10. `Blocked` in `DomainGuard.jsx` (righe 29-47) è un componente definito nello stesso file e
    NON esportato. Che pattern rappresenta?
    - A. Un errore: tutti i componenti dovrebbero stare in file propri sotto `components/`
    - B. Un componente di presentazione locale, usato in un solo punto — non merita un
      file/export proprio, evitando di "affollare" la cartella condivisa `components/` con
      qualcosa a uso singolo
    - C. Un hook mascherato da componente
    - D. Un pattern obbligatorio di React Router

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** Definizione standard di multi-tenancy, applicata concretamente da RankEX con
   `organizations/{orgId}` come radice dei dati. A, C, D descrivono concetti completamente
   diversi (temi grafici, caching, i18n) che non c'entrano con multi-tenancy.

2. **B.** Le Firestore Rules sono l'unico meccanismo davvero valutato server-side, quindi
   l'unico che conta come barriera di sicurezza reale. A descrive una convenzione di codice,
   utile per leggibilità/testabilità ma non enforceable da sola. C è parziale: `DomainGuard`
   riguarda la separazione fra dominio admin e dominio app, non l'isolamento fra org diverse
   sullo stesso dominio. D è falsa: non esiste un hosting separato per org, tutte le org
   condividono lo stesso `rankex-app.web.app`.

3. **B.** Comportamento verificabile leggendo `isDev` in `env.js` e la riga 16 di
   `DomainGuard.jsx`. A è una supposizione non supportata (è comportamento voluto, non un
   bug). C è falsa: nulla impedisce di avere un utente `super_admin` di test anche in
   sviluppo, semplicemente il guard non applica comunque il blocco. D è falsa:
   `window.location.hostname` esiste sempre in un browser, anche su `localhost` — è solo che
   `isAdminDomain()` ritorna `false` a prescindere quando `isDev` è vero (riga 14-15 di
   `env.js`).

4. **B.** Uso idiomatico corretto e intenzionale, coerente con la docstring del file che
   parla esplicitamente di "il guard si attiva solo dopo che il profilo è caricato" (quindi
   deve gestire sia `undefined` sia `null` come "non ancora pronto"). A e C negano una
   distinzione reale e rilevante nel codice. D è falsa, `===` funzionerebbe sintatticamente
   ma coprirebbe solo uno dei due casi.

5. **B.** Distinzione fra dato risolvibile a build-time (`import.meta.env`) e dato
   disponibile solo a runtime (`window.location`). A sottovaluta una scelta motivata. C è
   un'affermazione priva di fondamento tecnico. D è falsa, `window` è disponibile appena il
   modulo viene eseguito nel browser — il punto non è la disponibilità ma la necessità di
   rivalutarlo runtime dopo runtime.

6. **B.** Bug silenzioso concreto: un oggetto al posto di una stringa in un path Firestore
   produce una query/riferimento malformato, senza un errore esplicito immediato — coerente
   con quanto discusso su perché l'esplicitezza di `orgId` come parametro aiuta a individuare
   questi problemi al call-site. A è falsa, JS non farebbe alcuna conversione utile in questo
   contesto. C è falsa, non c'è verifica di tipo a compile-time in JavaScript puro. D è
   falsa: le Firestore Rules bloccano accessi non autorizzati, non correggono un path
   sintatticamente malformato.

7. **A.** Osservazione diretta del confronto fra il contenuto di `ADMIN_HOSTNAMES` e quanto
   documentato in `CLAUDE.md` — un caso reale in cui il codice contiene più informazione della
   documentazione ufficiale disponibile. B, C, D sono ipotesi non supportate da alcuna
   evidenza nel codice o nei commenti.

8. **B.** Motivazione esplicitamente discussa nei Concetti Teorici: separazione operativa più
   che di sicurezza pura (la sicurezza è comunque garantita dalle rules). A è falsa: nulla
   in Firebase Hosting impedisce di gestire i ruoli con un solo sito. C è una motivazione
   secondaria non centrale. D è falsa: React Router non impone alcun vincolo sul numero di
   siti di hosting.

9. **C.** Riporta fedelmente la distinzione fatta in `CLAUDE.md` fra catena diretta di prop e
   hook annidati in profondità. A e B sono estremizzazioni sbagliate: la regola non è "sempre"
   né "mai", dipende dalla posizione nell'albero dei componenti. D è un'invenzione, non
   collegata al criterio reale (posizione nella catena di prop, non ruolo utente).

10. **B.** Pattern comune e legittimo: componenti di presentazione usati in un solo punto non
    hanno bisogno di un file/export dedicato. A è una regola troppo rigida non supportata dal
    codice del progetto (che usa questo pattern deliberatamente). C e D sono descrizioni
    errate del ruolo di `Blocked`.

## Esercizi

1. **(facile)** Apri [`utils/env.js`](../../src/utils/env.js) e
   [`DomainGuard.jsx`](../../src/components/common/DomainGuard.jsx) e disegna a mano la
   matrice 2×2 (dominio × ruolo) di quando l'accesso viene bloccato o permesso, poi
   confrontala con quella di questa lezione.

2. **(facile-medio)** Verifica nel tuo `.env.development` il valore di `VITE_ENV`. Su una
   COPIA locale del file (mai committare), prova a modificarlo temporaneamente in
   `production` e riavvia `npm run dev`: osserva se e come cambia il comportamento di
   `DomainGuard`. Ripristina subito il valore corretto al termine dell'esercizio.

3. **(medio)** Cerca nel codice (ricerca testuale nella cartella `src/`) tutti i punti in cui
   `orgId` viene passato come primo argomento a un hook o a un service. Conta quante funzioni
   seguono la convenzione, e verifica se ne trovi anche una sola che la infrange (se sì,
   annotala — potrebbe essere un'eccezione documentata o un refuso da segnalare).

4. **(medio-difficile)** Rileggi la sezione "Prop vs `useTrainerState()`" in `CLAUDE.md`, poi
   apri [`features/bia/useBia.js`](../../src/features/bia/useBia.js) (non l'hai ancora letto
   in questa lezione): verifica se la sua firma rispetta davvero la regola descritta (hook
   annidato in profondità → usa `useTrainerState()` invece di ricevere `orgId` come
   parametro).

5. **(difficile)** Ipotizza — solo a livello di design, senza scrivere codice — come
   implementeresti un controllo automatico (es. un test o una regola ESLint custom) che
   verifichi che nessun componente sotto `features/trainer/` importi mai
   `firebase/services/*` direttamente, bypassando gli hook. Che relazione ha questo con il
   principio di isolamento multi-tenant descritto in questa lezione? (Suggerimento: pensa a
   cosa succederebbe se un componente costruisse un path Firestore "a mano", con un `orgId`
   preso da una fonte diversa da quella convenzionale.)

## Challenge

Aggiungi in `DomainGuard.jsx` (in locale, solo per esercizio — non serve committare) un
banner puramente visivo, non bloccante, che compaia SOLO quando `isDev` è `true` **e**
l'utente loggato ha `role === 'super_admin'`, per ricordare a chi sviluppa in locale che in
produzione questo stesso utente verrebbe rediretto forzatamente al dominio admin (cosa che in
dev non accade mai, essendo il guard disattivato). Il banner deve sparire da solo se
l'utente non è `super_admin`, e non deve mai comparire quando `isDev` è `false`. Prima di
scrivere il codice, rispondi: dove metteresti questo controllo — dentro `DomainGuard` stesso
o in un componente separato montato da `App.jsx`? Motiva la scelta guardando cosa `DomainGuard`
riceve già come prop (`role`) rispetto a cosa dovrebbe ricevere in più.
