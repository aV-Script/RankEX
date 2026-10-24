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
  - [x] Confermato via grep che l'unico consumer rimasto è `percentile.test.js`
  - [x] Test riscritto per usare `calcPercentileEx(...).value` direttamente, wrapper rimosso
- **Dependencies:** nessuna
- **Status:** DONE — wrapper rimosso, describe block di test dedicato eliminato
  (i 2 test erano tautologici una volta rimosso il wrapper stesso), commento residuo
  in `tables.js` corretto, CLAUDE.md aggiornato. 0 riferimenti rimasti (verificato
  via grep). Build+lint+vitest puliti (211/211).

### [STORY-004] Decidere il destino di `VITE_GOOGLE_FIT_CLIENT_ID`
**Come** team **vogliamo** decidere se rimuovere la variabile da `.env.example` o se serve
per un flusso OAuth pianificato **per** non lasciare una var residua ambigua.

- **Priority:** P3
- **Acceptance Criteria:**
  - [x] Domanda esplicita all'utente/PO: rimuovere o tenere in vista di un flusso OAuth diretto futuro?
- **Dependencies:** richiede una decisione di prodotto, non solo lavoro tecnico
- **Status:** DONE — utente ha confermato rimozione, nessun flusso OAuth diretto
  pianificato. Rimossa da `.env.example`, CLAUDE.md aggiornato.

**EPIC-002 CHIUSA** — entrambe le story completate.

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

## [EPIC-007] Privacy & Data Protection — remediation audit

> **L'utente ha richiesto priorità MASSIMA su questi risultati.** Questa epic è il
> focus del prossimo sprint, prima di qualunque altro item di backlog — incluso il
> completamento di EPIC-005 (Sistema Avatar + Negozio), che resta comunque bloccata
> sulle sue dipendenze esterne note (STORY-011..014) a prescindere da questa decisione.

Fonte: Privacy & Data Protection Audit completo di RankEX, richiesto esplicitamente
dall'utente (set 2026). Ogni riferimento file:riga citato nel report è stato riverificato
con Read/Grep prima di scrivere le story sotto — nessun dato preso per buono dal
riepilogo fornito (in un caso il numero di riga era corretto, in tutti gli altri
confermato testualmente).

**Perché una sola epic e non due:** l'epic mescola deliberatamente fix di codice pronti
per lo sprint (Status: BACKLOG, un developer può partire) e item bloccati su input non
tecnico — decisione utente o contenuto legale (Status: BLOCKED) — nello stesso posto,
stesso pattern già usato in EPIC-005 (STORY-011 "non pronta" accanto a STORY-014
"implementata"). Separarle in due epic avrebbe solo duplicato l'intestazione senza
aiutare lo Scrum Master, che deve comunque vedere l'intero perimetro dell'audit per
sequenziare lo sprint.

### [STORY-015] Validare i campi di scrittura in `audit_logs`
**Come** super_admin **voglio** che le voci in `audit_logs` non possano essere
falsificate da nessun altro ruolo **per** poter usare il log come prova affidabile in
caso di incidente di sicurezza.

- **Priority:** P0
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] `firestore.rules` → la regola `create` su `/audit_logs/{logId}` (oggi
    `allow create: if isAuth();`, righe 243-248) richiede
    `request.resource.data.uid == request.auth.uid`
  - [ ] la regola richiede `request.resource.data.keys().hasOnly(['action','uid','email','timestamp','userAgent','details','env'])`
  - [ ] la regola richiede che `email` corrisponda a `request.auth.token.email` (evita
    spoofing dell'email nel log)
  - [ ] nuovo test in `tests/rules/firestore.rules.test.js`: un `client` non può
    scrivere un log con `uid` diverso dal proprio; non può aggiungere campi extra
    (`role: 'super_admin'` iniettato a mano, es.); il flusso legittimo (`auditLog()` da
    `utils/auditLog.js`, chiamato su login/logout/ecc.) continua a funzionare
  - [ ] deploy rules su `rankex-dev` e verifica manuale prima di `fitquest-60a09`
- **Dependencies:** modifica a `firestore.rules` → deploy separato su entrambi i
  progetti Firebase (`npm run deploy:rules:dev` poi `npm run deploy:rules`).
  ~~Coordinare con STORY-017: entrambe toccano la stessa regola `create`...~~ —
  **decaduto**: la decisione Tech Lead su STORY-017 (ADR-004) instrada il log dei
  login falliti via Cloud Function/Admin SDK, che bypassa `firestore.rules` per
  definizione. STORY-017 **non tocca più questa regola** — le due story sono
  indipendenti, deploy separati, nessun coordinamento necessario.
- **Note tecniche vincolanti (Tech Lead, per il developer):**
  - `tests/rules/firestore.rules.test.js` → `ctxFor(uid)` (riga 83) oggi chiama
    `testEnv.authenticatedContext(uid)` **senza claim `email`** — per ogni contesto di
    test esistente `request.auth.token.email` è `undefined`. La regola
    `request.resource.data.email == request.auth.token.email` va quindi accompagnata
    da un aggiornamento di `ctxFor` per passare una email di test (es.
    `testEnv.authenticatedContext(uid, { email: \`${uid}@test.local\` })`) — verificare
    che non alteri il comportamento di altre regole/test già passanti (nessun'altra
    regola oggi legge `request.auth.token.email`, quindi il rischio di rottura è basso
    ma va controllato).
  - Il test esistente riga 332 (`addDoc(..., { action: 'LOGIN', uid: 'trainer1' })`,
    unico test di `create` legittimo oggi) va aggiornato per includere un campo `email`
    coerente con la claim di test, altrimenti la nuova regola lo respinge.
  - `hasOnly([...])` deve elencare esattamente i 7 campi scritti da ogni chiamata reale
    di `utils/auditLog.js`: `['action','uid','email','timestamp','userAgent','details','env']`.
- **Risks:** nessuna voce storica esistente viola le nuove regole (si applicano solo a
  nuove `create`, non retroattive); verificare che l'app scriva sempre correttamente
  `uid`/`email` (già lo fa, vedi `utils/auditLog.js` righe 41-49)
- **Status attuale (24/10/2026):** DONE — in produzione (ott 2026)
- **Status:** CODE REVIEW — implementato: `firestore.rules` aggiornata (uid/email
  anti-spoofing + `hasOnly` sui 7 campi), `tests/rules/firestore.rules.test.js` esteso
  (`ctxFor` ora passa una claim `email` di test, nuovo test sul flusso legittimo +
  3 nuovi test sui casi di rifiuto). `npm run test:rules`: 47/47 verdi. **Deploy rules
  non eseguito** (fuori scope developer per questo sprint) — resta da fare su
  `rankex-dev` poi `fitquest-60a09` prima della verifica manuale finale in AC.

### [STORY-016] Cascade delete completo in `eliminaCliente`
**Come** org_admin/trainer che elimina un cliente **voglio** che tutti i dati collegati
(note, obiettivi, riferimenti in slot/ricorrenze/notifiche/schede) vengano rimossi
insieme al cliente **per** rispettare il diritto alla cancellazione senza lasciare dati
personali orfani — incluse note testuali libere che possono riguardare un minore.

- **Priority:** P0
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] `functions/src/callable/eliminaCliente.js` (verificato: oggi cancella solo
    `clients/{id}`, `users/{uid}`, l'account Auth, e rimuove il riferimento da
    `groups` — nessun'altra pulizia) estesa per cancellare anche: subcollection
    `clients/{id}/notes/*`, subcollection `clients/{id}/goals/*`
  - [ ] rimuove `clientId` da `clientIds`/`attendees`/`absentees` in tutti i documenti
    `slots` che lo referenziano
  - [ ] rimuove `clientId` da `clientIds` in tutti i documenti `recurrences` che lo
    referenziano
  - [ ] elimina tutte le `notifications` con `clientId` corrispondente
  - [ ] elimina **per intero** le `workoutPlans` con `clientId` corrispondente —
    **deciso dal Tech Lead: cancellare, non archiviare** (vedi nota sotto)
  - [ ] l'operazione resta corretta anche oltre il limite di 500 operazioni per batch
    Firestore — batching a chunk se il volume di documenti referenziati lo supera
  - [ ] test (emulatore o runbook manuale): crea un cliente con note + goal + slot +
    ricorrenza + notifica + scheda, elimina il cliente, verifica zero documenti
    orfani residui in tutte le collection sopra
  - [ ] nessuna regressione sulla cancellazione account Auth + `clientCount` già
    esistente
- **Decisione Tech Lead — cancellare `workoutPlans`, non archiviare:** l'AC originale
  lasciava la scelta aperta. Archiviare lascerebbe dati personali orfani (una scheda può
  contenere note libere sul cliente, es. infortuni) senza che nessuna UI la mostri mai
  più — è dato orfano con un passaggio in più, contrario allo scopo della story (diritto
  alla cancellazione). Coerente con `notifications`, già previste per eliminazione totale.
- **Note tecniche vincolanti (Tech Lead, per il developer):**
  - **`notes/` e `goals/`** (subcollection sotto il cliente): usare
    `db.recursiveDelete(clientRef.collection('notes'))` (Admin SDK, già disponibile in
    `firebase-admin@^12`) invece di query+batch manuale — gestisce internamente
    dimensioni arbitrarie (usa `BulkWriter`), nessun rischio di limite 500 operazioni
    per queste due subcollection. Stessa cosa per `goals/`.
  - **`slots`**: tre query `array-contains` separate (`clientIds`, `attendees`,
    `absentees` — Firestore non supporta OR tra campi diversi in una query), deduplicare
    i doc id risultanti in un `Set` prima di costruire gli update (un cliente potrebbe
    comparire in più di uno dei tre array sullo stesso slot).
  - **`recurrences`**: query `array-contains` su `clientIds`.
  - **`notifications`/`workoutPlans`**: query `where('clientId', '==', clientId)`,
    eliminazione intera del documento (non solo rimozione del riferimento).
  - **Batching**: per le operazioni di query+modifica su `slots`/`recurrences`
    (documenti condivisi con altri client, non cancellabili per intero — a differenza
    di `notes`/`goals`), usare `db.batch()` a chunk di **≤450** operazioni (margine
    sotto il limite di 500, per lasciare spazio a delete cliente + decremento counter
    nello stesso giro), committati in sequenza — stesso stile `db.batch()` già usato
    nel resto delle callable, niente `BulkWriter` qui (le mutazioni sono su documenti
    che contengono anche dati di altri client, non un delete isolato).
  - **Test**: nessun harness di test per le Cloud Functions esiste oggi in questo repo
    (`firebase-functions-test` è una devDependency mai usata — zero file `*.test.js`
    sotto `functions/`). La verifica segue lo stesso precedente di STORY-014/ADR-003:
    uno script one-off contro `rankex-dev` che crea il fixture completo, chiama
    `eliminaCliente`, e verifica zero documenti orfani — non richiede di costruire da
    zero una suite emulatore per le Functions in questa story.
- **Dependencies:** nessuna migrazione dati per i client eliminati d'ora in poi.
  **Decisione Tech Lead sullo script una tantum per i client GIÀ eliminati in passato
  con dati orfani residui: fuori scope per questa story.** Costruire in sicurezza uno
  script che trova/cancella riferimenti orfani su ogni org è un lavoro non banale
  (nessun danno attivo dai dati orfani storici oltre a quello già esistente, mentre lo
  scope P0 di questo sprint è fermare il problema per le cancellazioni future). Se
  serve, va aperta come nuova story separata (P2, non bloccante per la chiusura di
  questo sprint).
- **Risks:** volume di letture/scritture più alto per singola cancellazione
  (query aggiuntive prima del batch) — accettabile sul piano Spark ma da monitorare
  su clienti con storico lungo (molti slot/ricorrenze)
- **Status attuale (24/10/2026):** DONE — in produzione (ott 2026)
- **Status:** CODE REVIEW → **fix applicati post-review**. `functions/src/callable/eliminaCliente.js`
  esteso con `recursiveDelete` su `notes/`/`goals/`, tre query `array-contains` su
  slots (dedup via `Map`), query `array-contains` su recurrences, query+delete
  integrale su notifications/workoutPlans. **Finding HIGH del code-reviewer risolto:**
  la sequenza iniziale committava le operazioni "core" (delete cliente, delete
  `users/{uid}`, decremento `clientCount`) per ultime, in coda alla stessa catena di
  chunk della pulizia referenziale — un fallimento a metà (rete, un chunk oltre il
  primo su cliente con storico lungo) avrebbe potuto cancellare note/obiettivi per
  sempre lasciando il cliente ancora presente, l'opposto dell'obiettivo della story.
  Riordinato: il delete "core" è ora un `db.batch()` atomico a sé, committato PRIMA di
  `recursiveDelete` e della pulizia referenziale — un fallimento successivo lascia al
  più riferimenti pendenti (rischio minore, preesistente), mai un cliente "cancellato"
  ma ancora presente con dati già spariti sotto. Re-verificato dopo il fix: sintassi
  OK (`node --check`), lint+211/211 test unitari invariati. **QA (2026-09-15):**
  logica di dedup/filtro array verificata con uno script Node standalone che
  simula un cliente presente sia in `clientIds` sia in `attendees` dello stesso
  slot — un solo update, entrambi gli array puliti correttamente. Nessun bug
  aperto. **Deployato e verificato dal vivo contro rankex-dev (2026-09-15):**
  script one-off contro `test-org-pt` — creato un cliente reale con nota,
  obiettivo, slot (clientIds+attendees), ricorrenza, notifica e scheda
  allenamento collegati, chiamata `eliminaCliente`, confermato: cliente e
  subcollection `notes`/`goals` cancellati, notifica e scheda cancellate,
  slot/ricorrenza (condivisi con altri client, non cancellabili per intero)
  ripuliti del riferimento a questo cliente ma non cancellati per intero,
  `clientCount` ripristinato dopo il test (il fixture non passava da
  `creaCliente`, quindi non lo aveva mai incrementato). Zero residui. Script
  eliminato dopo l'uso (one-off, path relativi specifici all'ambiente di test).
- **Status: DONE su rankex-dev.** Non ancora deployato su `fitquest-60a09` (prod).

### [STORY-017] Loggare davvero i tentativi di login falliti
**Come** super_admin **voglio** che ogni login fallito venga effettivamente registrato
in un log consultabile **per** poter rilevare pattern di brute-force/credential
stuffing, invece di un codice che sembra farlo ma non scrive mai nulla.

- **Priority:** P0
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] confermato il bug: `src/features/auth/useLoginForm.js` (riga 28) chiama
    `auditLog(AUDIT_ACTIONS.LOGIN_FAILED, { email })` dopo un login fallito, ma
    `src/utils/auditLog.js` (righe 36-38) fa `return` immediato se
    `getAuth(app).currentUser` è `null` — condizione sempre vera subito dopo un
    login fallito. Oggi **zero** tentativi falliti vengono mai scritti.
  - [x] **Decisione Tech Lead (2026-09-14, vedi `docs/DECISIONS.md` → ADR-004):
    opzione (b)** — Cloud Function callable dedicata `registraLoginFallito` (nome in
    italiano, coerente con le altre 34 callable — non `logFailedLogin`), invocabile
    senza autenticazione, che scrive via Admin SDK. Nessuna modifica a
    `firestore.rules`: l'Admin SDK bypassa le rules per definizione, quindi questa
    story **non tocca più** la regola `create` di `/audit_logs/{logId}` — vedi nota
    "decaduto" in STORY-015.
  - [ ] con l'approccio scelto: un login con password errata su un'utenza esistente
    produce una entry verificabile entro pochi secondi
  - [ ] il meccanismo non permette a un attaccante non autenticato di scrivere azioni
    diverse da `auth.login_failed`, né di leggere `audit_logs`
  - [ ] test automatico/emulatore che simula un login fallito end-to-end e verifica
    la entry di log — **rivisto dal Tech Lead**: nessun harness di test esiste oggi
    per le Cloud Functions in questo repo (vedi nota tecnica sotto); la verifica è
    uno script one-off contro `rankex-dev` (stesso precedente di STORY-014/ADR-003)
    + un nuovo caso nel runbook manuale (`config/runbook.config.js`), non una nuova
    suite emulatore da zero
  - [ ] rimosso/corretto il codice attuale che lascia intendere che il logging
    funzioni già (oggi silenzioso e senza errore, quindi invisibile in review)
- **Note tecniche vincolanti (Tech Lead, per il developer):**
  - Callable hardcoda `action: 'auth.login_failed'` server-side — ignora qualunque
    `action` eventualmente inviato dal client (requisito di sicurezza dell'AC).
  - Valida `email` lato server (stringa non vuota, lunghezza ragionevole, forma
    email plausibile) prima di scriverla; nessun altro campo libero accettato.
  - Guardrail minimo anti-abuso: query di lettura prima della scrittura per non
    scrivere più di una entry ogni N secondi (es. 10-30s) per la stessa email
    normalizzata — non risolve un attaccante con email casuali/distribuite (rischio
    residuo accettato, vedi ADR-004), ma limita il caso più economico da eseguire.
  - Entry scritte con **`uid: null`** (nessun utente autenticato esiste al momento
    del fallimento) — variazione di schema rispetto a tutte le altre entry di
    `audit_logs`, da documentare per chi in futuro consulta la collection.
  - Nuovi file: `functions/src/callable/registraLoginFallito.js`,
    `usecases/registraLoginFallitoUseCase.js`, export in `functions/src/index.js`.
  - `useLoginForm.js`: il catch del login fallito chiama la nuova usecase al posto
    di `auditLog()` per questo solo evento — **pattern invertito** rispetto alle
    altre 34 usecase (dove il client chiama `auditLog()` dopo il successo della
    callable): qui è la Cloud Function stessa a scrivere l'entry, perché non esiste
    un utente autenticato lato client che possa farlo. Lasciare un commento esplicito
    nel codice sul perché — per non ricreare in negativo la stessa trappola silenziosa
    che questa story risolve.
- **Dependencies:** nessuna — decisione Tech Lead presa (ADR-004), disaccoppiata da
  STORY-015 (non tocca `firestore.rules`). Deploy separato via `functions/` (`cd
  functions && npm run deploy:dev` poi `npm run deploy`), non incluso nel deploy
  automatico di `deploy.yml`.
- **Risks:** rate limit per-email non ferma un attaccante con email casuali/distribuite
  — rischio residuo accettato esplicitamente in ADR-004, da rivalutare solo se si
  osserva abuso reale (non da costruire preventivamente oggi).
- **Status attuale (24/10/2026):** DONE — in produzione (ott 2026)
- **Status:** CODE REVIEW → **fix applicato post-review**. Implementato:
  `functions/src/callable/registraLoginFallito.js` (no auth, valida email, throttle
  5 entry/5min per email), export in `functions/src/index.js`,
  `src/usecases/logFailedLoginUseCase.js`, `useLoginForm.js` aggiornato con commento
  esplicito sul pattern invertito. **Finding HIGH del code-reviewer risolto:** la
  query di throttle non aveva `limit`, quindi scaricava l'intero storico di quella
  email ad ogni chiamata — costo di lettura illimitato su un endpoint pubblico non
  autenticato (lo stesso tipo di rischio per cui ADR-004 aveva scartato l'opzione
  (a), qui ripresentato lato lettura). Aggiunto `.orderBy('timestamp','desc').limit(5)`
  e il relativo indice composito (`action`, `email`, `timestamp` DESC) in
  `firestore.index.json`. Sintassi verificata (`node --check`), build+lint FE puliti,
  `firestore.index.json` validato come JSON. **Non ancora deployato né verificato dal
  vivo** (nessun harness Cloud Functions in repo, nessun deploy eseguito per questo
  sprint) — la verifica one-off contro `rankex-dev` + il nuovo caso runbook restano
  da fare dopo il deploy (**il deploy delle functions richiede anche
  `firebase deploy --only firestore:indexes` per il nuovo indice**, altrimenti la
  prima query fallirebbe con `FAILED_PRECONDITION`). **QA (2026-09-15):** confermato
  dal vivo contro rankex-dev che la funzione non esiste ancora (CORS/400 in console
  browser durante un login fallito reale) — atteso, nessun deploy eseguito. Nessun
  bug aperto. Nota cosmetica non bloccante: il file usecase si chiama
  `logFailedLoginUseCase.js` invece di `registraLoginFallitoUseCase.js` come da
  convenzione italiana delle altre 34 usecase — funzionalmente identico, non
  corretto perché puramente di naming dopo 2 giri di review sul comportamento.

### [STORY-018] Messaggio di errore login generico (anti account-enumeration)
**Come** utente non autenticato **NON voglio** poter dedurre se un'email è registrata
su RankEX dal messaggio di errore di login, **per** non esporre l'iscrizione di un
account — incluso quello di un genitore di un minore iscritto a soccer_academy — a chi
prova email a caso.

- **Priority:** P0
- **Modulo:** entrambi
- **Nota:** fix quasi banale (una riga in una tabella di mapping) — candidabile a
  implementazione diretta senza aspettare l'intero sprint, secondo la regola "non
  burocratizzare l'ovvio" di CLAUDE.md. Resta nell'epic solo per tracciabilità
  dell'audit.
- **Acceptance Criteria:**
  - [x] `src/utils/firebaseErrors.js`: `'auth/user-not-found'` e
    `'auth/wrong-password'` restituiscono lo stesso messaggio generico
    ("Credenziali non valide")
  - [x] verificato che il flusso di reset password non viene alterato (mappa
    condivisa, ma scope diverso — vedi finding adiacente sotto)
  - [ ] test manuale: login con email inesistente e login con email esistente +
    password sbagliata mostrano testo identico in UI — da eseguire in QA
- **Verifica Tech Lead:** confermato via grep che `'auth/user-not-found'`,
  `'auth/wrong-password'`, `'auth/invalid-credential'` compaiono in `src/` **solo**
  come chiavi in `FIREBASE_ERROR_MESSAGES` — nessun altro punto del codice ramifica su
  questi codici per un comportamento diverso dal solo testo del messaggio. Nessuna
  controindicazione, nessuna nota tecnica vincolante necessaria: il fix è isolato come
  previsto.
- **Finding adiacente (non blocca questa story, segnalato per il Product Owner):**
  `resetPassword()` (`firebase/services/auth.js`) chiama `sendPasswordResetEmail`
  direttamente — se il progetto Firebase Auth non ha "Email Enumeration Protection"
  attiva in Console, questa chiamata può ancora rigettare con `auth/user-not-found`
  per un'email inesistente, e `handleReset` in `useLoginForm.js` mostra un errore
  invece dello schermo di successo (`view: 'reset_sent'`) — l'esistenza di un account
  resterebbe deducibile dal flusso di reset password **indipendentemente dal testo del
  messaggio** (basta la presenza/assenza di un errore). Il fix di questa story non
  peggiora né risolve questo, essendo scope diverso (messaggio, non stato UI) — ma vale
  la pena una story dedicata a verificare l'impostazione "Email Enumeration Protection"
  su entrambi i progetti Firebase (stesso tipo di verifica di STORY-021, non risolvibile
  da solo codice).
- **Dependencies:** nessuna
- **Risks:** nessuno — cambio isolato, nessuna migrazione
- **Status attuale (24/10/2026):** DONE — in produzione (ott 2026)
- **Status:** CODE REVIEW → **fix applicato post-review**. **Finding MEDIUM del
  code-reviewer risolto:** la prima implementazione applicava il messaggio generico
  direttamente a `FIREBASE_ERROR_MESSAGES`, la mappa condivisa usata anche da
  `ProfilePage.jsx`/`AdminProfilePage.jsx`/`ChangePasswordScreen.jsx` per il cambio
  password di un utente **già autenticato** — lì `auth/wrong-password` non è un
  rischio di enumeration (l'identità è già nota), e il messaggio generico era una
  regressione UX ("Credenziali non valide" invece di "Password non corretta").
  Corretto: `FIREBASE_ERROR_MESSAGES` torna ai messaggi originali specifici; aggiunta
  una funzione dedicata `getLoginErrorMessage()` in `src/utils/firebaseErrors.js`,
  usata **solo** nel catch del login in `useLoginForm.js`, che unifica
  `auth/wrong-password`/`auth/user-not-found`/`auth/invalid-credential` in
  "Credenziali non valide". Gli altri flussi (cambio password, reset) restano su
  `getFirebaseErrorMessage()` invariato. Lint pulito, 211/211 test unitari verdi
  (nessuna regressione). **QA (2026-09-15) — verificato dal vivo con Playwright
  contro rankex-dev:** email inesistente e password errata su email esistente
  mostrano lo stesso identico "Credenziali non valide"; flusso reset password
  invariato (schermata "Email inviata", non un errore). Nessun bug aperto.
  **Status: QA — passata, pronta per DONE dopo deploy rules/functions.**

### [STORY-019] Pubblicare Privacy Policy e Cookie Policy in-app
**Come** utente (trainer/org_admin/client, incluso il genitore di un minore
soccer_academy) **voglio** poter consultare una Privacy Policy e una Cookie Policy
pubblicate nell'app **per** sapere come i miei dati — o quelli di mio figlio — vengono
trattati, come richiesto dal GDPR.

- **Priority:** P0
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] esiste una route pubblica raggiungibile anche da non autenticati (es.
    `/privacy`, `/cookie-policy`, o pagina unica) con i contenuti legali
  - [ ] link visibile nel form di login e in un punto stabile dell'app per utenti
    autenticati (footer/menu)
  - [ ] il contenuto copre almeno: titolare del trattamento, finalità, basi
    giuridiche, categorie di dati trattati (inclusi dati di minori 7-13 del modulo
    soccer_academy e dati BIA/salute), destinatari terzi (Google Cloud/Firebase,
    Google Fonts se non ancora self-hosted — vedi STORY-022), tempi di
    conservazione (vedi STORY-026), diritti dell'interessato e modalità di esercizio
  - [ ] versione e data di ultimo aggiornamento visibili nel testo
- **Dependencies:** **BLOCCANTE — i contenuti legali non possono essere scritti dal
  Developer.** Serve che l'utente (o un consulente privacy/legale esterno) fornisca e
  approvi il testo prima che questa story possa passare a READY. L'implementazione
  (route + link + layout) è banale una volta ricevuto il contenuto — non è questo il
  collo di bottiglia.
- **Risks:** pubblicare una policy scritta senza competenza legale reale (es. un
  placeholder generico copiato online) è peggio di non pubblicarla affatto — rischio
  di dichiarazioni non veritiere sul trattamento dei dati
- **Status attuale (24/10/2026):** BLOCKED — bozza Informativa Privacy pronta (Claude Docs, 24/10/2026), in attesa di revisione legale; poi pagina /privacy + link dal login
- **Status:** BLOCKED — in attesa di contenuto legale da parte dell'utente o di un
  consulente esterno

### [STORY-020] Chiarire raccolta/registrazione del consenso genitoriale per i minori
**Come** org_admin di un'accademia soccer_academy **voglio** sapere chi è responsabile
di raccogliere il consenso del genitore/tutore per un allievo minorenne
(`soccer_youth` 7-9, `soccer_junior` 10-13) e se/dove RankEX deve registrarne
l'evidenza, **per** non trattare dati di minori senza una base giuridica chiara.

- **Priority:** P0
- **Modulo:** soccer_academy
- **Acceptance Criteria** (di analisi/decisione, non di codice — "PASS" = risposta
  ottenuta e documentata, non una condizione booleana sul sistema):
  - [ ] risposta esplicita dell'utente: chi è il Titolare del trattamento per i dati
    dei minori — RankEX o la singola organizzazione/accademia cliente? (rilevante
    anche per STORY-019)
  - [ ] risposta esplicita: il consenso genitoriale viene raccolto fuori dall'app
    (es. modulo cartaceo in accademia) o deve esistere una feature in-app che lo
    richiede/registra prima di creare il profilo di un cliente minorenne?
  - [ ] confermato via grep (già fatto in questo audit): nessun riferimento a
    "consenso"/"genitore"/"tutore"/"parental" in `src/` — non esiste oggi alcun
    campo o flusso dedicato in `NewClientView.jsx` né nel modello Cliente
  - [ ] se la risposta richiede una feature in-app, va aperta una nuova story di
    implementazione con AC tecnici propri (es. campo `parentalConsent: { given,
    byName, date }` sul modello cliente) — non in questa story
  - [ ] se la risposta è "fuori app, responsabilità dell'organizzazione cliente",
    va esplicitato nella Privacy Policy (STORY-019) come parte del
    titolare/contitolare del trattamento
- **Dependencies:** **BLOCCANTE — decisione di modello di business/legale
  dell'utente**, non risolvibile da solo sviluppo. Dipende anche dall'esito di
  STORY-019 (chi è il Titolare).
- **Risks:** se non chiarito, RankEX potrebbe trattare dati di minori senza base
  giuridica documentata — rischio legale/reputazionale più alto di qualunque item
  tecnico in questa epic
- **Status attuale (24/10/2026):** BLOCKED — il DPA (bozza 24/10/2026) mette il consenso genitoriale a carico dell'org; serve conferma del legale
- **Status:** BLOCKED — in attesa di decisione dell'utente sul modello
  Titolare/Contitolare e sul flusso di raccolta consenso

### [STORY-021] Verificare la regione del database Firestore
**Come** team RankEX **vogliamo** sapere se `rankex-dev` e `fitquest-60a09` risiedono
in una regione UE, **per** capire se i dati di minori/BIA vengono trasferiti fuori UE e
se serve una base giuridica per il trasferimento.

- **Priority:** P1
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] regione Firestore verificata in Firebase Console per entrambi i progetti e
    riportata in `docs/DECISIONS.md` (nuovo ADR) o come nota di chiusura in questa
    story
  - [ ] se extra-UE: decisione esplicita dell'utente se migrare (operazione
    distruttiva/costosa — Firestore non permette di cambiare regione in-place,
    richiede export+reimport) o accettare il trasferimento con base giuridica
    documentata (richiamata in STORY-019)
  - [ ] se UE: chiudere la story con nota di conferma, nessuna azione ulteriore
- **Dependencies:** nessuna azione di sviluppo per la sola verifica; una eventuale
  migrazione regione è un progetto a parte, non incluso nell'AC di questa story
- **Risks:** se si scopre extra-UE e si decide di migrare, è un'operazione ad alto
  rischio (richiede downtime/migrazione dati) — da trattare come epic separata con
  Tech Lead, non un fix di sprint
- **Status attuale (24/10/2026):** DONE — Firestore in eur3 (Belgio/Paesi Bassi) su entrambi i progetti, verificato 24/10/2026
- **Status:** BLOCKED — in attesa che l'utente esegua il controllo su Firebase
  Console (nessun accesso diretto alla Console dal team di sviluppo automatizzato) e
  comunichi l'esito

### [STORY-022] Self-hosting dei font (rimuovere dipendenza da Google Fonts CDN)
**Come** utente, anche prima del login, **NON voglio** che il mio IP e user-agent
vengano inviati a Google solo per caricare l'app, **per** ridurre la superficie di
raccolta dati di terze parti non disclosata.

- **Priority:** P1
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] rimosso `@import url('https://fonts.googleapis.com/...')` in `src/index.css`
    (riga 1)
  - [ ] font Montserrat e Inter (stessi pesi già in uso: 300/400/500/600/700/900
    Montserrat, 300/400/500/600 Inter) serviti come asset statici self-hosted (es.
    `public/fonts/` + `@font-face`)
  - [ ] `firebase.json`: rimossi `https://fonts.googleapis.com` /
    `https://fonts.gstatic.com` dalla Content-Security-Policy (`style-src`/
    `font-src`) su entrambi i target (`app`, `admin`), righe 37 e 59
  - [ ] verifica visiva: nessuna differenza di rendering percepibile
  - [ ] verifica di rete (DevTools): nessuna richiesta esce più verso
    `fonts.googleapis.com`/`fonts.gstatic.com`
- **Dependencies:** modifica a `firebase.json` (CSP) → richiede redeploy hosting
  (`npm run deploy:app` / `deploy:admin` o le varianti `:dev`) — non tocca
  `firestore.rules`
- **Risks:** dimensione bundle leggermente maggiore (font come asset del progetto
  invece che da CDN con cache condivisa cross-sito) — trascurabile
- **Status attuale (24/10/2026):** DONE — font serviti dall'app (@fontsource-variable), CSP senza Google Fonts, in produzione 24/10/2026
- **Status:** BACKLOG

### [STORY-023] Backup dei dati di produzione
**Come** super_admin **voglio** che i dati di produzione (`fitquest-60a09`) abbiano un
backup recuperabile, **per** non perderli in modo permanente in caso di errore umano o
incidente, dato che il piano Spark non include backup automatici pianificati.

- **Priority:** P1
- **Modulo:** entrambi
- **Acceptance Criteria — parte immediata, nessuna decisione esterna necessaria:**
  - [ ] script Admin SDK (`scripts/backup-firestore.mjs`, stesso pattern di
    `scripts/check-wearable-tokens.mjs` già in repo) che esporta le collection
    principali (`organizations` + subcollection, `audit_logs`, `qa_runs`) in un file
    locale, eseguibile manualmente
  - [ ] cadenza minima consigliata documentata (es. prima di ogni deploy manuale
    rischioso, o settimanale)
- **Acceptance Criteria — parte dipendente da decisione utente:**
  - [ ] domanda esplicita all'utente: valutare l'upgrade a Blaze per abilitare backup
    automatici pianificati (Firestore scheduled export) — comporta impostare da
    subito un budget alert (già documentato in CLAUDE.md → Monitoraggio costi)
- **Dependencies:** nessuna per lo script interim; l'eventuale passaggio a Blaze è una
  decisione di budget dell'utente, non tecnica — non blocca la parte immediata
- **Risks:** uno script manuale dipende dalla disciplina di eseguirlo — non sostituisce
  un vero backup automatico pianificato
- **Status attuale (24/10/2026):** DONE — backup giornaliero gestito da Firestore su fitquest-60a09, conservato 7 giorni (24/10/2026)
- **Status:** BACKLOG (per lo script interim — la domanda su Blaze resta aperta e non
  blocca questa story)

### [STORY-024] Minimizzare i dati sensibili leggibili da `staff_readonly`
**Come** org_admin **voglio** che un membro `staff_readonly` non possa leggere dati
clinici/sensibili (storico BIA, eventuale token wearable legacy) tramite le stesse
funzioni di lettura del cliente usate da trainer/org_admin, **per** rispettare il
principio di minimizzazione — il ruolo è pensato per operatività, non dati clinici.

- **Priority:** P2
- **Modulo:** personal_training (BIA e Wearable sono feature solo PT)
- **Acceptance Criteria:**
  - [ ] definiti (con Tech Lead) i campi "sensibili" ai fini di questa story: almeno
    `biaHistory`, `lastBia`, `wearable` (se mai ripopolato — vedi RX-63 in CLAUDE.md)
  - [ ] `getClients`/`getClientById` (`src/firebase/services/clients.js`, verificato:
    oggi ritornano il documento cliente intero senza proiezione campi) non ritornano
    più questi campi quando il chiamante ha ruolo `staff_readonly` — oppure i campi
    vengono spostati in una subcollection con `firestore.rules` che esclude
    esplicitamente `staff_readonly` dalla lettura (stessa soluzione già prevista per
    RX-63)
  - [ ] `ReadonlyGuard`/`ReadonlyContext` esistenti restano invariati per il resto
    delle funzionalità readonly — questa story riguarda solo lettura di campi, non
    azioni di scrittura (già bloccate per `staff_readonly`)
  - [ ] test rules emulatore: uno `staff_readonly` che tenta di leggere il campo
    sensibile riceve `permission-denied` o il campo non è nel payload
  - [ ] nessuna regressione per trainer/org_admin, che continuano a vedere tutto
- **Dependencies:** coordinabile con RX-63 (CLAUDE.md → Wearable) — la subcollection
  dedicata proposta per il token wearable può ospitare anche `biaHistory` se si
  sceglie l'approccio subcollection; modifica a `firestore.rules` → deploy separato
  su entrambi i progetti
- **Risks:** se si sceglie la subcollection, serve una migrazione dati one-shot per
  spostare `biaHistory`/`lastBia` esistenti fuori dal documento cliente — da
  pianificare con Tech Lead prima di stimare lo sforzo
- **Status attuale (24/10/2026):** WON'T DO (per ora) — decisione utente 24/10/2026: lo staff in sola lettura vede i dati BIA, dichiarato in Informativa e DPA; da riaprire se un'org lo chiede
- **Status:** BACKLOG

### [STORY-025] Rimuovere o correggere `deleteOrganization`
**Come** developer **voglio** che `deleteOrganization` non esista come funzione
"trappola" (cancella solo il documento padre, lascia tutte le subcollection intatte e
ancora leggibili dai membri) **per** non rischiare che venga collegata un giorno a un
bottone reale con un comportamento di cancellazione incompleto.

- **Priority:** P2
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] confermato via grep (già fatto in questo audit): `deleteOrganization`
    (`src/firebase/services/org.js`, righe 31-32 — `deleteDoc(doc(db,
    'organizations', orgId))`) non ha alcun consumer in `src/features/`
  - [ ] **Opzione A (minima):** funzione rimossa in quanto codice morto non sicuro
    da lasciare in giro
  - [ ] **Opzione B (se si prevede di esporla presto):** riscritta come Cloud
    Function `eliminaOrganizzazione` con cascade reale (clients, members, slots,
    groups, recurrences, notifications, workoutPlans, note/goal sotto ogni client,
    account Auth di ogni membro/client) prima di essere mai collegata a un bottone UI
  - [ ] scelta tra A/B fatta con Tech Lead, non default arbitrario
- **Dependencies:** nessuna se Opzione A; se Opzione B, dipendenze equivalenti a
  STORY-016 ma a livello di intera org (superficie più ampia)
- **Risks:** nessuno per l'Opzione A (pura rimozione di codice non raggiungibile);
  l'Opzione B è uno sforzo paragonabile a un'epic a sé
- **Status attuale (24/10/2026):** DONE — Cloud Function eliminaOrganizzazione (cascade completo, solo super_admin) + scripts/export-org.mjs, in produzione 24/10/2026
- **Status:** BACKLOG

### [STORY-026] Definire una policy di retention per gli storici cliente
**Come** team RankEX **vogliamo** definire per quanto tempo conservare
`biaHistory[]`, `campionamenti[]`, `misureHistory[]` di un cliente, **per** non
conservare dati a tempo indeterminato senza una policy dichiarata — oggi solo
`client.log[]` ha un cap, ma dimensionale (200 voci), non temporale.

- **Priority:** P2
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] decisione esplicita dell'utente/PO sulla durata di conservazione per ciascun
    array (es. "per tutta la durata del rapporto + N anni dopo la cancellazione
    cliente" oppure "nessun cap, il trainer decide cancellando il profilo")
  - [ ] la policy scelta viene riportata nella Privacy Policy (STORY-019) come tempi
    di conservazione dichiarati
  - [ ] se la decisione implica un cap tecnico, va aperta una nuova story di
    implementazione derivata con AC propri — non in questa story
- **Dependencies:** decisione di prodotto dell'utente, non deducibile da un default
  tecnico arbitrario — collegata a STORY-019
- **Risks:** nessuno tecnico nella sola definizione; un eventuale cap futuro andrà
  valutato per non cancellare dati che un trainer si aspetta di vedere nello storico
  lungo di un atleta pluriennale
- **Status attuale (24/10/2026):** BLOCKED — in attesa di decisione dell'utente sulla retention (serve anche a Informativa e DPA)
- **Status:** BLOCKED — in attesa di decisione dell'utente sulla policy di retention

### [STORY-027] Rimuovere `VITE_FIREBASE_MEASUREMENT_ID` finché Analytics non è
realmente implementato con consenso
**Come** team RankEX **vogliamo** rimuovere la chiave Analytics non utilizzata **per**
non lasciare una configurazione "pronta" che potrebbe attivarsi in futuro senza un
sistema di consenso cookie a monte.

- **Priority:** P3
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] confermato via grep (già fatto in questo audit): `getAnalytics()`/
    `logEvent()` non sono mai chiamati in `src/` — solo `measurementId` passato a
    `initializeApp` in `src/firebase/config.js` (riga 11)
  - [ ] rimossa `VITE_FIREBASE_MEASUREMENT_ID` da `.env.example`, dai secret GitHub
    Actions (`ci.yml`, `e2e.yml`, `deploy.yml`) e dal campo `measurementId` in
    `firebase/config.js`
  - [ ] CLAUDE.md aggiornato per riflettere la rimozione (stesso pattern già seguito
    per `VITE_GOOGLE_FIT_CLIENT_ID`, EPIC-002/STORY-004)
  - [ ] se in futuro si reintroduce Analytics, va accompagnato da un cookie
    banner/consenso — non nell'ambito di questa story
- **Dependencies:** rimozione dei secret da GitHub Actions richiede accesso alle
  impostazioni del repo (l'utente, non il developer, gestisce i secret)
- **Risks:** nessuno — chiave non usata, nessuna funzionalità dipende da essa
- **Status attuale (24/10/2026):** DONE — chiave rimossa da config, .env.example e workflow (ott 2026); i secret GitHub si possono cancellare
- **Status:** BACKLOG

### [STORY-028] Export dati strutturato per il cliente finale
**Come** cliente (atleta o genitore) **voglio** poter scaricare i miei dati in un
formato leggibile da macchina, non solo il PDF riepilogativo, **per** esercitare il
diritto alla portabilità dei dati.

- **Priority:** P3
- **Modulo:** entrambi
- **Acceptance Criteria:**
  - [ ] nuova azione (bottone in Profilo client, o pagina org_admin su richiesta di
    un cliente) che genera un export JSON (o CSV multi-file) con: anagrafica,
    stats/campionamenti, `biaHistory` (se presente), `misureHistory`, `log`
    attività, badge, obiettivi
  - [ ] flusso scelto tra self-service (client scarica da solo) o su richiesta
    (org_admin genera per l'interessato) — **decisione minima da fissare con
    UX/Tech Lead prima di stimare il task**
  - [ ] l'export non include dati di altri clienti/membri dell'org (isolamento
    verificato)
  - [ ] documentato che questo è un export aggiuntivo, non sostitutivo di
    `ClientReportPrint.jsx` (che resta il PDF riepilogativo esistente)
- **Dependencies:** nessuna dipendenza esterna bloccante — la scelta del flusso è una
  domanda aperta di prodotto, non un blocco per l'inserimento in backlog
- **Risks:** basso — nessun dato nuovo da esporre, solo un formato diverso da quello
  già esistente
- **Status attuale (24/10/2026):** DONE — Profilo → Account → "Scarica i miei dati" (JSON), self-service (ott 2026)
- **Status:** BACKLOG

---
<!-- Nuove epic/user story vengono aggiunte qui sotto dal Product Owner -->


## [EPIC-010] Lipedema Edition — terzo modulo RankEX (v1, senza rank)
Fonte: specifiche v1.0 dei 5 test CORE in `lipidemia/*.docx` (fanno fede; l'infografica
`.jpg` nella stessa cartella è **superata** — dice 6MWT invece di 2MWT, ignorarla).
Decisione utente post-riunione del 24/10/2026: nuovo `moduleType` a livello
organizzazione, accanto a `personal_training` e `soccer_academy` (vedi CLAUDE.md →
"Prodotto → Moduli" e "Comportamento UI per modulo"). Popolazione target: donne adulte
con lipedema, valutate da professionisti.

**Principio di dominio (dai docx, vincolante per tutta l'epic):** niente percentili,
cut-off o etichette qualitative ("scarso/normale/ottimo"). Solo valore grezzo + andamento
nel tempo. Prove grezze sempre conservate, `protocol_version` e deviazioni sempre
registrate. Questo confligge con il modello rank-da-percentili del resto di RankEX
(CLAUDE.md → "Calcolo percentili", "Gamification") — da qui la scelta v1 senza rank.

**Scope v1 (deciso dall'utente, non in discussione):**
- Gamification OFF: niente XP, livelli, badge, Monete, streak, rank
- Dati paziente inclusi: anagrafica + misure, BIA, note, scheda allenamento,
  calendario/appuntamenti, valutazioni dei 5 test
- Solo professionisti usano l'app (org_admin / trainer / staff_readonly) — nessun login
  paziente
- Terminologia: Professionista / Paziente / Gruppo / Appuntamento (plurali coerenti:
  Professionisti / Pazienti / Gruppi / Appuntamenti). "Appuntamento" è la voce del
  calendario (l'equivalente di Sessione/Allenamento); **"Valutazione"** indica invece il
  record dei test, non uno slot di calendario
- Base giuridica (decisione utente 24/10/2026): art. 9(2)(h) GDPR — trattamento per
  finalità di cura da parte di professionisti sanitari, **non** consenso. Nel modulo
  **tutto** è dato sanitario: l'appartenenza del paziente a un'org Lipedema rivela già
  la diagnosi. `staff_readonly` vede anche i dati sanitari (BIA inclusa)

**Fuori scope v1 (esplicito):**
- Cancellazione automatica a scadenza / retention configurabile per org — in v1 la
  cancellazione è solo manuale, su decisione del titolare (STORY-032)
- Rank / punteggio composito di qualunque tipo (eventuale epic futura)
- Obiettivi (`goals` — oggi basati su `targetPercentile`); eventuale story futura
  "obiettivi su valore grezzo"
- Vista/login paziente (area client, Pentagon Nav, notifiche push al paziente)
- Analytics di gruppo basate su ranking (Classifica, Campioni, Confronto radar)
- Wearable (già disattivato per tutti i moduli)
- Normative/valori di riferimento lipedema-specifici (i docx li escludono)
- Test aggiuntivi oltre i 5 CORE; 6MWT
- Mobile app (parcheggiata — vedi memoria `project_mobile_app_parked`)
- Protocolli "avanzati/research" previsti dai docx 01 e 02 (2 prove con recupero e
  criterio di scelta predefiniti) — v1 implementa solo il CORE a prova singola
- Valori normativi generali per adulti (es. norme internazionali handgrip 2025 citate
  nel docx 03, tabelle CDC/STEADI nel docx 02): i docx li ammettono solo come
  "riferimento scientifico separato", mai come norme lipedema — in v1 non si mostrano
- Estensione polpaccio del Test 04 (il docx la indica come modulo secondario futuro)
- Registrazione video del test (docx 02, solo "se previsto dal centro")
- Qualunque decisione automatica di idoneità/stop su soglie HR/SpO2/PA (i docx 01 la
  escludono esplicitamente dall'MVP)

**Default provvisori decisi dall'utente (24/10/2026)** al posto delle domande per
l'autore dei protocolli — validi per `protocol_version` "1.0" di tutti e 5 i test,
rivedibili con una nuova versione di protocollo:
- **2MWT:** l'operatore inserisce il numero di **tratti** completi cono→cono + frazione
  finale; distanza = tratti × `course_length_m` + frazione; frazione < `course_length_m`
- **Unità di forza (03/04):** solo N e kgf, niente lbf
- **Test 04:** contrazione ~3 s (come il Test 03); anca in posizione seduta ~90°,
  registrata come campo; fissaggio belt/manuale entrambi ammessi, registrati, e non
  comparabili tra loro (STORY-039)
- **Test 05:** `protocol_version` "1.0" anche se il docx non ha versione/data; dolore
  come valore singolo 0-10, come da docx (non pre/post)

**Questioni aperte nei documenti (residue, da chiarire con l'autore dei protocolli —
non bloccano il backlog):**
- **Test 05 (OLS):** documento senza sezione UI (c'è solo la scheda rapida) — il flusso
  va disegnato da ux-ui-designer; il "motivo di terminazione" compare come campo unico
  nello schema dati — si assume per prova (come sembra logico), da confermare.
- **Test 03:** l'obiettivo cita il "confronto con valori di riferimento compatibili
  con età e sesso" — in contrasto con la regola trasversale "niente percentili": per la
  v1 si assume nessun confronto normativo in app (vedi fuori scope), da confermare.
- **Codici motivo di stop:** 01 e 02 chiedono `stop_reason_code` come "codice standard"
  ma nessun documento ne elenca i valori — serve il catalogo (eventualmente unico per
  tutti i test).
- **Scala del dolore:** il docx 01 dice "scala utilizzata dal centro; consigliata 0-10"
  — in v1 si fissa 0-10 per tutti i centri o la scala è configurabile (e quindi un
  altro parametro di comparabilità)?
- **Naming campi** disomogeneo tra i 5 documenti — sarà unificato nel design tecnico,
  i nomi nei docx non sono vincolanti.

**Questioni aperte per il Tech Lead (trasversali):**
- Nome tecnico del `moduleType`: `lipedema` vs generico (es. `clinical`) — decisione
  utente: da decidere con Tech Lead.
- Oggi `getModule()` (`src/config/modules.config.js`) ramifica solo su `isSoccer`, e
  diverse capability sono definite per negazione (`hasCategories`/`hasBia: moduleType
  !== SOCCER_ACADEMY`), `getTerminology()` fa fallback su PT: un terzo modulo
  **erediterebbe silenziosamente il comportamento PT** (rank, categorie, percentili)
  ovunque non venga gestito esplicitamente. ~19 file in `src/` ramificano su
  `isSoccer`/`soccer_academy` — serve un inventario completo delle superfici.
- Lato server le callable non conoscono il modulo (es. `chiudiSessione` accredita XP +
  Monete + streak, `creaCliente` inizializza xp/level/rank, `salvaCampionamento` calcola
  percentili): dove e come applicare "gamification OFF" in modo che non sia aggirabile
  dal client.
- Modello dati delle valutazioni lipedema (riuso di `campionamenti[]`/`stats` vs
  struttura dedicata) — le prove grezze multiple, i metadati di protocollo e i dati
  sanitari opzionali non entrano nel modello attuale `stats: { stat: percentile }`.
- `creaCliente` crea sempre un account Firebase Auth per il cliente: in v1 il paziente
  non fa login — come creare un paziente senza account (e senza email obbligatoria).

### [STORY-029] Privacy art. 9 GDPR — attestazione informativa + DPA (requisito bloccante)
**Come** org_admin/professionista di un'organizzazione Lipedema **voglio** che ogni
paziente abbia registrata la consegna dell'informativa prima di poterne salvare le
valutazioni, e che il rapporto titolare/responsabile con RankEX sia formalizzato **per**
trattare dati sanitari su pazienti reali in modo lecito.

**Decisioni utente (24/10/2026), non in discussione:**
- Base giuridica: art. 9(2)(h) GDPR (finalità di cura da parte di professionisti
  sanitari), **non il consenso** → nessun flusso di consenso né di revoca in app
- Nel modulo **tutto** è dato sanitario, anagrafica e valori grezzi inclusi
  (l'appartenenza all'org rivela la diagnosi) — nessuna distinzione tra campi
  "sanitari" e "non sanitari"
- `staff_readonly` vede tutti i dati del paziente, sanitari e BIA inclusi — nessun
  filtro di visibilità per ruolo da costruire

- **Priority:** P0 — **bloccante**: (a) blocca il salvataggio di qualunque
  valutazione (STORY-033…038); (b) blocca il go-live in produzione di ogni org Lipedema
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] **(a) Attestazione "informativa consegnata"** registrabile sul paziente da
        trainer/org_admin: data di consegna, versione dell'informativa, professionista
        che l'ha consegnata — tutti e tre obbligatori; `staff_readonly` la vede ma non
        la registra
  - [ ] Finché l'attestazione è assente il salvataggio di una valutazione è
        **rifiutato** — sia in UI (azione disabilitata con messaggio che spiega cosa
        manca) sia lato server (chiamata diretta → errore), non solo nascosto a schermo
  - [ ] Con attestazione presente il salvataggio funziona normalmente; l'attestazione
        resta visibile nella scheda del paziente
  - [ ] Una nuova versione dell'informativa consegnata in seguito si registra senza
        perdere quella precedente (storico delle attestazioni) — da confermare con
        Tech Lead se in v1 basta l'ultima
  - [ ] Nessun dato del paziente compare in log applicativi o in `audit_logs.details`
  - [ ] **(b) Requisito non-codice:** DPA / nomina a responsabile del trattamento
        ex art. 28 firmata con ogni org Lipedema **prima** del go-live in produzione —
        verificato come checklist di attivazione org da super_admin, non dal developer
  - [ ] **(c) Requisito non-codice:** il testo dell'informativa è redatto dal titolare
        (l'organizzazione), non da RankEX; l'app registra solo la versione consegnata
  - [ ] `docs/PRIVACY-POLICY-DRAFT.md` aggiornato con il modulo Lipedema, la base
        giuridica art. 9(2)(h) e la popolazione del modulo
  - [ ] Valutato l'uso di un identificativo pseudonimo del paziente (i docx usano
        `participant_id` "ID anonimo") — esito documentato, adozione non obbligatoria
        in v1
- **Dependencies:** EPIC-008 (STORY-020 bozza privacy, ADR "processo di cancellazione
  dati") — entrambi oggi solo su `feature/mobile-app`, non ancora su `dev`; se il
  blocco lato server richiede modifiche a `firestore.rules` → deploy separato su
  `rankex-dev` e `fitquest-60a09`
- **Risks:** DPA e informativa dipendono da azioni legali/commerciali fuori dal
  repository → possono ritardare il go-live di ogni org anche a codice pronto; un blocco
  solo UI darebbe una falsa sicurezza (stesso errore di RX-63, STORY-002)
- **Status:** BACKLOG

### [STORY-030] Nuovo modulo a livello organizzazione + capability + terminologia
**Come** super_admin **voglio** creare un'organizzazione con il modulo Lipedema e
vederla correttamente in elenco/dettaglio **per** attivare un nuovo cliente B2B del
terzo verticale.

- **Priority:** P0 (fondamenta dell'epic)
- **Modulo:** Lipedema (nuovo) — con verifica di non regressione su entrambi i moduli
  esistenti
- **Acceptance Criteria:**
  - [ ] `CreateOrgForm` permette di scegliere il terzo modulo; l'org creata ha il nuovo
        `moduleType` salvato
  - [ ] `OrgsPage`, `OrgDetailView`, `AdminDashboard` mostrano il nuovo modulo con
        etichetta propria (non "Personal Training" né "Soccer" di fallback)
  - [ ] In tutta l'area professionista dell'org la terminologia è Professionista /
        Paziente / Gruppo / Appuntamento, singolare e plurale, inclusi nav, titoli,
        empty state, toast, dialog di conferma — nessuna occorrenza visibile di
        "Cliente", "Allievo", "Trainer", "Coach", "Sessione", "Allenamento" (come voce
        di calendario) nel modulo (verifica a campione sulle pagine Pazienti, Gruppi,
        Calendario, Ricorrenze, Team, dashboard paziente)
  - [ ] "Valutazione/Valutazioni" è usato solo per il record dei test (STORY-033), mai
        per uno slot di calendario
  - [ ] Il cambio di `moduleType` **da o verso** Lipedema è bloccato se l'org ha già
        almeno un paziente/cliente (`clientCount > 0`): l'azione è rifiutata con
        messaggio esplicito, sia in UI sia lato server. Il cambio tra
        `personal_training` e `soccer_academy` resta invariato rispetto a oggi
        (verifica di non regressione)
  - [ ] Il modulo dichiara esplicitamente le proprie capability (rank: no, gamification:
        no, BIA: sì, obiettivi: no, categorie PT: no, test: i 5 Lipedema) — nessuna
        capability ereditata per fallback dal modulo PT (da verificare con test unitario
        su `getModule` per tutti e 3 i moduli)
  - [ ] Org PT e Soccer esistenti: nessun cambiamento visibile (unit test
        `modules.config.test.js` esistenti verdi + verifica manuale di 1 org per modulo)
  - [ ] Limiti piano (free/pro/enterprise) invariati e applicati anche al nuovo modulo
- **Dependencies:** decisione Tech Lead sul nome tecnico del `moduleType`
- **Risks:** fallback silenzioso su PT in `getModule`/`getTerminology` (vedi questioni
  aperte epic); concordanza di genere ("il Paziente"/"la Paziente", "nuovo/nuova") — già
  un problema noto su terminologia multi-modulo (STORY-024, STORY-027): da decidere con
  ux-ui-designer se usare forme neutre
- **Status:** BACKLOG

### [STORY-031] Rank, percentili e gamification assenti nel modulo
**Come** professionista Lipedema **voglio** non vedere mai rank, percentili, XP,
livelli, badge, Monete o streak **per** non comunicare giudizi normativi che le
specifiche dei test escludono esplicitamente, e non confondere la paziente con
meccaniche di gioco non pertinenti.

- **Priority:** P0
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] `ClientCard` / lista Pazienti: nessun rank, colore rank, media, livello, barra
        XP; nessun filtro per categoria/ruolo/fascia PT o Soccer
  - [ ] Dashboard paziente (vista professionista): nessuna card rank/XP/livello in
        AtletaTab (o equivalente), nessun Pentagono, nessuna tab Trofei, nessuna tab
        Obiettivi, nessun XPTrendChart, nessuna tab Wearable
  - [ ] Chiusura appuntamento in calendario: nessuna preview "+XP · streak", nessun XP né
        Monete né streak accreditati — verificato **lato dati** (dopo la chiusura i
        campi xp/level/coins/sessionStreak del paziente non cambiano), non solo a
        schermo
  - [ ] Nessun badge automatico assegnato al paziente (oggi `useBadges` auto-assegna
        lato client all'apertura della dashboard) — verificato sui dati
  - [ ] Salvataggio BIA: nessun XP accreditato (oggi `XP_BIA`)
  - [ ] Hub gruppo: tab Classifica, Campioni, Confronto e ogni ordinamento per media
        assenti; restano Gestione, Sessioni, Note (Analisi: da decidere con
        ux-ui-designer se ha senso su valori grezzi, altrimenti assente)
  - [ ] Notifiche: nessuna notifica di rank-up, XP o achievement generata per i
        pazienti
  - [ ] Nessun testo "percentile", "rank", "XP" visibile in alcuna pagina del modulo
        (verifica a campione su tutte le pagine nav)
  - [ ] Il blocco gamification non è aggirabile chiamando direttamente le Cloud
        Function dal client (verifica: chiamata diretta a una callable che accredita XP
        su un paziente Lipedema → nessun effetto o errore esplicito)
- **Dependencies:** STORY-030; inventario superfici del Tech Lead
- **Risks:** è la story con la superficie più ampia (~19 file con ramificazioni per
  modulo + callable server) — rischio alto di superfici dimenticate; le callable oggi
  non conoscono il modulo
- **Status:** BACKLOG

### [STORY-032] Wizard "Nuovo paziente" per il modulo
**Come** professionista Lipedema **voglio** registrare un nuovo paziente con anagrafica
e misure **per** iniziare a raccoglierne le valutazioni.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Il wizard non mostra categoria PT, profilo (`tests_only`/`bia_only`/`complete`),
        ruolo o fascia Soccer
  - [ ] Il wizard non richiede creazione di credenziali/account di accesso del paziente
        (v1 senza login); l'email, se presente, è facoltativa
  - [ ] Il paziente creato ha a disposizione sia le valutazioni dei 5 test sia la BIA
        (nessun "upgrade profilo" necessario)
  - [ ] Il paziente creato non ha xp/level/rank/coins inizializzati a valori visibili
        (o, se presenti per compatibilità, non sono mai mostrati — vedi STORY-031)
  - [ ] Il contatore `clientCount` e il blocco limite piano funzionano come negli altri
        moduli (schermata di blocco al limite)
  - [ ] **(P0) Cancellazione completa del paziente** su decisione del titolare
        (org_admin/trainer, stesso flusso `eliminaCliente`): cancellazione ricorsiva di
        documento paziente **e di tutte le subcollection** (valutazioni, note,
        attestazioni informativa, ecc.) e rimozione del paziente da slot, ricorrenze,
        gruppi, schede e notifiche dell'org — verificato con **test su emulatore**: dopo
        la cancellazione una query su tutti i path dell'org non restituisce alcun dato
        residuo del paziente nei dati live. Nessun flusso di "revoca consenso" (base
        giuridica art. 9(2)(h), vedi STORY-029); nessuna cancellazione automatica a
        scadenza in v1 (fuori scope). Backup Firestore, se attivi, fuori dal criterio
        "dati live"
  - [ ] Nuovo caso nel runbook (`config/runbook.config.js`) per creazione paziente
- **Dependencies:** STORY-030; decisione Tech Lead su "cliente senza account Auth";
  su `dev` `eliminaCliente.js` fa già `recursiveDelete` di `notes`/`goals` per nome
  (BUG-001, tracciato su `feature/mobile-app`); qui va generalizzato a
  `listCollections()` così da includere `assessments` (ADR-009/015)
- **Risks:** `creaCliente` oggi crea sempre l'account Auth e `/users/{uid}` — un
  paziente senza account è un caso nuovo per l'intero stack (reset password, dashboard
  header "Reset password", eliminazione); campi anagrafici richiesti dai protocolli
  (es. arto/mano dominante) — da verificare nei docx se servono a livello paziente
  o di singola valutazione
- **Status:** BACKLOG

### [STORY-033] Infrastruttura comune "Valutazione" (metadati protocollo, prove grezze, sintomi)
**Come** professionista Lipedema **voglio** che ogni valutazione salvata registri data,
versione del protocollo, deviazioni, prove grezze e (opzionali) dolore/sintomi e
parametri fisiologici pre/post **per** avere uno storico clinicamente difendibile e
confrontabile nel tempo, come richiesto da tutti e 5 i documenti.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Una valutazione (la "sessione" dei docx, `session_id`) può contenere uno o più
        dei 5 test, ognuno salvato con: data e ora, professionista che l'ha eseguito
        (`examiner_id`/`Evaluator_ID`), `protocol_version` del test, deviazione dal
        protocollo come **sì/no + descrizione** (entrambi i campi, come in tutti i
        docx), note libere
  - [ ] Tutte le prove grezze inserite sono conservate (non solo il risultato
        derivato/best), e restano visibili nel dettaglio; un dato salvato non viene mai
        sovrascritto da un ricalcolo
  - [ ] Ogni prova dei test multi-prova (03/04/05) ha un proprio flag di **validità**;
        il best si calcola solo sulle prove valide e le prove non valide restano
        conservate (03/04: "tre prove valide"; 05: "ripetere solo le prove non valide
        per errore procedurale")
  - [ ] Il risultato derivato (distanza, best, simmetria, ecc.) è calcolato dal
        sistema, non digitato a mano, con regola e arrotondamento identici a ogni
        salvataggio (i docx 01 citano "arrotondare in modo diverso tra una sessione e
        l'altra" tra gli errori comuni)
  - [ ] Ogni test può essere marcato come **interrotto/stop anticipato** con motivo
        (codice + testo breve); un test interrotto resta salvato e non è mai trattato
        come prova completa
  - [ ] Dati sanitari opzionali, solo dove il docx del test li prevede — sempre
        **opzionali**, un test è salvabile senza di essi:
        - 01 2MWT: dolore, dispnea Borg, fatica Borg pre/post; FC, SpO2, PA pre/post
        - 02 30s-STS: dolore, fatica, dispnea pre/post (nessun parametro fisiologico)
        - 03/04: dolore/disagio per prova e per lato (`Pain_Right`/`Pain_Left`), dolore
          pre-test (04)
        - 05 OLS: dolore 0-10 (valore unico, non pre/post) e sintomi
  - [ ] Condizioni concomitanti rilevanti (es. lipo-linfedema, patologia
        muscoloscheletrica/cardiopolmonare) registrabili come nota strutturata o libera
        — richiesto dal docx 01 §27 perché influenzano il risultato
  - [ ] Nessuna soglia automatica di stop o di idoneità su FC/SpO2/PA (docx 01 §19-20:
        i valori citati non vanno trasformati in decisioni automatiche dell'app)
  - [ ] Lato dominante (mano per 03, gamba per 04/05) disponibile per i test
        bilaterali — da decidere con Tech Lead se dato del paziente o della valutazione
  - [ ] Nessuna valutazione è salvabile per un paziente senza attestazione
        "informativa consegnata" (STORY-029) — vale per l'intera valutazione, non solo
        per i campi opzionali, perché nel modulo ogni dato è sanitario
  - [ ] Nessun percentile, cut-off o etichetta qualitativa è calcolato o mostrato
  - [ ] Nessun XP/notifica generata dal salvataggio
  - [ ] `staff_readonly` consulta le valutazioni per intero (dati sanitari inclusi) ma
        non può crearle, modificarle o eliminarle (pulsanti assenti + scrittura
        rifiutata lato server)
  - [ ] Una valutazione salvata con errore può essere corretta o eliminata dal
        professionista — **da decidere**: modifica in place vs. eliminazione +
        reinserimento (impatto sulla tracciabilità)
  - [ ] Guida test (`TestGuidePage`) del modulo mostra solo i 5 test Lipedema con
        istruzioni di esecuzione tratte dai docx — inclusa l'**istruzione verbale
        standardizzata** di ciascun test, testuale (i docx 01/02 la indicano come da non
        modificare tra i retest) e la checklist operatore dove presente (01, 02)
- **Dependencies:** STORY-030, STORY-032, STORY-029 (attestazione informativa, gate
  del salvataggio); design dati del Tech Lead
- **Risks:** il modello attuale `campionamenti[]` / `stats: { stat: percentile }` non
  rappresenta prove multiple + metadati — forzarlo dentro creerebbe ambiguità con PT/
  Soccer; volume dati per paziente più alto (prove grezze × test × valutazioni) →
  verificare impatto sui limiti Firestore piano Spark
- **Status:** BACKLOG

### [STORY-034] Test 01 — 2-Minute Walk Test (2MWT)
**Come** professionista **voglio** registrare un 2MWT inserendo tratti e frazione finale
**per** ottenere la distanza percorsa in 120 s senza calcoli manuali.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Una sola prova ufficiale per valutazione (CORE); durata 120 s
  - [ ] Setup: lunghezza del percorso tra i coni in metri (`course_length_m`, 30 m
        preferito/default), ausilio, versione protocollo. Un percorso diverso da 30 m è
        ammesso solo come **variante identificata** salvata come tale, non come semplice
        valore libero (docx 01 §7 e App. C)
  - [ ] Input (default v1.0): numero di **tratti** completi cono→cono (intero ≥ 0) e
        frazione finale in metri — l'operatore non inserisce "giri" andata+ritorno,
        nessun campo `lap_length_m` separato
  - [ ] Distanza (m) calcolata automaticamente = tratti × `course_length_m` +
        frazione, **arrotondata al metro più vicino**, mostrata prima del salvataggio;
        velocità media (m/s = distanza/120) eventualmente mostrata come dato
        secondario, mai al posto della distanza
  - [ ] Validazioni: `course_length_m` > 0, tratti ≥ 0, frazione ≥ 0 e
        **< `course_length_m`**
  - [ ] Pause: numero e durata totale (s), con indicazione esplicita in UI che il timer
        ufficiale **non** si ferma durante le pause
  - [ ] Ausilio: nessuno / bastone / stampella / rollator / altro
  - [ ] Stop anticipato: sì/no; se sì, tempo raggiunto (s, < 120), distanza percorsa
        fino all'interruzione e motivo (codice + testo) obbligatori; il risultato è
        marcato come non completo
  - [ ] Dati sanitari opzionali pre/post come da STORY-033 (dolore, Borg dispnea, Borg
        fatica, FC, SpO2, PA sistolica/diastolica)
  - [ ] Nessuna conversione del risultato in un "6MWT equivalente" (docx 01 §18)
- **Dependencies:** STORY-033
- **Risks:** una distanza da stop anticipato non è confrontabile con una completa — il
  trend (STORY-039) deve distinguerla. Il docx §23 descrive una schermata test con timer
  02:00, contatore (tratti) e pulsante "Pausa" live: **da decidere con ux-ui-designer** se
  la v1 offre timer/contatore in app o solo l'inserimento a posteriori dei valori
- **Status:** BACKLOG

### [STORY-035] Test 02 — 30-Second Sit-to-Stand (30s STS)
**Come** professionista **voglio** registrare le ripetizioni valide in 30 s e gli
eventuali motivi di invalidazione **per** avere un dato coerente con il protocollo.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Una prova ufficiale di 30 s; la familiarizzazione è consentita, registrabile
        come eseguita (sì/no) e **non** contribuisce al risultato
  - [ ] Input: ripetizioni valide (intero ≥ 0) + flag "ripetizione parziale finale
        conteggiata" (sì/no — vale se allo scadere la paziente era oltre metà del
        movimento verso la stazione eretta, regola CDC/STEADI)
  - [ ] Setup registrato: altezza **effettiva** della sedia in cm (default 43,2),
        presenza braccioli (deve essere no nel CORE), braccia incrociate (sì nel CORE);
        braccioli = sì o braccia non incrociate → deviazione registrata
  - [ ] Pause: numero e durata (opzionale)
  - [ ] Uso delle braccia = protocollo standard invalidato: test interrotto, score
        salvato come 0 **e** flag "uso braccia" registrato separatamente, così che uno
        0 da invalidazione sia distinguibile da uno 0 reale (docx §19)
  - [ ] Errore tecnico: sì/no + descrizione, campo distinto da deviazione protocollo e
        da note
  - [ ] Stop anticipato: sì/no; se sì, tempo raggiunto, ripetizioni valide fino allo
        stop e motivo (codice + testo); risultato marcato come non completo
  - [ ] Nessun ausilio nel protocollo standard (valore fisso "nessuno")
  - [ ] Dati sanitari opzionali pre/post: dolore 0-10, fatica, dispnea Borg — **nessun**
        parametro fisiologico (FC/SpO2/PA non previsti dal docx 02)
  - [ ] Nessuna etichetta da tabelle CDC/STEADI (sviluppate per anziani, docx §23)
- **Dependencies:** STORY-033
- **Risks:** uno 0 da invalidazione e uno 0 reale vanno distinti nel trend (STORY-039)
  per non mostrare un falso crollo di performance
- **Status:** BACKLOG

### [STORY-036] Test 03 — Handgrip Dynamometry (infrastruttura bilaterale multi-prova)
**Come** professionista **voglio** inserire 3 prove per mano alternate D-S e ottenere il
best per mano in Newton **per** monitorare la forza di presa nel tempo con qualunque
dinamometro.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] 3 prove **valide** per mano, nell'ordine alternato D, S, D, S, D, S (ordine
        guidato in UI); per ogni prova: mano, numero prova, valore, unità, validità,
        dolore/disagio, note (docx §14)
  - [ ] Right Best / Left Best = massimo delle prove valide della mano (mai la media);
        Strongest e Weakest = max/min tra i due best — tutti calcolati dal sistema
  - [ ] Indice di simmetria opzionale = (Weakest / Strongest) × 100, solo come numero
        (nessuna etichetta qualitativa)
  - [ ] Unità primaria Newton; inserimento consentito **solo** in N o kgf (niente lbf
        né altre unità) con conversione automatica (1 kgf = 9,80665 N); valore e unità
        **nativi** conservati accanto al valore convertito; la UI può mostrare kgf se
        richiesto
  - [ ] Registrati: mano dominante, dinamometro (marca, modello, numero di serie),
        impostazione dell'impugnatura (`Grip_Setting`), unica per tutta la sessione
  - [ ] Interruzione per sicurezza (dolore acuto/crescente, sintomi neurologici,
        capogiri, ecc. — docx §19): registrabile con motivo; i best di una mano non
        testata/incompleta restano vuoti senza invalidare l'altra mano
  - [ ] Recupero ~60 s prima di ritestare la stessa mano: un recupero prolungato è
        registrabile come deviazione
  - [ ] La logica "N prove valide per lato, alternate D-S, best per lato, simmetria
        min/max" è riusabile da STORY-037 e STORY-038 (non reimplementata per ogni
        test) — verificato in code review
- **Dependencies:** STORY-033
- **Risks:** precisione di arrotondamento dopo conversione (decimali da conservare —
  da decidere con Tech Lead)
- **Status:** BACKLOG

### [STORY-037] Test 04 — Handheld Dynamometry quadricipite
**Come** professionista **voglio** registrare 3 prove per gamba della forza del
quadricipite con il metodo di fissaggio usato **per** confrontare correttamente solo
valutazioni eseguite nelle stesse condizioni.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Stesso comportamento di STORY-036 per gamba: 3 prove **valide** alternate
        D-S-D-S-D-S con validità/dolore/note per prova, Right/Left Best = massimo delle
        valide (mai la media), Strongest/Weakest Leg, simmetria opzionale min/max × 100,
        solo N o kgf con conversione (se il dispositivo misura già in N si usa N
        direttamente),
        valore/unità nativi, dispositivo marca/modello/seriale, gamba dominante
  - [ ] Differenza assoluta e relativa tra i lati opzionale, come numero derivato
  - [ ] Metodo di fissaggio obbligatorio (belt esterna / manuale — entrambi ammessi),
        **unico per
        entrambe le gambe** nella sessione — il docx elenca "fissazione diversa tra
        destra e sinistra" tra gli errori
  - [ ] Angolo del ginocchio registrato (default ~90°) e punto di applicazione del
        sensore registrato (default: anteriore distale della gamba, appena prossimale
        alla caviglia)
  - [ ] Dolore pre-test e uso di ausili registrabili (docx §8)
  - [ ] Angolo d'anca registrato come campo (default v1.0: seduta, ~90°)
  - [ ] Durata della contrazione da protocollo v1.0: ~3 s (come Test 03), riportata
        nell'istruzione/guida del test; una durata diversa è registrabile come
        deviazione
- **Dependencies:** STORY-036
- **Risks:** fissaggio diverso tra retest = dato non comparabile (gestito da STORY-039)
- **Status:** BACKLOG

### [STORY-038] Test 05 — One-Leg Standing (OLS)
**Come** professionista **voglio** registrare 2 prove per gamba con tempo e motivo di
fine **per** monitorare l'equilibrio statico, distinguendo chi raggiunge il tempo
massimo.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Occhi aperti, braccia lungo i fianchi, nessun ausilio durante la prova (fisso
        nel protocollo)
  - [ ] 2 prove **valide** per gamba, ordine alternato D, S, D, S; una prova non valida
        (assistenza fisica, appoggio, errore evidente di cronometraggio, interruzione
        esterna significativa) resta conservata e viene ripetuta
  - [ ] Tempo in secondi con 1 decimale; valori > 60,0 non accettati
  - [ ] Best per gamba = massimo delle 2 prove valide, calcolato dal sistema
  - [ ] Flag ceiling per gamba impostato automaticamente quando il best è 60,0 s,
        sempre valorizzato sì/no (obbligatorio, non modificabile a mano); visibile nello
        storico e nel trend — 60,0 s non va presentato come "≥ 60"
  - [ ] Motivo di fine registrato per ogni prova, da elenco: piede libero tocca
        pavimento/altro arto, uso di supporto, spostamento dell'arto di appoggio,
        richiesta della paziente, 60,0 s raggiunti, stop per sicurezza
  - [ ] Simmetria opzionale = (tempo minore / tempo maggiore) × 100, solo descrittiva
  - [ ] Registrati: gamba dominante, calzature, superficie, ausili abituali, dolore
        0-10 (valore unico), sintomi, deviazioni (docx §21-22)
  - [ ] Riusa la logica bilaterale multi-prova di STORY-036
  - [ ] `protocol_version` = "1.0" (default provvisorio — il docx non ha versione/data)
  - [ ] Durata massima per prova registrata come parametro di protocollo (60,0 s in
        v1.0), così che un limite diverso sia riconoscibile come altro protocollo
- **Dependencies:** STORY-036
- **Risks:** senza sezione UI nel docx, il flusso di inserimento va disegnato da
  ux-ui-designer senza riferimento dell'autore
- **Status:** BACKLOG

### [STORY-039] Storico, trend e avviso di non comparabilità per test
**Come** professionista **voglio** vedere per ogni test lo storico delle valutazioni, un
grafico dell'andamento e il delta rispetto alla precedente, con un avviso quando due
valutazioni non sono confrontabili **per** interpretare correttamente l'evoluzione della
paziente senza ricorrere a valori normativi.

- **Priority:** P1
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Per ciascuno dei 5 test: lista cronologica delle valutazioni con risultato
        (per test bilaterali: un valore per lato), data, professionista; espandibile
        per vedere prove grezze e metadati di protocollo
  - [ ] Grafico andamento nel tempo del risultato (per test bilaterali: una serie per
        lato), in unità grezza, senza fasce colorate, soglie o etichette qualitative
  - [ ] La riga di storico mostra almeno: data, risultato, delta vs precedente,
        versione protocollo e i parametri di setup del test (es. 01 lunghezza percorso;
        02 altezza sedia e deviazioni — docx 01 §23, 02 §23)
  - [ ] Delta assoluto vs la valutazione precedente **comparabile** dello stesso test
        (e lato), con unità; nessun colore "buono/cattivo" che implichi un giudizio
        normativo (da validare con ux-ui-designer — il verso "migliore" esiste per ogni
        test ma non va presentato come valutazione clinica)
  - [ ] Quando la valutazione differisce dalla precedente nei parametri di protocollo,
        il confronto non è presentato come variazione ordinaria ("non confrontarlo
        automaticamente con la serie precedente", docx 02 §21) e compare un avviso che
        elenca quale parametro differisce. Parametri per test:
        - 01 2MWT: `course_length_m` (o variante di percorso), ausilio,
          `protocol_version` — elenco esplicito del docx 01 §23
        - 02 30s-STS: altezza sedia, presenza braccioli, `protocol_version` — docx 02
          §21/§23
        - 03 Handgrip: dispositivo, regolazione dell'impugnatura (`Grip_Setting`),
          `protocol_version` — docx 03 §21
        - 04 HHD: metodo di fissaggio (regola esplicita: "non direttamente
          comparabile"), dispositivo, angolo ginocchio, punto di applicazione del
          sensore, `protocol_version` — docx 04 §21 e scheda rapida
        - 05 OLS: durata massima per prova (un limite diverso da 60,0 s = altro
          protocollo, docx 05 §19), `protocol_version`; calzature e superficie da
          decidere se scatenano
          l'avviso o sono solo mostrate (il docx chiede solo di mantenerle costanti)
  - [ ] Valutazioni interrotte/stop anticipato (01, 02), invalidate per uso braccia
        (02) o con ceiling (05) sono distinguibili nel grafico e nel delta (non trattate
        come valori ordinari)
  - [ ] Nessun calcolo di media/score composito tra test diversi né tra le prove di uno
        stesso test (il risultato ufficiale è sempre il best o la prova singola)
  - [ ] Caso runbook aggiunto in `config/runbook.config.js` per l'avviso di
        comparabilità
- **Dependencies:** STORY-034…038
- **Risks:** definizione esatta di "stesso dispositivo" (confronto per seriale? per
  marca+modello?) e tolleranza su altezza sedia/angolo ginocchio (43,2 vs 43,0 cm è un
  cambio?) — da decidere con Tech Lead/autore protocolli
- **Status:** BACKLOG

### [STORY-040] Export PDF paziente Lipedema
**Come** professionista **voglio** esportare un report PDF del paziente con le
valutazioni **per** condividerlo con la paziente o con altri curanti.

- **Priority:** P2
- **Modulo:** Lipedema (nuovo)
- **Acceptance Criteria:**
  - [ ] Il PDF del modulo (stessa tecnica `window.print()` di `ClientReportPrint`)
        contiene anagrafica, ultima valutazione per ciascuno dei 5 test con metadati di
        protocollo, delta vs precedente con eventuale avviso di non comparabilità,
        BIA se presente
  - [ ] Nessun rank, percentile, XP, badge nel PDF
  - [ ] Il PDF include anche i dati sanitari opzionali registrati (dolore, Borg,
        parametri fisiologici) ed è esportabile da tutti i ruoli che vedono il paziente,
        `staff_readonly` incluso (decisione utente: nessun filtro per ruolo)
  - [ ] Terminologia del modulo anche nel PDF
  - [ ] Report di gruppo (`GroupReportPrint`): nel modulo assente oppure senza
        classifiche — da decidere con ux-ui-designer
- **Dependencies:** STORY-039, STORY-029
- **Risks:** il PDF esce dall'app → una volta stampato i dati sanitari non sono più
  controllabili dall'app; la custodia del documento è responsabilità del titolare
  (da citare nell'informativa/DPA, STORY-029)
- **Status:** BACKLOG
