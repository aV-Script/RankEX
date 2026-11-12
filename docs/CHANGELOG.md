# Changelog — RankEX

Gestito dal Release Manager, una voce per release verso `main`/produzione.

Formato:

```
## [vX.Y] — <data>
### Features
### Bug Fixes
### Known Issues
### Breaking Changes
### Rollback plan
```

---

## [EPIC-010] — NON RILASCIATA / IN RILASCIO (preparata 2026-11-12, HEAD `31f5727` su `feature/lipedema-module`)

Processo: `CLAUDE.md` → "Rilascio in produzione". Ordine A: functions prod a mano, poi **subito** merge
`dev → main`. Sprint #18. Voce da completare durante il rilascio (campi `__` vuoti).

### Features
- EPIC-010 Lipedema Edition, **solo codice**: terzo `moduleType` senza rank/gamification, 5 test, valutazioni
  immutabili, informativa paziente. Il modulo **non è attivabile in prod** (1d: `CreateOrgForm` e `OrgDetailView`
  non offrono Lipedema con `isProduction`; solo UI, le rules non lo impediscono a un super_admin: rischio
  accettato, si sblocca con STORY-029 chiusa).
- Callable nuove (3): `aggiungiValutazione`, `annullaValutazione`, `registraInformativaPaziente`. Cambiate le
  esistenti toccate da capability/audit (`functions/src`: 21 file, +2044/-49 vs `origin/main`).
- Audit nelle callable (TD-009, `hasClientNameInAudit`): `CLIENT_CREATED`/`CLIENT_DELETED` scritti server-side;
  nome cliente nei `details` solo per PT e soccer.
- 1b: audit e side effect attesi prima del `return` + test di scansione dei sorgenti delle callable. TD-013.
- 1a: script `functions/` con `cross-env` + ipv4first. 1c: `qa:dev` con slot e gruppo `E2E-`. Runbook TP-087.

### Bug Fixes
- Fix `firestore.rules` (ADR-020): +58/-3 righe vs `origin/main`, `isAllowedModuleChange` (cambio
  moduleType da/verso lipedema solo con org senza clienti), `moduleAllowsClientWrite` (misure/trofei del trainer:
  un `get()` dell'org in più, solo su quegli update; PT/Soccer/legacy null ammessi come prima), subcollection
  `assessments` (lettura membri, scrittura negata). Nessuna modifica a `firestore.index.json` né `firebase.json`.

### Known Issues
- Modulo lipedema non attivabile in prod (vedi sopra); STORY-029 (b)/(c) DPA e testo informativa aperte.
- Runtime functions: prod oggi `nodejs20` (tutte le 37 callable); `functions/package.json` di HEAD ha
  `engines.node: 22` -> il deploy cambia il runtime di **tutte** le callable da Node 20 a 22 (rischio a sé:
  dipendenze, cold start). Dopo il deploy: `firebase functions:list --project fitquest-60a09` deve mostrare
  **40 callable** (37 + 3 nuove), tutte `nodejs22`; altrimenti deploy parziale, fermarsi. Rollback: redeploy del
  commit precedente (runtime torna a 20).
- GYM senza org QA: non verificato.
- Finestra tra deploy functions e merge: doppia voce audit sull'eliminazione cliente (`client.deleted` client +
  `CLIENT_DELETED` functions, action diversi); la creazione è già doppia oggi.

### Breaking Changes
- Nessuno per client/rules vecchi (callable compatibili). Un'org con `moduleType` non nullo ma sconosciuto
  verrebbe bloccata dalle callable (tutte le capability `false`): `moduleType` null = PT, nessun backfill.

### Pre-flight su HEAD `31f5727` (2026-11-12)
build OK · lint OK · unit 641/641 · rules 129/129 · functions 231/231 · `qa:dev` 36/36 su hosting dev a `31f5727`
· `docs/BUGS.md`: nessun P0/P1 aperto · `.env.production` = production / fitquest-60a09 (solo le due righe).

### Stato attuale della produzione (annotato prima dei deploy)
- Hosting + rules prod: `origin/main` = **`4f5d08e`** (verificato con `git fetch`, 2026-11-12).
- Functions prod: **`744f6f9`, confermato dall'utente il 2026-11-12.** `firebase functions:list` mostra 37 callable `nodejs20`,
  tra cui `registraLoginFallito` e `acquistaAvatar`; l'ultimo commit su `origin/main` che tocca `functions/` è
  `744f6f9` (2026-10-24), stima del commit deployato. Il CHANGELOG non registra deploy functions dopo il 2026-09-14.

### Da compilare durante il rilascio
- [x] Merge `feature/lipedema-module -> dev`, verifica rankex-dev + `qa:dev`: fast-forward `4516331..f086405` (2026-11-12); CI 43189927434 ok, E2E 43189927392 ok, `deploy.yml` 43190111563 (`deploy-dev` ok, `deploy-prod` skipped); `qa:dev` 36/36 sull'hosting deployato dalla CI
- [x] Query prod `moduleType` (utente, Console): solo valori ammessi (`personal_training`, `soccer_academy`, assente/null), 2026-11-12
- [x] Commit functions prod confermato: `744f6f9` (utente, 2026-11-12)
- [ ] Deploy functions prod (`cd functions && npm run deploy`): ora __, esito __; `functions:list`: __ callable (attese 40), runtime __ (atteso nodejs22)
- [ ] Merge `dev -> main`, run CI (id __) e `deploy.yml` (id __): CI __, hosting __, rules __
- [ ] Smoke test sola lettura (super_admin utente): __; log functions / `audit_logs`: __
- [ ] Costi Firebase dopo 24 h: __

### Rollback plan
Prev: hosting+rules `4f5d08e`; functions `744f6f9` (confermato). Dettagli e motivazioni in `CLAUDE.md`.
Comandi da Git Bash; in PowerShell `$env:NODE_OPTIONS='--dns-result-order=ipv4first'; <cmd>`.
- Rules: Console -> Firestore -> Rules -> cronologia, oppure cartella temporanea con
  `git show 4f5d08e:firestore.rules > firestore.rules` + `firebase.json` minimo, poi (con NODE_OPTIONS ipv4first)
  `firebase deploy --only firestore:rules --project fitquest-60a09`. Non tocca gli indici. Un push successivo su
  `main` ripubblica le rules di `main`.
- Functions: `git worktree add ../rankex-fn-rollback 744f6f9`; poi, con NODE_OPTIONS ipv4first,
  `cd ../rankex-fn-rollback/functions && npm ci && npx firebase-tools deploy --only functions --project fitquest-60a09`
  (a 744f6f9 `npm run deploy` chiama `firebase` senza `cross-env`: non usarlo). Runtime torna a Node 20. Le 3
  callable nuove non sono nel codice vecchio: la CLI propone di cancellarle, rispondere **No** (restano,
  innocue); `--force` le cancella, in non interattivo senza `--force` il deploy fallisce. Cancellazione voluta:
  `firebase functions:delete aggiungiValutazione annullaValutazione registraInformativaPaziente --region europe-west1 --project fitquest-60a09`.
  `git worktree remove` solo dopo aver verificato che `functions/node_modules` sia una cartella reale, non una junction.
- Hosting: Console -> Hosting -> Release history -> Rollback, per **entrambi** `rankex-app` e `rankex-admin`; un
  push successivo su `main` li sovrascrive.
- Se CI di `main` fallisce o `deploy.yml` non parte: stato sicuro (callable compatibili col client vecchio,
  finestra A prolungata con doppia voce `client.deleted`), fix forward su `dev` -> `main`; rollback functions
  non richiesto. Controllo run: `gh run list --branch main`, `gh run watch`; limite indicativo ~15 min dal push.

---

## [Backend] — 2026-09-14

### Features
- Obiettivi trainer (EPIC-004): `aggiungiObiettivo`/`annullaObiettivo` (Cloud
  Functions) + achievement rilevato server-side in `salvaCampionamento` + rules
  `clients/{clientId}/goals`.
- Runbook manuale (EPIC-006): rules `qa_runs` (top-level, solo super_admin).

### Deploy
- Cloud Functions → **fitquest-60a09** (prod), verificato via `firebase
  functions:list` — `aggiungiObiettivo`/`annullaObiettivo` presenti, `salvaCampionamento` ridistribuita.
- `firestore.rules` → **fitquest-60a09** (prod).
- `dev` pushato su origin (14 commit) → CI + deploy automatico su rankex-dev.

### Known Issues
- **Il frontend NON è ancora live su prod.** Il deploy di oggi ha coperto solo
  Cloud Functions + rules (lanciati manualmente da terminale, fuori dalla CI). La
  UI (tab Obiettivi, pagina Runbook) è build-ata e verificata su dev, ma non è mai
  stata pushata a `main` — l'hosting prod (`rankex-app.web.app`/`rankex-admin.web.app`)
  serve ancora la build precedente. Il backend è quindi pronto e raggiungibile, ma
  irraggiungibile da UI finché il frontend non arriva su prod.
- Nessun commit di questa sessione era mai stato pushato su origin prima di oggi —
  14 commit locali esistevano solo su questa macchina.

### Rollback plan
Cloud Functions: `git checkout <commit precedente> -- functions/` poi
`cd functions && npm run deploy`. Rules: `npm run deploy:rules` dopo checkout dello
stato precedente di `firestore.rules`. Nessun dato scritto da queste funzioni in
produzione finché il frontend non le raggiunge — rollback a basso rischio.

---

## [Backend] — 2026-09-15

### Features
- **EPIC-007 (Privacy & Data Protection audit) — remediation P0, STORY-015..018:**
  - STORY-015: hardening regola `create` su `/audit_logs/{logId}` — anti-spoofing
    `uid`/`email` (deve coincidere con l'identità autenticata) + `hasOnly` sui 7
    campi ammessi, impedisce a un utente autenticato di iniettare voci false/campi
    extra nel log di sicurezza. 4 nuovi test in `tests/rules/firestore.rules.test.js`.
  - STORY-016: cascade delete completo in `eliminaCliente` — elimina anche le
    subcollection `notes/`/`goals/` (via `recursiveDelete`) e ripulisce i
    riferimenti al `clientId` in `slots`/`recurrences`/`notifications`/
    `workoutPlans`, che prima restavano orfani dopo l'eliminazione di un cliente.
    Operazioni "core" (cliente, `users/{uid}`, `clientCount`) committate per prime
    in un batch atomico dedicato, prima della pulizia referenziale.
  - STORY-017: nuova Cloud Function pubblica `registraLoginFallito` — i tentativi
    di login falliti vengono ora davvero registrati in `audit_logs` (prima
    `auditLog()` abortiva silenziosamente per mancanza di `currentUser`, zero
    entry scritte). Throttle 5 tentativi/5min per email, query limitata
    (`.orderBy().limit()`) per non scaricare l'intero storico ad ogni chiamata.
    Richiede il nuovo indice composito `audit_logs(action, email, timestamp desc)`
    in `firestore.index.json`. Vedi `docs/DECISIONS.md` → ADR-004.
  - STORY-018: messaggio di login generico ("Credenziali non valide") per
    `auth/wrong-password`/`auth/user-not-found`/`auth/invalid-credential` — anti
    account-enumeration. Isolato in `getLoginErrorMessage()`, usato solo dal
    login: i flussi di cambio password (utente già autenticato) mantengono i
    messaggi specifici originali.
- Nuovo caso runbook TP-044 (`config/runbook.config.js`) per la verifica manuale
  del login falliti loggato.

### Deploy
**Non ancora eseguito.** Ordine previsto, sempre prima su rankex-dev:
1. `npm run deploy:rules:dev` (STORY-015)
2. `firebase deploy --only firestore:indexes --project rankex-dev` (indice STORY-017 —
   **obbligatorio prima che `registraLoginFallito` venga invocata**, altrimenti la
   query di throttle fallisce con `FAILED_PRECONDITION`)
3. `cd functions && npm run deploy:dev` (`eliminaCliente` aggiornata + `registraLoginFallito` nuova)

Verifica one-off contro rankex-dev per STORY-016 (fixture con
nota+goal+slot+ricorrenza+notifica+scheda) e STORY-017 (login fallito reale →
entry in `audit_logs`) da eseguire subito dopo il deploy, prima di ripetere gli
stessi passi su `fitquest-60a09` (prod) e prima di segnare le story DONE in
`docs/BACKLOG.md`.

### Known Issues
- Il lavoro è stato sviluppato e verificato (build, lint, 211/211 unit test,
  47/47 rules test — tutti rieseguiti in un worktree isolato dopo che una
  sessione concorrente su `feature/mobile-app` ha reso inaffidabile lo stato
  della working directory condivisa) ma non ancora deployato né su rankex-dev
  né su prod.
- 2 giri di code review: 2 finding HIGH (query di throttle senza limite in
  `registraLoginFallito`; ordine non atomico delle operazioni core in
  `eliminaCliente`) + 1 finding MEDIUM (regressione UX sui messaggi di cambio
  password) — tutti risolti e riverificati (APPROVED).

### Rollback plan
Cloud Functions: `git checkout <commit precedente> -- functions/` poi
`cd functions && npm run deploy:dev` (o `npm run deploy` per prod). Rules:
`npm run deploy:rules:dev`/`npm run deploy:rules` dopo checkout dello stato
precedente di `firestore.rules`. L'indice composito nuovo non richiede rollback
(un indice non usato non ha effetti collaterali, può restare).

---

<!-- Nuove release aggiunte qui dal Release Manager -->
