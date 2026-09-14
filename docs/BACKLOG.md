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

### [STORY-008] Modello dati obiettivo
**Priority:** P2 · **Status:** BACKLOG

### [STORY-009] UI trainer per fissare/monitorare l'obiettivo
**Priority:** P2 · **Status:** BACKLOG

### [STORY-010] Notifica al raggiungimento
Riusa `notifications.js`/`useNotifications` esistenti. **Priority:** P2 · **Status:** BACKLOG

---

## [EPIC-005] Sistema Avatar + Negozio — discovery (roadmap, epic grande)
Fonte: CLAUDE.md → Roadmap futura, che segnala esplicitamente "allinearsi con il team
prima di iniziare". Non si parte con codice: prima Product Analyst + Tech Lead.

### [STORY-011] Valutazione di valore/priorità reale
Product Analyst: la roadmap la elenca ma non è ancora validata su valore/retention.
**Priority:** P3 finché non validata · **Status:** BACKLOG

### [STORY-012] Modello economico Monete
Fonti di guadagno (sessioni, rank-up, achievement, streak — quest'ultimo dipende da
EPIC-003), nessun acquisto con denaro reale (già deciso). **Status:** BACKLOG

### [STORY-013] Scoping tecnico moduli avatar
Tech Lead: struttura slot/unlockType/`avatar_modules` collection, impatto Firestore.
**Status:** BACKLOG

---
<!-- Nuove epic/user story vengono aggiunte qui sotto dal Product Owner -->
