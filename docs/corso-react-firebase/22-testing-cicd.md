# Lezione 22 — Testing e CI/CD
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire la piramide dei test applicata a RankEX (unit, rules, e2e), perché servono tre config di
test separate invece di una sola, perché le Firestore Security Rules richiedono un emulatore
dedicato per essere testate in sicurezza, e leggere con precisione — riga per riga, senza dare
nulla per scontato — cosa fanno davvero i tre workflow GitHub Actions del progetto e quando si
attivano l'uno rispetto all'altro.

## Concetti teorici

La "piramide dei test" è un modello che ordina i tipi di test per **costo di esecuzione** e
**ampiezza di ciò che verificano**, dal più economico/stretto (base della piramide, tanti test)
al più costoso/ampio (punta della piramide, pochi test):

```
        /\
       /e2e\        ← pochi, lenti, verificano l'app intera in un browser reale
      /------\
     / rules  \      ← alcuni, verificano SOLO le Firestore Security Rules
    /----------\
   /    unit     \   ← tanti, veloci, verificano funzioni pure isolate
  /----------------\
```

- **Unit test**: verificano una singola funzione pura, isolata da tutto il resto (nessun
  database, nessun browser, nessuna rete). Sono i più veloci da eseguire (millisecondi) e i più
  facili da scrivere, perché il loro oggetto è deterministico: stesso input, stesso output.
- **Rules test**: verificano che le Firestore Security Rules si comportino come previsto —
  "un trainer di org1 può leggere i clienti di org1 ma non quelli di org2" — senza eseguire
  nemmeno una riga di codice React. Girano contro un **emulatore** Firestore, non contro un
  database reale.
- **E2E (end-to-end) test**: simulano un utente reale che apre un browser, clicca, compila form,
  aspetta che la UI si aggiorni. Sono i più lenti e i più fragili (un piccolo cambio di layout può
  romperli), ma sono anche gli unici che verificano che *tutti gli strati* — UI, hook, service,
  Firestore reale (o l'ambiente dev) — funzionino insieme davvero.

Il principio della piramide è: quanti più test hai alla base (unit, economici), tanto più
velocemente puoi avere un segnale su un bug; i test in cima (e2e) servono a coprire ciò che i
livelli sotto non possono vedere — l'integrazione reale tra i pezzi — ma vanno usati con
parsimonia perché costano tempo e sono più fragili.

## Dove compare nel progetto

- [`vitest.config.js`](../../vitest.config.js) — config unit test
- [`vitest.rules.config.js`](../../vitest.rules.config.js) — config separata per i test sulle Firestore Rules
- [`playwright.config.js`](../../playwright.config.js) — config e2e
- `src/__tests__/**/*.test.js` — 10 file di unit test (`config/`, `constants/`, `utils/`)
- `tests/rules/firestore.rules.test.js` — test sulle Security Rules, con emulatore
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — lint + unit test + build
- [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml) — suite e2e, workflow indipendente da CI
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) — deploy automatico Firebase
- `package.json`, sezione `scripts` — `test`, `test:run`, `test:rules`, `test:e2e`, `test:all`

## Analisi del codice

### Le tre config di test — perché separate

```js
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'node',
    include:     ['src/__tests__/**/*.test.js'],
    reporters:   ['verbose'],
    coverage: {
      provider: 'v8',
      include:  ['src/utils/**', 'src/config/**', 'src/constants/**'],
      exclude:  ['src/constants/tests.js', 'src/constants/bia.js'],
    },
  },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
})
```

`include: ['src/__tests__/**/*.test.js']` — questa config vede **solo** i test unitari dentro
`src/__tests__/`. La `coverage` è ristretta a `utils/`, `config/`, `constants/` — coerente col
principio "solo funzioni pure sono testate qui" (niente componenti React, niente hook con side
effect). `exclude: ['src/constants/tests.js', 'src/constants/bia.js']` esclude dalla coverage due
file che sono puri dati statici (tabelle di test/parametri BIA) — misurare "coverage" su un
oggetto di configurazione senza logica non avrebbe senso, quindi vengono esclusi esplicitamente
dal calcolo della percentuale.

```js
// vitest.rules.config.js
export default defineConfig({
  test: {
    environment: 'node',
    include:     ['tests/rules/**/*.test.js'],
    reporters:   ['verbose'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
```

Il commento nel file è la spiegazione più diretta possibile del *perché* serve una config
separata: *"Tenuta fuori da vitest.config.js perché senza emulatore questi test andrebbero in
timeout invece che essere semplicemente assenti."* Se i test in `tests/rules/` fossero inclusi
nella config normale, ogni volta che qualcuno lancia `npm test` senza aver avviato l'emulatore
Firestore, quei test non fallirebbero con un errore chiaro — resterebbero appesi fino al timeout,
un'esperienza di sviluppo pessima. Separandoli, restano invisibili a `vitest.config.js` e vengono
eseguiti solo esplicitamente tramite `npm run test:rules`, che si occupa anche di avviare
l'emulatore prima. Nota anche `testTimeout`/`hookTimeout` alzati a 20 secondi (contro il default
di Vitest, 5 secondi) — l'avvio dell'emulatore e le chiamate di rete verso di esso, per quanto
locali, sono più lente di una funzione pura in memoria.

### Perché le Security Rules richiedono un emulatore

Le Firestore Security Rules non sono codice JavaScript eseguito dal browser — sono regole
valutate **dal server Firestore stesso** ad ogni richiesta. Non esiste un modo per "chiamare"
`firestore.rules` come si chiamerebbe una funzione JS in un test unitario: per verificarle
davvero serve un vero motore di regole Firestore che le interpreti. Farlo contro il progetto
reale (`rankex-dev` o peggio `fitquest-60a09`, il progetto di produzione) sarebbe pericoloso e
irripetibile: i test dovrebbero scrivere/leggere/cancellare dati veri per verificare i permessi,
sporcando il database condiviso, e ogni run lascerebbe residui da ripulire manualmente. Firebase
fornisce per questo un **emulatore locale** — una copia del motore di regole Firestore che gira
in locale, isolata, resettabile a piacere e senza alcun costo di quota. Il test in
`tests/rules/firestore.rules.test.js` lo dimostra:

```js
const PROJECT_ID = 'demo-rankex-rules-test'

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host:  '127.0.0.1',
      port:  8180,
    },
  })
})

afterAll(async () => { await testEnv.cleanup() })

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    // ...popola dati di test con le regole DISABILITATE, per poterli scrivere
    // liberamente senza che le regole stesse blocchino il setup del test
  })
})
```

Punti da notare:
- `initializeTestEnvironment` carica **le regole reali del progetto** (`readFileSync('firestore.rules', ...)`) — il test verifica il file vero, non una copia riscritta a mano, quindi resta sincronizzato per costruzione con qualunque modifica futura a `firestore.rules`.
- `projectId: 'demo-rankex-rules-test'` — un progetto **fittizio** ("demo-"), mai un progetto Firebase reale: l'emulatore non ha nemmeno bisogno di credenziali vere, perché non parla mai con l'infrastruttura Firebase reale.
- `testEnv.clearFirestore()` prima di ogni test (`beforeEach`) — garantisce che ogni test parta da uno stato pulito, senza dipendere dall'ordine di esecuzione degli altri test.
- `testEnv.withSecurityRulesDisabled(...)` — un dettaglio sottile ma importante: per **preparare** i dati di test (org, membri, client fittizi) serve scrivere in Firestore, ma se le regole fossero attive durante il setup, potrebbero bloccare proprio quelle scritture di preparazione (che magari nel mondo reale avverrebbero solo via Cloud Function con privilegi elevati). Disabilitare temporaneamente le regole solo per il setup evita questo problema, senza intaccare l'obiettivo del test (verificare le regole nei passaggi successivi, dove tornano attive).

Un esempio di asserzione (dal file, righe 82-86):
```js
describe('Isolamento multi-tenant', () => {
  it('un trainer di org1 non può leggere organizations/org2', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertFails(getDoc(doc(db, 'organizations/org2')))
  })
```
`ctxFor('trainer1')` crea un contesto Firestore **autenticato come quello specifico utente** (via
`testEnv.authenticatedContext(uid)`), esattamente come farebbe un vero client loggato come
`trainer1`. `assertFails(...)` è l'helper di `@firebase/rules-unit-testing` che verifica che
l'operazione venga **rifiutata** dalle regole — l'opposto di `assertSucceeds`. Questo è il modo
in cui si verifica un invariante di sicurezza (l'isolamento multi-tenant) senza scrivere una riga
di codice React: è un test puramente sulle regole.

### `gamification.test.js` — un esempio di unit test su funzione pura

```js
describe('calcSessionXP', () => {
  it('streak 0 → nessun bonus (moltiplicatore 1.0)', () => {
    expect(calcSessionXP(100, 0)).toBe(100)
  })
  it('streak 10 → cap ×2.0', () => {
    expect(calcSessionXP(100, 10)).toBe(200)
  })
  it('streak 20 → ancora cap ×2.0 (non supera il massimo)', () => {
    expect(calcSessionXP(100, 20)).toBe(200)
  })
})
```

Questo è l'esempio più chiaro di "base della piramide": nessun `await`, nessun mock, nessuna
config di rete — solo chiamate dirette a `calcSessionXP` con input noti e asserzioni sull'output.
Da notare la scelta dei casi: non solo il caso "normale" (streak 10 → cap), ma anche il caso
limite **oltre** il cap (streak 20 → deve restare comunque 200, non continuare a crescere) — un
test che verifica esplicitamente che il `Math.min(...)` dentro `calcSessionXP` funzioni come
clamp, non solo come formula. Più sotto nello stesso file, `buildCampionamentoUpdate` viene
testato per ciascuno dei quattro tier XP (`FIRST`, `NONE`/`PARTIAL`/`MOST`/`ALL` — coerenti con la
tabella `XP_CAMPIONAMENTO` documentata in CLAUDE.md) con dati costruiti ad hoc per cadere
esattamente in ciascuna soglia (0, 1, 2-3, 4+ statistiche migliorate) — la tecnica tipica per
testare una funzione a soglie: un caso di test per ciascun lato di ogni confine.

### CI vs CD — cosa fanno davvero i tre workflow (letto riga per riga, non assunto)

**`ci.yml`** — si attiva su `push` a `main` **e** `dev`, oltre che su `pull_request` verso `main`:

```yaml
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  ci:
    steps:
      - Lint:  npm run lint --if-present
      - Test:  npm run test:run
      - Build: npm run build   (con env VITE_ENV: production + secrets Firebase prod)
```

Tre passi in sequenza: lint, unit test (`test:run`, **non** `test:rules` — le rules richiedono
l'emulatore, non incluso in questo job), build. Da notare: il passo di build usa sempre le
variabili d'ambiente e i secrets del progetto **production** (`VITE_ENV: production`,
`VITE_FIREBASE_PROJECT_ID`, ecc.), anche quando il push è su `dev` — questo job non fa alcun
deploy, serve solo a verificare che il progetto **compili correttamente**, quindi usa una
configurazione qualsiasi valida (quella di prod) solo per generare la build di verifica.

**`e2e.yml`** — stesso trigger di `ci.yml` (`push` su `main`/`dev`, `pull_request` verso `main`),
ma è un **workflow separato e indipendente**. Il commento nel file lo dichiara esplicitamente:
*"Workflow indipendente da 'CI': un flakiness qui non deve mai bloccare o ritardare 'Deploy to
Firebase', che ascolta solo il workflow 'CI'."* Esegue la suite Playwright contro l'ambiente
**dev** (`VITE_ENV: development`, secrets `*_DEV`) indipendentemente dal branch che ha fatto
scattare il trigger — anche un push su `main` fa girare gli e2e contro `rankex-dev`, mai contro
produzione.

**`deploy.yml`** — qui la lettura attenta smentisce un'assunzione facile ("deploy solo dopo CI
su main"): il trigger è

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main, dev]
    types: [completed]
```

`deploy.yml` si attiva **dopo che il workflow "CI" (non "E2E") ha completato**, su **entrambi**
i branch `main` e `dev` — non solo su `main`. Dentro, ci sono **due job distinti**, ciascuno con
la propria condizione:

```yaml
deploy-prod:
  if: >
    github.event.workflow_run.conclusion == 'success' &&
    github.event.workflow_run.head_branch == 'main'
  ...
  run: npx firebase-tools deploy --only hosting --project fitquest-60a09
  run: npx firebase-tools deploy --only firestore:rules --project fitquest-60a09

deploy-dev:
  if: >
    github.event.workflow_run.conclusion == 'success' &&
    github.event.workflow_run.head_branch == 'dev'
  ...
  run: npx firebase-tools deploy --only hosting --project rankex-dev
  run: npx firebase-tools deploy --only firestore:rules --project rankex-dev
```

Quindi: **esiste un deploy automatico anche su `dev`**, verso il progetto `rankex-dev`, non solo
verso produzione — condizione: il workflow "CI" (lint+test+build) deve concludersi con successo
su quel branch. `deploy-prod` scatta solo se `head_branch == 'main'`, `deploy-dev` solo se
`head_branch == 'dev'` — le due condizioni sono mutuamente esclusive per branch, quindi ogni push
attiva **uno solo** dei due job, mai entrambi. Da notare anche che entrambi i job deployano sia
`hosting` sia `firestore:rules` insieme — coerente con la nota in CLAUDE.md "Dopo ogni modifica a
`firestore.rules`, deploya su entrambi i progetti" (qui però è automatico via CI/CD, non un
comando manuale da lanciare a parte).

Riassumendo la catena reale (non quella "assunta"): un push su `dev` fa partire **sia** `ci.yml`
**sia** `e2e.yml` in parallelo (stesso trigger); quando `ci.yml` completa con successo, scatta
`deploy.yml`, il cui job `deploy-dev` pubblica hosting + rules sul progetto `rankex-dev` — **senza
aspettare l'esito di `e2e.yml`**, esattamente come dichiarato nel commento di `e2e.yml`. Lo stesso
schema si applica identico su `main`, ma con `deploy-prod` verso `fitquest-60a09`.

### `package.json` — gli script di test

```json
"test":         "vitest",
"test:run":     "vitest run --passWithNoTests",
"test:rules":   "firebase emulators:exec --only firestore --project demo-rankex-rules-test \"vitest run --config vitest.rules.config.js\"",
"test:e2e":     "playwright test --project=app",
"test:all":     "npm run test:run && npm run test:e2e",
```

`test` (senza suffisso) avvia Vitest in modalità **watch** — pensato per lo sviluppo locale,
riesegue i test ad ogni salvataggio. `test:run` esegue una volta sola e termina — quello usato in
CI, dove non ha senso restare in ascolto. Il flag `--passWithNoTests` evita che la CI fallisca se
per qualche motivo la cartella `src/__tests__/` risultasse temporaneamente vuota (situazione
anomala ma non catastrofica). `test:rules` è la riga più densa: `firebase emulators:exec` avvia
l'emulatore Firestore, **esegue** il comando tra virgolette (`vitest run --config
vitest.rules.config.js`) mentre l'emulatore è attivo, e lo **spegne** automaticamente alla fine —
un solo comando invece di "avvia l'emulatore in un terminale, poi lancia i test in un altro,
poi ricordati di spegnerlo". `test:all` combina `test:run` e `test:e2e` — **non** include
`test:rules**, perché richiede l'emulatore Firebase installato localmente (non sempre disponibile
in ogni ambiente), quindi resta un comando esplicito a parte.

## 📎 Approfondimento: CI vs CD

**CI (Continuous Integration)** risponde alla domanda "questo codice, così com'è, è
sano?" — compila, passa i test, rispetta lo stile. Non pubblica nulla, non tocca infrastruttura
reale: è un controllo di qualità. **CD (Continuous Deployment/Delivery)** risponde alla domanda
"questo codice, dato che è sano, può andare live?" — e lo fa, automaticamente, pubblicandolo. In
RankEX questa distinzione è resa esplicita dalla separazione fisica in due file:
`ci.yml` (controllo) e `deploy.yml` (pubblicazione), collegati tramite il trigger `workflow_run`
— `deploy.yml` non ripete i controlli di `ci.yml`, si fida del suo esito (`conclusion ==
'success'`) e parte da lì. È come un controllo qualità in una linea di produzione: prima
un ispettore verifica che il pezzo rispetti le specifiche (CI), solo dopo il pezzo approvato
passa alla fase di imballaggio e spedizione (CD) — le due fasi sono ben distinte, e la seconda
non ha motivo di ripetere il lavoro della prima.

## Diagramma mentale

```
push su "dev"                              push su "main" (es. da PR mergiata)
     │                                            │
     ├──────────────┐                             ├──────────────┐
     ▼              ▼                             ▼              ▼
  ci.yml         e2e.yml                       ci.yml         e2e.yml
  (lint+test+    (Playwright                   (lint+test+    (Playwright
   build)        contro rankex-dev)             build)        contro rankex-dev)
     │                                            │
     │ successo                                   │ successo
     ▼                                            ▼
 deploy.yml (workflow_run su "CI")           deploy.yml (workflow_run su "CI")
     │                                            │
     ▼                                            ▼
  deploy-dev                                  deploy-prod
  hosting + rules → rankex-dev                hosting + rules → fitquest-60a09

  e2e.yml NON blocca né ritarda deploy.yml in nessuno dei due casi.
```

## Errori comuni

1. **Assumere che `deploy.yml` scatti solo su `main`.** Come letto sopra, scatta anche su `dev`
   (verso `rankex-dev`) — un dettaglio facile da dare per scontato senza leggere il file.
2. **Includere i test delle rules in `vitest.config.js`** — porterebbe la CI ordinaria a
   restare bloccata in timeout ogni volta che gira senza emulatore attivo, invece di
   semplicemente non vederli.
3. **Pensare che `test:all` copra anche le Security Rules** — non le include, perché richiede
   l'emulatore Firebase installato, non garantito in ogni ambiente.
4. **Scrivere unit test che dipendono dall'ordine di esecuzione** (es. uno stato globale
   condiviso tra test) — il pattern corretto, visto in `gamification.test.js`, è costruire dati
   di input freschi (`clienteBase`, spread `{ ...clienteBase, ... }`) per ogni test, mai
   riutilizzare uno stato mutato dal test precedente.
5. **Dimenticare `testEnv.clearFirestore()` in un test sulle rules** — senza il reset in
   `beforeEach`, un test potrebbe dipendere da dati lasciati da un test precedente, rendendo i
   risultati non riproducibili in isolamento.

## Best Practice

- **Config di test separate per ambienti con requisiti diversi** (serve/non serve un emulatore) —
  invece di un'unica config con flag condizionali, più difficile da ragionare.
- **CI e CD come workflow distinti collegati da `workflow_run`**, non un unico monolitico — un
  fallimento e2e (spesso più flaky) non deve mai bloccare un deploy legittimo basato solo su
  lint+unit+build.
- **Testare le regole contro il file reale** (`readFileSync('firestore.rules', ...)`), mai una
  copia duplicata a mano che rischia di disallinearsi.
- **Un caso di test per ogni soglia** in funzioni a tier (visto in `buildCampionamentoUpdate`) —
  non solo "funziona", ma "funziona esattamente al bordo di ogni fascia".
- **Deploy automatico anche su `dev`**, non solo su `main` — permette di verificare il
  comportamento in un ambiente reale (seppur di sviluppo) ad ogni push, non solo al momento del
  rilascio in produzione.

## Quiz

1. Perché `vitest.rules.config.js` è un file separato da `vitest.config.js`?
   - A) Per organizzazione estetica del codice
   - B) Perché senza l'emulatore Firestore attivo, quei test andrebbero in timeout invece di essere semplicemente assenti dalla run normale
   - C) Perché Vitest non supporta più di una config
   - D) Per motivi di licenza

2. Cosa verifica un test sulle Firestore Security Rules che un unit test su `utils/` non può verificare?
   - A) La correttezza di un calcolo matematico
   - B) Il comportamento di autorizzazione lato server, valutato dal motore di regole Firestore stesso
   - C) Il rendering di un componente React
   - D) La velocità di caricamento della pagina

3. Perché i rules test usano un `projectId` fittizio come `demo-rankex-rules-test`?
   - A) Per evitare di toccare un progetto Firebase reale — l'emulatore non richiede credenziali vere
   - B) Perché è obbligatorio per legge
   - C) Per motivi di performance
   - D) Perché altrimenti Playwright non parte

4. A cosa serve `testEnv.withSecurityRulesDisabled(...)` nel `beforeEach` del test sulle rules?
   - A) Disabilita le regole per sempre, anche durante le asserzioni
   - B) Permette di preparare i dati di test senza che le regole (che verranno poi verificate nei test veri) blocchino il setup stesso
   - C) È un bug nel test
   - D) Serve solo per motivi di performance

5. Su quali branch si attiva `ci.yml`?
   - A) Solo su `main`
   - B) Solo su `dev`
   - C) Push su `main` e `dev`, più pull request verso `main`
   - D) Solo su pull request

6. `deploy.yml` si attiva...
   - A) Solo dopo un push diretto su `main`
   - B) Dopo il completamento del workflow "CI" (non "E2E"), sia su `main` (→ deploy-prod) sia su `dev` (→ deploy-dev)
   - C) Ogni notte, schedulato
   - D) Manualmente, mai in automatico

7. Perché `e2e.yml` è un workflow separato da `ci.yml` invece di un job aggiuntivo nello stesso file?
   - A) Per limiti tecnici di GitHub Actions
   - B) Perché un fallimento e2e (più soggetto a flakiness) non deve bloccare o ritardare il deploy, che ascolta solo l'esito di "CI"
   - C) Perché Playwright non può girare nello stesso workflow di Vitest
   - D) Non c'è un motivo specifico, è arbitrario

8. Cosa fa `npm run test:rules` prima di eseguire i test?
   - A) Nulla di speciale, esegue solo Vitest
   - B) Avvia l'emulatore Firestore (`firebase emulators:exec`), esegue i test con quello attivo, poi lo spegne
   - C) Fa il deploy delle regole su produzione
   - D) Compila il progetto

9. Contro quale progetto Firebase gira la suite e2e in `e2e.yml`?
   - A) `fitquest-60a09` (produzione), sempre
   - B) `rankex-dev`, indipendentemente dal branch che ha fatto scattare il trigger
   - C) Un progetto scelto a caso ad ogni run
   - D) Nessuno, gira completamente mockato

10. Cosa NON include `test:all`?
    - A) `test:run` (unit test)
    - B) `test:e2e` (Playwright)
    - C) `test:rules` (Security Rules)
    - D) Nessuna delle precedenti, le include tutte

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** Il commento nel file lo dice esplicitamente: separarli evita che la CI ordinaria vada
   in timeout quando l'emulatore non è avviato.
2. **B.** Le Security Rules sono valutate dal server Firestore, non da codice client — un unit
   test su una funzione pura non tocca mai quel livello.
3. **A.** L'emulatore non comunica con l'infrastruttura Firebase reale, quindi non servono
   credenziali di un progetto vero — un nome fittizio è sufficiente e più sicuro (impossibile
   toccare dati reali per errore).
4. **B.** Serve solo per il setup dei dati di test (org, membri, client fittizi) — le regole
   tornano attive per le asserzioni vere e proprie nei blocchi `it(...)`.
5. **C.** `on: push: branches: [main, dev]` più `pull_request: branches: [main]`, letto
   direttamente da `ci.yml`.
6. **B.** Trigger `workflow_run` su "CI", con due job (`deploy-prod`/`deploy-dev`) filtrati per
   `head_branch` — non solo `main` come si potrebbe assumere senza leggere il file.
7. **B.** Dichiarato esplicitamente nel commento di `e2e.yml`: "un flakiness qui non deve mai
   bloccare o ritardare 'Deploy to Firebase', che ascolta solo il workflow 'CI'".
8. **B.** `firebase emulators:exec --only firestore ... "vitest run --config vitest.rules.config.js"`
   — un solo comando che gestisce l'intero ciclo di vita dell'emulatore.
9. **B.** Sempre `rankex-dev` (env `VITE_ENV: development`, secrets `*_DEV`), a prescindere se il
   trigger è arrivato da un push su `main` o `dev`.
10. **C.** `test:all` è `npm run test:run && npm run test:e2e` — non include `test:rules`, che
    richiede l'emulatore Firebase installato e va lanciato esplicitamente.

## Esercizi

1. **Facile.** Apri uno a scelta tra gli altri file in `src/__tests__/utils/` (es.
   `percentile.test.js` o `bia.test.js`) e identifica quali funzioni pure testa e con quali casi
   limite (valori nulli, array vuoti, valori ai bordi di una soglia).
2. **Facile-medio.** Esegui localmente `npm run test:run` e verifica quanti test totali passano
   nel progetto — annota il numero e il tempo di esecuzione, confrontalo con quanto impiegherebbe
   (stimalo) l'intera suite e2e.
3. **Medio.** Scrivi un nuovo blocco `describe` in stile `firestore.rules.test.js` che verifichi
   un invariante non ancora coperto nel file che hai letto (es. "uno `staff_readonly` non può
   creare un nuovo cliente" — verifica prima nel file se è già testato, e se non lo è, aggiungilo
   in bozza senza eseguirlo).
4. **Medio-difficile.** Disegna (anche solo a parole, senza modificare i file YAML) come
   aggiungeresti un job `test:rules` dentro `ci.yml`, tenendo conto che richiede l'emulatore
   Firebase — quali step GitHub Actions servirebbero in più rispetto a quelli già presenti?
5. **Difficile.** Analizza il costo in tempo dei tre workflow (`ci.yml`, `e2e.yml`,
   `deploy.yml`) per un singolo push su `dev` — quanti minuti-macchina GitHub Actions vengono
   consumati approssimativamente in totale, sapendo che `e2e.yml` ha un `timeout-minutes: 15` e
   gira in parallelo a `ci.yml`? Proponi se e come questo consumo potrebbe diventare un problema
   di costi (collega alla sezione "Monitoraggio costi Firebase" di CLAUDE.md, anche se qui si
   parla di minuti GitHub Actions, non di quota Firestore).

## Challenge

Aggiungi un decimo/undicesimo test reale (senza eseguirlo, solo come modifica proposta al file —
oppure eseguilo in locale con `npm run test:rules` se hai l'emulatore Firebase installato) a
[`tests/rules/firestore.rules.test.js`](../../tests/rules/firestore.rules.test.js) che copra un
caso non ancora presente: verifica che un `client` (es. `clientUser1`, già presente nei dati di
setup del file) possa leggere il proprio documento in `organizations/org1/clients/client1` ma
**non** possa leggere `organizations/org1/clients/{altroClientId}` di un altro cliente della
stessa organizzazione (isolamento *tra client della stessa org*, distinto dall'isolamento
multi-tenant tra org diverse già coperto nel file). Usa `assertSucceeds`/`assertFails` come negli
esempi esistenti, e verifica prima nel file se un test equivalente esiste già sotto un nome
diverso prima di duplicarlo.
