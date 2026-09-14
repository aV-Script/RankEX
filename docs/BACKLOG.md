# Backlog — RankEX

Fonte di verità per feature/task pianificati ma non ancora completati. Aggiornato dal
Product Owner (nuove voci) e dallo Scrum Master (stato).

**Non duplicare qui la documentazione di prodotto/architettura** — quella resta in
`CLAUDE.md` (single source of truth). Questo file traccia solo *lavoro*, non
*comportamento del sistema già implementato*.

Priorità: P0 blocker · P1 alta · P2 importante non urgente · P3 nice to have
Stati: BACKLOG · READY · IN PROGRESS · BLOCKED · CODE REVIEW · QA · DONE

---

## [EPIC-001] Correttezza dati e sicurezza residua

### [STORY-001] Rollback percentili soccer alle correzioni approvate
**Come** trainer/org_admin soccer_academy **voglio** che i percentili calcolati per
`y_balance`, `standing_long_jump`, `sprint_20m`, `505_cod_agility` riflettano i valori
normativi corretti **per** non valutare erroneamente gli atleti (alcuni minorenni) sulla
base di dati non ancora allineati alla fonte di riferimento.

- **Priority:** P1
- **Modulo:** soccer_academy
- **Acceptance Criteria:**
  - [x] Valori in `utils/tables.js` per i 4 test aggiornati secondo `rankex-tabelle-percentili-v2.xlsx`
  - [x] Copia server `functions/src/shared/tables.js` aggiornata in parallelo (rischio di divergenza già noto — vedi CLAUDE.md → "Copie speculari")
  - [x] ~~Cloud Functions ridistribuite...~~ — non necessario, nessun codice da ridistribuire (vedi finding)
  - [x] `beep_test` resta invariato — confermato, nessuna regressione
- **Dependencies:** branch `calibrazione-percentili-soccer` già pronto — serve merge + verifica, non nuovo lavoro di calibrazione
- **Risks:** nessuno nuovo — vedi finding
- **Finding (set 2026):** la story era **già completamente risolta** prima di aprire lo
  sprint. Il branch citato nella dependency era già stato mergiato in `dev` il 09/05
  (commit `aa1c371`), con una calibrazione ulteriore il 01/07 (`0de30a6`) — CLAUDE.md
  non era mai stato aggiornato dopo il merge e continuava a segnalare i 4 test come "da
  rollback, in attesa di approvazione". Verificato con un confronto testuale diretto
  (non solo storia commit) che `functions/src/shared/tables.js` è identico a
  `utils/tables.js` per tutti e 4 i test — creato il 04/07, dopo l'ultima calibrazione,
  quindi mai stato disallineato. Nessun codice modificato, nessun deploy necessario.
  Solo CLAUDE.md corretto per riflettere lo stato reale.
- **Status:** DONE (verifica soltanto — nessun lavoro di implementazione richiesto)

### [STORY-002] Chiudere RX-63 — accessToken wearable esposto a staff_readonly
**Come** super_admin **voglio** sapere quanti client hanno ancora un `wearable.accessToken`
salvato e chiudere l'esposizione **per** non lasciare un dato sensibile leggibile da un
ruolo che non dovrebbe vederlo (mancanza di filtro di ruolo in `firestore.rules`).

- **Priority:** P1
- **Modulo:** personal_training (feature Wearable è solo PT)
- **Acceptance Criteria:**
  - [x] `scripts/check-wearable-tokens.mjs` eseguito su `rankex-dev` e `fitquest-60a09`, risultato documentato in questa story
  - [x] Se 0 client coinvolti → rimuovere il campo `wearable.accessToken` dallo schema (elimina il rischio alla radice, più semplice di proteggerlo)
  - [ ] ~~Se >0 client coinvolti → spostare `accessToken` in subcollection...~~ — non applicabile, 0 client coinvolti
- **Dependencies:** nessuna — script diagnostico già pronto e committato
- **Risks:** nessuno noto, feature già disattivata lato UI
- **Finding (set 2026):** 0 client con `accessToken` su entrambi gli ambienti (32/4 org
  su rankex-dev, 16/2 org su fitquest-60a09). Nessun codice attuale scrive più il campo
  (`linkGoogleFit` già rimosso in un audit precedente) → nessuna esposizione live.
  **Revisione della AC originale:** rimuovere il campo dallo schema ora sarebbe
  scorretto — `client.wearable` resta intenzionalmente nello schema per l'eventuale
  riattivazione futura (vedi CLAUDE.md → Wearable), e la remediation corretta (RX-63,
  spostare `accessToken` in subcollection) è già documentata per quel momento, non per
  ora. Nessuna azione di codice necessaria oggi — solo verifica + nota di conferma in
  CLAUDE.md.
- **Status:** DONE — script diagnostico e strumentazione firebase-admin restano
  disponibili per verifiche future (es. prima di riattivare la feature)

---

## [EPIC-002] Pulizia debito minore

### [STORY-003] Rimuovere il wrapper `calcPercentile`
**Come** developer **voglio** rimuovere `calcPercentile` da `utils/percentile.js`
**per** eliminare un'API ridondante ormai senza consumer applicativi.

- **Priority:** P3
- **Acceptance Criteria:**
  - [ ] Confermato via grep che l'unico consumer rimasto è `percentile.test.js`
  - [ ] Test riscritto per usare `calcPercentileEx(...).value` direttamente, wrapper rimosso
- **Dependencies:** nessuna
- **Status:** BACKLOG

### [STORY-004] Decidere il destino di `VITE_GOOGLE_FIT_CLIENT_ID`
**Come** team **vogliamo** decidere se rimuovere la variabile da `.env.example` o se serve
per un flusso OAuth pianificato **per** non lasciare una var residua ambigua.

- **Priority:** P3
- **Acceptance Criteria:**
  - [ ] Domanda esplicita all'utente/PO: rimuovere o tenere in vista di un flusso OAuth diretto futuro?
- **Dependencies:** richiede una decisione di prodotto, non solo lavoro tecnico
- **Status:** BACKLOG

---

## [EPIC-003] Streak presenze (roadmap — "Gamification avanzata")
**Finding (set 2026): già completamente implementata.** Terza story di fila (dopo
STORY-001 e STORY-002) costruita da una sezione di CLAUDE.md rimasta indietro rispetto
al codice — qui non era nemmeno un merge non documentato, era un'altra sezione dello
**stesso file** (Gamification) che già descriveva `calcSessionXP(baseXP, streak)` e il
cap "streak 10 = ×2.0", mentre la Roadmap la elencava ancora come "da fare".
Verificato: `sessionStreak` su ogni client, +1 per sessione presente, azzerato a
qualunque assenza, calcolato server-side in `chiudiSessione` (batch atomico, non
falsificabile dal client), superficie UI in 3 punti (CloseSessionModal, ClientCalendar,
SlotCard) + notifiche + test dedicati. Nessun gap reale trovato — non solo la
meccanica, anche la UI è già completa. CLAUDE.md → Roadmap futura corretta.

### ~~[STORY-005] Definire la regola di streak~~
Non necessaria — la regola esiste già ed è quella sopra. **Status:** DONE (n/a, già
implementata)

### ~~[STORY-006] Calcolo streak lato server~~
Già così. **Status:** DONE (n/a, già implementata)

### ~~[STORY-007] UI streak (client + trainer)~~
Già così, in 3 punti. **Status:** DONE (n/a, già implementata)

---

## [EPIC-004] Obiettivi trainer (roadmap — "Gamification avanzata")
Fonte: CLAUDE.md → Roadmap futura. Coach fissa un target su un test specifico per un
cliente; il sistema monitora e notifica al raggiungimento.
**Status: IMPLEMENTATA — set 2026 (Sprint #2).** Verificata assente prima di iniziare
(a differenza di EPIC-003) — qui il lavoro era reale, non solo verifica.

### [STORY-008] Modello dati obiettivo
`clients/{clientId}/goals/{goalId}` + `firestore.rules` (mirror del pattern notes:
create/update solo trainer/org_admin, read anche client, delete sempre false — si
annulla via update di stato per mantenere lo storico) + `paths.js` → `goalsPath`.
7 nuovi test in `tests/rules/firestore.rules.test.js` → describe "Obiettivi del
cliente", tutti verdi contro l'emulatore.
**Priority:** P2 · **Status:** DONE

### [STORY-009] UI trainer per fissare/monitorare l'obiettivo
`GoalsSection.jsx` (tab OBIETTIVI in `ClientDashboard`) — form crea obiettivo (test da
`getTestsForCategoria(client.categoria)`, percentile, scadenza, nota) + lista con
badge di stato (in corso/raggiunto/scaduto/annullato) + annulla. `status: 'missed'`
calcolato al volo (`utils/goals.js`), non salvato — nessun cron necessario.
**Non incluso in questo sprint:** visibilità lato client (Pentagon Nav) — il client
riceve solo la notifica di achievement, non vede la lista obiettivi. Segnato come
fast-follow non bloccante in CLAUDE.md → Roadmap futura.
**Priority:** P2 · **Status:** DONE (scope trainer-only, client-side fast-follow aperto)

### [STORY-010] Notifica al raggiungimento
Achievement rilevato **server-side** in `functions/src/callable/salvaCampionamento.js`
(mai lato client, stesso principio di XP/percentili) — dopo il calcolo percentili,
controlla gli obiettivi `active` del cliente, verifica che il test dell'obiettivo sia
tra quelli appena valutati (per l'ambiguità stat condivise tra test, vedi CLAUDE.md →
percentili), marca `achieved` se `percentile >= target` e invia una notifica
`type: 'goal'` riusando `notifications` esistente.
**Priority:** P2 · **Status:** DONE

**Deploy:** Cloud Functions (`aggiungiObiettivo`, `annullaObiettivo`,
`salvaCampionamento` aggiornata) + `firestore.rules` → **rankex-dev** (set 2026).
**Non ancora su prod (fitquest-60a09)** — in attesa di verifica funzionale su dev
prima del deploy in produzione (disciplina Release Manager: dev prima di prod).

---

## [EPIC-005] Sistema Avatar + Negozio — discovery (roadmap, epic grande)
Fonte: CLAUDE.md → Roadmap futura, che segnala esplicitamente "allinearsi con il team
prima di iniziare". Non si parte con codice: prima Product Analyst + Tech Lead.

**Discovery completata (set 2026) — nessun codice scritto, come da vincolo.** Confermato
via grep: zero codice esistente (`coins`/`avatarEquipped`/`avatarInventory`/
`avatar_modules` non compaiono in `src/`), è davvero da zero.

### [STORY-011] Valutazione di valore/priorità reale
**Status:** DONE (valutazione) — **raccomandazione: NON pronta per essere costruita ora**

Chi beneficia: il client (engagement/retention via personalizzazione) e la piattaforma
(il flusso B2B moduli org-custom è potenzialmente una **nuova fonte di ricavo**, non
solo una feature di engagement — questa è la parte davvero nuova rispetto a XP/rank/
badge/streak/obiettivi già esistenti).

**Rischio di sovrapposizione:** RankEX ha già Badge/Trofei (achievement collezionabili
con showcase), Streak, e ora Obiettivi — tutti meccaniche di progressione/collezione.
Un negozio cosmetico è complementare in teoria, ma senza dati d'uso su quanto le
meccaniche già esistenti stiano già trattenendo i client, costruire una quarta
meccanica di gamification è una scommessa, non una certezza.

**Blocchi reali, non risolvibili scrivendo codice:**
1. **Asset grafici** — ogni modulo avatar (slot × rarità × tipo sblocco) richiede
   un'immagine reale. Non esiste oggi un artista/budget noto per produrle — senza
   asset, non c'è negozio cosmetico da mostrare, solo uno scheletro dati.
2. **Bilanciamento economia** — quante Monete per sessione/rank-up/achievement/streak,
   quanto costa un pezzo — richiede playtesting reale, non un numero indovinato al
   primo giro.
3. **Flusso B2B moduli org-custom** — esplicitamente richiede "contratto, design,
   produzione moduli" **fuori dall'app** (CLAUDE.md, testuale) — l'ingegneria da sola
   non può consegnare valore su questa parte finché non esiste almeno un'org cliente
   interessata a comprarli.

### [STORY-012] Modello economico Monete
**Status:** DONE (scoping) — bloccata su STORY-011

Fonti di guadagno confermate dalla roadmap: sessioni, rank-up, achievement, streak
(quest'ultimo già implementato, EPIC-003) — nessun acquisto con denaro reale (già
deciso, non negoziabile). **Non definibili qui:** gli importi esatti per fonte e i
prezzi in negozio — richiedono playtesting, non stimabili a tavolino.

**Superficie di integrazione tecnica** (per quando/se si procede): assegnare Monete
tocca **più Cloud Function esistenti coordinate**, non una sola nuova — `chiudiSessione`
(sessioni+streak), `salvaCampionamento` (achievement test), `salvaBia` (se si include),
`awardBadge`/`checkAutoBadges` (achievement badge). Va sempre server-side, stesso
principio di XP/percentili — il client non deve poter assegnarsi Monete da solo.
Superficie di modifica più larga di qualunque epic fatta finora in questo processo.

### [STORY-013] Scoping tecnico moduli avatar
**Status:** DONE (scoping) — **+ STORY-014 aggiunta sotto**: l'utente ha scelto di
procedere comunque con uno spike tecnico (override esplicito della raccomandazione di
STORY-011, vedi `docs/DECISIONS.md` → ADR-003), invece di parcheggiare l'epic.

Modello dati raffinato rispetto allo schizzo in Roadmap:
```js
avatar_modules/{moduleId}   // top-level, non sotto un'org — catalogo condiviso + esclusivi
  slot, name, rarity, unlockType: 'default'|'level'|'rank'|'purchase'|'org_custom',
  unlockValue,  // livello | rank label | prezzo Monete
  orgId,        // null = globale, altrimenti esclusivo per quell'org
  price, imageUrl, createdAt

clients/{clientId}
  coins            // saldo
  avatarEquipped   // { testa, corpo, capelli, occhi, bocca, accessorio } → moduleId
  avatarInventory  // [moduleId, ...] — pezzi sbloccati (default+level+rank+acquistati)
```

**Punti tecnici che serviranno, se si procede:**
- Acquisto negozio → nuova Cloud Function con **transazione Firestore** (non batch) —
  scala/spendi Monete è un'operazione a rischio race-condition su doppio tap, serve
  atomicità reale, non "abbastanza atomico".
- Sblocco automatico per livello/rank → hook analogo a `useBadges` → `checkAutoBadges`,
  stesso pattern già rodato.
- Flusso B2B: 3 superfici UI nuove (form richiesta org_admin, gestione/upload
  super_admin, negozio client) — dimensione paragonabile a Obiettivi+Runbook insieme,
  **più grande** di qualunque epic completata finora in questo processo.

### [STORY-014] Spike tecnico negozio avatar (override ADR-002)
**Status:** DONE — implementato, verificato dal vivo contro rankex-dev, non solo
letto. Vedi `docs/DECISIONS.md` → ADR-003 per il dettaglio completo.

Scope volutamente ridotto rispetto allo schizzo di STORY-013: riusa le 9 immagini
avatar esistenti invece del sistema a 6 slot (nessuna arte reale disponibile), Monete
guadagnate solo da sessione presente (non rank-up/achievement/streak), nessuna
collection `avatar_modules` (regole di sblocco in config, non un catalogo gestibile),
nessun flusso B2B.

**File:** `config/avatars.config.js` (+ `isAvatarUnlocked`), `functions/src/shared/
avatarUnlocks.js` (copia server), `functions/src/callable/acquistaAvatar.js`
(transazione Firestore), `chiudiSessione.js` (+ Monete per sessione),
`AvatarPicker.jsx` (UI lucchetto/acquisto), `purchaseAvatarUseCase.js`.

**Deploy:** Cloud Functions su rankex-dev. Non ancora su prod.

---

## [EPIC-006] Runbook manuale — tracking test QA da super_admin
**Status: IMPLEMENTATA — set 2026.** Nata da una richiesta diretta dell'utente durante
la verifica manuale di EPIC-004 ("dovremmo tracciare questi test da qualche parte"),
non dal backlog pre-esistente — aggiunta qui retroattivamente per coerenza col
processo.

**Finding all'apertura:** `docs/test-plan.md` esisteva già — 36 casi ben strutturati,
mai una volta segnati come superati (tabella "Registro esecuzione" completamente
vuota) — e descriveva feature già rimosse (layout dashboard 2 colonne, flusso Google
Fit client). Confermato che valeva la pena costruire lo strumento invece di continuare
a fidarsi di un markdown che nessuno aggiornava.

### [STORY-011] Migrazione + refresh contenuto test-plan.md → config
Portati i 36 casi in `config/runbook.config.js`, corretti i 3 che descrivevano feature
rimosse/cambiate (dashboard trainer, Wearable, dashboard client → Pentagon Nav),
aggiunti 7 nuovi casi per feature senza copertura (Misure, Streak, Trofei/Badge,
Obiettivi, Pentagon Nav, Temi, Avatar). Scope scelto esplicitamente dall'utente
(alternativa: solo il meccanismo, refresh dopo) — 43 casi totali.
**Priority:** P2 · **Status:** DONE

### [STORY-012] Storico esecuzioni + UI super_admin
`qa_runs/{runId}` (top-level, no Cloud Function — super_admin è già il ruolo più
fidato) + `RunbookPage.jsx`: scegli suite → checklist pass/fail/skip con nota → salva
→ storico con contatori. 4 nuovi test rules ("Runbook (qa_runs)"), tutti verdi.
**Priority:** P2 · **Status:** DONE

**Deploy:** firestore.rules (qa_runs) già su rankex-dev. Nessuna Cloud Function
coinvolta in questo epic.

---
<!-- Nuove epic/user story vengono aggiunte qui sotto dal Product Owner -->
