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

## [EPIC-007] Mobile App — Store Readiness
Fonte: `mobile-app/docs/MOBILE-APP.md` → sezione "Known issues / TODO" (branch
`feature/mobile-app`, scaffolding Capacitor completo, build Android debug verificata
lug 2026, mai portata oltre). Obiettivo: portare l'app dallo stato "compila" allo stato
"pubblicabile" su almeno uno store.

### [STORY-015] Android — signing release + appId definitivo
**Come** developer **voglio** una build release firmata e un `appId` confermato **per**
poter generare un AAB caricabile su Play Console.
- **Priority:** P1
- **Acceptance Criteria:**
  - [ ] `appId` (`com.rankex.app`, oggi provvisorio) confermato con l'utente — non
        cambiabile dopo la prima pubblicazione senza perdere utenti/recensioni
  - [x] `signingConfigs`/`buildTypes.release` aggiunti a `android/app/build.gradle`
  - [ ] Keystore generato (`keytool -genkeypair`), password scelta dall'utente e
        salvata in password manager — MAI committata in git
  - [ ] `./gradlew bundleRelease` produce un `.aab` valido (firmato)
- **Dependencies:** nessuna tecnica per lo scaffolding — la firma reale richiede 2
  decisioni dell'utente (conferma appId, scelta password keystore), non bloccata su
  risorse esterne ma **non eseguibile da un agente automatico**: generare un keystore
  di produzione con una password scelta arbitrariamente sarebbe un'azione irreversibile
  e ad alto rischio (perderlo rende l'app non aggiornabile per sempre) presa senza il
  controllo del proprietario reale delle credenziali
- **Risks:** perdita del keystore dopo la prima pubblicazione rende l'app
  non-aggiornabile per sempre — conservazione va trattata come un asset critico
- **Sprint #7 (2026-09-15):** aggiunto lo scaffolding `signingConfigs`/`buildTypes` a
  `android/app/build.gradle` — **condizionale**: si attiva solo se
  `mobile-app/rankex-release.keystore` esiste realmente (verificato via `file(...)
  .exists()` in Gradle), altrimenti la build resta unsigned come oggi. Nessuna password
  hardcoded — lette da `RANKEX_KEYSTORE_PASSWORD`/`RANKEX_KEY_PASSWORD` (env var).
  Scelto deliberatamente per non rompere `assembleDebug`/CI finché il keystore reale
  non esiste. **Status:** DONE (scaffolding) — generazione keystore reale e conferma
  `appId` restano un'azione dell'utente, non del developer/agente.

### [STORY-016] Verifica manuale su device/emulatore reale
**Come** QA **voglio** eseguire la checklist manuale completa (apertura, login/logout,
back button, offline, tastiera, safe area, rotazione) **per** validare che il
contenitore nativo si comporti correttamente prima di qualunque submission.
- **Priority:** P1
- **Acceptance Criteria:**
  - [ ] `npx cap run android` eseguito su device fisico o emulatore con RAM sufficiente
        (l'ambiente di sviluppo Windows attuale non è riuscito ad avviare un AVD)
  - [ ] Checklist di `MOBILE-APP.md` → "Test" eseguita e risultato documentato
  - [ ] Bridge `window.print()` verificato dal vivo (oggi solo compilazione verificata,
        mai un dialogo di stampa reale)
- **Dependencies:** un device Android fisico o un ambiente con più RAM — se non
  disponibile, è un blocker reale, non aggirabile da codice
- **Risks:** nessun test manuale è mai stato eseguito finora — possibile che emergano
  bug di comportamento non visibili da una build che "solo compila"

### [STORY-017] Push notifications — verifica end-to-end
**Come** client **voglio** ricevere davvero una push quando viene creata una notifica
in-app **per** non dover tenere l'app aperta per essere avvisato.
- **Priority:** P2
- **Acceptance Criteria:**
  - [ ] `google-services.json` (Android) scaricato da Firebase Console e collocato
  - [ ] Trigger `onNotificationCreated.js` verificato contro un device reale
        (registrazione token `fcmTokens[]`, ricezione push, self-healing su token invalidi)
  - [ ] iOS: APNs Auth Key — bloccato su Apple Developer Program (vedi STORY-018)
- **Dependencies:** STORY-016 (serve un device funzionante); lato iOS dipende da
  STORY-018
- **Risks:** nessuno tecnico lato Android — il codice esiste già, solo mai verificato
  contro credenziali reali

### [STORY-018] iOS — build e verifica su Xcode
**Come** developer **voglio** compilare e verificare il progetto iOS **per** sapere se
`RankexBridgeViewController` è davvero risolta correttamente da Xcode prima di tentare
un Archive.
- **Priority:** P2
- **Acceptance Criteria:**
  - [ ] `pod install` + apertura `App.xcworkspace` su macOS
  - [ ] Verifica che `RankexBridgeViewController` sia riconosciuta come custom class in
        `Main.storyboard` (il `.pbxproj` è stato modificato a mano, non da Xcode)
  - [ ] Build su device fisico o simulatore
  - [ ] Capability Push Notifications aggiunta (richiede Apple Developer Program attivo)
- **Dependencies:** **bloccata su accesso a un Mac con Xcode 15+** — non eseguibile
  nell'ambiente Windows attuale, non risolvibile scrivendo codice; Apple Developer
  Program ($99/anno) è una decisione/spesa dell'utente
- **Risks:** rischio concreto che emergano problemi di build mai visti finché non gira
  su Xcode reale — il codice è scritto ma "compila su carta"

### [STORY-019] Artwork icona/splash definitivo
**Come** utente finale **voglio** vedere il vero logo RankEX sull'icona dell'app **per**
un'esperienza professionale, non un placeholder generato via screenshot.
- **Priority:** P2
- **Acceptance Criteria:**
  - [ ] Logo RankEX come file immagine sorgente (oggi non esiste nel repo —
        `BrandingPanel.jsx` usa solo testo con gradiente CSS, nessun asset)
  - [ ] `resources/icon.png` (1024×1024) e `resources/splash.png` (2732×2732)
        sostituiti con l'artwork reale
  - [ ] `npx capacitor-assets generate` rieseguito per entrambe le piattaforme
- **Dependencies:** **bloccata su un asset grafico che non esiste** — non risolvibile
  da lavoro di sviluppo, serve una decisione su chi produce il logo (designer/budget)
- **Risks:** nessuno tecnico — puro blocco di contenuto

---

## [EPIC-008] Privacy & Compliance
Fonte: `mobile-app/docs/MOBILE-APP.md` → sezione "Privacy — checklist", l'unica analisi
privacy esistente nel progetto ad oggi (nessuna sessione dedicata separata trovata).
RankEX tratta dati sanitari (BIA — categoria speciale ex art. 9 GDPR se ci sono utenti
UE), quindi lo scope reale è più ampio della sola submission store: riguarda l'intera
piattaforma, non solo il contenitore mobile.

### [STORY-020] Privacy Policy pubblica
**Come** utente (client o org) **voglio** poter leggere una privacy policy pubblica
**per** sapere quali dati RankEX raccoglie e come li tratta, requisito bloccante per la
submission su entrambi gli store.
- **Priority:** P0 (blocca la pubblicazione su store, non solo "nice to have")
- **Acceptance Criteria:**
  - [x] Bozza tecnica del contenuto basata sui dati già verificati nel codice (vedi
        "Dati raccolti" in `MOBILE-APP.md`: anagrafica, dati sportivi, BIA, Firebase
        come sub-processor, nessun social login, nessun analytics attivo)
  - [x] Decisioni non tecniche esplicitate come domande aperte per l'utente: titolare
        del trattamento, contatti/DPO se applicabile, retention policy, giurisdizione
  - [ ] Documento pubblicato a un URL stabile, linkato da login/registrazione app +
        listing store
  - [ ] Revisione legale finale — **non delegabile al developer**
- **Dependencies:** nessuna tecnica per la bozza; la pubblicazione finale dipende da
  decisioni legali/aziendali dell'utente
- **Risks:** bloccante hard per la submission — senza questo, niente Play Store/App Store
- **Sprint #6 (2026-09-15):** bozza scritta in `docs/PRIVACY-POLICY-DRAFT.md` — 10
  sezioni, ogni dato dichiarato verificato sul codice reale (non ipotizzato), incluso
  un punto non banale scoperto scrivendo la bozza: RankEX è B2B multi-tenant, quindi il
  modello corretto è **organizzazione = Titolare, RankEX = Responsabile del
  trattamento**, con implicazione che serve un DPA per organizzazione (oggi non
  risulta esistere) — non solo una policy pubblica generica. Include anche una nota
  esplicita sui dati di minori (moduli soccer `soccer_youth`/`soccer_junior`, 7-13
  anni) e su chi deve ottenere il consenso del genitore/tutore (l'organizzazione, non
  RankEX). **Status:** DONE (bozza) — pubblicazione e revisione legale restano aperte,
  fuori dallo scope che un developer può chiudere da solo.

### [STORY-021] Processo di cancellazione dati (diritto all'oblio)
**Come** utente **voglio** un modo per richiedere la cancellazione dei miei dati **per**
esercitare un diritto GDPR oggi non documentato né implementato come flusso self-service.
- **Priority:** P1
- **Acceptance Criteria:**
  - [x] Scoping: valutare se basta un processo manuale documentato (richiesta via
        supporto → super_admin esegue cancellazione con gli strumenti già esistenti,
        `eliminaCliente`/rimozione membro) oppure serve un flusso self-service nuovo
  - [x] Se manuale: documentare il processo (chi riceve la richiesta, SLA, come si
        verifica l'identità del richiedente) — necessario comunque per compilare il
        Data Safety form di Play (oggi "TODO: DA DEFINIRE")
  - [ ] Se self-service: nuova callable + UI — **non necessario**, vedi decisione sotto
- **Dependencies:** nessuna
- **Risks:** senza un processo documentato, il Data Safety form di Play resta incompleto
  (blocca la submission Android)
- **Sprint #6 (2026-09-15):** decisione presa — processo manuale, vedi
  `docs/DECISIONS.md` → ADR-004. **Finding non previsto nello scoping originale:**
  verificando se gli strumenti amministrativi esistenti (`eliminaCliente`) fossero
  davvero sufficienti per una cancellazione completa, è emerso che **non lo erano** —
  `batch.delete()` sul documento cliente lasciava orfane le subcollection
  `notes`/`goals` in Firestore (dati personali non effettivamente cancellati, solo
  irraggiungibili dall'app). Loggato come BUG-001 (`docs/BUGS.md`) e fixato nella
  stessa sessione (`functions/src/callable/eliminaCliente.js` → `db.recursiveDelete()`
  invece di `batch.delete()` sul solo doc padre). **Non ancora deployato** — verificato
  solo con `node --check`, non contro l'emulatore o `rankex-dev`. **Status:** DONE
  (scoping + decisione + fix del gap trovato) — deploy e verifica contro l'emulatore
  restano da fare prima di chiudere definitivamente.

### [STORY-022] Compilazione Data Safety (Play) + Privacy Nutrition Label (Apple)
**Come** developer **voglio** compilare i form privacy richiesti da entrambi gli store
**per** poter sottomettere l'app.
- **Priority:** P1
- **Acceptance Criteria:**
  - [x] Google Play Data Safety form — contenuto compilato in bozza usando i dati già
        verificati in `MOBILE-APP.md` + il processo di cancellazione da STORY-021
  - [x] Apple Privacy Nutrition Label — bozza contenuti già presente in `MOBILE-APP.md`
  - [ ] Trascrizione effettiva nei rispettivi form (Play Console / App Store Connect —
        **non un'operazione sul repo**, richiede accesso agli account developer)
  - [ ] Verificare la definizione aggiornata Play di "terze parti" per la voce
        "Condivisi con terze parti" (oggi segnata NO, solo Firebase come infrastruttura
        — da confermare al momento della compilazione, non assumere invariata)
- **Dependencies:** STORY-021 (fatto — serviva il processo di cancellazione definito
  prima di poter rispondere alla relativa voce del form)
- **Risks:** nessuno tecnico — solo compilazione, ma bloccante per la submission
- **Sprint #9 (2026-09-15):** contenuto di entrambi i form aggiornato/verificato in
  `mobile-app/docs/MOBILE-APP.md` — la voce "Cancellazione dati" del Data Safety form
  ora descrive il processo reale deciso in ADR-004 invece di "TODO: DA DEFINIRE".
  **Status:** DONE (bozza contenuti) — la trascrizione nei Console è un'azione
  dell'utente al momento della submission, non lavoro di sviluppo residuo.

---

## [EPIC-009] UX/UI — Debito residuo audit + superfici mobile-native
Fonte: memoria sessione `project_art_direction_audit_jul2026` — 2 item lasciati
esplicitamente parziali all'epoca (non dimenticati, scelta consapevole di scope) più
una superficie UI mai esistita al momento dell'audit (contenitore mobile-native).

### [STORY-023] Sweep completo pattern `color+'NN'`
**Come** developer **voglio** eliminare la tecnica di opacità per concatenazione stringa
hex ovunque, non solo nella root cause già fixata **per** evitare la stessa classe di
bug (si rompe silenziosamente quando riceve `"var(--rx-accent)"` invece di un hex).
- **Priority:** P2
- **Acceptance Criteria:**
  - [ ] Grep completo del pattern `color + '` / template string equivalenti sui 31 file
        identificati nell'audit (P1.3 originale ne aveva fixati solo 2)
  - [ ] Sostituzione con `color-mix()` (pattern già usato per il fix originale e per
        `EmptyState`/`StatCard`)
  - [ ] Verifica visiva che nessun bordo/sfondo tinto "si spenga" per client/admin
- **Dependencies:** nessuna
- **Risks:** basso — stesso fix già applicato con successo in più punti, solo scala
- **Sprint #8 (2026-09-15):** eseguita da subagent developer in background. 34 dei 35
  file avevano occorrenze reali (127 totali) — `ClientDashboard.jsx` scartato, l'unico
  match era dentro un commento di documentazione, non codice vivo. Tutte convertite a
  `color-mix(in srgb, ${color} P%, transparent)`, uniformemente, indipendentemente dal
  fatto che la variabile fosse oggi sempre hex o potesse diventare `var(--rx-*)`.
  `npm run lint`/`build`/`test:run` tutti verdi (211/211 test, 0 errori, 9 warning
  preesistenti non collegati). **Trovato ma non corretto** (fuori scope — sweep colori,
  non refactor struttura): possibile componente `SlotCard` duplicato quasi identico tra
  `trainer-calendar/CalendarSidebar.jsx` e `trainer-calendar/SlotCard.jsx` — da
  verificare con Tech Lead, potrebbe essere dead code o drift copy-paste. **Status:** DONE

### [STORY-027] Fix — concordanza di genere rotta in `GroupsPage.jsx` (già migrato P2.9)
**Come** trainer di un'org GYM/soccer_academy **voglio** leggere "Nessuna classe"/"la
prima squadra" invece di "Nessun classe"/"il primo squadra" **per** non avere
un'incoerenza grammaticale visibile nella pagina più trafficata del modulo gruppi.
- **Priority:** P3
- **Trovato da:** STORY-024 (durante la lettura di riferimento del file già migrato in
  P2.9, non nel proprio scope — segnalato, non corretto, per non uscire dai 10 file
  assegnati)
- **Dettaglio:** `` `Nessun ${terminology.group.toLowerCase()}` `` → "Nessun classe"
  (GYM), dovrebbe essere "Nessuna classe"; `` `Crea il primo
  ${terminology.group.toLowerCase()}...` `` → "il primo classe/squadra", dovrebbe
  essere "la prima". Stesso problema di concordanza già risolto altrove in P2.9/questa
  sessione (vedi STORY-024) con costruzioni senza articolo — qui va applicata la
  stessa disciplina.
- **Status:** BACKLOG — non bloccante, cosmetico

### [STORY-024] Terminologia multi-modulo — wave 2 su `groups-page/`
**Come** trainer di un'org GYM o soccer_academy **voglio** vedere la terminologia
corretta (Membro/Allievo invece di "Cliente", Classe/Squadra invece di "Gruppo") anche
nelle 11 viste sotto `groups-page/` **per** coerenza con il resto dell'app (già
applicata al resto in P2.9, deliberatamente non estesa lì per scope).
- **Priority:** P3
- **Acceptance Criteria:**
  - [ ] `terminology` propagata lungo l'albero tab-figli di `GroupDetailView`
        (`GroupAnalysis`, `GroupComparison`, `GroupLeaderboard`, `GroupManageTab`,
        `GroupNotes`, `GroupSessionsPanel`, `GroupToggleDialog`, `GroupsSidebar`)
  - [ ] Attenzione all'accordo di genere già gestito in P2.9 (es. "il gruppo" non regge
        per Classe/Squadra, femminili) — riusare le costruzioni senza articolo già
        adottate
  - [x] "Atleta/i" lasciato invariato (lessico da performance-testing, non lessico
        cliente — stessa decisione presa in P2.9)
- **Dependencies:** nessuna
- **Risks:** basso — pattern già rodato, solo più file
- **Sprint #8 (2026-09-15):** eseguita da subagent developer in background. 8 dei 10
  file avevano stringhe hardcoded da correggere (`GroupCard`, `GroupToggleDialog`,
  `GroupManageTab`, `GroupSessionsPanel`, `GroupNotes`, `GroupLeaderboard`,
  `GroupAnalysis`, `GroupsSidebar`) + 2 call-site aggiornati per passare `terminology`
  (`GroupDetailView.jsx`, `GroupsPage.jsx`). `GroupChampions.jsx`/`GroupComparison.jsx`
  non necessitavano modifiche (solo lessico "atleta", verificato via grep). Concordanza
  di genere gestita con costruzioni invarianti ("in gruppo/classe/squadra" invece di
  "nel/nella") seguendo la disciplina già stabilita in P2.9. `npm run lint`/`build`/
  `vitest run` tutti verdi (211/211 test, 0 errori lint). **Trovato ma non corretto**
  (fuori scope, promosso a STORY-027): bug di concordanza di genere preesistente in
  `GroupsPage.jsx` (file già migrato in P2.9). **Nota**: `GroupsSidebar.jsx` risulta
  codice morto (zero importer in `src/`, verificato via grep) — fix comunque applicato
  per coerenza interna, ma candidato a rimozione in un futuro audit, stesso pattern di
  altri file morti già documentati in CLAUDE.md. **Status:** DONE

### [STORY-028] Investigare — navigazione interna trainer non usa history reale
**Come** utente mobile **voglio** che il tasto back Android si comporti in modo
prevedibile su qualunque pagina trainer (dashboard, clienti, wizard, gruppi...) **per**
non ritrovarmi fuori dall'app o su una schermata inaspettata.
- **Priority:** P1 — architetturale, non un fix di una riga
- **Trovato da:** code-reviewer durante la verifica di STORY-026 (2026-09-15) — la
  correzione del claim "wizard coperto" ha portato a verificare `useTrainerNav.js`,
  che gestisce `page`/navigazione tra le viste trainer con puro `useState`, **zero
  `history.pushState`/`popstate`**.
- **Dettaglio:** `useNativeBackButton.js` usa `window.history.back()` come fallback
  quando nessun modal è aperto (`canGoBack` true). Ma se la navigazione interna non ha
  mai creato voci di history reali, questo non torna "indietro di una pagina" nell'app
  (es. dal wizard nuovo cliente alla lista clienti) — torna a qualunque pagina reale
  fosse caricata nel browser/WebView prima dell'inizializzazione della SPA, probabile
  comportamento inatteso (schermata vuota, fuori dall'app, o redirect a login).
  Riguarda **tutta** la navigazione trainer (non solo il wizard), e va verificato se lo
  stesso vale per le altre viste per ruolo (client/org_admin/super_admin — ciascuna ha
  probabilmente un proprio hook di navigazione da controllare separatamente).
- **Perché non tentato ora:** sincronizzare stato di navigazione React con
  `history.pushState`/`popstate` è un cambio strutturale che tocca più hook di
  navigazione per ruolo, non un singolo file — rischio di regressioni su un
  comportamento (navigazione interna) usato costantemente da ogni ruolo, e
  **impossibile da verificare dal vivo** in questo momento (STORY-016 bloccata, nessun
  device). Serve uno scoping Tech Lead prima di procedere, per lo stesso principio già
  applicato altrove in questo backlog ("non costruire quello che non è stato capito").
- **Tech Lead review (2026-09-15) — vedi `docs/DECISIONS.md` → ADR-005:** confermato
  che il gap è sistemico su tutti e 4 i ruoli (nessuna asimmetria — trainer/org_admin
  condividono `useTrainerNav.js`, `SuperAdminView.jsx` e `ClientDashboardPage.jsx`
  hanno lo stesso pattern `useState`-only), ed è invisibile su web perché
  `useNativeBackButton()` è no-op fuori da Capacitor. Affinamento importante: il
  sintomo dominante non è "atterra su una schermata stale" (richiede `canGoBack ===
  true`, verificato quasi sempre `false` in pratica, dato che l'app naviga solo via
  4 redirect `replace`) ma "**il back minimizza sempre l'app**", anche dentro al
  wizard nuovo cliente o dentro alle viste di dettaglio (Client/Gruppo/Ricorrenza/Org)
  dove esiste già un back-affordance visibile nell'header.
  **Decisione:** generalizzare lo stack già in produzione (`hooks/useModalStack.js`,
  STORY-026) da "modal aperti" a "azioni indietro" generiche, eliminare del tutto
  `canGoBack`/`window.history.back()` (fallback sempre `App.minimizeApp()` quando lo
  stack è vuoto — sicuro da spedire senza device, per costruzione mai peggiore di
  oggi), poi registrare sullo stack i back-affordance **già esistenti e già
  shippati** (`useTrainerNav` → `deselectClient`, `GroupDetailView`/
  `RecurrenceDetailView` → prop `onBack`, `SuperAdminView` → `setSelectedOrg(null)`,
  `NewClientView`/`useWizard` → `onBack` dell'header, `ClientDashboardPage` →
  `setActiveTab('home')`) — nessuna nuova semantica UX inventata, solo mirror di
  bottoni già a schermo. Stima ~8 file, modifiche isolate e additive.
  **Esplicitamente fuori scope, serve Product/UX**: il back tra pagine di primo
  livello "sorelle" (senza gerarchia, es. trainer Dashboard↔Clienti↔Gruppi, o le
  sezioni del Pentagon Hub client) — nessun affordance visibile da imitare lì.
  Raccomandazione tecnica di default ("minimizza", zero-cost, coerente con
  convenzione Android bottom-nav) ma non è una decisione unilaterale valida per
  chiudere la story del tutto.
- **Implementato (2026-09-15), stesso giorno dello scoping:** entrambe le wave fatte
  in un'unica sessione, esattamente lo scope stimato (8 file):
  - `hooks/useModalStack.js` — API rinominate (`pushBackAction`/
    `triggerTopBackAction`/`hasBackAction`), nuovo `useViewBackButton(onBack)` per
    viste non modali (onBack condizionale: `null` disattiva la registrazione senza
    smontare il componente — usato per i 4 casi condizionali sotto)
  - `hooks/useNativeBackButton.js` — `canGoBack`/`window.history.back()` rimossi del
    tutto, fallback sempre `App.minimizeApp()`
  - `useTrainerNav.js` → registra `deselectClient` quando `selectedClient` è settato
    (copre sia trainer che org_admin, hook condiviso)
  - `GroupDetailView.jsx` / `RecurrenceDetailView.jsx` → registrano il prop `onBack`
    già ricevuto (sempre attivo, mirror del chevron-back in header)
  - `SuperAdminView.jsx` → registra `() => setSelectedOrg(null)` quando `selectedOrg`
    è settato
  - `NewClientView.jsx` → registra `onBack` (sempre attivo, stesso handler del
    chevron-back — corretto anche il gap che lo stesso `onBack` viene già usato da un
    `ConfirmDialog` step finale: essendo lo stack LIFO, il `ConfirmDialog` (montato
    dopo) prende correttamente precedenza se aperto)
  - `ClientDashboardPage.jsx` → registra `() => setActiveTab('home')` quando
    `activeTab !== 'home'` (Pentagon Hub)
  - Verificato lint/build/`vitest run` dopo l'implementazione (211/211 test, 9
    warning preesistenti invariati — un warning `exhaustive-deps` temporaneo emerso
    e risolto estraendo `isActive` come variabile nominata, non con un
    eslint-disable)
- **Status:** DONE (wave 1 + wave 2 di codice) — **non verificato su device reale**,
  stesso limite già noto per STORY-026 (nessun modo di simulare l'evento `backButton`
  di Capacitor fuori da una WebView Android vera). La domanda su Product/UX per la
  semantica top-level "sorelle" resta esplicitamente aperta e non bloccante (default
  tecnico: minimizza, zero-cost) — non una decisione presa a priori da questo
  processo.

### [STORY-026] Fix — back button nativo può chiudere modal senza conferma
**Come** utente mobile **voglio** che il tasto back Android non distrugga silenziosamente
un modal aperto (es. `ConfirmDialog` "elimina cliente" in attesa) **per** non perdere
stato/dati senza preavviso. **Nota storica:** il wizard nuovo cliente citato nella
versione originale di questa story non era coperto dal fix di questa story (è una
pagina intera, non un modal) — il problema architetturale più ampio scoperto
verificandolo è stato promosso a STORY-028, **poi risolto** nella stessa sessione
(vedi sotto): il wizard è ora coperto tramite `useViewBackButton`, non tramite lo
stack modal di questa story.
- **Priority:** P0
- **Trovato da:** STORY-025 (audit UX superfici mobile-native, code-level, Sprint #9,
  2026-09-15)
- **Dettaglio:** `src/hooks/useNativeBackButton.js` chiama sempre `history.back()` o
  `App.minimizeApp()`, senza mai controllare se un `Modal`/`ConfirmDialog` è aperto
  sopra la pagina corrente — `Modal`/`ConfirmDialog` sono puro stato React, zero
  `history.pushState` in `components/ui`/`components/common` (verificato via grep).
  Se esiste history SPA precedente, il back button naviga via la pagina sottostante
  portando con sé qualunque modal aperto — perdita silenziosa dello stato, nessun
  avviso. Se non c'è history, l'app va in background lasciando il modal orfano al
  rientro.
- **Fix proposto:** l'hook deve poter sapere se un modal è aperto (es. contatore/ref
  globale incrementato al mount da `Modal`, in `components/ui/index.jsx`) e in quel
  caso chiamare l'`onClose` del modal invece di `history.back()`/`minimizeApp()`.
- **Acceptance Criteria:**
  - [ ] Meccanismo di tracking "modal aperto" in `Modal` (componente condiviso)
  - [ ] `useNativeBackButton.js` consulta il tracking prima di navigare/minimizzare
  - [ ] Verificato che `ConfirmDialog`/wizard multi-step si chiudano correttamente col
        back button invece di navigare via la pagina sottostante
- **Dependencies:** nessuna — implementata più tardi nella stessa sessione, dopo che
  l'agente concorrente (STORY-023) ha rilasciato `components/ui/index.jsx`
- **Sprint #9 (2026-09-15):** implementato un piccolo stack condiviso
  (`hooks/useModalStack.js` — `pushModalClose`/`closeTopModal`/`hasOpenModal`),
  registrato da `Modal` (components/ui) e `ConfirmDialog` (components/common) al
  mount/unmount; `useNativeBackButton.js` consulta lo stack prima di
  navigare/minimizzare. **Scope volutamente parziale (wave 1)**: solo i dialog che
  passano dai due primitivi condivisi sono coperti. Verificando l'estensione reale è
  emerso che diversi dialog "bespoke" più vecchi — `CloseSessionModal.jsx`,
  `RecurrenceModal.jsx`, `SlotPopup.jsx`, `GroupToggleDialog.jsx` — reimplementano il
  proprio overlay+Escape invece di usare `Modal`/`ConfirmDialog` (stesso debito già
  noto: CLAUDE.md P2.1/P2.2 documentano che solo `AddSlotModal`/`CreateOrgForm`/
  `CreateMemberForm` sono stati migrati al primitivo condiviso, non tutti) — questi
  restano **fuori dalla protezione** del back button. Non estesa in questa sessione per
  rischio/tempo (richiederebbe toccare 4+ file bespoke senza possibilità di test dal
  vivo, STORY-016 resta bloccata). **Non verificato su device reale** — solo lettura di
  codice + `npm run lint`/`build`/`test:run` (211/211 verdi, nessuna regressione).
  **Correzione post-code-review (2026-09-15):** la claim iniziale copriva anche "wizard
  nuovo cliente" (l'esempio motivante del finding originale) — **falso, verificato**:
  `NewClientView.jsx` è una pagina intera (`min-h-screen`), non un `Modal`/
  `ConfirmDialog` — mostra un `ConfirmDialog` solo nell'ultimo step (conferma submit),
  gli step di raccolta dati non sono avvolti in nulla che registri sullo stack. Il
  wizard resta scoperto dal fix. Causa più profonda trovata verificando questo:
  `useTrainerNav.js` gestisce la navigazione tra pagine trainer (dashboard↔clienti↔
  wizard↔gruppi↔...) con puro `useState`, **zero `history.pushState`** — quindi
  `window.history.back()` nel fallback dell'hook back-button non torna "indietro di
  una pagina" nell'app, ma alla pagina reale precedente al caricamento della SPA
  (probabilmente fuori dall'app, es. login o schermata vuota) — un problema
  architetturale più ampio di questa story, che riguarda TUTTA la navigazione interna
  trainer, non solo il wizard. Promosso a STORY-028 (Tech Lead review, non tentato alla
  cieca senza device per verificarlo). **Status:** DONE (wave 1, solo dialog
  Modal/ConfirmDialog) — la claim "copre il wizard" è stata rimossa, non era vera

### [STORY-025] Audit UX delle superfici mobile-native
**Come** utente dell'app mobile **voglio** che le schermate aggiunte dal contenitore
nativo (offline/errore, back button, banner stampa) siano coerenti con il design system
RankEX **per** non avere un'esperienza visivamente scollegata dal resto dell'app —
superficie mai esistita durante l'audit Art Direction, quindi mai rivista.
- **Priority:** P2
- **Acceptance Criteria:**
  - [ ] Overlay offline/errore nativo (Android `BridgeWebViewClient`, iOS
        `NWPathMonitor`) rivisto contro palette/tipografia (`#07090e`, Montserrat/Inter,
        elevation L0-L4) — oggi scritto senza passare da `ux-ui-designer`
  - [ ] Comportamento back button (`useNativeBackButton.js`) verificato per non creare
        stati UI inattesi (es. modal aperti, wizard multi-step)
  - [ ] Bridge print: nessuna UI propria da rivedere (delega al dialogo nativo di stampa
        del sistema operativo), ma verificare che il trigger `onExport` non lasci stati
        di caricamento orfani se l'utente annulla
- **Dependencies:** STORY-016 (serve poter vedere le schermate dal vivo, non solo
  leggere il codice, per un giudizio Art Direction reale)
- **Risks:** basso — è un audit, non un cambio di comportamento
- **Sprint #9 (2026-09-15):** audit code-level completato (nessun device disponibile,
  come da rischio noto). 4 finding:
  - **CRITICA** — back button nativo può chiudere modal/wizard senza conferma →
    promossa a STORY-026 (fix rimandato, collisione file con agente concorrente)
  - **ALTA** — bottone "ESPORTA PDF" senza stato pending, rischio doppio tap sul
    bridge nativo asincrono → **fixato**: nuovo hook condiviso `usePrintTrigger()` in
    `components/common/reportPrintKit.jsx` (disabilita il bottone ~1s dopo il click,
    label "IN CORSO…"), adottato da `ClientReportPrint.jsx` e `GroupReportPrint.jsx`
  - **MEDIA** — bottone RIPROVA nativo (schermata offline) non rispetta lo stile
    `.rx-btn-primary` reale (fill pieno nero-su-verde invece di outline/tinta) →
    **fixato**: Android, nuovo drawable `res/drawable/bg_retry_button.xml` (tinta 7% +
    bordo 35% sull'accent, non più `backgroundTint` pieno) applicato in
    `view_connection_error.xml`; iOS, stessa tinta/bordo via `layer.borderWidth`/
    `borderColor` in `RankexBridgeViewController.swift`. **iOS non verificato** (nessun
    macOS in questo ambiente, stesso limite già noto per l'intero progetto iOS)
  - **MEDIA** (bassa urgenza) — nessuna superficie nativa usa Montserrat/Inter (overlay
    offline, icon/splash placeholder) → non fixato, già marcato TODO in
    `mobile-app/docs/MOBILE-APP.md` per l'artwork definitivo (STORY-019)
  - **Verifica positiva**: palette icon/splash placeholder confermata corretta
    (`#07090e`/`#1dff6b`/`#2ecfff`, glow verde coincidente col vero
    `--rx-gradient-accent`) — la claim di `MOBILE-APP.md` era vera, non solo dichiarata.
  **Status:** DONE (audit + 2 dei 4 fix applicati)

---
<!-- Nuove epic/user story vengono aggiunte qui sotto dal Product Owner -->
