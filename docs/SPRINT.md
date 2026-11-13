# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

# SPRINT #21 — EPIC-011 Area cliente, parte 2 (Home cliente + action item del #20) — aperto il 2026-11-13

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
| 2 | BUG-034 | Cambio password a campi vuoti: messaggio fuorviante (`ChangePasswordScreen.jsx:16-25`) | S | FIXED `122180b` (test Vitest; "fallisce prima" provato in scratchpad con node); verifica dal vivo a fine sprint | - |
| 3 | BUG-035 | "PROSSIME APPUNTAMENTI" in lipedema (`ClientCalendar.jsx:105`) | S | FIXED `438019b`; verifica dal vivo a fine sprint | - |
| 4 | BUG-036 | Campana mobile senza `aria-label` (`ClientBottomNav.jsx:100`) | S | FIXED `438019b`; verifica dal vivo a fine sprint | - |
| 5 | AI 1 | Set avatar `qa-pt` + seed: cliente di base con primo accesso fatto + dati QA; poi TP-089 dal vivo, BUG-027 VERIFIED | S/M | CODICE FATTO (commit sotto): avatar `qa_pt_01..09`, seed con primo accesso + slot/notifiche `qaSeedMarker` (`e2e/qa-dev/qaSeedData.js`); seed, TP-089 e BUG-027 dal vivo a fine sprint | 2-4 non bloccano; il TP-089 dal vivo richiede hosting dev aggiornato |
| 6 | AI 2 | Spec Playwright di layout del pannello notifiche cliente a 360/1366 in `e2e/qa-dev/tests/` + controprova su copia di `aa84e73` | M | READY | AI 1 (cliente col primo accesso fatto e >= 1 notifica non letta) |
| 7 | STORY-048 | Home cliente (T1..T7, incluso BUG-008) | M/L | READY, ma T6/T7 e il caso `TP-` partono solo dopo AI 1 e AI 2 | AI 1, AI 2 (T6 estende la spec di AI 2) |

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
**Celle non verificate:** `routes.config.jsx:62` (helpers: letto, ma la nota "la hanno gia' helpers" non e'
controllata riga per riga); `ClientWorkoutSection.jsx:76` (`PlanProgress`, la ricerca non l'ha trovato: da
riverificare dal developer prima di T1); `modules.config.js:259` `DEFAULT_TERMINOLOGY` (la ricerca non ha restituito
la definizione: da riverificare); testo GYM "Personal Trainer/Membro" mostrato in area cliente (letto solo
`modules.config.js:169-170`); ordinamento delle notifiche del service (dichiarato non verificato nelle AC).
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

---

## Sprint chiuso (storico)

# SPRINT #20 — EPIC-011 Area cliente allineata al canvas + action item del #19 — aperto il 2026-11-12, chiuso il 2026-11-13 (goal raggiunto; TP-089 e BUG-027 non verificati dal vivo)

**Branch:** `feature/lipedema-module`. All'apertura HEAD `ab65b45` = `origin/dev`; poi commit locale `0d06a5c` (docs
backlog EPIC-011 + BUG-027..031); il commit di apertura di questo sprint e' il secondo. Nessun push. `lipidemia/` e
`mobile-app/` untracked e non si committano; stash "lipedema docs" da non toccare; branch locale `dev` fermo a
`f086405`, ignorato. Nessun deploy su `fitquest-60a09`. Deploy hosting su rankex-dev solo a fine sprint, con via
libera dell'utente, mai durante `qa:dev`.

**Goal:** chiudere i difetti dell'area cliente a rischio (acquisto avatar senza conferma, pannello notifiche e
navigazione non accessibili, calendario con stati sbagliati) e gli action item del #19 che sono codice (checkPrev,
check:deny, BUG-026), con QA dal vivo su rankex-dev a 1366 px e 360x640.

**Situazione iniziale (verificata con git il 2026-11-12/13):**
- CI ed E2E di `ab65b45` verdi; "Deploy to Firebase" run 43273458102: `deploy-dev` success, `deploy-prod` skipped.
- `origin/main` = `f086405`. Prod `fitquest-60a09` a `f086405` (functions, hosting, rules; 40 callable nodejs22).
  rankex-dev: functions, hosting e rules a `5090d9a` (dopo, solo docs).
- `docs/BUGS.md`: nessun P0/P1 aperto. OPEN: BUG-005 P3, BUG-008 P3, BUG-026 P3, BUG-027 P2, BUG-028 P2, BUG-029 P3,
  BUG-030 P2, BUG-031 P3. `docs/TECH-DEBT.md`: TD-014, TD-015 OPEN.
- Non verificato e accettato dal #19: 3f (rinviato al primo onboarding reale in prod), org QA GYM (rinviata alla
  prima org GYM reale), UAT inesistente, rollback functions prod solo fix forward (TD-015).

**Decisioni prese (2026-11-12, utente; la riga 9 e' una scelta dello scrum-master, dichiarata):**

| # | Decisione |
|---|-----------|
| 1 | AI 3 (TD-014): copia tracciata dei deny in `docs/git-deny.json` + `scripts/check-deny.mjs` + `npm run check:deny` (exit 1 se un pattern della copia manca da `permissions.deny` di `.claude/settings.json`, 0 altrimenti). Controprova su un settings di prova nello scratchpad, mai sul file vero. TD-014 aggiornato: chiuso il "non tracciato", resta OPEN per i buchi noti |
| 2 | AI 4 (org QA GYM) sostituito dalla story "negozio avatar sicuro" (STORY-045). GYM: "rinviata alla prima org GYM reale" |
| 3 | AI 5: STORY-029 (b)/(c) rinviato al contratto con la prima org Lipedema; 3f rinviato al primo onboarding reale in prod (gia' in #19 e BACKLOG) |
| 4 | Centro del pentagono: resta l'avatar; rank/media al centro col #21 (STORY-048) |
| 5 | Peso inserito dal cliente: fuori dal #20 (STORY-050, backlog senza sprint) |
| 6 | Sblocco avatar per rank: fuori dal #20 (STORY-051, backlog senza sprint) |
| 7 | Schermate solo nel codice (Scarica dati, Attivita', BIA cliente, reset password): le disegna l'utente sul canvas in parallelo; nessuna voce. Canvas in sola lettura per gli agenti |
| 8 | Composizione: voce 1 checkPrev (AI 1) · voce 2 check:deny (AI 3) · voce 3 STORY-045 (assorbe BUG-027) · voce 4 STORY-046 (assorbe BUG-030 e BUG-031 punti 1 e 4) · voce 5 STORY-047 (assorbe BUG-028). Bug S fuori voce: BUG-026 (AI 2, con caso TP-), BUG-029, BUG-031 punti 2 e 3 (fix di una riga, pipeline saltata). STORY-048/049 solo backlog per il #21 |
| 9 | (scrum-master) STORY-047: riepilogo mese senza sessioni chiuse mostra "0 / 0" (scelta PO, gia' nell'AC); terminologia del modulo nell'area cliente resta BUG-008, fuori sprint |

**Voci, nell'ordine (consigliato: 1, 2, BUG-026, 3, 4, 5, bug S):**
0. **Apertura sprint** (questo commit di docs). DONE.
1. **checkPrev (AI 1).** `functions/scripts/checkPrev.mjs <sha>`, Node puro, nessuna dipendenza: stampa `engines.node`
   di `<sha>` (`git show <sha>:functions/package.json`) e di HEAD; exit 1 con motivo se il runtime di `<sha>` e'
   dismesso o diverso da quello atteso (`nodejs22`), 0 altrimenti; sha inesistente o JSON illeggibile = exit 1. Test
   Vitest in `functions/test/` (logica pura separata, come `deployGuardLib.mjs`). Citato nella checklist di rollback
   di CLAUDE.md (riga "Prev functions", sezione "Da annotare in CHANGELOG prima di ogni deploy prod",
   CLAUDE.md:1203-1208) e nella regola di `.claude/agents/developer.md` e `scrum-master.md` ("sha, runtime, versione =
   output di un comando, non conferma verbale"). *Fatto quando:* `node functions/scripts/checkPrev.mjs 744f6f9` esce 1
   (`engines.node` = 20), `... f086405` esce 0 (`engines.node` = 22), citato nei 3 file. **Review medium.**
2. **check:deny (AI 3).** `docs/git-deny.json` (copia dei 72 pattern di `permissions.deny`), `scripts/check-deny.mjs`
   (logica pura testata; dove stia il test, `src/__tests__/` o accanto allo script, lo sceglie il developer e lo
   dichiara), script `check:deny` in `package.json`. *Fatto quando:* `npm run check:deny` esce 0 oggi sul file vero
   (sola lettura) ed esce 1 su un settings di prova nello scratchpad con un pattern tolto; TD-014 aggiornato.
   **Review medium.**
3. **BUG-026 (AI 2).** Banner RICARICA (`src/app/App.jsx:54-67`, `fixed bottom-5`) che non copre "Password
   dimenticata?" (`src/features/auth/components/LoginForm.jsx:75-84`) a 360x640. Caso `TP-` in
   `src/config/runbook.config.js` (ultimo caso oggi TP-087, riga 1313). *Fatto quando:* a 360x640 su rankex-dev il
   link e' cliccabile col banner visibile, BUG-026 FIXED. **Review medium.**
4. **STORY-045** negozio avatar sicuro (AC in BACKLOG; assorbe BUG-027). Callable `acquistaAvatar` invariata.
   **Review medium.**
5. **STORY-046** accessibilita' e navigazione area cliente (AC in BACKLOG; assorbe BUG-030 e BUG-031 punti 1 e 4).
   **Review medium.**
6. **STORY-047** calendario cliente (AC in BACKLOG; assorbe BUG-028), con test Vitest della funzione pura di stato
   slot. **Review medium.**
7. **Bug S fuori voce** (pipeline saltata, un commit): BUG-029 (`src/features/client/client-view/ClientHub.jsx:199`,
   `:277`), BUG-031 punto 2 (`src/features/client/client-dashboard/NotesSection.jsx:90`, montata readonly in
   `ClientDashboardPage.jsx:337`) e punto 3 (`src/features/client/client-dashboard/GoalsSection.jsx:161`).
8. **Fine sprint.** Deploy hosting su rankex-dev (`npm run deploy:app:dev`, via libera dell'utente, mai durante
   `qa:dev`), QA dal vivo su rankex-app-dev.web.app con le utenze `qadev.pt.*` e il cliente di base di `qa-pt`
   ("QA Cliente PT"), a 1366 px e 360x640: "Password dimenticata?" col banner, conferma acquisto con saldo, pannello
   notifiche da tastiera, calendario con sessione assente/saltata, vetrina Trofei e barre StatsSection a 360 px
   (osservazione per STORY-049). Esiti qui, bug nuovi in BUGS.md.

**Tabelle ambiente/modulo (regola CLAUDE.md "Voci con comportamento per ambiente o modulo"; file:riga verificati il
2026-11-13 su `0d06a5c`):**

Ambiente: nessuna voce tocca codice condizionato da ambiente (`grep isDev|isProduction|isUat` su
`src/features/client`, `src/features/notification`, `src/features/auth`, `src/app/App.jsx`,
`src/hooks/useVersionCheck.js` = 0 risultati).

| Voce | dev (rankex-dev) | UAT | prod (fitquest-60a09) |
|------|------------------|-----|-----------------------|
| Tutte | deploy hosting a fine sprint (`npm run deploy:app:dev`) | nessun progetto/hosting nel repo (`.firebaserc:5-18`): non verificato | non toccata (main a `f086405`, nessun deploy) |
| 1 checkPrev | n/a (script locale di sola lettura git) | n/a | non eseguito, nessun accesso: serve alla checklist di rollback prod, legge solo il commit |
| 2 check:deny | n/a (locale; nessun ambiente Firebase) | n/a | n/a; `.claude/settings.json` non tracciato (`.gitignore:21-22` `.claude/*` + `!.claude/agents/`): vale solo su questa macchina |
| BUG-026 | banner indipendente da ambiente e modulo (`App.jsx:21` `useVersionCheck`, `useVersionCheck.js:3` `POLL_MS` 5 min); osservabile solo su rankex-dev dopo il deploy di fine sprint | non verificato | non osservato |

| Voci 3-5 e bug S, per modulo | Comportamento / riferimenti |
|------------------------------|-----------------------------|
| Area cliente (ruolo `client`) | Raggiungibile solo dal ruolo `client`: `src/app/routes.config.jsx:60-70`, `ClientView` a riga 67, `ChangePasswordScreen` se `mustChangePassword` |
| PT (e GYM) | `hasClientLogin` true (`src/config/modules.config.js:83`). GYM = `personal_training` con `terminologyVariant` gym: stesso codice di PT; nessuna org QA GYM: non verificato (rinviato alla prima org GYM reale) |
| Soccer | `hasClientLogin` true (`modules.config.js:88`) |
| Lipedema | `hasClientLogin` false (`modules.config.js:93`): nessun account paziente, le voci non lo toccano. STORY-047 tocca anche la vista trainer del cliente (`src/features/client/ClientDashboard.jsx:477`): verificato il 2026-11-13: il tab calendario e' visibile anche in lipedema (`src/features/client/client-dashboard/dashboardTabs.js:16`, nessuna capability; montato a `ClientDashboard.jsx:473-479` con `terminology`). Gli stati completata/assente/saltata/pianificata e le prossime valgono anche per gli Appuntamenti; STRISCIA, moltiplicatore XP e stima "+N XP" solo con `hasGamification` (lipedema false, `modules.config.js:93`). Oggi la stima XP non compare nella vista trainer perche' `ClientCalendar` non riceve `clients` (`ClientCalendar.jsx:32`, `:102`) |
| Legacy `moduleType` null | Mappato a PT nei punti di ingresso trainer (CLAUDE.md "Capability per modulo"); l'area cliente non ramifica sul modulo: stesso comportamento di PT |
| STORY-045 | Monete/negozio solo con `hasGamification`; la callable `acquistaAvatar` rifiuta lipedema (`functions/src/callable/acquistaAvatar.js`, `requireCapability(..., 'hasGamification')`) |
| BUG-031 punto 3 (`GoalsSection`) | Obiettivi solo con `hasGoals`: PT/Soccer true, Lipedema false (`modules.config.js:83/88/93`) |

**Casi limite da tracciare per ogni voce:**
- **360 px** su ogni voce UI (banner, dialog acquisto, pannello notifiche, griglia calendario, card riepilogo).
- **Doppio click/tap:** acquisto (bottone in `loading`), Invio in cambio password.
- **Esc con dialog sopra il pannello notifiche:** `useEscapeKey` a pila, un Esc chiude solo l'ultimo livello.
- **Fuso orario e mezzanotte** per "oggi" nel calendario (`toLocalDateStr`).
- **Slot senza `attendees`/`absentees`** (documenti vecchi): la funzione pura di stato deve reggere.
- **Mese a cavallo** per "prossime sessioni": `getClientSlots` carica solo il mese; seconda query da oggi a +N giorni
  (scelta developer/tech-lead).
- **check:deny** con settings senza `permissions` o JSON malformato: exit 1. **checkPrev** con sha inesistente: exit 1.
- **Windows PowerShell e Git Bash** per gli script (Node puro, niente sintassi di shell).
- **Ruoli** `staff_readonly`/`trainer`/`org_admin`: la vista trainer del calendario (`ClientDashboard.jsx:477`) deve
  restare coerente con quella del cliente.

**Dipendenze bloccanti segnalate:**
- Nessuna Cloud Function nuova o modificata, nessuna modifica a `firestore.rules`: nessun deploy functions/rules.
- Deploy hosting dev e push su `dev` solo con via libera dell'utente. Nessun deploy su `fitquest-60a09`.
- STORY-048/049 (e 050/051) fuori sprint: 048/049 in bozza per il #21; 050/051 richiedono rules/functions.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| 0. Apertura sprint (docs) | DONE | questo commit |
| 1. checkPrev (AI 1) | DONE | review medium APPROVED (2 LOW: costante inutilizzata tolta; `process` no-undef come in `deployGuard.test.js`, `functions/` fuori da `eslint src`). `744f6f9` exit 1, `f086405` exit 0 (Git Bash e PowerShell); test d'integrazione su repo temporaneo (CI shallow, `ci.yml:14`); functions 252/252 |
| 2. check:deny (AI 3) | DONE | review medium APPROVED (4 LOW, nessuna azione; a capo in CLAUDE.md corretto). `npm run check:deny` 72/72 exit 0 sul file vero; copia nello scratchpad senza `Bash(git checkout HEAD*)` → exit 1 (Bash e PowerShell); TD-014 aggiornato (resta OPEN per i buchi noti); unit 664/664, lint ok. Fuori voce: `goals.test.js` falliva tra 00:00 e 01:00 (UTC vs data locale nel test), corretto in `597540a` |
| BUG-026 (AI 2) | DONE | codice fatto: sotto `lg` banner in alto (`top-16`, sotto l'header mobile trainer `AppNav.jsx:99`), da `lg` in basso come prima; `max-w-[calc(100vw-1.5rem)]`. Review medium nella sessione principale: nessun finding. Caso TP-088. Lint, unit 664/664, build ok. Rischio noto: in area cliente a 360 px può coprire in parte la sub-tab bar finché non si preme RICARICA. Da osservare in QA dal vivo (TP-088) |
| 3. STORY-045 negozio avatar sicuro | DONE (codice; BUG-027 non verificato dal vivo) | codice fatto: ACQUISTA apre ConfirmDialog (prezzo, saldo, dopo), conferma una volta sola (`loading`), badge "N MONETE" nella barra desktop; prop opt-in `largeTargets` di ConfirmDialog per bottoni ≥ 44 px (gli altri dialog invariati). Review medium nella sessione principale. TP-089. Lint, unit 664/664, build ok |
| 4. STORY-046 a11y + navigazione | DONE | codice fatto: pannello notifiche role=dialog + focus trap + Esc + focus di ritorno alla campana, apertura non segna lette, bottone esplicito "Segna tutte come lette" (44 px, disabilitato durante la chiamata); cambio password in <form> con guard sul doppio Invio; login con name/autoComplete. Review medium nella sessione principale. TP-090, TP-091. Lint, unit 664/664, build ok |
| 5. STORY-047 calendario cliente | DONE | codice fatto: `getClientSlotState` (skipped > completed > absent > planned), `calcClientMonthSummary`, `formatUpcomingDate` (ora locale), `calcStreakMultiplier` estratto (XP invariato, copia server non toccata); `getUpcomingClientSlots` sola lettura (stessi campi di `getClientSlots`: indice e rule esistenti); legenda a 4 stati, PROSSIME (max 3), PRESENZE, STRISCIA solo con `hasGamification`; `calcMonthlyCompletion` rimossa (unico uso). Review medium APPROVED (7 LOW; fetch limit alzato a 20). TP-092. Unit 675/675, lint ok |
| Bug S: BUG-029, BUG-031 p.2 e 3 | DONE | pipeline saltata: BUG-029 `5867bc5` (token `--rx-*` in ClientHub); BUG-031 p.2 (note vuote: testo per cliente/staff in sola lettura) e p.3 (obiettivi: termine del modulo, prop `isClientView`/`terminology`) nel commit successivo. TP-093 |
| QA dal vivo + deploy hosting dev | DONE | deploy-dev `f42278f` OK, `qa:dev` 36/36; QA dal vivo 2026-11-13 (blocco "QA dal vivo" sotto): TP-088/091/092/093 PASS, TP-090 parziale (BUG-032 P3), TP-089 bloccato (nessun set avatar per qa-pt) |
| Fuori voce: BUG-032, BUG-033 (trovati dalla QA, P3 S) | DONE | `353acfa` + fix di review `f31a2a6` (chiudi prima di "Segna tutte" nel DOM); review medium nella sessione principale; lint, unit 675/675, build ok; push su dev: CI, E2E, deploy-dev success; ricontrollo TP-090 PASS, VERIFIED |
| Chiusura sprint | DONE | blocco "Chiusura sprint" sotto; docs `c6a1ba3`, `f8b0ef8` e il commit di chiusura locali, non pushati |

**Rischi:** (1) STORY-047 e' la piu' grande (taglia M, forse una query aggiuntiva per il mese successivo): se
scivola, si chiude con stati distinti + riepilogo e le "prossime sessioni" restano al #21, decisione da dichiarare
qui, non da lasciar scivolare a meta'. (2) STORY-046 tocca focus trap e pila Esc: rischio di regressioni su altri
dialog, da coprire con test. (3) Il deploy hosting di fine sprint non puo' sovrapporsi a `qa:dev`. (4) Le
osservazioni a 360 px per STORY-049 non diventano fix dentro il #20 (scope creep: vanno in BACKLOG). Principio:
finire > iniziare.

### QA dal vivo (2026-11-13)

rankex-app-dev.web.app a `f42278f`; `qa:dev` 36/36 verde dopo deploy-dev di `f42278f`. Banner RICARICA reale: su una
scheda della build vecchia aperta prima del deploy e' comparso alle 08:42Z (~2 min dopo deploy-dev; verifica del
meccanismo fatta dall'utente). Strumento: script Playwright nello scratchpad (`SP` = `C:\Users\vAito\AppData\Local\Temp\claude\0d5da70ea05ac5cc\07e2ac0c-853a-40e5-b30d-7f0ab1b72105\scratchpad\qa20\`),
1366x768 e 360x640; Admin SDK solo su `qa-*` per creare gli slot di prova (marker `E2E-slot-qa20*`). Il cliente di
base "QA Cliente PT" ha `mustChangePassword` attivo (mai entrato) e non ha un set avatar: la QA dell'area cliente e'
stata fatta su due clienti `E2E-QA20-*` creati dal wizard (cancellati a fine QA); il cliente di base non e' stato toccato.

| TP | Esito | Visto (1366 / 360) | Non verificato |
|----|-------|--------------------|----------------|
| TP-088 (BUG-026) | PASS | Banner simulato con `page.route('**/version.json*')` (v1 poi v2) e polling a 1,5 s. 360: banner a y 64-128 (`top-16`), sotto l'header; login: "Password dimenticata?" e ACCEDI cliccabili (hit test sul centro = il link/bottone); area cliente: bottom nav intera (y 578-640), 0 controlli coperti; trainer: logout header (y 12-44) sopra il banner. 1366: in basso al centro (y 685-748), nulla coperto. RICARICA ricarica e il banner sparisce. Annotazione accettata, non bug: a 360 il banner copre in parte il logo "Rank EX" sul login e il nome/livello nell'hub cliente (testo, non controlli). Screenshot `SP`tp88-*.png | Sub-tab bar di Profilo col banner non guardata; build vecchia reale gia' verificata dall'utente |
| TP-089 (STORY-045) | BLOCCATO (parziale) | Barra desktop: "N MONETE" accanto alla campana su Calendario e Profilo (10 dopo la prima sessione chiusa, 30 dopo tre), assente nell'hub come da runbook. Pagina Avatar a 1366 e 360: "Nessun avatar disponibile - Il set avatar per la tua organizzazione non e' ancora stato caricato" (`SP`avatar-d.png) | Passi 1-4 e 6 (dialog di conferma, ANNULLA/Esc/click fuori, doppio ACQUISTA, bottone disabilitato, dialog a 360) e coincidenza saldo barra/pagina Avatar: `AVATAR_CATALOG` (`src/config/avatars.config.js:4-62`) non ha voci per `qa-pt`/`qa-soccer`, quindi nessuna org qa-* mostra avatar. Letto solo nel codice (`AvatarPicker.jsx:145-171` ConfirmDialog con Prezzo / Le tue Monete / Dopo l'acquisto; `:121` `disabled={isPurchasing \|\| coins < a.price}`). Acquisto reale non provato; nessun accredito manuale di Monete. Per sbloccarlo: aggiungere un set per `qa-pt` nel catalogo (stesse immagini VDP5, come le altre org di test) |
| TP-090 (STORY-046) | PARZIALE: funzione PASS, header FAIL (BUG-032) | Notifiche reali generate chiudendo slot dal trainer. Aperto da tastiera: contatore invariato (2), focus sul primo controllo ("Segna tutte come lette"), Tab/Shift+Tab ciclano dentro (12 Tab, 0 uscite), Esc chiude e il focus torna sulla campana (desktop e campana mobile); "Segna tutte come lette": doppio click = 1 sola chiamata `segnaAllLette`, poi contatore a 0, header "Tutte lette", bottone sparito, Firestore `read: true`. 360: pannello 331 px (92vw), nessuno scroll orizzontale, i 3 bottoni raggiungibili. Difetto: la colonna "N NON LETTE / NOTIFICHE" dell'header e' schiacciata a ~0 px: "2 NON LETTE" va a capo parola per parola o viene tagliato e "NOTIFICHE" sborda sotto il bottone, sia a 1366 (il drawer e' 360 px anche li') sia a 360 (`SP`tp90-open-d.png, `SP`tp90-open-m.png) | Primo "Segna tutte come lette" a freddo: la UI si e' aggiornata dopo >2,5 s (nessun optimistic update, poi ok): non e' un fallimento, da tenere d'occhio |
| TP-091 (STORY-046) | PASS | Cliente E2E con password temporanea. 360: Invio in ciascuno dei 3 campi lancia la validazione ("Password temporanea obbligatoria"); 1366: dati validi + doppio Invio = 1 `signInWithPassword` + 1 `accounts:update`, bottone "SALVATAGGIO..." e ingresso in `/client`. Attributi: cambio password `current-password` / `new-password` x2; login `type=email name=email autocomplete=username` e `type=password name=password autocomplete=current-password` | Password manager reale non verificabile in headless (solo gli attributi). Oggetto minore non loggato: a campi vuoti il messaggio sul campo "nuova password" e' "deve essere diversa da quella temporanea" (`ChangePasswordScreen.jsx:20-21`, `password === current` sovrascrive l'errore di lunghezza): fuorviante (`SP`tp91-360-errors.png) |
| TP-092 (STORY-047) | PASS | Cliente E2E: completata (10/11), assente (11/11, con un secondo cliente presente: "CHIUDI SESSIONE" e' disabilitato con 0 presenti), saltata (12/11), 4 future (15-18/11). Pallini verde/rosso/grigio/blu, "+55 XP" solo sulle 4 pianificate, legenda a 4 voci, PROSSIME = 3 (DOM 15 / LUN 16 / MAR 17 NOV, 18:30 - 19:30), PRESENZE "1 / 2 - 50 %" (saltata e pianificate escluse), STRISCIA "0 - XP x1,1" coerente con +55 (50 x 1,1). Vista trainer del cliente (tab Calendario): stessi stati, PROSSIME e riepilogo. Lipedema (`QA Paziente`): Completato / Saltato / Pianificato, PRESENZE "1 / 1 - 100 %", nessuna STRISCIA ne' "+N XP". 360: griglia a 7 colonne nello schermo (scrollWidth 360), PRESENZE e STRISCIA sulla stessa riga, legenda su due righe (`SP`tp92-*.png) | "Nessuna sessione in programma" e "0 / 0" (mese senza sessioni chiuse) non provati. Osservazione minore non loggata: in lipedema l'etichetta e' "PROSSIME APPUNTAMENTI" (genere sbagliato) |
| TP-093 (BUG-031 p.2-3) | PASS | PT, cliente: Note "Il tuo trainer non ha ancora scritto note."; Test > Obiettivi "Quando il tuo trainer fissa un obiettivo su un test, lo trovi qui." staff_readonly: "Nessuna nota scritta finora." / "Nessun obiettivo fissato finora."; trainer: "Aggiungi la prima nota per tenere traccia..." + AGGIUNGI NOTA e "Fissa un target su un test specifico..." invariati. Identico a 1366 e 360 (`SP`tp93-*.png) | Allievo Soccer: l'account di base ha `mustChangePassword` e non si e' toccato, quindi il testo "trainer" dell'area cliente soccer (BUG-008, atteso) non e' stato visto |

**Ricontrollo TP-090 (f31a2a6): PASS.** Cliente E2E con 2 notifiche reali (slot chiusi con cliente assente). 1366 e 360: header leggibile ("2 NON LETTE" + "NOTIFICHE", titolo 229/200 px di larghezza), chiudi in alto a destra, "Segna tutte come lette" a capo sotto (188x44 px) e cliccabile, nessuno scroll orizzontale (1366/1366, 360/360). Nome accessibile della campana desktop "Notifiche, 2 non lette", senza non lette "Notifiche"; la campana mobile non ha `aria-label` ma l'etichetta visibile NOTIFICHE (invariata). Tab: 10 Tab restano nel dialog; Esc chiude e il focus torna sulla campana. Nota: il primo focus ora e' "Chiudi notifiche" (prima "Segna tutte come lette"), per l'ordine DOM voluto. Segna tutte: contatore a "TUTTE LETTE". Bonus TP-092: con solo sessioni assenti il calendario mostra "Nessuna sessione in programma" e PRESENZE "0 / 0" (prima non provati). Screenshot `SP`re-open-d.png, `SP`re-open-m.png. Dati di test (2 clienti E2E, slot, notifiche, account) cancellati: qa-pt/qa-soccer/qa-lipedema solo cliente di base, 0 slot, 0 notifiche, `clientCount` 1.

Hub ClientHub (BUG-029): a 1366 e 360 il cerchio centrale e' scuro e opaco (maschera col token `--rx-bg`) e le etichette dei vertici hanno il colore muted del tema: nessuna regressione (`SP`hub-d.png, `SP`hub-m.png).

**Osservazioni a 360 px per STORY-049** (nessun fix, solo annotate):
- Vetrina Trofei (`TrophiesSection.jsx:165`): con i 5 slot vuoti ("+") sta nello schermo senza overflow; la vetrina con 5 badge pieni da 68 px non e' stata vista (cliente E2E con 1 solo trofeo): da riprovare con 5 badge. `SP`s49-trofei-m.png.
- StatsSection (`components/ui/index.jsx:430`): con stats a 0 le barre non si vedono (cliente E2E senza test); nel pannello STATUS a 360 il radar e' piccolo e l'etichetta "RES" del vertice destro tocca il bordo della card. Barre da confermare con un cliente con campionamenti. `SP`s49-test-m.png.
- Etichette tronche: confermate nell'hub cliente (`TES / TRO / CAL / SCH / PRO`, `SP`hub-m.png). La bottom nav cliente ha le etichette intere (TEST / TROFEI / NOTIFICHE / CALENDARIO / PROFILO). Nella bottom nav trainer a 360 le etichette sono troncate con i puntini ("CALENDA...", "RICORRE...", "GUIDA TE...": `SP`tp92-trainer-m.png).

**Dati di test creati e cancellati:** 2 clienti `E2E-QA20 Cliente/Compagno ...` in `qa-pt` (con account Auth, `/users`, notifiche; `clientCount` -2), 9 slot in `qa-pt` e 3 in `qa-lipedema` (marker `E2E-slot-qa20*`). Verifica finale: `qa-pt`, `qa-soccer`, `qa-lipedema` con solo il cliente di base, 0 slot, 0 notifiche, `clientCount` 1. Restano le voci `audit_logs` di creaCliente (la cancellazione e' stata fatta con Admin SDK, senza voce di eliminazione).

## Goal
Chiudere i difetti dell'area cliente a rischio (acquisto avatar senza conferma, pannello notifiche e navigazione non
accessibili, calendario con stati sbagliati) e gli action item del #19 che sono codice (checkPrev, check:deny,
BUG-026), con QA dal vivo su rankex-dev a 1366 px e 360x640. **Raggiunto**, con TP-089 non completabile dal vivo
(vedi "Non verificato"). Prod `fitquest-60a09` invariata a `f086405` (functions, hosting, rules; `origin/main` =
`f086405`).

## Chiusura sprint

**Stato del repo a fine sprint (verificato il 2026-11-13 con git e con le run di CI):** HEAD `f8b0ef8` prima di questo
commit di chiusura (locale). Push su `dev` degli 11 commit `ab65b45..f42278f`: CI 43394639920 success, E2E
43394639935 success, Deploy to Firebase 43394815820 (`deploy-dev` success, `deploy-prod` skipped). Poi push
`f42278f..f31a2a6`: CI, E2E e `deploy-dev` success (run di deploy creata 09:05:51Z), `deploy-prod` skipped. rankex-dev:
hosting e rules a `f31a2a6`; functions invariate a `5090d9a` (nessuna function toccata nel #20). I commit docs
`c6a1ba3`, `f8b0ef8` e quello di chiusura non sono pushati. `qa:dev` dopo `deploy-dev` di `f42278f`: 36/36 verde.
Banner RICARICA reale: scheda con build vecchia aperta prima del push, banner comparso alle 08:42Z (~2 min dopo
`deploy-dev`). `lipidemia/` e `mobile-app/` untracked, non committati.

### Completato
- **Voce 1 checkPrev (AI 1)** `55535bc`: `functions/scripts/checkPrev.mjs`; `744f6f9` exit 1 (Node 20), `f086405` exit 0
  (Node 22); citato in CLAUDE.md e nelle regole di `developer.md`/`scrum-master.md`. Review medium APPROVED.
- **Voce 2 check:deny (AI 3)** `15c8e6c`: `docs/git-deny.json` (72 pattern), `scripts/check-deny.mjs`, `npm run check:deny`
  (exit 0 sul file vero, exit 1 su copia senza un pattern). Review medium APPROVED. Fuori voce `597540a`: `goals.test.js`
  falliva tra 00:00 e 01:00 (data UTC vs locale).
- **BUG-026 (AI 2)** `4f9640e`: banner RICARICA in alto sotto `lg`; TP-088 PASS dal vivo, VERIFIED.
- **Voce 3 STORY-045** `335b71e` (codice): ConfirmDialog con prezzo/saldo/dopo, conferma a chiamata singola, "N MONETE"
  nella barra desktop. Dal vivo visto solo il badge Monete (TP-089 parziale); BUG-027 resta FIXED, non VERIFIED.
- **Voce 4 STORY-046** `aa84e73`: pannello notifiche accessibile (dialog, focus trap, Esc, focus di ritorno), lettura
  esplicita, Invio nel cambio password, autocomplete login. TP-090 e TP-091 PASS dal vivo; BUG-030 e BUG-031 p.1 e 4
  VERIFIED.
- **Voce 5 STORY-047** `56684a6`: stati completata/assente/saltata/pianificata, PROSSIME (max 3), PRESENZE/STRISCIA,
  `getClientSlotState` con test (unit 675/675). TP-092 PASS dal vivo (PT, vista trainer, lipedema, 360 px); BUG-028
  VERIFIED. "Nessuna sessione in programma" e "0 / 0" provati nel ricontrollo di `f31a2a6`.
- **Bug S fuori voce:** BUG-029 `5867bc5` (VERIFIED a vista su hub 1366/360), BUG-031 p.2 e 3 `f42278f` (TP-093 PASS).
- **BUG-032 e BUG-033** (nuovi dalla QA, P3 S, fixati nello stesso sprint): `353acfa` + `f31a2a6`; ricontrollo TP-090
  PASS su `f31a2a6`, entrambi VERIFIED.
- Deploy hosting dev, `qa:dev` 36/36, banner RICARICA reale osservato, QA dal vivo TP-088..093 (blocco "QA dal vivo"
  sopra). Dati di test cancellati: `qa-pt`/`qa-soccer`/`qa-lipedema` con solo il cliente di base, 0 slot, 0 notifiche,
  `clientCount` 1 (restano le voci `audit_logs` di creaCliente).

### Non completato (motivo)
- Nessuna voce pianificata e' rimasta fuori. STORY-048 e STORY-049 erano solo backlog per il #21 (decisione 8);
  STORY-050/051 senza sprint (decisioni 5, 6).

### Non verificato
| Cosa | Motivo / stato |
|------|----------------|
| **TP-089 passi 1-4 e 6 (BUG-027, STORY-045)**: dialog di conferma, ANNULLA/Esc/click fuori, doppio ACQUISTA, bottone disabilitato, dialog a 360, coincidenza saldo barra/pagina Avatar | `AVATAR_CATALOG` (`src/config/avatars.config.js:4-62`) non ha voci per `qa-pt`/`qa-soccer`: la pagina Avatar mostra "Nessun avatar disponibile". Letto solo nel codice (`AvatarPicker.jsx:145-171`, `:121`). **BUG-027 resta FIXED**, non VERIFIED. Serve un set avatar per qa-pt o un test con un'org che ne ha |
| Acquisto reale (callable `acquistaAvatar` da UI) | non provato; nessun accredito manuale di Monete |
| Password manager reale (TP-091) | in headless si sono verificati solo gli attributi `autocomplete` |
| Vetrina Trofei con 5 badge pieni; barre StatsSection con campionamenti reali (a 360 px) | cliente di prova con 1 trofeo e senza test; passano a STORY-049 |
| Allievo Soccer lato cliente (testo "trainer" = BUG-008) | l'account di base ha `mustChangePassword`, non toccato |
| Sub-tab bar di Profilo col banner RICARICA a 360 px (rischio noto del fix BUG-026) | non guardata |
| 3f login trainer/cliente in prod | rinviato al primo onboarding reale (decisione 3, gia' accettato dal #19) |
| Org QA GYM | rinviata alla prima org GYM reale (decisione 2, gia' accettato) |
| UAT | nessun progetto/hosting nel repo (`.firebaserc:5-18`) |
| Rollback functions prod | solo fix forward, TD-015 (gia' accettato) |
| STORY-029 (b)/(c) DPA e informativa | rinviato al contratto con la prima org Lipedema (decisione 3, gia' accettato) |

### Blockers
- Nessun blocco sul codice. STORY-029 (b)/(c) resta requisito non di codice (utente/legale), bloccante solo per
  attivare lipedema in prod.
- TP-089 dipende da un set avatar per `qa-pt` (vedi "Passa al #21", proposta da decidere).

### Tech debt emerso
- Nessun TD nuovo. TD-014: chiuso il "non tracciato" (copia + `check:deny`), resta OPEN per i buchi noti dei pattern.
  TD-015 invariato (OPEN).
- Bug aperti nuovi, non fixati (P3 S, BUGS.md): **BUG-034** (cambio password a campi vuoti: messaggio "deve essere
  diversa dalla temporanea" sulla nuova password, `ChangePasswordScreen.jsx:22`) e **BUG-035** ("PROSSIME APPUNTAMENTI"
  in lipedema, `ClientCalendar.jsx:105`). Non loggato come bug: il primo "Segna tutte come lette" a freddo ha aggiornato
  la UI dopo >2,5 s (nessun optimistic update, poi ok): osservazione da rivedere se si ripresenta.
- Osservazioni a 360 px per STORY-049 gia' in BACKLOG (etichette tronche nell'hub, vetrina Trofei, StatsSection,
  bottom nav trainer con etichette troncate).

### Verificato / non verificato (per ambiente)

| Voce | In dev (rankex-dev) | In prod (fitquest-60a09) | Non verificato |
|------|---------------------|--------------------------|----------------|
| 1 checkPrev, 2 check:deny | locali, provati da Git Bash e PowerShell | n/a | - |
| BUG-026 / TP-088 | VERIFIED a 1366 e 360; banner reale visto alle 08:42Z | non toccata | sub-tab bar di Profilo col banner |
| STORY-045 / TP-089 | solo badge "N MONETE" | non toccata | dialog e acquisto (nessun avatar per qa-pt) |
| STORY-046 / TP-090-091 | PASS a 1366 e 360 (dopo BUG-032/033 `f31a2a6`) | non toccata | password manager reale |
| STORY-047 / TP-092 | PASS PT, vista trainer, lipedema, 360 px | non toccata | - |
| Bug S / TP-093 | PASS | non toccata | allievo Soccer lato cliente |
| Functions / rules | invariate (`5090d9a`, nessun deploy) | invariate a `f086405` | - |

### Passa al #21
_Esito all'apertura del #21 (13/11): presi STORY-048 (con BUG-008), BUG-034, BUG-035, set avatar `qa-pt`; rimandati
STORY-049 e BUG-005; dettaglio in "Sprint corrente" → "Passa al #21 — esito"._
Candidati, in ordine consigliato (il PO decide le priorita', il Tech Lead la fattibilita'):
- **STORY-048** Home cliente (striscia, prossima sessione, ultime notifiche; centro pentagono rank/media): AC in bozza da
  scrivere a inizio sprint. Dipende da STORY-047 e STORY-045, ora DONE.
- **STORY-049** Test a righe e fix a 360 px: AC da scrivere dopo aver confermato a schermo vetrina Trofei con 5 badge e
  StatsSection con campionamenti (osservazioni in BACKLOG).
- **BUG-008** (P3) terminologia PT fissa nell'area cliente soccer/GYM; si lega a STORY-048 (stessa area).
- **BUG-034, BUG-035** (P3 S): due fix di una riga, candidati come bug S fuori voce.
- **Proposta da decidere (utente):** un set avatar per `qa-pt` in `src/config/avatars.config.js` (stesse immagini VDP5)
  per rifare TP-089 con un cliente con almeno 30 Monete e chiudere BUG-027 come VERIFIED. Alternativa: test con
  un'org che ha gia' un set. Costo S; senza, BUG-027 resta FIXED non verificato.
- BUG-005 (P3, soccer: tab BIA) invariato.
Fuori sprint: STORY-050, STORY-051 (rules/functions, review HIGH, nessuno sprint); STORY-029 (b)/(c), 3f, org GYM,
UAT, rollback functions prod (solo fix forward, TD-015).
Operativo: push dei commit docs locali su `dev` (via libera dell'utente); `main` resta a `f086405` fino al prossimo
rilascio. Deploy hosting dev e `qa:dev` mai in parallelo.

## Retrospettiva
Dati (da `git log ab65b45..HEAD` e dai blocchi sopra): 16 commit = 11 di codice/test (checkPrev, check:deny, fix
`goals.test`, BUG-026, STORY-045, STORY-046, BUG-029, STORY-047, BUG-031 p.2-3, BUG-032/033 + fix di review) e 5 docs
(backlog, apertura, QA dal vivo, ricontrollo TP-090, chiusura); voci 1-5 e bug S tutte DONE, 0 voci non completate;
10 bug nel periodo (BUG-026..031 gia' noti all'apertura, BUG-032..035 trovati nello sprint); 2 push su `dev` con CI, E2E
e deploy-dev verdi al primo colpo; `qa:dev` 36/36; unit 664 -> 675; 0 deploy in prod, 0 debiti nuovi. Rework: 2
(`f31a2a6` sul fix di BUG-032, trovato dalla review; `597540a` test con data UTC). Non verificato: TP-089 (BUG-027
resta FIXED, non VERIFIED), tempi di attesa.

**Verifica dei 5 action item del #19**
1. checkPrev: **raggiunto.** `55535bc`: `744f6f9` esce 1, `f086405` esce 0 (Git Bash e PowerShell), citato in CLAUDE.md
   e nelle regole dei 2 agenti. Efficacia su un rilascio reale non dimostrabile: non e' stato fatto nessun rilascio/rollback.
2. BUG-026: **raggiunto.** `4f9640e`, caso TP-088, VERIFIED dal vivo a 360x640 e 1366 (hit test sui controlli).
3. check:deny: **raggiunto, con limite dichiarato.** `15c8e6c`: 72/72 sul file vero, exit 1 sulla copia senza un
   pattern. Controlla che i 72 pattern siano nel file, non che coprano le forme di git (TD-014 resta OPEN).
4. Org QA GYM: **non fatto, sostituito per decisione dell'utente** (decisione 2 del #20, "rinviata alla prima org GYM
   reale"). Non e' scivolato: e' uscito dall'elenco dei candidati con una decisione scritta (dopo 4 retro che lo citavano).
5. Decisione su STORY-029 (b)/(c) e 3f: **raggiunto** (decisione 3: rinviati al contratto Lipedema / primo onboarding reale).

**WHAT WENT WELL**
- Sprint pianificato e chiuso in 2 giorni con tutte le voci DONE e CI/E2E/deploy-dev verdi al primo colpo. Causa:
  voci piccole con "fatto quando" verificabile, nessuna modifica a functions/rules (zero deploy functions, zero rules),
  tabelle ambiente/modulo scritte a inizio sprint (nessuna scelta d'ambiente in bivio).
- La QA dal vivo ha trovato 2 difetti reali che unit test e review non vedono (BUG-032/033) e li ha chiusi nello stesso
  sprint. Causa: QA su rankex-dev a 2 viewport con misure (bounding box, hit test, conteggio chiamate), non a vista.
- La review medium ha trovato che il fix del developer di BUG-032 non faceva cio' che dichiarava (`f31a2a6`). Causa:
  la review controlla il comportamento nel DOM/CSS, non il self-report.
- Gli action item del #19 che erano codice sono stati chiusi con prova eseguibile (exit code), non con conferma verbale.

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-032 e BUG-033 sono nati dentro STORY-046 (`aa84e73`): header del pannello notifiche schiacciato e campana senza nome
  accessibile, in una story il cui scopo era l'accessibilita'. ROOT CAUSE (verificata nei docs): il nuovo layout e'
  stato consegnato con unit test e review medium, che non misurano il rendering; il primo sguardo a 360/1366 px e' stato
  la QA di fine sprint, a codice di tutte le voci gia' scritto. Il fix `353acfa` ha poi ripetuto il difetto: il developer
  ha dichiarato "chiudi resta in alto a destra" senza misurarlo, e `f31a2a6` e' nato dalla review. IMPACT: P3, nessun
  utente reale; 2 commit di rework e un ricontrollo TP-090. ACTION: azione 2.
- TP-089 (acquisto avatar, BUG-027, STORY-045) non e' verificabile dal vivo. ROOT CAUSE: `AVATAR_CATALOG`
  (`src/config/avatars.config.js:4-62`) e' hardcoded per org e non ha voci per `qa-pt`/`qa-soccer`; la precondizione del
  caso (cliente con avatar acquistabili e >= 30 Monete) non era soddisfacibile sull'ambiente QA ed e' emersa solo in QA,
  non nella scrittura di STORY-045 ne' del caso runbook. IMPACT: la story che protegge dai tap accidentali sulle Monete
  (P2) e' chiusa solo a codice letto. ACTION: azioni 1 e 4.
- L'area cliente non e' provabile con l'account di base: "QA Cliente PT" non ha mai fatto il primo accesso
  (`mustChangePassword`), quindi la QA e' stata fatta su clienti `E2E-QA20-*` creati dal wizard, creati e cancellati a
  mano nello script. ROOT CAUSE: il seed (`scripts/seed-qa-orgs.mjs`) crea il cliente ma non porta a termine il primo
  accesso. IMPACT: ogni QA dell'area cliente rifa' la preparazione (non verificato: tempo). ACTION: azione 1.
- Test con data UTC (`goals.test.js`, `597540a`) che falliva tra 00:00 e 01:00. ROOT CAUSE: test scritto con una data
  diversa da quella della funzione (`isGoalMissed` usa la data locale); invisibile finche' non si lavora a mezzanotte.
  IMPACT: rumore di 1 commit. ACTION: gia' fatta, nessuna ulteriore.

**WHAT WAS SLOW**
- La QA dal vivo e' avvenuta dopo aver chiuso tutte le voci (una volta a fine sprint, regola di efficienza): i difetti
  di layout sono tornati indietro dopo il push, con un secondo ciclo push/deploy/ricontrollo. Il ciclo pieno
  (fix, review, push, CI/E2E/deploy-dev, QA) non e' stato cronometrato: non verificato.
- Il banner RICARICA reale richiede ~2-5 min di attesa dopo il deploy (`POLL_MS`); per TP-088 si e' simulato
  `version.json` con Playwright. Il primo "Segna tutte come lette" a freddo ha aggiornato la UI dopo >2,5 s (nessun
  optimistic update): osservato una volta, non loggato.

**WHAT CAUSED REWORK**
- `f31a2a6`: dichiarazione del developer su un effetto visivo non misurata (causa comune a BUG-032). `597540a`: test su
  data. Stessa causa dei 2 sprint precedenti: assunzione non provata prima di dichiarare "fatto".

**WHAT CREATED TECHNICAL DEBT**
- Nessun TD nuovo (TD-014 ridotto: copia tracciata dei deny; TD-015 invariato). Debito implicito, non in TECH-DEBT.md:
  il catalogo avatar e' codice per-org, quindi ogni org di test o nuova org richiede una modifica a `avatars.config.js`;
  e' la causa strutturale del blocco di TP-089. Non aperto come TD perche' l'azione 1 lo aggira con un set per `qa-pt`
  (da decidere se tracciarlo).
- Bug aperti P3 per mancanza di spazio, non per scelta: BUG-034, BUG-035 (fix di una riga), BUG-008, BUG-005.

**ACTION ITEM per lo Sprint #21** (max 5; vincoli: nessun deploy in prod, `main` resta a `f086405`, STORY-050/051 e
STORY-029 (b)/(c) fuori)
1. **Rendere l'area cliente provabile su rankex-dev (agente, ~2 h).** Set avatar per `qa-pt` in
   `src/config/avatars.config.js` (stesse immagini VDP5) e, in `scripts/seed-qa-orgs.mjs`, un cliente di base con primo
   accesso gia' fatto (`mustChangePassword: false`). Poi rifare TP-089 con >= 30 Monete (si guadagnano chiudendo slot).
   *Fatto quando:* `npm run qa:dev:seed` e' idempotente e TP-089 passi 1-6 sono PASS dal vivo con BUG-027 VERIFIED; se
   il set avatar si rivela non voluto, BUG-027 resta FIXED e la motivazione e' scritta in BUGS.md. Review medium.
2. **Controllo di layout automatico sui pannelli nuovi (agente, ~2 h).** Spec in `e2e/qa-dev/tests/` (o
   `e2e/tests/` se non serve l'hosting) che apre il pannello notifiche del cliente a 360 e 1366 px e asserisce con
   bounding box: titolo >= 100 px di larghezza, bottone chiudi nell'angolo in alto a destra, nessuno scroll orizzontale,
   campana desktop con nome accessibile. *Fatto quando:* la controprova fatta su una copia (worktree esterno) di
   `aa84e73` fallisce sul titolo e/o sul nome della campana, e su HEAD passa; `qa:dev` resta verde. Review medium.
3. **Chiudere BUG-034 e BUG-035 come bug S fuori voce (agente, ~30 min).** `ChangePasswordScreen.jsx:20-22`: l'errore di
   lunghezza non deve essere sovrascritto da `password === current`; `ClientCalendar.jsx:105`: titolo dalla terminologia
   del modulo con il genere giusto. *Fatto quando:* BUG-034 ha un test Vitest sull'ordine delle validazioni
   (fallisce prima del fix), BUG-035 e' verificato in lipedema e PT a vista; entrambi FIXED in BUGS.md.
4. **Regola di pianificazione sulla testabilita' (scrum-master, ~30 min).** Ogni voce UI o caso `TP-` del #21 (STORY-048
   per prima) riporta nella voce la riga "precondizione QA": org, utenza e dati necessari e dove li fornisce il seed;
   lo scrum-master non mette READY senza. Regola scritta in `.claude/agents/scrum-master.md` e `developer.md` insieme a
   "un effetto visivo dichiarato = una misura (bounding box o screenshot) allegata alla voce". *Fatto quando:* le voci UI
   del #21 hanno la riga e a fine sprint 0 casi `TP-` risultano BLOCCATI per precondizione.
5. **Provare lo STORY-048 sui due viewport prima della review (agente, incluso nella story).** Per la Home cliente
   (STORY-048) la misura a 360x640 e 1366x768 con la nuova spec dell'azione 2 e' parte della definizione di fatto,
   non solo della QA finale. *Fatto quando:* la review medium di STORY-048 cita l'esito della spec a 360 e 1366 e la
   QA dal vivo non apre bug di layout P3 nuovi sulla stessa schermata (0 BUG di layout su STORY-048).

---

# SPRINT #19 — EPIC-010 Lipedema Edition, chiusura dei "non verificato" del rilascio e action item del #18 — aperto il 2026-11-12, chiuso il 2026-11-12 (goal raggiunto, 3f non verificato per decisione dell'utente)

**Branch:** `feature/lipedema-module` (all'apertura HEAD `f91bcb6`, 8 commit locali `fd28852..f91bcb6` non pushati: 7 docs +
`3f7d5f3` fix `e2e/tests/real-flows.spec.js` "email già usata"; stato a fine sprint in "Chiusura sprint"). `lipidemia/` e `mobile-app/` non si committano.
Nessun deploy su `fitquest-60a09` in questo sprint. I deploy su rankex-dev sono ammessi, mai hosting durante
`qa:dev`.

**Goal:** chiudere con esito VERIFIED o BUG i "non verificato" del rilascio EPIC-010 e i 4 action item del #18, senza
deploy in produzione.

**Situazione iniziale (verificata il 2026-11-12 con `git fetch`):**
- `origin/dev` = `origin/main` = `f086405`. Prod `fitquest-60a09`: functions, hosting, rules a `f086405`, 40 callable
  nodejs22; lipedema non selezionabile fuori da dev (`IS_LIPEDEMA_SELECTABLE = isDev`).
- rankex-dev: hosting e rules a `f086405`, functions a `d2682a8` (codice identico a `f086405`).
- Test: `qa:dev` 36/36, unit 641/641, functions 231/231, rules 129/129.
- `docs/BUGS.md`: nessun P0/P1 aperto (BUG-009 P0 e' FIXED in prod dal 26/10; gli OPEN rimasti sono BUG-005 e BUG-008, entrambi P3).
  `docs/TECH-DEBT.md`: nessun debito nuovo dal #18.

**Decisioni prese (2026-11-12, utente):**

| # | Decisione |
|---|-----------|
| 1 | Push degli 8 commit locali SOLO su `dev`; `main` resta a `f086405` fino al prossimo rilascio |
| 2 | "Chiusura sessione con doppio click" flaky: se resta tale, analisi causa + voce in BUGS.md + FIX nel #19; niente retry a oltranza |
| 3 | Guard sul deploy functions usato sia da `deploy` (prod) sia da `deploy:dev`; sha solo stampato e copiato a mano nel CHANGELOG, nessun file generato |
| 4 | Controprove solo su copia: regola in CLAUDE.md + DENY (non ask) in `.claude/settings.json` per `git checkout -- .`, `git restore .`, `git reset --hard` |
| 5 | Caso del lunedi' per lo slot E2E: TEST UNITARIO Vitest della funzione pura che sceglie la data (estratta dal global setup), nessuna modifica al run di `qa:dev` |
| 6 | Login trainer/cliente in prod: RESTA NON VERIFICATO fino al primo utente reale (nessun dato creato in prod) |
| 7 | Rinomina voce CHANGELOG con schema "data + etichetta": `[2026.11.12] — EPIC-010 Lipedema (modulo non attivo)`; template `[vX.Y] — <data>` aggiornato; push docs solo su dev, merge su main rinviato al prossimo rilascio |
| 8 | Prova rollback functions/hosting/rules solo su rankex-dev, seguendo alla lettera la checklist di CLAUDE.md |
| 9 | Lipedema in UAT resta NASCOSTO come in prod (`IS_LIPEDEMA_SELECTABLE = isDev` invariato) |
| 10 | Rollback functions prod: solo fix forward (rischio accettato). Il piano a `744f6f9` non è eseguibile (Node 20 dismesso); dal prossimo rilascio prev functions = `f086405` (Node 22). Deciso a metà sprint dopo la prova 3b |

**Voci, nell'ordine:**
0. **Apertura sprint** (questo commit di docs). DONE.
1. **Push su dev e CI/E2E.** Push dei commit locali SOLO su `dev`; verifica CI + E2E verdi con `3f7d5f3`.
   *Fatto quando:* CI e E2E del push su dev verdi. Se "chiusura sessione con doppio click" e' ancora flaky: analisi
   causa, BUG in `docs/BUGS.md`, fix nel #19. **Review medium** se c'e' fix.
2. **Action item del #18 (processo)**
   - **2a. Guard deploy functions.** Script Node cross-platform (niente sintassi solo bash) usato da `deploy` e
     `deploy:dev` in `functions/package.json`: stampa `git rev-parse HEAD`, rifiuta working tree sporco in
     `functions/`. Riga obbligatoria "functions prod a `<sha>`" nella checklist di CLAUDE.md → Rilascio.
     *Fatto quando:* `deploy:dev` con un file di `functions/` modificato e non committato rifiuta e non parte; da
     pulito stampa lo sha e parte. **Review HIGH** (processo di deploy).
   - **2b. Controprove su copia.** Regola in CLAUDE.md + DENY in `.claude/settings.json`. Sintassi verificata con lo
     skill `update-config`. *Fatto quando:* i tre comandi sono bloccati davvero (prova che il blocco scatta, su
     repo di prova, non sul working tree). **Review medium.**
   - **2c. Tabella per ambiente/modulo.** Ogni voce con comportamento per ambiente o modulo apre con tabella
     dev/UAT/prod (e PT/GYM/Soccer/Lipedema dove serve) con file:riga confermati. Regola in `CLAUDE.md`
     ("Processo di sviluppo"), `.claude/agents/developer.md`, `.claude/agents/scrum-master.md`. *Fatto quando:*
     regola presente nei 3 file e applicata alle voci 3b/3c/3e. **Review medium.**
3. **Verifiche rimaste del #18**
   - **3a. Costi Firebase post-rilascio** (dal 2026-11-13): li legge l'utente in Console, annotati nel CHANGELOG.
   - **3b. Rollback functions su rankex-dev.** Checklist di CLAUDE.md alla lettera: a un commit precedente e
     ritorno a HEAD, tempi annotati, checklist corretta se serve. SOLO rankex-dev. Dopo 2a: il rollback (`npx firebase-tools` da worktree esterno) NON passa dal guard, sha annotato a mano; solo il ritorno a HEAD con `npm run deploy:dev` passa dal guard.
   - **3c. Rollback hosting e rules su rankex-dev**, poi ritorno a HEAD. Mai durante `qa:dev`.
   - **3d. Caso del lunedi' (slot E2E).** Estrarre dal global setup la funzione pura che sceglie la data dello
     slot; test unitario Vitest su lunedi', domenica, cambio mese. Nessuna modifica al run di `qa:dev`.
     **Review medium.**
   - **3e. Banner RICARICA su rankex-dev:** deploy hosting con una scheda aperta (mai durante `qa:dev`); visto
     anche a 360 px.
   - **3f. Login trainer/cliente in prod:** NON VERIFICATO fino al primo utente reale (decisione 6).
4. **Rinomina voce CHANGELOG EPIC-010** a `[2026.11.12] — EPIC-010 Lipedema (modulo non attivo)`; template del file
   aggiornato di conseguenza. Push docs solo su dev. *Fatto quando:* titolo e template coerenti.

**Status board e esiti (aggiornato 2026-11-12):**

| Voce | Stato | Esito |
|------|-------|-------|
| 0 | DONE | apertura sprint |
| 1 | DONE | push `ab315f3` su dev; CI 43196941264 e E2E 43196941420 verdi (40/40), test "doppio click" passato al primo tentativo (15.7 s), `deploy-dev` ok, `deploy-prod` skipped. Nessun BUG |
| 2a | DONE | review HIGH: CHANGES REQUESTED -> APPROVED. `4223cf4`; prova reale `npm run deploy:dev` con tree sporco da PowerShell -> "Deploy rifiutato", exit 1, firebase non lanciato; da tree pulito ha stampato `functions deploy da 5090d9ab…` e deployato (ritorno a HEAD della 3b) |
| 2b | DONE | review medium x3. `af44491`; deny 72 regole in `.claude/settings.json` (non tracciato); provati negati in repo usa e getta: `reset --hard`, `reset HEAD --hard`, `checkout -- .`, `checkout HEAD -- <file>`, `restore .`, `restore <file>`, `clean -xdf`, `switch -f` (PowerShell), varianti `-C`; scoperto e chiuso il buco `git -C`; `git switch x-fix` ammesso |
| 2c | DONE | review medium. `5090d9a` |
| 3a | DONE | spesa di novembre fino al 12/11 letta dall'utente (Budget e avvisi): prod CRF ~0,01 €/5 €, dev CRF ~0,07 €/1 €, resto ~0 €; uso per servizio non letto (decisione utente). Annotato nella voce `[2026.11.12]` del CHANGELOG |
| 3b | DONE | rollback functions rankex-dev a `224d1bb` (Node 22, 40 callable) e ritorno a `5090d9a`; 40 callable nodejs22 prima/durante/dopo (`functions:list`); checklist corretta (CLAUDE.md: `<prev>` Node 22, `worktree remove --force`, ramo callable nuove non provato) |
| 3c | DONE | hosting rollback a `a08e1c1359dde364` / `cdfd07d5be31372a` con `hosting:clone`; rules rollback a `cc42e34` (verificato via Rules API); ritorno a HEAD con `deploy:rules:dev` e `deploy:all:dev` (versioni `872fa06401f90ee3` / `257381cd90f5651d`) |
| 3d | DONE | review medium. `d42d23b` + `555f925`; `qa:dev` 36/36 sul nuovo `roles.spec.js` |
| 3e | DONE | banner RICARICA comparso su rankex-app-dev (pagina di login, desktop 1366 e 360x640) 5 min dopo il rollback hosting e 5 min dopo il ritorno a HEAD; RICARICA lo toglie. A 360 px copre "Password dimenticata?" finche' non si ricarica: BUG-026 (P3, OPEN) |
| 3f | NON VERIFICATO | per decisione dell'utente (decisione 6) |
| 4 | DONE | CHANGELOG: voce rinominata `[2026.11.12] — EPIC-010 Lipedema (modulo non attivo)`, template e schema aggiornati, riga "functions prod a `f086405`" |

Stato rankex-dev a fine prove: hosting, rules e functions a `5090d9a`; prod invariata a `f086405`.

**Fuori dal #19:** STORY-044 (canvas, non si tocca), stampa su carta, mobile-app, STORY-029 (b)/(c) DPA e
informativa (requisito non di codice, bloccante per attivare lipedema in prod), STORY-026 retention (decisione
utente), login reali in prod (3f), qualsiasi deploy su `fitquest-60a09`, merge su `main`. Lavoro emerso fuori elenco
-> `docs/BACKLOG.md` per il #20.

**Verifica prevista dei 4 action item del #18 (a fine #19):**
1. Guard commit functions in CHANGELOG — **voce 2a.** `npm run deploy:dev` da tree sporco in `functions/` rifiuta e
   stampa il motivo; da pulito stampa lo sha e parte; la riga "functions prod a `<sha>`" e' nella checklist di
   CLAUDE.md. Lo sha stampato dal deploy dev usato nelle prove 3b e annotato nel CHANGELOG.
2. Controprove su copia — **voce 2b.** Regola presente in CLAUDE.md; `git checkout -- .`, `git restore .` e
   `git reset --hard` rifiutati dal permesso DENY, provato in un repo di prova (non il working tree); funziona
   anche con il tool PowerShell e con Bash.
3. Tabella ambiente/modulo — **voce 2c.** Regola presente nei 3 file (CLAUDE.md, `developer.md`,
   `scrum-master.md`) e applicata alle voci 3b/3c/3e del #19 (tabella con file:riga in ognuna, prima del codice o
   dell'esecuzione). 0 scelte di ambiente senza riga corrispondente.
4. "Non verificato" chiuso — **voci 1, 3a-3f, 4.** Ogni voce dell'elenco "Non verificato" del #18 ha esito
   VERIFIED, un BUG aperto, oppure motivazione esplicita: costi (3a), caso lunedi' (3d, test), rollback (3b/3c),
   banner RICARICA (3e), esito E2E su main/dev (1), GYM senza org QA (resta noto), login prod (3f, motivato).

**Tabella ambiente/modulo (apertura, da completare con file:riga dal developer prima di ogni voce 3b/3c/3e):**

| Voce | dev (rankex-dev) | UAT | prod (fitquest-60a09) |
|------|------------------|-----|-----------------------|
| 1 | push `dev` -> CI + `deploy-dev` | non verificato | non toccata (main fermo a `f086405`) |
| 2a | guard attivo su `deploy:dev` | non verificato | guard attivo su `deploy`, non eseguito in questo sprint | 
| 3b/3c/3e | solo qui | non verificato | vietato |
| 3d | test unitario locale | non verificato | non verificato (nessun effetto atteso) |
| IS_LIPEDEMA_SELECTABLE | selezionabile | nascosto (invariato) | nascosto |

**Tabelle per voce 3b/3c/3e (voce 2c, file:riga letti nel codice il 2026-11-12):**

| 3b rollback functions | dev (rankex-dev) | UAT | prod (fitquest-60a09) |
|-----------------------|------------------|-----|-----------------------|
| Cosa si fa | worktree esterno a commit precedente, `npm ci`, `npx firebase-tools deploy --only functions --project rankex-dev`: NON passa dal guard di 2a, sha annotato a mano. Solo il ritorno a HEAD con `npm run deploy:dev` passa dal guard | non toccato; nessun progetto UAT in `.firebaserc:5-18` (solo `fitquest-60a09`, `rankex-dev`): non verificato | non toccato, vietato |
| Riferimenti | `functions/package.json:13` (`deploy:dev` = guard + `--project rankex-dev`); sorgente `firebase.json:2-6` | - | `functions/package.json:12` (`deploy`, non eseguito); `.firebaserc:3` default = prod |

| 3c rollback hosting + rules | dev | UAT | prod |
|-----------------------------|-----|-----|------|
| Cosa si fa | rules: `firebase deploy --only firestore:rules --project rankex-dev` da cartella temporanea; hosting: Console rollback di `rankex-app-dev` e `rankex-admin-dev`; ritorno a HEAD con `npm run deploy:rules:dev` e `npm run deploy:all:dev` | non toccato, non verificato (nessun target) | non toccato, vietato |
| Riferimenti | `package.json:23` (rules dev), `:28-30` (hosting dev); target `.firebaserc:12-17`; `firebase.json:8` (sorgente rules del solo ritorno a HEAD con `deploy:rules:dev`; il rollback rules usa una cartella temporanea con il proprio `firebase.json`), `:21` target app, `:43` target admin | - | `package.json:22,25-27` non eseguiti; `.firebaserc:6-10` |

| 3e banner RICARICA | dev | UAT | prod |
|--------------------|-----|-----|------|
| Cosa si fa | deploy hosting dev con scheda aperta su `rankex-app-dev`; dopo il poll (5 min) compare il banner, osservato anche a 360 px | non verificato (nessun hosting UAT) | non toccato; il comportamento in prod non e' provato qui |
| Riferimenti | `src/app/App.jsx:21` (`useVersionCheck`), `:54-67` (banner, RICARICA a `:64`); `src/hooks/useVersionCheck.js:3` (`POLL_MS` 5 min), `:12-18` (confronto `v` di `/version.json`); `vite.config.js:14-19` (scrive `dist/version.json` al build); caso runbook `config/runbook.config.js:1265`. Il banner non dipende da `isDev`/modulo: stesso codice in tutti gli ambienti | idem | idem |

Moduli (PT/GYM/Soccer/Lipedema, `moduleType` null): le tre voci non dipendono dal modulo (nessun riferimento a
`getModule` in `App.jsx`/`useVersionCheck.js`).

Nessuna voce tocca codice di modulo (PT/GYM/Soccer/Lipedema, org legacy `moduleType` null): file toccati =
`functions/package.json` + script di guard, `CLAUDE.md`, `.claude/settings.json`, `.claude/agents/*.md`, un
helper di `e2e/qa-dev/` con il suo test, `docs/*`. I file:riga si annotano nella voce prima di iniziare (2c).

**Casi limite da tracciare per ogni voce:**
- **Moduli (PT/GYM/Soccer/Lipedema) e org legacy `moduleType` null:** nessuna voce tocca codice di modulo.
  Dichiarato. GYM senza org QA: resta noto, non verificato.
- **Windows PowerShell vs Git Bash (2a, 2b):** lo script 2a e' Node puro (niente `$(...)`, `&&`, `test -z`);
  provato da entrambe le shell. I pattern di permesso 2b sono provati sia sul tool PowerShell sia su Bash,
  con path assoluto e relativo e con varianti (`git checkout -- .`, `git checkout .`, `git restore .`,
  `git restore --staged .`, `git reset --hard`).
- **Rollback lasciato a meta' su rankex-dev (3b/3c):** si torna a HEAD con `cd functions && npm run deploy:dev`
  da HEAD pulito (functions); `npm run deploy:rules:dev` (rules); `npm run deploy:all:dev` (hosting). Prima di
  chiudere: `firebase functions:list --project rankex-dev` e rules/hosting a HEAD. Voce BLOCKED finche' non e'
  tornato a HEAD; il rollback delle functions non usa il working tree (worktree esterno, niente junction
  `node_modules`, vedi CLAUDE.md).
- **Ruoli (`staff_readonly`, `trainer`, `org_admin`):** non toccati; `qa:dev` resta invariato (decisione 5).
- **360 px:** nessuna UI nuova; il banner RICARICA (3e) va osservato anche a 360 px.
- **Flaky (1):** "chiusura sessione con doppio click": una sola riesecuzione per distinguere flaky da rosso reale;
  se passa solo al retry e' flaky -> BUG + fix, non retry a oltranza.
- **Lunedi'/domenica/cambio mese (3d):** casi del test unitario (ora locale e UTC, mese a cavallo, 31 -> 1).
- **Deploy parziale:** un deploy dev interrotto lascia hosting/functions/rules su commit diversi: ripetere da HEAD.
- **Hosting dev e `qa:dev`:** mai in parallelo (3c, 3e).

**Dipendenze bloccanti segnalate:**
- Voce 1: push su `dev` = via libera dell'utente (azione sul remoto). Voce 3b dopo 2a.
- 3a: azione dell'utente, non prima del 2026-11-13. 3b/3c/3e: deploy su rankex-dev (functions, rules, hosting a
  mano); nessuna nuova Cloud Function ne' modifica a `firestore.rules`.
- 2a/2b toccano il processo di deploy e i permessi: nessuna modifica a prod. 2c solo documentazione.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| 0. Apertura sprint (docs) | DONE | questo commit |
| 1. Push su dev + CI/E2E verdi con `3f7d5f3` | DONE | `ab315f3`; CI/E2E verdi, doppio click passato al primo tentativo |
| 2a. Guard deploy functions (script Node + riga checklist) | DONE | `4223cf4`; review HIGH approvata |
| 2b. Controprove su copia (regola + DENY settings.json) | DONE | `af44491`; review medium |
| 2c. Regola tabella ambiente/modulo (3 file) | DONE | `5090d9a`; review medium |
| 3a. Costi Firebase | DONE | letti il 2026-11-12 (vedi esiti); uso per servizio non letto |
| 3b. Rollback functions rankex-dev | DONE | a `224d1bb` e ritorno a `5090d9a`; prod: solo fix forward (decisione 10) |
| 3c. Rollback hosting + rules rankex-dev | DONE | provato e ritorno a HEAD |
| 3d. Test unitario caso del lunedi' (slot E2E) | DONE | `d42d23b` + `555f925`; review medium |
| 3e. Banner RICARICA rankex-dev (+360 px) | DONE | osservato; BUG-026 (P3, OPEN) |
| 3f. Login trainer/cliente prod | NON VERIFICATO | per decisione dell'utente fino al primo utente reale |
| 4. Rinomina voce CHANGELOG + template | DONE | titolo e template coerenti |

**Rischi:** (1) Il guard 2a e' codice di deploy: un errore blocca i deploy futuri (provare su `deploy:dev` prima).
(2) I DENY di 2b possono bloccare anche usi legittimi: fare prova di blocco e verificare che i comandi con
pathspec esplicito non vengano bloccati. (3) Le prove di rollback 3b/3c lasciano rankex-dev su un commit
vecchio se interrotte: ritorno a HEAD e' parte della voce. (4) 3a dipende dalla data. Principio: finire > iniziare;
ordine consigliato 1, 2a, 2b, 2c, 3d, 3b, 3c, 3e, 4, poi 3a quando disponibile.

## Goal
Chiudere con esito VERIFIED o BUG i "non verificato" del rilascio EPIC-010 e i 4 action item del #18, senza
deploy in produzione. **Raggiunto, con 3f non verificato per decisione dell'utente (decisione 6).** Prod
`fitquest-60a09` invariata a `f086405` (functions, hosting, rules; 40 callable nodejs22). rankex-dev: functions,
hosting e rules a `5090d9a` (dopo, solo commit docs).

## Chiusura sprint

**Stato del repo a fine sprint (verificato il 2026-11-12):** `origin/dev` = `5ba0ecf`; HEAD locale = `0c0d84e`
(commit voce 3a, non pushato); `origin/main` = `f086405`, resta li' fino al prossimo rilascio (deciso). Push di
`5ba0ecf`: CI 43270526890 success, E2E 43270526570 success, Deploy to Firebase 43270774631 (`deploy-dev`
success, `deploy-prod` skipped).

### Completato
- **0, 1** apertura e push su dev (`ab315f3`), CI/E2E verdi, nessun BUG dal flaky "doppio click".
- **2a** (`4223cf4`, review HIGH): guard del deploy functions, provato reale con tree sporco (rifiuto, exit 1) e pulito.
- **2b** (`af44491`, review medium): regola in CLAUDE.md + 72 deny in `.claude/settings.json` (non tracciato), provati
  in repo usa e getta; chiuso il buco `git -C`.
- **2c** (`5090d9a`, review medium): regola tabella ambiente/modulo nei 3 file.
- **3a**: costi di novembre fino al 12/11 letti dall'utente e annotati nel CHANGELOG (commit `0c0d84e`).
- **3b**: rollback functions su rankex-dev a `224d1bb` e ritorno a `5090d9a`; checklist di CLAUDE.md corretta.
- **3c**: rollback e ritorno a HEAD di hosting (`hosting:clone`) e rules su rankex-dev.
- **3d** (`d42d23b`, `555f925`, review medium): test unitario del caso del lunedi'; `qa:dev` 36/36.
- **3e**: banner RICARICA osservato su rankex-app-dev (desktop e 360 px); trovato BUG-026.
- **4**: voce CHANGELOG `[2026.11.12] — EPIC-010 Lipedema (modulo non attivo)`, template aggiornato.

### Non completato (motivo)
- **3f** login trainer/cliente in prod: NON VERIFICATO per decisione dell'utente (nessun dato creato in prod, si
  verifica al primo utente reale).
- **Rollback functions prod:** non eseguibile come rollback (il commit precedente `744f6f9` e' Node 20, runtime
  dismesso); decisione 10: solo fix forward, `<prev>` futuro = `f086405`.

### Blockers
- **STORY-029 (b)/(c)** DPA e informativa (requisito non di codice, utente/legale): bloccante per attivare
  lipedema in prod; a chiusura va tolto `IS_LIPEDEMA_SELECTABLE`.
- Nessun blocco sul codice per il #20.

### Tech debt emerso
- TD-014 (deny git solo in `.claude/settings.json` non tracciato) e TD-015 (rollback functions prod non
  eseguibile, ramo "callable nuove" mai provato): aggiunti in TECH-DEBT.md dalla retrospettiva.
- **BUG-026** (P3, OPEN, BUGS.md): banner RICARICA copre "Password dimenticata?" a 360 px (`src/app/App.jsx:54-67`).
- Rischio accettato (decisione 10): rollback functions prod solo con fix forward.

### Verificato / non verificato

| Voce | In dev (rankex-dev) | In prod (fitquest-60a09) | Non verificato |
|------|---------------------|--------------------------|----------------|
| 1 CI/E2E verdi, flaky doppio click | verificato (`ab315f3`; poi `5ba0ecf`: CI, E2E, `deploy-dev` success) | non toccata (`deploy-prod` skipped, main a `f086405`) | - |
| 2a guard deploy functions | verificato (rifiuto con tree sporco, stampa sha da pulito) | guard attivo su `deploy`, non eseguito | - |
| 2b deny git distruttivi | verificato in repo usa e getta (locale, non tracciato) | n/a | - |
| 2c tabella ambiente/modulo | regola presente nei 3 file, applicata a 3b/3c/3e | n/a | UAT: nessun progetto/hosting UAT nel repo (`.firebaserc:5-18`) |
| 3a costi Firebase | spesa dev CRF ~0,07 €/1 € letta dall'utente | spesa prod CRF ~0,01 €/5 € letta dall'utente | uso per servizio non letto (decisione utente) |
| 3b rollback functions | provato a `224d1bb` e ritorno, 40 callable nodejs22 | non eseguibile: solo fix forward (decisione 10) | ramo "callable nuove al rollback" non provato (tutti i commit Node 22 hanno le stesse 40 callable) |
| 3c rollback hosting + rules | provato e ritorno a HEAD (rules verificate via Rules API) | non toccato | - |
| 3d caso del lunedi' | test unitario + `qa:dev` 36/36 | non verificato (nessun effetto atteso) | - |
| 3e banner RICARICA | osservato a 1366 px e 360 px; BUG-026 | non toccato | comportamento in prod non provato |
| 3f login trainer/cliente | n/a | non verificato (decisione 6) | fino al primo utente reale |
| 4 CHANGELOG | titolo e template coerenti | n/a | - |
| GYM | n/a | n/a | org QA GYM: rinviata alla prima org GYM reale (decisione utente 12/11/2026; nessuna org QA, noto dal #18) |

### Verifica dei 4 action item del #18
1. **Guard commit functions in CHANGELOG: raggiunto.** `4223cf4`: `deploy:dev` da tree sporco rifiuta (exit 1,
   firebase non lanciato), da pulito stampa `functions deploy da 5090d9ab…` e parte; riga "functions prod a
   `<sha>`" nella checklist e nella voce `[2026.11.12]` (`f086405`). Limite dichiarato: il rollback via
   worktree non passa dal guard (sha annotato a mano).
2. **Controprove su copia: raggiunto.** `af44491`: regola in CLAUDE.md; `git checkout -- .`, `git restore .` e
   `git reset --hard` negati, provati in repo usa e getta (PowerShell e Bash). Limite noto: la cintura non
   copre tutte le varianti (elenco in CLAUDE.md) e `.claude/settings.json` non e' tracciato.
3. **Tabella ambiente/modulo: raggiunto.** `5090d9a`: regola in CLAUDE.md, `developer.md`, `scrum-master.md`;
   tabelle con file:riga nelle voci 3b/3c/3e. UAT resta "non verificato" (nessun deploy UAT).
4. **"Non verificato" chiuso: parziale.** Chiusi: esito E2E su dev (1), costi (3a, uso per servizio non letto),
   lunedi' (3d, `d42d23b` + `555f925`), rollback functions/hosting/rules su dev (3b/3c), banner RICARICA su dev
   (3e, BUG-026). Con motivazione esplicita: login prod (3f, decisione 6), GYM senza org QA. Residui: rollback
   functions prod non eseguibile, ramo "callable nuove" non provato, banner in prod non osservato.

### Passa al #20
Codice:
- **BUG-026** (P3): banner RICARICA sul login a 360 px (fix suggerito in BUGS.md).
- Push dei commit docs locali su `dev` (`0c0d84e`, via libera utente); `main` solo al prossimo rilascio.
Requisiti non di codice / decisioni utente:
- **STORY-029 (b)/(c)** DPA e testo informativa, poi togliere `IS_LIPEDEMA_SELECTABLE`: **rinviato al contratto con la
  prima org Lipedema** (decisione utente 12/11/2026).
- **STORY-026** retention (decisione utente).
- **3f** login trainer/cliente in prod: **rinviato al primo onboarding reale in prod** (decisione utente 12/11/2026).
- Org QA GYM: **rinviata alla prima org GYM reale** (decisione utente 12/11/2026; resta in backlog, nessuno sprint).
- STORY-044 (canvas, non si tocca), stampa su carta, mobile-app (parcheggiata).

## Retrospettiva
Dati: 10 commit (`ab315f3`..`eb9c924`: 1 feat functions (2a), 2 test e2e (3d + correzione `555f925`), 7 docs/processo
tra apertura, 2b, 2c, esiti, decisione 10, 3a, chiusura); voci 0-4 DONE, 3f non verificato per decisione;
1 bug nuovo (BUG-026, P3), 2 debiti nuovi (TD-014, TD-015, tracciati in questa retrospettiva: la chiusura diceva
"nessun debito nuovo"); 0 deploy in prod. Rework: 4 (2a CHANGES REQUESTED -> APPROVED in review HIGH; buco `git -C`
trovato dalle review di 2b; `555f925` sull'attesa dello slot dopo `d42d23b`; checklist di rollback di CLAUDE.md
corretta dopo 3b, piano `744f6f9` annullato dopo 3b con `5ba0ecf`). Non verificato: il dettaglio dei punti della
review 2a (nei docs c'e' solo l'esito).

**Verifica dei 4 action item del #18** (coerente con "Verifica dei 4 action item del #18" sopra)
1. Guard deploy functions: **raggiunto, efficacia provata solo in prova.** `4223cf4`: rifiuto con tree sporco e
   stampa dello sha da pulito, provati davvero (PowerShell) e usati nel ritorno a HEAD della 3b. Non ha bloccato
   nessun deploy reale e non ha mai girato su prod (`deploy` non eseguito); il rollback via worktree lo aggira per
   costruzione (sha annotato a mano). Il debito che il #18 voleva chiudere (sha stimato, non registrato) e'
   chiuso solo al prossimo deploy prod.
2. Controprove su copia / deny: **raggiunto, fragile.** `af44491`: regola in CLAUDE.md + 72 deny, provati in repo
   usa e getta. Nessuna controprova sul working tree nel #19 (la regola non e' stata messa alla prova), quindi
   non si sa se la regola da sola regge. Il deny e' locale e non tracciato, e la review ha trovato un buco reale
   (`git -C`): TD-014.
3. Tabella dev/UAT/prod: **raggiunto, efficacia non dimostrabile.** `5090d9a`: regola nei 3 file, tabelle con
   file:riga in 3b/3c/3e. Le voci del #19 toccavano solo rankex-dev: nessuna scelta d'ambiente in bivio, quindi
   "0 scelte senza riga" e' vero ma non distingue la tabella dall'assenza di rischio. UAT resta "non verificato"
   (nessun deploy UAT).4. "Non verificato" chiuso: **parziale.** Chiusi con esito: E2E su dev (1), costi (3a, senza uso per servizio), lunedi'
   (3d), rollback dev (3b/3c), banner RICARICA su dev (3e, BUG-026). Motivati: 3f, GYM. Residui: rollback
   functions prod non eseguibile, ramo callable nuove, banner e login in prod, GYM senza org QA (terza retro
   consecutiva che lo cita).

**WHAT WENT WELL**
- Sprint di processo chiuso in un giorno, senza deploy in prod e con 0 incidenti. Causa: scope limitato a dev e
  voci con "fatto quando" eseguibile (rifiuto del guard, 40 callable nodejs22 prima/durante/dopo con
  `functions:list`, Rules API per le rules).
- La prova ha trovato cio' che la lettura non aveva trovato: la checklist di rollback aveva superato 3 HIGH di
  review nel #18 e conteneva comunque errori emersi solo eseguendola (3b). Causa: azione 4 del #18 con "eseguire,
  non rileggere".
- Tempi del rollback misurati e scritti in CLAUDE.md (worktree + `npm ci` 14 s, rollback functions 1:37, ritorno
  1:45, `hosting:clone` 7 s, rules 7-8 s): oggi il rollback ha un costo noto.
- Le review hanno trovato difetti reali in processo e script (2a CHANGES REQUESTED, `git -C` in 2b).

**WHAT WENT WRONG / CAUSED BUGS**
- Il piano di rollback functions prod era inattuabile e nessuno se n'e' accorto per un'intera sprint e un rilascio.
  ROOT CAUSE verificata nei docs: i dati per accorgersene c'erano gia' ma non sono stati incrociati. La voce
  CHANGELOG del rilascio annotava 37 callable `nodejs20` in prod e scriveva "Runtime torna a Node 20" nel piano;
  il #16 aveva scritto che Node 20 e' dismesso dal 30/10 e che il prossimo deploy prod deve usare Node 22;
  `744f6f9` e' del 24/10, prima di `13052d6` (31/10). Il commit `744f6f9` e' stato annotato "confermato dall'utente"
  senza controllare `engines.node` in quel commit. Lo spunto "l'utente aveva scritto 744f6f9 Node 22": NON
  verificato nei docs (non c'e' nessuna riga che attribuisca Node 22 a `744f6f9`; se detto a voce, non e' scritto).
  Il difetto vero e' piu' generale: un dato copiato (sha, runtime) e' stato trattato come verificato perche'
  confermato da una persona, non da un comando. IMPACT: nessun danno (scoperto in dev, prima di un bisogno
  reale); il rollback prod e' di fatto "solo fix forward" (rischio accettato, TD-015). ACTION: azione 1.
- La checklist di rollback non era mai stata eseguita prima del #19 (#18, azione 4: "i rollback non sono mai
  stati eseguiti") e conteneva 3 errori/lacune (`<prev>` deve essere Node 22, `worktree remove --force` per i file
  non tracciati, ramo callable nuove non provato). ROOT CAUSE: una procedura scritta e rivista a tavolino senza
  esecuzione; le review HIGH controllano la coerenza, non l'ambiente. IMPACT: costo di 3b e decisione 10 a meta'
  sprint. ACTION: gia' fatta (3b/3c eseguite e checklist corretta); copertura residua in azione 1.
- I deny git sono fragili per costruzione (verificato): a 72 regole la review di 2b ha comunque trovato `git -C`,
  e CLAUDE.md elenca esplicitamente cio' che non copre (`git checkout <file>`, alias, `git -c`, `--git-dir`, script
  che lanciano git...). ROOT CAUSE: un permesso per prefisso testuale non puo' enumerare tutte le forme di un comando
  git; il file e' fuori da git. IMPACT: protezione parziale e non replicabile. ACTION: azione 3.
- BUG-026 (P3): banner RICARICA copre "Password dimenticata?" a 360 px (`App.jsx:54-67`). ROOT CAUSE: banner
  `fixed bottom-5` senza spazio riservato; il banner esiste dal rilascio ma non era mai stato guardato a 360 px
  (3e era la prima volta). IMPACT: basso (RICARICA lo toglie). ACTION: azione 2.
- La chiusura sprint dichiarava "nessun debito nuovo" mentre il deny non tracciato e il rollback prod non
  eseguibile sono debiti dichiarati altrove. ROOT CAUSE: rischi accettati scritti in decisioni/CLAUDE.md ma non in
  TECH-DEBT.md (stesso schema del #18). ACTION: fatta ora (TD-014, TD-015).

**WHAT WAS SLOW**
- Quasi niente: sprint chiuso lo stesso giorno. Le attese erano 5 min di poll per il banner (2 volte) e la data
  di 3a. Non verificato: tempo dell'attesa totale, non registrato.

**WHAT CAUSED REWORK**
- `555f925` dopo `d42d23b` (attesa dello slot con timeout di 120 s del test invece di `expect.toBeVisible`
  15 s) e checklist di rollback riscritta dopo l'esecuzione. Causa comune: assunzioni su ambiente/tempi non
  provate prima (come nel #18).

**WHAT CREATED TECHNICAL DEBT**
- TD-014 (deny locale e non tracciato) e TD-015 (rollback prod solo fix forward, ramo callable nuove non provato).
  ROOT CAUSE: decisioni 4 e 10, rischi accettati consapevolmente ma non tracciati nel file dei debiti.

**ACTION ITEM per lo Sprint #20** (max 5; vincoli: nessun deploy in prod, `main` resta a `f086405` fino al
prossimo rilascio, STORY-044, stampa su carta e mobile-app fuori)
1. **Verificare i dati copiati prima di scriverli (agente, ~1 h).** Script `functions/scripts/checkPrev.mjs <sha>`
   (Node puro) che stampa `engines.node` di `<sha>` e di HEAD e fallisce se il runtime di `<sha>` e' dismesso o
   diverso da quello atteso; chiamato dalla riga "Prev functions" della checklist in CLAUDE.md e dalla regola in
   `developer.md`/`scrum-master.md` ("sha, runtime, versione = output di un comando, non conferma verbale").
   *Fatto quando:* `node functions/scripts/checkPrev.mjs 744f6f9` esce 1 con motivo, `... f086405` esce 0, e la
   checklist lo cita.
2. **Correggere BUG-026 (agente, ~1-2 h).** Banner RICARICA che non copre i controlli del login a 360 px (fix in
   BUGS.md), con un caso di runbook per il banner a 360 px. *Fatto quando:* a 360x640 "Password dimenticata?" e'
   cliccabile col banner visibile (osservato su rankex-dev), BUG-026 FIXED, caso `TP-` aggiunto a
   `config/runbook.config.js`. Review medium.
3. **Tracciare e controllare i deny (decisione utente, poi agente ~1 h).** Decisione utente: ok a tenere in
   `docs/` una copia tracciata dell'elenco dei deny di `.claude/settings.json` (il file resta locale). Se si:
   script `npm run check:deny` che esce 1 se una regola dell'elenco manca da `settings.json`. *Fatto quando:*
   lo script esce 0 oggi e 1 dopo aver tolto una regola dal file di prova; TD-014 aggiornato. Se no: TD-014
   resta OPEN con motivazione.
4. **Org QA per GYM (agente, ~2-3 h).** Estendere `scripts/seed-qa-orgs.mjs` con `qa-gym` (stesse 3 utenze
   `qadev.gym.*`, solo rankex-dev) e un caso `qa:dev` che controlla la terminologia GYM (Membro/Classe/Allenamento).
   *Fatto quando:* `npm run qa:dev:seed` e' idempotente con la nuova org e `qa:dev` verde con il nuovo caso; la riga
   "GYM senza org QA" esce dall'elenco "Non verificato" (citata nei #17, #18, #19). Review medium.
5. **Decisione utente su STORY-029 (b)/(c) e 3f (utente, ~0 di sviluppo).** Dare una data o un rinvio esplicito per
   DPA e testo informativa (bloccanti per attivare lipedema in prod) e per il login trainer/cliente al primo utente
   reale. *Fatto quando:* le due righe in "Passa al #20" hanno una data o la dicitura "rinviato a <evento>"
   decisa dall'utente. Non approvata: e' una richiesta di decisione.

---

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
