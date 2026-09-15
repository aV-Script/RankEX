# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

**Goal:** eseguire in sequenza gli sprint #6-#9 del piano proposto (Privacy →
Mobile signing → UX/UI debito residuo → verifica manuale/Data Safety), su richiesta
esplicita dell'utente ("procedi con gli sprint fino a termine token") — sessione unica,
senza chiusura formale tra uno sprint e l'altro.

**Story selezionate:** STORY-020, STORY-021 (Sprint #6) · STORY-015 (Sprint #7) ·
STORY-023, STORY-024 (Sprint #8) · STORY-025 parziale (Sprint #9, code-level)

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-020 — bozza Privacy Policy | DONE | `docs/PRIVACY-POLICY-DRAFT.md` scritto |
| STORY-021 — scoping cancellazione dati | DONE | ADR-004; BUG-001 trovato e fixato (non deployato) |
| STORY-015 — Android signing scaffold | DONE (scaffold) | `build.gradle` condizionale su keystore reale; verificato `assembleDebug` ancora BUILD SUCCESSFUL |
| STORY-023 — sweep `color+'NN'` (35 file) | DONE | 34 file, 127 occorrenze, lint/build/test verdi. Trovato+loggato TD-003 (SlotCard/CalendarSidebar duplicati) |
| TD-003 — SlotCard/CalendarSidebar/GroupsSidebar dead code | RESOLVED | 3 file rimossi (zero import confermato), CLAUDE.md corretto (incl. claim errata badge Streak) |
| STORY-025 fix P1 (doppio tap PDF) + P2 (bottone RIPROVA) | DONE | eseguiti direttamente, non delegati — nessuna collisione file con gli agenti |
| Verifica consolidata (lint+build+test, tutto il lavoro Sprint #8+#9) | DONE | 0 errori lint, build ok, 211/211 test |
| STORY-026 — back button non chiude modal (wave 1) | DONE | `useModalStack.js` nuovo, wired in `Modal`/`ConfirmDialog`; dialog bespoke (CloseSessionModal/RecurrenceModal/SlotPopup) restano fuori scope, wave 2 da pianificare |
| Code review sessione completa (59 file) | DONE | verdetto CHANGES REQUESTED — 1 CRITICAL + 1 HIGH, entrambi fixati (vedi sotto) |
| Fix CRITICAL — doppio decremento clientCount su retry parziale | DONE | `eliminaCliente.js`: `recursiveDelete` spostato prima del batch invece che dopo |
| Fix HIGH — claim STORY-026 sul wizard era falsa | DONE | claim corretta, causa profonda (navigazione trainer senza history reale) promossa a STORY-028 |
| Fix raccomandati (non bloccanti) | DONE | try/finally su `usePrintTrigger`, stack modal ref-based, doc obsolete corrette (runbook.config.js, MOBILE-APP.md), nit copy GroupLeaderboard |
| Verifica finale (lint+build+test+node --check functions) | DONE | 0 errori, build ok, 211/211 test, sintassi functions OK |
| STORY-024 — terminologia wave 2 groups-page | DONE | 10 file, lint/build/test verdi (211/211). Trovato+loggato STORY-027 (bug genere in GroupsPage.jsx, fuori scope) |
| STORY-025 — audit UX superfici mobile-native | IN PROGRESS | delegato a subagent ux-ui-designer in background (solo code-level, nessun device disponibile) |
| STORY-016 — verifica manuale device | BLOCKED | nessun device/emulatore disponibile in questo ambiente — non tentato |
| STORY-022 — Data Safety / Nutrition Label | NOT STARTED | dipende dall'esito di STORY-021 (fatto) — da compilare |

**Blockers:**
- STORY-016 bloccata strutturalmente (RAM insufficiente per un AVD in questo ambiente,
  nessun device fisico collegato)
- STORY-021/BUG-001: fix scritto ma **non verificato** contro emulatore/rankex-dev —
  nessun harness di test esiste oggi per le callable (`functions/` non ha script di
  test, solo `test:rules` per le sole Firestore rules) — verifica rimandata

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) erano **già implementate**
prima di aprire i rispettivi sprint. EPIC-005 (Avatar + Negozio) è stata scoperta
(Sprint #3, raccomandazione di non procedere) ma l'utente ha scelto comunque uno spike
tecnico ridotto (Sprint #4, STORY-014, override esplicito — vedi ADR-003), deployato
su prod. TD-001/TD-002 risolti. EPIC-002 chiusa (Sprint #5).

**2026-09-15 — verifica preliminare fatta prima di proporre questo piano:** la memoria
di sessione sull'audit Art Direction (lug 2026) segnalava "nessun commit fatto" — prima
di costruire EPIC-009 su quella base è stato verificato che il lavoro è realmente nel
codice (`--rx-accent` presente in `src/index.css`, `--rx-green` assente, commit
`fd8f5f8` + 2 fix successivi `1ac76a4`/`e5d2a33`) — non un rischio di lavoro perso,
solo la memoria di sessione non aggiornata dopo il commit.

**Candidati aperti — 3 nuove epic da `docs/BACKLOG.md`, sequenza proposta sotto:**
- **EPIC-007 — Mobile App: Store Readiness** (STORY-015→019)
- **EPIC-008 — Privacy & Compliance** (STORY-020→022)
- **EPIC-009 — UX/UI: debito residuo audit + superfici mobile-native** (STORY-023→025)
- EPIC-005 completa — Avatar + Negozio, resta bloccata sulle stesse dipendenze esterne
  di sempre (asset grafici, bilanciamento economia, flusso B2B) — non tocca né è
  toccata dalle 3 epic sopra, può essere ripresa in qualunque momento se le domande
  aperte trovano risposta.

### Perché questo ordine (non solo priorità dichiarata nel backlog)
La sequenza non segue la numerazione delle epic ma **cosa è eseguibile subito senza
bloccarsi su una risorsa esterna** (device fisico, macOS, artwork, decisione legale) —
stesso criterio già usato negli sprint passati. Diversi item P1/P2 nel backlog sono
**bloccati strutturalmente** (STORY-018/019, parte di STORY-017) e vengono deliberatamente
posticipati agli ultimi sprint invece di bloccare l'intero piano.

### SPRINT #6 (proposto) — Privacy: bozza + scoping (nessuna dipendenza esterna)
**Goal:** sbloccare i due item che oggi impediscono qualunque submission store,
portandoli al punto massimo raggiungibile senza input legale/aziendale esterno.
- STORY-020 — bozza tecnica Privacy Policy (contenuto derivabile dai dati già
  verificati nel codice) + lista esplicita delle decisioni non tecniche da chiedere
  all'utente (titolare trattamento, DPO, retention)
- STORY-021 — scoping processo di cancellazione dati: valutare se il processo manuale
  (supporto → super_admin, strumenti già esistenti) basta, o serve un flusso
  self-service nuovo
- **Non incluso:** revisione legale finale della Privacy Policy — non delegabile al
  developer, resta un blocker esterno per la pubblicazione effettiva

### SPRINT #7 (proposto) — Mobile: signing Android + appId (nessuna dipendenza esterna)
**Goal:** portare la build Android da "compila in debug" a "pronta per essere firmata",
azione tecnica pura con solo 2 decisioni rapide richieste all'utente.
- STORY-015 — conferma `appId`, generazione keystore, `signingConfigs` in
  `build.gradle`, verifica `./gradlew bundleRelease`
- **Dependency inversa:** STORY-022 (Data Safety form) userà l'output di STORY-021 dello
  sprint precedente — ordine Privacy prima di Mobile signing non è casuale

### SPRINT #8 (proposto) — UX/UI: debito residuo (nessuna dipendenza esterna)
**Goal:** chiudere i due item lasciati esplicitamente parziali nell'audit Art Direction
di lug 2026, prima che il codice attorno si sposti ulteriormente.
- STORY-023 — sweep completo pattern `color+'NN'` (31 file)
- STORY-024 — terminologia multi-modulo wave 2 su `groups-page/` (11 file)
- **Non incluso:** STORY-025 (audit superfici mobile-native) — dipende da poter vedere
  le schermate dal vivo, quindi rimandato a dopo Sprint #9 (verifica manuale device)

### SPRINT #9 (proposto) — Mobile: verifica manuale + submission Android
**Goal:** primo giro di verifica reale su device, mai fatto finora, e compilazione dei
form privacy che ne dipendono.
- STORY-016 — checklist manuale completa su device/emulatore Android reale
  (**blocker potenziale**: l'ambiente di sviluppo attuale non riesce ad avviare un AVD
  per RAM insufficiente — serve un device fisico o un ambiente diverso)
- STORY-022 — Data Safety form (Play), usando l'output di STORY-021
- STORY-025 — audit UX delle superfici mobile-native, ora visibili dal vivo
- Build AAB firmata finale (output tecnico di STORY-015, eseguito qui a valle della
  verifica manuale, non prima)

### SPRINT #10 (proposto) — Mobile: iOS + push end-to-end — bloccato su risorse esterne
**Goal:** solo se/quando è disponibile un Mac con Xcode 15+ e una decisione
sull'iscrizione Apple Developer Program ($99/anno, dell'utente).
- STORY-018 — build/verifica iOS su Xcode reale
- STORY-017 — push notifications end-to-end (Android via STORY-016, iOS via questo sprint)
- Apple Privacy Nutrition Label (parte rimanente di STORY-022)
- **Non pianificabile in dettaglio finché il blocker (accesso macOS) non si risolve** —
  incluso qui solo per tracciare la dipendenza, non come impegno di sprint concreto

**Fuori sequenza, non assegnato a nessuno sprint (bloccati su risorse non ingegneristiche):**
- STORY-019 — artwork icona/splash definitivo: bloccato su un asset grafico che non
  esiste nel repo, nessuna decisione tecnica lo sblocca
- Revisione legale Privacy Policy (dentro STORY-020): bloccato su decisione
  legale/aziendale dell'utente
- EPIC-005 (Avatar + Negozio): bloccato sulle 3 dipendenze esterne già note (vedi ADR-002)

---

## Storico sprint chiusi

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
