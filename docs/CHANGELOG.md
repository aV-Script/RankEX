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
