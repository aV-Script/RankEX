# Changelog — RankEX

Gestito dal Release Manager, una voce per release verso `main`/produzione.

Formato:

```
## [AAAA.MM.GG] — <etichetta>
### Features
### Bug Fixes
### Known Issues
### Breaking Changes
### Rollback plan
```

Schema: data del deploy prod + etichetta; più rilasci nello stesso giorno: suffisso `.2`, `.3`
(es. `[2026.11.12.2]`).

---

## [2026.11.27.2] — Sprint #23 Go-live Lipedema (sblocco del modulo in prod) — RILASCIATO

Processo: `CLAUDE.md` → "Rilascio in produzione". **Solo hosting** (merge `dev → main` → `deploy.yml`): functions
invariate, nessun deploy functions. Sprint #23, voce 9.

### Features
- Modulo `lipedema` selezionabile dal super_admin in ogni ambiente (`IS_LIPEDEMA_SELECTABLE = true`,
  `src/config/modules.config.js:30`; select in `CreateOrgForm.jsx:97` e `OrgDetailView.jsx:63`). Runbook TP-087
  aggiornato, TP-095 nuovo (go-live, blocker).

### Bug Fixes
- Nessuno.

### Known Issues
- **STORY-029 (b)/(c) aperte** (DPA e testo dell'informativa non ancora approvati dal manager): sblocco in prod con
  rischio accettato dall'utente (27/11/2026). L'org Lipedema reale si crea solo con via libera a sé.
- `qa:dev` sull'hosting dev a `5c7f6c6`: **65/66** (rosso `e2e/qa-dev/tests/lipedema.spec.js:103` "chiude un
  appuntamento"), rerun di `lipedema.spec.js` da solo **6/6**: spec instabile, non legata allo sblocco (a backlog).
- E2E CI rosso solo per BUG-042 (dati di test, `real-flows.spec.js` "campionamento", tetto 50 campionamenti).
- TP-095 su rankex-dev, passi 1, 2, 7, 8 (super_admin): tutti PASS il 27/11, residui = 0 (dettaglio in SPRINT voce 8).

### Breaking Changes
- Nessuno. Nessuna modifica a `firestore.rules`, `firestore.index.json`, `firebase.json`, `functions/`.

### Diff verso la produzione (2026-11-27, `git diff --stat origin/main origin/dev`, `53b5579..61f8d93`)
`CLAUDE.md`, `docs/*`, `src/config/modules.config.js`, `src/__tests__/config/modules.config.test.js`,
`src/config/runbook.config.js` (7 file). Pre-flight della voce 6: lint ok, unit 758/758, build ok; CI su `61f8d93`
46046671039 ok, `deploy.yml` 46046868084 `deploy-dev` ok (18:05 UTC).

### Stato attuale della produzione (annotato prima del merge)
- Hosting + rules prod: `origin/main` = **`53b5579`** (`deploy.yml` 46018372099).
- Functions prod: **`478a157`** (codice `fb08a28`), 40 callable `nodejs22` — invariate da questo rilascio.

### Rollback plan
- **hosting** (unico layer toccato): Console → Hosting → Release history → Rollback, per **entrambi** `rankex-app` e
  `rankex-admin`, alla release di `53b5579` (14:43 UTC del 27/11); oppure `firebase hosting:clone
  <site>@<versionId> <site>:live` per i 2 siti. Dopo il rollback non pushare su `main` finché non è corretto.
- Alternativa senza rollback: fix forward con `IS_LIPEDEMA_SELECTABLE = isDev` su `dev` → merge.
- rules: invariate (il deploy le ripubblica identiche). functions: non toccate.
- Un'org lipedema già creata in prod resta anche dopo il rollback (che nasconde solo la select): va gestita a parte
  (Zona pericolosa, con via libera).

### Da compilare durante il rilascio
- [x] Push docs su `dev` (`61f8d93..924734d`): CI 46050522610, `deploy.yml` 46050688111 `deploy-dev` ok (18:36:45 UTC)
- [x] Merge `dev -> main` (fast-forward `53b5579..924734d`, push 18:34:54 UTC): CI 46050536550 ok, `deploy.yml`
  46050713909 `deploy-prod` ok (18:36:51 UTC, checkout `924734d`), `deploy-dev` skipped. **hosting + rules prod a
  `924734d`**; functions prod invariate a `478a157`
- [x] HTTP check anonimo: `rankex-app` e `rankex-admin` `version.json` `{"v":1795804596665}` (prima
  `1795790592944`), Last-Modified 18:36:44 GMT, CSP e `X-Frame-Options: DENY` presenti
- [x] Banner RICARICA sulla scheda `rankex-app` (login) aperta prima del merge sulla build vecchia: presente alle
  18:37:59 UTC, circa 1 minuto dopo il deploy
- [x] Select Modulo con Lipedema su `rankex-admin` dopo il deploy: dettaglio org PT (0 clienti) e form NUOVA offrono
  PT / Soccer / Lipedema. Nota: la scheda già aperta teneva in cache l'`index.html` vecchio fino al reload (il banner
  RICARICA lo copre)
- [x] Smoke test TP-095 in prod (27/11, 18:40-18:50 UTC, Chrome; login super_admin e password del trainer di prova
  digitati dall'utente): org temporanea `smoke-lipedema-20261127-uo9gk` (free, lipedema). Passi 1-7 **PASS**:
  1 org creata, terminologia lipedema, utilizzo 0/1 e 0/10; 2 trainer `smoke.20261127@test.rankex` aggiunto, cambio
  password al primo login (fatto dall'utente); 3 paziente fittizio senza account e senza informativa → banner
  "valutazioni… non si possono salvare"; 4 informativa `SMOKE-1.0` + visita 5/5 (2MWT 132 m, 30s-STS 11 rip.,
  Handgrip D 226 · S 195 N, HHD D 310 · S 285 N, OLS D 14,1 · S 10,2 s); 5 correzione 2MWT → 162 m (la vecchia
  ANNULLATA, "Sostituita da"), 30s-STS annullata con motivo; 6 anteprima PDF con le sole valide (30s-STS "Non ancora
  eseguito"), nessun rank/percentile/XP (stampa non lanciata); 7 org eliminata da Zona pericolosa, sparita dalla lista
  (2 org), sessione del trainer chiusa al reload. Log functions prod 18:40-18:50: solo I/D di aggiungiValutazione,
  annullaValutazione, eliminaOrganizzazione, 0 errori. Passo 8 (Console: Authentication senza l'utente smoke,
  Firestore senza `organizations/smoke-lipedema-20261127-uo9gk`, `audit_logs` senza il nome del paziente): **a cura
  dell'utente**, nessun accesso Admin SDK a prod da qui

---

## [2026.11.27] — Sprint #22 (area cliente 360 px, terminologia lato server) — RILASCIATO

Processo: `CLAUDE.md` → "Rilascio in produzione". Ordine: functions prod a mano, poi **subito** merge `dev → main`.
Sprint #22, voce 10. Voce da completare durante il rilascio.

### Features
- STORY-049: area cliente PT e soccer a 360 px (etichette hub, vetrina trofei, barre STATUS), spec layout 360/1366.
- `aria-label` della card PROSSIMA nella Home cliente.
- Tab BIA della dashboard con `capability: 'hasBia'` (BUG-005).
- `npm run check:node-imports` in CI e nel pre-flight.

### Bug Fixes
- BUG-037: notifica di `chiudiSessione` con la terminologia del modulo e data leggibile (nuovo
  `functions/src/shared/terminology.js`, `shared/orgModule.js`). BUG-038: testi cablati dei badge (ADR-021).
- `functions/src` vs `origin/main`: 3 file (+83/-17), **0 callable nuove**. Nessuna modifica a `firestore.rules`,
  `firestore.index.json`, `firebase.json`.

### Known Issues
- BUG-039/040/041 (P3), TD-016 aperti. GYM non verificato dal vivo (nessuna org QA GYM).
- Lipedema resta non selezionabile in prod (`IS_LIPEDEMA_SELECTABLE = isDev`): lo sblocco è un rilascio a sé.
- Finestra tra deploy functions e merge: notifica di chiusura sessione col testo nuovo e client vecchio; nessuna
  incompatibilità (stessi campi).

### Breaking Changes
- Nessuno.

### Pre-flight su `fb08a28` (2026-11-27)
build OK · lint OK · check:node-imports OK · unit 758/758 · functions 268/268 · test:rules 129/129 · `qa:dev` 68/68
sull'hosting dev a `fb08a28` (run `deploy.yml` 46008321615) · `docs/BUGS.md` senza P0/P1 · `.env.production` /
`.env.development` corretti (solo le due righe). HEAD di `dev` al rilascio contiene in più **solo docs**
(`673eb4a` SPRINT.md e questa voce): `qa:dev` non ripetuto.

### Stato attuale della produzione (annotato prima dei deploy)
- Hosting + rules prod: `origin/main` = **`f086405`** (`git fetch`, 2026-11-27).
- Functions prod: **`f086405`** (voce `[2026.11.12]`); `functions:list` 27/11 (sola lettura): 40 callable `nodejs22`.
- `node functions/scripts/checkPrev.mjs f086405`:
  ```
  <prev> f086405 deployabile (runtime atteso nodejs22).
  engines.node f086405: 22
  engines.node HEAD: 22
  ```

### Da compilare durante il rilascio
- [x] Push docs su `dev` (`fb08a28..515eb12`): CI 46012723274 ok, `deploy.yml` 46012971301 (`deploy-dev` ok,
  `deploy-prod` skipped); E2E 46012723193 **rosso** su 1 test per dati di test (BUG-042, tetto 50 campionamenti,
  non codice: 38 passed, 21 skipped); `e2e.yml` non blocca `deploy.yml`
- [x] functions prod a `478a1577757deef2dda869aa574cba5afa781da1` (HEAD al deploy, `git rev-parse HEAD` subito
  dopo; la riga del guard è stata tagliata dall'output catturato, working tree pulito in `functions/`); codice
  functions = `fb08a28`. Deploy `cd functions && npm run deploy` 2026-11-27 14:33:10-14:34:45 UTC, exit 0,
  "Deploy complete!", 40 "Successful update operation", nessuna callable creata o cancellata
- [x] `functions:list --project fitquest-60a09` dopo il deploy: 40 callable, 40 `nodejs22`
- [x] Merge `dev -> main` (fast-forward `f086405..53b5579`, push 14:41:26 UTC): CI 46018184533 ok (14:42:46),
  `deploy.yml` 46018372099 `deploy-prod` ok (14:43:27 UTC), `deploy-dev` skipped; finestra functions -> hosting/rules
  circa 9 minuti. E2E 46018184458 su `main`: atteso rosso per BUG-042 (dati di test). Verifica HTTP anonima:
  `rankex-app` e `rankex-admin` servono `version.json` `{"v":1795790592944}`, Last-Modified 14:43:20 GMT, CSP e
  `X-Frame-Options: DENY` presenti
- [x] Log functions prod dal deploy (`functions:log --lines 200`, 160 righe del 27/11 dalle 14 UTC): 0 righe di errore
- [x] Smoke test sola lettura super_admin su `rankex-admin` (27/11 sera, Chrome con login dell'utente, nessun
  salvataggio): **PASS**. Dashboard 2 org (1 PT, 1 Soccer, 0 Lipedema); lista org; dettaglio `dr-valerio-lamberti-2eaoc`
  (PT) e `vdp5-tgtdu` (Soccer, 16 clienti) con select Modulo = Personal Training / Soccer Academy, **senza Lipedema**;
  form NUOVA aperto e chiuso con ANNULLA: select Modulo senza Lipedema. `version.json` di entrambi i siti
  `{"v":1795790592944}` (build del #22)
- [ ] Banner RICARICA su build vecchia entro 5 min: **non verificato** al deploy del #22 (momento passato); si verifica
  al deploy `[2026.11.27.2]` con una scheda `rankex-app` aperta sulla build `1795790592944`

### Rollback plan
Prev: hosting+rules `f086405`; functions `f086405` (Node 22, deployabile: vedi checkPrev sopra). Dettagli in `CLAUDE.md`.
Comandi da Git Bash; in PowerShell `$env:NODE_OPTIONS='--dns-result-order=ipv4first'; <cmd>`.
- Rules: invariate rispetto a `f086405`, nessun rollback necessario.
- Functions: `git worktree add <cartella-esterna> f086405`; con NODE_OPTIONS ipv4first,
  `cd <cartella-esterna>/functions && npm ci && npx firebase-tools deploy --only functions --project fitquest-60a09 --non-interactive`
  (stesse 40 callable: nessun prompt di cancellazione). `git worktree remove --force` solo dopo aver verificato che
  `functions/node_modules` sia una cartella reale, non una junction.
- Hosting: Console -> Hosting -> Release history -> Rollback per **entrambi** `rankex-app` e `rankex-admin`, o
  `firebase hosting:clone <site>@<versionId> <site>:live`; dopo il rollback non pushare su `main`.
- CI di `main` rossa o `deploy.yml` non parte: hosting/rules restano a `f086405` (compatibili con le functions
  nuove), fix forward su `dev` -> `main`; rollback functions non richiesto.

---

## [2026.11.12] — EPIC-010 Lipedema (modulo non attivo)

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
- [x] functions prod a `f086405` (codice di `f086405`; sha del deploy come registrato in questa voce, prima del guard)
- [x] Deploy functions prod (`cd functions && npm run deploy`, codice di `f086405`): 2026-11-12 09:26-09:28 UTC, esito ok (3 callable create); `functions:list`: 40 callable, runtime nodejs22 per tutte; log senza errori subito dopo il deploy
- [x] Merge `dev -> main` (fast-forward `4f5d08e..f086405`, push 09:38 UTC), run CI (id 43193182316) e `deploy.yml` (id 43193385600): CI ok, hosting `rankex-app` + `rankex-admin` ok (09:39:56 UTC), rules ok (09:40:01 UTC); finestra functions -> hosting/rules circa 12 minuti. Verifica HTTP anonima: entrambi i siti servono il nuovo build con CSP e X-Frame-Options
- [x] Smoke test sola lettura (super_admin utente, 2026-11-12): lista org ok; select Modulo senza Lipedema in NUOVA e nel dettaglio org PT e Soccer; nessun salvataggio. Log functions senza errori dalle 09:26 UTC; `audit_logs` controllati in Console: ok
- [x] Costi Firebase (Sprint #19, voce 3a): letti dall'utente il 2026-11-12 in Console → Billing → Budget e avvisi,
  spesa **del mese di novembre fino al 12/11** (budget mensili; prima delle 24 h dal deploy). Progetto "RankEX" =
  fitquest-60a09, "RankEX-…" = rankex-dev; CR = Cloud Run, CRF = Cloud Run Functions, G e V = altri due budget
  per progetto (servizio non annotato). Tutti con limite di spesa "Configurato".
  - prod: Rank Ex CR ~0,00 € / 5,00 €; **Rank Ex CRF ~0,01 € / 5,00 €**; Rank Ex G ~0,00 € / 0,00 €; Rank Ex V ~0,00 € / 0,00 €
  - dev: Rank Ex DEV CR ~0,00 € / 0,00 €; **Rank Ex DEV CRF ~0,07 € / 1,00 €**; DEV G ~0,00 € / 0,00 €;
    DEV V ~0,00 € / 0,00 €
  - account (Overall Allarm): 0,00 € / 5,00 € (include un risparmio di -0,06 €). Nessun credito utilizzato.
  - Uso per servizio (letture/scritture Firestore al giorno, invocazioni Functions, transfer Hosting): **non letto**,
    per decisione dell'utente (2026-11-12): basta la spesa, sostanzialmente nulla e sotto ogni limite.

### Rollback plan
Prev: hosting+rules `4f5d08e`; functions `744f6f9` (confermato). Dettagli e motivazioni in `CLAUDE.md`.
Comandi da Git Bash; in PowerShell `$env:NODE_OPTIONS='--dns-result-order=ipv4first'; <cmd>`.
- Rules: Console -> Firestore -> Rules -> cronologia, oppure cartella temporanea con
  `git show 4f5d08e:firestore.rules > firestore.rules` + `firebase.json` minimo, poi (con NODE_OPTIONS ipv4first)
  `firebase deploy --only firestore:rules --project fitquest-60a09`. Non tocca gli indici. Un push successivo su
  `main` ripubblica le rules di `main`.
- **Functions — piano NON eseguibile così (scoperto nel Sprint #19, 2026-11-12):** `744f6f9` ha
  `engines.node: 20`, runtime dismesso da Cloud Functions il 30/10/2026 (`13052d6`): il deploy del codice
  vecchio non è possibile senza portarlo a Node 22. **Decisione dell'utente (2026-11-12): solo fix forward,
  rischio accettato;** dal prossimo rilascio il commit functions precedente è `f086405` (Node 22). Piano
  originale, per riferimento:
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
