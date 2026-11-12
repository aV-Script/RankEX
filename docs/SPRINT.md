# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

Nessuno sprint attivo: il #18 e' chiuso (2026-11-12, vedi storico). Il #19 si apre dai candidati del #18.

---

## Sprint chiuso (storico)

# SPRINT #18 — EPIC-010 Lipedema Edition, rilascio in produzione (codice, modulo non attivato) — aperto il 2026-11-12, chiuso il 2026-11-12 (goal raggiunto, voci 1a-1d, 2 e 3 DONE; voce 4 fuori sprint)

**Branch:** `feature/lipedema-module` (HEAD `ce43c1b`). Commit in locale fino alla voce 3; `lipidemia/` e
`mobile-app/` non si committano. Prima del rilascio i deploy restano su `rankex-dev`; i deploy su
`fitquest-60a09` solo con via libera esplicito dell'utente, uno per ciascun passo (vedi voce 3).

**Goal:** rilasciare in produzione (fitquest-60a09) il codice di EPIC-010 Lipedema senza attivare il modulo
lipedema in prod, e chiudere gli action item del #17 che riducono il rischio del rilascio.

**Situazione iniziale (da ricontrollare in apertura):**
- rankex-dev: hosting `511bfe0`, rules `04a676c` (ADR-020), functions `224d1bb` (TD-009).
- Test: `qa:dev` 30/30, unit 637/637, functions 222/222, rules 129/129.
- Prod: `origin/main` `4f5d08e`, mai toccata dal modulo Lipedema.
- Dopo `git fetch`: `feature/lipedema-module` ha 55 commit non su `origin/dev` e 72 non su `origin/main`;
  `origin/dev` ha 17 commit non su `main`; nessuna divergenza (fast-forward possibile).

**Riferimenti backlog:** EPIC-010 (BACKLOG r.892), STORY-029 (r.991, aperta: (b)/(c) DPA e testo informativa),
STORY-026 (r.813, retention, decisione utente), STORY-044 (r.1532, da ridisegnare sul canvas). Nessuna di
queste entra nel #18; nessuno stato da aggiornare in `BACKLOG.md` all'apertura.

**Decisioni prese (utente / tech-lead):**

| # | Decisione | Origine |
|---|-----------|---------|
| 1 | Script `functions/` con `cross-env` + ipv4first, nota workaround tolta da CLAUDE.md | utente |
| 2 | Regola "audit e side effect attesi prima del return" verificata da un test Vitest in `functions/` che scansiona i sorgenti delle callable (non ESLint) | utente |
| 3 | Slot futuro e gruppo `E2E-` creati nel global setup di `qa:dev` e cancellati nel teardown, a ogni run (non nel seed) | utente |
| 4 | Checklist di rilascio come sezione "Rilascio in produzione" di CLAUDE.md; stato del singolo rilascio in `docs/CHANGELOG.md` (non `docs/RELEASE.md`) | utente |
| 5 | Ordine di rilascio A: merge su dev, verifica, deploy functions prod, SUBITO merge dev -> main (hosting + rules) | utente, su stima tech-lead |
| 6 | Conteggio org prod per `moduleType` fatto DALL'UTENTE in Console; nessun accesso automatico a prod | utente |
| 7 | Modulo lipedema non attivabile in prod: flag per ambiente in config (es. `LIPEDEMA_ORG_CREATION_ENABLED = !isProduction`), solo UI; le rules non lo impediscono a un super_admin (rischio accettato); si sblocca con STORY-029 chiusa | utente |
| 8 | Smoke test in prod in sola lettura, solo col super_admin dell'utente | utente |

Motivazione ordine A (tech-lead): le rules nuove non rifiutano le scritture PT/Soccer del client vecchio;
`moduleType` null -> PT, nessun backfill; con A, nella finestra tra deploy functions e merge, c'e' solo la doppia
voce audit (`client.deleted` client + `CLIENT_DELETED` functions: action diversi; la creazione e' gia' doppia
oggi in prod); con B le eliminazioni nella finestra resterebbero senza audit (non recuperabile). **Rischio
principale:** un'org prod con `moduleType` non nullo ma sconosciuto verrebbe bloccata dalle callable (tutto
`false`): per questo la query preventiva (decisione 6).

**Voci, nell'ordine:**
1. **Action item del #17 e blocco UI**
   - **1a. Script functions** — `functions/package.json`: `deploy`/`deploy:dev` con
     `cross-env NODE_OPTIONS=--dns-result-order=ipv4first`; nota workaround rimossa da `CLAUDE.md`.
     *Fatto quando:* `cd functions && npm run deploy:dev` reale riesce al primo colpo senza variabile manuale.
     **Review medium.**
   - **1b. Audit e side effect attesi** — censimento `writeAudit` / `add` su `audit_logs` non attesi in
     `functions/src/callable/`, correzione, test Vitest in `functions/` che scansiona i sorgenti delle callable.
     Regola in `CLAUDE.md`. *Fatto quando:* il test fallisce rimettendo una chiamata senza `await`; 0 chiamate
     non attese nel censimento; `deploy:dev` functions. **Review HIGH** (dati sanitari).
   - **1c. `qa:dev` con slot e gruppo** — slot futuro e gruppo `E2E-` creati nel global setup, cancellati nel
     teardown (anche dopo un run interrotto: il setup ripulisce i residui). Casi in `roles.spec.js`:
     `staff_readonly` su popup slot (niente CHIUDI/SALTA/ELIMINA) e dettaglio gruppo (niente RIMUOVI/AGGIUNGI/
     RINOMINA/ELIMINA), controllo positivo per il trainer, prova negativa. *Fatto quando:* il caso staff fallisce
     con la sessione trainer; `qa:dev` verde; 0 slot/gruppi `E2E-` residui dopo il run. **Review medium.**
   - **1d. Blocco UI lipedema in prod** — flag per ambiente in config letto da `CreateOrgForm` e
     `OrgDetailView`; in dev resta selezionabile; solo UI. Unit test + caso runbook **TP-087**.
     *Fatto quando:* con `isProduction` true l'opzione lipedema non e' selezionabile in creazione ne' come
     cambio modulo; in dev si'. **Review medium.**
2. **Checklist di rilascio** (action item 4 del #17) — sezione "Rilascio in produzione" in `CLAUDE.md`, stato del
   rilascio in `docs/CHANGELOG.md`; preparata da release-manager. Contenuto minimo: diff rules dev/prod,
   functions da deployare, ordine A, verifica post-deploy (`audit_logs`, rules, smoke test), commit attualmente
   in prod (hosting, rules, functions) e comandi di rollback per layer, da annotare PRIMA di ogni deploy prod.
   **Review HIGH** (processo di deploy e rules).
3. **Rilascio, ordine A** (dopo 1 e 2 chiuse):
   1. Merge `feature/lipedema-module` -> `dev` (CI + `deploy-dev`), verifica su rankex-dev + `qa:dev`.
   2. Conteggio org prod per `moduleType`, **a cura dell'utente in Console**; esito annotato (nessun
      `moduleType` sconosciuto; legacy null ammesso).
   3. Annotare i commit in prod (hosting, rules, functions) e i comandi di rollback nella checklist.
   4. Deploy functions prod a mano (`cd functions && npm run deploy`) — **via libera esplicito dell'utente.**
   5. **Subito** merge `dev` -> `main` (CI + `deploy-prod` di hosting e rules) — **via libera esplicito
      separato.**
   6. Smoke test in prod in sola lettura col super_admin dell'utente; verifica rules e `audit_logs`.
   7. Monitoraggio costi Firebase (Console, dopo 24 ore).

**Fuori dal #18:** voce 4 (prima org lipedema in prod: esclusa, STORY-029 aperta), STORY-029 (b)/(c) DPA e
testo informativa, STORY-026 retention, STORY-044 (canvas, non si tocca), stampa su carta / paginazione PDF
Firefox, mobile-app. Lavoro emerso fuori elenco -> `docs/BACKLOG.md` per il #19.

**Casi limite da tracciare per ogni voce:**
- Moduli: PT/GYM/Soccer/Lipedema (GYM senza org QA: da dichiarare non verificato se resta cosi').
- Org legacy con `moduleType` null in prod (mappata a PT nei punti di ingresso, nessun backfill).
- Org con `moduleType` sconosciuto (callable bloccate): oggetto della query preventiva.
- Clienti prod senza `moduleType`/`privacyNotice`: le rules nuove toccano solo misure/trofei dei pazienti
  lipedema; PT/Soccer invariati.
- Deploy parziale: solo functions (finestra A: doppia voce audit); solo hosting + rules (functions vecchie: audit
  client-side ancora attivo, nessuna perdita).
- Rollback per layer (da scrivere nella checklist con i commit reali):
  - rules: `git show origin/main:firestore.rules` poi `npm run deploy:rules`, oppure Console;
  - functions: `git checkout <commit prod> -- functions/` poi `cd functions && npm run deploy` (runtime Node
    22 -> 20; le 3 callable nuove restano innocue);
  - hosting: Console -> Hosting -> Release history -> Rollback.
- Ruoli: `staff_readonly` vs `trainer` vs `org_admin` (voce 1c); super_admin (voce 1d e smoke test).
- 360 px (voce 1d: select modulo e messaggio di blocco); browser con build vecchia in cache (banner RICARICA
  dopo il deploy hosting).

**Dipendenze bloccanti segnalate:**
- Voce 1a/1b: `deploy:dev` functions manuale; 1b modifica le callable -> functions dev ridistribuite. 1a va
  prima di 1b (il deploy di 1b usa lo script corretto).
- Voce 1c richiede hosting dev invariato durante `qa:dev` (regola: mai deploy hosting in parallelo).
- Voce 1d: nessun deploy rules. Hosting dev solo dopo `qa:dev` della 1c.
- Voce 2 dopo 1a (comandi di deploy definitivi).
- Voce 3: azioni dell'utente (query Console, due via libera prod); `deploy.yml` deploya le rules prod a ogni
  merge su `main`; il deploy functions prod NON e' automatico.
- Voce 3 e' bloccata se la query 3.2 trova un `moduleType` sconosciuto.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| 1a. Script `functions/` ipv4first + nota CLAUDE.md + `deploy:dev` reale | DONE | `0dbd23d`. Verificato con `deploy:dev` reale e col deploy functions prod, senza variabile manuale. |
| 1b. Censimento audit non attesi + correzione + test Vitest scansione sorgenti + regola CLAUDE.md | DONE | `d2682a8` + `9f24a13`. Review HIGH. 4 `writeAudit` non attesi corretti. |
| 1c. Slot e gruppo `E2E-` in setup/teardown + casi `roles.spec.js` + prova negativa | DONE | `b85a14b`. 6 casi, `qa:dev` 36/36. |
| 1d. Flag `IS_LIPEDEMA_SELECTABLE` + unit test + TP-087 | DONE | `31f5727`. Flag = `isDev` (nascosto anche in UAT). |
| 2. Checklist "Rilascio in produzione" (CLAUDE.md) + stato in CHANGELOG | DONE | `f086405`. Review HIGH, 3 HIGH corretti. |
| 3.1 Merge -> dev, verifica rankex-dev, `qa:dev` | DONE | ff `4516331..f086405`; CI, E2E, deploy-dev ok; `qa:dev` 36/36 sull'hosting della CI. |
| 3.2 Conteggio org prod per `moduleType` (utente, Console) | DONE | Solo valori ammessi. |
| 3.3 Annotare commit in prod + comandi di rollback | DONE | Functions prod confermate a `744f6f9` prima del deploy. |
| 3.4 Deploy functions prod | DONE | 09:26-09:28 UTC, 40 callable nodejs22, log puliti. |
| 3.5 Merge dev -> main (hosting + rules) | DONE | ff `4f5d08e..f086405`, push 09:38 UTC; CI 43193182316 ok; deploy.yml 43193385600: hosting 09:39:56, rules 09:40:01. |
| 3.6 Smoke test prod sola lettura (super_admin utente) + audit/rules | DONE | Verifica HTTP anonima del build + smoke dell'utente ok (nessun Lipedema nella select modulo). |
| 3.7 Monitoraggio costi Firebase | BLOCKED (tempo) | Da fare il 2026-11-13 (dopo 24 h). Passa al #19. |
| STORY-029 (b)(c) / STORY-026 / STORY-044 / voce 4 / stampa carta / mobile-app | fuori sprint | Utente-legale / decisione utente / canvas. |

**Verifica prevista degli action item della retrospettiva #17 (a fine #18):**
1. Script functions con ipv4first — **voce 1a.** Fatto quando: `npm run deploy:dev` in `functions/` riesce al
   primo colpo senza variabile manuale (usato anche per il deploy di 1b) e la nota workaround non e' piu' in
   CLAUDE.md. Verificato nel deploy reale di 1b e nei log del deploy prod (3.4).
2. Audit/side effect attesi prima del return — **voce 1b.** Fatto quando: il test Vitest in `functions/` fallisce
   rimettendo una chiamata senza `await`, 0 chiamate non attese nel censimento, regola in CLAUDE.md.
3. Seed `qa:dev` con slot e gruppo + casi readonly — **voce 1c** (per decisione utente: global setup/teardown
   a ogni run, non seed). Fatto quando: il caso staff fallisce rimettendo CHIUDI visibile, `qa:dev` verde,
   teardown cancella slot e gruppo.
4. Checklist di rilascio — **voce 2 e voce 3.** Fatto quando: il deploy prod segue la checklist con 0 passi
   fuori elenco e `docs/CHANGELOG.md` e' aggiornato (per decisione utente la checklist sta in CLAUDE.md).
5. Ogni voce di verifica confermata sul codice prima dell'apertura, con file e riga — **tutte le voci.** Fatto
   quando: 0 voci del #18 finiscono "non applicabile". Da verificare in apertura (developer, prima del codice):
   `CreateOrgForm` e `OrgDetailView` leggono il modulo da un punto unico; `isAllowedModuleChange` in
   `firestore.rules`; punti in cui le callable scrivono audit (`creaCliente`, `eliminaCliente` + censimento
   completo); global setup/teardown in `e2e/qa-dev/`. Annotare file:riga nella voce prima di iniziare.

**Rischi:** (1) 1d tocca la creazione org: il flag non e' un limite di sicurezza (rules aperte a super_admin),
va scritto nel runbook e nella checklist. (2) Il rilascio concentra rules, functions e hosting: deploy
parziale e rollback per layer devono essere nella checklist PRIMA della voce 3. (3) Query prod a cura
dell'utente: se non disponibile, la voce 3 si ferma a 3.1. (4) Un solo deploy hosting dev alla volta, mai
durante `qa:dev`. Principio: finire > iniziare; la voce 3 parte solo con 1 e 2 chiuse.

## Goal
Rilasciare in produzione (fitquest-60a09) il codice di EPIC-010 Lipedema senza attivare il modulo, e chiudere gli
action item del #17 che riducono il rischio del rilascio. **Raggiunto.** Stato prod a `f086405`: functions,
hosting e rules. Modulo lipedema non selezionabile in prod (UI; le rules non lo impediscono a un super_admin,
rischio accettato, decisione 7).

## Completato
- **1a** (`0dbd23d`): script `deploy`/`deploy:dev` di `functions/` con `cross-env` + ipv4first; verificato con
  `deploy:dev` reale e poi col deploy functions prod, senza variabile manuale.
- **1b** (`d2682a8`, `9f24a13`): 4 `writeAudit` non attesi ora attesi (`aggiungiValutazione` supersedes,
  `annullaValutazione`, `registraInformativaPaziente`, `creaCliente` senza login); `writeAudit` logga l'errore
  (solo action/code). Test `sideEffectsAwaited` (writeAudit, commit, recursiveDelete, createUser,
  deleteUser/deleteUsers), `writeAudit.test`, `indexImport.test` (import di `src/index.js` col loader ESM
  nativo: il primo `deploy:dev` era fallito per `import { logger } from 'firebase-functions/logger'`, accettato
  da Vitest, emerso al deploy e non ai test). Review HIGH. Verificato su rankex-dev: `audit_logs` con
  `CLIENT_CREATED`, `PRIVACY_NOTICE_RECORDED`, `ASSESSMENT_VOIDED` env `functions` dopo `qa:dev`.
- **1c** (`b85a14b`): slot e gruppo `E2E-` in qa-pt creati/cancellati a ogni run; 6 casi in `roles.spec.js`
  (staff senza azioni, trainer con azioni, prova negativa con match su `toHaveCount`, senza `test.fail` dopo la
  review). `qa:dev` 36/36.
- **1d** (`31f5727`): `IS_LIPEDEMA_SELECTABLE = isDev` (prod e UAT nascosto; `isDev` invece di `!isProduction`
  per coprire UAT), `getSelectableModuleOptions`; TP-087. QA dal vivo su rankex-admin-dev a desktop e 360 px; in
  prod verificato dall'utente nello smoke test.
- **2** (`f086405`): sezione "Rilascio in produzione" in CLAUDE.md + voce CHANGELOG; review HIGH con 3 HIGH
  corretti (rollback functions su PowerShell/`npx firebase-tools`, prompt di cancellazione callable nuove, piano
  se la CI su main fallisce).
- **3 Rilascio, ordine A, tutto il 2026-11-12:** merge feature -> dev ff `4516331..f086405` (CI, E2E, deploy-dev
  ok; `qa:dev` 36/36 sull'hosting della CI); query `moduleType` prod dell'utente: solo valori ammessi; functions
  prod confermate a `744f6f9` prima del deploy; deploy functions prod 09:26-09:28 UTC -> 40 callable nodejs22,
  log puliti; merge dev -> main ff `4f5d08e..f086405` push 09:38 UTC, CI 43193182316 ok, deploy.yml
  43193385600: hosting rankex-app + rankex-admin 09:39:56, rules 09:40:01; finestra ~12 min; verifica HTTP
  anonima del nuovo build; smoke test in sola lettura dell'utente ok. E2E su main (43193182295): rosso per un
  difetto del test (vedi "Non verificato"), corretto in `3f7d5f3`.
- Nessun dato manuale creato (solo `E2E-` cancellati dal teardown; script temporanei cancellati).

## Non verificato
- Costi Firebase dopo 24 h (da fare il 2026-11-13).
- Caso del lunedi' per lo slot E2E in `qa:dev`.
- Comandi di rollback: scritti e rivisti, mai eseguiti.
- GYM: nessuna org QA.
- Nessun login trainer/cliente reale in prod (smoke solo super_admin).
- Banner RICARICA in prod non osservato esplicitamente.
- Esito E2E su main (43193182295): **rosso** (1 failed, 1 flaky) per un difetto del test, non dell'app: `real-flows.spec.js` "email già usata" contava le card con `count()` prima del caricamento (stesso errore su dev il 2026-10-31). Corretto in `3f7d5f3` (verde in locale contro rankex-dev); E2E in CI da rivedere al prossimo push. Flaky: "chiusura sessione con doppio click" (passato al retry).

## Non completato (motivo)
- **Voce 4** (prima org lipedema in prod): fuori sprint, STORY-029 aperta.
- **3.7 costi Firebase:** richiede 24 ore dal deploy (2026-11-13).

## Blockers
- **STORY-029 (b)/(c)** (DPA e testo informativa, utente/legale): bloccante per attivare lipedema in prod; a
  chiusura va tolto il filtro `IS_LIPEDEMA_SELECTABLE`.
- **Stato dei commit:** i commit di docs successivi al rilascio (`fd28852`, `f1d59e8`, `f7b54d6`, quello dello
  smoke test e questa chiusura) sono solo locali, non su dev/main finche' l'utente non autorizza un push.

## Tech debt emerso
- Nessuno nuovo da codice. Limiti noti: flag UI lipedema non e' un limite di sicurezza (rules aperte a
  super_admin); rollback non provato; GYM senza org QA.

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. Monitoraggio costi Firebase del 2026-11-13; esito E2E su main; push dei commit docs locali (via libera utente).
2. STORY-029 (b)/(c) DPA e testo informativa (utente/legale), poi togliere `IS_LIPEDEMA_SELECTABLE` e voce 4.
3. STORY-026 retention (decisione utente).
4. STORY-044 (da ridisegnare sul canvas).
5. Stampa su carta (utente); mobile-app (parcheggiata).

## Retrospettiva
Dati: 11 commit (`9024b96`..`629b607`: 2 apertura/chiusura docs, 1 chore (1a), 1 fix (1b), 1 test e2e (1c),
1 feature (1d), 1 docs/checklist (2), 3 docs di esito del rilascio, 1 docs CLAUDE.md); voci 1a-1d, 2, 3 DONE,
voce 4 fuori sprint (STORY-029); 0 bug nuovi in BUGS.md, 0 debiti nuovi in TECH-DEBT.md; rilascio prod in ~12
min senza rollback. Rework: 3 (primo `deploy:dev` fallito per l'import di 1b, `test.fail()` e settimana al
setup di 1c corretti dalla review, 3 HIGH della review della checklist).

**Verifica degli action item del #17**
1. Script `deploy` di `functions/` con ipv4first: **fatto**. `0dbd23d`: `deploy`, `deploy:dev`, `serve`, `logs`
   con `cross-env`; usato davvero nel `deploy:dev` e nel deploy prod senza variabile manuale. Residuo: CLAUDE.md
   cita ancora `NODE_OPTIONS` per i comandi del rollback con `firebase` globale (previsto, non e' lo script npm).
2. Audit/side effect attesi prima del return: **fatto, oltre la misura**. `d2682a8`: 4 `writeAudit` attesi, test
   `sideEffectsAwaited` (copre anche commit, recursiveDelete, createUser, deleteUser/deleteUsers), regola in
   CLAUDE.md; `grep` su `callable/` senza chiamate non attese. Il test di scansione e' il controllo
   automatico richiesto.
3. Seed `qa:dev` con slot e gruppo e casi staff_readonly: **fatto**. `b85a14b`: 6 casi in `roles.spec.js`,
   prova negativa (trainer: azioni presenti), teardown che cancella slot e gruppo, `qa:dev` 36/36. Limite: il
   caso del lunedi' per lo slot non e' stato esercitato (in "Non verificato").
4. Checklist di rilascio: **parziale**. Scritta in CLAUDE.md (`f086405`), seguita nell'ordine A, 3 HIGH di review
   corretti prima dell'uso. Ma "0 passi fuori elenco" non regge: il commit delle functions in prod non era
   registrato (CHANGELOG fermo al 14/09), e' stato stimato (`744f6f9`) e confermato dall'utente; i rollback non
   sono mai stati eseguiti.
5. Voci di scope confermate sul codice: **parziale, non dimostrabile**. Voce 4 uscita per STORY-029 (esterna),
   non per scope errato; ma le voci 1a-1d non riportano file e riga di conferma in SPRINT.md. Assenza di danni,
   non prova.

**WHAT WENT WELL**
- Rilascio prod senza rollback e senza incidenti, con finestra di ~12 min e smoke test dell'utente ok. Causa:
  checklist scritta e rivista (review HIGH) prima di eseguirla, query `moduleType` prod prima del deploy,
  deploy delle functions prima delle rules via `deploy.yml`.
- Il controllo e' diventato un test, non una regola: `sideEffectsAwaited` e `indexImport` falliscono da soli.
  Causa: action item del #17 scritti con "fatto quando" automatizzabile.
- Le review hanno intercettato difetti reali di test (`test.fail()` che passava per qualunque errore, settimana
  calcolata al setup) e 3 HIGH di procedura. Causa: livello di review per rischio (HIGH su rilascio/audit).
- La controprova ha smascherato un test inefficace (`indexImport` dentro Vitest non intercettava l'errore).

**WHAT WENT WRONG / CAUSED BUGS**
- Il primo `deploy:dev` di 1b e' fallito: `import { logger } from 'firebase-functions/logger'` accettato da
  Vitest (interop CJS permissiva, e il test mockava il modulo) e rifiutato dal loader ESM nativo di Node.
  ROOT CAUSE: l'ambiente di test non e' quello di esecuzione; il mock nascondeva proprio l'import. IMPACT: 1
  deploy dev perso, nessun effetto in prod. ACTION: gia' fatta (`import * as logger` + `indexImport.test.js` in
  processo Node separato, valido per tutto `functions/`); copertura residua: azione 1.
- Commit delle functions in prod non registrato nel CHANGELOG. ROOT CAUSE: il deploy delle functions e' manuale
  e fuori da `deploy.yml`, e nessun passo obbliga a scrivere il commit. IMPACT: base del rilascio stimata e
  confermata a mano (rischio di deployare/diffare dalla base sbagliata). ACTION: azione 2.
- Comando composito di controprova con `git checkout -- .`, che avrebbe cancellato tutte le modifiche non
  committate della voce 1b; fermato dal Fact-Forcing Gate. ROOT CAUSE: la controprova (togliere la modifica per
  vedere il test fallire) e' stata fatta sul working tree reale invece che su una copia. IMPACT: nessuno, ma la
  difesa era un hook locale, non una procedura. ACTION: azione 3.
- Micro-decisione presa da un agente: il primo developer di 1d ha scelto `isDev` invece di `!isProduction`
  (UAT) senza chiedere. ROOT CAUSE: la voce non specificava il comportamento su UAT. IMPACT: accettabile,
  dichiarato all'utente. ACTION: assorbita da azione 4 (casi limite espliciti per ambiente).
- Lo scrum-master in chiusura aveva scritto anche la retrospettiva, con action item inventati: rimossa.
  ROOT CAUSE: ruolo senza confine esplicito. IMPACT: rischio di action item non basati sui dati. Nessuna azione
  (ambiente/processo gia' corretto).

**WHAT WAS SLOW**
- Rilascio e verifiche di sprint concentrati in un giorno solo, con 7 verifiche rimaste "non verificato"
  (costi 24 h, lunedi' per lo slot E2E, rollback, GYM, login trainer/cliente in prod, banner RICARICA, esito E2E
  su main). ROOT CAUSE: richiedono tempo (24 h), account o scenari non preparati; stesso schema del #14/#16.
  IMPACT: il rilascio e' chiuso con rischi residui non misurati. ACTION: azione 5.

**WHAT CAUSED REWORK**
- `deploy:dev` ripetuto per l'import di 1b; `test.fail()` e settimana al setup di 1c (review); 3 HIGH sulla
  checklist (rollback su PowerShell/`npx firebase-tools`, prompt di cancellazione delle callable nuove, piano se
  la CI su main fallisce). Causa comune: casi di ambiente reale (Node nativo, Windows, CI) non provati prima
  della revisione.

**WHAT CREATED TECHNICAL DEBT**
- Nessun debito nuovo in TECH-DEBT.md. Rischi accettati e non tracciati come debito: il filtro
  `IS_LIPEDEMA_SELECTABLE` e' solo UI (le rules lasciano a un super_admin la creazione di org lipedema in prod);
  rollback mai provato; GYM senza org QA. ROOT CAUSE: decisione 7 del rilascio. ACTION: azione 5 (rollback) e
  rimozione del filtro a chiusura di STORY-029.

**ACTION ITEM per lo Sprint #19** (max 5)
(Proposto anche "estendere indexImport a tutto `functions/src`": scartato, gia' coperto — `indexImport.test.js` importa
`src/index.js` col loader nativo e quindi tutti i moduli deployati; un modulo non raggiungibile da `index.js` non
va in deploy.)
1. Registrare sempre nel CHANGELOG il commit di ogni deploy functions prod, e farlo controllare: script
   `npm run deploy` di `functions/` che scrive/stampa `git rev-parse HEAD` e fallisce se il working tree e'
   sporco, e riga obbligatoria "functions prod a `<sha>`" nella checklist di CLAUDE.md. Fatto quando: il
   prossimo deploy functions prod produce una voce CHANGELOG con lo sha senza stime, e il comando rifiuta di
   partire con modifiche non committate.
2. Controprove sempre su una copia, mai sul working tree: regola in CLAUDE.md (usare `git stash`/copia nello
   scratchpad o `git worktree`, mai `git checkout -- .`/`git reset --hard` su modifiche non committate) e,
   se fattibile, un hook/permesso che neghi `git checkout -- .` e `git restore .` senza conferma. Fatto quando:
   la regola e' in CLAUDE.md e il comando `git checkout -- .` e' bloccato dai permessi di `settings.json`
   (verificato eseguendolo su un repo di prova).
3. Ogni voce con comportamento per ambiente scrive in apertura la tabella dev / UAT / prod (e GYM/PT/soccer dove
   rilevante) con file e riga confermati sul codice. Fatto quando: 0 scelte di ambiente prese da un agente senza
   riga corrispondente nella voce, e le voci del #19 riportano la conferma sul codice (chiude la parte non
   dimostrata dell'azione 5 del #17).
4. Chiudere i "non verificato" del rilascio con una data: costi 24 h (13/11), esito E2E su main, banner
   RICARICA e login trainer/cliente in prod con org di prova su prod (decisione utente), e un'esecuzione dei
   comandi di rollback delle functions su rankex-dev (mai in prod). Fatto quando: ogni voce di "Non verificato"
   del #18 ha esito VERIFIED o un BUG aperto, e il rollback dev e' annotato nel CHANGELOG con sha e durata.



---

# SPRINT #17 — EPIC-010 Lipedema Edition, ottava ondata (dati del modulo, audit, sola lettura, verifiche rimaste) — aperto il 2026-11-11, chiuso il 2026-11-12 (goal raggiunto, 5 voci su 5 DONE)

**Branch:** `feature/lipedema-module`. Commit solo in locale, nessun push, nessun merge;
`lipidemia/` e `mobile-app/` non si committano. Deploy solo su `rankex-dev`. Il rilascio e' il #18.

**Goal:** EPIC-010 Lipedema verso il go-live: chiudere i dati del modulo (badge e misure), la coerenza
dell'audit, la sola lettura per `staff_readonly` e le verifiche rimaste.

**Situazione iniziale (verificata nel repo, da ricontrollare in sviluppo):** rankex-dev hosting a `670313c`,
functions ferme dal #14, `qa:dev` 21/21, unit test 634/634. HEAD `063f74b` (retrospettiva #16).

**Vincolo:** **mai deploy su fitquest-60a09.** Le rules e le functions di prod restano indietro rispetto a
rankex-dev fino al #18 (rules nuove della voce 1, functions della voce 2): il #18 le rilascia insieme al merge.

**Riferimento UI:** canvas RankEX (sola lettura, non si tocca).

**Voci, nell'ordine:**
1. **BUG-003 + TD-005 + TD-006 — dati del modulo** (`docs/BUGS.md` r.52, `docs/TECH-DEBT.md` r.112 e r.130).
   Decisione presa (opzione a): nella rule di update cliente, solo se `affectedKeys` tocca `peso`/`altezza`/
   `misureHistory`/`badges`/`badgeShowcase`, `get()` di `/organizations/{orgId}`: se `moduleType == 'lipedema'`,
   `badges`/`badgeShowcase` rifiutati e le misure ammesse solo con `resource.data.privacyNotice` presente.
   Costo: +1 lettura (da 2 a 3) solo sulle scritture di misure/trofei, in tutti i moduli; nessun backfill,
   nessun deploy functions. In lipedema senza informativa la UI misure va **disabilitata con un messaggio**, non
   lasciata fallire con permission-denied. ADR nuovo (**ADR-020**) a cura del tech-lead.
   *Fatto quando:* test in `tests/rules/firestore.rules.test.js` che falliscono senza la modifica; BUG-003
   VERIFIED dal vivo con scrittura diretta da console; TD-005 e TD-006 RESOLVED. **Review high** (rules).
2. **TD-009 — audit di creazione/cancellazione cliente** (`docs/TECH-DEBT.md` r.187). Per TUTTI i moduli
   `CLIENT_CREATED` e `CLIENT_DELETED` scritti solo dalle callable (`creaCliente`, `eliminaCliente`), env
   `'functions'`; il nome solo se il modulo lo permette (`getOrgCapabilities`, criterio sul modulo, ADR-015 §2);
   tolte le scritture client-side (`usecases/createClientUseCase.js`, `hooks/useClients.js`).
   *Fatto quando:* creazione e cancellazione di un paziente lipedema producono 1 audit ciascuna, env
   `'functions'`, senza nome; in PT 1 ciascuna, con nome; unit test functions; `deploy:dev` functions; verifica
   `audit_logs` su rankex-dev con Admin SDK; tabella "Audit log" aggiornata in `CLAUDE.md` e
   `docs/ARCHITECTURE-NOTES.md`. **Review high** (dati sanitari).
3. **Sola lettura per `staff_readonly`** (action item 1 del #16). BUG-022 -> **DUPLICATE di BUG-007**; BUG-007
   (calendario: "+" della testata, "+" delle celle, click su area vuota, azioni di `SlotPopup`) e BUG-024 (gruppi).
   Prima il **censimento con grep** di `PAGES`/`ORG_PAGES` e delle sotto-viste con azioni di scrittura senza
   `useReadonly`/`ReadonlyGuard`, **mostrato all'utente, che decide voce per voce cosa entra**; il resto va in
   TECH-DEBT. Decisioni: click su slot esistente in readonly = dettaglio in sola lettura (senza CHIUDI/SALTA/
   Elimina/modifica); pagina Ricorrenze visibile in sola lettura.
   *Fatto quando:* BUG-007 e BUG-024 VERIFIED con `staff_readonly` a desktop e 360 px in PT/Soccer/Lipedema;
   caso `qa:dev` in `roles.spec.js` che verifica 0 azioni di scrittura su calendario e gruppi e **fallisce
   rimettendo un bottone visibile**; caso runbook (id successivo a TP-083, cioe' TP-084). **Review medium.**
4. **Verifiche rimaste del #16.** (a) Stampa PDF paziente da Firefox: `npx playwright install firefox`,
   verifica una tantum con script usa e getta, `qa:dev` resta chromium. (b) Etichetta "Professionista/
   Professionisti" nei PDF gruppo e paziente con 1 e 2 esaminatori. (c) Banner RICARICA: `deploy:app:dev`
   dedicato, solo nuovo build, con una pagina aperta, **mai durante `qa:dev`**.
   *Fatto quando:* ogni voce VERIFIED o con un BUG aperto.
5. **Solo se resta capacita': TD-013** — 6 `.rx-btn-primary` -> `Button` (`ClientsPage` x2, `GroupsPage`,
   `WorkoutPlanForm` CREA SCHEDA, `AvatarPicker`, `MisureSection`) + test Vitest sul cursore del `Button`
   disabilitato. Decisione: la classe `.rx-btn-primary` resta in `index.css`, `Button` senza `type` di default
   (invariato). Se non entra, candidato #18.
   *Fatto quando:* `grep -rn "rx-btn-primary" src` senza usi fuori dalla definizione CSS, contrasto minimo
   >= 5,29:1 verificato dal test, TD-013 RESOLVED, test sul `cursor` del `Button` disabilitato presente.
+ **Regola di processo:** "non deployare l'hosting mentre gira `npm run qa:dev`" nella sezione QA di
  `CLAUDE.md` (richiesta dall'action item 3 del #16).

**Fuori dal #17:** STORY-044 (da ridisegnare sul canvas), STORY-029 (b)/(c) (DPA e testo informativa, utente/
legale), STORY-026 (retention, decisione utente), merge e deploy prod (#18), stampa su carta, canvas.

**Casi limite da tracciare per ogni voce (coperti in sviluppo e QA):**
- Moduli: PT/GYM/Soccer/Lipedema (badge e misure scrivibili fuori da lipedema).
- Paziente lipedema con e senza `privacyNotice`.
- Ruoli: `staff_readonly` vs `trainer` vs `org_admin`.
- Chiamata diretta alla callable (non solo via UI): le callable restano il limite di sicurezza.
- Temi non predefiniti; stato disabilitato e in caricamento; 360 px; liste vuote (0 gruppi, 0 slot).

**Dipendenze bloccanti segnalate:**
- Voce 1: modifica di `firestore.rules` (file a rischio) + deploy `rules:dev`; ADR-020 PRIMA del developer
  (non partire senza analisi del tech-lead). Rules di prod indietro fino al #18.
- Voce 2: modifica alle callable -> `deploy:dev` functions (manuale, da `functions/`); functions di prod
  indietro fino al #18. Va dopo la voce 1 per non mescolare due deploy su rankex-dev.
- Voce 3: il censimento deve essere approvato dall'utente prima del codice; il caso `qa:dev` richiede il
  seed (`qa:dev:seed`) e l'hosting dev aggiornato.
- Voce 4: Firefox installato; (c) richiede un deploy a pagina aperta, quindi **in coda** e mai in parallelo a
  `qa:dev`. Ordine di deploy hosting consigliato: dopo 3, prima del giro `qa:dev` finale.
- Lavoro emerso fuori da questo elenco va in `docs/BACKLOG.md` per il #18, non nel #17.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| 1a. ADR-020 (tech-lead) | DONE | `68e6e33`, opzione (a). |
| 1b. Rules + test rules + UI misure disabilitata in lipedema senza informativa | DONE | `04a676c`. Test rules 129/129, 9 nuovi falliscono con le rules precedenti. Review high. |
| 1c. Deploy `rules:dev` + verifica dal vivo BUG-003; TD-005/TD-006 | DONE | Scrittura diretta (client SDK) come `qadev.<modulo>.trainer`; BUG-003 VERIFIED, TD-005/006 RESOLVED. Runbook TP-084. |
| 2a. Callable `creaCliente`/`eliminaCliente` scrivono l'audit; tolte le scritture client | DONE | Capability `hasClientNameInAudit` nelle due copie + parity. `224d1bb`. |
| 2b. Unit test functions + `deploy:dev` functions + verifica `audit_logs` | DONE | functions 222/222; lipedema 1+1 senza nome, PT 1+1 con `clientName`. TD-009 RESOLVED. |
| 2c. Tabella Audit log in CLAUDE.md e ARCHITECTURE-NOTES.md | DONE | Commit docs `c2b08e7`/`c640e76`. |
| 3a. Censimento grep (readonly) | DONE | Approvato 11/11. |
| 3b. BUG-022 -> DUPLICATE di BUG-007; fix calendario + gruppi + ricorrenze | DONE | `1ad3f02`. |
| 3c. Caso `qa:dev` in `roles.spec.js` + prova negativa + runbook TP-085 | DONE | 9 nuovi casi; con sessione trainer il caso staff fallisce (atteso 0, trovati 9). |
| 3d. VERIFIED dal vivo, staff_readonly, 1280 e 360 px, PT/Soccer/Lipedema | DONE | BUG-007 e BUG-024 VERIFIED (`86d6a37`). |
| 4a. Firefox + stampa PDF paziente | DONE (parziale) | Layout di stampa VERIFIED; paginazione reale non verificabile con Playwright (`page.pdf` solo Chromium). |
| 4b. "Professionista/i" nei PDF (1 e 2 esaminatori) | DONE | PDF paziente VERIFIED; PDF gruppo senza etichetta esaminatori: non applicabile. |
| 4c. Banner RICARICA | DONE | Comparso dopo 295 s sul deploy reale di `1ad3f02`, sparito dopo RICARICA. |
| 5. TD-013 + test Vitest sul cursore del `Button` disabilitato | DONE | `511bfe0`. TD-013 RESOLVED, unit 637/637. Runbook TP-086. |
| Regola "no deploy hosting durante `qa:dev`" in CLAUDE.md | DONE | `3f6bebc` (+ nota deploy functions con ipv4first). |
| `npm run qa:dev` finale + unit + lint + build | DONE | qa:dev 30/30, unit 637/637. |
| STORY-044 / STORY-029 (b)(c) / STORY-026 | fuori sprint | Canvas / utente-legale / decisione utente. |

**Verifica prevista degli action item della retrospettiva #16 (a fine #17):**
1. Audit readonly per ruolo — **voce 3.** Fatto quando: BUG-022/BUG-007 e BUG-024 VERIFIED con
   `staff_readonly` a 1280 e 360 px; elenco pagine censite ed esito nel commit; caso `qa:dev` con
   `qadev.<modulo>.staff_readonly` verifica 0 bottoni di creazione su calendario e gruppi; riga in TECH-DEBT
   per il resto.
2. Misurare prima di decidere sul layout mobile — **trasversale, voci 1 (messaggio misure disabilitate) e 3
   (dettaglio slot in sola lettura, calendario a 360 px).** Fatto quando: ogni decisione di layout a 360 px
   porta in apertura il calcolo in px (misurato con Playwright), 0 decisioni riviste dopo l'implementazione,
   0 giri di review per asserzioni sul meccanismo (i test di layout asseriscono l'esito osservabile).
3. Regola deploy/`qa:dev` e test sul cursore — **regola di processo + voce 5.** Fatto quando: la regola e'
   in CLAUDE.md, esiste un test Vitest sul `cursor` del `Button` disabilitato, `qa:dev` del #17 senza giri
   rossi per deploy concorrente.
4. Prerequisiti delle verifiche in apertura — **voce 4.** Fatto quando: Firefox installato in apertura, ogni
   voce (Firefox, "Professionista/i", RICARICA) VERIFIED o con BUG aperto, "Non completato" del #17 con al
   piu' la stampa su carta.
5. TD-013 — **voce 5 (condizionata alla capacita').** Fatto quando: `grep -rn "rx-btn-primary" src` senza
   usi fuori dalla definizione CSS, contrasto >= 5,29:1, TD-013 RESOLVED; altrimenti candidato #18 dichiarato.

**Rischi:** la voce 3 e' la piu' larga (censimento aperto): il perimetro lo fissa l'utente sul censimento,
il resto va in TECH-DEBT. Le voci 1 e 2 toccano rules e functions: review high obbligatoria e nessun deploy
in prod. Principio: finire > iniziare; la voce 5 parte solo con 1-4 chiuse.


## Goal
EPIC-010 Lipedema verso il go-live: chiudere i dati del modulo (badge e misure), la coerenza dell'audit, la
sola lettura per `staff_readonly` e le verifiche rimaste. **Raggiunto**, 5 voci su 5.

## Completato
- **Voce 1** (`68e6e33` ADR-020, `04a676c` rules): rules deployate su rankex-dev. Dal vivo come
  `qadev.<modulo>.trainer`: lipedema `badges.*`/`badgeShowcase` permission-denied, `peso` con informativa
  accettato e senza permission-denied; PT e Soccer accettati; dati ripristinati. UI: input e AGGIORNA
  disabilitati con banner REGISTRA INFORMATIVA (1280 e 360; staff vede il banner senza form). BUG-003
  VERIFIED, TD-005/TD-006 RESOLVED. TP-084.
- **Voce 2** (`224d1bb`): audit creazione/cancellazione solo dalle callable, `hasClientNameInAudit`
  (lipedema senza nome); functions 222/222, `deploy:dev` OK; verifica su `audit_logs` rankex-dev. TD-009 RESOLVED.
- **Voce 3** (`1ad3f02`): calendario, gruppi, ricorrenze in sola lettura (anche banner "sessioni passate non
  chiuse" nascosto); QA dal vivo a 1280 e 360 px nei 3 moduli: 0 azioni di scrittura. `qa:dev` 30/30 con
  prova negativa. BUG-007 e BUG-024 VERIFIED, BUG-022 DUPLICATE. TP-085.
- **Voce 4:** layout di stampa Firefox 157 VERIFIED; etichetta esaminatori VERIFIED nel PDF paziente (1 e 2);
  banner RICARICA VERIFIED (295 s, polling 5 min).
- **Voce 5** (`511bfe0`): 6 bottoni migrati a `Button`, test sul cursore; dal vivo su rankex/violet/carbon a
  1280/360 px. TD-013 RESOLVED. TP-086.
- **Regola di processo** (`3f6bebc`) in CLAUDE.md.
- **Deploy:** rankex-dev hosting a `511bfe0`, rules a `04a676c`, functions a `224d1bb`. Mai su
  fitquest-60a09. Nessun dato manuale residuo in `demo-lipedema` (tutto `E2E-` o ripristinato).

## Verificato dal vivo / non verificato
- **Verificato dal vivo:** BUG-003, TD-009 (`audit_logs`), BUG-007/024, layout stampa Firefox, etichetta
  esaminatori, banner RICARICA, TD-013.
- **Non verificato:** paginazione reale del PDF in Firefox; GYM (nessuna org QA); TP-084/085/086 non eseguiti
  come runbook formale (coperti dalle verifiche sopra); popup slot e dettaglio gruppo non coperti da `qa:dev`
  (le org `qa-*` non hanno slot/gruppi).

## Non completato (motivo)
- **Stampa su carta / paginazione PDF in Firefox:** non automatizzabile (`page.pdf` solo Chromium), resta
  all'utente.
- **STORY-044** (canvas prima), **STORY-029 (b)/(c)** (DPA e testo informativa, utente/legale),
  **STORY-026** (retention, decisione utente): fuori sprint.

## Blockers
- Nessuno tecnico. Prod (`fitquest-60a09`) resta indietro su rules (ADR-020), functions (TD-009) e hosting
  fino al rilascio. Attenzione: `deploy.yml` deploya le rules prod a ogni merge su `main`.
- Il deploy delle functions richiede `NODE_OPTIONS=--dns-result-order=ipv4first` (senza: "Failed to list
  functions").

## Tech debt emerso
- Script `deploy`/`deploy:dev` di `functions/` senza `cross-env`/ipv4first.
- `qa:dev` non copre popup slot e dettaglio gruppo (seed senza slot/gruppi).
- L'elenco esaminatori del PDF paziente usa l'ultima valutazione per test (coerente con la tabella; nota,
  non un bug).

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **Rilascio:** merge su dev/main, deploy prod di rules + functions + hosting, release-manager, CHANGELOG.
2. STORY-044 (da ridisegnare sul canvas); requisiti non-codice STORY-029 (b)/(c) e STORY-026 (utente).
3. Seed `qa:dev` con slot e gruppo per coprire popup e dettaglio in `roles.spec`.
4. Script functions con `cross-env`/ipv4first.
5. Stampa su carta (utente).

## Retrospettiva
Dati: 12 commit (`f5ab223`..`c76ae4c`: 2 apertura/chiusura docs, 3 fix (rules, audit, readonly), 1 refactor
(TD-013), 1 ADR, 5 docs di esito/regola); 5 voci su 5 DONE; 0 bug nuovi; BUG-003, BUG-007, BUG-024 VERIFIED,
BUG-022 DUPLICATE; TD-005/006/009/013 RESOLVED; 3 nuovi debiti minori; `qa:dev` 30/30; unit 637/637, functions
222/222, rules 129/129. Rework: 2 correzioni da review prima del commit (audit fire-and-forget, banner staff).

**Verifica degli action item del #16**
1. Audit readonly per ruolo: **fatto**. `1ad3f02`: censimento approvato l'11/11, BUG-007/024 VERIFIED a 1280 e
   360 px in 3 moduli (`86d6a37`), 9 casi `roles.spec.js` con prova negativa (trainer: atteso 0, trovati 9),
   TP-085. Limite: popup slot e dettaglio gruppo non coperti (org `qa-*` senza slot/gruppi). GYM non verificato.
2. Misurare prima del layout mobile: **parziale**. 0 rework di layout registrati nel #17 e test sull'esito,
   ma il calcolo in px in apertura non e' documentato in SPRINT.md: non dimostrabile, solo assenza di danni.
3. Regola deploy/`qa:dev` + test cursore: **fatto**. `3f6bebc` in CLAUDE.md, test sul cursore in `511bfe0`,
   `qa:dev` 30/30 senza giri rossi.
4. Prerequisiti in apertura: **parziale**. Firefox, "Professionista/i" e RICARICA tutti VERIFIED (295 s). Ma
   la spec Firefox non e' stata aggiunta (script usa e getta); la paginazione PDF resta non verificabile
   (`page.pdf` solo Chromium, previsto 80-100 MB, scaricati 124 MB). "Non completato" = carta + paginazione.
5. TD-013: **fatto**. `511bfe0`, 6 bottoni su `Button`, TD-013 RESOLVED, TP-086.

**WHAT WENT WELL**
- 5 voci su 5 con "fatto quando" misurabile; ADR-020 prima del codice delle rules (9 test falliscono senza la
  modifica). Causa: azioni del #16 scritte come comandi di verifica.
- Le review high/medium hanno intercettato 2 difetti reali prima del commit. Causa: livello di review per
  rischio (rules, dati sanitari).
- Verifica dal vivo con scrittura diretta (client SDK) e `audit_logs` via Admin SDK: prova il limite di
  sicurezza, non la UI. Tutti i dati di test `E2E-` o ripristinati.

**WHAT WENT WRONG / CAUSED BUGS**
- Audit fire-and-forget in `creaCliente`/`eliminaCliente` (persi se l'istanza si ferma dopo il return).
  ROOT CAUSE: pattern di `auditLog` client (non attesa) copiato nelle callable, dove il contesto di
  esecuzione termina al return. IMPACT: perdita silenziosa di audit di dati sanitari, bloccata in review.
  ACTION: azione 2.
- Banner "sessioni passate non chiuse" visibile allo staff. ROOT CAUSE: lo stesso difetto di BUG-007 (azione
  senza gate readonly) in un punto non nel censimento; il censimento e' per pagina, non per testo d'azione.
  IMPACT: 1 giro di review. ACTION: azione 3.
- Voce 4(b) mal formulata: il PDF gruppo non ha etichetta esaminatori; la prima prova con due valutazioni
  dello stesso test mostrava 1 esaminatore (corretto: ultima per test). ROOT CAUSE: scope scritto senza
  leggere il codice del PDF. IMPACT: prova ripetuta. ACTION: azione 5 (scope verificato col codice).

**WHAT WAS SLOW**
- `deploy:dev` functions fallito 2 volte ("Failed to list functions", "Failed to make request"). ROOT CAUSE:
  gli script di `functions/` non usano `cross-env`/ipv4first come la root (DNS IPv6 su Windows). IMPACT: 2
  tentativi persi, workaround solo in CLAUDE.md. ACTION: azione 1.
- Banner RICARICA: 295 s di attesa del polling, inevitabile. GateGuard (hook locale) ha chiesto conferma a
  ogni primo Write/Edit/Bash: overhead di sessione, nessuna azione (ambiente).

**WHAT CAUSED REWORK**
- Vedi sopra: audit awaited prima del commit, banner staff nascosto prima del commit, prova "Professionisti"
  rifatta con test diversi. Nessun rework di layout (azione 2 del #16 non smentita).

**WHAT CREATED TECHNICAL DEBT**
- Script `deploy` di `functions/` senza ipv4first. ROOT CAUSE: workaround documentato invece che corretto.
  ACTION: azione 1.
- `qa:dev` senza slot/gruppi: popup slot e dettaglio gruppo in readonly senza copertura automatica. ROOT
  CAUSE: seed minimale (un cliente) e dati creati a mano in script usa e getta. ACTION: azione 3.
- Debito di processo: rules e functions di prod indietro e `deploy.yml` deploya le rules prod a ogni merge su
  `main`; le functions no. ACTION: azione 4.

**ACTION ITEM per lo Sprint #18** (max 5)
1. Correggere gli script `deploy`/`deploy:dev` di `functions/` con `cross-env NODE_OPTIONS=--dns-result-order=ipv4first`
   (come la root). Fatto quando: `cd functions && npm run deploy:dev` riesce al primo colpo senza variabile
   manuale e la nota workaround in CLAUDE.md e' rimossa.
2. Regola per le callable: ogni scrittura di audit/side effect va attesa prima del return. Fatto quando:
   `grep -n "auditLog\|logAudit" functions/src/callable` non mostra chiamate senza `await` (o un test
   functions lo asserisce) e la regola e' in CLAUDE.md.
3. Seed `qa:dev` con 1 slot e 1 gruppo `E2E-` (org qa-pt/qa-soccer/qa-lipedema) e casi in `roles.spec.js`:
   popup slot e dettaglio gruppo con `staff_readonly` = 0 azioni di scrittura. Fatto quando: il caso fallisce
   rimettendo CHIUDI visibile e `qa:dev` resta verde; il teardown cancella slot e gruppo.
4. Checklist di rilascio prima del merge su `main`, nel `docs/` del release-manager: diff rules dev/prod,
   functions da deployare, ordine (functions prima, rules via `deploy.yml`, hosting), verifica post-deploy
   su `audit_logs` e rules. Fatto quando: il deploy prod del #18 segue la checklist con 0 passi fuori elenco
   e CHANGELOG aggiornato.
5. Ogni voce di verifica nello scope viene confermata sul codice prima dell'apertura (es. "il PDF gruppo
   ha l'etichetta?") e annotata con file e riga. Fatto quando: 0 voci del #18 finiscono "non applicabile".

---

# SPRINT #16 — EPIC-010 Lipedema Edition, settima ondata (debito UI del #15, stampa PDF automatica, QA residui) — aperto il 2026-11-11, chiuso il 2026-11-11 (goal raggiunto, con 3 verifiche dal vivo non fatte elencate)

**Branch:** `feature/lipedema-module`. Deploy solo su `rankex-dev`, **nessun deploy in prod
(fitquest-60a09)** (DPA non firmato, STORY-029). Commit solo in locale; `lipidemia/` e `mobile-app/`
non si committano. Functions: solo se toccate (previsto: nessun deploy).

**Goal:** EPIC-010 Lipedema — saldare il debito UI del #15 (plurali, bottoni) e chiudere le verifiche
rimaste (stampa PDF automatica, QA residui).

**Riferimento UI:** canvas RankEX (sola lettura, non si tocca).

**Story/voci selezionate, nell'ordine:**
1. **BUG-021 + TD-012 — plurali.** `pluralize`/`countLabel` di `utils/plural.js` in `NotificationsPanel`,
   `NotesSection`, `GroupCard`, `GroupReportPrint`, `PlanProgress`, `AddSlotModal` (bottone CREA e
   testo "ha/hanno raggiunto il massimale"), `MonthView`, `AssessmentFormFields`, `SitToStandForm`,
   `LipedemaReportPrint` ("Professionista/i"). Test 0/1/2 per ogni testo.
   *Fatto quando:* `grep "=== 1 ?"` su `src/` non trova plurali inline, tranne `countLabel` e
   `maxDecimalsMessage` nel CORE di `utils/lipedema.js` (restano); BUG-021 VERIFIED dal vivo.
2. **TD-011 — bottoni a `Button`.** Calendario "+ APPUNTAMENTO" → primary, "+ RICORRENZA" → neutral;
   CREA APPUNTAMENTO (`AddSlotModal`) e CREA RICORRENZA (`RecurrenceModal`) → primary; "+ AGGIUNGI" di
   `MembersPage` → primary; ANNULLA di `WorkoutPlanForm`, `ProfilePage` x2, `DeleteDialog`,
   `recurrenceDetailShared`, `AdminDashboard`, `AdminProfilePage`, `RunbookPage` (ANNULLA/ANNULLA GIRO),
   `GoalsSection` → neutral. `#04140a` in una sola variabile CSS (es. `--rx-primary-text`) usata da
   `index.css`, `Button` e `themes.contrast.test.js`.
   **Prima del codice:** censimento con grep di tutti i `<button>` che imitano un primario o un ANNULLA,
   **mostrato all'utente**.
   *Fatto quando:* `#04140a` in un solo punto, un primario pieno per schermata del calendario, contrasto
   minimo ancora >= 5,29:1.
3. **Test Playwright di stampa del PDF paziente** in `qa:dev` (`emulateMedia` print, `page.pdf`): 2 pagine,
   margine sulla seconda, BIA non spezzata. Crea il proprio paziente `E2E-...` e lo pulisce nel teardown.
   *Fatto quando:* fallisce rimettendo `@page { margin: 0 }` e passa su rankex-dev.
4. **Giro QA sui residui** (time-box mezza giornata): primario su almeno 2 temi non predefiniti; area admin
   (`rankex-admin-dev`) e `staff_readonly` dopo STORY-043; stampa da Firefox; punti 1 e 2 a desktop e 360 px.
   *Fatto quando:* ogni voce VERIFIED o con un BUG aperto.
5. **Etichetta tagliata dell'asse X del trend.** Prima la voce in `docs/BUGS.md`, poi la correzione;
   VERIFIED a 360 px e desktop. Poi cancellazione del paziente "E2E-PDF Sprint15" (`demo-lipedema`, solo
   rankex-dev, Admin SDK).

**Fuori dal #16:** STORY-044 (BACKLOG, da ridisegnare prima sul canvas), STORY-029 (BLOCKED, DPA/
informativa, utente/legale), stampa su carta, deploy in prod, canvas.

**Decisioni dell'utente (11/11/2026):**
- **D1:** `countLabel` nel CORE di `utils/lipedema.js` (tratta -1 come plurale, diverso da
  `utils/plural.js`) resta com'e: nel CORE i conteggi non sono negativi; nessun deploy functions, nessuna
  modifica al CORE (quindi nessun test di parita nuovo). Differenza da annotare come nota, eventualmente in
  TECH-DEBT se non c'e gia (nota di sprint: da fare nel commit dei plurali).
- **D2:** concordanza verbo/aggettivo con `pluralize` separato ("1 paziente ha / 2 pazienti hanno",
  "1 non letta / 2 non lette"); nessuna regola nuova in `utils/plural.js`.
- **D3:** ANNULLA senza bordo (`RunbookPage`, `GoalsSection`) → `Button` neutral (compare il bordo);
  nessuna variante "text".
- **D4:** calendario a 360 px: "+ APPUNTAMENTO" mostra solo "+" sotto il breakpoint `sm` (l'aria-label
  resta col testo completo); la testata non va a capo.
- **D5:** `MonthView` con 0 clienti: nessuna etichetta.
- **D6:** disabilitato di CREA APPUNTAMENTO/RICORRENZA da opacita 0,4 a 0,5 come gli altri `Button`
  (STORY-043).
- **D7:** paziente "E2E-PDF Sprint15" da cancellare a fine sprint (solo rankex-dev, Admin SDK); il test
  di stampa non ci si appoggia.

**Casi limite per le story UI (da coprire in sviluppo e QA):** conteggio 0/1/2 e negativo dove possibile;
terminologia PT/GYM/Soccer/Lipedema (cliente/membro/allievo/paziente); temi non predefiniti; `staff_readonly`
(bottoni nascosti da `ReadonlyGuard`); stato disabilitato e in caricamento; 360 px.

**Vincoli:** mai deploy su fitquest-60a09; ogni nuovo comportamento UI non coperto da unit test va nel
runbook (`config/runbook.config.js`); se si tocca il CORE lipedema, test di parita (previsto: non si tocca).

**Status board:**

| Task | Status | Note |
|------|--------|------|
| 1. BUG-021 + TD-012 — plurali | DONE | Test 0/1/2 per ogni testo; grep `=== 1 ?` come criterio di fatto; BUG-021 VERIFIED dal vivo. |
| 2a. TD-011 — censimento `<button>` (grep) | DONE | Da mostrare all'utente PRIMA del codice. |
| 2b. TD-011 — migrazione a `Button` + variabile CSS `#04140a` | DONE | Dopo l'approvazione del censimento (2a). |
| 3. Test Playwright di stampa PDF paziente | DONE | `qa:dev`; paziente `E2E-...` proprio, teardown; deve fallire con `@page { margin: 0 }`. |
| 4. Giro QA residui | DONE (parziale) | Dopo 1, 2, 5 (deploy su rankex-dev); max mezza giornata. |
| 5a. Voce BUG asse X del trend in BUGS.md | DONE | Prima della correzione. |
| 5b. Correzione etichetta asse X + VERIFIED 360 px/desktop | DONE | |
| 5c. Cancellazione "E2E-PDF Sprint15" (rankex-dev) | DONE | A fine sprint, Admin SDK, guardia sul projectId. |
| Review medium | APPROVED | Dopo 1-2 e 5b. |
| Deploy rankex-dev + `npm run qa:dev` | DONE | Hosting solo; functions non toccate. |
| STORY-029 | BLOCKED (fuori sprint) | Utente/legale. |
| STORY-044 | BACKLOG (fuori sprint) | Prima il canvas. |

**Action item della retrospettiva #15 — da verificare a fine #16:**
1. BUG-021 + TD-012: `pluralize`/`countLabel` negli altri 9 file e in `AddSlotModal`. Fatto quando:
   `grep -rn "=== 1 ?" src` senza plurali inline (eccezioni elencate nel commit), test 0/1/2 per ogni
   testo, BUG-021 VERIFIED dal vivo.
2. TD-011: calendario, ANNULLA di `WorkoutPlanForm`/`RunbookPage`/`GoalsSection`, "+ AGGIUNGI" di
   `MembersPage` a `Button`, variabile CSS unica per `#04140a`. Fatto quando: `#04140a` in 1 solo punto, un
   primario pieno per schermata del calendario, contrasto minimo 5,29:1.
3. Test del layout di stampa del PDF paziente (Playwright). Fatto quando: fallisce con `@page { margin: 0 }`
   e passa in `qa:dev`.
4. Giro QA sui residui (temi non predefiniti, admin, staff_readonly, Firefox). Fatto quando: ogni voce
   VERIFIED o con BUG aperto, e il "Non completato" elenca solo la stampa su carta.
5. Dati e cosmetici pendenti: "E2E-PDF Sprint15" cancellato (Admin SDK, solo rankex-dev) e asse X del trend
   con voce in BUGS.md, VERIFIED a 360 px e desktop.

**Rischi/dipendenze segnalate:** la voce 2b non parte senza l'approvazione del censimento; la 4 dipende dal
deploy su rankex-dev di 1, 2 e 5b; la 3 richiede il service account di `qa:dev` (`.env.test`). Qualsiasi
lavoro emerso fuori da questo elenco va in `docs/BACKLOG.md` per il #17, non nel #16.

---

## Goal
EPIC-010 Lipedema: saldare il debito UI del #15 (plurali, bottoni) e chiudere le verifiche rimaste
(stampa PDF automatica, QA residui). **Raggiunto**; restano 3 verifiche dal vivo non fatte (sotto).

## Completato
- **Plurali** (`06f95cb`): `utils/pluralLabels.js`, `pluralize`/`countLabel` in 10 componenti, test
  0/1/2/-1 per modulo, runbook TP-082; review medium APPROVED. BUG-021 e TD-012 chiusi (VERIFIED dal vivo).
- **Bottoni** (`86fa8af`): `Button` per calendario, CREA, "+ AGGIUNGI" e gli ANNULLA; `--rx-primary-text`
  unico punto di `#04140a`, contrasto minimo 5,29:1 invariato; RICARICA di `App.jsx` migrato (decisione
  utente); runbook TP-083. TD-011 chiuso. Testata calendario a 360 px (`87fa8db`, D4 rivista due volte).
- **Test di stampa del PDF paziente** (`fb9e9f8`): `lipedemaPrint.spec.js` + `pdfInspect.js` in `qa:dev`,
  2 pagine A4, margine `@page` misurato sul clip, BIA su una sola pagina. Prove negative:
  `QA_PRINT_INJECT_MARGIN_0=1` fallisce ("pagina 1: margine alto, received 0"),
  `QA_PRINT_INJECT_BIA_BREAK=1` fallisce (BIA su pagine [1,2]). `npm run qa:dev` finale 21/21.
- **BUG-023** (`103ac3b`): `X_AXIS_PADDING` 28 px, VERIFIED a 360 e 1280 px (2MWT e Handgrip).
  Paziente "E2E-PDF Sprint15" cancellato da `demo-lipedema` (rankex-dev, Admin SDK, residui 0, clientCount 4).
- **BUG-025** (`670313c`): cursore not-allowed sui `Button` disabilitati, VERIFIED. Esiti QA registrati.
- **Giro QA dal vivo** (desktop 1280 e 360 px, PT/Soccer/Lipedema), VERIFIED: plurali, bottoni, primario
  su Mint/Carbon/Violet (testo `rgb(4,20,10)`), admin `rankex-admin-dev` senza errori console/CSP,
  `staff_readonly` sulla scheda paziente.
- **Decisioni dell'utente (11/11) durante lo sprint:** censimento bottoni approvato; i 6 `.rx-btn-primary`
  restano (TD-013); RICARICA a `Button` primary; D4 rivista: la testata su una riga con titolo troncato
  dava "9 n..." (misurato dal vivo), sotto `sm` titolo su riga sua e controlli sulla riga sotto. Review
  voce 2: font dei "+" a 10 px da `sm`.
- **Deploy:** solo rankex-dev (hosting), functions non toccate, niente prod. Unit test 634/634, lint e
  build verdi.

## Non completato (motivo)
- **Stampa da Firefox:** Playwright firefox non installato sulla macchina.
- **Banner RICARICA:** per vederlo serve un deploy a pagina aperta, non eseguito.
- **Etichetta "Professionista/Professionisti" nei PDF gruppo e paziente:** non verificata dal vivo.
- **Stampa su carta:** resta all'utente (fuori perimetro).
- **STORY-044** (BACKLOG, prima il canvas) e **STORY-029** (BLOCKED, DPA/informativa): fuori sprint.

## Blockers
- Nessuno tecnico. STORY-029 blocca il go-live di EPIC-010, non lo sprint.
- Un giro `qa:dev` rosso transitorio (20/21) causato da un deploy dell'hosting durante l'esecuzione
  (chunk lazy sparito): non regressione. Lezione: non deployare mentre gira `qa:dev`.

## Tech debt emerso
- **TD-013** — 6 `.rx-btn-primary` non migrati a `Button` (esclusi per decisione utente).
- **BUG-022** (P3, OPEN) — staff_readonly vede i "+" del calendario (preesistente).
- **BUG-024** (P3, OPEN) — staff_readonly crea gruppi dall'UI (il server rifiuta). Stessa causa di
  BUG-022: pagine trainer senza `useReadonly`; valutare un audit readonly.

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **Audit readonly** — BUG-022 + BUG-024 (pagine trainer senza `useReadonly`/`ReadonlyGuard`).
2. **TD-013** — migrazione dei 6 `.rx-btn-primary` a `Button`, poi valutare la classe.
3. **Stampa da Firefox** e verifica "Professionista/i" nei PDF (richiede browser installato).
4. **STORY-044** (canvas prima) e **STORY-029** (BLOCKED, utente/legale).

## Retrospettiva
Dati: 6 commit (`7dfe998`..`4557f6a`: 1 apertura docs, 1 fix plurali, 1 refactor bottoni, 2 fix UI
(testata calendario, asse X), 1 test di stampa, 1 fix BUG-025 + esiti QA, 1 chiusura docs); 5 voci su 5
DONE; 1 rework di decisione (D4 rivista 2 volte); bug nuovi BUG-022/024/025 (P3, aperti 022 e 024),
BUG-021 e BUG-023 chiusi; TD-011/012 chiusi, TD-013 nuovo; `qa:dev` 21/21; unit test 634/634.

**Verifica degli action item del #15**
1. BUG-021 + TD-012: **fatto**. `06f95cb`: `pluralize`/`countLabel` in 10 componenti, 110 righe di test
   0/1/2/-1 (`pluralLabels.test.js`). Misura: `grep "=== 1 ?" src` restituisce solo le 2 eccezioni
   dichiarate (D1) in `utils/lipedema.js`, oltre a due `i === 1` nei test; BUG-021 VERIFIED dal vivo.
   Il difetto non e' tornato in questo sprint (0 nuovi bug di plurale).
2. TD-011: **fatto**. `86fa8af`: `#04140a` compare solo in `src/index.css:31` (`--rx-primary-text`),
   contrasto minimo 5,29:1 invariato. Il "+ AGGIUNGI", gli ANNULLA e il calendario sono su `Button`.
   Residuo noto e dichiarato: 6 `.rx-btn-primary` (TD-013, esclusi per decisione dell'utente).
   Fuori elenco: RICARICA di `App.jsx` migrato.
3. Test di stampa PDF: **fatto**. `fb9e9f8`: `lipedemaPrint.spec.js` + `pdfInspect.js`; fallisce con
   `QA_PRINT_INJECT_MARGIN_0=1` e con `QA_PRINT_INJECT_BIA_BREAK=1`, passa in `qa:dev` (21/21). La
   misura richiesta e' piu' che soddisfatta (due prove negative).
4. Giro QA sui residui: **parziale**. VERIFIED: temi Mint/Carbon/Violet, admin, staff_readonly (che ha
   trovato BUG-022/024), plurali e bottoni a 1280/360 px. Misura "il Non completato elenca solo la
   carta": non raggiunta, restano Firefox (non installato), banner RICARICA, "Professionista/i" nei PDF.
5. Dati e cosmetici: **fatto**. BUG-023 `103ac3b` VERIFIED a 360 e 1280 px; "E2E-PDF Sprint15"
   cancellato (residui 0, clientCount 4).

**WHAT WENT WELL**
- 5 voci su 5 chiuse, con "fatto quando" misurabili dal primo giorno. Causa: azioni del #15 scritte con
  grep o comando di verifica; il #16 le ha riusate come criterio.
- Il test di stampa e' stato validato con prove negative (iniezione del difetto): prova che il test
  vede il bug, non solo che passa. Causa: "fallisce rimettendo `@page { margin: 0 }`" come criterio.
- Il censimento dei bottoni mostrato prima del codice ha portato 1 solo commit per TD-011 e ha isolato
  TD-013 come decisione esplicita invece di debito silenzioso.
- La QA dal vivo con 3 ruoli ha trovato 3 bug reali (022, 024, 025) che il codice non mostrava.

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-022 (calendario) e BUG-024 (gruppi), staff_readonly vede azioni che il server rifiuta. ROOT CAUSE:
  le pagine trainer non usano `useReadonly`/`ReadonlyGuard`; la protezione e' solo in rules e callable,
  l'UI non e' mai stata censita per ruolo. IMPACT: 2 bug in una sola QA, dati integri ma UX falsa;
  non ancora esaustivo (altre pagine non controllate). ACTION: azione 1.
- BUG-025 (cursore sui `Button` disabilitati): difetto del componente condiviso da STORY-043, emerso
  solo nella QA dal vivo di TD-011. ROOT CAUSE: il disabilitato e' testato per colore/opacita' ma non
  per cursore (CSS non coperto da unit test e il caso non era nei casi limite di STORY-043). IMPACT:
  trovato un sprint dopo l'introduzione. ACTION: azione 3.
- Un giro `qa:dev` rosso (20/21): deploy dell'hosting durante la suite, chunk lazy sparito. ROOT CAUSE:
  nessuna regola operativa su deploy e QA in parallelo, stesso account e stesso hosting. IMPACT: un giro
  da rifare, rischio di diagnosticare una regressione inesistente. ACTION: azione 3 (regola nel runbook).
- Verifiche non fatte: Firefox (non installato), banner RICARICA, "Professionista/i" nei PDF. ROOT
  CAUSE: prerequisiti (browser, deploy a pagina aperta) non preparati in apertura, stesso schema del #14
  e #15. IMPACT: 3 voci nel Non completato. ACTION: azione 4.

**WHAT CAUSED REWORK**
- D4 (testata calendario su una riga a 360 px) decisa prima di misurare: la review l'ha stimata
  insufficiente, poi la misura dal vivo ("9 n...") l'ha rivista una seconda volta; 2 revisioni della
  decisione e il commit `87fa8db` sulla terza versione. ROOT CAUSE: decisione di layout mobile chiesta
  con una stima a occhio, non con larghezze in px. IMPACT: 2 giri di decisione e codice. ACTION: azione 2.
- Il test di stampa ha richiesto 2 giri di review per avere l'asserzione BIA sul risultato (pagine su
  cui compare) e non sul meccanismo (la regola CSS). ROOT CAUSE: si e' partiti dal meccanismo di
  `break-inside`, non dall'esito osservabile. IMPACT: 1 giro di review. ACTION: azione 2 (criterio
  "asserzione sull'esito" per i test di layout).

**WHAT WAS SLOW**
- L'agente QA si e' interrotto a meta' per limite d'uso ed e' stato ripreso. Non ha perso lavoro perche'
  lo script usava try/finally e il prefisso `E2E-` (stato recuperabile: piano free, dati ripuliti).
  Da mantenere come pratica; il rischio e' la QA lunga in un solo giro. ACTION: azione 4 (time-box e
  QA a blocchi).
- Le 3 verifiche mancanti hanno richiesto un prerequisito non previsto (browser, deploy a pagina aperta).

**WHAT CREATED TECHNICAL DEBT**
- TD-013: 6 `.rx-btn-primary` non migrati (scelta consapevole, con motivo scritto); la classe resta
  accanto a `Button`. ROOT CAUSE: perimetro della migrazione deciso per elenco. ACTION: candidato #17,
  non tra le 5 azioni (basso impatto, nessun bug).
- Audit readonly assente: BUG-022/024 sono sintomi di un debito non registrato in TECH-DEBT.md (nessuna
  regola per cui una pagina trainer deve usare `useReadonly`). ACTION: azione 1.

**ACTION ITEM per lo Sprint #17** (max 5)
1. Audit readonly per ruolo: censire con grep le pagine di `PAGES` (`trainer.config.jsx`) e le viste
   di `OrgAdminView` che hanno azioni di scrittura ma non importano `useReadonly`/`ReadonlyGuard`;
   correggere almeno calendario (BUG-022) e gruppi (BUG-024), aggiungere una riga a TECH-DEBT.md per
   il resto. Fatto quando: BUG-022 e BUG-024 VERIFIED con `staff_readonly` dal vivo a 1280 e 360 px, l'elenco
   delle pagine censite e dell'esito e' nel commit, e un caso `qa:dev` con `qadev.<modulo>.staff_readonly`
   verifica 0 bottoni di creazione su calendario e gruppi.
2. Misurare prima di decidere sul layout mobile: per ogni decisione di layout a 360 px nelle "Decisioni"
   di apertura, allegare il calcolo in px (larghezza disponibile, larghezza delle etichette misurate con
   Playwright) prima di chiedere la scelta all'utente; per i test di layout, asserire sull'esito
   osservabile. Fatto quando: 0 decisioni di layout riviste dopo l'implementazione nel #17 e 0 giri di
   review per asserzioni sul meccanismo.
3. Regola operativa e caso limite per i componenti condivisi: aggiungere in `runbook.config.js` (o in
   un file di processo) "non deployare l'hosting mentre gira `qa:dev`", e per ogni modifica a `Button`/
   `Input`/`Modal` una verifica dei casi di stato (hover, focus, disabilitato, cursore, caricamento)
   con un test sulla proprieta' CSS risolta. Fatto quando: la regola e' scritta, esiste un test per il
   `cursor` del `Button` disabilitato, e `qa:dev` del #17 non ha giri rossi per deploy concorrente.
4. Preparare i prerequisiti delle verifiche in apertura, non a fine sprint: installare Firefox per
   Playwright (`npx playwright install firefox`) e aggiungere una spec di stampa su Firefox; verificare
   dal vivo "Professionista/i" nei PDF gruppo e paziente e il banner RICARICA (deploy a pagina aperta,
   fuori da `qa:dev`). Fatto quando: ogni voce VERIFIED o con un BUG aperto e il "Non completato" del
   #17 elenca solo la stampa su carta (se non fatta).
5. Chiudere TD-013: migrare i 6 `.rx-btn-primary` a `Button` (o rimuovere la classe se vuota),
   solo se l'utente conferma l'eccezione del #16. Fatto quando: `grep -rn "rx-btn-primary" src` non
   trova usi fuori dalla definizione CSS (o la classe e' rimossa), contrasto minimo ancora >= 5,29:1
   verificato dal test, TD-013 RESOLVED.

---

# SPRINT #15 — EPIC-010 Lipedema Edition, sesta ondata (bottone principale, verifiche rimaste, debito) — aperto il 2026-11-11, chiuso il 2026-11-11 (goal raggiunto, con residui QA elencati)

**Branch:** `feature/lipedema-module`. Deploy solo su `rankex-dev`, **nessun deploy in prod
del modulo** (DPA non firmato, STORY-029). Commit solo in locale.

**Goal:** il bottone principale è pieno e unico per schermata in tutta l'app, le verifiche
rimaste dal #14 passano a VERIFIED e i plurali passano da un helper unico.

**Riferimento UI:** canvas RankEX, tavole `DesignSystem` e `TemiConfronto` (sola lettura).

**Story e task selezionati, nell'ordine:**
1. **Allineamento canvas** (action item 4): lo fa l'utente in parallelo (decisione 11/11). Il
   developer non tocca il canvas.
2. **Giro QA iniziale** (action item 2) sull'hosting dev attuale (`50f6779`): TP-077, tastiera
   sulle schede dei test, BUG-018, BUG-010, BUG-017, PDF di più pagine.
3. **Helper di plurale generico** (action item 1): `utils/plural.js`, nei 5 file dell'action item.
4. **STORY-043** — bottone principale pieno, variante `secondary` tinta, Mint `#6F86FF`.
5. **Migrazione date org** (action item 5): script idempotente solo rankex-dev + seed corretto.

**Fuori dal #15:** STORY-044 (da ridisegnare sul canvas prima), STORY-029 (BLOCKED, utente/
legale), plurali fuori dai 5 file, etichetta tagliata dell'asse X del trend (cosmetico).

**Decisioni aperte e casi limite (action item 3) — tutte decise dall'utente l'11/11:**

*STORY-043*
- Default di `Button`: diventa `secondary` (la tinta attuale, nessun cambio visivo); il pieno si
  sceglie esplicitamente con `variant="primary"`, uno per schermata. La lista dei primari va
  mostrata all'utente prima del commit.
- Dialog e modal contano come schermata a sé: conferma piena, annulla `neutral`; le conferme
  distruttive restano `danger`/`dangerGhost`.
- Area super_admin: pieno sull'accent rosso `#f87171`, testo `#04140a` (~6,8:1).
- Casi limite: primario disabilitato o in caricamento (resta pieno, opacità 50%); wizard con
  INDIETRO/AVANTI (AVANTI pieno, INDIETRO `neutral`); pagina con dialog aperto (uno per livello);
  classe CSS `.rx-btn-primary` (6 usi) allineata alla stessa regola; contrasto di `#04140a`
  sull'accent dei 7 temi ≥ 4,5:1 (minimo Carbon ~5,3:1, calcolato).

*Giro QA*
- BUG-010: `qa-pt` portata temporaneamente a piano `free` con script Admin SDK solo rankex-dev,
  poi riportata a `pro`. BUG-017 resta non verificabile senza un super_admin.
- PDF multipagina: paziente `E2E-PDF Sprint15` in `demo-lipedema` (fuori dalle org `qa-*`, non
  toccato dal teardown di `qa:dev`), con dati lunghi; resta finché decide l'utente.

*Plurale*
- Solo i 5 file; `countLabel` resta nel CORE lipedema (il file server non importa nulla), nessuna
  modifica alle functions. Casi: 0 → plurale, 1 → singolare, 2 → plurale; delta negativi sul
  valore assoluto.

*Migrazione date*
- Solo `rankex-dev` (guardia sul projectId); la normalizzazione di lettura (`utils/orgDates.js`)
  resta, perché in prod potrebbero esserci dati vecchi.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| Allineamento canvas | DONE (utente, 11/11) | SALTA e "Non salvati in questa visita" sulle tavole `Valutazione*`; trend e PDF su `PazienteTrend`/`MobilePazienteTrend`/`ReportLipedema`. |
| Giro QA iniziale | DONE | 11/11, hosting `50f6779` e poi `2707b21`. VERIFIED: BUG-010 (`qa-lipedema` a free e poi di nuovo pro; "1 presente" in `demo-lipedema`), BUG-017 (super_admin di seed su rankex-admin-dev, prima e dopo la migrazione), BUG-018, TP-077 ("Aggiornamento in corso…" con rete e CPU rallentate: + NUOVA VALUTAZIONE, CORREGGI e ANNULLA disabilitati, schede e grafico attivi; tutto riabilitato a rilettura finita), tastiera sulle schede dei test (frecce, Home/End, giro dall'ultima alla prima). PDF di 2 pagine sul paziente `E2E-PDF Sprint15`: trovato e corretto BUG-020. |
| Helper di plurale | DONE | Commit `eb15aec`, `utils/plural.js` nei 5 file, test 0/1/2/−1/−2. 0 ternari `=== 1 ?` nei 5 file. Fuori perimetro: BUG-021 e TD-012. |
| STORY-043 — bottone principale | DONE | Commit `8ee2510` + `2707b21` (disabilitato al 50%, dalla review). Lista dei primari approvata dall'utente; Gruppi: CREA pieno a form aperto; glow di Mint allineato. Test di contrasto: minimo Carbon 5,29:1. QA dal vivo desktop e 360 px (lista pazienti, form di valutazione, chiusura appuntamento). Residuo: TD-011 (calendario senza primario pieno, bottoni scritti a mano). Runbook TP-080. |
| Migrazione date org | DONE | Commit `de645ee`; `--apply` su rankex-dev: 31 documenti, 15 convertiti, 0 Timestamp rimasti; secondo dry-run 0 da convertire. |
| BUG-020 — PDF multipagina | FIXED + VERIFIED | Commit `3923844`. A4 di 2 pagine corretto; un report con meno dati resta di 1 pagina. Runbook TP-081. |
| Review medium | APPROVED | 0 bloccanti; LOW sul `.rx-btn-primary` disabilitato corretto (`2707b21`), gli altri in TD-011. |
| Deploy rankex-dev | DONE | `npm run deploy:all:dev` dopo `2707b21`; functions non toccate, non ridistribuite. |
| Regressione `npm run qa:dev` | 19/19 | Dopo il deploy. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non lo sprint. |

## Goal
Il bottone principale è pieno e unico per schermata in tutta l'app, le verifiche rimaste dal
#14 passano a VERIFIED e i plurali passano da un helper unico. **Raggiunto** (plurali: solo nei
5 file decisi; gli altri sono in TD-012).

## Completato
- **Helper di plurale** `utils/plural.js` nei 5 file (`eb15aec`), test 0/1/2/−1/−2.
- **Migrazione date org** (`de645ee`): solo rankex-dev, 0 Timestamp rimasti.
- **BUG-020** — interruzioni di pagina del PDF (`3923844`), VERIFIED. Runbook TP-081.
- **STORY-043** — bottone principale pieno, `secondary`, Mint `#6F86FF` (`8ee2510` + `2707b21`).
  Runbook TP-080.
- **Giro QA** VERIFIED dal vivo l'11/11: BUG-010, BUG-017, BUG-018, BUG-020, TP-077, tastiera
  sulle schede dei test, STORY-043 a desktop e 360 px (lista pazienti, form valutazione,
  chiusura appuntamento).
- **Canvas** allineato dall'utente (SALTA, "Non salvati", trend, PDF).
- **Docs** (`b7d9791`, `7a0a5a7`). rankex-dev: hosting a `7a0a5a7`, functions non toccate né
  ridistribuite; `npm run qa:dev` 19/19.

## Non completato (motivo)
- **Verifiche dal vivo non fatte (residui QA):** stampa su carta; stampa da Firefox; primario sui
  temi diversi dal predefinito (coperto solo dal test di contrasto); area admin dopo STORY-043;
  vista staff_readonly dopo STORY-043.
- **BUG-021, TD-011, TD-012:** passano allo Sprint #16 (decisione utente 11/11), non entrano nel #15.
- **STORY-044:** resta BACKLOG, da ridisegnare sul canvas.
- **STORY-029:** BLOCKED (DPA/informativa, a carico utente/legale).

## Blockers
- Nessuno tecnico. STORY-029 (DPA, testo informativa) blocca il go-live di EPIC-010, non lo sprint.
- **Dato di test residuo su rankex-dev:** paziente "E2E-PDF Sprint15" in `demo-lipedema`, in
  attesa di decisione dell'utente (tenerlo o cancellarlo).

## Tech debt emerso
- **TD-011** — bottoni principali scritti a mano fuori da `Button` (calendario senza primario
  pieno, ANNULLA di `WorkoutPlanForm`/`RunbookPage`/`GoalsSection`, "+ AGGIUNGI" di `MembersPage`);
  testo `#04140a` ripetuto in 3 punti, manca un token.
- **TD-012** — plurali inline in 9 file fuori dai 5 dell'helper.
- **BUG-021** (P3) — "CREA APPUNTAMENTO (1 pazienti)" in `AddSlotModal`, stessa famiglia di TD-012.
- Cosmetico non tracciato: etichetta tagliata dell'asse X del trend (dal #14).

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **BUG-021 + TD-012** (P3 / debito) — plurali restanti con `utils/plural.js`.
2. **TD-011** — bottoni fuori da `Button`, primario del calendario, token per il testo del primario.
3. **Residui QA non verificati dal vivo** — primario sui temi non predefiniti, area admin e
   staff_readonly dopo STORY-043, stampa su carta e da Firefox.
4. **Dal backlog EPIC-010:** STORY-044 "Da sistemare" (P3, BACKLOG, prima da ridisegnare sul
   canvas) e STORY-029 (P0, BLOCKED, utente/legale). Nessun'altra story EPIC-010 è READY o aperta.
5. **Dato di test** "E2E-PDF Sprint15": decisione dell'utente.

## Retrospettiva
Dati: 7 commit di lavoro (`7723cb0`…`a777c62`: 1 refactor, 1 chore, 2 feature/fix UI di STORY-043,
1 fix BUG-020, 3 docs/QA), STORY-043 DONE, 0 rework di story (1 fix di review, `2707b21`); bug nuovi
BUG-020 (FIXED + VERIFIED) e BUG-021 (OPEN, P3); debito nuovo TD-011, TD-012; BUG-010/017/018 VERIFIED;
`qa:dev` 19/19.

**Verifica degli action item del #14**
1. Helper di plurale generico: **parziale**. Fatto in `eb15aec` (`utils/plural.js`, test 0/1/2/−1/−2,
   0 ternari `=== 1 ?` nei 5 file), ma solo nei 5 file per scelta dell'utente: altri 9 file sono in
   TD-012 e BUG-021 è emerso proprio da lì. Misura "0 nuovi bug di plurale": non raggiunta.
2. Giro QA iniziale: **fatto, misura parziale**. BUG-010/017/018, TP-077, tastiera e PDF multipagina
   verificati dal vivo l'11/11 (riga "Giro QA" del board). Ma la misura "0 voci non verificato nel
   Non completato" non regge: restano 5 residui (stampa su carta, Firefox, temi non predefiniti, admin
   e staff_readonly dopo STORY-043).
3. Decisioni e casi limite in apertura: **fatto**. Sezione scritta in `7723cb0` prima del codice,
   decisioni dell'utente tutte dell'11/11; 0 decisioni poste a fine sprint. Nessun commit di feature
   dopo la QA di STORY-043 (solo `2707b21` da review e `3923844` per un bug). Il caso limite
   "calendario con bottoni scritti a mano" però non era previsto (TD-011).
4. Canvas come primo task: **fatto** dall'utente l'11/11 (SALTA, "Non salvati", trend, PDF); 0 tavole
   in ritardo.
5. Script date org: **fatto** (`de645ee`): 31 documenti, 15 convertiti, 0 Timestamp rimasti, secondo
   dry-run 0. Normalizzazione di lettura mantenuta di proposito (prod può avere dati vecchi).

**WHAT WENT WELL**
- Decisioni e casi limite scritti prima del codice: STORY-043 in 2 commit, 1 solo fix da review.
  Causa: azione 3 del #14 applicata.
- Il giro QA ha chiuso 3 bug aperti da due sprint e provato dal vivo TP-077. Causa: account di test
  e dati dedicati preparati in apertura (qa-lipedema a free, super_admin di seed).
- La QA dal vivo di STORY-043 a desktop e 360 px e `qa:dev` 19/19 dopo il deploy.

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-020 (PDF multipagina senza margine) trovato solo dalla QA dal vivo. ROOT CAUSE: `@page { margin: 0 }`
  e salti di pagina mai esercitati: i test coprono il modello del report, non il layout di stampa, e
  il PDF di 2 pagine non esisteva come caso. IMPACT: STORY-040 DONE da due sprint con un difetto di
  layout. ACTION: azione 3.
- BUG-021 trovato in QA ma non corretto. ROOT CAUSE: perimetro dei plurali fissato a 5 file per elenco
  e non per grep sull'intero `src/`; il difetto è identico a BUG-010/018/019 (quarta volta). IMPACT:
  bug noto lasciato aperto, 9 file con lo stesso pattern. ACTION: azione 1.

**WHAT CAUSED REWORK**
- `2707b21` (primario disabilitato al 50%) dalla review di `8ee2510`: il caso "primario disabilitato"
  era nei casi limite ma l'implementazione della classe CSS non lo copriva. Rework minimo (1 commit).

**WHAT WAS SLOW**
- Nessun blocco. Cinque verifiche dal vivo restano indietro perché richiedono account, browser o
  hardware non preparati (Firefox, stampante, temi, staff_readonly): stesso schema del #14.

**WHAT CREATED TECHNICAL DEBT**
- TD-011: `Button`/`.rx-btn-primary` introdotti senza censire i `<button>` scritti a mano; il
  calendario resta senza primario pieno e `#04140a` è ripetuto in 3 punti. ROOT CAUSE: lista dei
  primari fatta per schermata, non per grep dei bottoni. ACTION: azione 2.
- TD-012: il limite dei 5 file ha spostato il debito, non lo ha eliminato. ACTION: azione 1.
- Cosmetico non tracciato: etichetta tagliata dell'asse X del trend (aperto dal #14, ora 2 sprint).

**ACTION ITEM per lo Sprint #16** (max 5)
1. Chiudere BUG-021 + TD-012: `pluralize`/`countLabel` negli altri 9 file e in `AddSlotModal`.
   Fatto quando: `grep -rn "=== 1 ?" src` non restituisce plurali inline (le eccezioni restano
   elencate nel commit), c'è un test 0/1/2 per ogni testo nuovo, BUG-021 VERIFIED dal vivo.
2. Chiudere TD-011: passare a `Button` il calendario ("+ APPUNTAMENTO", "CREA APPUNTAMENTO"), gli
   ANNULLA di `WorkoutPlanForm`/`RunbookPage`/`GoalsSection` e "+ AGGIUNGI" di `MembersPage`, con
   una variabile CSS unica per `#04140a`. Fatto quando: `#04140a` compare in 1 solo punto, il
   calendario ha un solo primario pieno per schermata, test di contrasto invariato (minimo 5,29:1).
3. Test del layout di stampa del PDF paziente: caso Playwright (`qa:dev` o suite locale) che genera
   il PDF di un paziente con dati lunghi e verifica 2 pagine, margine sulla seconda e BIA non
   spezzata. Fatto quando: il test fallisce rimettendo `@page { margin: 0 }` e passa in `qa:dev`.
4. Giro QA sui residui dal vivo, time-box mezza giornata: primario su almeno 2 temi non predefiniti,
   area admin e staff_readonly dopo STORY-043, stampa PDF da Firefox. La stampa su carta se serve
   resta all'utente. Fatto quando: ogni voce ha esito VERIFIED o un BUG aperto, e il "Non completato"
   del #16 elenca solo la stampa su carta (se non fatta).
5. Chiudere i dati e i cosmetici pendenti: decisione dell'utente sul paziente "E2E-PDF Sprint15" e
   correzione dell'etichetta tagliata dell'asse X del trend (con voce in BUGS.md). Fatto quando: il
   paziente è tenuto con motivo scritto o cancellato (Admin SDK, solo rankex-dev) e il bug è VERIFIED
   a 360 px e desktop.

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

**Aggiornamento 2026-10-30:** la coda corrente è EPIC-010 (Lipedema Edition) — vedi i
candidati in fondo a Sprint #12. Il piano sotto (EPIC-007/EPIC-005) è precedente e va
rivisto dal Product Owner prima di riaprirlo.

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) erano **già implementate**
prima di aprire i rispettivi sprint. EPIC-005 (Avatar + Negozio) è stata scoperta
(Sprint #3, raccomandazione di non procedere) ma l'utente ha scelto comunque uno spike
tecnico ridotto (Sprint #4, STORY-014, override esplicito — vedi ADR-003), deployato
su prod. TD-001/TD-002 risolti. EPIC-002 chiusa (Sprint #5).

**EPIC-007 (Privacy & Data Protection) ha ora priorità massima — richiesta esplicita
dell'utente sui risultati del Privacy & Data Protection Audit — e precede EPIC-005
completa nella coda.** Sprint #6 (sopra) copre le sole P0 tecniche. Candidati per gli
sprint successivi, in ordine:

**Candidati aperti (in ordine di priorità):**
1. **Resto di EPIC-007, P0 rimaste bloccate** — STORY-019 (Privacy Policy/Cookie Policy)
   e STORY-020 (consenso genitoriale minori), non appena il contenuto legale/la
   decisione dell'utente arrivano dal track parallelo aperto in Sprint #6. Priorità
   massima non appena sbloccate, a prescindere da cos'altro è in coda in quel momento.
2. **EPIC-007, P1** — STORY-021 (verifica regione Firestore, bloccata sull'utente ma
   verifica leggera), STORY-022 (self-hosting font, READY, nessun blocco), STORY-023
   (script di backup interim, READY per la parte tecnica). Candidati naturali per
   **Sprint #7**, dimensionati per stare insieme in un solo sprint senza ripetere il
   pattern "troppe story a metà".
3. **EPIC-007, P2** — STORY-024 (minimizzazione dati sensibili per `staff_readonly`),
   STORY-025 (rimuovere/correggere `deleteOrganization`, READY), STORY-026 (policy di
   retention, BLOCKED su decisione utente — stesso track parallelo di STORY-019/020).
4. **EPIC-007, P3** — STORY-027 (rimuovere `VITE_FIREBASE_MEASUREMENT_ID`, READY),
   STORY-028 (export dati strutturato per il cliente, READY ma richiede una scelta di
   flusso UX minima prima di stimare).
5. **EPIC-005 completa — Avatar + Negozio**, dopo EPIC-007, se/quando le domande aperte
   in `docs/BACKLOG.md` hanno risposta (asset grafici, priorità rispetto alla
   gamification esistente, bilanciamento economia). Non riconsiderare prima che
   EPIC-007 sia sostanzialmente chiusa, salvo diversa istruzione esplicita dell'utente.

---

## Storico sprint chiusi

# SPRINT #14 — EPIC-010 Lipedema Edition, quinta ondata (storico e trend + PDF) — aperto il 2026-11-09, chiuso il 2026-11-09 (goal raggiunto)

**Branch:** `feature/lipedema-module`. Deploy solo su `rankex-dev`, **nessun deploy in prod
del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista legge per ogni test l'andamento della paziente, con delta e
avvisi di comparabilità corretti, e (se approvata) ne esporta il report PDF.

**Riferimento UI:** canvas RankEX, tavole `PazienteTrend`, `MobilePazienteTrend`, `Paziente`,
`ReportLipedema` (sola lettura). Approccio tecnico: ADR-019.

**Decisioni dell'utente (09/11), vincolanti per STORY-039:** grafico a tratti spezzato a ogni
cambio di protocollo, interrotte/invalidate come cerchio ambra fuori linea, ceiling OLS marcato,
una serie per lato; delta sempre sull'ultima valida confrontabile con la data; badge
"DIVERSA DALLA PRECEDENTE · motivi" quando la precedente immediata differisce; OLS calzature e
superficie restano warning; livello `info` per il seriale del dinamometro; nessun colore
buono/cattivo, nessuna media.

**Story selezionate, nell'ordine:**
1. **STORY-039** — storico, trend e avviso di comparabilità (ADR-019).
2. **STORY-040** — PDF paziente, solo dopo review e QA di STORY-039 e dopo le risposte
   dell'utente alle 3 domande di ADR-019 (report di gruppo, grafici nel PDF, quali valutazioni).

**Action item della retrospettiva #13 inclusi:** helper unico `countLabel` client/server con
parità (adottato nei messaggi nuovi); stato di caricamento sulle riletture dello storico;
verifica a 360 px; almeno un caso `qa:dev` per trend e badge; caso runbook per l'avviso di
comparabilità. **Esclusi:** BUG-010, BUG-015, BUG-017 restano aperti (decide l'utente).

**Fuori dal #14:** STORY-043 (bottone principale, `themes.config.js` non committato), STORY-044.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-039 — storico e trend | DONE | Commit `fd14a3b`, review medium (1 MEDIUM + 3 LOW, corretti quelli sullo spec e sulla nota), functions (`countLabel`) e hosting su rankex-dev. QA dal vivo 09/11 desktop e 360 px: badge "DIVERSA DALLA PRECEDENTE", nota con le date, tratti OLS, schede a capo senza scroll orizzontale, staff_readonly in sola lettura. Runbook TP-073…077, caso qa:dev nuovo. |
| STORY-040 — PDF | DONE | Commit `fa8ffef`, review medium (motivo di interruzione e data BIA corretti). QA dal vivo 09/11: contenuto del PDF da trainer e da staff_readonly. Non verificati: stampa A4 reale e interruzioni di pagina. Runbook TP-078. |
| BUG-019 — "+1 ripetizioni" | FIXED + VERIFIED | Emerso nella QA del PDF, corretto con unità singolare/plurale nel delta. |
| BUG-018 su hosting dev | DONE | Deployato con lo sprint, non riverificato dal vivo. |
| Regressione `npm run qa:dev` | 19/19 | Dopo l'ultimo deploy del 09/11. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non lo sprint. |

**Aggiornamento di chiusura (09/11, dopo la board sopra):**

| Task | Status | Note |
|------|--------|------|
| Decisione 1 — bilaterali interrotti con un lato completo | CONFERMATA | L'utente tiene la scelta del tech-lead: il lato completo resta sulla linea (ADR-019 §3, nota del 09/11). Nessuna modifica al codice. |
| Decisione 2 — più valutazioni nello stesso giorno | DONE | Commit `798a399`, review medium (APPROVED, solo LOW). Ora accanto alla data breve solo se un'altra valutazione valida dello stesso test ha la stessa data: asse X, note, delta nello storico, dettaglio e PDF. Runbook TP-079. QA dal vivo desktop e 360 px. |
| BUG-010 / BUG-015 / BUG-017 (P3) | FIXED (015 VERIFIED) | Commit `50f6779`, su decisione dell'utente. BUG-015 verificato dal vivo; BUG-010 e BUG-017 coperti da unit test, non verificati dal vivo (servono un org_admin su piano free e un super_admin). |
| Hosting rankex-dev | DONE | `npm run deploy:all:dev` dopo `50f6779`; functions non toccate, non ridistribuite. |
| Regressione `npm run qa:dev` | 19/19 | Dopo il deploy di chiusura. |
| Stampa A4 del PDF | VERIFICATA (parziale) | Motore di stampa di Chromium (`page.pdf`, A4, media print) sul paziente QA Visita Sprint13: una pagina, impaginazione corretta. Interruzioni di pagina non esercitate (report di una sola pagina); stampante fisica non provata. |

## Goal
Il professionista legge per ogni test l'andamento della paziente, con delta e avvisi di
comparabilità corretti, e ne esporta il report PDF. **Raggiunto.**

## Completato
- **STORY-039 — storico e trend** (`fd14a3b`): grafico a tratti, badge "DIVERSA DALLA
  PRECEDENTE", livello `info` del seriale, `countLabel` client/server con parità. TP-073…077.
- **STORY-040 — PDF paziente** (`fa8ffef`): senza report di gruppo, solo tabelle, ultima valida
  per test, anche da staff_readonly. TP-078.
- **Ora nelle date dello stesso giorno** (`798a399`, decisione 2). TP-079.
- **Bug:** BUG-019 FIXED + VERIFIED (`3301529`); BUG-015 VERIFIED; BUG-010 e BUG-017 FIXED (`50f6779`).
- **Decisioni dell'utente prese tutte nello sprint:** le 3 domande di ADR-019 e le decisioni
  1-3 di chiusura. Nessuna resta "da confermare".

## Non completato (motivo)
- **Verifiche dal vivo mancanti:** "Aggiornamento in corso…" (TP-077), navigazione da tastiera
  tra le schede dei test, BUG-018 su hosting dev, BUG-010 (banner Team/impostazioni con limite 1,
  "1 presente" nel calendario) e BUG-017 (rankex-admin-dev). Interruzioni di pagina del PDF con
  un report di più pagine e stampa su carta.
- **STORY-029, requisiti non-codice** (DPA, testo informativa): BLOCKED, utente/legale. Blocca
  il go-live, non lo sprint.
- **Canvas da aggiornare** (non toccato dal codice): SALTA e l'avviso "Non salvati in questa
  visita" sulle tavole `Valutazione*` (dal #13); trend e PDF realizzati da allineare alle tavole
  `PazienteTrend`/`MobilePazienteTrend` e `ReportLipedema`.

## Blockers
- Nessuno tecnico. DPA / informativa: unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Plurali ancora inline:** BUG-010 è corretto con ternari locali in `MembersPage`,
  `OrgSettingsPage`, `NewClientView`, `CloseSessionModal`, perché `countLabel` vive in
  `utils/lipedema.js` (modulo-specifico). L'action item 2 del #13 ("fix di BUG-010 con lo
  stesso helper") è rispettato solo nel modulo lipedema.
- **`createdAt` delle org a tipi misti su rankex-dev:** le org create dai seed prima di `50f6779`
  hanno un Timestamp, le altre una stringa ISO. La lettura è normalizzata (`utils/orgDates.js`),
  ma `orderBy('createdAt')` in `getOrganizations` ordina per tipo; `joinedAt` dei membri nei seed
  è ancora un `serverTimestamp`.
- **Asse X del trend:** l'ultima etichetta a destra è tagliata su desktop ("09/1"); con l'ora
  le etichette a 360 px si toccano quasi. Cosmetico, non tracciato come bug.
- **Due valutazioni nello stesso minuto** (es. 07/11 10:29 ×2 nei dati QA) restano
  indistinguibili anche con l'ora. Caso limite dei dati di test, nessuna azione.

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **STORY-043 — bottone principale** (`themes.config.js` già modificato, non committato).
2. **STORY-044 — "Da sistemare".**
3. **Allineamento canvas** (SALTA, "Non salvati", PazienteTrend, ReportLipedema): fuori codice,
   ma è la spec UI e accumula ritardo da due sprint.
4. **Verifiche dal vivo rimaste** (TP-077, tastiera sulle schede, BUG-010/017/018) in un giro QA
   breve, con un org_admin su piano free e un super_admin di rankex-dev.
5. **Debito minore:** helper di plurale generico fuori dal modulo lipedema; migrazione
   `createdAt`/`joinedAt` a ISO sulle org di rankex-dev.
6. **STORY-029** resta BLOCKED (utente/legale).

## Retrospettiva
Dati: 7 commit (`fd14a3b`…`6809306`: 3 feature, 2 fix, 2 docs), 2/2 story DONE più la
decisione "ora stesso giorno" (`798a399`), 0 rework di story; bug BUG-019 (nuovo, VERIFIED),
BUG-015 VERIFIED, BUG-010 e BUG-017 FIXED non verificati dal vivo, BUG-018 deployato non
riverificato; nessun nuovo TD numerato; QA `qa:dev` 19/19.

**Verifica degli action item del #13**
1. Decisioni di STORY-039 prima del codice: **parziale**. Le decisioni su delta e badge sono
   state fissate in apertura (ADR-019), caso `qa:dev` aggiunto. Ma 2 decisioni (bilaterali
   interrotti, ora nello stesso giorno) sono state poste solo a fine sprint. Misura "0 da
   confermare" raggiunta, ma alla chiusura, non al design.
2. Helper unico di plurale: **no**. `countLabel` è usato nei messaggi nuovi, ma BUG-010 è
   corretto con ternari inline in 4 file e BUG-019 è emerso per un'unità del delta fuori da
   `countLabel`. Terzo plurale in tre sprint.
3. Stato di caricamento sulle riletture: **sì nel codice, parziale nella prova**. Implementato,
   ma TP-077 ("Aggiornamento in corso…") non verificato dal vivo.
4. QA a 360 px: **sì**. Desktop e 360 px per trend, badge, ora; 0 bug di layout mobile trovati.
5. BUG-015 e BUG-017 a inizio sprint: **no**. Esclusi in apertura, corretti a fine sprint
   (`50f6779`) su decisione dell'utente.

**WHAT WENT WELL**
- Storico/trend e PDF riusano un solo modello (`assessmentBadgeRules.js`, `assessmentFormat.js`,
  `lipedemaReportModel.js`): STORY-040 è un commit su STORY-039. Causa: ADR-019 scritto prima
  del codice, con le 3 domande risolte prima di partire.
- La parità client/server su `countLabel` e il caso `qa:dev` sono entrati nei commit di feature
  (19/19 dopo ogni deploy); le review medium hanno corretto motivo di interruzione e data BIA
  del PDF prima della QA.
- QA dal vivo sul nuovo ha preso BUG-019 e le scelte sull'ora; scope rispettato (043/044 fuori).

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-019 (+1 ripetizioni), dopo BUG-010 e BUG-018. ROOT CAUSE: il plurale è ancora
  "n + sostantivo" costruito localmente; `countLabel` sta in `utils/lipedema.js`
  (modulo-specifico) e non copre unità dei delta né gli altri moduli. IMPACT: stesso difetto
  tre volte in tre sprint, trovato in QA dal vivo e non dai test. ACTION: azione 1.
- Verifiche dal vivo rimaste indietro (TP-077, tastiera sulle schede, BUG-010/017/018, PDF
  multipagina). ROOT CAUSE: la QA copre "solo il nuovo" e il deploy di chiusura arriva dopo
  i fix; mancano account di test pronti (org_admin su free, super_admin). IMPACT: 3 fix
  dichiarati FIXED senza prova. ACTION: azione 2.

**WHAT CAUSED REWORK**
- `798a399` (ora nelle date brevi) tocca 9 file, 5 già toccati da STORY-039/040 (`assessmentFormat`,
  `Registry`, `Trend`, `ReportModel`, `DetailModal`). ROOT CAUSE: il caso "due valutazioni lo
  stesso giorno" non era tra i casi limite di ADR-019. IMPACT: 1 commit di ~140 righe, dopo
  PDF e QA già fatti. ACTION: azione 3.
- Decisione "bilaterali interrotti" chiesta a fine sprint e confermata senza modifiche:
  stato ambiguo di STORY-039 fino all'ultimo (stesso schema del #13). ACTION: azione 3.

**WHAT WAS SLOW**
- Giri di QA e deploy ripetuti nello stesso giorno (deploy dopo STORY-039/040, dopo `798a399`,
  dopo `50f6779`) perché i fix P3 sono arrivati dopo la prima QA. Non un blocco, ma 3 giri.
- Canvas in ritardo da 2 sprint, ora 4 tavole (SALTA, "Non salvati", PazienteTrend/Mobile,
  ReportLipedema): è la spec UI ma si aggiorna solo a mano. ACTION: azione 4.

**WHAT CREATED TECHNICAL DEBT**
- Plurali inline in 4 file (vedi "Tech debt emerso"): debito creato da BUG-010 per non
  spostare `countLabel` fuori dal modulo.
- `createdAt` org a tipi misti su rankex-dev (Timestamp/ISO) e `joinedAt` dei seed:
  `orderBy('createdAt')` ordina per tipo. Lettura normalizzata, dati no. ACTION: azione 5.
- Cosmetici non tracciati: ultima etichetta dell'asse X tagliata, etichette vicine a 360 px.

**ACTION ITEM per lo Sprint #15** (max 5)
1. Helper di plurale generico fuori dal modulo lipedema (`utils/`, con copia e parità solo se
   serve al server), usato da `MembersPage`, `OrgSettingsPage`, `NewClientView`,
   `CloseSessionModal` e `formatMonoDelta`. Misura: 0 ternari `=== 1 ?` per plurali inline
   nei file elencati (grep) e un test con quantità 0/1/2 per ogni unità; 0 nuovi bug di plurale.
2. Giro QA breve a inizio sprint sulle verifiche rimaste: TP-077, tastiera sulle schede,
   BUG-010 (org_admin su free), BUG-017 (super_admin), BUG-018, PDF di più pagine. Misura:
   BUG-010/017/018 a VERIFIED e 0 voci "non verificato" nel "Non completato" del #15.
3. Sezione "Decisioni aperte e casi limite" in SPRINT.md all'apertura di ogni story UI, con
   elenco dei casi limite (stesso giorno, dati interrotti, un solo elemento). Misura: 0
   decisioni poste a fine sprint e 0 commit di feature dopo la QA della story.
4. Allineare il canvas come primo task, con time-box di mezza giornata: 4 tavole (SALTA,
   "Non salvati", PazienteTrend/Mobile, ReportLipedema). Misura: 0 tavole in ritardo a fine
   sprint; se non fatto, scalare lo sprint, non rimandare di nuovo.
5. Script una tantum per portare `createdAt`/`joinedAt` a ISO sulle org di rankex-dev
   (idempotente, solo rankex-dev) e togliere la normalizzazione di lettura se superflua.
   Misura: 0 doc con `createdAt` Timestamp (conteggio nello script) e ordine corretto in
   `getOrganizations`.

# SPRINT #13 — EPIC-010 Lipedema Edition, quarta ondata (HHD + OLS + sequenza di visita) — aperto il 2026-11-06, chiuso il 2026-11-09 (goal raggiunto)

**Branch:** `feature/lipedema-module`. Rules e functions si deployano solo da qui (ADR-014
rischio #4). **Nessun deploy in prod del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista registra tutti e 5 i test di una visita, uno dopo l'altro, e la
regressione dei flussi critici si lancia con un comando.

**Riferimento UI:** canvas RankEX (https://claude.ai/artifact/XxYxNXzRYT7gRLko4HEeuL), tavole
`ValutazioneHHD`, `ValutazioneOLS`, `Valutazione2MWT`, `ValutazioneSTS`, `Valutazione`, versioni
`Mobile*`, `Guida` e `StatiValutazione`.

**Story selezionate, nell'ordine:**
1. **STORY-037** — HHD quadricipite, sulla logica bilaterale di STORY-036.
2. **STORY-038** — One-Leg Standing.
3. **STORY-042** — sequenza di visita con i 5 test.
4. **Guida dei 5 test** in `TestGuidePage`, ultimo criterio aperto di STORY-033.
5. **STORY-041** — QA automatica contro `rankex-dev`.

**Fuori dal #13:** STORY-039 (trend), STORY-040 (PDF), STORY-043 (bottone principale nel codice),
STORY-044 ("Da sistemare").

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-037 — HHD | DONE | Commit `e651a9e`, su rankex-dev. QA TP-064…066 PASS il 07/11; il 09/11 PASS anche HHD interrotta con una gamba completa e deviazione che resta attiva dopo la descrizione (TP-066). |
| STORY-038 — OLS | DONE | Commit `c0b706f`, su rankex-dev. QA TP-067…069 PASS il 07/11; il 09/11 PASS i passi rimasti: errori al salvataggio con 60,5 e 30,25 (TP-067, testo da correggere: BUG-018), Correggi su un OLS salvato col motivo (TP-068), vista staff_readonly (TP-069). Confermato dall'utente il 09/11: il motivo di fine sulle prove non valide resta facoltativo. |
| STORY-042 — sequenza di visita | DONE | Commit `8aa0656`, `3174e31`, `6be2314` (BUG-014) e `e841900` (avviso "Non salvati in questa visita"), su rankex-dev. QA TP-070…071 PASS il 07/11 e il 09/11. Scelte confermate dall'utente: SALTA resta (non sull'ultimo test), i test salvati non si riaprono dalla barra (si usa Correggi), nessun documento "visita completa", su mobile "SALVA E PASSA A…" e "SALVA E CHIUDI". Da riportare sul canvas: SALTA e il nuovo avviso nelle tavole Valutazione*. |
| Guida dei 5 test | DONE | Commit `6a47362`, su rankex-dev. Verificata su mobile e desktop il 07/11; istruzioni verbali e checklist confrontate col testo dei docx. Chiude STORY-033. |
| STORY-041 — QA automatica | DONE | Commit `3237093` + fix della review high del 09/11 (guardie su identità del service account e Firestore effettivo, pulizia che ricontrolla prefisso e login del cliente, seed che non tocca account fuori da `qadev.*` né di altre org). `npm run qa:dev`: 18/18 verdi dopo i fix, nessun residuo. |
| BUG-018 — "al massimo 1 decimali" | DONE | Commit `68fa4f8`, testo identico client/server (parità), functions su rankex-dev; hosting dev con lo Sprint #14. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non la chiusura dello sprint. |

**Punti di attenzione:**
- **Implementazione in una sessione nuova:** regola "una sessione per sprint".
- **Copia speculare** `utils/lipedema.js` ↔ `shared/lipedema.js`: il test di parità è condizione di DONE.
- **Se il tempo non basta**, STORY-041 passa al #14: non si tagliano i test.

## Goal
Il professionista registra tutti e 5 i test di una visita, uno dopo l'altro, e la
regressione dei flussi critici si lancia con un comando. **Raggiunto.**

## Completato
- **STORY-037 — HHD quadricipite** (`e651a9e`) sulla logica bilaterale comune. QA TP-064…066 PASS.
- **STORY-038 — One-Leg Standing** (`c0b706f`): tetto 60 s, motivo di fine per prova. QA TP-067…069 PASS.
- **STORY-042 — sequenza di visita** (`8aa0656`, `3174e31`, `6be2314`, `e841900`). QA TP-070…071 PASS.
- **Guida dei 5 test** in `TestGuidePage` (`6a47362`): chiude STORY-033.
- **STORY-041 — QA automatica** (`3237093` + `36ff9e4` dalla review high): 18 test su
  rankex-app-dev, seed idempotente, pulizia `E2E-`. 18/18 verdi dopo i fix.
- **Bug:** BUG-014 e BUG-016 VERIFIED; BUG-018 FIXED (`68fa4f8`).
- **Decisioni confermate dall'utente il 09/11:** "SALVA E CHIUDI" a metà visita non mostra
  l'avviso "Non salvati in questa visita" (resta solo su "SALVA E CHIUDI LA VISITA"); il
  motivo di fine sulle prove OLS non valide resta facoltativo. Nessuna modifica al codice.

## Non completato (motivo)
- **BUG-015** (riepilogo screen reader dei bilaterali) e **BUG-017** ("Invalid Date" nel
  dettaglio org del super admin): aperti, P3, non correggerli senza conferma dell'utente.
- **STORY-029, requisiti non-codice** (DPA, testo informativa): BLOCKED, utente/legale. Blocca
  il go-live, non lo sprint.
- **Canvas da aggiornare** (non toccato dal codice): SALTA e l'avviso "Non salvati in questa
  visita" sulle tavole `Valutazione*`.

## Blockers
- Nessuno tecnico. DPA / informativa: unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Review high di STORY-041:** le guardie controllavano solo il campo `project_id` del JSON
  del service account; la pulizia si fidava del chiamante e cancellava l'account Auth del
  cliente senza verificarne org e `clientId`; il seed cancellava un account "rimasto" con
  l'email del cliente di base senza guardarne l'org; il limite del range di prefisso era un
  carattere invisibile (U+F8FF). Tutto corretto in `36ff9e4`. Lezione: ogni funzione che
  cancella con l'Admin SDK verifica da sé il progetto, non solo il punto d'ingresso.
- **Nota di STORY-039 (09/11):** delta e badge NON CONFRONTABILE sulla stessa riga. Passa
  allo Sprint #14 con le decisioni dell'utente.

## Prossimo sprint (candidati)
STORY-039 (storico, trend, non comparabilità) e, se ci sta, STORY-040 (PDF) → Sprint #14.

## Retrospettiva
Dati: 13 commit (`e651a9e`…`4a9a310`), 5/5 voci pianificate DONE, 0 rework di story; bug
BUG-014/016/018 trovati in QA (014 e 016 VERIFIED, 018 FIXED), BUG-015 e BUG-017 aperti P3;
nessun nuovo TD numerato.

**WHAT WENT WELL**
- La logica bilaterale di STORY-036 è stata riusata da HHD e OLS senza riscriverla: 037 e 038
  sono un commit ciascuno. Causa: nel #12 si è scelto di chiudere 035+036 prima di costruirci
  sopra (vedi "Fuori dal #12").
- Scope rispettato: le 5 voci previste, STORY-039/040/043/044 fuori, nessuna deriva. Causa:
  elenco "Fuori dal #N" scritto in apertura.
- La review `high` su STORY-041 ha preso 4 guardie deboli prima che la suite girasse su dati
  reali; QA sull'hosting reale (lezione BUG-009) ormai prassi.

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-018 è lo stesso difetto di BUG-010 (plurale con quantità 1): i messaggi con un numero
  sono costruiti con template inline, non con un helper di pluralizzazione. ROOT CAUSE: nessun
  punto unico per "n + sostantivo", ogni messaggio nuovo lo reimplementa. IMPACT: stesso bug
  due volte in due sprint, fix da fare su due copie (client + server, parità). ACTION: azione 2.
- BUG-016 introdotto dalla review stessa di STORY-042 (rilettura in background senza stato di
  caricamento). ROOT CAUSE: operazione asincrona aggiunta senza chiedersi "cosa può fare
  l'utente mentre è in corso". IMPACT: valutazione iniziata su storico stale (precompilato e
  confronti sbagliati). ACTION: azione 3.
- BUG-014 (barra a 3 righe a 360 px) trovato solo in QA manuale. ROOT CAUSE: il layout della
  barra è stato verificato a 390 px, non alla larghezza minima supportata; BUG-012 del #11
  era della stessa famiglia (barra mobile). IMPACT: P2 corretto con 1 commit, ma costo di un
  giro QA. ACTION: azione 4.
- BUG-015 e BUG-013 (#11): stesso schema, un dato derivato (conteggio prove, ultimo valore)
  calcolato su una fonte diversa da quella mostrata (`trials.length` vs righe compilate; card
  vs storico). Aperti/corretti singolarmente, senza regola comune.

**WHAT CAUSED REWORK**
- Il fix `36ff9e4` dopo la review high: STORY-041 era stata scritta con guardie solo
  sull'ingresso (project_id nel JSON). ROOT CAUSE: codice distruttivo con Admin SDK scritto
  prima di una checklist di guardie. IMPACT: 1 commit di rework, nessun danno (18/18 verdi,
  nessun residuo) ma il rischio era cancellare account di un'altra org. ACTION: azione 1.
- Due decisioni (avviso "Non salvati", motivo OLS facoltativo) rimaste "da confermare" fino
  alla chiusura. ROOT CAUSE: domande all'utente poste a fine sprint, non al momento del
  design. IMPACT: nessuna modifica di codice, ma lo stato delle story è rimasto ambiguo
  per 3 giorni e il canvas non è riallineato.

**WHAT WAS SLOW**
- Riallineamento a mano del canvas (SALTA, avviso "Non salvati"): il canvas è la spec UI ma
  non si aggiorna dal codice, quindi diverge a ogni scelta presa in QA. Non è costo di
  codice ma si accumula: oggi 2 tavole in ritardo.
- STORY-041 ha richiesto seed, setup, teardown e 2 giri di guardie: investimento una tantum,
  ora ammortizzato dal comando `npm run qa:dev`.

**WHAT CREATED TECHNICAL DEBT**
- Nessun TD numerato, ma 2 bug P3 (BUG-015, BUG-017) e il canvas restano aperti; BUG-017 è
  di scripts/seed, non del modulo.
- Lo "Tech debt emerso" in coda alla sezione (guardie di cancellazione, nota STORY-039) è già
  tracciato; non duplicato in `docs/TECH-DEBT.md`.

**ACTION ITEM per lo Sprint #14** (max 5, da portare nella status board)
1. STORY-039: prima di scrivere il codice di storico/trend, fissare con l'utente le decisioni
   su delta e badge NON CONFRONTABILE (nota del 09/11) e loggarle in `docs/DECISIONS.md`;
   chiudere la story con almeno 1 caso `qa:dev` per il trend. Misura: 0 decisioni "da
   confermare" a fine sprint.
2. Helper unico di pluralizzazione per i messaggi con un numero (`utils/lipedema.js`, copia in
   `shared/lipedema.js`, test di parità) e adozione nei messaggi di STORY-039/040; fix di
   BUG-010 con lo stesso helper. Misura: grep di `${...} decimali`-style a zero nel modulo.
3. Regola di DONE per ogni nuova operazione asincrona in UI (rilettura, salvataggio): stato di
   caricamento che disabilita le azioni dipendenti, con un caso nel runbook o in `qa:dev`.
   Applicare a STORY-039 (carico dello storico per il trend).
4. QA mobile a 360 px (non solo 390) per le viste nuove di STORY-039/040; aggiungere un caso
   Playwright a 360×640 sul form bilaterale che verifica l'assenza di scroll orizzontale e che
   la barra resti sotto il 30 % dell'altezza. Misura: BUG di layout mobile trovati in QA = 0.
5. Correggere BUG-015 (contare le sole prove compilate) e BUG-017 (`createdAt` Timestamp in
   `OrgDetailView`) all'inizio dello sprint, dopo conferma dell'utente: due fix piccoli che
   evitano che P3 aperti si accumulino, ciascuno con un test.

---

# SPRINT #12 — EPIC-010 Lipedema Edition, terza ondata (30s-STS + Handgrip bilaterale) — aperto il 2026-10-31, chiuso il 2026-10-31 (goal raggiunto: review con 4 MEDIUM corretti, QA TP-054…063 PASS sull'hosting rankex-dev, nessun bug; non verificati per budget: layout mobile dei nuovi form, painMaxBySide, badge cambio dinamometro)

**Branch:** `feature/lipedema-module` (allineato a `origin/dev` in `27bfc55` all'apertura).
Rules e functions si deployano solo da qui (ADR-014 rischio #4). **Nessun deploy in prod
del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista registra 30s-STS e Handgrip con prove multiple per mano,
validità per prova e best calcolato dal server, con storico grezzo — e la logica
bilaterale è pronta per essere riusata da HHD e OLS.

**Story selezionate:**
1. **STORY-035** — 30s-STS (`lipedema_30s_sts`): prova singola come il 2MWT, ma con
   0 da invalidazione "uso braccia" distinto dallo 0 reale, errore tecnico separato da
   deviazione, setup sedia, familiarizzazione non conteggiata.
2. **STORY-036** — Handgrip: introduce l'infrastruttura **bilaterale multi-prova**
   (ordine alternato D-S, validità per prova, best per lato = max delle valide,
   Strongest/Weakest, simmetria, N/kgf con valore nativo conservato), scritta come
   logica condivisa in `utils/lipedema.js` ↔ `shared/lipedema.js` (test di parità).
3. **Criteri di STORY-033 rimandati dal #11, solo la parte bilaterale** — validità per
   prova + best sulle sole valide, dolore per prova e per lato, lato dominante: si
   verificano end-to-end su STORY-036, quindi chiudono insieme a lei.
4. **Workflow GitHub a Node 22** — `ci.yml`, `deploy.yml` (2 job), `e2e.yml` hanno
   ancora `node-version: '20'`, mentre `functions/` gira su Node 22 da `13052d6`.
   Task piccolo, prima del resto: allinea la CI al runtime reale.

**Fuori dal #12, candidati del #13 (motivo):**
- **STORY-037 (HHD) e STORY-038 (OLS)** dipendono da STORY-036. Metterle nello stesso
  sprint significa costruire due test sopra un'infrastruttura bilaterale non ancora
  passata da review e QA: se la review di 036 cambia la forma della logica condivisa,
  si rifanno tre test invece di uno. Il #11 aveva 3 story e ha prodotto 1 HIGH + 3
  MEDIUM in review e 3 bug in QA: quattro test più i criteri 033 più la guida sono
  oltre la capacità reale di un solo sviluppatore. Meglio chiudere 035+036 bene.
- **Guida dei 5 test in `TestGuidePage`** (criterio 033): va scritta quando esistono
  tutti e 5 i test, insieme a 037/038, per non pubblicare istruzioni di test non
  ancora registrabili.
- STORY-039 (storico/trend/non comparabilità) e STORY-040 (PDF) restano dopo.

**Sequenziamento:** workflow Node 22 → 035 (stesso schema del 2MWT, nessuna nuova
infrastruttura) e, in parallelo, design di 036 (Tech Lead: forma della logica bilaterale
condivisa, decimali dopo la conversione kgf→N, lato dominante del paziente o della
valutazione; ux-ui-designer: inserimento guidato delle 6 prove alternate su mobile) →
implementazione 036 + criteri 033 bilaterali → code review (verifica esplicita: logica
bilaterale riusabile da 037/038) → deploy dev (functions → rules → hosting) → **QA
sull'hosting reale** `rankex-app-dev.web.app`, desktop e mobile.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| Workflow GitHub `node-version` 20 → 22 (`ci.yml`, `deploy.yml` ×2, `e2e.yml`) | DONE | Nessuna dipendenza. Verifica: CI verde su un push del branch. |
| STORY-035 — 30s-STS | DONE | Riusa schema/callable di STORY-033 come il 2MWT. `stopReasonCode`: stesso catalogo provvisorio del 2MWT. |
| STORY-036 — Handgrip + infrastruttura bilaterale multi-prova | DONE | Decisioni aperte: decimali dopo la conversione (rischio in backlog), lato dominante come dato del paziente o della valutazione (criterio 033). Da loggare in `docs/DECISIONS.md` prima di iniziare. |
| STORY-033 — criteri bilaterali rimandati (validità per prova, best sulle valide, dolore per lato, lato dominante) | DONE | Chiudono con 036, non separatamente. |
| STORY-029 — requisiti non-codice (DPA, testo informativa, privacy draft) | BLOCKED (fuori capacità developer) | Proprietario utente/legale. Bloccano il go-live, non la chiusura sprint. |

**Dipendenze bloccanti / punti di attenzione:**
- **Cloud Functions:** `aggiungiValutazione` estesa a due nuovi `testId`; deploy solo
  `deploy:dev`, runtime Node 22. **Il prossimo deploy delle functions in prod (anche
  per altri motivi) deve usare Node 22**: Node 20 è dismesso da Google dal 30/10.
- **`firestore.rules`:** nessuna modifica prevista (le valutazioni restano
  `write: false`). Se emerge, va segnalata qui prima di farla.
- **Copia speculare** `utils/lipedema.js` ↔ `shared/lipedema.js`: la logica bilaterale
  entra nel test di parità — condizione di DONE (ADR-014 rischio #3). Precedente del
  #11: il test di parità non deve importare file che dipendono da `firebase-functions`
  (la CI non installa `functions/node_modules`, `281bbe4`).
- **Osservazione UX accettata nel #11:** su mobile la barra del form copre la bottom
  tab bar durante la compilazione. Con le 6 prove dell'Handgrip il form è più lungo:
  l'ux-ui-designer lo tiene presente nel design di 036, senza riaprire il tema come
  lavoro di questo sprint.

**Scope creep — regola per questo sprint:** STORY-037…040, la guida test, i bug P3
aperti (BUG-003/005/007/008/010) e i TD aperti (TD-004…010) **non** entrano qui. Lavoro
emerso non pianificato → `docs/BACKLOG.md`.

**Prossimo sprint (candidati), in ordine:**
1. STORY-037 (HHD) e STORY-038 (OLS) sulla logica bilaterale di 036 + guida dei 5 test
   in `TestGuidePage` (ultimo criterio aperto di STORY-033)
2. STORY-039 (storico, trend, non comparabilità)
3. STORY-040 (export PDF paziente)
4. Bug P3 lipedema (BUG-003, BUG-010) se il Product Owner li vuole prima del go-live

---

# SPRINT #11 — chiuso il 2026-10-31

EPIC-010 Lipedema Edition, seconda ondata (informativa + Valutazione + 2MWT) — aperto
il 2026-10-30, branch `feature/lipedema-module`.

## Goal
Un professionista registra l'informativa e salva/annulla una valutazione 2MWT, con
storico grezzo verificabile. **Raggiunto.**

## Completato
- **STORY-029 (parte tecnica)** — `client.privacyNotice` solo via callable, audit
  `PRIVACY_NOTICE_RECORDED` con soli id, gate `failed-precondition` in
  `aggiungiValutazione` e `salvaBia`, banner sul paziente. Commit `cc42e34`.
- **STORY-033** — infrastruttura Valutazione (subcollection `assessments`, rules
  `write: false`, `aggiungiValutazione`/`annullaValutazione`, annulla + reinserisci,
  snapshot di comparabilità, coppia `utils/lipedema.js` ↔ `shared/lipedema.js` nel test
  di parità), per la parte verificabile col solo 2MWT. Commit `cc42e34`.
- **STORY-034** — 2MWT: distanza calcolata dal server, validazioni, percorso variante,
  stop anticipato, dati clinici opzionali pre/post. Commit `cc42e34`.
- **Code review:** 1 HIGH + 3 MEDIUM, tutti corretti prima della QA.
- **QA dal vivo sull'hosting reale** `rankex-app-dev.web.app` (non vite locale, lezione
  di BUG-009): tutta PASS.
- **BUG-011** (form compilato perso senza conferma), **BUG-012** (barra SALVA non fissa
  su mobile), **BUG-013** ("Ultime valutazioni" senza segnalare variante/interruzione) —
  trovati dalla QA, fixati in `769565d`, **VERIFIED** il 31/10 su rankex-app-dev
  (`27bfc55`).

## Non completato (motivo)
- **Criteri di STORY-033 non verificabili col solo 2MWT** — validità per prova e best
  sulle valide, dolore per lato, lato dominante, guida dei 5 test in `TestGuidePage`.
  Rimandati per scelta, già previsto all'apertura: i bilaterali al #12 con STORY-036,
  la guida con 037/038.
- **STORY-029, requisiti non-codice** (DPA art. 28 firmato, testo dell'informativa,
  privacy draft): BLOCKED, proprietario utente/legale. Bloccano il go-live, non lo
  sprint.
- Deploy in produzione del modulo: non previsto (DPA).

## Blockers
- Nessuno tecnico aperto.
- DPA / testo informativa (vedi sopra) — unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Runtime Cloud Functions portato a Node 22** (`13052d6`): Google ha dismesso Node 20
  il 30/10. Lavoro non pianificato ma obbligato (senza, niente deploy). Conseguenze
  aperte: (1) il prossimo deploy delle functions in **prod** dovrà usare Node 22;
  (2) i workflow GitHub (`ci.yml`, `deploy.yml`, `e2e.yml`) sono ancora su
  `node-version: '20'` → task nel Sprint #12.
- **CI rotta** da un import del test di parità verso un file che dipende da
  `firebase-functions` (la CI non installa `functions/node_modules`); corretta in
  `281bbe4` separando `shared/timezone.js`. Per la Retrospective: i file `shared/`
  importati dai test di parità devono restare puri, senza dipendenze di `functions/`.
- **Osservazione UX accettata, non un bug:** su mobile la barra del form (z-40) copre la
  bottom tab bar (z-30) durante la compilazione; si esce con INDIETRO, back dell'header
  o swipe, tutti con conferma (BUG-011/012). Da tenere presente nel design dei test
  multi-prova, più lunghi.
- Nessun nuovo TD numerato. Bug P3 e TD-004…010 invariati.

## Prossimo sprint (candidati)
STORY-035 + STORY-036 + criteri bilaterali di STORY-033 + workflow Node 22 → aperto come
Sprint #12, vedi sopra. Poi STORY-037/038 + guida test, 039, 040.

---
# SPRINT #10 — chiuso il 2026-10-30

EPIC-010 Lipedema Edition, prima ondata (fondamenta modulo) — aperto il 2026-10-24,
branch `feature/lipedema-module` da `dev`. Numerazione #10 e non #7: i numeri #7…#9
sono già stati usati su `feature/mobile-app` (TD-004).

## Goal
Un'org lipedema si crea, non mostra né calcola rank/XP, e gestisce pazienti senza
account.

## Completato
- **STORY-030** — modulo `lipedema`, capability esplicite in `getModule` (default
  restrittivo per moduli sconosciuti), terminologia Professionista/Paziente/
  Appuntamento, `shared/modules.js` + check di modulo nelle callable (ADR-008), cambio
  modulo bloccato con pazienti (rules + `OrgDetailView`). Commit `f71f73c`.
- **STORY-031** — niente rank/percentili/gamification nel modulo, lato UI e lato
  callable (XP/campionamento/obiettivi/avatar rifiutati; `chiudiSessione` e `salvaBia`
  senza XP). Commit `f71f73c`.
- **STORY-032** — wizard paziente senza account Auth, email facoltativa, audit
  `CLIENT_CREATED` senza nome; `eliminaCliente` con `listCollections` +
  `recursiveDelete`. Commit `f71f73c`.
- Tutte e tre **verificate dal vivo su rankex-dev** (QA 25/10, due giri: il primo su
  `f71f73c`, il secondo su `b119bfb` dopo i fix).
- **BUG-002** (terminologia hardcoded, P2), **BUG-004** (Elimina visibile a
  staff_readonly, P3), **BUG-006** (upgrade profilo da staff_readonly, P3) — fixati in
  `b119bfb`, **VERIFIED** dal vivo il 25/10.
- **BUG-009** (P0, fuori piano) — la CSP di `firebase.json` non ammetteva
  `*.cloudfunctions.net` in `connect-src`: **ogni** scrittura via callable era
  bloccata sull'hosting reale, produzione inclusa, dalla migrazione BE di luglio. Trovato
  dalla QA sull'hosting dev, fixato (`56905ee` su dev, verificato con smoke test su
  rankex-app-dev/rankex-admin-dev), pubblicato in produzione con hotfix `4f5d08e` su
  `main` il 26/10 (deploy-prod verde, header live verificato), poi riportato su dev
  (`2fb17a1`). Entrato nello sprint senza discussione: un P0 in prod ha precedenza su
  tutto.

## Non completato (motivo)
- Nessuna story pianificata lasciata a metà.
- Deploy in produzione del modulo lipedema: **non previsto** per scelta (nessuna org
  lipedema in prod prima del DPA, STORY-029).

## Blockers
- Nessuno tecnico aperto.
- BUG-009 in prod: header verificato, la prova di scrittura dal vivo in produzione è a
  cura dell'utente (da confermare in `docs/BUGS.md` quando fatta).

## Tech debt emerso
- **Bug P3 aperti** (non bloccanti, fuori sprint): BUG-003 (badge scrivibili
  direttamente su un paziente, stessa causa di TD-005), BUG-005 (tab BIA visibile nel
  soccer), BUG-007 (azioni di scrittura del calendario visibili in readonly), BUG-008
  (area atleta con terminologia PT fissa), BUG-010 (plurale con quantità 1 in lipedema).
- **TD aggiunti in sprint:** TD-007 (soccer dichiara `hasBia`/`hasProfileTypes` false
  ma la UI offre la BIA), TD-008 (`OrgDetailView` senza scelta di
  `terminologyVariant`), TD-009 (audit `CLIENT_DELETED` solo client-side,
  `CLIENT_CREATED` doppio), TD-010 (codice morto degli step 'test' in `useWizard`).
  TD-004/005/006 restano aperti dal design (24/10).
- **Tech debt di processo (per la Retrospective):** la CSP non era coperta da alcun
  test. Gli e2e e la QA locale girano su vite, che non applica gli header di
  `firebase.json`: il blocco di tutte le callable è rimasto invisibile per circa tre
  mesi ed è emerso solo perché la QA di questo sprint ha usato l'hosting dev reale.
  Da discutere: un test che verifichi la CSP rispetto ai domini usati dall'app, o un
  e2e minimo contro l'hosting deployato (suggerimento già in BUG-009); e la QA
  sull'hosting reale come passo fisso prima di chiudere una story che tocca callable.
- Pattern osservato: i fix di BUG-002 hanno toccato 48 file — la terminologia per
  modulo era una superficie più grande di quanto l'inventario ADR-007 prevedesse.

## Prossimo sprint (candidati)
STORY-029 (parte tecnica) + STORY-033 + STORY-034 → aperto come Sprint #11, vedi sopra.
Poi STORY-035/036, 037/038, 039, 040.

---

### SPRINT #6 — EPIC-007: Privacy & Data Protection, remediation P0 — aperto il 2026-09-14, archiviato il 2026-10-24

**Perché ora, fuori sequenza:** l'utente ha richiesto esplicitamente priorità massima sui
risultati del Privacy & Data Protection Audit appena consegnato dal Product Owner
(EPIC-007). Questo sprint scavalca il piano precedente (che vedeva solo EPIC-005 completa
come candidato) e si dedica **esclusivamente** a EPIC-007.

**Goal:** chiudere le story P0 di EPIC-007 risolvibili con solo lavoro tecnico in questo
sprint — STORY-015 (hardening regole `audit_logs`), STORY-016 (cascade delete completo in
`eliminaCliente`), STORY-017 (log reale dei login falliti, previa decisione Tech Lead) e
STORY-018 (messaggio di errore login generico) — mentre si avvia in parallelo, **fuori
capacità developer**, la raccolta di contenuti/decisioni per le altre due P0 dell'epic,
STORY-019 e STORY-020, oggi bloccate su input legale/di prodotto non producibile da chi
scrive codice.

**Story selezionate (P0 di EPIC-007 — STORY-015..020):**
- STORY-015 — hardening regola `create` su `/audit_logs/{logId}` (anti-spoofing uid/email/campi extra)
- STORY-016 — cascade delete completo in `eliminaCliente` (note, goal, slot, ricorrenze, notifiche, schede)
- STORY-017 — log reale dei login falliti (oggi silenzioso, nessuna entry scritta) — richiede prima una scelta di design Tech Lead tra 3 opzioni
- STORY-018 — messaggio di errore login generico (anti account-enumeration)
- STORY-019 — Privacy Policy + Cookie Policy in-app — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)
- STORY-020 — consenso genitoriale per minori soccer_academy — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)

**Sequenziamento (aggiornato dopo ADR-004 del Tech Lead — vedi `docs/DECISIONS.md`):**
1. STORY-018 parte subito — fix isolato di una riga, nessuna dipendenza.
2. STORY-015 e STORY-016 in parallelo — indipendenti tra loro (015 tocca solo
   `firestore.rules`, 016 tocca solo `eliminaCliente`).
3. STORY-017 è stata sbloccata dal Tech Lead (ADR-004): opzione (b), nuova Cloud
   Function callable `registraLoginFallito` (Admin SDK, invocabile senza auth, con
   throttle anti-spam) — **non tocca `firestore.rules`**, quindi non ha più alcun
   coordinamento di deploy con STORY-015. Procede indipendente in parallelo alle altre tre.
4. In parallelo, **fuori dallo sprint di sviluppo**: track "raccolta input" per
   STORY-019 e STORY-020 (vedi sotto).

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-018 — messaggio di errore login generico | **DEPLOYED (rankex-dev)** | Codice mergiato in `dev` (`ddef4a0`) e deployato: rules+functions live su rankex-dev. **Hosting rankex-dev non ancora ridistribuito** (dipende dal push su origin, bloccato — vedi Blockers) — il fix è verificabile solo in locale (`npm run dev`) finché l'hosting non si aggiorna. |
| STORY-015 — hardening regola `create` su `audit_logs` | **DONE (rankex-dev)** | `firestore.rules` deployata su rankex-dev (2026-09-15, worktree isolato `epic-007-privacy-remediation` → merge in `dev`). 47/47 test rules verdi pre-deploy. Non ancora su `fitquest-60a09` (prod). |
| STORY-016 — cascade delete completo in `eliminaCliente` | **DONE (rankex-dev)** | Verifica fixture live eseguita con successo su `test-org-pt`: creato un cliente reale con nota+obiettivo+slot+ricorrenza+notifica+scheda, chiamato `eliminaCliente`, confermato — cliente e subcollection `notes`/`goals` cancellati, notifica e scheda cancellate, slot/ricorrenza (condivisi) ripuliti del riferimento ma non cancellati per intero. `clientCount` ripristinato dopo il test (il fixture non passava da `creaCliente`). Nessun residuo lasciato sull'org di test. Non ancora su prod. |
| STORY-017 — log reale dei login falliti | **DONE (rankex-dev)** | `registraLoginFallito` deployata ("Successful create operation") + indice composito deployato. **Smoke test live eseguito con successo**: chiamata diretta all'endpoint HTTPS (`curl` verso `europe-west1-rankex-dev.cloudfunctions.net/registraLoginFallito`) → `{"result":{"ok":true}}`, HTTP 200 — la funzione scrive senza errori (un fallimento della write via Admin SDK avrebbe fatto fallire la callable con 500). Non ancora su prod. |
| STORY-019 — Privacy Policy + Cookie Policy in-app | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere contenuto legale" — proprietario utente/consulente esterno. Non impegna il developer, non condiziona la chiusura di questo sprint. |
| STORY-020 — consenso genitoriale minori | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere decisione Titolare del trattamento + modalità di raccolta consenso" — proprietario utente. Non impegna il developer, non condiziona la chiusura di questo sprint. |

**Blockers:**
- Deploy su rankex-dev completato il 2026-09-15: `firestore.rules`, indice
  composito `audit_logs`, e tutte le 34 Cloud Functions (incl. `eliminaCliente`
  aggiornata e `registraLoginFallito` nuova). Eseguito da un worktree isolato
  (`epic-007-privacy-remediation`, poi fast-forward in `dev` in locale) per non
  interferire con una sessione concorrente attiva su `feature/mobile-app` nella
  cartella di lavoro condivisa.
- Il branch `dev` locale è avanzato oltre `ddef4a0` (fix + aggiornamenti di
  processo) ma non è stato ancora inviato a origin — resta da fare
  manualmente. Finché non arriva su origin: nessun aggiornamento automatico
  dell'hosting rankex-dev, e chi lavora su altre copie del repository non vede
  questi commit.
- **Verifica fixture live STORY-016 completata** (2026-09-15): cliente di test
  reale su `test-org-pt` con nota+obiettivo+slot+ricorrenza+notifica+scheda →
  `eliminaCliente` → tutte le verifiche passate, zero residui, `clientCount`
  ripristinato. Script one-off eliminato dopo l'uso (non era pensato per
  riutilizzo — path relativi specifici a questo ambiente).
- **Tutte e 4 le story in capacità developer (STORY-015/016/017/018) sono ora
  DONE su rankex-dev.** Resta: ripetere l'intera sequenza di deploy su
  `fitquest-60a09` (prod) dopo un merge `dev`→`main`, e il push di `dev` su
  origin (vedi sopra) come prerequisito.
- STORY-019 e STORY-020 restano bloccate su input non tecnico (contenuto legale
  approvato + decisione dell'utente su Titolare del trattamento/raccolta consenso
  minori) — nessuna stima di sviluppo possibile finché non arrivano. Vedi nota
  "Scorporo" sotto per come vengono gestite senza tenere in ostaggio lo sprint.

**Tech debt di processo emerso in questo sprint (per la Retrospective):** il primo
giro di implementazione delle 4 story ha introdotto, oltre allo scope approvato,
un'intera feature non richiesta e non passata da product-owner/tech-lead (scaffold
app mobile nativa Capacitor/Android, hook `useNativeBackButton`/`useNativePush`,
wiring FCM in `firestore.rules`/`clients.js`, trigger push notification) — inclusi
build artifact Android/Gradle binari nel working tree. Rilevato e rimosso
interamente prima della code review (nessuna traccia arrivata a quello stadio).
Causa non accertata (non è possibile determinare dal solo working tree se sia stato
un errore di scope del Developer o un'interferenza esterna). Azione da valutare in
Retrospective: verificare lo scope effettivo di ogni implementazione (`git status`
completo, non solo i file attesi) subito dopo ogni sessione di sviluppo, prima di
passare a code review — non solo per gli sprint sensibili come questo.

**Nota Scrum Master — scorporo delle story bloccate dallo sprint tecnico:**
STORY-019 e STORY-020 restano nell'epic e sono elencate sopra per tracciabilità (priorità
P0, richiesta esplicita dell'utente), ma **non fanno parte della capacità di sviluppo di
questo sprint** e non ne condizionano la chiusura. Motivo: un lead time legale/di
decisione (contenuto Privacy Policy approvato, scelta Titolare del trattamento) non è
stimabile né accelerabile da lavoro tecnico, e tenerle "IN PROGRESS" nello sprint
tecnico per un tempo indefinito violerebbe il principio FINIRE > INIZIARE — lo sprint
rischierebbe di non chiudere mai in attesa di un input che non dipende dal developer.
Al posto di bloccare l'intero sprint, apro subito un **task parallelo non-developer**
("raccogliere contenuto/decisione") con proprietario l'utente, che può procedere in
qualunque momento senza aspettare la chiusura di questo sprint. Quando input e decisione
arrivano, STORY-019/020 (insieme a STORY-021 e STORY-026, bloccate per lo stesso motivo
ma priorità P1/P2) diventano un candidato naturale per un prossimo sprint — non serve
uno sprint "parallelo" formale con la sua status board: basta non far dipendere la
chiusura di *questo* sprint dal loro esito.

**Archiviato il 2026-10-24 dallo Scrum Master, senza una chiusura formale in questo file.**
Le 4 story tecniche (STORY-015…018) erano DONE su rankex-dev; il lavoro EPIC-007
successivo (DPA, export, cancellazione org, font locali, backup — commit `91d9de7`,
`5fe04fc`, `12e8709`) è stato fatto fuori da questa status board. Una chiusura formale
di Sprint #6 esiste solo su `feature/mobile-app` (commit `bba54ab`), mai arrivata su
`dev` (TD-004). Spostato qui per avere un solo sprint attivo; stato attuale delle
story EPIC-007 in `docs/BACKLOG.md`.

---

### SPRINT #5 — EPIC-002: pulizia debito minore — chiuso il 2026-09-14

**Goal:** chiudere le due ultime story P3 in backlog, nessuna dipendenza esterna.

**Completato:**
- STORY-003 — rimosso il wrapper `calcPercentile` (0 consumer applicativi già
  confermato da lug 2026). Test dedicato rimosso (era tautologico senza il wrapper),
  commento residuo in `tables.js` corretto, CLAUDE.md aggiornato. 211/211 test verdi.
- STORY-004 — `VITE_GOOGLE_FIT_CLIENT_ID` rimossa da `.env.example`, previa conferma
  esplicita dell'utente (nessun flusso OAuth diretto pianificato che la usi).

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** nessuno.

**Prossimo sprint (candidati):** nessun item P1/P2 aperto — solo EPIC-005 completa,
bloccata sulle stesse dipendenze esterne di sempre (vedi Sprint #3/#4).

---

### SPRINT #4 — Avatar + Negozio: spike tecnico (override ADR-002) — chiuso il 2026-09-14

**Goal:** dopo la raccomandazione di non procedere (Sprint #3), l'utente ha scelto
esplicitamente — tra 3 opzioni presentate, rischio incluso nella descrizione — uno
spike tecnico senza arte reale. Non un nuovo sprint pianificato, una continuazione
diretta della stessa conversazione/decisione.

**Completato:**
- STORY-014 — meccanica Monete + negozio riusando le 9 immagini avatar esistenti
  (nessuna arte nuova, nessun sistema a 6 slot, nessun flusso B2B — scope ridotto
  rispetto alla visione completa, per scelta esplicita, vedi ADR-003).
- Guadagno Monete solo da sessione presente (`chiudiSessione`), acquisto via nuova
  Cloud Function `acquistaAvatar` con transazione Firestore (non batch).
- **Verificato dal vivo contro rankex-dev**, non solo per lettura di codice: script
  one-off con auth REST + invocazione diretta della callable — rifiuti corretti
  (avatar non acquistabile, Monete insufficienti, doppio acquisto), acquisto riuscito
  con decremento Monete e inventario aggiornato. Dati di test ripuliti dopo la verifica.
- 5 nuovi test unitari (`isAvatarUnlocked`), build+lint+vitest puliti.

**Non completato:** deploy su prod — resta su rankex-dev in attesa di conferma.

**Blockers:** nessuno tecnico.

**Tech debt emerso:** nessuno nuovo. Rischio già dichiarato in ADR-003: se questo
spike non porta a validazione reale, è candidato esplicito a rimozione come codice
morto in un futuro audit (stesso destino di Wearable/ContextNav documentato altrove).

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore) resta l'unico item senza
dipendenze esterne. Deploy prod dello spike, se l'utente lo conferma.

---

### SPRINT #3 — Avatar + Negozio: discovery — chiuso il 2026-09-14

**Goal:** valutare EPIC-005 (Product Analyst + Tech Lead), zero codice, come richiesto
esplicitamente dalla Roadmap futura ("allinearsi con il team prima di iniziare").

**Completato:**
- STORY-011 — valutazione valore: **raccomandazione di non procedere ora**. Non un
  giudizio tecnico, tre dipendenze esterne reali (asset grafici, bilanciamento
  economia via playtesting, flusso B2B che richiede org clienti interessate) che il
  codice da solo non risolve.
- STORY-012 — modello economico: fonti di Monete confermate dalla roadmap, importi
  non definibili senza playtesting. Superficie di integrazione tecnica identificata:
  tocca più Cloud Function esistenti coordinate (chiudiSessione, salvaCampionamento,
  salvaBia, sistema badge), non una sola nuova.
- STORY-013 — scoping tecnico: modello dati raffinato, pronto da riprendere. Stimato
  più grande di Obiettivi+Runbook insieme se/quando si procede.

**Non completato:** l'implementazione — per scelta, non per blocco tecnico (vedi ADR-002).

**Blockers:** risposte dell'utente su priorità/budget arte/validazione economia — non
risposte che il processo può dare da solo.

**Tech debt emerso:** nessuno — discovery pura, zero codice toccato.

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore, eseguibile subito) se
EPIC-005 resta bloccata; EPIC-005 stessa se le domande aperte si sbloccano.

---

### SPRINT #2 — Obiettivi trainer (+ Runbook manuale fuori piano) — chiuso il 2026-09-14

**Goal:** implementare EPIC-004 (target percentile su un test, con scadenza,
achievement rilevato server-side) — deviazione dal piano originale, che puntava su
EPIC-003 (Streak presenze), risultata già implementata prima di aprire lo sprint.

**Completato:**
- STORY-008 — modello dati + rules (7 nuovi test rules verdi su emulatore)
- STORY-009 — UI trainer (solo vista trainer — client-side è fast-follow)
- STORY-010 — notifica achievement (rilevamento server-side in salvaCampionamento)
- EPIC-006 (Runbook manuale) — aggiunta fuori piano, richiesta dall'utente durante la
  verifica di STORY-009/010. Completata nella stessa finestra invece di rimandarla a
  un nuovo sprint: indipendente da Obiettivi, piccola abbastanza da non giustificare
  l'overhead di un sprint a parte.

**Deploy prod — 2026-09-14:**
Cloud Functions + rules lanciate a mano da terminale (bloccate dal classificatore auto
sul comando diretto `npm run deploy` — girate poi dall'utente), poi `dev` → `main` (mai
pushato su origin prima d'ora in questa sessione, 15 commit) → push accettato → CI +
deploy.yml automatico → hosting + rules su fitquest-60a09. Verificato via
`firebase functions:list` (funzioni presenti) e `gh run view` (CI success, Deploy to
Firebase success).

**E2E fallito sullo stesso push, ma confermato preesistente:** stessi 2 test falliti
già su `main` dal 3 agosto 2026 (stesso file, stessa riga, stesso errore — confrontato
run per run) — non una regressione di questo sprint. Loggato come TD-002, uno dei due
è un bug comportamentale reale (non solo test fragile): `staff_readonly` vede il
bottone "+ NUOVO CLIENTE" che dovrebbe essere nascosto.

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** TD-002 (vedi sopra). TD-001 (2 test rules preesistenti, trovati
durante STORY-008) resta OPEN, non collegato a questo sprint.

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file.

---

### SPRINT #1 — Correttezza dati e sicurezza residua — chiuso il 2026-09-14

**Goal:** chiudere i due problemi con impatto diretto su dati reali/sicurezza già
documentati in CLAUDE.md, prima di aprire qualunque nuova feature.

**Completato:**
- STORY-001 — rollback percentili soccer (4 test): **già risolto** prima dell'apertura
  dello sprint (branch mergiato in dev il 09/05, ulteriore fix 01/07). Nessun codice
  toccato, nessun deploy — solo verifica + correzione di CLAUDE.md, che non era mai
  stato aggiornato dopo il merge.
- STORY-002 — chiusura RX-63 (accessToken wearable): 0 client coinvolti su dev+prod.
  Nessuna azione di codice necessaria (il campo resta nello schema per un'eventuale
  riattivazione futura, remediation già documentata per quel momento).

**Non completato:** nessuno — entrambe le story P1 chiuse, EPIC-002 (P3, filler) non
toccata, resta in backlog libero.

**Blockers:** nessuno.

**Tech debt emerso — non di codice, di processo:** entrambe le story P1 di questo
sprint erano *già risolte* quando lo sprint è stato pianificato — il Product Owner le
aveva costruite leggendo sezioni di CLAUDE.md rimaste non aggiornate dopo il lavoro
reale (percentili: merge del 09/05 mai riportato in doc; wearable: già noto, RX-63 era
comunque da verificare non da presumere risolto). **Causa radice:** CLAUDE.md non ha
un trigger che lo marchi "da rivedere" quando lo stato che descrive cambia — dipende
dalla disciplina di chi fa il merge nell'aggiornarlo nello stesso commit. Non è un
problema nuovo: CLAUDE.md stesso documenta più round di audit passati con lo stesso
pattern (file/feature rimossi ma mai tolti dalla documentazione). Da tenere a mente per
la prossima Retrospective: vale la pena una story dedicata a un controllo periodico di
coerenza CLAUDE.md↔codice, invece di scoprirlo story per story.

**Prossimo sprint (candidati):** SPRINT #2 — Streak presenze (EPIC-003), come da piano
originale — nessuna revisione necessaria, EPIC-003/004/005 non toccate da quanto emerso
qui.

_(Nota a posteriori: anche EPIC-003 si è rivelata già implementata all'apertura dello
Sprint #2 — vedi sopra. Stesso pattern, seconda volta di fila.)_

---

<!-- Ogni sprint chiuso viene appeso qui dallo Scrum Master -->
