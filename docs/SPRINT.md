# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

Nessuno sprint attivo: il #21 e' chiuso (13/11), vedi "Sprint chiuso (storico)". Il #22 si apre dal blocco "Passa al #22".

---

## Sprint chiuso (storico)

# SPRINT #21 — EPIC-011 Area cliente, parte 2 (Home cliente + action item del #20) — aperto il 2026-11-13, chiuso il 2026-11-13 (goal raggiunto; GYM, "Assegnato dal coach" e stato errore della Home non verificati dal vivo)

**Goal:** L'area cliente e' provabile dal vivo su rankex-dev (set avatar per `qa-pt`, cliente di base con primo accesso
fatto, spec di layout automatica) e la Home cliente mostra livello, striscia, prossima sessione, ultime notifiche e
Monete con la terminologia del modulo (STORY-048, incluso BUG-008), misurata a 360 e 1366 px.

**Branch:** `feature/lipedema-module`, HEAD = `origin/dev` = `48370e1` (`git rev-parse` il 2026-11-13). Working tree
all'apertura: `docs/BACKLOG.md`, `docs/BUGS.md` modificati; `lipidemia/`, `mobile-app/` non tracciati.

**Stato ambienti (apertura):** rankex-dev hosting + rules a `f31a2a6`, functions a `5090d9a`. Prod `fitquest-60a09` a
`f086405` con 40 callable `nodejs22` (dato dall'utente/CHANGELOG, non rilanciato `functions:list` oggi: non verificato).

**Vincoli dello sprint (decisioni dell'utente 13/11):**
- Nessuna release in prod: `main` resta a `f086405`, nessun deploy su `fitquest-60a09`.
- Nessun push fino a fine sprint; la QA dal vivo si fa a fine sprint dopo il push su `dev` (vedi "Punti da
  confermare" 1); mai deploy hosting in parallelo a `qa:dev`.
- Controprove solo su copia (worktree esterno, mai checkout/reset sul working tree); niente junction su `node_modules`.
- Dati di test solo nelle org `qa-*` di rankex-dev; mai account `qa.*` (QA manuale).
- Nessun file in `functions/` ne' `firestore.rules` modificato (verificato: `acquistaAvatar` usa solo il suffisso
  dell'id, `functions/src/shared/avatarUnlocks.js:21-22`, e le rules `firestore.rules:64-71` pure; nessuna lista di
  org lato server).
- Decisioni: set avatar `qa-pt` entra nel catalogo che va in prod (voce con `orgId: 'qa-pt'`, invisibile alle altre
  org, come `test-org-soccer`); primo focus del pannello notifiche resta su "Chiudi".

## Voci dello sprint (ordine di esecuzione proposto)

| # | ID | Titolo | Taglia | Stato | Dipende da |
|---|----|--------|--------|-------|-----------|
| 1 | AI 4 | Riga "precondizione QA" e "effetto visivo = una misura" in `.claude/agents/scrum-master.md` e `developer.md` | S | DONE 13/11 (regole in `.claude/agents/scrum-master.md` e `developer.md`: tracciati, a differenza di `settings.json`) | - |
| 2 | BUG-034 | Cambio password a campi vuoti: messaggio fuorviante (`ChangePasswordScreen.jsx:16-25`) | S | DONE 13/11: FIXED `122180b` (test Vitest; "fallisce prima" provato in scratchpad con node), VERIFIED dal vivo a `bac03ee` | - |
| 3 | BUG-035 | "PROSSIME APPUNTAMENTI" in lipedema (`ClientCalendar.jsx:105`) | S | DONE 13/11: FIXED `438019b`, VERIFIED dal vivo a `bac03ee` | - |
| 4 | BUG-036 | Campana mobile senza `aria-label` (`ClientBottomNav.jsx:100`) | S | DONE 13/11: FIXED `438019b`, VERIFIED (spec AI 2 + controprova su `aa84e73`) | - |
| 5 | AI 1 | Set avatar `qa-pt` + seed: cliente di base con primo accesso fatto + dati QA; poi TP-089 dal vivo, BUG-027 VERIFIED | S/M | DONE 13/11: avatar `qa_pt_01..09`, seed con primo accesso + slot/notifiche `qaSeedMarker` (`e2e/qa-dev/qaSeedData.js`); seed idempotente (1° lancio 7 nuovi documenti, 2° lancio 0), TP-089 PASS, BUG-027 VERIFIED; seed corretto da `fcb5d72` | 2-4 non bloccano; il TP-089 dal vivo richiede hosting dev aggiornato |
| 6 | AI 2 | Spec Playwright di layout del pannello notifiche cliente a 360/1366 in `e2e/qa-dev/tests/` + controprova su copia di `aa84e73` | M | DONE 13/11: `e2e/qa-dev/tests/clientNotificationsLayout.spec.js` (360x640 e 1366x768), verde su HEAD; controprova su copia di `aa84e73` (`aa84e731292419749a889b5daa919b99844b6017`): 2/2 FAIL su "una sola campana visibile" (parte titolo/Chiudi non eseguita) | AI 1 (cliente col primo accesso fatto e >= 1 notifica non letta) |
| 7 | STORY-048 | Home cliente (T1..T7, incluso BUG-008) | M/L | DONE 13/11 con eccezioni (GYM, "Assegnato dal coach", stato errore: non verificati, vedi chiusura). Commit: T1 `57b6c30` (BUG-008), T2 `9029bd1`, T3 `828a3db`, T4 `1bcf1a0`, T5 `b750c1b`; T6 (spec `e2e/qa-dev/tests/clientHomeLayout.spec.js` + `layoutHelpers.js` + `soccer` in `QA_CLIENT_LOGIN_MODULES`) `0c1c19b` e T7 (caso TP-094, BUG-008 → FIXED) `b9685d6`; poi `aa5bde2` (spec: misura dopo scroll al centro, titolo PROSSIMA senza word boundary). QA dal vivo TP-094 PASS a 360 e 1366, BUG-008 VERIFIED; controprova su copia di `aa5bde2` senza `grid-cols-2`: "stessa riga" 4/4 FAIL | AI 1, AI 2 (T6 estende la spec di AI 2) |

Ordine STORY-048: T1 (BUG-008, terminologia) → T2 (hook sessioni) → T3 (`useNotifications` status) → T4 (componenti
Home) → T5 (Monete) → T6 (spec Home 360/1366 + controprova) → T7 (caso `TP-` + chiusura BUG-008). Un task alla volta,
review medium sulla story (AC AI 5: la review cita l'esito della spec a 360 e 1366; senza, non passa a DONE).

**Criterio di done per voce**
- AI 4: le due regole sono scritte nei due file e `grep` le trova; l'utente le vede (file non tracciati).
- BUG-034: test Vitest sull'ordine delle validazioni che fallisce prima del fix; FIXED in BUGS.md.
- BUG-035: titolo con genere giusto verificato a vista in lipedema e in PT; FIXED in BUGS.md.
- BUG-036: bottone mobile con nome accessibile "Notifiche" (+ "N non lette" come il desktop, `:214`); verificato con
  l'albero di accessibilita' a 360 px; FIXED.
- AI 1: `npm run qa:dev:seed` idempotente (2 lanci di fila senza duplicati), TP-089 passi 1-6 PASS dal vivo, BUG-027
  VERIFIED; se il set non e' voluto, BUG-027 resta FIXED con la motivazione in BUGS.md.
- AI 2: la spec passa su HEAD a 360 e 1366; la controprova su worktree esterno di `aa84e73` fallisce su titolo e/o nome
  campana; `qa:dev` verde. Review medium.
- STORY-048: AC del BACKLOG tutti spuntati; spec Home a 360/1366 verde e citata dalla review; `lint`, `build`,
  `test:run` verdi; 0 bug di layout P3 nuovi in QA; 0 casi `TP-` BLOCCATI per precondizione.

**Nota AI 2 — piano di controprova (da eseguire a fine sprint, dopo il push e con hosting dev aggiornato; NON eseguita)**
- Cosa misura la spec: campana con nome accessibile (BUG-033/036, mobile e desktop; a desktop entra in "Calendario"
  perche' la top nav non c'e' sull'hub), nessuno scroll orizzontale, titolo >= 100 px e su una riga, "Chiudi" nel
  pannello a <= 30 px dal bordo destro e <= 30 px dal bordo alto (BUG-032), "Segna tutte" visibile, primo focus su
  "Chiudi", Esc → focus alla campana, nome della campana (conteggio non lette) invariato dopo apri/chiudi. Non clicca
  "Segna tutte". Precondizione: seed lanciato (>= 1 non letta); se la QA manuale ha letto tutto, la spec fallisce con
  messaggio esplicito sulla campana: rilanciare `npm run qa:dev:seed` NON le riapre, serve riaprirne una a mano su Firestore.
- Su HEAD: `npm run qa:dev -- clientNotificationsLayout` deve passare a 360 e 1366.
- Controprova su `aa84e73`: la guardia (`assertQaBaseUrl`, `QA_HOSTNAME` fisso, controllata dal setup su ogni project) rifiuta
  un baseURL locale e le sessioni salvate sono legate all'host: non si allenta nel repo. Si fa su una copia usa e getta:
  1. `git worktree add C:\Users\vAito\AppData\Local\Temp\claude\0d5da70ea05ac5cc\f78c5d68-9f6f-4191-8895-2c097e76936b\scratchpad\wt-aa84e73 aa84e73`
     (cartella esterna, niente junction); `npm ci` nel worktree (root).
  2. Copiare nel worktree, da HEAD: la spec, `e2e/qa-dev/qaDev.config.js` e `global.setup.js` con `qaClientUsers`, piu' i file
     gitignored `.env.development` (deve restare `rankex-dev`: la guardia `loadDevClientEnv` lo verifica), `.env.test` e il
     service account di dev.
  3. Solo nella copia: in `qaDev.config.js` `QA_BASE_URL = 'http://localhost:4173'` e `QA_HOSTNAME = 'localhost'`.
     E' l'unico punto in cui la guardia viene indebolita, solo nella copia; i guard su service account e `.env.development`
     restano. Il browser parla comunque con Auth/Firestore di rankex-dev (localhost e' dominio autorizzato di default).
  4. Nel worktree: `npm run build -- --mode development` e `npx vite preview --mode development --port 4173`
     (in un altro terminale), poi `npx playwright test --config playwright.qa-dev.config.js clientNotificationsLayout`.
  5. Atteso: fallisce a entrambi i viewport sul nome della campana (`toHaveCount(1)` di BELL_NAME: i due bottoni non hanno
     `aria-label`). Per vedere anche il titolo (BUG-032), solo nella copia sostituire il localizzatore `bell` con
     `page.locator('button:has(svg path[d^="M18 8A6"])').and(page.locator(':visible')).first()` e saltare le due `expect` sul
     nome: atteso fallimento su larghezza titolo e/o posizione di "Chiudi".
  6. Pulizia: `git worktree remove --force <cartella>` **dopo** aver verificato che `node_modules` sia una cartella reale e non
     una junction (qui non ce ne sono: `npm ci`); il preview si ferma con Ctrl+C. Nessuna modifica al working tree principale.
- Citare nel report di fine sprint output e sha (`git -C <worktree> rev-parse HEAD`) della controprova.

**Nota STORY-048 T6 — piano di controprova (AI 5; da eseguire a fine sprint, dopo il push e con hosting dev aggiornato; NON eseguita)**
- Cosa misura `clientHomeLayout.spec.js` (6 test x 2 moduli x 2 viewport = 24): nessuno scroll orizzontale; STRISCIA e PROSSIMA con y uguale
  (tolleranza 1 px) e dentro il viewport; ultima card raggiungibile e non sotto la bottom nav (62 px); 5 nodi del pentagono
  interi nel viewport, >= 44x44, disgiunti fra loro e da testata/STRISCIA/PROSSIMA/ULTIME NOTIFICHE/badge Monete; "Vedi tutte" (>= 44 px) e
  "N MONETE" visibili e dentro il viewport; barra XP `role=progressbar` con valuemin/now/max e `aria-label`; terminologia (soccer:
  "allenamenti di fila", "Prossimo", nessuna "Categoria" né "sessione/i"; PT: "sessioni di fila", "Prossima"); pannello da "Vedi tutte"
  (header misurato come in AI 2, primo focus su "Chiudi notifiche", Esc → focus su "Vedi tutte", pallini non lette e, a 360, nome della
  campana invariati); "XP ×N,N" della Home uguale a Calendario › STRISCIA. Precondizione: seed lanciato (slot futuro + >= 1 non letta
  tra le 2 mostrate); se manca fallisce con "precondizione QA mancante". Non scrive nulla, non segna nulla come letto.
- Su HEAD: `npm run qa:dev -- clientHomeLayout` deve passare a 360 e 1366 per qa-pt e qa-soccer (la sessione `soccer-cliente` la salva il setup).
- Controprova (stessa procedura della nota AI 2: worktree esterno `git worktree add <scratchpad>\wt-home HEAD`, `npm ci`, copia dei file
  gitignored `.env.development`/`.env.test`/service account, in `qaDev.config.js` solo nella copia `QA_BASE_URL = 'http://localhost:4173'` e
  `QA_HOSTNAME = 'localhost'`, `npm run build -- --mode development`, `npx vite preview --mode development --port 4173`):
  nella copia togliere `grid-cols-2` dal div della riga STRISCIA/PROSSIMA in `src/features/client/client-view/ClientHome.jsx`
  (`<div className="grid grid-cols-2 gap-3">` → `<div className="grid gap-3">`), ribuildare, rilanciare la spec.
  Atteso: il test "STRISCIA e PROSSIMA sulla stessa riga" fallisce a 360 (e a 1366, la regola non e' responsive) per tutti e due i moduli
  con "STRISCIA e PROSSIMA non sono sulla stessa riga". Ripristinare il file nella copia, rifare build e verificare che passi (prova
  "senza il difetto"). Pulizia come in AI 2 (controllare che `node_modules` non sia una junction prima di `git worktree remove`).
- Citare nel report/review (AC AI 5) output e sha (`git -C <worktree> rev-parse HEAD`) della controprova e l'esito a 360 e 1366 su HEAD.
- Verificato staticamente al 13/11: `--list` elenca i 24 test, `npm run lint`, `npm run test:run` (718/718) e `npm run build` verdi.

**Precondizione QA (AI 4)** — dove c'e' QA dal vivo:
- AI 1 / TP-089: org `qa-pt`; cliente `qadev.pt.cliente@test.rankex` (`e2e/qa-dev/qaDev.config.js:47`) con
  `mustChangePassword: false`, `level` che non sblocchi gli avatar 07-09 per livello (sono solo `purchase`) e
  `coins` >= 30 (avatar `..._07` costa 30, `avatars.config.js:76`). Fornitore: seed esteso, che crea **3 slot passati**
  pianificati (giorni diversi) per il cliente di base; la QA li chiude via UI (`chiudiSessione` da' 10 Monete a sessione,
  `functions/src/callable/chiudiSessione.js:32`) prima del TP-089. Il seed non scrive `coins`. Senza: TP-089 BLOCCATO, non PASS.
- AI 2 e STORY-048 / nuovo `TP-`: `qa-pt` e `qa-soccer` (allievo `qadev.soccer.allievo@test.rankex`, `qaDev.config.js:54`)
  con primo accesso fatto, >= 1 slot pianificato da oggi, >= 2 notifiche (>= 1 non letta), `coins` > 0,
  `sessionStreak` >= 1. Fornitore: stesso seed (`scripts/seed-qa-orgs.mjs`).
- BUG-034: nessun cliente pronto serve: serve un account con `mustChangePassword: true`, cioe' un cliente `E2E-…` appena
  creato dal wizard (cancellato dal teardown) perche' il seed lo porta a `false` per il cliente di base.

## Tabella ambiente/modulo — AI 1 (set avatar `qa-pt`)

Nessuna dipendenza da `isDev`/`isUat`/`isProduction`: il catalogo e' dato statico, uguale in ogni ambiente; cambia solo
quale org lo vede. UAT: nessun progetto/hosting nel repo (`.firebaserc:5-18`), non verificato.

| Caso | dev (rankex-dev) | UAT | prod (fitquest-60a09) |
|------|------------------|-----|----------------------|
| Catalogo per org (`getAvatarsForOrg`, `src/config/avatars.config.js:86-88`) | org `qa-pt`: dopo la modifica 9 avatar, oggi 0 (voci esistenti: `vdp5-tgtdu` `:5-13`, `test-org-soccer` `:16-24`, `test-org-pt` `:27-35`, `soccer-demo-moaokrn4` `:38-46`, `test-1tevc` `:49-57`; nessuna `qa-pt`/`qa-soccer`) | non verificato | il codice va in prod solo al prossimo rilascio (nessun deploy nel #21); poi voce inerte: nessuna org prod ha `orgId` `qa-pt` (non verificato in Console) |
| Regole di sblocco | per suffisso dell'id `01`-`09` (`:69-79`): `qa_pt_07` costa 30, `_08` 60, `_09` 100; speculari in `functions/src/shared/avatarUnlocks.js:21-22` e `firestore.rules:64-71`: nuovi id devono finire in `01`-`09` o non sono acquistabili/equipaggiabili come previsto | idem | idem |
| Server | `acquistaAvatar` non ha lista di org: nessun deploy functions | idem | idem (nessuna modifica a functions/rules) |
| PT / GYM (`qa-pt` e' PT) | avatar visibili in Avatar | - | - |
| Soccer (`qa-soccer`) | resta senza set (decisione 2: solo `qa-pt`); "Nessun avatar disponibile" | - | - |
| Lipedema | non ha area cliente (`hasClientLogin: false`, `modules.config.js:93`) | - | - |
| Org legacy `moduleType` null | non toccata | - | - |
| Seed (`scripts/seed-qa-orgs.mjs`) | Dopo AI 1: `ensureBaseClient` + `completeFirstAccess` portano il cliente di base a `mustChangePassword: false` in entrambi i rami; `ensureClientActivity` crea 3 slot passati + 1 futuro + 3 notifiche (2 non lette) per qa-pt e qa-soccer, id = marker `qa-seed-*`. Prima di AI 1: ramo "cliente esistente" (`:127-130`) aggiorna solo la password, ramo nuovo passa da `creaCliente` che scrive `mustChangePassword: true` (`functions/src/callable/creaCliente.js:142`); oggi nessun passaggio a `false` per il cliente (`:91` riguarda lo staff) | rifiuta altri progetti (`assertDevFirestore`, `:44`) | mai eseguito su prod |

## Tabella ambiente/modulo — STORY-048 (Home cliente)

La tabella e' nella story (`docs/BACKLOG.md`, STORY-048, in testa): rimando senza duplicarla. Verificata oggi
leggendo il codice: `hasClientLogin` PT/Soccer `true` (`modules.config.js:83,88`), lipedema `false` (`:93`); legacy
null → PT (`useAuth.js:22,26,30`); `routes.config.jsx:67` monta `ClientView` senza `terminology`; `ClientView.jsx:24-25`
rank BIA solo `bia_only`; `useClientRank.js:14-20` media da `stats`; `ClientDashboardPage.jsx:308,315,336` senza
`terminology`; `ClientWorkoutSection.jsx:52` "trainer" cablato; `ClientCalendar.jsx:56-69` fonte delle prossime sessioni;
`ClientBottomNav.jsx:202-211` badge Monete (solo nella barra desktop; la bottom nav mobile `:94-135` non lo ha:
la Home mobile lo mostra con un componente nuovo estratto da qui); `:100-126` campana mobile senza `aria-label`.
**Celle chiuse dal developer (13/11, lette nel codice prima di T1, nessuna cambia il piano):**
`routes.config.jsx:62` l'elemento della route `/client` riceve `helpers` = `{ org, terminology, refreshProfile }` da
`AppRouter.jsx:26` (`terminology` da `useAuth.js:22,26,30`, ma `undefined` finche' l'org non e' letta e `null` al logout
`useAuth.js:36,46`: il default dei parametri non copre `null`, per questo `resolveTerminology`); `PlanProgress` e' in
`src/features/client/client-dashboard/ClientWorkoutSection.jsx:76` (prima di T1, ora `:78`) e usa `terminology.session`
(`PlanProgress.jsx:26`) con default `DEFAULT_TERMINOLOGY` (`:13`); `DEFAULT_TERMINOLOGY = TERMINOLOGIES.personal_training`
a `modules.config.js:259`; GYM = blocco `gym` `modules.config.js:168-195` (Personal Trainer/Membro/Allenamento), scelto da
`getTerminology(moduleType, variant)` (`:379-382`, prima di T1) quando l'org ha `terminologyVariant: 'gym'`; in area
cliente non arrivava mai (BUG-008). Altri testi cablati trovati oltre l'AC: `TrophiesSection.jsx:246` "· Trainer" e
`:331` "Assegnato dal trainer", e `ClientDashboardPage.jsx:262` (`GoalsSection` senza `terminology`): corretti in T1.
Fuori dall'AC e non toccati: `ChangePasswordScreen.jsx:62` "ricevuta dal trainer" (schermata prima di `ClientView`),
titolo "Calendario allenamenti" `ClientDashboardPage.jsx:306` (cablato, corretto per PT/GYM/Soccer). Ordinamento notifiche:
GARANTITO dal service (`firebase/services/notifications.js:15`, `createdAt` ISO scritto dalle callable, es.
`chiudiSessione.js:153,172`); in T3 estratto in `utils/notifications.js` (`sortNotificationsNewestFirst`, senza data
valida in fondo) con test.
Nessuna cella dipende dall'ambiente (nessun `isDev`/`isUat`/`isProduction`). Il developer conferma la tabella prima di T1.

## Punti da confermare — risolti 2026-11-13
1. Push vs QA dal vivo: si segue il piano di sessione. Sviluppo con soli commit locali; a fine sprint push su `dev`
   (deploy.yml aggiorna hosting+rules dev), poi `qa:dev`, poi QA dal vivo (TP-089, AI 2, TP di STORY-048). Nessun
   deploy manuale a meta' sprint.
2. Monete/streak: **niente accredito manuale**. Il seed crea per il cliente di base uno slot passato (pianificato,
   non chiuso) nell'org `qa-pt`; la QA lo chiude via UI (`chiudiSessione`) e cosi' ottiene `coins` > 0 e
   `sessionStreak` >= 1 reali. Il seed non scrive `coins` ne' `sessionStreak`.
3. AI 4: la fa la sessione principale in `.claude/agents/*.md`. Verificato con `git ls-files`: gli agenti sono tracciati (ignorato e' solo `settings.json`), quindi entra nel commit.
4. BUG-034 richiede un account con `mustChangePassword: true`: si verifica con un cliente `E2E-…` creato dal wizard,
   non col cliente di base (che il seed porta a `false`).

## Passa al #21 — esito (dal #20)
- STORY-048: PRESA (voce 7; D1-D3 decise 2026-11-13). BUG-008: PRESO dentro STORY-048 (T1).
- BUG-034, BUG-035: PRESI (voci 2, 3) + BUG-036 nuovo (voce 4).
- Set avatar `qa-pt` (proposta del #20): PRESO, decisione 2 (voce 5, AI 1).
- AI 2: PRESO (voce 6). AI 4: PRESO (voce 1). AI 5: dentro STORY-048.
- STORY-049: RIMANDATA al #22. BUG-005: RIMANDATO (fuori).
- Invariati fuori sprint: STORY-050/051, STORY-029 (b)/(c), 3f, org GYM, UAT, rollback functions prod.

## Goal
L'area cliente e' provabile dal vivo su rankex-dev e la Home cliente mostra livello, striscia, prossima sessione, ultime
notifiche e Monete con la terminologia del modulo, misurata a 360 e 1366 px. **Raggiunto**, con tre verifiche non fatte
(vedi "Non verificato"). Prod `fitquest-60a09` invariata a `f086405`, `main` invariato, functions invariate (nessun file in
`functions/` ne' `firestore.rules` modificato nello sprint).

## Chiusura sprint

**Stato del repo a fine sprint (output di comandi, verificato dalla sessione principale il 2026-11-13):** push su
`origin/dev` `48370e1..bac03ee` (no force); CI 43410342276 success; deploy.yml 43410517819: `deploy-dev` success,
`deploy-prod` skipped, quindi hosting e rules rankex-dev a `bac03ee`. Ancora da pushare: `fcb5d72` (fix seed),
`aa5bde2` (spec Home) e la modifica non committata alla spec Home (controllo dei termini vietati solo su testata/STRISCIA/PROSSIMA).
Unit 718/718, lint e build ok. `qa:dev` completo su `bac03ee`: 56 passed, 6 failed, tutti in `clientHomeLayout` per errori
della spec (non dell'app); dopo `aa5bde2`: `clientHomeLayout` + `clientNotificationsLayout` 26/26, dopo l'ultima modifica terminologia 4/4.

### Completato
- **Voce 1 AI 4** (riga "precondizione QA" e "effetto visivo = una misura" in `scrum-master.md` e `developer.md`).
- **Voce 2 BUG-034** `122180b`, VERIFIED dal vivo (allievo `E2E-` dal wizard, 360 px, campi vuoti → "obbligatoria").
- **Voce 3 BUG-035** `438019b`, VERIFIED (lipedema "PROSSIMI APPUNTAMENTI", PT "PROSSIME SESSIONI").
- **Voce 4 BUG-036** `438019b`, VERIFIED (spec AI 2 a 360 + controprova su `aa84e73`).
- **Voce 5 AI 1** set avatar `qa-pt`, seed con primo accesso e dati QA. Seed lanciato su rankex-dev: 7 nuovi documenti al primo
  lancio, 0 al secondo (idempotente). TP-089 PASS a 360 e 1366 (dialog 328x303 dentro 360, un solo addebito al doppio click,
  saldo 30→0); **BUG-027 VERIFIED**.
- **Voce 6 AI 2** spec `clientNotificationsLayout.spec.js`; controprova su copia di `aa84e73` fallisce 2/2: la spec rileva BUG-033/036.
- **Voce 7 STORY-048** Home cliente T1..T7 (`57b6c30`, `9029bd1`, `828a3db`, `1bcf1a0`, `b750c1b`, `0c1c19b`, `b9685d6`) + fix spec `aa5bde2`.
  TP-094 PASS su qa-pt e qa-soccer a 360 e 1366 (Monete in alto a destra, Categoria solo PT, PROSSIMA/PROSSIMO col genere, max 2
  notifiche, VEDI TUTTE; allievo nuovo: "0 MONETE", STRISCIA 0 "XP ×1,1", "Nessun allenamento in programma", "Nessuna notifica").
  Controprova su copia di `aa5bde2` senza `grid-cols-2`: "stessa riga" 4/4 FAIL (44,5 px a 360, 101,5 a 1366). **BUG-008 VERIFIED**
  (soccer e PT).
- **Fuori voce `fcb5d72`:** `calendarUtils` importava `../constants/slotStatus` senza `.js`: `npm run qa:dev:seed` sotto Node falliva con
  `ERR_MODULE_NOT_FOUND`. Regressione di `56684a6` (Sprint #20): il seed non era mai stato lanciato dopo quel commit.
- Dati di test: da trainer chiusi 3 slot passati del cliente di base qa-pt (10, 11, 12 nov) e 1 dell'allievo qa-soccer (10 nov) → qa-pt
  30 MONETE / striscia 3 / "XP ×1,4"; qa-soccer 10 MONETE / striscia 1 / "XP ×1,2". Creato 1 allievo `E2E-` (BUG-034).

### Non completato (motivo)
- Nessuna voce pianificata e' rimasta fuori. STORY-049 e BUG-005 erano rimandati al #22 gia' all'apertura.

### Non verificato
| Cosa | Motivo / stato |
|------|----------------|
| Terminologia GYM (BUG-008, TP-094 passo 4) | nessuna org QA GYM (decisione gia' accettata: prima org GYM reale) |
| "Assegnato dal coach" su un badge manuale | nessun badge assegnato nei dati QA |
| Stato errore della Home ("Impossibile caricare" + RIPROVA) | **non riproducibile come scritto**: con la rete offline la Home mostra i dati dalla cache di Firestore (0 errori, 0 RIPROVA). Passo di TP-094 corretto in `src/config/runbook.config.js`: simulare bloccando `firestore.googleapis.com` (Network request blocking) PRIMA del caricamento. Verificato solo da codice/unit |
| Controprova AI 2, parte titolo/Chiudi (variante col localizzatore per icona) | non eseguita; eseguita la parte campana |
| 3f, UAT, rollback functions prod, STORY-029 (b)/(c) | invariati (gia' accettati) |

### Blockers
- Nessun blocco sul codice. STORY-029 (b)/(c) resta requisito non di codice, bloccante solo per attivare lipedema in prod.
- BUG-037 richiede modifica e deploy delle functions (non era nel perimetro del #21: vincolo "nessun file in `functions/`").

### Tech debt emerso
- **Seed rotto da `56684a6` senza che nessun test lo rilevasse:** `scripts/seed-qa-orgs.mjs` gira sotto Node (ESM nativo) e importa `src/`;
  Vitest/Vite accettano import senza estensione, Node no. Visto solo al primo lancio reale, un intero sprint dopo. Candidato: un controllo
  (anche solo l'import del seed o `node --check` in CI/`check:*`) per gli script che importano da `src/`.
- **Spec `qa:dev` scritte senza essere eseguite sbagliano al primo run reale:** su 2 spec nuove (notifiche, Home) la Home ha avuto 2 errori
  della spec e non dell'app (6 test rossi su 62): STRISCIA misurato senza scorrere (`scrollIntoViewIfNeeded` non scorre un elemento
  parzialmente visibile sotto la bottom nav fissa) e regex di inizio parola contro textContent "ProssimaSAB 14 NOV". Per la spec notifiche
  non risultano errori nei fatti ricevuti. Ipotesi da confermare in retro, non conclusa: regola "una spec si lancia almeno una volta
  sull'hosting prima del commit" nel processo del developer.
- **Riferimento BUG-037 da allineare:** la sessione principale cita "BUG-037" per il controllo dei termini vietati della spec Home (modifica
  non committata); in BUGS.md BUG-037 e' la notifica di `chiudiSessione`. Correggere il riferimento nel messaggio di commit.
- Bug nuovi (P3 S, OPEN): **BUG-037** (notifica `chiudiSessione` senza terminologia del modulo e con data ISO grezza, "Sessione del
  2026-11-10 completata! +55 XP (streak 1)" anche per soccer; richiede deploy functions) e **BUG-038** (descrizioni dei trofei in soccer con
  "sessione/sessioni di allenamento", testi fissi nel config dei badge).
- Osservazione (non bug): la PROSSIMA come bottone ha textContent "ProssimaSAB 14 NOV · 18:15 – 19:00": il nome accessibile unisce titolo
  e data senza separatore; migliorabile con `aria-label`.

### Verificato / non verificato (per ambiente)

| Voce | In dev (rankex-dev) | In prod (fitquest-60a09) | Non verificato |
|------|---------------------|--------------------------|----------------|
| BUG-034/035/036 | VERIFIED dal vivo a `bac03ee` | non toccata | - |
| AI 1 / TP-089 / BUG-027 | PASS a 360 e 1366, VERIFIED | non toccata (il set `qa-pt` va in prod col prossimo rilascio, voce inerte) | - |
| AI 2 spec notifiche | verde, controprova 2/2 FAIL su `aa84e73` | n/a | parte titolo/Chiudi della controprova |
| STORY-048 / TP-094 / BUG-008 | PASS qa-pt e qa-soccer a 360 e 1366; spec Home verde | non toccata | GYM, "Assegnato dal coach", stato errore |
| Functions / rules | invariate (`5090d9a`, nessun deploy) | invariate a `f086405` | - |

### Passa al #22
Candidati, in ordine consigliato (il PO decide le priorita', il Tech Lead la fattibilita'):
- **STORY-049** Test a righe e fix a 360 px (rimandata dal #21).
- **BUG-037** (P3 S): testo della notifica `chiudiSessione` con terminologia del modulo e data leggibile; modifica functions, review
  medium, deploy prima dev poi (con via libera) prod.
- **BUG-038** (P3 S): descrizioni dei trofei con la terminologia del modulo.
- **BUG-005** (P3, soccer: tab BIA), rimandato.
- Miglioramento a11y: `aria-label` sulla PROSSIMA della Home.
- Tech debt: controllo che il seed/gli script Node che importano `src/` partano; regola "spec lanciata una volta prima del commit".
- **Da decidere (utente):** release `dev → main` (prod ferma a `f086405`): contiene il set avatar `qa-pt` (inerte in prod) e STORY-045..048;
  se si rilascia, pre-flight completo e, se si include BUG-037, functions prima del merge.
Fuori sprint: STORY-050, STORY-051 (rules/functions, review HIGH), STORY-029 (b)/(c), 3f, org GYM, UAT, rollback functions prod (TD-015).
Operativo: push di `fcb5d72`, `aa5bde2` e della spec Home modificata su `dev` (via libera); poi `qa:dev` da rilanciare (mai in parallelo
a un deploy hosting).

## Retrospettiva
Dati (da `git log 48370e1..aac9e52` e dai blocchi sopra): 17 commit = 12 di codice/test (BUG-034, BUG-035/036, set avatar +
seed, spec notifiche, STORY-048 T1-T6 con refactor, fix seed `fcb5d72`, 2 fix di spec) e 5 docs (apertura, AI 4, runbook TP-094,
voce 7, chiusura); voci 1-7 tutte DONE, 0 non completate; bug: 5 chiusi VERIFIED (008, 027, 034, 035, 036), 2 nuovi OPEN P3
(037, 038); unit 718/718; `qa:dev` su `bac03ee` 56 passed / 6 failed (tutti errori di spec), poi 26/26 e 4/4; 0 deploy in prod,
`main` e functions invariati. Rework: 3 (`fcb5d72`, `aa5bde2`, `5de1fa6`) + 1 controprova ripetuta + 1 agente rilanciato.
Non verificato: GYM, "Assegnato dal coach", stato errore Home, controprova titolo/Chiudi, tempi.

**Verifica dei 5 action item del #20**
1. Area cliente provabile (avatar `qa-pt` + seed): **raggiunto.** Seed idempotente (7 documenti poi 0), TP-089 PASS a 360 e 1366,
   BUG-027 VERIFIED. Scoperto di passaggio che il seed era rotto da `56684a6` (vedi sotto).
2. Spec di layout del pannello notifiche: **raggiunto, con limite.** Verde su HEAD, controprova su `aa84e73` 2/2 FAIL, ma solo
   sulla parte campana (BUG-036); la parte titolo/Chiudi (BUG-032) non e' stata riprovata.
3. BUG-034/035: **raggiunto.** `122180b` (test Vitest che fallisce prima del fix), `438019b`, entrambi VERIFIED dal vivo.
4. Regola "precondizione QA" + "effetto visivo = una misura": **raggiunto.** Scritta in `scrum-master.md:20-21` e
   `developer.md:30,32`; 0 casi TP- BLOCCATI per precondizione. Non ha pero' coperto la fattibilita' del passo (TP-094 errore).
5. STORY-048 misurata a 360/1366 prima della review: **raggiunto sul fatto, non sul processo.** Spec Home 24 test verde a
   360 e 1366, controprova `grid-cols-2` 4/4 FAIL, 0 bug di layout nuovi (BUG-037/038 sono testi). Che la review citi
   l'esito della spec: non verificato nei docs. La spec pero' e' stata scritta senza lanciarla e ha sbagliato al primo run.

**WHAT WENT WELL**
- Tutte le 7 voci DONE, 5 bug VERIFIED dal vivo, STORY-048 consegnata con terminologia corretta e controprova. Causa: AC con
  "fatto quando" misurabile e righe "precondizione QA" (AI 4) che hanno evitato blocchi: il seed forniva i dati, nessun TP- bloccato.
- Le spec di layout (AI 2, T6) sono utili a scoprire e provare i difetti: controprova con difetto reintrodotto fallisce. Causa:
  misure con boundingBox al posto di giudizio a vista (regola AI 4).
- La QA dal vivo ha trovato 3 cose che il codice letto non mostrava (BUG-037, seed rotto, passo offline infattibile).

**WHAT WENT WRONG / CAUSED BUGS**
- Seed `qa:dev` rotto da `56684a6` (Sprint #20), scoperto un sprint dopo. ROOT CAUSE: `scripts/seed-qa-orgs.mjs` gira in Node ESM
  nativo e importa da `src/`; Vitest/Vite accettano import senza `.js`, Node no, e nessun test o CI esegue gli script Node che
  importano da `src/`. Stessa classe del problema `indexImport.test.js` delle functions (Vitest permissivo, Node no), non estesa
  agli script. IMPACT: seed inutilizzabile per 1 sprint, `fcb5d72` di rework; scoperto solo perche' AI 1 lo ha lanciato. ACTION: azione 1.
- BUG-037 (notifica server "Sessione del 2026-11-10 completata!" anche per soccer) visto solo dal vivo. ROOT CAUSE: BUG-008 era
  stato analizzato solo sul client; la terminologia e' una duplicazione di testi in 3 luoghi (client, `config/badges.config.js`,
  `functions/`) e l'AC diceva "area cliente" senza un inventario dei testi cablati fuori da `src/features/client`. BUG-038 (trofei)
  e' la stessa famiglia, trovato nello stesso modo. IMPACT: P3, 2 bug nuovi aperti, BUG-037 richiede deploy functions (fuori
  perimetro #21). ACTION: azione 4.
- Il passo TP-094 "rete offline → stato errore" non e' riproducibile (la cache di Firestore risponde). ROOT CAUSE: il passo e' stato
  scritto negli AC senza provarne la fattibilita'; AI 4 chiede la precondizione dei dati, non che il passo si possa eseguire.
  IMPACT: stato errore della Home non verificato dal vivo, passo corretto a fine sprint (blocco della richiesta a
  `firestore.googleapis.com`, ancora non provato). ACTION: azione 3.

**WHAT WAS SLOW / CAUSED REWORK**
- 2 spec su 2 scritte senza poterle eseguire (la suite gira solo contro l'hosting deployato, a fine sprint): la spec notifiche e'
  passata al primo run, la Home no (6/62 rossi, 2 errori di spec: `scrollIntoViewIfNeeded` che non scorre sotto la bottom nav fissa,
  regex `\b` contro textContent senza spazio) = `aa5bde2`, `5de1fa6`. ROOT CAUSE: il ciclo spec → feedback e' lungo per scelta
  (push + deploy dev a fine sprint) e il primo run reale avviene a codice finito; i trucchi di misura (scroll al centro, testo
  del nome accessibile) non sono in un helper provato. Gli errori erano di spec, non dell'app: costo = 2 commit e un secondo giro di `qa:dev`.
- Controprova Home invalidata al primo tentativo: un `vite preview` precedente teneva la porta 4173 (TaskStop non uccide il node
  figlio), quindi la build mostrata non era quella della copia. Ripetuta dopo aver fermato il processo. ROOT CAUSE: la procedura
  di controprova (note AI 2/T6) non ha il passo "verificare che la porta sia libera e che il server serva la build della copia".
  Un falso risultato (la controprova che "passa" o "fallisce" sulla build sbagliata) e' il rischio, qui intercettato.
- Un agente developer interrotto da errore API 403 senza modifiche, rilanciato: causa esterna, nessuna azione.

**WHAT CREATED TECHNICAL DEBT**
- Nessun TD in TECH-DEBT.md; debito emerso (vedi "Tech debt emerso"): script Node che importano `src/` senza controllo, passi
  di spec non provati, testi di terminologia fissi nel config dei badge e nelle callable (BUG-037/038), `aria-label` della PROSSIMA.
- Il riferimento "BUG-037" nel messaggio di `5de1fa6` e' corretto (ricontrollato dalla sessione principale): il controllo dei
  termini e' stato ristretto proprio perche' il testo della notifica scritto da `chiudiSessione` (BUG-037) dice "Sessione" anche per soccer.

**ACTION ITEM per lo Sprint #22** (max 5; vincoli: nessun deploy in prod senza via libera, `main` a `f086405`)
1. **Controllo che gli script Node con import da `src/` partano (developer, ~1 h).** Test in `functions/test/` o `npm run
   check:node-imports` che esegue `import()` con il loader nativo di Node di `scripts/seed-qa-orgs.mjs` (senza lanciarlo contro
   Firebase: serve solo che la risoluzione dei moduli riesca) e di ogni `scripts/*.mjs` che importa da `src/`, agganciato a CI.
   *Fatto quando:* sul commit `56684a6` (copia/worktree esterno) esce con exit 1 per `ERR_MODULE_NOT_FOUND`, su HEAD con 0; il
   comando e' in `ci.yml` o nel pre-flight di CLAUDE.md.
2. **Spec nuova = lanciata una volta prima del commit, con helper di misura provati (developer + scrum-master, ~1 h).** Regola
   in `developer.md`/`scrum-master.md`: ogni spec `qa:dev` nuova va lanciata almeno una volta sull'hosting dev (push + deploy-dev
   intermedio pianificato come voce) prima della review; gli helper `scrollToCenter`/lettura del nome accessibile in
   `e2e/qa-dev/tests/layoutHelpers.js` con commento sul perche'. *Fatto quando:* a fine #22 le spec nuove hanno 0 test rossi per
   errore di spec al primo `qa:dev` di sprint (conteggio citato in chiusura) e la regola e' nei due file.
3. **Fattibilita' dei passi prima di READY (scrum-master + qa-engineer, ~1 h).** Ogni AC/caso `TP-` che simula condizioni di rete,
   permessi o errori riporta "come si simula" e l'ha provato una volta prima di READY. Subito: provare il passo corretto di
   TP-094 (blocco `firestore.googleapis.com` prima del caricamento) sulla Home. *Fatto quando:* TP-094 passo errore e'
   PASS o BLOCCATO con motivo scritto in `runbook.config.js`, e 0 passi di AC/TP- del #22 corretti a posteriori per infattibilita'.
4. **Terminologia del modulo: BUG-037 + BUG-038 con un inventario, non caso per caso (developer, ~2 h, review medium).** Prima un
   `grep` dei testi cablati ("sessione", "trainer", "cliente", "allenamento") in `functions/src/callable`, `functions/src/shared`
   e `src/config/badges.config.js`, elenco in BUGS.md; poi fix di BUG-037 (testo di `chiudiSessione`, data leggibile, deploy
   prima su rankex-dev) e BUG-038, con un test che fallisce se un testo soccer contiene la terminologia PT. *Fatto quando:*
   BUG-037 e BUG-038 FIXED con test (fallisce prima del fix), inventario in BUGS.md con ogni voce residua come bug o "accettato",
   `functions` non deployato in prod senza via libera.
5. **Controprova su copia affidabile (developer, ~30 min).** Aggiungere alle note di controprova (e allo script se utile) il passo
   "porta 4173 libera prima (`netstat`/`Get-NetTCPConnection`) e dopo il build la pagina servita contiene lo sha/hash della copia";
   fermare il processo node figlio e non solo il task. *Fatto quando:* la prossima controprova del #22 cita l'output del controllo
   della porta e non ci sono controprove ripetute per porta occupata.

---

Sprint #20 e precedenti: `docs/SPRINT-ARCHIVE.md` (spostati il 2026-11-13, contenuto invariato).
