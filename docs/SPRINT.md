# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

**Goal:** _(non ancora aperto)_

**Story selezionate:** _—_

**Status board:**

| Task | Status | Note |
|------|--------|------|
| _—_  | _—_    | _—_  |

**Blockers:** _—_

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) erano **già implementate**
prima di aprire i rispettivi sprint. EPIC-005 (Avatar + Negozio) è stata scoperta
(Sprint #3, raccomandazione di non procedere) ma l'utente ha scelto comunque uno spike
tecnico ridotto (Sprint #4, STORY-014, override esplicito — vedi ADR-003), deployato
su prod. TD-001/TD-002 risolti. EPIC-002 chiusa (Sprint #5). EPIC-007/008/009
(Mobile Store Readiness, Privacy & Compliance, UX/UI debito residuo) eseguite in un
unico sprint reale (Sprint #6, chiuso 2026-09-15) — commit `852d917` pushato su
`feature/mobile-app`, non ancora in `main`/deploy.

**2026-09-15 — verifica preliminare fatta prima di proporre questo piano:** la memoria
di sessione sull'audit Art Direction (lug 2026) segnalava "nessun commit fatto" — prima
di costruire EPIC-009 su quella base è stato verificato che il lavoro è realmente nel
codice (`--rx-accent` presente in `src/index.css`, `--rx-green` assente, commit
`fd8f5f8` + 2 fix successivi `1ac76a4`/`e5d2a33`) — non un rischio di lavoro perso,
solo la memoria di sessione non aggiornata dopo il commit.

**Candidati aperti (dopo la chiusura di Sprint #6 e #7, vedi storico sotto):**
- **SPRINT #8 (sotto) — Mobile: iOS + push end-to-end** — bloccato su risorse esterne
  (macOS/Xcode, iscrizione Apple Developer Program)
- **STORY-016** — verifica manuale su device Android reale, tuttora bloccata (nessun
  device/emulatore disponibile in questo ambiente) — ora ancora più prioritaria: sia
  STORY-026 che STORY-028 hanno modifiche al back button mai verificate dal vivo
- **STORY-022 (parte residua)** — trascrizione effettiva nei Console Play/App Store
  (la bozza contenuti è pronta, manca solo l'azione nei rispettivi portali)
- **STORY-027** — fix concordanza di genere in `GroupsPage.jsx` (P3, cosmetico)
- **STORY-026 wave 2** — estendere la protezione back-button ai dialog "bespoke"
  (`CloseSessionModal`, `RecurrenceModal`, `SlotPopup`, `GroupToggleDialog`) — non
  toccata da STORY-028, resta uno scope separato
- **Domanda Product/UX aperta (da ADR-005)** — semantica del back button tra pagine di
  primo livello "sorelle" senza gerarchia (nav principale trainer, sezioni Pentagon
  Hub client) — nessun default tecnico imposto, solo raccomandato ("minimizza")
- EPIC-005 completa — Avatar + Negozio, resta bloccata sulle stesse dipendenze esterne
  di sempre (asset grafici, bilanciamento economia, flusso B2B).

### SPRINT #8 (proposto) — Mobile: iOS + push end-to-end — bloccato su risorse esterne
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

### SPRINT #8 — Back button wave 2 + fix concordanza genere (STORY-026/027) — chiuso il 2026-09-15

**Goal:** dopo la chiusura di Sprint #7, l'utente ha chiesto esplicitamente "cosa
possiamo fare" in attesa dei controlli su device — proposti STORY-026 wave 2 (dialog
bespoke non ancora protetti dal back button) e STORY-027 (fix genere cosmetico),
entrambi confermati dall'utente ("Entrambe").

**Completato:**
- STORY-026 wave 2 — i 4 dialog bespoke nominati nel gap originale
  (`CloseSessionModal.jsx`, `RecurrenceModal.jsx`, `SlotPopup.jsx`,
  `GroupToggleDialog.jsx`) ora registrano `useModalBackButton(onClose)`. **Trovato un
  5° dialog bespoke non nominato**, `client-dashboard/DeleteDialog.jsx` (conferma
  eliminazione cliente, azione irreversibile) — incluso per coerenza, sarebbe stato
  il gap più grave da lasciare aperto. **Trovati ma non inclusi** (pattern UI diverso,
  serve valutazione UX separata): menu overflow "⋮" (`GroupDetailHeader.jsx`,
  `ClientDashboardHeader.jsx`) e il form inline "nuovo gruppo" in `GroupsPage.jsx`.
- STORY-027 — fix concordanza di genere in `GroupsPage.jsx` con la stessa disciplina
  di costruzione invariante già stabilita (P2.9/STORY-024): "Non ci sono ancora
  {groups}" invece di "Nessun {group}", "i tuoi {clients}" invece di "il primo
  {group}... i {clients}". **Trovato un bug gemello altrove**, fixato nello stesso
  giro: `NewClientView.jsx` aveva la stessa elisione mancante (`ai allievi` invece di
  `agli allievi`), risolta con lo stesso trucco (`ai tuoi {clients}`).
- Verificato lint/build/`vitest run` dopo entrambe le fix (211/211 test, 0 errori, 9
  warning preesistenti invariati). Committato e pushato su `feature/mobile-app`.

**Non completato:**
- Verifica su device reale di STORY-026 wave 2 — stesso limite di wave 1, nessun
  device disponibile
- Menu overflow / form inline (vedi sopra) — non nello scope richiesto, candidati per
  un'eventuale wave 3 se si decide che meritano lo stesso trattamento

**Blockers:** nessuno per l'implementazione — solo la verifica dal vivo resta
bloccata su STORY-016.

**Tech debt emerso:** nessuno nuovo — i 2 gap trovati (menu overflow/form inline,
bug gemello NewClientView) sono stati o fixati subito (il bug gemello) o documentati
esplicitamente come fuori scope (i menu), non lasciati impliciti.

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file —
nessun item azionabile senza risorse esterne al momento della chiusura.

---

### SPRINT #7 — Back button: navigazione senza history reale (STORY-028) — chiuso il 2026-09-15

**Goal:** scoping tecnico + implementazione di STORY-028, unico candidato azionabile
dopo la chiusura di Sprint #6 (STORY-016 resta bloccata su device). Continuazione
diretta della stessa sessione, su indicazione dell'utente ("vai").

**Completato:**
- Scoping (Tech Lead, subagent in background) → **ADR-005** in `docs/DECISIONS.md`.
  Verificato file per file (non assunto): gap sistemico su tutti e 4 i ruoli, stesso
  pattern `useState`-only ovunque. Affinamento importante: il ramo pericoloso
  `window.history.back()` è quasi certamente dead code (`canGoBack` sempre `false` in
  pratica) — il sintomo reale è "il back minimizza sempre l'app", anche dentro wizard
  o viste di dettaglio con un back-affordance già visibile in header.
- Implementazione (stessa sessione, subito dopo lo scoping): generalizzato
  `hooks/useModalStack.js` da "modal aperti" a "azioni indietro" generiche
  (`pushBackAction`/`triggerTopBackAction`/`hasBackAction` + nuovo
  `useViewBackButton`), rimosso del tutto `canGoBack`/`window.history.back()` da
  `useNativeBackButton.js` (fallback sempre `minimizeApp`), registrati i 6
  back-affordance già esistenti (`useTrainerNav`, `GroupDetailView`,
  `RecurrenceDetailView`, `SuperAdminView`, `NewClientView`, `ClientDashboardPage`) —
  esattamente gli 8 file stimati dall'ADR. Corretta la nota in STORY-026 che dichiarava
  il wizard "non coperto" (ora lo è, tramite `useViewBackButton`, non tramite lo stack
  modal).
- Verificato lint/build/`vitest run` (211/211 test, 0 errori, 9 warning preesistenti
  invariati — un warning `exhaustive-deps` temporaneo risolto estraendo una variabile
  nominata invece di un eslint-disable).

**Non completato:**
- Verifica su device reale — stesso limite di STORY-026, nessun modo di simulare
  l'evento `backButton` di Capacitor fuori da una WebView Android vera
- Wave 2 di STORY-026 (dialog bespoke: CloseSessionModal/RecurrenceModal/SlotPopup/
  GroupToggleDialog) — scope separato, non toccato qui
- Domanda Product/UX sulla semantica back tra pagine "sorelle" di primo livello —
  esplicitamente lasciata aperta dall'ADR-005, non decisa unilateralmente

**Blockers:** nessuno per lo scoping/implementazione (solo lettura/analisi + modifiche
isolate); la verifica dal vivo resta bloccata su STORY-016 (nessun device)

**Tech debt emerso:** nessuno nuovo — ADR-005 documenta esplicitamente 2 alternative
scartate (history reale, wrapper di compatibilità) con le ragioni, non lasciate come
domande aperte

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file —
nessun altro item azionabile senza risorse esterne (device, macOS, artwork, legale) al
momento della chiusura di questo sprint.

---

### SPRINT #6 — Privacy + Mobile signing + UX/UI debito residuo — chiuso il 2026-09-15

**Goal:** eseguire in sequenza gli sprint #6-#9 del piano proposto (Privacy → Mobile
signing → UX/UI debito residuo → verifica manuale/Data Safety), su richiesta esplicita
dell'utente ("procedi con gli sprint fino a termine token") — sessione unica, senza
chiusura formale tra un sotto-sprint e l'altro. Numerato #6 nello storico (i sotto-sprint
proposti #6-#9 sono confluiti in un solo sprint reale).

**Completato:**
- STORY-020 — bozza tecnica Privacy Policy (`docs/PRIVACY-POLICY-DRAFT.md`), incluso il
  punto non ovvio che RankEX B2B multi-tenant implica un modello Titolare(org)/
  Responsabile(RankEX), non solo una policy generica
- STORY-021 — scoping processo di cancellazione dati (ADR-004, manuale via supporto).
  **Finding non previsto**: verificando se gli strumenti esistenti bastassero è emerso
  che `eliminaCliente` lasciava orfane le subcollection `notes`/`goals` in Firestore —
  loggato BUG-001, fixato (`db.recursiveDelete`)
- STORY-015 — scaffolding signing Android in `build.gradle`, condizionale sul keystore
  reale, nessuna password hardcoded; `assembleDebug` verificato ancora BUILD SUCCESSFUL
- STORY-022 — contenuto Data Safety (Play) + Nutrition Label (Apple) aggiornato in
  `mobile-app/docs/MOBILE-APP.md`; trascrizione nei Console resta un'azione utente
- STORY-023 — sweep completo pattern `color+'NN'` → `color-mix()`: 34 file, 127
  occorrenze, eseguito da subagent developer in background
- STORY-024 — terminologia multi-modulo wave 2 su `groups-page/`: 10 file, eseguito da
  un secondo subagent developer in parallelo. Trovato+loggato STORY-027 (bug di
  concordanza di genere in `GroupsPage.jsx`, fuori scope, non corretto)
- STORY-025 — audit UX code-level delle superfici mobile-native (subagent
  ux-ui-designer): 4 finding, 3 fixati nella stessa sessione (doppio tap su export PDF,
  stile bottone RIPROVA Android+iOS, back button che non chiudeva i modal), 1 rimandato
  per bassa urgenza (font nativi non Montserrat/Inter, già TODO su artwork STORY-019)
- STORY-026 (wave 1) — nuovo `useModalStack.js`, wired in `Modal`/`ConfirmDialog`, per
  far chiudere il dialog aperto al back button Android invece di navigare/minimizzare
- TD-003 — rimosso codice morto trovato durante il lavoro sopra: `SlotCard.jsx`,
  `CalendarSidebar.jsx` (conteneva una copia di SlotCard, non una sidebar),
  `GroupsSidebar.jsx` — zero importer confermato per tutti e tre. Corretto anche un
  riferimento in CLAUDE.md a un badge "Streak N" mai realmente raggiungibile
- **Code review finale su tutto il diff (59 file)** prima di committare — verdetto
  CHANGES REQUESTED, risolto nella stessa sessione:
  - CRITICAL: il fix di BUG-001 aveva l'ordine sbagliato (`recursiveDelete` dopo il
    batch) — un retry manuale dopo un fallimento parziale avrebbe decrementato
    `clientCount` due volte, aggirando silenziosamente il limite piano. Riordinato
    (recursiveDelete prima del batch — fail-safe invece di fail-unsafe, non è comunque
    atomico al 100%, va ripensato con un marker di stato se serve garanzia più forte)
  - HIGH: la claim che STORY-026 coprisse "il wizard nuovo cliente" era falsa
    (`NewClientView.jsx` è una pagina intera, non un modal) — verificandolo è emerso un
    problema più ampio, **la navigazione interna trainer non usa `history.pushState`
    reale**, promosso a STORY-028 (Tech Lead review, non tentato alla cieca)
  - 5 fix minori (try/finally su `usePrintTrigger`, stack modal ref-based invece che
    per-render, 2 righe di doc obsolete, un nit di formulazione italiana)
- Verificato ripetutamente lint/build/`vitest run` dopo ogni fase (211/211 test) +
  `node --check` sulla Cloud Function toccata
- **Commit** `852d917` (63 file) e **push** — primo push di questo branch
  (`feature/mobile-app`) su `origin`, upstream impostato, PR apribile su GitHub (non
  aperta in questa sessione)

**Non completato:**
- STORY-016 — verifica manuale su device reale: bloccata strutturalmente (nessun
  device/emulatore disponibile, RAM insufficiente per un AVD in questo ambiente)
- STORY-018/STORY-017 (iOS) — bloccate su accesso a un Mac con Xcode 15+
- STORY-019 — artwork icona/splash definitivo: bloccato su un asset grafico inesistente
- STORY-022 — trascrizione effettiva nei Console Play/App Store: azione utente, non
  lavoro di sviluppo residuo
- STORY-027 (bug genere `GroupsPage.jsx`) e STORY-026 wave 2 (dialog bespoke): loggati,
  non presi in questo sprint
- Deploy della Cloud Function `eliminaCliente` corretta: **non fatto** — resta da
  verificare contro l'emulatore/rankex-dev prima di qualunque deploy (nessun harness di
  test esiste oggi per le callable)

**Blockers:**
- Nessun device Android/iOS fisico, nessun macOS/Xcode, nessun artwork ufficiale,
  nessuna decisione legale sulla privacy policy — tutti esterni al processo di sviluppo

**Tech debt emerso:**
- TD-003 risolto nella stessa sessione (vedi sopra)
- STORY-027 (P3, cosmetico) e STORY-028 (P1, architetturale — richiede scoping Tech
  Lead) aggiunti a `docs/BACKLOG.md`, non risolti
- Fix di BUG-001 (`eliminaCliente`) non ancora verificato contro un ambiente reale —
  rischio noto e documentato, non nascosto

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file —
STORY-028 (Tech Lead review) e STORY-016 (appena un device sarà disponibile) sono i
candidati con priorità più alta; Sprint iOS resta bloccato su macOS.

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
